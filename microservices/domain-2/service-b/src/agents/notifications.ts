import { db } from '../db';
import { PushTokenRepository } from '../repositories';

// --------------------------------------------------------------------------
// This sends through Expo's push notification service
// (https://docs.expo.dev/push-notifications/sending-notifications/) rather
// than calling Firebase Admin's messaging().send() directly.
//
// Why: the mobile side (clients/mobile/src/notifications/push.ts) uses
// expo-notifications' getExpoPushTokenAsync(), which returns an Expo push
// token, not a raw FCM/APNs registration token. Expo's push service is
// what actually forwards that token on to FCM (Android) and APNs (iOS)
// under the hood — pairing an Expo token with a direct
// admin.messaging().send() call would silently fail, since Firebase Admin
// expects a raw platform token. This keeps both ends consistent.
//
// This has NOT been tested against a real device — there's no phone,
// simulator, or Expo project available in this sandbox. It follows Expo's
// documented request format exactly, but verify a real send before
// trusting it.
// --------------------------------------------------------------------------

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function registerPushToken(userId: string, token: string, platform: 'ios' | 'android' | 'unknown' = 'unknown') {
  return PushTokenRepository.upsert({ userId, token, platform, updatedAt: new Date().toISOString() });
}

export async function getPushToken(userId: string) {
  return PushTokenRepository.get(userId);
}

export interface SendResult {
  sent: boolean;
  reason?: string;
  ticketId?: string;
}

export async function sendPushNotification(userId: string, title: string, body: string): Promise<SendResult> {
  const record = await getPushToken(userId);
  if (!record) {
    return { sent: false, reason: 'No push token registered for this user yet' };
  }
  if (!record.token.startsWith('ExponentPushToken')) {
    console.log(`[dev-fallback push] would send to ${userId}: "${title}" — "${body}" (non-Expo token: ${record.token.slice(0, 16)}...)`);
    return { sent: false, reason: 'Token is not a real Expo push token (dev-fallback/test token) — logged instead of sent' };
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: record.token, title, body, sound: 'default' }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { sent: false, reason: `Expo push service returned HTTP ${response.status}: ${text.slice(0, 200)}` };
    }

      const data: any = await response.json().catch(() => null);
    const ticket = data?.data;
    if (!ticket) {
      return { sent: false, reason: 'Expo push service returned an unexpected response shape' };
    }
    if (ticket.status === 'error') {
      return { sent: false, reason: ticket.message || 'Expo push service returned an error' };
    }
    return { sent: true, ticketId: ticket.id };
  } catch (err: any) {
    console.error('[push] send failed:', err);
    return { sent: false, reason: String(err?.message || err) };
  }
}
