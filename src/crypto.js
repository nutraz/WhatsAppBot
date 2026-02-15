import crypto from 'node:crypto';

// Meta sends: X-Hub-Signature-256: sha256=<hex>
export function verifyMetaSignature({ appSecret, rawBody, header }) {
  if (!appSecret) return { ok: true, skipped: true };
  if (!header) return { ok: false, reason: 'missing-signature-header' };
  const [algo, sigHex] = String(header).split('=');
  if (algo !== 'sha256' || !sigHex) return { ok: false, reason: 'bad-signature-format' };

  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(rawBody);
  const expected = Buffer.from(hmac.digest('hex'), 'hex');
  const provided = Buffer.from(sigHex, 'hex');

  if (expected.length !== provided.length) return { ok: false, reason: 'bad-signature-length' };
  const ok = crypto.timingSafeEqual(expected, provided);
  return ok ? { ok: true, skipped: false } : { ok: false, reason: 'signature-mismatch' };
}
