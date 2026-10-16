import { ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const prefix = 'lbenc:v1:';
function keys(): Record<string, string> {
  try {
    const value = JSON.parse(process.env.REFLECTION_ENCRYPTION_KEYS || '{}');
    if (!value || Array.isArray(value) || typeof value !== 'object' ||
      Object.entries(value).some(([id, key]) => !/^[a-zA-Z0-9_-]{1,40}$/.test(id) || typeof key !== 'string' || !/^[a-fA-F0-9]{64}$/.test(key))) throw new Error();
    return value;
  } catch { throw new ServiceUnavailableException('Private reflection encryption is not configured'); }
}
export function encryptReflection(text: string, context: string): string {
  const id = process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY || '';
  const ring = keys();
  const key = Object.hasOwn(ring, id) ? ring[id] : undefined;
  if (!key) throw new ServiceUnavailableException('Private reflection encryption is not configured');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return prefix + [id, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join(':');
}
export function decryptReflection(value: string, context: string): string {
  // Existing plaintext remains readable until an explicitly approved backfill.
  if (!value.startsWith(prefix)) return value;
  try {
    const [id, iv, tag, ciphertext, extra] = value.slice(prefix.length).split(':');
    const ring = keys();
    const key = Object.hasOwn(ring, id) ? ring[id] : undefined;
    if (!key || !iv || !tag || ciphertext === undefined || extra !== undefined) throw new Error();
    const nonce = Buffer.from(iv, 'base64'); const authTag = Buffer.from(tag, 'base64');
    if (nonce.length !== 12 || authTag.length !== 16) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), nonce);
    decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
  } catch { throw new ServiceUnavailableException('This private reflection cannot be opened right now'); }
}
