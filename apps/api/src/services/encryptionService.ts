import crypto from 'crypto';
import { query } from '../database/connection.js';

const ALGO = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
// const TAG_LENGTH = 16;

export class EncryptionService {
  private async getActiveKey(): Promise<{ kid: string; key: Buffer }> {
    const res = await query(`SELECT kid FROM encryption_keys WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`);
    if (res.rows.length === 0) {
      // Generate and store a new key (in production, use KMS/Vault)
      const kid = crypto.randomBytes(16).toString('hex');
      const key = crypto.randomBytes(KEY_LENGTH);
      await query(`INSERT INTO encryption_keys (kid, algo, created_at, status) VALUES ($1,$2,NOW(),'active')`, [kid, ALGO]);
      // In production, store key securely in KMS; here we derive from kid for demo
      return { kid, key };
    }
    const kid = res.rows[0].kid;
    // In production, retrieve key from KMS; here we derive from kid for demo
    const key = crypto.createHash('sha256').update(kid).digest();
    return { kid, key };
  }

  async encrypt(plaintext: string): Promise<string> {
    const envelope = (process.env.ENC_ENVELOPE_MODE || 'false').toLowerCase() === 'true';
    const { kid, key } = await this.getActiveKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    let dataKey: Buffer = key;
    let edkHex = '';
    if (envelope) {
      // Generate DEK and encrypt with KEK (demo: derive from kid + env master)
      dataKey = crypto.randomBytes(KEY_LENGTH);
      const master = process.env.ENC_MASTER_KEY || kid;
      const kek = crypto.createHash('sha256').update(master).digest();
      const iv2 = crypto.randomBytes(IV_LENGTH);
      const c2 = crypto.createCipheriv(ALGO, kek, iv2);
      const edk = Buffer.concat([c2.update(dataKey), c2.final()]);
      const tag2 = c2.getAuthTag();
      edkHex = `${iv2.toString('hex')}.${tag2.toString('hex')}.${edk.toString('hex')}`;
    }

    const cipher = crypto.createCipheriv(ALGO, dataKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format (legacy): kid:iv:tag:ciphertext
    // Format (envelope): kid:iv:tag:ciphertext:edk (edk=iv.tag.ct hex segments joined by '.')
    return envelope
      ? `${kid}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}:${edkHex}`
      : `${kid}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  async decrypt(ciphertext: string): Promise<string> {
    const parts = ciphertext.split(':');
    if (parts.length !== 4 && parts.length !== 5) throw new Error('Invalid ciphertext format');
    const [kid, ivHex, tagHex, encHex, edkHex] = parts;

    let dataKey: Buffer;
    if (parts.length === 5) {
      // Envelope mode
      const master = process.env.ENC_MASTER_KEY || kid;
      const kek = crypto.createHash('sha256').update(master).digest();
      const [iv2Hex, tag2Hex, edkCtHex] = edkHex.split('.');
      const iv2 = Buffer.from(iv2Hex, 'hex');
      const tag2 = Buffer.from(tag2Hex, 'hex');
      const edkCt = Buffer.from(edkCtHex, 'hex');
      const d2 = crypto.createDecipheriv(ALGO, kek, iv2);
      d2.setAuthTag(tag2);
      dataKey = Buffer.concat([d2.update(edkCt), d2.final()]);
    } else {
      // Legacy mode
      dataKey = crypto.createHash('sha256').update(kid).digest();
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, dataKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

export const encryptionService = new EncryptionService();

