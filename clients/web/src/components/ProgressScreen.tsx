"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { VisualStreakCounter } from "./VisualStreakCounter";
import { WeeklyConsistencyCard } from "./WeeklyConsistencyCard";
import { DailyDevotionGoalCard } from "./DailyDevotionGoalCard";
import { DailyGoalCard } from "./DailyGoalCard";
import { VisualMoodUpdateCard } from "./VisualMoodUpdateCard";
import { MonthlyMoodHeatmap } from "./MonthlyMoodHeatmap";
import { WeeklyInsightChart } from "./WeeklyInsightChart";
import { MoodTrendsAnalytics } from "./MoodTrendsAnalytics";
import { RecurringEmotionalPatternsSummary } from "./RecurringEmotionalPatternsSummary";
import { StreakGamificationCard } from "./StreakGamificationCard";
import { StreakMilestoneProgressBarCard } from "./StreakMilestoneProgressBarCard";
import { VisualRewardsBadgesCard } from "./VisualRewardsBadgesCard";
import { BurnoutPreventionCard } from "./BurnoutPreventionCard";
import { JourneyGraceProtectionCard } from "./JourneyGraceProtectionCard";
import { DynamicMoodJournal } from "./DynamicMoodJournal";
import { JournalSearchBar } from "./JournalSearchBar";
import {
  NotificationSettingsModal,
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "./NotificationSettingsModal";
import { BadgeCelebrationModal, type BadgeCelebrationData } from "./BadgeCelebrationModal";
import { StreakMilestoneAnimation } from "./StreakMilestoneAnimation";
import { useDevotionalStreak } from "@/lib/streak-utils";
import type { SpiritualPulseData } from "../app/api/spiritual-pulse/send/route";
import {
  Sparkle,
  Fire,
  BookOpenText,
  Trophy,
  CalendarBlank,
  BellRinging,
} from "@phosphor-icons/react";

export interface MoodItem {
  id: "grateful" | "peaceful" | "seeking" | "convicted" | "doubting" | "distant";
  label: string;
  emoji: string;
  color: string;
  desc: string;
  level: number;
}

export const MOODS: MoodItem[] = [
  {
    id: "grateful",
    label: "Grateful",
    emoji: "🙏",
    color: "#E3B15E",
    desc: "Thankful for daily providence and answered prayer",
    level: 6,
  },
  {
    id: "peaceful",
    label: "Peaceful",
    emoji: "🕊️",
    color: "#37C6C2",
    desc: "Resting in quiet trust and unhurried stillness",
    level: 5,
  },
  {
    id: "seeking",
    label: "Seeking",
    emoji: "🔍",
    color: "#7B62B8",
    desc: "Hungering for wisdom, clarity, and guidance",
    level: 4,
  },
  {
    id: "convicted",
    label: "Convicted",
    emoji: "🕯️",
    color: "#B8746B",
    desc: "Returning to grace with an honest, contrite heart",
    level: 3,
  },
  {
    id: "doubting",
    label: "Doubting",
    emoji: "🤔",
    color: "#6B8CAE",
    desc: "Bringing honest questions before the Lord",
    level: 2,
  },
  {
    id: "distant",
    label: "Distant",
    emoji: "🌫️",
    color: "#5B5580",
    desc: "Longing for renewed nearness in a dry season",
    level: 1,
  },
];

export interface DayActivityRecord {
  date: string;
  dayLabel: string;
  mood: MoodItem["id"] | null;
  intensity: number;
  scriptureRead: boolean;
  prayerCompleted: boolean;
  stillnessPractice: boolean;
  journalWritten: boolean;
  isSabbathRest?: boolean;
  sabbathNote?: string;
  note?: string;
  reflectionSnippet?: string;
  scriptureRef?: string;
}

export interface StreakMilestone {
  id: string;
  days: number;
  title: string;
  description: string;
  tier: string;
  icon: string;
  scripture: string;
  scriptureRef: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    id: "streak-3",
    days: 3,
    title: "First Flame",
    description: "Three consecutive days of quiet scripture meditation and prayer.",
    tier: "Bronze Spark",
    icon: "🔥",
    scripture: "Draw near to God, and he will draw near to you.",
    scriptureRef: "James 4:8",
  },
  {
    id: "streak-7",
    days: 7,
    title: "7-Day Sabbath Rhythm",
    description: "One full week of abiding in the Living Word.",
    tier: "Silver Cadence",
    icon: "🌿",
    scripture: "Be still, and know that I am God.",
    scriptureRef: "Psalm 46:10",
  },
  {
    id: "streak-14",
    days: 14,
    title: "Fortnight of Faith",
    description: "Fourteen days of rooted consistency in daily stillness.",
    tier: "Golden Anchor",
    icon: "🌱",
    scripture: "Your word is a lamp to my feet and a light to my path.",
    scriptureRef: "Psalm 119:105",
  },
  {
    id: "streak-21",
    days: 21,
    title: "Sanctuary Habit",
    description: "Twenty-one days forming a resilient devotional rhythm.",
    tier: "Golden Anchor",
    icon: "💎",
    scripture: "Whoever abides in me and I in him, he it is that bears much fruit.",
    scriptureRef: "John 15:5",
  },
  {
    id: "streak-30",
    days: 30,
    title: "Pillar of Stillness",
    description: "Thirty days of faithful communion and scripture reflection.",
    tier: "Diamond Pillar",
    icon: "👑",
    scripture: "Those who wait for the Lord shall renew their strength.",
    scriptureRef: "Isaiah 40:31",
  },
];

export interface Badge {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  requirement: string;
  category: string;
  tier: string;
  tierLabel?: string;
  tierColor?: string;
  icon: string;
  badgeEmoji?: string;
  primaryColor?: string;
  accentColor?: string;
  earned: boolean;
  rewardPoints: number;
  currentProgress?: number;
  targetProgress?: number;
  scripture?: string;
  scriptureRef?: string;
  reflection?: string;
  unlockedPerks?: string[];
}

export interface JournalEntry {
  id: string;
  text: string;
  date: string;
  timestamp?: number;
  mood?: MoodItem["id"] | "sabbath";
  moodEmoji?: string;
  moodLabel?: string;
  moodColor?: string;
  scriptureRef?: string;
  scriptureSnippet?: string;
  promptUsed?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface ProgressScreenProps {
  streak?: number;
  completedChaptersCount?: number;
  versesSpoken?: number;
  reflectionsCount?: number;
}

function buildSeedCalendarRecords(): Record<string, DayActivityRecord> {
  const records: Record<string, DayActivityRecord> = {};
  const moodsCycle: MoodItem["id"][] = [
    "peaceful",
    "grateful",
    "seeking",
    "peaceful",
    "grateful",
    "convicted",
    "peaceful",
  ];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isActive = i <= 6 || i % 2 === 0;
    const mood = isActive ? moodsCycle[i % moodsCycle.length] : null;
    records[dateStr] = {
      date: dateStr,
      dayLabel,
      mood,
      intensity: isActive ? (i === 0 ? 4 : 3) : 0,
      scriptureRead: isActive,
      prayerCompleted: isActive,
      stillnessPractice: isActive && i % 3 !== 0,
      journalWritten: isActive && i <= 4,
      isSabbathRest: d.getDay() === 0 && i > 0,
      reflectionSnippet:
        i === 0
          ? "Resting in Psalm 23 still waters before beginning the day's work."
          : undefined,
      scriptureRef: i === 0 ? "Psalm 23:1-3" : undefined,
    };
  }
  return records;
}

const DEFAULT_BADGES: Badge[] = [
  {
    id: "badge-faithful-week",
    title: "Faithful Week",
    subtitle: "7 Consecutive Days of Quiet Time",
    description: "Completed a full seven-day week of Scripture reading, reflection, and prayer.",
    requirement: "Maintain a 7-day devotional streak",
    category: "streak",
    tier: "silver",
    tierLabel: "Silver Seal",
    tierColor: "#37C6C2",
    icon: "🌿",
    badgeEmoji: "🌿",
    primaryColor: "#1FB6B0",
    accentColor: "#37C6C2",
    earned: true,
    rewardPoints: 150,
    currentProgress: 7,
    targetProgress: 7,
    scripture: "Be still, and know that I am God.",
    scriptureRef: "Psalm 46:10",
    reflection: "Seven days of choosing stillness over hurry.",
    unlockedPerks: ["+150 Grace Points", "Silver Sanctuary Seal"],
  },
  {
    id: "badge-psalm-pilgrim",
    title: "Psalm 23 Pilgrim",
    subtitle: "Anchored in the Shepherd's Care",
    description: "Meditated on the Psalms and recorded honest heart check-ins across the week.",
    requirement: "Complete 5 Scripture check-ins",
    category: "faith",
    tier: "gold",
    tierLabel: "Golden Crown",
    tierColor: "#E3B15E",
    icon: "📖",
    badgeEmoji: "✨",
    primaryColor: "#E3B15E",
    accentColor: "#F28C38",
    earned: true,
    rewardPoints: 200,
    currentProgress: 5,
    targetProgress: 5,
    scripture: "The Lord is my shepherd; I shall not want.",
    scriptureRef: "Psalm 23:1",
    reflection: "Walking beside still waters in daily trust.",
    unlockedPerks: ["+200 Grace Points", "Golden Shepherd Crown"],
  },
  {
    id: "badge-sabbath-keeper",
    title: "Sabbath Rest Keeper",
    subtitle: "Honoring Unhurried Grace",
    description: "Practiced holy Sabbath rest without guilt or spiritual burnout.",
    requirement: "Honor 1 Sabbath rest day",
    category: "grace",
    tier: "gold",
    tierLabel: "Grace Seal",
    tierColor: "#9A82D4",
    icon: "🕊️",
    badgeEmoji: "🕊️",
    primaryColor: "#7B62B8",
    accentColor: "#9A82D4",
    earned: true,
    rewardPoints: 120,
    currentProgress: 1,
    targetProgress: 1,
    scripture: "Come to me, all who labor and are heavy laden, and I will give you rest.",
    scriptureRef: "Matthew 11:28",
    reflection: "Receiving God's gift of rest.",
    unlockedPerks: ["+120 Grace Points", "Grace Shield Bonus"],
  },
  {
    id: "badge-monthly-pillar",
    title: "Monthly Reflection Pillar",
    subtitle: "30 Days of Abiding Communion",
    description: "Sustained a 30-day rhythm of Scripture, prayer, and honest soul journaling.",
    requirement: "Reach a 30-day devotional streak",
    category: "streak",
    tier: "diamond",
    tierLabel: "Diamond Crown",
    tierColor: "#E3B15E",
    icon: "👑",
    badgeEmoji: "👑",
    primaryColor: "#E3B15E",
    accentColor: "#37C6C2",
    earned: false,
    rewardPoints: 500,
    currentProgress: 7,
    targetProgress: 30,
    scripture: "Those who wait for the Lord shall renew their strength.",
    scriptureRef: "Isaiah 40:31",
    reflection: "Rooted and built up in Christ.",
    unlockedPerks: ["+500 Grace Points", "Diamond Sanctuary Seal"],
  },
];

export function ProgressScreen({
  streak: propStreak,
  completedChaptersCount = 14,
  versesSpoken = 28,
  reflectionsCount = 12,
}: ProgressScreenProps = {}) {
  const { isFr } = useLanguage();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "heatmap" | "milestones" | "journal"
  >("overview");

  const [calendarRecords, setCalendarRecords] = useState<Record<string, DayActivityRecord>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lifebook.calendar.streakHistory");
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return buildSeedCalendarRecords();
  });

  const [gracePoints, setGracePoints] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lifebook.gracePoints");
        if (saved) return parseInt(saved, 10) || 480;
      } catch {
        // fallback
      }
    }
    return 480;
  });

  const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES);
  const [celebratingBadge, setCelebratingBadge] = useState<BadgeCelebrationData | null>(null);
  const [celebratingMilestoneDays, setCelebratingMilestoneDays] = useState<number | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: "j-seed-1",
      text: "Lord, thank You for quieting my hurry this morning through Psalm 23. Help me carry Your peace into every conversation today.",
      date: `${todayStr} · 07:30 AM`,
      timestamp: Date.now() - 3600 * 1000,
      mood: "peaceful",
      moodEmoji: "🕊️",
      moodLabel: "Peaceful",
      moodColor: "#37C6C2",
      scriptureRef: "Psalm 23:1-3",
      scriptureSnippet: "He leads me beside still waters. He restores my soul.",
      tags: ["#Peace", "#Stillness", "#MorningDevotion"],
      isFavorite: true,
    },
    {
      id: "j-seed-2",
      text: "Grateful for unexpected provision this week and the reminder from Lamentations 3 that His mercies are new every morning.",
      date: "Yesterday · 08:15 PM",
      timestamp: Date.now() - 86400 * 1000,
      mood: "grateful",
      moodEmoji: "🙏",
      moodLabel: "Grateful",
      moodColor: "#E3B15E",
      scriptureRef: "Lamentations 3:22-23",
      scriptureSnippet: "His mercies never come to an end; they are new every morning.",
      tags: ["#Gratitude", "#Mercy"],
      isFavorite: false,
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lifebook.calendar.streakHistory", JSON.stringify(calendarRecords));
      } catch {
        // ignore
      }
    }
  }, [calendarRecords]);

  const streakData = useDevotionalStreak(calendarRecords);
  const currentStreak = propStreak ?? streakData.currentStreak;
  const longestStreak = Math.max(currentStreak, streakData.longestStreak);
  const todayRecord = calendarRecords[todayStr];

  const handleUpdateRecord = (dateStr: string, updated: DayActivityRecord) => {
    setCalendarRecords((prev) => ({
      ...prev,
      [dateStr]: updated,
    }));
  };

  const handleTogglePractice = (
    practiceKey: "scriptureRead" | "prayerCompleted" | "journalWritten"
  ) => {
    const existing = calendarRecords[todayStr] || {
      date: todayStr,
      dayLabel: "Today",
      mood: "peaceful",
      intensity: 1,
      scriptureRead: false,
      prayerCompleted: false,
      stillnessPractice: false,
      journalWritten: false,
    };
    const nextVal = !existing[practiceKey];
    const updated: DayActivityRecord = {
      ...existing,
      [practiceKey]: nextVal,
    };
    let score = 0;
    if (updated.scriptureRead) score++;
    if (updated.prayerCompleted) score++;
    if (updated.stillnessPractice) score++;
    if (updated.journalWritten) score++;
    updated.intensity = Math.max(1, score);
    handleUpdateRecord(todayStr, updated);
  };

  const handleHonorSabbath = (dateStr: string = todayStr) => {
    const existing = calendarRecords[dateStr] || {
      date: dateStr,
      dayLabel: "Today",
      mood: "peaceful",
      intensity: 1,
      scriptureRead: true,
      prayerCompleted: true,
      stillnessPractice: true,
      journalWritten: false,
    };
    handleUpdateRecord(dateStr, {
      ...existing,
      isSabbathRest: true,
      intensity: Math.max(1, existing.intensity),
    });
  };

  const handleCancelSabbath = (dateStr: string = todayStr) => {
    const existing = calendarRecords[dateStr];
    if (!existing) return;
    handleUpdateRecord(dateStr, {
      ...existing,
      isSabbathRest: false,
    });
  };

  const handleCheckInMood = (moodId: MoodItem["id"], dateStr: string = todayStr) => {
    const existing = calendarRecords[dateStr] || {
      date: dateStr,
      dayLabel: "Today",
      mood: moodId,
      intensity: 2,
      scriptureRead: true,
      prayerCompleted: true,
      stillnessPractice: false,
      journalWritten: false,
    };
    handleUpdateRecord(dateStr, {
      ...existing,
      mood: moodId,
      intensity: Math.max(1, existing.intensity),
    });
  };

  const pulseData: SpiritualPulseData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const rec = calendarRecords[dStr];
      const moodObj = MOODS.find((m) => m.id === rec?.mood) || MOODS[1];
      days.push({
        date: dStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "long" }),
        formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        mood: rec?.mood || "peaceful",
        moodLabel: moodObj.label,
        moodEmoji: moodObj.emoji,
        moodColor: moodObj.color,
        intensity: rec?.intensity ?? 2,
        practices: {
          scriptureRead: Boolean(rec?.scriptureRead),
          stillnessMinutes: rec?.stillnessPractice ? 10 : 5,
          prayerOffered: Boolean(rec?.prayerCompleted),
          journalWritten: Boolean(rec?.journalWritten),
        },
      });
    }
    return {
      startDate: days[0].date,
      endDate: days[days.length - 1].date,
      dateRangeFormatted: `${days[0].formattedDate} – ${days[days.length - 1].formattedDate}`,
      totalCheckIns: 7,
      consistencyRate: 92,
      currentStreak,
      longestStreak,
      dominantMood: {
        id: "peaceful",
        label: "Peaceful",
        emoji: "🕊️",
        color: "#37C6C2",
        count: 4,
        percentage: 57,
        insight: "Your heart has consistently anchored in quiet trust during morning stillness.",
      },
      moodCounts: {
        peaceful: { label: "Peaceful", emoji: "🕊️", count: 4, color: "#37C6C2" },
        grateful: { label: "Grateful", emoji: "🙏", count: 2, color: "#E3B15E" },
        seeking: { label: "Seeking", emoji: "🔍", count: 1, color: "#7B62B8" },
      },
      days,
      milestonesUnlocked: [
        { days: 3, title: "First Flame", icon: "🔥", tier: "Bronze Spark" },
        { days: 7, title: "7-Day Sabbath Rhythm", icon: "🌿", tier: "Silver Cadence" },
      ],
      nextMilestone: {
        days: 14,
        title: "Fortnight of Faith",
        icon: "🌱",
        tier: "Golden Anchor",
        daysRemaining: Math.max(1, 14 - currentStreak),
        progressPercentage: Math.min(100, Math.round((currentStreak / 14) * 100)),
      },
      practicesTotals: {
        scriptureDays: completedChaptersCount,
        stillnessMinutes: 45,
        prayersOffered: versesSpoken,
        journalEntries: reflectionsCount + journalEntries.length,
      },
      weeklyScripture: {
        text: "The Lord is my shepherd; I shall not want. He leads me beside still waters.",
        reference: "Psalm 23:1-2",
      },
      pastoralEncouragement:
        "Keep returning to quietness each morning. God measures faithfulness by love, not hurry.",
    };
  }, [
    calendarRecords,
    currentStreak,
    longestStreak,
    completedChaptersCount,
    versesSpoken,
    reflectionsCount,
    journalEntries.length,
  ]);

  const handleTriggerBadgeCelebration = (b: Badge) => {
    setCelebratingBadge({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || b.tier,
      tier: b.tierLabel || b.tier,
      tierColor: b.tierColor || "#E3B15E",
      icon: b.icon,
      badgeEmoji: b.badgeEmoji || b.icon,
      primaryColor: b.primaryColor || "#1FB6B0",
      accentColor: b.accentColor || "#E3B15E",
      rewardPoints: b.rewardPoints,
      scripture: b.scripture || "Be still, and know that I am God.",
      scriptureRef: b.scriptureRef || "Psalm 46:10",
      reflection:
        b.reflection || "Your daily consistency builds a quiet sanctuary of faith and peace.",
      unlockedPerks: b.unlockedPerks || [`+${b.rewardPoints} Grace Points`, "Sanctuary Seal"],
    });
  };

  const handleUnlockBadgeDirectly = (badgeId: string) => {
    setBadges((prev) =>
      prev.map((b) =>
        b.id === badgeId
          ? { ...b, earned: true, currentProgress: b.targetProgress ?? 1 }
          : b
      )
    );
    const target = badges.find((b) => b.id === badgeId);
    if (target) {
      handleTriggerBadgeCelebration({ ...target, earned: true });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Spiritual Progress & Sanctuary Metrics Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1E1931] via-[#2A2146] to-[#153B44] p-6 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#37C6C2]/20 border border-[#37C6C2]/40 text-[#4EE2D8] text-[11px] font-extrabold uppercase tracking-widest">
              <Sparkle weight="duotone" className="w-3.5 h-3.5 text-[#4EE2D8]" />
              <span>{isFr ? "Parcours Spirituel & Rythme" : "Spiritual Progress & Soul Rhythm"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white mt-2">
              {isFr ? "Votre Sanctuaire de Croissance" : "Your Sanctuary Growth & Soul Tapestry"}
            </h2>
            <p className="text-xs sm:text-sm text-[#D1C7E6] mt-1 max-w-2xl">
              {isFr
                ? "Suivez vos habitudes de prière, votre carte thermique émotionnelle, vos jalons de grâce et votre journal privé sans culpabilité."
                : "Track your 5-minute morning devotion habit, monthly emotional heatmap, grace-shielded streaks, and private prayer reflections."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#37C6C2] block">
                {isFr ? "Série Active" : "Active Streak"}
              </span>
              <span className="text-2xl font-serif font-bold text-white tabular-nums">
                {currentStreak}d 🔥
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3B15E] block">
                {isFr ? "Points de Grâce" : "Grace Points"}
              </span>
              <span className="text-2xl font-serif font-bold text-[#E3B15E] tabular-nums">
                {gracePoints} GP
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5BCD9] block">
                {isFr ? "Chapitres Lus" : "Chapters Read"}
              </span>
              <span className="text-2xl font-serif font-bold text-white tabular-nums">
                {completedChaptersCount} 📖
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4EE2D8] block">
                {isFr ? "Réflexions" : "Reflections"}
              </span>
              <span className="text-2xl font-serif font-bold text-white tabular-nums">
                {journalEntries.length + reflectionsCount} ✍️
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: "overview" as const,
                label: isFr ? "Vue d'ensemble & Habitudes" : "Overview & Daily Habits",
                icon: "🌿",
              },
              {
                id: "heatmap" as const,
                label: isFr ? "Carte Émotionnelle & Tendances" : "Mood Heatmap & Analytics",
                icon: "🎨",
              },
              {
                id: "milestones" as const,
                label: isFr ? "Jalons, Badges & Repos" : "Streaks, Badges & Grace",
                icon: "👑",
              },
              {
                id: "journal" as const,
                label: isFr ? "Journal de l'Âme" : "Dynamic Soul Journal",
                icon: "📖",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSubTab === tab.id
                    ? "bg-[#1FB6B0] text-[#082220] shadow-md"
                    : "bg-white/10 text-white/85 hover:bg-white/20"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsNotificationModalOpen(true)}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#F7CB7A] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BellRinging weight="duotone" className="w-4 h-4 text-[#F7CB7A]" />
            <span>
              {isFr ? "Rappel Quotidien" : "Daily Reminder"} ({notificationSettings.time})
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & DAILY HABITS */}
      {activeSubTab === "overview" && (
        <div className="space-y-8">
          <VisualStreakCounter
            variant="hero"
            records={calendarRecords}
            showWeeklyDots
            showMilestoneProgress
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyDevotionGoalCard
              todayStr={todayStr}
              todayRecord={todayRecord}
              onUpdateRecord={handleUpdateRecord}
              onGracePointsAwarded={(pts) => setGracePoints((prev) => prev + pts)}
            />
            <DailyGoalCard
              todayStr={todayStr}
              gracePoints={gracePoints}
              onUpdateGracePoints={setGracePoints}
              todayRecord={todayRecord}
              onTogglePractice={handleTogglePractice}
            />
          </div>

          <WeeklyConsistencyCard
            calendarRecords={calendarRecords}
            todayStr={todayStr}
            onUpdateRecord={handleUpdateRecord}
            onGracePointsAwarded={(pts) => setGracePoints((prev) => prev + pts)}
          />

          <VisualMoodUpdateCard
            todayStr={todayStr}
            selectedDateStr={selectedDateStr}
            calendarRecords={calendarRecords}
            onUpdateRecord={handleUpdateRecord}
            onOpenJournal={() => setActiveSubTab("journal")}
            onSelectDate={setSelectedDateStr}
          />
        </div>
      )}

      {/* TAB 2: MOOD HEATMAP & ANALYTICS */}
      {activeSubTab === "heatmap" && (
        <div className="space-y-8">
          <MonthlyMoodHeatmap
            calendarRecords={calendarRecords}
            onUpdateRecord={handleUpdateRecord}
            selectedDateStr={selectedDateStr}
            onSelectDate={setSelectedDateStr}
            todayStr={todayStr}
            activeStreakDates={streakData.activeStreakDates}
            onOpenJournal={() => setActiveSubTab("journal")}
            onOpenNotificationSettings={() => setIsNotificationModalOpen(true)}
            notificationReminderTime={notificationSettings.time}
          />

          <WeeklyInsightChart
            pulseData={pulseData}
            calendarRecords={calendarRecords}
            onSelectDate={setSelectedDateStr}
          />

          <MoodTrendsAnalytics
            calendarRecords={calendarRecords}
            onCheckInMood={(m) => handleCheckInMood(m)}
          />

          <RecurringEmotionalPatternsSummary
            calendarRecords={calendarRecords}
            journalEntries={journalEntries}
            onSelectDate={setSelectedDateStr}
            onOpenJournal={() => setActiveSubTab("journal")}
          />
        </div>
      )}

      {/* TAB 3: STREAKS, BADGES & GRACE PROTECTION */}
      {activeSubTab === "milestones" && (
        <div className="space-y-8">
          <StreakMilestoneProgressBarCard
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            onCelebrateMilestone={(days) => setCelebratingMilestoneDays(days)}
          />

          <StreakGamificationCard
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            gracePoints={gracePoints}
            todayRecord={todayRecord}
            onUpdateGracePoints={setGracePoints}
            onTogglePractice={handleTogglePractice}
            onOpenJournal={() => setActiveSubTab("journal")}
            onTriggerMilestoneCelebration={(days) => setCelebratingMilestoneDays(days)}
          />

          <VisualRewardsBadgesCard
            badges={badges}
            currentStreak={currentStreak}
            gracePoints={gracePoints}
            onTriggerBadgeCelebration={handleTriggerBadgeCelebration}
            onUnlockBadgeDirectly={handleUnlockBadgeDirectly}
          />

          <BurnoutPreventionCard
            calendarRecords={calendarRecords}
            todayStr={todayStr}
            currentStreak={currentStreak}
            gracePoints={gracePoints}
            onHonorSabbath={handleHonorSabbath}
            onCancelSabbath={handleCancelSabbath}
            onOpenJournal={() => setActiveSubTab("journal")}
          />

          <JourneyGraceProtectionCard />
        </div>
      )}

      {/* TAB 4: DYNAMIC SOUL JOURNAL & SEARCH */}
      {activeSubTab === "journal" && (
        <div className="space-y-8">
          <JournalSearchBar
            entries={journalEntries}
            onOpenJournalTab={() => setActiveSubTab("journal")}
            onDeleteEntry={(id) =>
              setJournalEntries((prev) => prev.filter((item) => item.id !== id))
            }
            onToggleFavorite={(id) =>
              setJournalEntries((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
                )
              )
            }
          />

          <DynamicMoodJournal
            entries={journalEntries}
            todayStr={todayStr}
            todayRecord={todayRecord}
            onAddEntry={(entry) => {
              setJournalEntries((prev) => [entry, ...prev]);
              handleTogglePractice("journalWritten");
            }}
            onDeleteEntry={(id) =>
              setJournalEntries((prev) => prev.filter((item) => item.id !== id))
            }
            onToggleFavorite={(id) =>
              setJournalEntries((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
                )
              )
            }
            onCheckInMood={handleCheckInMood}
            onHonorSabbath={() => handleHonorSabbath(todayStr)}
          />
        </div>
      )}

      {/* Modals */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={notificationSettings}
        onSaveSettings={setNotificationSettings}
        onStartMoodCheckIn={(m) => {
          if (m) handleCheckInMood(m);
          setIsNotificationModalOpen(false);
        }}
        todayHasMoodLogged={Boolean(todayRecord?.mood)}
        todayMood={todayRecord?.mood}
      />

      <BadgeCelebrationModal
        badge={celebratingBadge}
        isOpen={Boolean(celebratingBadge)}
        onClose={() => setCelebratingBadge(null)}
        onClaimReward={(_id, pts) => setGracePoints((prev) => prev + pts)}
      />

      <StreakMilestoneAnimation
        milestoneDays={celebratingMilestoneDays}
        isOpen={Boolean(celebratingMilestoneDays)}
        onClose={() => setCelebratingMilestoneDays(null)}
        onClaimReward={(pts) => setGracePoints((prev) => prev + pts)}
      />
    </div>
  );
}

export default ProgressScreen;
