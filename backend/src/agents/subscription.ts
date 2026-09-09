import { db } from '../db';
import { Subscription } from '../types';

// --------------------------------------------------------------------------
// This deliberately does NOT integrate a real payment processor — that
// requires a live Stripe/App Store/Play Console account, which can't exist
// inside a code scaffold. This gives you a correct, swappable seam: replace
// `upgrade()`'s body with a real webhook handler once you have processor
// credentials, and nothing else in the app needs to change.
// --------------------------------------------------------------------------

export function getSubscription(deviceId: string): Subscription {
  const database = db.read();
  return database.subscriptions[deviceId] || { deviceId, tier: 'free', updatedAt: new Date().toISOString() };
}

export function upgrade(deviceId: string, billingCycle: 'monthly' | 'annual'): Subscription {
  const database = db.read();
  const sub: Subscription = { deviceId, tier: 'premium', billingCycle, updatedAt: new Date().toISOString() };
  database.subscriptions[deviceId] = sub;
  db.write(database);
  return sub;
}
