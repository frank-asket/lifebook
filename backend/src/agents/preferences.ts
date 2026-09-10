import { db } from '../db';
import { UserPreferences } from '../types';

export function savePreferences(deviceId: string, updates: Partial<UserPreferences>): UserPreferences {
  const database = db.read();
  const existing = database.preferences[deviceId] || { deviceId };
  const merged = { ...existing, ...updates, deviceId };
  database.preferences[deviceId] = merged;
  db.write(database);
  return merged;
}

export function getPreferences(deviceId: string): UserPreferences | null {
  const database = db.read();
  return database.preferences[deviceId] || null;
}
