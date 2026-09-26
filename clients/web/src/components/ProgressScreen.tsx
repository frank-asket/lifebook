"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n";

export interface MoodItem {
  id: "grateful" | "peaceful" | "seeking" | "convicted" | "doubting" | "distant";
  label: string;
  emoji: string;
  color: string;
  desc: string;
}

export const MOODS: MoodItem[] = [
  {
    id: "grateful",
    label: "Grateful",
    emoji: "✦",
    color: "#B45309",
    desc: "Thankful for daily providence and answered prayer",
  },
  {
    id: "peaceful",
    label: "Peaceful",
    emoji: "○",
    color: "#0F766E",
    desc: "Resting in quiet trust and unhurried stillness",
  },
  {
    id: "seeking",
    label: "Seeking",
    emoji: "◇",
    color: "#4338CA",
    desc: "Hungering for wisdom, clarity, and guidance",
  },
  {
    id: "convicted",
    label: "Convicted",
    emoji: "△",
    color: "#9A3412",
    desc: "Returning to grace with an honest, contrite heart",
  },
  {
    id: "doubting",
    label: "Doubting",
    emoji: "□",
    color: "#334155",
    desc: "Bringing honest questions before the Lord",
  },
  {
    id: "distant",
    label: "Distant",
    emoji: "—",
    color: "#57534E",
    desc: "Longing for renewed nearness in a dry season",
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
  note?: string;
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

export function ProgressScreen({
  streak = 7,
  completedChaptersCount = 14,
  versesSpoken = 28,
  reflectionsCount = 12,
}: ProgressScreenProps = {}) {
  const { t, language } = useLanguage();
  const isFr = language === "fr";

  const stats = [
    {
      index: "I",
      label: t("dashboard.stats.streak"),
      value: streak,
      unit: t("dashboard.stats.days"),
    },
    {
      index: "II",
      label: t("dashboard.stats.chaptersRead"),
      value: completedChaptersCount,
      unit: "/ 1,189",
    },
    {
      index: "III",
      label: t("dashboard.stats.voiceSessions"),
      value: versesSpoken,
      unit: isFr ? "versets proclamés" : "verses spoken",
    },
    {
      index: "IV",
      label: t("dashboard.stats.reflections"),
      value: reflectionsCount,
      unit: isFr ? "entrées archivées" : "archived entries",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 border border-stone-300 dark:border-stone-800 rounded-lg bg-[#FAF8F5] dark:bg-[#161412] divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-800 overflow-hidden"
      aria-label={t("a11y.progressSummary")}
    >
      {stats.map((stat) => (
        <div key={stat.index} className="p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
            <span>{stat.label}</span>
            <span className="font-serif font-bold text-amber-900 dark:text-amber-400">
              {stat.index}.
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tabular-nums">
              {stat.value}
            </span>
            <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
              {stat.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProgressScreen;
