'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DayActivityRecord } from '../components/ProgressScreen';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  activeStreakDates: Set<string>;
  todayActive: boolean;
  yesterdayActive: boolean;
  last7Days: Array<{
    dateStr: string;
    dayLabel: string;
    dayNumber: number;
    active: boolean;
    isToday: boolean;
    isSabbath?: boolean;
    minutes?: number;
  }>;
  streakTier: {
    title: string;
    badgeIcon: string;
    color: string;
    bg: string;
    border: string;
  };
  nextMilestone: {
    targetDays: number;
    title: string;
    daysLeft: number;
    progressPercent: number;
    icon: string;
  };
}

export function isRecordActive(rec?: DayActivityRecord): boolean {
  if (!rec) return false;
  return Boolean(
    rec.intensity > 0 ||
    rec.isSabbathRest ||
    rec.scriptureRead ||
    rec.prayerCompleted ||
    rec.stillnessPractice ||
    rec.journalWritten
  );
}

export function calculateConsecutiveStreak(records: Record<string, DayActivityRecord>): StreakData {
  const d = new Date();
  const todayKey = d.toISOString().slice(0, 10);
  const todayRec = records[todayKey];
  const todayActive = isRecordActive(todayRec);

  // Check yesterday
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yKey = yDate.toISOString().slice(0, 10);
  const yRec = records[yKey];
  const yesterdayActive = isRecordActive(yRec);

  let streak = 0;
  const streakDates = new Set<string>();

  // If today is not active, streak is maintained if yesterday was active
  let startOffset = 0;
  if (!todayActive) {
    if (yesterdayActive) {
      startOffset = 1;
    } else {
      streak = 0;
    }
  }

  if (todayActive || yesterdayActive) {
    for (let i = startOffset; i < 365; i++) {
      const checkD = new Date();
      checkD.setDate(checkD.getDate() - i);
      const k = checkD.toISOString().slice(0, 10);
      const rec = records[k];
      if (isRecordActive(rec)) {
        streak++;
        streakDates.add(k);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak from historical records
  let maxFoundStreak = streak;
  const sortedDates = Object.keys(records)
    .filter(k => isRecordActive(records[k]))
    .sort();

  if (sortedDates.length > 0) {
    let currentRun = 0;
    let prevDate: Date | null = null;
    for (const dateStr of sortedDates) {
      const curDate = new Date(dateStr + 'T12:00:00');
      if (prevDate) {
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentRun++;
        } else if (diffDays > 1) {
          currentRun = 1;
        }
      } else {
        currentRun = 1;
      }
      prevDate = curDate;
      if (currentRun > maxFoundStreak) {
        maxFoundStreak = currentRun;
      }
    }
  }

  // Read saved longest streak if exists
  let savedLongest = 0;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('lifebook.longestStreak');
      if (saved) savedLongest = parseInt(saved, 10) || 0;
    } catch {
      // ignore
    }
  }
  const longestStreak = Math.max(streak, maxFoundStreak, savedLongest);

  // Save new longest if updated
  if (typeof window !== 'undefined' && longestStreak > savedLongest) {
    try {
      localStorage.setItem('lifebook.longestStreak', String(longestStreak));
    } catch {
      // ignore
    }
  }

  // Build last 7 days visual track
  const last7Days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() - i);
    const dateStr = dayDate.toISOString().slice(0, 10);
    const rec = records[dateStr];
    const active = isRecordActive(rec);
    last7Days.push({
      dateStr,
      dayLabel: dayNames[dayDate.getDay()],
      dayNumber: dayDate.getDate(),
      active,
      isToday: dateStr === todayKey,
      isSabbath: Boolean(rec?.isSabbathRest),
    });
  }

  // Determine tier
  let streakTier = {
    title: 'Pilgrim Step',
    badgeIcon: '🌱',
    color: '#8C7D9E',
    bg: 'bg-[#F5F2F9]',
    border: 'border-[#E0D8EB]',
  };
  if (streak >= 30) {
    streakTier = {
      title: 'Diamond Pillar',
      badgeIcon: '💎',
      color: '#9C74E8',
      bg: 'bg-[#F7F3FF]',
      border: 'border-[#D9C4FF]',
    };
  } else if (streak >= 14) {
    streakTier = {
      title: 'Golden Anchor',
      badgeIcon: '👑',
      color: '#E3B15E',
      bg: 'bg-[#FFF8EB]',
      border: 'border-[#F4D99B]',
    };
  } else if (streak >= 7) {
    streakTier = {
      title: 'Silver Cadence',
      badgeIcon: '🌿',
      color: '#1FB6B0',
      bg: 'bg-[#EDFAF9]',
      border: 'border-[#A3E5E2]',
    };
  } else if (streak >= 3) {
    streakTier = {
      title: 'Bronze Spark',
      badgeIcon: '🔥',
      color: '#E07A5F',
      bg: 'bg-[#FDF4F2]',
      border: 'border-[#F8CEC4]',
    };
  }

  // Next milestone
  const MILESTONES = [
    { targetDays: 3, title: 'First Flame', icon: '🔥' },
    { targetDays: 7, title: '7-Day Sabbath Rhythm', icon: '🌿' },
    { targetDays: 14, title: 'Fortnight of Faith', icon: '🌱' },
    { targetDays: 21, title: 'Habit of Grace', icon: '💎' },
    { targetDays: 30, title: 'Monthly Pillar', icon: '👑' },
  ];

  const next = MILESTONES.find(m => streak < m.targetDays) || {
    targetDays: streak + 10,
    title: 'Sanctuary Master',
    icon: '✨',
  };

  const daysLeft = Math.max(0, next.targetDays - streak);
  const prevTarget = MILESTONES[MILESTONES.indexOf(next) - 1]?.targetDays || 0;
  const progressPercent = Math.min(
    100,
    Math.round(((streak - prevTarget) / Math.max(1, next.targetDays - prevTarget)) * 100)
  );

  return {
    currentStreak: streak,
    longestStreak,
    activeStreakDates: streakDates,
    todayActive,
    yesterdayActive,
    last7Days,
    streakTier,
    nextMilestone: {
      targetDays: next.targetDays,
      title: next.title,
      daysLeft,
      progressPercent,
      icon: next.icon,
    },
  };
}

export function useDevotionalStreak(providedRecords?: Record<string, DayActivityRecord>): StreakData {
  const [localRecords, setLocalRecords] = useState<Record<string, DayActivityRecord>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.calendar.streakHistory');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  useEffect(() => {
    if (providedRecords) return;

    const loadRecords = () => {
      try {
        const saved = localStorage.getItem('lifebook.calendar.streakHistory');
        if (saved) {
          setLocalRecords(JSON.parse(saved));
        } else {
          setLocalRecords({});
        }
      } catch {
        // ignore
      }
    };

    loadRecords();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lifebook.calendar.streakHistory') {
        loadRecords();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('lifebook-streak-updated', loadRecords);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('lifebook-streak-updated', loadRecords);
    };
  }, [providedRecords]);

  const activeRecords = providedRecords ?? localRecords;

  return useMemo(() => {
    return calculateConsecutiveStreak(activeRecords);
  }, [activeRecords]);
}
