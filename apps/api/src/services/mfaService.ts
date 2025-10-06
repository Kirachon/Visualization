import crypto from 'crypto';
import { query } from '../database/connection.js';

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

  verifyAndEnable(userId: string, secretB32: string, code: string): Promise<boolean> {
    if (!this.isEnabled()) throw new Error('MFA not enabled');
    const secret = this.base32ToBuffer(secretB32);
    const valid = totpCode(secret).includes(code);
    if (!valid) return Promise.resolve(false);
    return query(
      `UPDATE users SET mfa_enabled = true, mfa_secret = $1, updated_at = NOW() WHERE id = $2`,
      [secretB32, userId]
    ).then(() => true);
  }
}

export const mfaService = new MfaService();

