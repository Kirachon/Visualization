import * as jose from 'jose';

// Feature flags (default OFF):
// - OIDC_STRICT: require server-stored state/nonce/code_verifier
// - OIDC_JWKS_CACHE_TTL_MS: TTL for JWKS cache (default 600000)

import { withRedis } from '../utils/redis.js';
const stateStore: Map<string,{ nonce:string; codeVerifier:string; expiresAt:number }> = new Map();
const jwksCache: Map<string,{ jwks: ReturnType<typeof jose.createRemoteJWKSet>; expiresAt:number }> = new Map();

export async function storeOidcAuthState(state: string, nonce: string, codeVerifier: string, ttlMs = 300000){
  const expiresAt = Date.now() + ttlMs;
  // Try Redis first
  await withRedis(
    async (r) => { await r.setex(`oidc:state:${state}`, Math.ceil(ttlMs/1000), JSON.stringify({ nonce, codeVerifier })); },
    async () => { stateStore.set(state, { nonce, codeVerifier, expiresAt }); }
  );
}

async function consumeOidcAuthState(state: string): Promise<{ nonce:string; codeVerifier:string } | null> {
  return withRedis(
    async (r) => {
      const key = `oidc:state:${state}`;
      const val = await r.get(key);
      if (!val) return null;
      await r.del(key);
      const obj = JSON.parse(val);
      return { nonce: obj.nonce, codeVerifier: obj.codeVerifier };
    },
    async () => {
      const rec = stateStore.get(state);
      if (!rec) return null;
      stateStore.delete(state);
      if (rec.expiresAt < Date.now()) return null;
      return { nonce: rec.nonce, codeVerifier: rec.codeVerifier };
    }
  );
}

function getRemoteJwks(jwksUri: string){
  const ttl = parseInt(process.env.OIDC_JWKS_CACHE_TTL_MS || '600000', 10);
  const cached = jwksCache.get(jwksUri);
  if (cached && cached.expiresAt > Date.now()) return cached.jwks;
  const jwks = jose.createRemoteJWKSet(new URL(jwksUri));
  jwksCache.set(jwksUri, { jwks, expiresAt: Date.now() + ttl });
  return jwks;
}
import { query } from '../database/connection.js';
import crypto from 'crypto';

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenEndpoint: string;
  jwksUri: string;
  scope?: string;
}

export interface OidcCallbackInput {
  code: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

async function exchangeCodeForTokens(config: OidcConfig, code: string, codeVerifier: string): Promise<any> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
  });
  const res = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.statusText}`);
  return res.json();
}

async function validateIdToken(config: OidcConfig, idToken: string, nonce: string): Promise<jose.JWTPayload> {
  const JWKS = getRemoteJwks(config.jwksUri);
  const { payload } = await jose.jwtVerify(idToken, JWKS, {
    issuer: config.issuer,
    audience: config.clientId,
  });
  if (payload.nonce !== nonce) throw new Error('Nonce mismatch');
  return payload;
}

function mapClaims(payload: jose.JWTPayload): { email: string; firstName?: string; lastName?: string; externalId: string } {
  const email = (payload.email as string) || (payload.sub as string);
  const firstName = (payload.given_name as string) || undefined;
  const lastName = (payload.family_name as string) || undefined;
  const externalId = payload.sub as string;
  return { email, firstName, lastName, externalId };
}

async function jitProvision(tenantId: string, claims: ReturnType<typeof mapClaims>, provider: string): Promise<string> {
  // Check if user exists by external_id
  let res = await query(`SELECT id FROM users WHERE external_id = $1 AND provider = $2`, [claims.externalId, provider]);
  if (res.rows.length > 0) return res.rows[0].id;

  // Create user with default role (fetch first available role for tenant)
  const roleRes = await query(`SELECT id FROM roles WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
  if (roleRes.rows.length === 0) throw new Error('No roles available for tenant');
  const roleId = roleRes.rows[0].id;

  const username = claims.email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
  res = await query(
    `INSERT INTO users (username, email, first_name, last_name, tenant_id, role_id, external_id, provider, is_active, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW()) RETURNING id`,
    [username, claims.email, claims.firstName || null, claims.lastName || null, tenantId, roleId, claims.externalId, provider]
  );
  const userId = res.rows[0].id;

  // Record provisioning event
  await query(
    `INSERT INTO provisioning_events (user_id, type, at, raw) VALUES ($1,'jit_oidc',NOW(),$2)`,
    [userId, JSON.stringify({ claims, provider })]
  );

  return userId;
}

export class OidcService {
  private isEnabled(): boolean { return (process.env.OIDC_ENABLED || 'false').toLowerCase() === 'true'; }

  async handleCallback(tenantId: string, config: OidcConfig, input: OidcCallbackInput): Promise<{ userId: string; email: string }> {
    if (!this.isEnabled()) throw new Error('OIDC not enabled');
    // Strict state/nonce/code_verifier from server store
    const strict = (process.env.OIDC_STRICT || 'false').toLowerCase() === 'true';
    let nonce = input.nonce;
    let codeVerifier = input.codeVerifier;
    const stored = await consumeOidcAuthState(input.state);
    if (stored) { nonce = stored.nonce; codeVerifier = stored.codeVerifier; }
    else if (strict) { throw new Error('Missing OIDC state'); }

    const tokens = await exchangeCodeForTokens(config, input.code, codeVerifier);
    const payload = await validateIdToken(config, tokens.id_token, nonce);
    const claims = mapClaims(payload);
    const userId = await jitProvision(tenantId, claims, 'oidc');

	    // Optionally encrypt+persist refresh token
	    if ((process.env.OIDC_REFRESH_ENCRYPT || 'false').toLowerCase() === 'true') {
	      try {
	        const refresh = (tokens as any).refresh_token || (tokens as any).refresh_token?.toString?.();
	        if (refresh) {
	          const { encryptionService } = await import('./encryptionService.js');
	          const enc = await encryptionService.encrypt(String(refresh));
	          await query(`INSERT INTO oidc_tokens (user_id, provider, refresh_encrypted) VALUES ($1,$2,$3)`, [userId, 'oidc', enc]);
	        }
	      } catch (e) { console.error('[OIDC] refresh encrypt/persist error', e); }
	    }

    return { userId, email: claims.email };
  }
}

export const oidcService = new OidcService();

