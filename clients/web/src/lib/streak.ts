export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  sabbathRestDays: number;
  graceShieldActive: boolean;
  history: string[]; // List of active date strings YYYY-MM-DD
}

export interface MilestoneInfo {
  currentStreak: number;
  nextMilestoneDays: number;
  prevMilestoneDays: number;
  progressPercent: number;
  daysRemaining: number;
  title: string;
  badgeReward: string;
}

export const STREAK_STORAGE_KEY = "lifebook.streak.data";
export const STREAK_CHANGE_EVENT = "lifebook.streak.change";

export const STREAK_MILESTONES = [
  { days: 3, title: "First Flame", badge: "Bronze Spark" },
  { days: 7, title: "Sabbath Cadence", badge: "Silver Cadence" },
  { days: 14, title: "Fortnight of Grace", badge: "Grace Pillar" },
  { days: 21, title: "Habit Transformation", badge: "Deep Roots" },
  { days: 30, title: "Monthly Sanctuary", badge: "Gold Anchor" },
  { days: 60, title: "Steadfast Walk", badge: "Steadfast Light" },
  { days: 100, title: "Centurion of Faith", badge: "Sacred Flame" },
  { days: 365, title: "Perpetual Flame", badge: "Crown of Glory" },
];

/**
 * Generate 14-day default consecutive history ending today
 */
function generateDefaultStreakData(): StreakData {
  const history: string[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    history.push(d.toISOString().slice(0, 10));
  }

  return {
    currentStreak: 14,
    longestStreak: 21,
    lastActiveDate: today.toISOString().slice(0, 10),
    sabbathRestDays: 2,
    graceShieldActive: true,
    history,
  };
}

/**
 * Retrieve current streak data from localStorage or initialize with 14-day streak.
 */
export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return generateDefaultStreakData();
  }

  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) {
      const initial = generateDefaultStreakData();
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.currentStreak === "number") {
      return parsed as StreakData;
    }
  } catch {
    // fallback
  }

  const fallback = generateDefaultStreakData();
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(fallback));
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Persist updated streak data and dispatch update event.
 */
export function saveStreakData(data: StreakData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(STREAK_CHANGE_EVENT, { detail: data }));
  } catch {
    // ignore
  }
}

/**
 * Record a devotional activity for today and update the streak if needed.
 */
export function recordDailyActivity(isSabbath: boolean = false): StreakData {
  const current = getStreakData();
  const todayStr = new Date().toISOString().slice(0, 10);

  if (current.lastActiveDate === todayStr) {
    return current;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = current.currentStreak;

  if (current.lastActiveDate === yesterdayStr) {
    newStreak += 1;
  } else if (current.lastActiveDate !== todayStr) {
    // Check if within 2 days with sabbath rest
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

    if (current.lastActiveDate === twoDaysAgoStr && current.graceShieldActive) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  const updated: StreakData = {
    ...current,
    currentStreak: newStreak,
    longestStreak: Math.max(current.longestStreak, newStreak),
    lastActiveDate: todayStr,
    sabbathRestDays: isSabbath ? current.sabbathRestDays + 1 : current.sabbathRestDays,
    graceShieldActive: true,
    history: current.history.includes(todayStr) ? current.history : [...current.history, todayStr],
  };

  saveStreakData(updated);
  return updated;
}

/**
 * Calculate dynamic milestone progress for UI progress bar
 */
export function getMilestoneProgress(currentStreak: number): MilestoneInfo {
  // Find the next milestone strictly greater than currentStreak
  const next = STREAK_MILESTONES.find((m) => m.days > currentStreak);
  const prev = [...STREAK_MILESTONES].reverse().find((m) => m.days <= currentStreak);

  if (!next) {
    const last = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
    return {
      currentStreak,
      nextMilestoneDays: last.days,
      prevMilestoneDays: last.days,
      progressPercent: 100,
      daysRemaining: 0,
      title: last.title,
      badgeReward: last.badge,
    };
  }

  const prevDays = prev ? prev.days : 0;
  const totalSpan = next.days - prevDays;
  const currentSpan = Math.max(0, currentStreak - prevDays);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentSpan / totalSpan) * 100)));
  const daysRemaining = Math.max(0, next.days - currentStreak);

  return {
    currentStreak,
    nextMilestoneDays: next.days,
    prevMilestoneDays: prevDays,
    progressPercent,
    daysRemaining,
    title: next.title,
    badgeReward: next.badge,
  };
}
