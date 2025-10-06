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
    const { kid, key } = await this.getActiveKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: kid:iv:tag:ciphertext (all hex)
    return `${kid}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  async decrypt(ciphertext: string): Promise<string> {
    const parts = ciphertext.split(':');
    if (parts.length !== 4) throw new Error('Invalid ciphertext format');
    const [kid, ivHex, tagHex, encHex] = parts;
    // In production, retrieve key from KMS by kid; here we derive
    const key = crypto.createHash('sha256').update(kid).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

export const encryptionService = new EncryptionService();

