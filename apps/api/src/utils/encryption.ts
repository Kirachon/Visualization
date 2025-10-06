import crypto from 'crypto';

const ENC_KEY = process.env.ENCRYPTION_KEY || ''; // 32 bytes (base64 or hex)

function getKey(): Buffer {
  if (!ENC_KEY) throw new Error('ENCRYPTION_KEY is required');
  // Support base64 or hex; fallback to utf8 (dev only)
  try {
    if (/^[A-Fa-f0-9]{64}$/.test(ENC_KEY)) return Buffer.from(ENC_KEY, 'hex');
    const b64 = Buffer.from(ENC_KEY, 'base64');
    if (b64.length === 32) return b64;
  } catch (_) {/* noop */}
  const buf = Buffer.from(ENC_KEY, 'utf8');
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (use base64 or hex)');
  }
  return buf;
}

export interface CipherText {
  iv: string; // base64
  authTag: string; // base64
  ct: string; // base64
}

export function encrypt(plain: string): CipherText {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { iv: iv.toString('base64'), authTag: authTag.toString('base64'), ct: ct.toString('base64') };
}

export function decrypt(payload: CipherText): string {
  const key = getKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([
    decipher.update(Buffer.from(payload.ct, 'base64')),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}

