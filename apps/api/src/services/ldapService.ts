// @ts-ignore
import ldap from 'ldapjs';
import { query } from '../database/connection.js';
import crypto from 'crypto';

export interface LdapConfig {
  url: string;
  bindDN: string;
  bindPassword: string;
  searchBase: string;
  searchFilter: string;
  attributeMap: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

function mapAttributes(entry: any, attrMap: LdapConfig['attributeMap']): { email: string; firstName?: string; lastName?: string; externalId: string } {
  const email = entry[attrMap.email] || entry.mail || entry.userPrincipalName;
  const firstName = attrMap.firstName ? entry[attrMap.firstName] : entry.givenName;
  const lastName = attrMap.lastName ? entry[attrMap.lastName] : entry.sn;
  const externalId = entry.dn || email;
  return { email, firstName, lastName, externalId };
}

async function jitProvision(tenantId: string, attrs: ReturnType<typeof mapAttributes>, provider: string): Promise<string> {
  let res = await query(`SELECT id FROM users WHERE external_id = $1 AND provider = $2`, [attrs.externalId, provider]);
  if (res.rows.length > 0) return res.rows[0].id;

  const roleRes = await query(`SELECT id FROM roles WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
  if (roleRes.rows.length === 0) throw new Error('No roles available for tenant');
  const roleId = roleRes.rows[0].id;

  const username = attrs.email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
  res = await query(
    `INSERT INTO users (username, email, first_name, last_name, tenant_id, role_id, external_id, provider, is_active, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW()) RETURNING id`,
    [username, attrs.email, attrs.firstName || null, attrs.lastName || null, tenantId, roleId, attrs.externalId, provider]
  );
  const userId = res.rows[0].id;

  await query(
    `INSERT INTO provisioning_events (user_id, type, at, raw) VALUES ($1,'jit_ldap',NOW(),$2)`,
    [userId, JSON.stringify({ attrs, provider })]
  );

  return userId;
}

export class LdapService {
  private pool: Map<string, any> = new Map();
  private async getClient(url: string, strictTls: boolean) {
    const pooling = (process.env.LDAP_POOLING || 'false').toLowerCase() === 'true';
    const key = url + '|' + String(strictTls);
    if (pooling && this.pool.has(key)) return this.pool.get(key);
    const client = ldap.createClient({ url, timeout: 10000, connectTimeout: 5000, tlsOptions: { rejectUnauthorized: strictTls }, reconnect: pooling });
    if (pooling) this.pool.set(key, client);
    return client;
  }

  private async isLocked(tenantId: string, username: string): Promise<boolean> {
    const threshold = parseInt(process.env.LDAP_LOCKOUT_THRESHOLD || '5', 10);
    if (threshold <= 0) return false;
    const key = `ldap:lock:${tenantId}:${username}`;
    try {
      const { withRedis } = await import('../utils/redis.js');
      return await withRedis(async (r) => { const c = await r.get(key); return c ? parseInt(c,10) >= threshold : false; }, async () => { return (this as any)._memLock?.get(key) >= threshold; });
    } catch { return false; }
  }

  private async recordFailure(tenantId: string, username: string): Promise<void> {
    const windowSec = parseInt(process.env.LDAP_LOCKOUT_WINDOW_SEC || '300', 10);
    const key = `ldap:lock:${tenantId}:${username}`;
    try {
      const { withRedis } = await import('../utils/redis.js');
      await withRedis(async (r) => { const n = await r.incr(key); if (n === 1) await r.expire(key, windowSec); return; }, async () => {
        (this as any)._memLock = (this as any)._memLock || new Map();
        const cur = ((this as any)._memLock.get(key) || 0) + 1; (this as any)._memLock.set(key, cur);
        setTimeout(() => { (this as any)._memLock.delete(key); }, windowSec * 1000);
      });
    } catch {}
  }
  private isEnabled(): boolean { return (process.env.LDAP_ENABLED || 'false').toLowerCase() === 'true'; }

  async login(tenantId: string, config: LdapConfig, username: string, password: string): Promise<{ userId: string; email: string }> {
    if (!this.isEnabled()) throw new Error('LDAP not enabled');

    return new Promise((resolve, reject) => {
      const strictTls = (process.env.LDAP_STRICT_TLS || 'false').toLowerCase() === 'true';
      this.getClient(config.url, strictTls).then((client) => {

      client.bind(config.bindDN, config.bindPassword, (bindErr: any) => {
        if (bindErr) { client.unbind(); return reject(new Error('LDAP bind failed')); }

        // Escape LDAP special characters in username to prevent injection
        const esc = username.replace(/[\\*()\0/]/g, (c) => `\\${c}`);
        const searchFilter = config.searchFilter.replace('{username}', esc);
        const opts = { scope: 'sub', filter: searchFilter };

        client.search(config.searchBase, opts, (searchErr: any, searchRes: any) => {
          if (searchErr) { client.unbind(); return reject(searchErr); }

          let entry: any = null;
          searchRes.on('searchEntry', (e: any) => { entry = e.object; });
          searchRes.on('error', (err: any) => { client.unbind(); reject(err); });
          searchRes.on('end', async () => {
            client.unbind();
            if (!entry) {
              reject(new Error('Invalid credentials'));
              return;
            }
            // Lockout check
            const locked = await this.isLocked(tenantId, username);
            if (locked) { reject(new Error('Account temporarily locked')); return; }

            // Verify user password by attempting bind with user DN
            const userClient = await this.getClient(config.url, strictTls);
            userClient.bind(entry.dn, password, async (userBindErr: any) => {
              userClient.unbind();
              if (userBindErr) {
                await this.recordFailure(tenantId, username);
                try { const { auditService } = await import('./auditService.js'); await auditService.log({ tenantId, action: 'ldap_login_failed', resourceType: 'ldap', details: { reason: 'invalid_credentials', username_hash: crypto.createHash('sha256').update(username).digest('hex') } }); } catch {}
                return reject(new Error('Invalid credentials'));
              }

              try {
                const mapped = mapAttributes(entry, config.attributeMap);
                const userId = await jitProvision(tenantId, mapped, 'ldap');
                try { const { auditService } = await import('./auditService.js'); await auditService.log({ tenantId, action: 'ldap_login_success', resourceType: 'ldap', details: { username_hash: crypto.createHash('sha256').update(username).digest('hex') } }); } catch {}
                resolve({ userId, email: mapped.email });
              } catch (err) { reject(err); }
            });
          });
        });
        }); // end client.bind

      }); // end getClient then
    });
  }
}

export const ldapService = new LdapService();

