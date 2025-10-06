import { Router } from 'express';
import { oidcService } from '../services/oidcService.js';
import { samlService } from '../services/samlService.js';
import { ldapService } from '../services/ldapService.js';
import { sessionService } from '../services/sessionService.js';
import { query } from '../database/connection.js';
import crypto from 'crypto';

const router = Router();

// OIDC callback
router.get('/auth/oidc/callback', async (req, res, next) => {
  try {
    if ((process.env.OIDC_ENABLED || 'false').toLowerCase() !== 'true') {
      res.status(503).json({ error: 'OIDC not enabled' }); return;
    }
    const { code, state } = req.query;
    if (!code || !state) { res.status(400).json({ error: 'Missing code or state' }); return; }

    // Retrieve tenant and config from state (in production, state should be stored server-side)
    // For now, assume tenantId is passed in query or session
    const tenantId = (req.query.tenant_id as string) || 'default-tenant';
    const configRes = await query(`SELECT config FROM idp_configs WHERE tenant_id = $1 AND type = 'oidc' LIMIT 1`, [tenantId]);
    if (configRes.rows.length === 0) { res.status(404).json({ error: 'OIDC config not found' }); return; }
    const config = configRes.rows[0].config;

    // Retrieve nonce and codeVerifier from session/cookie (simplified: assume passed in query for now)
    const nonce = (req.query.nonce as string) || '';
    const codeVerifier = (req.query.code_verifier as string) || '';

    const result = await oidcService.handleCallback(tenantId, config, { code: code as string, state: state as string, nonce, codeVerifier });
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await sessionService.create({ userId: result.userId, token, expiresAt, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    if ((process.env.SESSIONS_COOKIE_MODE || 'false').toLowerCase() === 'true') {
      res.cookie('sid', session.token, { httpOnly: true, secure: true, sameSite: 'strict', expires: expiresAt, path: '/' });
      res.json({ userId: result.userId, email: result.email });
    } else {
      res.json({ token: session.token, userId: result.userId, email: result.email });
    }
  } catch (err) { next(err); }
});

router.post('/auth/saml/acs', async (req, res, next) => {
  try {
    if ((process.env.SAML_ENABLED || 'false').toLowerCase() !== 'true') {
      res.status(503).json({ error: 'SAML not enabled' }); return;
    }
    const { SAMLResponse, RelayState } = req.body;
    if (!SAMLResponse) { res.status(400).json({ error: 'Missing SAMLResponse' }); return; }

    const tenantId = (RelayState as string) || 'default-tenant';
    const configRes = await query(`SELECT config FROM idp_configs WHERE tenant_id = $1 AND type = 'saml' LIMIT 1`, [tenantId]);
    if (configRes.rows.length === 0) { res.status(404).json({ error: 'SAML config not found' }); return; }
    const config = configRes.rows[0].config;

    const result = await samlService.handleACS(tenantId, config, SAMLResponse);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await sessionService.create({ userId: result.userId, token, expiresAt, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    if ((process.env.SESSIONS_COOKIE_MODE || 'false').toLowerCase() === 'true') {
      res.cookie('sid', session.token, { httpOnly: true, secure: true, sameSite: 'strict', expires: expiresAt, path: '/' });
      res.json({ userId: result.userId, email: result.email });
    } else {
      res.json({ token: session.token, userId: result.userId, email: result.email });
    }
  } catch (err) { next(err); }
});

router.post('/auth/ldap/login', async (req, res, next) => {
  try {
    if ((process.env.LDAP_ENABLED || 'false').toLowerCase() !== 'true') {
      res.status(503).json({ error: 'LDAP not enabled' }); return;
    }
    const { username, password, tenantId } = req.body;
    if (!username || !password) { res.status(400).json({ error: 'Missing username or password' }); return; }

    const tid = tenantId || 'default-tenant';
    const configRes = await query(`SELECT config FROM idp_configs WHERE tenant_id = $1 AND type = 'ldap' LIMIT 1`, [tid]);
    if (configRes.rows.length === 0) { res.status(404).json({ error: 'LDAP config not found' }); return; }
    const config = configRes.rows[0].config;

    const result = await ldapService.login(tid, config, username, password);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await sessionService.create({ userId: result.userId, token, expiresAt, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    if ((process.env.SESSIONS_COOKIE_MODE || 'false').toLowerCase() === 'true') {
      res.cookie('sid', session.token, { httpOnly: true, secure: true, sameSite: 'strict', expires: expiresAt, path: '/' });
      res.json({ userId: result.userId, email: result.email });
    } else {
      res.json({ token: session.token, userId: result.userId, email: result.email });
    }
  } catch (err) { next(err); }
});

export default router;

