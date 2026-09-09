import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken as postTokenToBackend } from '../api/client';

// --------------------------------------------------------------------------
// This has NOT been run on a real device or simulator — there's no phone,
// simulator, or EAS project available in the sandbox this was built in.
// It follows Expo's current documented pattern for push registration:
// https://docs.expo.dev/push-notifications/push-notifications-setup/
//
// This gets an *Expo* push token (not a raw FCM token). The backend
// (backend/src/agents/notifications.ts) sends through Expo's push service,
// which forwards to FCM (Android) and APNs (iOS) — that pairing is
// intentional and must stay consistent if this code changes later.
// --------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(deviceId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!Device.isDevice) {
    return { ok: false, reason: 'Push notifications require a physical device, not a simulator.' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return { ok: false, reason: 'Notification permission was not granted.' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    await postTokenToBackend(deviceId, tokenResponse.data, Platform.OS === 'ios' ? 'ios' : 'android');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'Failed to get or register push token.' };
  }
}
