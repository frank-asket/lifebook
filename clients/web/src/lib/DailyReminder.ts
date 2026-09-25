import { getStreakData } from "./streak";

export const DAILY_REMINDER_STORAGE_KEY = "lifebook.daily_reminder.9am_state";
export const DAILY_REMINDER_9AM_HOUR = 9;
export const DAILY_REMINDER_9AM_MINUTE = 0;

export interface WebDailyReminderState {
  enabled: boolean;
  targetHour: number; // default 9 (9:00 AM)
  targetMinute: number; // default 0
  lastCompletedDate: string | null; // YYYY-MM-DD
  lastProactiveNudgeDate: string | null; // YYYY-MM-DD
}

export const DEFAULT_WEB_DAILY_REMINDER_STATE: WebDailyReminderState = {
  enabled: true,
  targetHour: DAILY_REMINDER_9AM_HOUR,
  targetMinute: DAILY_REMINDER_9AM_MINUTE,
  lastCompletedDate: null,
  lastProactiveNudgeDate: null,
};

export function getTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * DailyReminder service that proactively suggests a 5-minute LifeBook session
 * if the user hasn't completed their daily activity by 9:00 AM.
 */
export class DailyReminder {
  private static timerId: ReturnType<typeof setTimeout> | null = null;

  static getState(): WebDailyReminderState {
    if (typeof window === "undefined") {
      return DEFAULT_WEB_DAILY_REMINDER_STATE;
    }
    try {
      const raw = localStorage.getItem(DAILY_REMINDER_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_WEB_DAILY_REMINDER_STATE, ...JSON.parse(raw) };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_WEB_DAILY_REMINDER_STATE;
  }

  static saveState(state: WebDailyReminderState): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DAILY_REMINDER_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }

  static hasCompletedDailyActivityToday(
    explicitCompletedToday?: boolean,
    now: Date = new Date()
  ): boolean {
    if (typeof explicitCompletedToday === "boolean") {
      return explicitCompletedToday;
    }
    const todayStr = getTodayIsoDate(now);
    const state = this.getState();
    if (state.lastCompletedDate === todayStr) {
      return true;
    }
    const streak = getStreakData();
    return streak.lastActiveDate === todayStr;
  }

  static markDailyActivityCompleted(now: Date = new Date()): void {
    const todayStr = getTodayIsoDate(now);
    const current = this.getState();
    this.saveState({
      ...current,
      lastCompletedDate: todayStr,
    });
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  static setEnabled(enabled: boolean): WebDailyReminderState {
    const next = { ...this.getState(), enabled };
    this.saveState(next);
    if (!enabled && this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    return next;
  }

  /**
   * Dispatches a browser Notification (if permitted) and returns true if a proactive
   * 5-minute session suggestion was triggered.
   */
  static triggerProactive5MinSuggestion(onSessionStart?: () => void): boolean {
    if (typeof window === "undefined") return false;

    const todayStr = getTodayIsoDate();
    const state = this.getState();
    this.saveState({
      ...state,
      lastProactiveNudgeDate: todayStr,
    });

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification("☀️ Ready for a 5-Minute LifeBook Session?", {
          body: "It's past 9:00 AM and you haven't completed today's reflection yet. Take 5 quiet minutes with Scripture and prayer.",
          icon: "/favicon.ico",
          tag: "lifebook-proactive-9am-reminder",
        });
        if (onSessionStart) {
          notif.onclick = () => {
            window.focus();
            onSessionStart();
          };
        }
      } catch {
        // Fallback to in-app suggestion banner
      }
    }

    return true;
  }

  /**
   * Evaluates whether the user has completed their daily activity by 9:00 AM.
   * If it is before 9:00 AM and incomplete, schedules a timer for 9:00 AM.
   * If it is 9:00 AM or later and incomplete, proactively suggests a 5-minute session.
   */
  static evaluateDailyActivity(options?: {
    completedToday?: boolean;
    now?: Date;
    onSuggestSession?: () => void;
  }): {
    shouldShowSuggestion: boolean;
    completedToday: boolean;
    scheduledFor9Am: boolean;
  } {
    const now = options?.now ?? new Date();
    const todayStr = getTodayIsoDate(now);
    const state = this.getState();
    const completedToday = this.hasCompletedDailyActivityToday(options?.completedToday, now);

    if (completedToday) {
      if (state.lastCompletedDate !== todayStr) {
        this.markDailyActivityCompleted(now);
      }
      return {
        shouldShowSuggestion: false,
        completedToday: true,
        scheduledFor9Am: state.enabled,
      };
    }

    if (!state.enabled) {
      return {
        shouldShowSuggestion: false,
        completedToday: false,
        scheduledFor9Am: false,
      };
    }

    const targetToday = new Date(now);
    targetToday.setHours(state.targetHour, state.targetMinute, 0, 0);

    if (now.getTime() >= targetToday.getTime()) {
      // Past 9:00 AM and daily activity is incomplete
      const alreadyNudged = state.lastProactiveNudgeDate === todayStr;
      if (!alreadyNudged) {
        this.triggerProactive5MinSuggestion(options?.onSuggestSession);
      }
      return {
        shouldShowSuggestion: true,
        completedToday: false,
        scheduledFor9Am: true,
      };
    }

    // Before 9:00 AM: schedule proactive check for 9:00 AM
    if (typeof window !== "undefined") {
      if (this.timerId !== null) {
        clearTimeout(this.timerId);
      }
      const msUntil9Am = targetToday.getTime() - now.getTime();
      this.timerId = setTimeout(() => {
        if (!this.hasCompletedDailyActivityToday()) {
          this.triggerProactive5MinSuggestion(options?.onSuggestSession);
          if (options?.onSuggestSession) {
            options.onSuggestSession();
          }
        }
      }, msUntil9Am);
    }

    return {
      shouldShowSuggestion: false,
      completedToday: false,
      scheduledFor9Am: true,
    };
  }
}

export default DailyReminder;
