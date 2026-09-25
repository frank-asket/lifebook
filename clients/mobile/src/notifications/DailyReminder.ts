import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  REMINDER_CHANNEL_ID,
  initNotificationHandler,
  ensureNotificationChannel,
  requestLocalNotificationPermissions,
} from './localScheduler';

export const DAILY_ACTIVITY_STORAGE_KEY = 'lifebook.daily_activity_state';
export const PROACTIVE_9AM_NOTIFICATION_TYPE = 'proactive-9am-5min-session';
export const DAILY_REMINDER_9AM_HOUR = 9;
export const DAILY_REMINDER_9AM_MINUTE = 0;

export interface DailyActivityState {
  lastCompletedDate: string | null; // YYYY-MM-DD
  lastProactiveNudgeDate: string | null; // YYYY-MM-DD
  proactive9AmEnabled: boolean;
  scheduledNotificationId?: string | null;
}

export const DEFAULT_DAILY_ACTIVITY_STATE: DailyActivityState = {
  lastCompletedDate: null,
  lastProactiveNudgeDate: null,
  proactive9AmEnabled: true,
  scheduledNotificationId: null,
};

/**
 * Returns local YYYY-MM-DD date string
 */
export function getLocalTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes an ISO timestamp or YYYY-MM-DD string to local YYYY-MM-DD
 */
function normalizeDateKey(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  return getLocalTodayDateString(parsed);
}

/**
 * DailyReminder service using expo-notifications to proactively suggest
 * a 5-minute LifeBook session if the user hasn't completed their daily activity by 9 AM.
 */
export class DailyReminderService {
  static async getState(): Promise<DailyActivityState> {
    try {
      const raw = await AsyncStorage.getItem(DAILY_ACTIVITY_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_DAILY_ACTIVITY_STATE, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[DailyReminder] Failed to read state:', err);
    }
    return DEFAULT_DAILY_ACTIVITY_STATE;
  }

  static async saveState(state: DailyActivityState): Promise<void> {
    try {
      await AsyncStorage.setItem(DAILY_ACTIVITY_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[DailyReminder] Failed to save state:', err);
    }
  }

  /**
   * Checks whether the user has completed their daily LifeBook activity today.
   */
  static async hasCompletedDailyActivityToday(
    streakLastCheckIn?: string | null,
    now: Date = new Date()
  ): Promise<boolean> {
    const todayKey = getLocalTodayDateString(now);
    const normalizedStreakDate = normalizeDateKey(streakLastCheckIn);
    if (normalizedStreakDate === todayKey) {
      return true;
    }
    const state = await this.getState();
    return state.lastCompletedDate === todayKey;
  }

  /**
   * Marks today's daily activity as completed, cancels any pending proactive 9 AM nudge
   * for today, and ensures the 9 AM reminder remains scheduled for tomorrow.
   */
  static async markDailyActivityCompleted(now: Date = new Date()): Promise<void> {
    const todayKey = getLocalTodayDateString(now);
    const state = await this.getState();

    // Cancel any delivered/pending 9 AM nudge notifications for today
    await this.cancelProactive9AmNotifications();

    const nextState: DailyActivityState = {
      ...state,
      lastCompletedDate: todayKey,
      scheduledNotificationId: null,
    };
    await this.saveState(nextState);

    // Re-arm the recurring 9 AM trigger for subsequent days if enabled
    if (nextState.proactive9AmEnabled) {
      await this.schedule9AmReminderTrigger();
    }
  }

  /**
   * Cancels any scheduled proactive 9 AM notifications in expo-notifications
   */
  static async cancelProactive9AmNotifications(): Promise<void> {
    try {
      const state = await this.getState();
      if (state.scheduledNotificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(state.scheduledNotificationId);
        } catch {
          // Ignore if already fired or cancelled
        }
      }

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const item of scheduled) {
        if (item.content?.data?.type === PROACTIVE_9AM_NOTIFICATION_TYPE) {
          await Notifications.cancelScheduledNotificationAsync(item.identifier);
        }
      }
    } catch (err) {
      console.warn('[DailyReminder] Error cancelling 9 AM notifications:', err);
    }
  }

  /**
   * Schedules the daily 9:00 AM notification trigger via expo-notifications
   */
  static async schedule9AmReminderTrigger(): Promise<{
    ok: boolean;
    notificationId?: string;
    error?: string;
  }> {
    try {
      initNotificationHandler();
      await ensureNotificationChannel();

      const hasPermission = await requestLocalNotificationPermissions();
      if (!hasPermission) {
        return {
          ok: false,
          error: 'Notification permissions not granted for 9 AM daily reminder.',
        };
      }

      await this.cancelProactive9AmNotifications();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌿 Time for a 5-Minute LifeBook Session?',
          body: "It's 9:00 AM and you haven't completed today's daily activity yet. Pause for 5 peaceful minutes with Scripture and prayer.",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: PROACTIVE_9AM_NOTIFICATION_TYPE,
            durationMinutes: 5,
            targetHour: DAILY_REMINDER_9AM_HOUR,
          },
        },
        trigger: {
          hour: DAILY_REMINDER_9AM_HOUR,
          minute: DAILY_REMINDER_9AM_MINUTE,
          repeats: true,
          channelId: REMINDER_CHANNEL_ID,
        } as any,
      });

      const state = await this.getState();
      await this.saveState({
        ...state,
        proactive9AmEnabled: true,
        scheduledNotificationId: notificationId,
      });

      return { ok: true, notificationId };
    } catch (error: any) {
      console.warn('[DailyReminder] Failed to schedule 9 AM reminder:', error);
      return { ok: false, error: error?.message || 'Failed to schedule 9 AM reminder' };
    }
  }

  /**
   * Evaluates whether the user has completed their daily activity by 9 AM.
   * - If completed today: records completion and avoids nudging today.
   * - If NOT completed and current time is >= 9:00 AM (and not yet nudged today):
   *   proactively sends a local notification suggesting a 5-minute LifeBook session.
   * - If NOT completed and current time is < 9:00 AM: ensures the 9:00 AM trigger is armed.
   */
  static async evaluateAndSuggestIfIncomplete(options?: {
    streakLastCheckIn?: string | null;
    now?: Date;
  }): Promise<{
    completedToday: boolean;
    proactiveNudgeSent: boolean;
    scheduledFor9Am: boolean;
    message: string;
  }> {
    const now = options?.now ?? new Date();
    const todayKey = getLocalTodayDateString(now);
    const state = await this.getState();

    const completedToday = await this.hasCompletedDailyActivityToday(
      options?.streakLastCheckIn,
      now
    );

    if (completedToday) {
      if (state.lastCompletedDate !== todayKey) {
        await this.markDailyActivityCompleted(now);
      }
      return {
        completedToday: true,
        proactiveNudgeSent: false,
        scheduledFor9Am: state.proactive9AmEnabled,
        message: 'Daily activity completed for today. Next 9:00 AM check armed for tomorrow.',
      };
    }

    if (!state.proactive9AmEnabled) {
      return {
        completedToday: false,
        proactiveNudgeSent: false,
        scheduledFor9Am: false,
        message: 'Proactive 9:00 AM daily reminder is disabled.',
      };
    }

    // Ensure the 9:00 AM recurring schedule is active
    const schedResult = await this.schedule9AmReminderTrigger();

    // Check if it is currently 9:00 AM or later and we haven't nudged the user today
    const currentHour = now.getHours();
    const alreadyNudgedToday = state.lastProactiveNudgeDate === todayKey;

    if (currentHour >= DAILY_REMINDER_9AM_HOUR && !alreadyNudgedToday) {
      try {
        initNotificationHandler();
        await ensureNotificationChannel();
        const hasPermission = await requestLocalNotificationPermissions();

        if (hasPermission) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '☀️ Your 5-Minute LifeBook Session Awaits',
              body: "You haven't completed your daily activity by 9 AM. Take 5 quiet minutes now to read today's verse and reflect.",
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: {
                type: PROACTIVE_9AM_NOTIFICATION_TYPE,
                durationMinutes: 5,
                proactiveImmediate: true,
              },
            },
            trigger: {
              seconds: 2,
              channelId: REMINDER_CHANNEL_ID,
            } as any,
          });

          const latestState = await this.getState();
          await this.saveState({
            ...latestState,
            lastProactiveNudgeDate: todayKey,
          });

          return {
            completedToday: false,
            proactiveNudgeSent: true,
            scheduledFor9Am: schedResult.ok,
            message: 'Sent proactive 9:00 AM suggestion for a 5-minute LifeBook session.',
          };
        }
      } catch (err) {
        console.warn('[DailyReminder] Error dispatching proactive 9 AM nudge:', err);
      }
    }

    return {
      completedToday: false,
      proactiveNudgeSent: false,
      scheduledFor9Am: schedResult.ok,
      message:
        currentHour < DAILY_REMINDER_9AM_HOUR
          ? 'Armed for 9:00 AM if daily activity is not completed.'
          : '9:00 AM reminder already evaluated for today.',
    };
  }

  /**
   * Enables or disables the proactive 9:00 AM daily reminder
   */
  static async setProactive9AmEnabled(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
    const state = await this.getState();
    if (!enabled) {
      await this.cancelProactive9AmNotifications();
      await this.saveState({
        ...state,
        proactive9AmEnabled: false,
        scheduledNotificationId: null,
      });
      return { ok: true };
    }

    await this.saveState({
      ...state,
      proactive9AmEnabled: true,
    });
    const res = await this.schedule9AmReminderTrigger();
    return { ok: res.ok, error: res.error };
  }
}

export const DailyReminder = DailyReminderService;
export default DailyReminderService;
