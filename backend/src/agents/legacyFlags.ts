import { randomUUID } from 'node:crypto';
import { db } from '../db';

// Transitional: flags move with the moderation/community persistence slice.
export function fileFlag(contentId: string, userId: string, reason?: string) {
  const database = db.read();
  const flag = { id: randomUUID(), contentId, deviceId: userId, reason, status: 'pending' as const, createdAt: new Date().toISOString() };
  database.flags.push(flag);
  db.write(database);
  return flag;
}
