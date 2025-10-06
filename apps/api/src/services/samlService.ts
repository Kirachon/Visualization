import * as samlify from 'samlify';

// Feature flags (default OFF):
// - SAML_REPLAY_PROTECT: cache recent assertions to prevent replay

import { withRedis } from '../utils/redis.js';
const replayCache: Map<string, number> = new Map();
function cacheKeyFromResponse(resp: string): string {
  // Weak heuristic: hash of response
  return require('crypto').createHash('sha256').update(resp).digest('hex');
}
async function isReplayed(resp: string): Promise<boolean> {
  const enabled = (process.env.SAML_REPLAY_PROTECT || 'false').toLowerCase() === 'true';
  if (!enabled) return false;
  const key = cacheKeyFromResponse(resp);
  const now = Date.now();
  const ttl = 5 * 60_000; // 5 minutes
  const ts = replayCache.get(key);
  if (ts && now - ts < ttl) return true;
  replayCache.set(key, now);
  // Try Redis too
  const redisHit = await withRedis(async (r) => {
    const sKey = `saml:replay:${key}`;
    const exists = await r.exists(sKey);
    if (exists) return true;
    await r.setex(sKey, Math.ceil(ttl/1000), '1');
    return false;
  }, async () => false);
  if (redisHit) return true;
  return false;
}
import { query } from '../database/connection.js';
import crypto from 'crypto';

export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  privateKey?: string;
  callbackUrl: string;
}

function mapAttributes(attributes: any): { email: string; firstName?: string; lastName?: string; externalId: string } {
  const email = attributes.email || attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || attributes.nameID;
  const firstName = attributes.firstName || attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];
  const lastName = attributes.lastName || attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];
  const externalId = attributes.nameID || attributes.subject || email;
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
    `INSERT INTO provisioning_events (user_id, type, at, raw) VALUES ($1,'jit_saml',NOW(),$2)`,
    [userId, JSON.stringify({ attrs, provider })]
  );

  return userId;
}



export class SamlService {
  private isEnabled(): boolean { return (process.env.SAML_ENABLED || 'false').toLowerCase() === 'true'; }

  async handleACS(tenantId: string, config: SamlConfig, samlResponse: string): Promise<{ userId: string; email: string }> {
    if (!this.isEnabled()) throw new Error('SAML not enabled');
    if (await isReplayed(samlResponse)) throw new Error('SAML response replay detected');
    try { await this.validateStrict(config, samlResponse); } catch (e:any) {
      try { const { auditService } = await import('./auditService.js'); await auditService.log({ tenantId, action: 'saml_acs_failure', resourceType: 'saml', details: { reason: e?.message || 'strict validation failed' } }); } catch {}
      throw e;
    }
    await this.cacheIdpMetadata(tenantId, config);

    const sp = samlify.ServiceProvider({
      entityID: config.issuer,
      assertionConsumerService: [{ Binding: samlify.Constants.namespace.binding.post, Location: config.callbackUrl }],
      privateKey: config.privateKey,
    });

    const idp = samlify.IdentityProvider({
      entityID: config.entryPoint,
      singleSignOnService: [{ Binding: samlify.Constants.namespace.binding.redirect, Location: config.entryPoint }],
      signingCert: config.cert,
    });

    const parseResult = await sp.parseLoginResponse(idp, 'post', { body: { SAMLResponse: samlResponse } });
    const extract = parseResult.extract;
    const attributes = extract.attributes || {};


    const nameID = extract.nameID || '';

    const mapped = mapAttributes({ ...attributes, nameID });
    const userId = await jitProvision(tenantId, mapped, 'saml');
    return { userId, email: mapped.email };
  }

  private async validateStrict(config: SamlConfig, samlResponse: string): Promise<void> {
    const strict = (process.env.SAML_STRICT || 'false').toLowerCase() === 'true';
    if (!strict) return;
    const xml = Buffer.from(samlResponse, 'base64').toString('utf8');
    const hasSig = /<\w*:Signature[\s>]/.test(xml);
    if (!hasSig) throw new Error('SAML strict: missing XMLDSig signature');
    if (!xml.includes(`<Audience>${config.issuer}</Audience>`)) throw new Error('SAML strict: audience mismatch');
    if (!xml.includes(`Recipient=\"${config.callbackUrl}\"`) && !xml.includes(`Recipient=\"${config.callbackUrl}\"`)) throw new Error('SAML strict: recipient mismatch');
    const skew = parseInt(process.env.SAML_CLOCK_SKEW_SEC || '120', 10) * 1000;
    const nbMatch = xml.match(/NotBefore=\"([^\"]+)\"/);
    const naMatch = xml.match(/NotOnOrAfter=\"([^\"]+)\"/);
    const now = Date.now();
    if (nbMatch) { const nb = Date.parse(nbMatch[1]); if (now + skew < nb) throw new Error('SAML strict: assertion not yet valid'); }
    if (naMatch) { const na = Date.parse(naMatch[1]); if (now - skew >= na) throw new Error('SAML strict: assertion expired'); }
  }

  private async cacheIdpMetadata(tenantId: string, config: SamlConfig): Promise<void> {
    const ttlMs = parseInt(process.env.SAML_METADATA_TTL_MS || '3600000', 10);
    const key = `saml:md:${tenantId}`;
    const digest = require('crypto').createHash('sha256').update(config.cert || '').digest('hex');
    await withRedis(async (r) => { await r.setex(key, Math.ceil(ttlMs/1000), digest); }, async () => {});
  }

}

export const samlService = new SamlService();

