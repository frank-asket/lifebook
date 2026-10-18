import { ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Bible note encryption (AES-256-GCM, BIBLE_NOTES_ENCRYPTION_KEY). Shared by annotations and the data export.
function key(): Buffer {
  const value = process.env.BIBLE_NOTES_ENCRYPTION_KEY;
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) throw new ServiceUnavailableException('Bible notes encryption is not configured');
  return Buffer.from(value, 'hex');
}
export function encryptNote(value: string): string {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join(':');
}
export function decryptNote(value: string): string {
  const [version, iv, tag, content] = value.split(':');
  if (version !== 'v1' || !iv || !tag || !content) throw new ServiceUnavailableException('Cannot read encrypted note');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(content, 'base64')), decipher.final()]).toString('utf8');
}
