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
  private isEnabled(): boolean { return (process.env.LDAP_ENABLED || 'false').toLowerCase() === 'true'; }

  async login(tenantId: string, config: LdapConfig, username: string, password: string): Promise<{ userId: string; email: string }> {
    if (!this.isEnabled()) throw new Error('LDAP not enabled');

    return new Promise((resolve, reject) => {
      const strictTls = (process.env.LDAP_STRICT_TLS || 'false').toLowerCase() === 'true';
      const client = ldap.createClient({ url: config.url, timeout: 10000, connectTimeout: 5000, tlsOptions: { rejectUnauthorized: strictTls } });

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
            if (!entry) return reject(new Error('User not found in LDAP'));

            // Verify user password by attempting bind with user DN
            const userClient = ldap.createClient({ url: config.url, timeout: 10000, connectTimeout: 5000, tlsOptions: { rejectUnauthorized: strictTls } });
            userClient.bind(entry.dn, password, async (userBindErr: any) => {
              userClient.unbind();
              if (userBindErr) return reject(new Error('Invalid credentials'));

              try {
                const mapped = mapAttributes(entry, config.attributeMap);
                const userId = await jitProvision(tenantId, mapped, 'ldap');
                resolve({ userId, email: mapped.email });
              } catch (err) { reject(err); }
            });
          });
        });
      });
    });
  }
}

export const ldapService = new LdapService();

