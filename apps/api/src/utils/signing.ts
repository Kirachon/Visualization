import crypto from 'crypto';

export function parseAuditSigKeys(): Map<string,string> {
  const m = new Map<string,string>();
  const raw = process.env.AUDIT_SIG_KEYS || '';
  for (const part of raw.split(',').map(s => s.trim()).filter(Boolean)) {
    const idx = part.indexOf(':');
    if (idx > 0) {
      const id = part.slice(0, idx);
      const secret = part.slice(idx+1);
      if (id && secret) m.set(id, secret);
    }
  }
  return m;
}

export function canonicalJson(obj: any): string {
  // Deterministic JSON: sort keys recursively
  const sorter = (value: any): any => {
    if (Array.isArray(value)) return value.map(sorter);
    if (value && typeof value === 'object') {
      const out: any = {};
      for (const k of Object.keys(value).sort()) out[k] = sorter(value[k]);
      return out;
    }
    return value;
  };
  return JSON.stringify(sorter(obj));
}

export function signAuditPayload(payload: any): { keyId: string; signature: string } {
  const keys = parseAuditSigKeys();
  const active = process.env.AUDIT_SIG_ACTIVE_KEY_ID || '';
  const json = canonicalJson(payload);

  if (keys.size > 0 && active && keys.has(active)) {
    const secret = keys.get(active)!;
    const sig = crypto.createHmac('sha256', secret).update(json).digest('hex');
    return { keyId: active, signature: sig };
  }
  // Fallback to legacy single-key (ENC_MASTER_KEY) if rotation not configured
  const legacy = process.env.ENC_MASTER_KEY || 'audit';
  const sig = crypto.createHmac('sha256', legacy).update(json).digest('hex');
  return { keyId: 'legacy', signature: sig };
}

