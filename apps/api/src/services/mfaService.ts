import crypto from 'crypto';
import { query } from '../database/connection.js';
import { encryptionService } from './encryptionService.js';

function base32Encode(buf: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  // pad to multiples of 8
  while (output.length % 8 !== 0) output += '=';
  return output;
}

function hotp(secret: Buffer, counter: number, digits = 6): string {
  const ctr = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    ctr[i] = counter & 0xff;
    counter = counter >> 8;
  }
  const hmac = crypto.createHmac('sha1', secret).update(ctr).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  const str = (code % 10 ** digits).toString().padStart(digits, '0');
  return str;
}

function totpCode(secret: Buffer, stepSeconds = 30, digits = 6, skew = 1): string[] {
  const t = Math.floor(Date.now() / 1000 / stepSeconds);
  const codes: string[] = [];
  for (let s = -skew; s <= skew; s++) {
    codes.push(hotp(secret, t + s, digits));
  }
  return codes;
}

export class MfaService {
  private isEnabled(): boolean { return (process.env.MFA_ENABLED || 'false').toLowerCase() === 'true'; }

  generateSecret(userEmail: string, issuer = 'BI Platform'): { secretB32: string; otpauth: string } {
    if (!this.isEnabled()) throw new Error('MFA not enabled');
    const secret = crypto.randomBytes(20); // 160-bit secret
    const b32 = base32Encode(secret).replace(/=+$/, '');
    const label = encodeURIComponent(`${issuer}:${userEmail}`);
    const issuerParam = encodeURIComponent(issuer);
    const otpauth = `otpauth://totp/${label}?secret=${b32}&issuer=${issuerParam}&period=30&digits=6&algorithm=SHA1`;
    return { secretB32: b32, otpauth };
  }

  private base32ToBuffer(b32: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = b32.replace(/=+$/,'').toUpperCase();
    let bits = 0, value = 0;
    const bytes: number[] = [];
    for (const c of clean) {
      const idx = alphabet.indexOf(c);
      if (idx === -1) throw new Error('Invalid base32');
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(bytes);
  }

  private attempts: Map<string,{count:number;windowStart:number}> = new Map();

  private assertRateLimit(userId: string) {
    const max = parseInt(process.env.MFA_VERIFY_MAX_PER_MIN || '10', 10);
    const now = Date.now();
    const b = this.attempts.get(userId) || { count: 0, windowStart: now };
    if (now - b.windowStart >= 60_000) { b.count = 0; b.windowStart = now; }
    b.count += 1; this.attempts.set(userId, b);
    if (b.count > max) throw new Error('Too many attempts');
  }

  async generateRecoveryCodes(userId: string, count = 10): Promise<string[]> {
    if ((process.env.MFA_RECOVERY_CODES || 'false').toLowerCase() !== 'true') return [];
    const codes: string[] = [];
    const rows: Array<{ code_hash: string }>= [];
    const pepper = process.env.MFA_RECOVERY_PEPPER || '';
    for (let i=0;i<count;i++) {
      const code = crypto.randomBytes(5).toString('hex');
      codes.push(code);
      const hash = crypto.createHash('sha256').update(code + pepper).digest('hex');
      rows.push({ code_hash: hash });
    }
    for (const r of rows) {
      await query(`INSERT INTO mfa_recovery_codes (user_id, code_hash, created_at) VALUES ($1,$2,NOW())`, [userId, r.code_hash]);
    }
    return codes;
  }

  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    if ((process.env.MFA_RECOVERY_CODES || 'false').toLowerCase() !== 'true') return false;
    const pepper = process.env.MFA_RECOVERY_PEPPER || '';
    const hash = crypto.createHash('sha256').update(code + pepper).digest('hex');
    const res = await query(`SELECT id FROM mfa_recovery_codes WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL`, [userId, hash]);
    if (res.rows.length === 0) return false;
    const id = res.rows[0].id;
    await query(`UPDATE mfa_recovery_codes SET used_at = NOW() WHERE id = $1`, [id]);
    return true;
  }

  async verifyAndEnable(userId: string, secretB32: string, code: string): Promise<boolean> {
    if (!this.isEnabled()) throw new Error('MFA not enabled');
    this.assertRateLimit(userId);
    const secret = this.base32ToBuffer(secretB32);
    const valid = totpCode(secret).includes(code);
    if (!valid) return false;
    const ciphertext = await encryptionService.encrypt(secretB32);
    await query(
      `UPDATE users SET mfa_enabled = true, mfa_secret = $1, updated_at = NOW() WHERE id = $2`,
      [ciphertext, userId]
    );
    return true;
  }
}

export const mfaService = new MfaService();

