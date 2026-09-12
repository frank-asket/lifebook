"use client";

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import type { PulseDaySummary, SpiritualPulseData } from '../app/api/spiritual-pulse/send/route';
import { BurnoutPreventionCard } from './BurnoutPreventionCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export interface MoodItem {
  id: 'grateful' | 'peaceful' | 'seeking' | 'convicted' | 'doubting' | 'distant';
  label: string;
  emoji: string;
  desc: string;
  color: string;
  level: number;
}

export const MOODS: MoodItem[] = [
  { id: 'grateful', label: 'Grateful', emoji: '🙏', desc: 'Thankful for what God has done', color: '#E3B15E', level: 6 },
  { id: 'peaceful', label: 'Peaceful', emoji: '🕊', desc: 'Resting in God’s presence', color: '#37C6C2', level: 5 },
  { id: 'seeking', label: 'Seeking', emoji: '🔍', desc: 'Searching for direction', color: '#7B62B8', level: 4 },
  { id: 'convicted', label: 'Convicted', emoji: '🕯', desc: 'Aware of where you’ve fallen short', color: '#B8746B', level: 3 },
  { id: 'doubting', label: 'Doubting', emoji: '🤔', desc: 'Wrestling with questions of faith', color: '#6B8CAE', level: 2 },
  { id: 'distant', label: 'Distant', emoji: '🌫', desc: 'Feeling far from God right now', color: '#5B5580', level: 1 },
];

const MOOD_MAP: Record<string, MoodItem> = Object.fromEntries(MOODS.map(m => [m.id, m]));

export interface DayActivityRecord {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  mood: MoodItem['id'] | null;
  intensity: number; // 0 to 4
  scriptureRead: boolean;
  prayerCompleted: boolean;
  stillnessPractice: boolean;
  journalWritten: boolean;
  isSabbathRest?: boolean;
  sabbathNote?: string;
  scriptureRef?: string;
  reflectionSnippet?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  icon: string;
}

export interface StreakMilestone {
  id: string;
  days: number;
  title: string;
  tier: string;
  description: string;
  scripture: string;
  scriptureRef: string;
  icon: string;
  rewardTitle: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    id: 'streak-3',
    days: 3,
    title: 'First Flame',
    tier: 'Bronze Spark',
    description: '3 consecutive days walking with God in Scripture and prayer',
    scripture: 'For where two or three gather in my name, there am I with them.',
    scriptureRef: 'Matthew 18:20',
    icon: '🌱',
    rewardTitle: 'Spiritual Spark',
  },
  {
    id: 'streak-7',
    days: 7,
    title: '7-Day Sabbath Rhythm',
    tier: 'Silver Cadence',
    description: 'A full unbroken week of daily Scripture and abiding prayer',
    scripture: 'By the seventh day God had finished the work he had been doing; so on the seventh day he rested.',
    scriptureRef: 'Genesis 2:2',
    icon: '🌿',
    rewardTitle: 'Weekly Sabbath Keeper',
  },
  {
    id: 'streak-14',
    days: 14,
    title: 'Fortnight of Faith',
    tier: 'Emerald Abider',
    description: 'Two continuous weeks rooted in Christ’s peaceful presence',
    scripture: 'Abide in me, and I in you. Whoever abides in me and I in him bears much fruit.',
    scriptureRef: 'John 15:4-5',
    icon: '🔥',
    rewardTitle: 'Vine & Branches',
  },
  {
    id: 'streak-30',
    days: 30,
    title: '30-Day Spiritual Pillar',
    tier: 'Gold Anchor',
    description: 'A complete month of unwavering spiritual devotion and daily focus',
    scripture: 'He is like a tree planted by streams of water, yielding fruit in season.',
    scriptureRef: 'Psalm 1:3',
    icon: '🏛️',
    rewardTitle: 'Living Temple Pillar',
  },
  {
    id: 'streak-60',
    days: 60,
    title: '60-Day Deep Roots',
    tier: 'Sapphire Sanctuary',
    description: 'Two months of daily communion transforming habit into heart posture',
    scripture: 'Rooted and built up in him, strengthened in the faith as you were taught.',
    scriptureRef: 'Colossians 2:7',
    icon: '🌳',
    rewardTitle: 'Rooted Believer',
  },
  {
    id: 'streak-100',
    days: 100,
    title: '100-Day Centered Heart',
    tier: 'Diamond Covenant',
    description: 'Century milestone of unbroken faith, steadfast endurance, and peace',
    scripture: 'Let us not become weary in doing good, for at the proper time we will reap if we do not give up.',
    scriptureRef: 'Galatians 6:9',
    icon: '💎',
    rewardTitle: 'Unshakable Faith',
  },
  {
    id: 'streak-365',
    days: 365,
    title: '365-Day Perpetual Flame',
    tier: 'Crown of Glory',
    description: 'A full year walking daily in the unbroken light of the Lord',
    scripture: 'I have fought the good fight, I have finished the race, I have kept the faith.',
    scriptureRef: '2 Timothy 4:7',
    icon: '👑',
    rewardTitle: 'Everlasting Rhythm',
  },
];

export interface JournalEntry {
  id: string;
  text: string;
  date: string;
}

export interface FavoriteVerse {
  id: string;
  verseText: string;
  verseReference: string;
}

// Generate realistic initial 60 days of devotional & streak data leading up to today
function generateDefaultCalendarRecords(): Record<string, DayActivityRecord> {
  const records: Record<string, DayActivityRecord> = {};
  const today = new Date();

  // Pattern of intensity for the past 60 days (active streak of 14 continuous days up to today)
  const pattern: Array<{
    intensity: number;
    mood: MoodItem['id'] | null;
    scripture: boolean;
    prayer: boolean;
    stillness: boolean;
    journal: boolean;
    ref?: string;
    snippet?: string;
  }> = [
    // 14 days active streak (days 0 to 13 before today)
    { intensity: 4, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: true, ref: 'Psalm 23:3', snippet: 'He restores my soul in quiet waters.' },
    { intensity: 3, mood: 'peaceful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'John 15:4', snippet: 'Abiding in the true vine.' },
    { intensity: 4, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: true, ref: 'Matthew 11:28', snippet: 'Come to me all who labor and are heavy laden.' },
    { intensity: 2, mood: 'peaceful', scripture: true, prayer: true, stillness: false, journal: false, ref: 'Philippians 4:6', snippet: 'Do not be anxious about anything.' },
    { intensity: 3, mood: 'seeking', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Proverbs 3:5', snippet: 'Trust in the Lord with all your heart.' },
    { intensity: 4, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: true, ref: 'Psalm 46:10', snippet: 'Be still and know that I am God.' },
    { intensity: 3, mood: 'peaceful', scripture: true, prayer: true, stillness: false, journal: true, ref: 'Isaiah 40:31', snippet: 'Those who wait upon the Lord will renew their strength.' },
    { intensity: 2, mood: 'seeking', scripture: true, prayer: true, stillness: false, journal: false, ref: 'Romans 8:28', snippet: 'All things work together for good.' },
    { intensity: 3, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Lamentations 3:22', snippet: 'His mercies are new every morning.' },
    { intensity: 1, mood: 'peaceful', scripture: false, prayer: true, stillness: false, journal: false, ref: 'Colossians 3:15', snippet: 'Let the peace of Christ rule in your hearts.' },
    { intensity: 3, mood: 'convicted', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Psalm 51:10', snippet: 'Create in me a clean heart, O God.' },
    { intensity: 4, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: true, ref: 'Psalm 103:1', snippet: 'Bless the Lord, O my soul.' },
    { intensity: 2, mood: 'peaceful', scripture: true, prayer: true, stillness: false, journal: false, ref: 'Hebrews 11:1', snippet: 'Faith is the assurance of things hoped for.' },
    { intensity: 3, mood: 'seeking', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Jeremiah 29:11', snippet: 'Plans to give you a future and a hope.' },
    // 1 rest day 14 days ago
    { intensity: 0, mood: null, scripture: false, prayer: false, stillness: false, journal: false },
    // Previous streak of 9 days
    { intensity: 3, mood: 'peaceful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Psalm 27:1', snippet: 'The Lord is my light and my salvation.' },
    { intensity: 4, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: true, ref: 'Psalm 34:8', snippet: 'Taste and see that the Lord is good.' },
    { intensity: 2, mood: 'seeking', scripture: true, prayer: true, stillness: false, journal: false, ref: 'James 1:5', snippet: 'If any of you lacks wisdom, let him ask God.' },
    { intensity: 3, mood: 'peaceful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'John 14:27', snippet: 'My peace I give to you.' },
    { intensity: 4, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: true, ref: '1 Thessalonians 5:16', snippet: 'Rejoice always, pray without ceasing.' },
    { intensity: 2, mood: 'doubting', scripture: true, prayer: true, stillness: false, journal: false, ref: 'Mark 9:24', snippet: 'I believe; help my unbelief!' },
    { intensity: 3, mood: 'peaceful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Psalm 91:1', snippet: 'He who dwells in the shelter of the Most High.' },
    { intensity: 1, mood: 'distant', scripture: false, prayer: true, stillness: false, journal: false, ref: 'Psalm 139:7', snippet: 'Where can I go from your Spirit?' },
    { intensity: 2, mood: 'seeking', scripture: true, prayer: true, stillness: false, journal: false, ref: 'Matthew 6:33', snippet: 'Seek first the kingdom of God.' },
    // 1 rest day
    { intensity: 0, mood: null, scripture: false, prayer: false, stillness: false, journal: false },
    // Historical days
    { intensity: 3, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Ephesians 2:8', snippet: 'By grace you have been saved through faith.' },
    { intensity: 2, mood: 'peaceful', scripture: true, prayer: true, stillness: false, journal: false, ref: 'Galatians 5:22', snippet: 'The fruit of the Spirit is love, joy, peace.' },
    { intensity: 4, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: true, ref: '2 Timothy 1:7', snippet: 'A spirit not of fear but of power and love.' },
    { intensity: 3, mood: 'seeking', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Joshua 1:9', snippet: 'Be strong and courageous; do not be frightened.' },
    { intensity: 1, mood: 'peaceful', scripture: false, prayer: true, stillness: false, journal: false, ref: 'Psalm 119:105', snippet: 'Your word is a lamp to my feet.' },
    { intensity: 0, mood: null, scripture: false, prayer: false, stillness: false, journal: false },
    { intensity: 2, mood: 'seeking', scripture: true, prayer: true, stillness: false, journal: false, ref: 'Micah 6:8', snippet: 'To act justly and to love mercy and to walk humbly.' },
    { intensity: 3, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Romans 12:2', snippet: 'Be transformed by the renewal of your mind.' },
    { intensity: 4, mood: 'peaceful', scripture: true, prayer: true, stillness: true, journal: true, ref: 'Psalm 16:11', snippet: 'In your presence there is fullness of joy.' },
    { intensity: 3, mood: 'grateful', scripture: true, prayer: true, stillness: true, journal: false, ref: 'Psalm 121:1', snippet: 'My help comes from the Lord.' },
  ];

  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const p = pattern[i] || {
      intensity: (i % 3 === 0 ? 0 : (i % 4) + 1),
      mood: 'peaceful',
      scripture: true,
      prayer: true,
      stillness: false,
      journal: false,
    };

    records[dateStr] = {
      date: dateStr,
      dayLabel,
      mood: p.mood,
      intensity: p.intensity,
      scriptureRead: p.scripture,
      prayerCompleted: p.prayer,
      stillnessPractice: p.stillness,
      journalWritten: p.journal,
      scriptureRef: p.ref,
      reflectionSnippet: p.snippet,
    };
  }

  return records;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'b1', title: 'First Step', description: 'Began your first Scripture check-in with God', earned: true, icon: '✦' },
  { id: 'b2', title: '7-Day Rhythm', description: 'Walked in daily prayer and abiding for 7 days', earned: true, icon: '🌿' },
  { id: 'b3', title: 'Honest Heart', description: 'Brought seeking and doubt openly before the Lord', earned: true, icon: '♡' },
  { id: 'b4', title: 'Psalm 23 Abider', description: 'Completed the 5-day Finding Peace journey', earned: true, icon: '🕊' },
  { id: 'b5', title: '30-Day Pillar', description: 'Maintained spiritual attentiveness over a full month', earned: false, icon: '👑' },
  { id: 'b_sabbath', title: 'Sabbath Peace', description: 'Observed intentional Sabbath rest, trading striving for holy abiding', earned: false, icon: '🕊️' },
];

const DEFAULT_JOURNAL: JournalEntry[] = [
  { id: 'j1', date: 'Yesterday', text: '“The Lord is my shepherd, I shall not want.” Learning to let go of the pressure to control tomorrow and simply rest in His goodness.' },
  { id: 'j2', date: '3 days ago', text: 'Felt unsettled in the morning, but sitting quietly with Psalm 46:10 reminded me that being still before God is not wasted time.' },
  { id: 'j3', date: 'Last week', text: 'Thankful for clarity on how to respond with patience rather than frustration at work. Small grace, big difference.' },
];

const DEFAULT_FAVORITES: FavoriteVerse[] = [
  { id: 'v1', verseText: 'He restores my soul. He leads me in paths of righteousness for his name’s sake.', verseReference: 'Psalm 23:3' },
  { id: 'v2', verseText: 'Come to me, all who labor and are heavy laden, and I will give you rest.', verseReference: 'Matthew 11:28' },
  { id: 'v3', verseText: 'Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me.', verseReference: 'John 15:4' },
];

interface TooltipPayloadData {
  date: string;
  dayLabel: string;
  mood: MoodItem['id'] | null;
  moodLevel: number | null;
  moodLabel: string;
  emoji: string;
  desc: string;
  color: string;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayloadData }>;
}

function CustomChartTooltip({ active, payload }: CustomChartTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.moodLevel == null) {
      return (
        <div
          id="chart-tooltip-empty"
          className="rounded-xl border border-white/20 bg-[#1E1835] p-3 text-xs text-white shadow-2xl"
        >
          <p className="font-medium text-[#A69DC0]">{data.dayLabel} ({data.date})</p>
          <p className="mt-1 text-sm text-gray-400 italic">No check-in recorded</p>
        </div>
      );
    }
    return (
      <div
        id="chart-tooltip"
        className="rounded-xl border border-white/20 bg-[#1E1835] p-3 text-xs text-white shadow-2xl min-w-[170px]"
      >
        <p className="font-medium text-[#A69DC0]">{data.dayLabel} ({data.date})</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg">{data.emoji}</span>
          <span className="text-sm font-bold" style={{ color: data.color }}>
            {data.moodLabel}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#C5BCD9] leading-tight">{data.desc}</p>
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-[10px] text-[#8E84A6]">
          <span>Spiritual index:</span>
          <span className="font-semibold text-white">{data.moodLevel} / 6</span>
        </div>
      </div>
    );
  }
  return null;
}

interface CustomLineDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    date: string;
    moodLevel: number | null;
    color?: string;
  };
}

function CustomLineDot(props: CustomLineDotProps) {
  const { cx, cy, payload } = props;
  if (!payload || payload.moodLevel == null || cx == null || cy == null) return null;
  return (
    <circle
      key={payload.date}
      cx={cx}
      cy={cy}
      r={5}
      fill={payload.color || '#1FB6B0'}
      stroke="#17132B"
      strokeWidth={2}
      className="cursor-pointer transition-all hover:r-7"
    />
  );
}

// Intensity styling helpers
const INTENSITY_COLORS = [
  { level: 0, label: 'Rest / Missed', bg: 'bg-[#F2EDF8]', border: 'border-gray-200', text: 'text-gray-400', badge: 'bg-gray-100 text-gray-600' },
  { level: 1, label: 'Light (Check-in)', bg: 'bg-[#BCEBE7]', border: 'border-[#72D5CF]', text: 'text-[#0E6C68]', badge: 'bg-[#BCEBE7] text-[#0E6C68]' },
  { level: 2, label: 'Moderate (Scripture)', bg: 'bg-[#5DD1CC]', border: 'border-[#2EAEA8]', text: 'text-[#094F4C]', badge: 'bg-[#5DD1CC] text-[#094F4C]' },
  { level: 3, label: 'Deep (Prayer & Word)', bg: 'bg-[#1FB6B0]', border: 'border-[#138A85]', text: 'text-white', badge: 'bg-[#1FB6B0] text-white' },
  { level: 4, label: 'Peak Abiding Rhythm 🔥', bg: 'bg-gradient-to-br from-[#E3B15E] via-[#F28C38] to-[#1FB6B0]', border: 'border-[#E3B15E]', text: 'text-white', badge: 'bg-[#F28C38] text-white' },
];

export function ProgressScreen({ deviceId }: { deviceId?: string }) {
  const isMounted = useIsMounted();
  const { user } = useUser();
  const [tab, setTab] = useState<'calendar' | 'milestones' | 'trends' | 'journal' | 'pulse'>('calendar');
  const [selectedMilestone, setSelectedMilestone] = useState<StreakMilestone | null>(null);
  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Weekly Spiritual Pulse email state
  const defaultUserEmail = user?.primaryEmailAddress?.emailAddress || 'asketfranckolivieralex@gmail.com';
  const [customRecipientEmail, setCustomRecipientEmail] = useState<string | null>(null);
  const recipientEmail = customRecipientEmail ?? defaultUserEmail;
  const setRecipientEmail = (val: string) => setCustomRecipientEmail(val);

  const [isSendingPulse, setIsSendingPulse] = useState(false);
  const [pulseSentResult, setPulseSentResult] = useState<{
    success: boolean;
    message: string;
    previewHtml?: string;
    provider?: string;
    timestamp?: string;
    messageId?: string;
  } | null>(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lifebook.spiritualPulse.autoEmail') === 'true';
    }
    return false;
  });

  const handleToggleAutoEmail = () => {
    const nextVal = !autoEmailEnabled;
    setAutoEmailEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.spiritualPulse.autoEmail', String(nextVal));
    }
  };

  // Calendar state
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Daily calendar activities and intensity records
  const [calendarRecords, setCalendarRecords] = useState<Record<string, DayActivityRecord>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.calendar.streakHistory');
        if (saved) return JSON.parse(saved);
      } catch {
        // use fallback
      }
    }
    return generateDefaultCalendarRecords();
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.badges');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_BADGES;
  });

  const [gracePoints, setGracePoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.gracePoints');
        if (saved) return parseInt(saved, 10);
      } catch {
        // fallback
      }
    }
    return 150;
  });

  const [journal, setJournal] = useState<JournalEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.journal');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_JOURNAL;
  });

  const [favorites] = useState<FavoriteVerse[]>(DEFAULT_FAVORITES);
  const [newEntryText, setNewEntryText] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);

  // Calculate current active streak dynamically (Sabbath Rest explicitly preserves continuous streak)
  const { currentStreak, longestStreak, activeStreakDates } = useMemo(() => {
    let streak = 0;
    const streakDates = new Set<string>();
    const d = new Date();

    const isDayActive = (rec?: DayActivityRecord) => Boolean(rec && (rec.intensity > 0 || rec.isSabbathRest));

    // Check if today has activity or intentional Sabbath rest; if not, check from yesterday to preserve continuous streak
    const todayKey = d.toISOString().slice(0, 10);
    const todayRec = calendarRecords[todayKey];
    let startOffset = 0;
    if (!isDayActive(todayRec)) {
      // check yesterday
      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      const yKey = yDate.toISOString().slice(0, 10);
      const yRec = calendarRecords[yKey];
      if (isDayActive(yRec)) {
        startOffset = 1;
      } else {
        return { currentStreak: 0, longestStreak: 24, activeStreakDates: streakDates };
      }
    }

    for (let i = startOffset; i < 365; i++) {
      const checkD = new Date();
      checkD.setDate(checkD.getDate() - i);
      const k = checkD.toISOString().slice(0, 10);
      const rec = calendarRecords[k];
      if (isDayActive(rec)) {
        streak++;
        streakDates.add(k);
      } else {
        break;
      }
    }

    return {
      currentStreak: streak,
      longestStreak: Math.max(streak, 24),
      activeStreakDates: streakDates,
    };
  }, [calendarRecords]);

  // Streak Milestones calculations for consecutive records gamification
  const unlockedMilestonesCount = useMemo(() => {
    return STREAK_MILESTONES.filter(m => currentStreak >= m.days || longestStreak >= m.days).length;
  }, [currentStreak, longestStreak]);

  const nextMilestone = useMemo(() => {
    return STREAK_MILESTONES.find(m => currentStreak < m.days) || null;
  }, [currentStreak]);

  const nextMilestoneProgress = useMemo(() => {
    if (!nextMilestone) return 100;
    return Math.min(100, Math.round((currentStreak / nextMilestone.days) * 100));
  }, [currentStreak, nextMilestone]);

  const nextMilestoneDaysLeft = useMemo(() => {
    if (!nextMilestone) return 0;
    return Math.max(0, nextMilestone.days - currentStreak);
  }, [currentStreak, nextMilestone]);

  const filteredMilestones = useMemo(() => {
    return STREAK_MILESTONES.filter(m => {
      const isUnlocked = currentStreak >= m.days || longestStreak >= m.days;
      if (milestoneFilter === 'unlocked') return isUnlocked;
      if (milestoneFilter === 'locked') return !isUnlocked;
      return true;
    });
  }, [milestoneFilter, currentStreak, longestStreak]);

  // Seven-Day Spiritual Pulse calculation (mood patterns, milestones, practices, scripture)
  const weeklyPulseData = useMemo<SpiritualPulseData>(() => {
    const days: PulseDaySummary[] = [];
    const moodCounts: Record<string, { label: string; emoji: string; count: number; color: string }> = {
      grateful: { label: 'Grateful', emoji: '🙏', count: 0, color: '#E3B15E' },
      peaceful: { label: 'Peaceful', emoji: '🕊', count: 0, color: '#37C6C2' },
      seeking: { label: 'Seeking', emoji: '🔍', count: 0, color: '#7B62B8' },
      convicted: { label: 'Convicted', emoji: '🕯', count: 0, color: '#B8746B' },
      doubting: { label: 'Doubting', emoji: '🤔', count: 0, color: '#6B8CAE' },
      distant: { label: 'Distant', emoji: '🌫', count: 0, color: '#5B5580' },
    };

    let totalCheckIns = 0;
    let scriptureDays = 0;
    let stillnessMinutes = 0;
    let prayersOffered = 0;
    let journalEntries = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });
      const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const rec = calendarRecords[dateKey];

      const moodId = rec?.mood || null;
      const moodObj = moodId ? MOOD_MAP[moodId] : null;

      if (moodId && moodCounts[moodId]) {
        moodCounts[moodId].count += 1;
      }

      const hasActivity = Boolean(rec && (rec.intensity > 0 || rec.mood != null));
      if (hasActivity) totalCheckIns += 1;

      if (rec?.scriptureRead) scriptureDays += 1;
      if (rec?.stillnessPractice) stillnessMinutes += 10;
      if (rec?.prayerCompleted) prayersOffered += 1;
      if (rec?.journalWritten) journalEntries += 1;

      days.push({
        date: dateKey,
        dayName,
        formattedDate,
        mood: moodId,
        moodLabel: moodObj ? moodObj.label : (hasActivity ? 'Active Practice' : 'Rest / Missed'),
        moodEmoji: moodObj ? moodObj.emoji : (hasActivity ? '✨' : '·'),
        moodColor: moodObj ? moodObj.color : (hasActivity ? '#1FB6B0' : '#8A7DAD'),
        intensity: rec?.intensity || 0,
        practices: {
          scriptureRead: Boolean(rec?.scriptureRead),
          stillnessMinutes: rec?.stillnessPractice ? 10 : 0,
          prayerOffered: Boolean(rec?.prayerCompleted),
          journalWritten: Boolean(rec?.journalWritten),
        },
      });
    }

    let dominantMoodKey = 'peaceful';
    let maxMoodCount = -1;
    for (const [key, obj] of Object.entries(moodCounts)) {
      if (obj.count > maxMoodCount) {
        maxMoodCount = obj.count;
        dominantMoodKey = key;
      }
    }

    if (maxMoodCount <= 0) {
      dominantMoodKey = 'grateful';
    }

    const dominantObj = MOOD_MAP[dominantMoodKey] || MOOD_MAP['grateful'];

    const moodInsights: Record<string, string> = {
      grateful: 'Your heart has been attuned to God’s daily gifts and providence. Overflowing gratitude strengthens trust in future unseen blessings.',
      peaceful: 'A quiet stillness has anchored your soul this week. Guard this Christ-centered peace against the world’s noise and hurry.',
      seeking: 'You have been leaning in with a posture of holy curiosity and longing for wisdom. God rewards the heart that seeks Him earnestly.',
      convicted: 'Conviction is divine tenderness, guiding you out of lesser paths into His freedom and alignment. There is no condemnation in Christ Jesus.',
      doubting: 'Wrestling and honest questions are safe in God’s hands. Biblical faith is not the absence of questions, but clinging to Jesus in the midst of them.',
      distant: 'Even when feelings are dry, God’s covenant love is unwavering. He draws nearest precisely when we feel least capable of finding Him.',
    };

    const moodScriptures: Record<string, { text: string; reference: string }> = {
      grateful: { text: 'Give thanks to the Lord, for he is good; his love endures forever.', reference: 'Psalm 107:1' },
      peaceful: { text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', reference: 'John 14:27' },
      seeking: { text: 'You will seek me and find me when you seek me with all your heart.', reference: 'Jeremiah 29:13' },
      convicted: { text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.', reference: '1 John 1:9' },
      doubting: { text: 'Immediately the boy’s father exclaimed, “I do believe; help me overcome my unbelief!”', reference: 'Mark 9:24' },
      distant: { text: 'Where can I go from your Spirit? Where can I flee from your presence? If I rise on the wings of the dawn, even there your hand will guide me.', reference: 'Psalm 139:7, 9-10' },
    };

    const startDateFormatted = days[0].formattedDate;
    const endDateFormatted = days[days.length - 1].formattedDate;
    const dateRangeFormatted = `${startDateFormatted} – ${endDateFormatted}, ${new Date().getFullYear()}`;

    const unlockedList = STREAK_MILESTONES.filter(m => currentStreak >= m.days || longestStreak >= m.days).map(m => ({
      days: m.days,
      title: m.title,
      icon: m.icon,
      tier: m.tier,
    }));

    const nextMilestoneObj = nextMilestone ? {
      days: nextMilestone.days,
      title: nextMilestone.title,
      icon: nextMilestone.icon,
      tier: nextMilestone.tier,
      daysRemaining: nextMilestoneDaysLeft,
      progressPercentage: nextMilestoneProgress,
    } : null;

    return {
      startDate: days[0].date,
      endDate: days[days.length - 1].date,
      dateRangeFormatted,
      totalCheckIns,
      consistencyRate: Math.round((totalCheckIns / 7) * 100),
      currentStreak,
      longestStreak,
      dominantMood: {
        id: dominantMoodKey,
        label: dominantObj.label,
        emoji: dominantObj.emoji,
        color: dominantObj.color,
        count: moodCounts[dominantMoodKey]?.count || 0,
        percentage: Math.round(((moodCounts[dominantMoodKey]?.count || 0) / Math.max(1, totalCheckIns)) * 100),
        insight: moodInsights[dominantMoodKey] || moodInsights['grateful'],
      },
      moodCounts,
      days,
      milestonesUnlocked: unlockedList,
      nextMilestone: nextMilestoneObj,
      practicesTotals: {
        scriptureDays,
        stillnessMinutes,
        prayersOffered,
        journalEntries,
      },
      weeklyScripture: moodScriptures[dominantMoodKey] || moodScriptures['grateful'],
      pastoralEncouragement: 'Hold fast to Christ’s steady grace. Take one quiet, faithful step with Him tomorrow.',
    };
  }, [calendarRecords, currentStreak, longestStreak, nextMilestone, nextMilestoneDaysLeft, nextMilestoneProgress]);

  async function handleSendSpiritualPulse(emailTarget?: string) {
    const target = (emailTarget || recipientEmail).trim();
    if (!target || !target.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setIsSendingPulse(true);
    setPulseSentResult(null);
    try {
      const res = await fetch('/api/spiritual-pulse/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: target,
          name: user?.fullName || user?.firstName || 'Pilgrim',
          pulseData: weeklyPulseData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send weekly pulse');
      }
      setPulseSentResult({
        success: true,
        message: data.message || `Weekly Spiritual Pulse emailed to ${target}!`,
        previewHtml: data.previewHtml,
        provider: data.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messageId: data.messageId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not dispatch Weekly Spiritual Pulse email.';
      setPulseSentResult({
        success: false,
        message,
      });
    } finally {
      setIsSendingPulse(false);
    }
  }

  // Transform past 30 days for the Recharts line chart
  const chartData = useMemo(() => {
    const list = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const rec = calendarRecords[dateStr];
      const moodObj = rec?.mood ? MOOD_MAP[rec.mood] : null;
      list.push({
        date: dateStr,
        dayLabel,
        mood: rec?.mood || null,
        moodLevel: moodObj ? moodObj.level : (rec && rec.intensity > 0 ? Math.min(6, rec.intensity + 2) : null),
        moodLabel: moodObj ? moodObj.label : (rec && rec.intensity > 0 ? 'Practiced' : 'No check-in'),
        emoji: moodObj ? moodObj.emoji : (rec && rec.intensity > 0 ? '✨' : ''),
        desc: moodObj ? moodObj.desc : (rec && rec.intensity > 0 ? 'Devotional practice completed' : ''),
        color: moodObj ? moodObj.color : '#1FB6B0',
        intensity: rec?.intensity || 0,
      });
    }
    return list;
  }, [calendarRecords]);

  // Calendar month matrix builder
  const calendarGrid = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth(); // 0-indexed

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      record?: DayActivityRecord;
      isPartOfActiveStreak: boolean;
    }> = [];

    // Preceding padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pDate = new Date(year, month - 1, pDay);
      const dateStr = pDate.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNumber: pDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        record: calendarRecords[dateStr],
        isPartOfActiveStreak: activeStreakDates.has(dateStr),
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        record: calendarRecords[dateStr],
        isPartOfActiveStreak: activeStreakDates.has(dateStr),
      });
    }

    // Trailing padding days to fill 7 columns
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nDate = new Date(year, month + 1, i);
      const dateStr = nDate.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        record: calendarRecords[dateStr],
        isPartOfActiveStreak: activeStreakDates.has(dateStr),
      });
    }

    return cells;
  }, [calendarViewDate, calendarRecords, todayStr, activeStreakDates]);

  // Selected date record
  const selectedRecord = calendarRecords[selectedDateStr] || {
    date: selectedDateStr,
    dayLabel: new Date(selectedDateStr + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    mood: null,
    intensity: 0,
    scriptureRead: false,
    prayerCompleted: false,
    stillnessPractice: false,
    journalWritten: false,
  };

  // Quick action: toggle or log devotional practice on selected date
  function togglePractice(key: 'scriptureRead' | 'prayerCompleted' | 'stillnessPractice' | 'journalWritten') {
    const cur = selectedRecord;
    const updated = {
      ...cur,
      [key]: !cur[key],
    };

    // Recalculate intensity based on 4 practices
    let score = 0;
    if (updated.scriptureRead) score++;
    if (updated.prayerCompleted) score++;
    if (updated.stillnessPractice) score++;
    if (updated.journalWritten) score++;
    if (updated.mood && score === 0) score = 1;

    updated.intensity = Math.min(4, score);

    const newMap = {
      ...calendarRecords,
      [selectedDateStr]: updated,
    };
    setCalendarRecords(newMap);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.calendar.streakHistory', JSON.stringify(newMap));
    }
  }

  // Handle logging a mood today
  function handleCheckInMood(moodId: MoodItem['id']) {
    const todayLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const existing = calendarRecords[todayStr] || {
      date: todayStr,
      dayLabel: todayLabel,
      mood: null,
      intensity: 0,
      scriptureRead: false,
      prayerCompleted: false,
      stillnessPractice: false,
      journalWritten: false,
    };

    const newIntensity = Math.max(1, existing.intensity);
    const updated: DayActivityRecord = {
      ...existing,
      mood: moodId,
      intensity: newIntensity,
    };

    const newMap = {
      ...calendarRecords,
      [todayStr]: updated,
    };
    setCalendarRecords(newMap);
    setSelectedDateStr(todayStr);

    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.calendar.streakHistory', JSON.stringify(newMap));
    }
  }

  // Handle adding journal entry
  function handleAddJournal(e: React.FormEvent) {
    e.preventDefault();
    if (!newEntryText.trim()) return;
    const newEntry: JournalEntry = {
      id: 'j_' + Date.now(),
      date: 'Just now',
      text: newEntryText.trim(),
    };
    setJournal([newEntry, ...journal]);

    // Also mark journalWritten for today
    togglePractice('journalWritten');
    setNewEntryText('');
  }

  // Handle honoring intentional Sabbath Day rest: safeguards streak, awards +50 grace points & badge
  function handleHonorSabbath(targetDateStr?: string) {
    const target = targetDateStr || todayStr;
    const existing = calendarRecords[target] || {
      date: target,
      dayLabel: new Date(target + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mood: 'peaceful',
      intensity: 1,
      scriptureRead: false,
      prayerCompleted: false,
      stillnessPractice: true,
      journalWritten: true,
    };

    const updated: DayActivityRecord = {
      ...existing,
      isSabbathRest: true,
      mood: 'peaceful',
      intensity: 1,
      stillnessPractice: true,
      journalWritten: true,
      scriptureRef: 'Matthew 11:28',
      reflectionSnippet: 'Observed holy Sabbath rest. Ceased striving to abide in God’s unfailing grace.',
    };

    const newMap = { ...calendarRecords, [target]: updated };
    setCalendarRecords(newMap);

    const newPoints = gracePoints + 50;
    setGracePoints(newPoints);

    // Persist records and grace points
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.calendar.streakHistory', JSON.stringify(newMap));
      localStorage.setItem('lifebook.gracePoints', String(newPoints));
    }

    // Award Sabbath Peace badge
    setBadges(prev => {
      const nextBadges = prev.map(b => (b.id === 'b_sabbath' ? { ...b, earned: true } : b));
      if (typeof window !== 'undefined') {
        localStorage.setItem('lifebook.badges', JSON.stringify(nextBadges));
      }
      return nextBadges;
    });

    // Auto-record Sabbath reflection to spiritual journal
    const sabbathJournalEntry: JournalEntry = {
      id: 'j_sabbath_' + Date.now(),
      date: 'Today · Sabbath Rest',
      text: '“Come to me, all who labor and are heavy laden, and I will give you rest.” Observed intentional Sabbath rest today. Laid down striving to abide quietly in God’s unfailing grace.',
    };
    setJournal(prev => {
      const nextJournal = [sabbathJournalEntry, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('lifebook.journal', JSON.stringify(nextJournal));
      }
      return nextJournal;
    });
  }

  // Handle undoing/canceling Sabbath rest in case user desires regular activity logging
  function handleCancelSabbath(targetDateStr?: string) {
    const target = targetDateStr || todayStr;
    const existing = calendarRecords[target];
    if (!existing) return;

    const updated: DayActivityRecord = {
      ...existing,
      isSabbathRest: false,
    };

    const newMap = { ...calendarRecords, [target]: updated };
    setCalendarRecords(newMap);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.calendar.streakHistory', JSON.stringify(newMap));
    }
  }

  // Monthly stats
  const currentMonthCells = calendarGrid.filter(c => c.isCurrentMonth);
  const activeDaysThisMonth = currentMonthCells.filter(c => c.record && c.record.intensity > 0).length;
  const consistencyRate = currentMonthCells.length > 0
    ? Math.round((activeDaysThisMonth / currentMonthCells.length) * 100)
    : 0;

  // Next/Prev month controls
  function handlePrevMonth() {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleTodayJump() {
    setCalendarViewDate(new Date());
    setSelectedDateStr(todayStr);
  }

  const monthName = calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div id="progress-screen" className="w-full max-w-5xl mx-auto px-4 py-8 text-[#1E1931]">
      {deviceId && <div className="sr-only">Device: {deviceId}</div>}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#705E8C]">
            <Link href="/" className="hover:underline flex items-center gap-1">
              ← Home
            </Link>
            <span>·</span>
            <span>Spiritual Rhythm & Consistency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#1E1835] mt-1">Your Progress</h1>
          <p className="text-sm text-[#776E82] mt-1">
            Build a faithful rhythm of daily Scripture, stillness, prayer, and soul reflections with God.
          </p>
        </div>

        {/* Tab switcher */}
        <div id="progress-tabs" className="inline-flex rounded-full bg-[#EAE4F2] p-1 self-start md:self-auto shadow-inner">
          <button
            id="tab-calendar"
            type="button"
            onClick={() => setTab('calendar')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
              tab === 'calendar'
                ? 'bg-[#2A2146] text-white shadow'
                : 'text-[#65597C] hover:text-[#1E1835]'
            }`}
          >
            <span>📅</span>
            <span>Streak Calendar</span>
          </button>
          <button
            id="tab-milestones"
            type="button"
            onClick={() => setTab('milestones')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
              tab === 'milestones'
                ? 'bg-[#2A2146] text-white shadow'
                : 'text-[#65597C] hover:text-[#1E1835]'
            }`}
          >
            <span>🏆</span>
            <span>Milestones ({unlockedMilestonesCount}/{STREAK_MILESTONES.length})</span>
          </button>
          <button
            id="tab-trends"
            type="button"
            onClick={() => setTab('trends')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
              tab === 'trends'
                ? 'bg-[#2A2146] text-white shadow'
                : 'text-[#65597C] hover:text-[#1E1835]'
            }`}
          >
            <span>📈</span>
            <span>30-Day Trends</span>
          </button>
          <button
            id="tab-journal"
            type="button"
            onClick={() => setTab('journal')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
              tab === 'journal'
                ? 'bg-[#2A2146] text-white shadow'
                : 'text-[#65597C] hover:text-[#1E1835]'
            }`}
          >
            <span>✍️</span>
            <span>Journal & Scripture</span>
          </button>
          <button
            id="tab-pulse"
            type="button"
            onClick={() => setTab('pulse')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
              tab === 'pulse'
                ? 'bg-[#2A2146] text-white shadow'
                : 'text-[#65597C] hover:text-[#1E1835]'
            }`}
          >
            <span>🕊️</span>
            <span>Weekly Pulse</span>
          </button>
        </div>
      </div>

      {/* Motivational Streak Banner */}
      <div
        id="streak-motivation-banner"
        className="mt-6 rounded-3xl bg-gradient-to-r from-[#211B3B] via-[#2D234F] to-[#1E3E4B] p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F28C38] to-[#E3B15E] flex items-center justify-center text-3xl shadow-lg shrink-0">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#37C6C2]">
                Active Devotional Streak
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1FB6B0]/30 text-[#37C6C2] border border-[#37C6C2]/40">
                Live
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-0.5">
              {currentStreak} Days Walking with Jesus
            </h2>
            <p className="text-xs text-[#C5BCD9] mt-0.5 max-w-lg">
              {currentStreak > 0
                ? `You’ve maintained an unbroken daily rhythm! Log today to reach ${currentStreak + 1} days.`
                : 'Take a quiet moment today to begin a new streak in Scripture and prayer.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="banner-sabbath-btn"
            type="button"
            onClick={() => {
              setTab('calendar');
              setTimeout(() => {
                document.getElementById('burnout-prevention-card')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
              calendarRecords[todayStr]?.isSabbathRest
                ? 'bg-[#1FB6B0]/30 hover:bg-[#1FB6B0]/40 border-[#1FB6B0]/60 text-[#43E4DC]'
                : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
            }`}
          >
            <span className="text-base">🕊️</span>
            <span>{calendarRecords[todayStr]?.isSabbathRest ? 'Sabbath Shield Active' : 'Burnout Check · Rest'}</span>
          </button>

          <button
            id="banner-weekly-pulse-btn"
            type="button"
            onClick={() => setTab('pulse')}
            className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
          >
            <span className="text-base">📊</span>
            <span>Weekly Pulse</span>
          </button>

          <div className="flex items-center gap-4 bg-white/10 p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-semibold text-[#A89EC0]">Longest</span>
              <p className="text-xl font-bold font-serif text-[#E3B15E]">{longestStreak}d</p>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-semibold text-[#A89EC0]">Consistency</span>
              <p className="text-xl font-bold font-serif text-[#37C6C2]">{consistencyRate}%</p>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-semibold text-[#A89EC0]">Active Days</span>
              <p className="text-xl font-bold font-serif text-white">{activeDaysThisMonth}d</p>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: CALENDAR VIEW WITH COLOR-CODED INTENSITY TILES */}
      {tab === 'calendar' && (
        <div className="mt-8 space-y-8">
          {/* Burnout Prevention & Sabbath Resting Sanctuary Component */}
          <BurnoutPreventionCard
            calendarRecords={calendarRecords}
            todayStr={todayStr}
            currentStreak={currentStreak}
            gracePoints={gracePoints}
            onHonorSabbath={handleHonorSabbath}
            onCancelSabbath={handleCancelSabbath}
            onOpenJournal={() => setTab('journal')}
          />

          {/* Quick Weekly Spiritual Pulse Teaser Card */}
          <div
            id="calendar-weekly-pulse-card"
            className="rounded-3xl bg-gradient-to-r from-[#FAF8FC] via-[#F4F1FA] to-[#EDFAF9] border border-[#D8CFEC] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2A2146] text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
                🕊️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1FB6B0]">
                    Weekly Spiritual Pulse
                  </span>
                  <span className="text-[10px] text-[#7B6E96]">
                    · {weeklyPulseData.dateRangeFormatted}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#1E1835] mt-0.5">
                  7-Day Heart Patterns & Streak Milestones
                </h4>
                <p className="text-xs text-[#6B5F84]">
                  Dominant state: <strong>{weeklyPulseData.dominantMood.emoji} {weeklyPulseData.dominantMood.label}</strong> ({weeklyPulseData.dominantMood.count} days) · {weeklyPulseData.milestonesUnlocked.length} streak badges unlocked.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTab('pulse')}
                className="px-4 py-2 rounded-full bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all shadow-xs"
              >
                View Full Pulse →
              </button>
              <button
                type="button"
                disabled={isSendingPulse}
                onClick={() => handleSendSpiritualPulse()}
                className="px-4 py-2 rounded-full bg-[#1FB6B0] hover:bg-[#189b96] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>✉️</span>
                <span>Email</span>
              </button>
            </div>
          </div>
          <section
            id="streak-calendar-section"
            className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm"
          >
            {/* Calendar Controls & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                    Streak Calendar
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1FB6B0]">
                    <span>●</span> Intensity tiles
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif text-[#1E1931] mt-0.5">
                  {monthName}
                </h3>
              </div>

              {/* Month navigation buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="calendar-prev-month"
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                  className="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-[#4E4466] hover:bg-gray-50 active:scale-95 transition-all"
                >
                  ← Previous
                </button>
                <button
                  id="calendar-today-btn"
                  type="button"
                  onClick={handleTodayJump}
                  className="px-4 py-1.5 rounded-full bg-[#2A2146] text-white text-xs font-bold hover:bg-[#1E1835] active:scale-95 transition-all shadow-xs"
                >
                  Today
                </button>
                <button
                  id="calendar-next-month"
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                  className="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-[#4E4466] hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Day of week headers */}
            <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <span key={day} className="text-xs font-bold uppercase tracking-wider text-[#8A7E9F] py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* 7-column Calendar Matrix of Color-Coded Intensity Tiles with Entry and Hover Animations */}
            <div
              key={`${calendarViewDate.getFullYear()}-${calendarViewDate.getMonth()}`}
              className="mt-2 grid grid-cols-7 gap-2 sm:gap-3"
            >
              {calendarGrid.map((cell, cellIdx) => {
                const intensity = cell.record?.intensity || 0;
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.isToday;
                const moodObj = cell.record?.mood ? MOOD_MAP[cell.record.mood] : null;

                const isSabbath = Boolean(cell.record?.isSabbathRest);

                // Color-coded intensity styling with dynamic hover glow shadows
                let tileClass = 'bg-[#F9F7F4] border-gray-200 text-gray-400 hover:border-[#1FB6B0]/50 hover:bg-white hover:shadow-md';
                if (isSabbath) {
                  tileClass = 'bg-gradient-to-br from-[#F6F3FC] via-[#EEFAF8] to-[#FFF9F0] border-[#BCAFE0] text-[#36275C] font-bold shadow-md hover:border-[#8E7BB7] hover:brightness-105 hover:shadow-[0_12px_24px_-4px_rgba(142,123,183,0.48)]';
                } else if (intensity === 1) {
                  tileClass = 'bg-[#C5EFEA] border-[#81DBD5] text-[#0C615D] font-semibold hover:border-[#1FB6B0] hover:brightness-105 hover:shadow-[0_10px_22px_-4px_rgba(31,182,176,0.38)]';
                } else if (intensity === 2) {
                  tileClass = 'bg-[#5CD2CC] border-[#2EB2AB] text-[#084845] font-semibold hover:border-[#16948F] hover:brightness-105 hover:shadow-[0_12px_24px_-4px_rgba(31,182,176,0.52)]';
                } else if (intensity === 3) {
                  tileClass = 'bg-[#1FB6B0] border-[#16948F] text-white font-bold hover:border-[#0B5C58] hover:brightness-110 hover:shadow-[0_14px_28px_-3px_rgba(22,148,143,0.62)]';
                } else if (intensity === 4) {
                  tileClass = 'bg-gradient-to-br from-[#E3B15E] via-[#F28C38] to-[#1FB6B0] border-[#E3B15E] text-white font-bold shadow-md hover:border-[#FFD066] hover:brightness-110 hover:shadow-[0_16px_32px_-3px_rgba(242,140,56,0.68)]';
                }

                // Staggered entry animation delay
                const entryDelayMs = Math.min(cellIdx * 14, 450);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    style={{ animationDelay: `${entryDelayMs}ms` }}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    title={`${cell.dateStr} · ${isSabbath ? 'Holy Sabbath Rest (Protected Streak)' : `Intensity ${intensity}/4`}${moodObj ? ` · Mood: ${moodObj.label}` : ''}${cell.isPartOfActiveStreak && (intensity > 0 || isSabbath) ? ' · Active Streak 🔥' : ''}`}
                    className={`calendar-tile-entry group relative flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border transition-all duration-200 ease-out min-h-[66px] sm:min-h-[86px] text-left overflow-hidden cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FB6B0] ${tileClass} ${
                      !cell.isCurrentMonth ? 'opacity-35 hover:opacity-90' : 'opacity-100'
                    } ${
                      isSelected
                        ? 'ring-3 ring-[#2A2146] ring-offset-2 scale-[1.05] -translate-y-1 z-20 shadow-xl tile-glow-selected'
                        : 'hover:scale-[1.06] hover:-translate-y-1.5 hover:z-20'
                    }`}
                  >
                    {/* Subtle Sheen Highlight Sweep on Hover */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />

                    {/* Top row: day number & today / streak pill */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-serif transition-transform duration-200 group-hover:scale-110 ${
                          isToday
                            ? 'px-1.5 py-0.5 rounded-md bg-[#2A2146] text-white font-sans font-bold text-[10px] shadow-xs'
                            : intensity === 0 && !isSabbath ? 'group-hover:text-[#2A2146] group-hover:font-bold' : ''
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Sabbath indicator or flame indicator for active streak days */}
                      {isSabbath ? (
                        <span
                          title="Sabbath Rest Day · Streak Sheltered by Grace"
                          className="sabbath-float text-xs sm:text-sm select-none drop-shadow-xs"
                        >
                          🕊️
                        </span>
                      ) : cell.isPartOfActiveStreak && intensity > 0 ? (
                        <span
                          title="Part of active unbroken streak!"
                          className="flame-streak-indicator text-xs sm:text-sm select-none drop-shadow-xs transform group-hover:scale-135 group-hover:-rotate-12 transition-transform duration-200"
                        >
                          🔥
                        </span>
                      ) : null}
                    </div>

                    {/* Bottom row: Mood or practice icon dots */}
                    <div className="relative z-10 flex items-end justify-between w-full mt-1">
                      <div className="flex items-center gap-0.5">
                        {isSabbath ? (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#735DA3] bg-[#735DA3]/15 px-1.5 py-0.5 rounded-md">
                            Sabbath
                          </span>
                        ) : intensity > 0 ? (
                          <div className="flex gap-0.5 transition-transform duration-200 group-hover:scale-125 origin-bottom-left">
                            {Array.from({ length: intensity }).map((_, idx) => (
                              <span
                                key={idx}
                                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-200 ${
                                  intensity >= 3 ? 'bg-white shadow-xs' : 'bg-[#0E6C68]'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 group-hover:text-[#1FB6B0] transition-colors">·</span>
                        )}
                      </div>

                      {moodObj && (
                        <span
                          className="text-xs sm:text-sm select-none transform transition-transform duration-200 group-hover:scale-130 group-hover:rotate-6 origin-bottom-right drop-shadow-xs"
                          title={moodObj.label}
                        >
                          {moodObj.emoji}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Intensity Legend with Sabbath Badge */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-[#706782]">Streak Intensity:</span>
                <span className="text-gray-400 text-[11px]">Less</span>
                <div className="flex items-center gap-1.5">
                  {INTENSITY_COLORS.map(item => (
                    <div
                      key={item.level}
                      title={`Level ${item.level}: ${item.label}`}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-bold cursor-default transition-all duration-150 hover:scale-120 hover:-translate-y-0.5 hover:shadow-sm ${item.bg} ${item.border} ${item.text}`}
                    >
                      {item.level === 4 ? '🔥' : item.level}
                    </div>
                  ))}
                </div>
                <span className="text-gray-400 text-[11px]">More</span>

                {/* Holy Sabbath Rest Legend Badge */}
                <div className="ml-3 pl-3 border-l border-gray-200 flex items-center gap-1.5 group cursor-default">
                  <div
                    title="Sabbath Rest Day: Protects your streak and rewards intentional rest"
                    className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#F6F3FC] via-[#EEFAF8] to-[#FFF9F0] border border-[#BCAFE0] flex items-center justify-center text-[10px] shadow-xs transition-transform group-hover:scale-115"
                  >
                    🕊️
                  </div>
                  <span className="text-[#554A70] text-[11px] font-bold">Sabbath Rest</span>
                </div>
              </div>

              <div className="text-[#65597C] text-xs">
                <span>Selected: </span>
                <strong className="text-[#1E1931]">
                  {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>
                {selectedDateStr === todayStr && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[#1FB6B0]/20 text-[#14837F] font-bold text-[10px]">
                    Today
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Interactive Day Inspector & Devotional Practice Logger */}
          <section
            id="day-inspector-card"
            className="rounded-3xl bg-[#211B3B] p-6 sm:p-8 text-white shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Left: Summary for selected date */}
            <div className="md:col-span-1 space-y-3 border-b md:border-b-0 md:border-r border-white/10 pb-5 md:pb-0 md:pr-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#37C6C2]">
                Day Inspection
              </span>
              <h4 className="text-2xl font-serif text-white">
                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                })}
              </h4>

              {/* Intensity level pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15">
                <span>Intensity Level:</span>
                <span className="text-[#37C6C2] font-bold">
                  {selectedRecord.intensity} / 4
                </span>
                {selectedRecord.intensity === 4 && <span>🔥</span>}
                {selectedRecord.isSabbathRest && <span className="text-sm">🕊️</span>}
              </div>

              {/* Active streak status */}
              <p className="text-xs text-[#C5BCD9] leading-relaxed">
                {selectedRecord.isSabbathRest
                  ? '🕊️ Consecrated Sabbath Rest Day: Ceasing striving to abide peacefully in the Lord. Streak fully preserved!'
                  : activeStreakDates.has(selectedDateStr)
                  ? '✓ Part of your continuous unbroken daily walking streak with the Lord!'
                  : selectedRecord.intensity > 0
                  ? 'Devotional engagement completed on this day.'
                  : 'Rest day or no recorded practice on this day.'}
              </p>

              {/* Dedicated Sabbath Rest Badge Banner in Inspector */}
              {selectedRecord.isSabbathRest && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#1FB6B0]/25 via-[#8E7BB7]/25 to-[#E3B15E]/20 border border-[#3ED1C8]/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#45D6D0]">
                    <span>🕊️</span>
                    <span>Sabbath Day · Consecrated Rest</span>
                  </div>
                  <p className="text-[11px] text-[#E5DCF6] mt-0.5">
                    Consciously consecrated for soul restoration. Your streak is shielded by grace!
                  </p>
                </div>
              )}

              {/* Scripture quote if available */}
              {selectedRecord.scriptureRef && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3B15E]">
                    {selectedRecord.scriptureRef}
                  </span>
                  <p className="text-xs italic text-[#EAE5F3] mt-1">
                    “{selectedRecord.reflectionSnippet || 'He restores my soul.'}”
                  </p>
                </div>
              )}
            </div>

            {/* Middle & Right: Interactive practice toggles to update streak & intensity */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h5 className="text-sm font-bold uppercase tracking-wider text-white">
                  Devotional Rhythm Checkpoints
                </h5>
                <span className="text-xs text-[#A89EC0]">
                  Click to log or toggle practices (+ intensity)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Scripture */}
                <button
                  type="button"
                  onClick={() => togglePractice('scriptureRead')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRecord.scriptureRead
                      ? 'bg-[#1FB6B0]/20 border-[#1FB6B0] text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    selectedRecord.scriptureRead ? 'bg-[#1FB6B0] text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {selectedRecord.scriptureRead ? '✓' : '📖'}
                  </span>
                  <div>
                    <h6 className="text-xs font-bold text-white">Scripture Reading</h6>
                    <p className="text-[11px] text-[#A89EC0] mt-0.5">Read & meditated on God’s Word</p>
                  </div>
                </button>

                {/* 2. Prayer */}
                <button
                  type="button"
                  onClick={() => togglePractice('prayerCompleted')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRecord.prayerCompleted
                      ? 'bg-[#1FB6B0]/20 border-[#1FB6B0] text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    selectedRecord.prayerCompleted ? 'bg-[#1FB6B0] text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {selectedRecord.prayerCompleted ? '✓' : '🙏'}
                  </span>
                  <div>
                    <h6 className="text-xs font-bold text-white">Honest Prayer</h6>
                    <p className="text-[11px] text-[#A89EC0] mt-0.5">Brought heart & petitions to God</p>
                  </div>
                </button>

                {/* 3. Stillness */}
                <button
                  type="button"
                  onClick={() => togglePractice('stillnessPractice')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRecord.stillnessPractice
                      ? 'bg-[#1FB6B0]/20 border-[#1FB6B0] text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    selectedRecord.stillnessPractice ? 'bg-[#1FB6B0] text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {selectedRecord.stillnessPractice ? '✓' : '🕊'}
                  </span>
                  <div>
                    <h6 className="text-xs font-bold text-white">Abiding Stillness</h6>
                    <p className="text-[11px] text-[#A89EC0] mt-0.5">Quiet presence before the Lord</p>
                  </div>
                </button>

                {/* 4. Journal */}
                <button
                  type="button"
                  onClick={() => togglePractice('journalWritten')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRecord.journalWritten
                      ? 'bg-[#1FB6B0]/20 border-[#1FB6B0] text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    selectedRecord.journalWritten ? 'bg-[#1FB6B0] text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {selectedRecord.journalWritten ? '✓' : '✍️'}
                  </span>
                  <div>
                    <h6 className="text-xs font-bold text-white">Journal Reflection</h6>
                    <p className="text-[11px] text-[#A89EC0] mt-0.5">Recorded what God is teaching you</p>
                  </div>
                </button>

                {/* 5. Sabbath Rest Day Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRecord.isSabbathRest) {
                      handleCancelSabbath(selectedDateStr);
                    } else {
                      handleHonorSabbath(selectedDateStr);
                    }
                  }}
                  className={`sm:col-span-2 flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRecord.isSabbathRest
                      ? 'bg-gradient-to-r from-[#1FB6B0]/30 to-[#8E7BB7]/30 border-[#45D6D0] text-white shadow-md'
                      : 'bg-white/5 border-white/10 hover:border-[#1FB6B0]/50 text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1FB6B0]/20 flex items-center justify-center text-base border border-[#1FB6B0]/30">
                      🕊️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {selectedRecord.isSabbathRest ? 'Sabbath Rest Day Consecrated' : 'Designate as Sabbath Rest Day'}
                      </div>
                      <div className="text-[10px] text-[#A89EC0]">
                        {selectedRecord.isSabbathRest ? 'Rest honors God · Streak protected by grace' : 'Safeguards your streak & awards +50 Grace Points'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                    selectedRecord.isSabbathRest ? 'bg-[#1FB6B0] text-white border-white/20' : 'bg-white/10 text-[#C5BCD9] border-white/15'
                  }`}>
                    {selectedRecord.isSabbathRest ? 'Active 🕊️' : 'Set Rest'}
                  </span>
                </button>
              </div>

              {/* Mood bar for selected day */}
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#B6ABCF]">
                  Log soul state for this day:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCheckInMood(m.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                        selectedRecord.mood === m.id
                          ? 'ring-2 ring-white font-bold bg-white/25 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-[#D8D0E8]'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* GAMIFIED CONSECUTIVE STREAK MILESTONES CARD */}
          <section id="streak-milestones-card" className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-200/80 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">Milestones</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EBDD78]/40 text-[#694E09] border border-[#E8CB72]/60">
                    Streak Records
                  </span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-serif text-[#1E1931] mt-0.5">Consecutive Streak Badges</h4>
                <p className="text-xs text-[#706782] mt-1 max-w-xl">
                  Gamify your spiritual journey with commemorative badges earned for consecutive daily records of Scripture, prayer, and quiet abiding.
                </p>
              </div>

              {/* Unlocked Counter Pill */}
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D4] text-xs font-bold text-[#55492F] flex items-center gap-2 shadow-xs">
                  <span className="text-base">🏆</span>
                  <span>{unlockedMilestonesCount} of {STREAK_MILESTONES.length} Badges Unlocked</span>
                </div>
              </div>
            </div>

            {/* Next Milestone Gamification Progress Banner */}
            {nextMilestone && (
              <div id="next-milestone-banner" className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#211B3B] via-[#2D234F] to-[#1E3E4B] text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
                      {nextMilestone.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#37C6C2]">
                          Next Upcoming Milestone
                        </span>
                        <span className="text-[10px] text-[#C5BCD9]">· {nextMilestone.tier}</span>
                      </div>
                      <h5 className="text-lg sm:text-xl font-serif font-bold text-white mt-0.5">
                        {nextMilestone.title} ({nextMilestone.days} Consecutive Days)
                      </h5>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-2xl font-bold font-serif text-[#E3B15E]">
                      {nextMilestoneDaysLeft} days
                    </span>
                    <span className="text-xs text-[#C5BCD9] block sm:inline"> to unlock</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[#C5BCD9] mb-1.5 font-medium">
                    <span>Current Streak: <strong className="text-white">{currentStreak} days</strong></span>
                    <span>{nextMilestoneProgress}% completed ({currentStreak}/{nextMilestone.days}d)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] via-[#37C6C2] to-[#E3B15E] transition-all duration-500 shadow-sm"
                      style={{ width: `${nextMilestoneProgress}%` }}
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-[#EAE5F3] italic flex items-center gap-1.5">
                    <span>🔥</span>
                    <span>“{nextMilestone.scripture}”</span>
                    <strong className="text-[#37C6C2] not-italic">— {nextMilestone.scriptureRef}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Filter Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {(['all', 'unlocked', 'locked'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMilestoneFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                      milestoneFilter === f
                        ? 'bg-[#2A2146] text-white shadow-xs'
                        : 'bg-gray-100 text-[#554A70] hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all'
                      ? `All Badges (${STREAK_MILESTONES.length})`
                      : f === 'unlocked'
                      ? `Unlocked (${unlockedMilestonesCount})`
                      : `Locked (${STREAK_MILESTONES.length - unlockedMilestonesCount})`}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#8A7DAD]">
                Click any badge to view Scripture & reflections
              </span>
            </div>

            {/* Grid of Streak Milestone Badges */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMilestones.map(m => {
                const isUnlocked = currentStreak >= m.days || longestStreak >= m.days;
                const progress = Math.min(100, Math.round((currentStreak / m.days) * 100));
                const daysRemaining = Math.max(0, m.days - currentStreak);

                return (
                  <div
                    key={m.id}
                    id={`milestone-badge-${m.days}`}
                    onClick={() => setSelectedMilestone(m)}
                    className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-[#FAF9F5] via-white to-[#F5EFE3] border-[#E2D5BE] hover:shadow-md hover:border-[#D0BF9D]'
                        : 'bg-gray-50/70 border-gray-200/80 hover:border-gray-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Medallion Badge Icon */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-transform group-hover:scale-105 shadow-sm border ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-white to-[#FFF6E3] border-[#E8CB72] shadow-md ring-2 ring-[#E8CB72]/30'
                            : 'bg-gray-100 border-gray-200 text-gray-400 grayscale'
                        }`}
                      >
                        {m.icon}
                      </div>

                      {/* Status Pill */}
                      <div>
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#1FB6B0]/15 text-[#0F7571] border border-[#1FB6B0]/30 shadow-2xs">
                            <span>✓</span> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                            <span>🔒</span> {daysRemaining}d left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7539]">
                          {m.tier}
                        </span>
                        <span className="text-[10px] text-gray-400">·</span>
                        <span className="text-[10px] font-bold text-[#1FB6B0]">
                          {m.days} Days Streak
                        </span>
                      </div>
                      <h5 className="text-base font-bold font-serif text-[#1E1931] mt-0.5 group-hover:text-[#189C97] transition-colors">
                        {m.title}
                      </h5>
                      <p className="text-xs text-[#706782] mt-1 leading-relaxed line-clamp-2">
                        {m.description}
                      </p>
                    </div>

                    {/* Progress Bar inside Card */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-[11px] mb-1 font-medium">
                        <span className="text-gray-500">
                          {isUnlocked ? 'Record achieved' : `${currentStreak} / ${m.days} days`}
                        </span>
                        <span className={`font-bold ${isUnlocked ? 'text-[#1FB6B0]' : 'text-[#8A7539]'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isUnlocked ? 'bg-[#1FB6B0]' : 'bg-[#E3B15E]'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Faith Stepping Stones (Secondary Badges) */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#705E8C]">Spiritual Journey</span>
                  <h5 className="text-lg font-serif text-[#1E1931] mt-0.5">Faith Practice Stepping Stones</h5>
                </div>
                <span className="text-xs text-[#706782]">
                  {badges.filter(b => b.earned).length} of {badges.length} unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {badges.map(b => (
                  <div
                    key={b.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                      b.earned
                        ? 'bg-[#F9F7FD] border-[#D6CAED]'
                        : 'bg-gray-50/70 border-gray-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        b.earned ? 'bg-[#EBDD78]/40 text-[#6B5A10]' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {b.icon}
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-[#1E1931]">{b.title}</h6>
                      <p className="text-[11px] text-[#706782] mt-0.5 leading-relaxed">{b.description}</p>
                      <span className={`inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider ${b.earned ? 'text-[#1FB6B0]' : 'text-gray-400'}`}>
                        {b.earned ? '✓ Unlocked' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* DEDICATED TAB: MILESTONES SHOWCASE */}
      {tab === 'milestones' && (
        <div className="mt-8 space-y-8">
          <section id="dedicated-milestones-view" className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">Trophy Cabinet</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1FB6B0]/15 text-[#0F7571] border border-[#1FB6B0]/30">
                    Consecutive Records
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif text-[#1E1931] mt-0.5">Consecutive Streak Milestones</h3>
                <p className="text-xs text-[#706782] mt-1 max-w-xl">
                  Every day of quiet prayer, Scripture, and stillness builds spiritual resilience. Earn badge records for 7, 30, and 100 consecutive days of devotion.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-[#211B3B] text-white text-xs font-bold flex items-center gap-2 shadow-sm">
                  <span>🔥</span>
                  <span>Active Streak: {currentStreak} Days</span>
                </div>
              </div>
            </div>

            {/* Next Milestone Hero */}
            {nextMilestone && (
              <div className="mt-6 p-6 rounded-3xl bg-gradient-to-r from-[#211B3B] via-[#2A1F4A] to-[#16424D] text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E3B15E] to-[#F28C38] flex items-center justify-center text-3xl shadow-lg shrink-0 text-white">
                      {nextMilestone.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#37C6C2]">
                          Next Trophy Goal
                        </span>
                        <span className="text-xs text-[#C5BCD9]">· {nextMilestone.tier}</span>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-serif font-bold text-white mt-0.5">
                        {nextMilestone.title} ({nextMilestone.days} Consecutive Days)
                      </h4>
                      <p className="text-xs text-[#DCD4EB] mt-1 max-w-lg">
                        {nextMilestone.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center shrink-0">
                    <span className="text-xs uppercase font-semibold text-[#B6ABCF]">Remaining</span>
                    <p className="text-2xl font-bold font-serif text-[#E3B15E] mt-0.5">
                      {nextMilestoneDaysLeft} Days
                    </p>
                    <span className="text-[11px] text-[#37C6C2] font-semibold">{nextMilestoneProgress}% done</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs text-[#C5BCD9] mb-1.5">
                    <span>Progress to {nextMilestone.days} days</span>
                    <span>{currentStreak} of {nextMilestone.days} days completed</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] via-[#37C6C2] to-[#E3B15E] transition-all duration-500 shadow-sm"
                      style={{ width: `${nextMilestoneProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Filter pills */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {(['all', 'unlocked', 'locked'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMilestoneFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                      milestoneFilter === f
                        ? 'bg-[#2A2146] text-white shadow-xs'
                        : 'bg-gray-100 text-[#554A70] hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all'
                      ? `All Milestones (${STREAK_MILESTONES.length})`
                      : f === 'unlocked'
                      ? `Unlocked (${unlockedMilestonesCount})`
                      : `Locked (${STREAK_MILESTONES.length - unlockedMilestonesCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges List */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMilestones.map(m => {
                const isUnlocked = currentStreak >= m.days || longestStreak >= m.days;
                const progress = Math.min(100, Math.round((currentStreak / m.days) * 100));
                const daysRemaining = Math.max(0, m.days - currentStreak);

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMilestone(m)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-[#FAF9F5] via-white to-[#F5EFE3] border-[#E2D5BE] hover:shadow-md'
                        : 'bg-gray-50/70 border-gray-200/80 hover:border-gray-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm border ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-white to-[#FFF6E3] border-[#E8CB72] ring-2 ring-[#E8CB72]/30'
                            : 'bg-gray-100 border-gray-200 text-gray-400 grayscale'
                        }`}
                      >
                        {m.icon}
                      </div>

                      <div>
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#1FB6B0]/15 text-[#0F7571] border border-[#1FB6B0]/30 shadow-2xs">
                            <span>✓</span> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                            <span>🔒</span> {daysRemaining}d left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7539]">
                          {m.tier}
                        </span>
                        <span className="text-[10px] text-gray-400">·</span>
                        <span className="text-[10px] font-bold text-[#1FB6B0]">
                          {m.days} Days Streak
                        </span>
                      </div>
                      <h5 className="text-base font-bold font-serif text-[#1E1931] mt-0.5">
                        {m.title}
                      </h5>
                      <p className="text-xs text-[#706782] mt-1 leading-relaxed line-clamp-2">
                        {m.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-[11px] mb-1 font-medium">
                        <span className="text-gray-500">
                          {isUnlocked ? 'Record achieved' : `${currentStreak} / ${m.days} days`}
                        </span>
                        <span className={`font-bold ${isUnlocked ? 'text-[#1FB6B0]' : 'text-[#8A7539]'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isUnlocked ? 'bg-[#1FB6B0]' : 'bg-[#E3B15E]'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: RECHARTS 30-DAY MOOD TRENDS */}
      {tab === 'trends' && (
        <div className="mt-8 space-y-8">
          <section
            id="recharts-mood-trends-card"
            className="rounded-3xl bg-[#1C1733] border border-white/10 p-6 sm:p-8 text-white shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1FB6B0] animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#1FB6B0]">
                    Recharts Visualization
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white mt-1">
                  Mood Trends Over the Past 30 Days
                </h2>
                <p className="text-xs text-[#A69DC2] mt-1">
                  Daily spiritual and emotional trajectory across gratitude, peace, seeking, conviction, doubt, and distance.
                </p>
              </div>

              {/* Legend preview */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {MOODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMoodFilter(selectedMoodFilter === m.id ? null : m.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all ${
                      selectedMoodFilter === m.id
                        ? 'ring-2 ring-white font-bold bg-white/20'
                        : 'bg-white/5 hover:bg-white/10 text-[#C6BEDC]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* The Line Chart */}
            <div className="mt-6 w-full h-[280px] sm:h-[340px]">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 18, right: 18, left: -20, bottom: 6 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dayLabel"
                      tick={{ fill: '#9D93BA', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                      interval={2}
                    />
                    <YAxis
                      domain={[0.5, 6.5]}
                      ticks={[1, 2, 3, 4, 5, 6]}
                      tickFormatter={(val: number) => {
                        const iconMap: Record<number, string> = {
                          6: '🙏 Grateful',
                          5: '🕊 Peaceful',
                          4: '🔍 Seeking',
                          3: '🕯 Convicted',
                          2: '🤔 Doubting',
                          1: '🌫 Distant',
                        };
                        return iconMap[val] || '';
                      }}
                      tick={{ fill: '#C6BEDC', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <ReferenceLine
                      y={4.5}
                      stroke="rgba(55, 198, 194, 0.25)"
                      strokeDasharray="4 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="moodLevel"
                      stroke="#1FB6B0"
                      strokeWidth={3}
                      dot={<CustomLineDot />}
                      activeDot={{
                        r: 8,
                        stroke: '#FFFFFF',
                        strokeWidth: 2.5,
                        fill: '#1FB6B0',
                      }}
                      connectNulls
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#8A7DAD]">
                  Preparing interactive trend chart…
                </div>
              )}
            </div>

            {/* Quick check-in action bar */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#B6ABCF]">
                  Log today’s mood to update chart:
                </span>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCheckInMood(m.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
                      style={{ borderLeft: `3px solid ${m.color}` }}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: JOURNAL & SCRIPTURE */}
      {tab === 'journal' && (
        <div className="mt-8 space-y-8">
          <section id="journal-input-section" className="rounded-3xl bg-[#211B3B] p-6 sm:p-8 text-white shadow-lg">
            <h3 className="text-xl font-serif text-white mb-2">Write a Journal Reflection</h3>
            <p className="text-xs text-[#B6ABCF] mb-4">
              Bring your thoughts, gratitude, or questions honestly before the Lord.
            </p>
            <form onSubmit={handleAddJournal} className="space-y-3">
              <textarea
                id="journal-input"
                rows={3}
                placeholder="What is God speaking into your heart today?..."
                value={newEntryText}
                onChange={e => setNewEntryText(e.target.value)}
                className="w-full rounded-2xl bg-white/10 border border-white/15 p-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1FB6B0]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newEntryText.trim()}
                  className="px-6 py-2.5 rounded-full bg-[#1FB6B0] hover:bg-[#189C97] disabled:opacity-50 text-[#17132B] font-bold text-xs transition-all shadow"
                >
                  Save Reflection (+1 Streak)
                </button>
              </div>
            </form>
          </section>

          <section id="journal-entries-section" className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-serif text-[#1E1931] mb-4">Recent Reflections</h3>
            <div className="space-y-4">
              {journal.map(entry => (
                <div
                  key={entry.id}
                  className="p-5 rounded-2xl bg-[#FAF8F5] border border-gray-200/70"
                >
                  <span className="text-[11px] font-semibold text-[#8B7FA4]">{entry.date}</span>
                  <p className="mt-1 text-sm text-[#2F2745] leading-relaxed font-sans">{entry.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="favorite-verses-section" className="rounded-3xl bg-[#F6F4EB] p-6 sm:p-8 border border-[#E8E1CE] shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B6E4A]">Memorized & Cherished</span>
            <h3 className="text-xl font-serif text-[#2B2313] mt-0.5 mb-4">Favorite Scripture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map(fav => (
                <div key={fav.id} className="p-5 rounded-2xl bg-white border border-[#DFD7C1] shadow-xs">
                  <p className="font-serif italic text-base text-[#2E273A] leading-relaxed">
                    “{fav.verseText}”
                  </p>
                  <span className="block mt-3 text-xs font-bold text-[#8A7539]">— {fav.verseReference}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: WEEKLY SPIRITUAL PULSE */}
      {tab === 'pulse' && (
        <div id="weekly-spiritual-pulse-view" className="mt-8 space-y-8 animate-fade-in">
          {/* Header & Date Range Card */}
          <div className="rounded-3xl bg-gradient-to-r from-[#211B3B] via-[#2F2353] to-[#16424D] p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-extrabold uppercase tracking-widest text-[#37C6C2]">
                  <span>✦</span>
                  <span>Weekly Spiritual Pulse</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-white mt-2">
                  Past Seven Days Heart Summary
                </h2>
                <p className="text-sm text-[#D8CFEA] mt-1 max-w-xl">
                  A personalized reflection of your soul’s journey, mood patterns, and consecutive streak milestone achievements for <strong>{weeklyPulseData.dateRangeFormatted}</strong>.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="pulse-jump-to-email-btn"
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('pulse-email-dispatch-card');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#1FB6B0] hover:bg-[#189b96] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>✉️</span>
                  <span>Email This Summary</span>
                </button>
                <button
                  id="pulse-preview-html-toggle-btn"
                  type="button"
                  onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>👁️</span>
                  <span>{showHtmlPreview ? 'Hide HTML Preview' : 'Preview Email Layout'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl">🔥</div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.currentStreak} Days
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#37C6C2] mt-0.5">
                  Consecutive Streak
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl">{weeklyPulseData.dominantMood.emoji}</div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.dominantMood.label}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#E3B15E] mt-0.5">
                  Dominant Soul State
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl">🌱</div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.consistencyRate}%
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#37C6C2] mt-0.5">
                  7-Day Consistency ({weeklyPulseData.totalCheckIns}/7)
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl">🏆</div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.milestonesUnlocked.length} Badges
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C4B7E0] mt-0.5">
                  Milestones Earned
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: 7-Day Soul Rhythm & Mood Patterns */}
          <section id="pulse-mood-patterns-section" className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                  1. Seven-Day Soul Rhythm
                </span>
                <h3 className="text-2xl font-serif text-[#1E1835] mt-0.5">
                  Mood Patterns & Emotional Distribution
                </h3>
              </div>
              <div className="text-xs text-[#705E8C] font-semibold bg-[#F5F2F9] px-3 py-1.5 rounded-full self-start">
                Daily Check-ins from {weeklyPulseData.dateRangeFormatted}
              </div>
            </div>

            {/* 7-Day Timeline Badges */}
            <div className="mt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#705E8C] mb-3">
                Daily Check-in Timeline
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
                {weeklyPulseData.days.map((d) => (
                  <div
                    key={d.date}
                    className={`rounded-2xl p-3 text-center border transition-all ${
                      d.intensity > 0 || d.mood
                        ? 'bg-[#FAF8FC] border-[#D8CFEC] shadow-xs hover:border-[#1FB6B0]'
                        : 'bg-[#F4F2F7] border-[#E8E4EE] opacity-75'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-[#7B6E96] block">
                      {d.dayName.slice(0, 3)}
                    </span>
                    <span className="text-xs font-semibold text-[#352B4E] block mt-0.5">
                      {d.formattedDate}
                    </span>
                    <span className="text-2xl my-2 block">
                      {d.moodEmoji}
                    </span>
                    <span
                      className="text-[10px] font-bold block truncate"
                      style={{ color: d.moodColor }}
                    >
                      {d.moodLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mood Frequency Distribution */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-[#ECE7F4]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-[#2A2045]">
                    Soul State Frequency
                  </h4>
                  <span className="text-xs text-[#7B6E96] font-medium">
                    {weeklyPulseData.totalCheckIns} recorded check-ins
                  </span>
                </div>
                <div className="space-y-3">
                  {Object.entries(weeklyPulseData.moodCounts).map(([key, item]) => {
                    const pct = weeklyPulseData.totalCheckIns > 0
                      ? Math.round((item.count / weeklyPulseData.totalCheckIns) * 100)
                      : 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-[#2A2045]">
                            <span className="text-sm">{item.emoji}</span>
                            <span>{item.label}</span>
                          </span>
                          <span className="text-[#65597C]">
                            {item.count} {item.count === 1 ? 'day' : 'days'} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#EAE5F2] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pastoral Rhythm Reflection */}
              <div className="bg-[#F3FAF9] border border-[#C5EDE8] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[#0E7773] text-xs font-extrabold uppercase tracking-wider">
                  <span>✦</span>
                  <span>Pastoral Heart Reflection</span>
                </div>
                <h4 className="text-lg font-serif font-bold text-[#104845] mt-1">
                  Walking in {weeklyPulseData.dominantMood.label}
                </h4>
                <p className="text-sm text-[#1B5753] mt-2 leading-relaxed">
                  {weeklyPulseData.dominantMood.insight}
                </p>
                <div className="mt-4 pt-4 border-t border-[#C5EDE8] flex items-center gap-3 text-xs text-[#136864]">
                  <span className="text-base">🕯️</span>
                  <span>
                    Dominant posture for <strong>{weeklyPulseData.dominantMood.count} of 7 days</strong> ({weeklyPulseData.dominantMood.percentage}% of your spiritual focus).
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Milestone Achievements for the Week */}
          <section id="pulse-milestones-section" className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                  2. Streak Milestones & Records
                </span>
                <h3 className="text-2xl font-serif text-[#1E1835] mt-0.5">
                  Milestone Achievements
                </h3>
              </div>
              <div className="text-xs text-[#705E8C] font-semibold bg-[#F5F2F9] px-3 py-1.5 rounded-full self-start">
                Active Streak: {weeklyPulseData.currentStreak} Days
              </div>
            </div>

            {/* Unlocked Badges Showcase */}
            <div className="mt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#705E8C] mb-3">
                Unlocked Streak Milestones
              </div>
              {weeklyPulseData.milestonesUnlocked.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {weeklyPulseData.milestonesUnlocked.map((m) => (
                    <div
                      key={m.days}
                      className="inline-flex items-center gap-3 bg-[#FFFDF7] border border-[#E8CB72] rounded-2xl px-4 py-3 shadow-xs"
                    >
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#4A3A0B]">{m.title}</span>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#F4E8B0] text-[#59440D]">
                            {m.days}d
                          </span>
                        </div>
                        <span className="text-[11px] text-[#826F3E] font-medium">{m.tier} · Unlocked</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FAF8FC] border border-[#ECE7F4] text-xs text-[#7B6E96] italic">
                  Keep walking daily to unlock your first milestone at 3 consecutive days!
                </div>
              )}
            </div>

            {/* Next Milestone Countdown Card */}
            {weeklyPulseData.nextMilestone && (
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#211B3B] via-[#2D234F] to-[#1E3E4B] p-6 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shrink-0">
                      {weeklyPulseData.nextMilestone.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#37C6C2]">
                        Next Milestone Target
                      </div>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {weeklyPulseData.nextMilestone.title} ({weeklyPulseData.nextMilestone.days} Consecutive Days)
                      </h4>
                      <p className="text-xs text-[#C5BCD9]">
                        {weeklyPulseData.nextMilestone.tier}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right shrink-0">
                    <span className="text-2xl font-bold font-serif text-[#E3B15E]">
                      {weeklyPulseData.nextMilestone.daysRemaining} days
                    </span>
                    <span className="text-xs text-[#C5BCD9] block">remaining to unlock</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] to-[#E3B15E] transition-all"
                      style={{ width: `${weeklyPulseData.nextMilestone.progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#C5BCD9] mt-2">
                    <span>{weeklyPulseData.currentStreak} of {weeklyPulseData.nextMilestone.days} days completed</span>
                    <span className="font-bold text-[#37C6C2]">{weeklyPulseData.nextMilestone.progressPercentage}% progress</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Faithful Stepping Stones & Scripture Promise */}
          <section id="pulse-practices-scripture-section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Practices Stepping Stones */}
            <div className="rounded-3xl bg-white border border-gray-200/80 p-6 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                3. Faithful Stepping Stones
              </span>
              <h3 className="text-xl font-serif text-[#1E1835] mt-0.5">
                Practices Completed
              </h3>
              <p className="text-xs text-[#7B6E96] mt-1">
                Small, faithful disciplines over the past 7 days.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-4 text-center">
                  <span className="text-2xl block">📖</span>
                  <span className="text-2xl font-bold font-serif text-[#211B3B] block mt-1">
                    {weeklyPulseData.practicesTotals.scriptureDays}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7B6E96] block">Scripture Days</span>
                </div>

                <div className="bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-4 text-center">
                  <span className="text-2xl block">🕯️</span>
                  <span className="text-2xl font-bold font-serif text-[#211B3B] block mt-1">
                    {weeklyPulseData.practicesTotals.stillnessMinutes}m
                  </span>
                  <span className="text-[11px] font-semibold text-[#7B6E96] block">Stillness Practiced</span>
                </div>

                <div className="bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-4 text-center">
                  <span className="text-2xl block">🙏</span>
                  <span className="text-2xl font-bold font-serif text-[#211B3B] block mt-1">
                    {weeklyPulseData.practicesTotals.prayersOffered}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7B6E96] block">Prayers Offered</span>
                </div>

                <div className="bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-4 text-center">
                  <span className="text-2xl block">✍️</span>
                  <span className="text-2xl font-bold font-serif text-[#211B3B] block mt-1">
                    {weeklyPulseData.practicesTotals.journalEntries}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7B6E96] block">Journal Entries</span>
                </div>
              </div>
            </div>

            {/* Weekly Scripture Promise */}
            <div className="rounded-3xl bg-[#FAF8F2] border border-[#EBE4D5] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8A7539]">
                  4. Scripture Promise
                </span>
                <h3 className="text-xl font-serif text-[#2B2313] mt-0.5">
                  Word for Your Soul
                </h3>
                <blockquote className="mt-4 font-serif italic text-base sm:text-lg text-[#3A2E19] leading-relaxed border-l-3 border-[#E3B15E] pl-4">
                  “{weeklyPulseData.weeklyScripture.text}”
                </blockquote>
                <p className="mt-2 text-xs font-bold text-[#8A7539] pl-4">
                  — {weeklyPulseData.weeklyScripture.reference}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EAE2D2] text-xs text-[#6B5E43] leading-relaxed">
                {weeklyPulseData.pastoralEncouragement}
              </div>
            </div>
          </section>

          {/* Section 4: Email Dispatch & Delivery Center */}
          <section id="pulse-email-dispatch-card" className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                    Email Delivery Center
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF7F6] text-[#0E7773] border border-[#C5EDE8]">
                    Ready to Send
                  </span>
                </div>
                <h3 className="text-2xl font-serif text-[#1E1835] mt-0.5">
                  Email Your Weekly Spiritual Pulse
                </h3>
                <p className="text-xs text-[#7B6E96] mt-1">
                  Deliver a beautifully formatted summary of your 7-day mood patterns and milestone achievements directly to your inbox.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="toggle-pulse-preview-card-btn"
                  type="button"
                  onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-[#443860] transition-all cursor-pointer"
                >
                  {showHtmlPreview ? 'Hide Preview' : 'Preview Email HTML'}
                </button>
              </div>
            </div>

            {/* Email form & Trigger */}
            <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-end gap-3">
              <div className="flex-1">
                <label htmlFor="spiritual-pulse-email-input" className="block text-xs font-bold text-[#352B4E] mb-1.5">
                  Recipient Email Address
                </label>
                <div className="relative">
                  <input
                    id="spiritual-pulse-email-input"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter email address (e.g. asketfranckolivieralex@gmail.com)"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF8FC] border border-[#D8CFEC] text-sm text-[#1E1835] focus:outline-none focus:ring-2 focus:ring-[#1FB6B0] focus:bg-white transition-all pr-24"
                  />
                  {recipientEmail !== 'asketfranckolivieralex@gmail.com' && (
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('asketfranckolivieralex@gmail.com')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#705E8C] hover:text-[#1E1835] font-semibold underline cursor-pointer"
                    >
                      Reset default
                    </button>
                  )}
                </div>
              </div>

              <button
                id="send-spiritual-pulse-now-btn"
                type="button"
                disabled={isSendingPulse}
                onClick={() => handleSendSpiritualPulse()}
                className="px-6 py-3 rounded-2xl bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isSendingPulse ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Pulse...</span>
                  </>
                ) : (
                  <>
                    <span>✉️</span>
                    <span>Send Weekly Pulse Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Auto-Email Checkbox */}
            <div className="mt-4 flex items-center gap-2 text-xs text-[#5B4F75]">
              <input
                id="auto-email-checkbox"
                type="checkbox"
                checked={autoEmailEnabled}
                onChange={handleToggleAutoEmail}
                className="w-4 h-4 rounded text-[#1FB6B0] focus:ring-[#1FB6B0] border-gray-300 cursor-pointer"
              />
              <label htmlFor="auto-email-checkbox" className="cursor-pointer select-none">
                Automatically generate and email my Weekly Spiritual Pulse every Sunday evening
              </label>
            </div>

            {/* Delivery Result Feedback Banner */}
            {pulseSentResult && (
              <div
                id="pulse-delivery-receipt-banner"
                className={`mt-5 p-4 rounded-2xl border transition-all ${
                  pulseSentResult.success
                    ? 'bg-[#EBF9F8] border-[#92E3DE] text-[#0B5C58]'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">
                      {pulseSentResult.success ? '✓' : '⚠️'}
                    </span>
                    <div>
                      <p className="text-sm font-bold">
                        {pulseSentResult.message}
                      </p>
                      {pulseSentResult.success && (
                        <p className="text-xs text-[#136C68] mt-1">
                          Delivery ID: <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono text-[11px]">{pulseSentResult.messageId || 'pulse_live'}</code>
                          {' · '}
                          Dispatched at {pulseSentResult.timestamp}
                          {pulseSentResult.provider && ` via ${pulseSentResult.provider}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {pulseSentResult.previewHtml && (
                    <button
                      type="button"
                      onClick={() => setShowHtmlPreview(true)}
                      className="text-xs font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
                    >
                      View Live Layout
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* In-App Live HTML Email Preview Drawer */}
            {showHtmlPreview && (
              <div id="pulse-html-preview-drawer" className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#705E8C]">
                      Rendered Responsive Email Preview
                    </h4>
                    <p className="text-xs text-[#7B6E96]">
                      Exact HTML email format sent to {recipientEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHtmlPreview(false)}
                    className="text-xs font-bold text-[#705E8C] hover:text-[#1E1835] cursor-pointer"
                  >
                    ✕ Close Preview
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 shadow-inner">
                  <iframe
                    title="Spiritual Pulse Email Preview"
                    srcDoc={pulseSentResult?.previewHtml || ''}
                    className="w-full h-[640px] border-0"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* INTERACTIVE MILESTONE DETAILS MODAL */}
      {selectedMilestone && (
        <div
          id="milestone-details-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setSelectedMilestone(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1FB6B0] via-[#E3B15E] to-[#F28C38]" />

            {/* Close button */}
            <button
              id="close-milestone-modal"
              type="button"
              onClick={() => setSelectedMilestone(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-sm transition-all"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Modal Content */}
            <div className="flex items-center gap-4 mt-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF8ED] to-[#F7EEDA] border border-[#E8CB72] flex items-center justify-center text-3xl shadow-sm shrink-0">
                {selectedMilestone.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7539]">
                    {selectedMilestone.tier}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-[11px] font-bold text-[#1FB6B0]">
                    {selectedMilestone.days} Days Streak
                  </span>
                </div>
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1931] mt-0.5">
                  {selectedMilestone.title}
                </h4>
              </div>
            </div>

            {/* Status & Progress Bar */}
            <div className="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              {currentStreak >= selectedMilestone.days || longestStreak >= selectedMilestone.days ? (
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F7571]">
                  <span className="w-5 h-5 rounded-full bg-[#1FB6B0] text-white flex items-center justify-center text-xs">✓</span>
                  <span>Milestone Unlocked! Keep the sacred rhythm unbroken.</span>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#554A70] mb-1.5">
                    <span>Current Streak: {currentStreak} days</span>
                    <span>{Math.max(0, selectedMilestone.days - currentStreak)} days remaining</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] to-[#E3B15E] transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((currentStreak / selectedMilestone.days) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-[#554A70] leading-relaxed">
              {selectedMilestone.description}
            </p>

            {/* Scripture Quote */}
            <div className="mt-4 p-4 rounded-2xl bg-[#FAF8F3] border border-[#E9E1CE]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7539]">
                Scripture Inspiration
              </span>
              <blockquote className="mt-1 text-sm italic font-serif text-[#2B2313] leading-relaxed">
                “{selectedMilestone.scripture}”
              </blockquote>
              <span className="block mt-2 text-xs font-bold text-[#8A7539]">
                — {selectedMilestone.scriptureRef}
              </span>
            </div>

            {/* Reward Title */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Honorary Title</span>
                <p className="text-xs font-bold text-[#1E1931]">{selectedMilestone.rewardTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="px-5 py-2 rounded-full bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressScreen;
