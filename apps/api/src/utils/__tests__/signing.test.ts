import crypto from 'crypto';
import { canonicalJson, signAuditPayload } from '../signing.js';

describe('signing utils', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { jest.resetModules(); process.env = { ...OLD_ENV }; });
  afterAll(() => { process.env = OLD_ENV; });

  it('canonicalJson produces deterministic, sorted JSON', () => {
    const payload = { b: 2, a: 1, z: { y: 2, x: 1 }, arr: [{ b: 2, a: 1 }] };
    const c = canonicalJson(payload);
    expect(c).toBe('{"a":1,"arr":[{"a":1,"b":2}],"b":2,"z":{"x":1,"y":2}}');
  });

  it('signAuditPayload uses legacy key when rotation not configured', () => {
    delete process.env.AUDIT_SIG_KEYS;
    delete process.env.AUDIT_SIG_ACTIVE_KEY_ID;
    process.env.ENC_MASTER_KEY = 'legacy-secret';
    const payload = { foo: 'bar', n: 1 };
    const { keyId, signature } = signAuditPayload(payload);
    expect(keyId).toBe('legacy');
    const canon = canonicalJson(payload);
    const expected = crypto.createHmac('sha256', 'legacy-secret').update(canon).digest('hex');
    expect(signature).toBe(expected);
  });

  it('signAuditPayload selects active rotation key and signs correctly', () => {
    process.env.AUDIT_SIG_KEYS = 'k1:secret1,k2:secret2';
    process.env.AUDIT_SIG_ACTIVE_KEY_ID = 'k2';
    const payload = { b: 2, a: 'x' };
    const { keyId, signature } = signAuditPayload(payload);
    expect(keyId).toBe('k2');
    const canon = canonicalJson(payload);
    const expected = crypto.createHmac('sha256', 'secret2').update(canon).digest('hex');
    expect(signature).toBe(expected);
  });
});

