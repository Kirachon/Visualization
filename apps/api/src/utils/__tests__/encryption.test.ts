import { encrypt, decrypt } from '../encryption.js';

describe('Encryption Utils', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
  });

  it('encrypts and decrypts a string', () => {
    const plain = 'my-secret-password';
    const cipher = encrypt(plain);
    expect(cipher).toHaveProperty('iv');
    expect(cipher).toHaveProperty('authTag');
    expect(cipher).toHaveProperty('ct');
    const decrypted = decrypt(cipher);
    expect(decrypted).toBe(plain);
  });

  it('produces different ciphertexts for same plaintext', () => {
    const plain = 'test';
    const c1 = encrypt(plain);
    const c2 = encrypt(plain);
    expect(c1.ct).not.toBe(c2.ct);
    expect(decrypt(c1)).toBe(plain);
    expect(decrypt(c2)).toBe(plain);
  });

  it('throws on tampered ciphertext', () => {
    const cipher = encrypt('test');
    const buf = Buffer.from(cipher.ct, 'base64');
    buf[0] = buf[0] ^ 0xFF;
    cipher.ct = buf.toString('base64');
    expect(() => decrypt(cipher)).toThrow();
  });
});

