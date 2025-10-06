import { mfaService } from '../services/mfaService.js';

describe('MFA Service', () => {
  const prev = process.env.MFA_ENABLED;
  beforeAll(() => { process.env.MFA_ENABLED = 'true'; });
  afterAll(() => { process.env.MFA_ENABLED = prev; });

  test('generateSecret returns base32 secret and otpauth uri', () => {
    const { secretB32, otpauth } = mfaService.generateSecret('user@example.com');
    expect(secretB32).toMatch(/^[A-Z2-7]+$/);
    expect(otpauth.startsWith('otpauth://totp/')).toBe(true);
    expect(otpauth.includes(secretB32)).toBe(true);
  });

  test('verifyAndEnable rejects wrong code', async () => {
    const { secretB32 } = mfaService.generateSecret('user@example.com');
    await expect(mfaService.verifyAndEnable('u-1', secretB32, '000000')).resolves.toBe(false);
  });
});

