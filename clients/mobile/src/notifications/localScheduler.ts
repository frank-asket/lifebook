import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const REMINDER_STORAGE_KEY = 'lifebook.daily_reminder_config';
export const REMINDER_CHANNEL_ID = 'daily-5min-reminders';

export interface DailyReminderConfig {
  enabled: boolean;
  hour: number;       // 0 - 23 (24h format)
  minute: number;     // 0 - 59
  notificationId?: string | null;
  lastScheduledAt?: string;
}

export const DEFAULT_REMINDER_CONFIG: DailyReminderConfig = {
  enabled: false,
  hour: 7, // 7:00 AM default morning time
  minute: 0,
  notificationId: null,
};

// Preset morning reminder times
export const MORNING_TIME_PRESETS = [
  { label: '6:00 AM', hour: 6, minute: 0 },
  { label: '6:30 AM', hour: 6, minute: 30 },
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '7:30 AM', hour: 7, minute: 30 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '8:30 AM', hour: 8, minute: 30 },
  { label: '9:00 AM', hour: 9, minute: 0 },
];

/**
 * Configure default notification behavior when app is in foreground
 */
export function initNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Configure Android notification channel for daily reflections
 */
export async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Daily 5-Minute Morning Reminder',
      description: 'Daily notification inviting you to spend 5 quiet minutes with Scripture and prayer.',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1FB6B0',
    });
  }
}

/**
 * Request notification permissions from OS
 */
export async function requestLocalNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Load saved reminder configuration
 */
export async function getDailyReminderConfig(): Promise<DailyReminderConfig> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.warn('[Notifications] Failed to load reminder config:', err);
  }
  return DEFAULT_REMINDER_CONFIG;
}

/**
 * Schedule a daily 5-minute morning reminder at the specified hour & minute
 */
export async function scheduleDailyMorningReminder(
  hour: number,
  minute: number
): Promise<{ ok: boolean; notificationId?: string; error?: string }> {
  try {
    initNotificationHandler();
    await ensureNotificationChannel();

    const hasPermission = await requestLocalNotificationPermissions();
    if (!hasPermission) {
      return {
        ok: false,
        error: 'Notification permissions were denied. Please enable them in your device Settings to receive your morning reminder.',
      };
    }

    // Cancel any previously scheduled reminders to prevent duplicates
    await cancelDailyMorningReminder(false);

    // Schedule daily recurring reminder
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Your 5-Minute Morning Reflection',
        body: "Take 5 peaceful minutes to center your heart with today's Scripture & reflection.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'daily-morning-reminder',
          durationMinutes: 5,
        },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: REMINDER_CHANNEL_ID,
      } as any,
    });

    const newConfig: DailyReminderConfig = {
      enabled: true,
      hour,
      minute,
      notificationId,
      lastScheduledAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(newConfig));

    return { ok: true, notificationId };
  } catch (error: any) {
    console.error('[Notifications] Failed to schedule daily reminder:', error);
    return { ok: false, error: error?.message || 'Failed to schedule local notification' };
  }
}

/**
 * Cancel the scheduled daily reminder
 */
export async function cancelDailyMorningReminder(updateStorage = true): Promise<void> {
  try {
    const config = await getDailyReminderConfig();
    if (config.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(config.notificationId);
      } catch (e) {
        // Notification might have already expired or been cancelled
      }
    }

    // Also scan scheduled notifications to clear any matching reminder triggers
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (n.content?.data?.type === 'daily-morning-reminder') {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
    } catch (e) {
      // Ignore cleanup error
    }

    if (updateStorage) {
      const updatedConfig: DailyReminderConfig = {
        ...config,
        enabled: false,
        notificationId: null,
      };
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updatedConfig));
    }
  } catch (error) {
    console.warn('[Notifications] Error cancelling reminder:', error);
  }
}

/**
 * Trigger an immediate test reminder after a small delay (default 3 seconds)
 * allowing the user to verify sound, banner, and copy on their device.
 */
export async function triggerTestMorningReminder(delaySeconds = 3): Promise<{ ok: boolean; error?: string }> {
  try {
    initNotificationHandler();
    await ensureNotificationChannel();

    const hasPermission = await requestLocalNotificationPermissions();
    if (!hasPermission) {
      return { ok: false, error: 'Notification permissions were denied.' };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Your 5-Minute Morning Reflection (Test)',
        body: 'Take 5 peaceful minutes to center your heart with Psalm 46:10 and today\'s reflection.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'test-reminder',
          durationMinutes: 5,
        },
      },
      trigger: {
        seconds: delaySeconds,
        channelId: REMINDER_CHANNEL_ID,
      } as any,
    });

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Failed to trigger test notification.' };
  }
}

/**
 * Format hour and minute into a readable string (e.g. 7:00 AM)
 */
export function formatReminderTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Parse a string like "7:00 AM" or "08:30 PM" into hour & minute
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return { hour: 7, minute: 0 };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export {
  DailyReminder,
  DailyReminderService,
  PROACTIVE_9AM_NOTIFICATION_TYPE,
  DAILY_REMINDER_9AM_HOUR,
} from './DailyReminder';
