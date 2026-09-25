"use client";

import React, { useState, useMemo, useSyncExternalStore, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  CalendarBlank,
  Trophy,
  ChartLineUp,
  PencilSimpleLine,
  Sparkle,
  Bell,
  Flame,
  ShieldCheck,
  Lightning,
  Crown,
  EnvelopeSimple,
  Eye,
  Gear,
  X,
  Check,
  BookOpen,
  HandsPraying,
  Heart,
} from '@phosphor-icons/react';
import { useChristianAuth } from '../lib/christian-auth';
import type { PulseDaySummary, SpiritualPulseData } from '../app/api/spiritual-pulse/send/route';
import { BurnoutPreventionCard } from './BurnoutPreventionCard';
import { DynamicMoodJournal } from './DynamicMoodJournal';
import type { JournalEntry } from './DynamicMoodJournal';
import { WeeklyInsightChart } from './WeeklyInsightChart';
import { StreakGamificationCard, SPIRITUAL_LEVELS } from './StreakGamificationCard';
import { MoodTrendsAnalytics } from './MoodTrendsAnalytics';
import { DailyGoalCard } from './DailyGoalCard';
import { MonthlyMoodHeatmap } from './MonthlyMoodHeatmap';
import { StreakMilestoneAnimation } from './StreakMilestoneAnimation';
import { StreakMilestoneProgressBarCard } from './StreakMilestoneProgressBarCard';
import { JournalSearchBar } from './JournalSearchBar';
import { RecurringEmotionalPatternsSummary } from './RecurringEmotionalPatternsSummary';
import { NotificationSettingsModal, DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from './NotificationSettingsModal';
import { BadgeCelebrationModal, type BadgeCelebrationData } from './BadgeCelebrationModal';
import { VisualMoodUpdateCard } from './VisualMoodUpdateCard';
import { VisualRewardsBadgesCard } from './VisualRewardsBadgesCard';
import { JourneyGraceProtectionCard } from './JourneyGraceProtectionCard';
import { DailyDevotionGoalCard } from './DailyDevotionGoalCard';
import { WeeklyConsistencyCard } from './WeeklyConsistencyCard';
import { VisualStreakCounter } from './VisualStreakCounter';
import { calculateConsecutiveStreak, isRecordActive } from '../lib/streak-utils';
import { DailyRitualModal } from './DailyRitualModal';
import { LIFEBOOK_RITUAL_COMPLETED_EVENT } from '../lib/daily-ritual';

export type { JournalEntry };

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
  subtitle?: string;
  description: string;
  category?: 'streak' | 'reflection' | 'faith' | 'grace';
  earned: boolean;
  earnedDate?: string;
  icon: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  tierLabel?: string;
  tierColor?: string;
  requirement?: string;
  currentProgress?: number;
  targetProgress?: number;
  rewardPoints?: number;
  scripture?: string;
  scriptureRef?: string;
  reflection?: string;
  unlockedPerks?: string[];
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
    icon: '🌱',
    rewardTitle: 'Vine & Branches',
  },
  {
    id: 'streak-21',
    days: 21,
    title: '21-Day Habit of Grace',
    tier: 'Amethyst Disciple',
    description: '21 continuous days to rewire the spiritual heart and establish an automatic daily rhythm',
    scripture: 'Do not be conformed to this world, but be transformed by the renewal of your mind.',
    scriptureRef: 'Romans 12:2',
    icon: '💎',
    rewardTitle: 'Transformed Heart',
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
    id: 'streak-50',
    days: 50,
    title: '50-Day Pentecost Jubilee',
    tier: 'Pentecost Flame',
    description: 'Fifty sacred days honoring the biblical Jubilee and the outpouring of the Holy Spirit',
    scripture: 'When the day of Pentecost arrived, they were all together in one place... And they were all filled.',
    scriptureRef: 'Acts 2:1-4',
    icon: '🔥',
    rewardTitle: 'Jubilee Vessel',
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

export interface FavoriteVerse {
  id: string;
  verseText: string;
  verseReference: string;
}

// Initialize clean, empty calendar records for genuine user progress tracking
function generateDefaultCalendarRecords(): Record<string, DayActivityRecord> {
  return {};
}

const DEFAULT_BADGES: Badge[] = [
  {
    id: 'b_faithful_week',
    title: 'Faithful Week',
    subtitle: '7 Consecutive Days of Holy Devotion',
    description: 'Maintained an unbroken 7-day walk of daily prayer, Scripture reading, and sacred quiet time.',
    category: 'streak',
    earned: false,
    icon: '🌿',
    tier: 'silver',
    tierLabel: 'Silver Cadence',
    tierColor: '#1FB6B0',
    requirement: 'Maintain a 7-day continuous devotion streak',
    currentProgress: 0,
    targetProgress: 7,
    rewardPoints: 75,
    scripture: 'By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.',
    scriptureRef: 'Genesis 2:2',
    reflection: 'Seven continuous days walking with God. You have traded anxious hurry for a sacred cadence of daily Scripture, prayer, and holy rest.',
    unlockedPerks: [
      '+75 Grace Points awarded to your Sanctuary',
      'Silver Cadence Seal in Trophy Cabinet',
      'Weekly Sabbath Peace Shield protection',
    ],
  },
  {
    id: 'b_monthly_reflection',
    title: 'Monthly Reflection',
    subtitle: '30-Day Spiritual Pillar & Soul Review',
    description: 'Attentive spiritual rhythm maintained over 30 days with deep monthly reflection before God.',
    category: 'reflection',
    earned: false,
    icon: '👑',
    tier: 'gold',
    tierLabel: 'Gold Anchor',
    tierColor: '#E3B15E',
    requirement: 'Complete 30 days of quiet time check-ins and monthly soul review',
    currentProgress: 0,
    targetProgress: 30,
    rewardPoints: 150,
    scripture: 'He is like a tree planted by streams of water that yields its fruit in its season, and its leaf does not wither.',
    scriptureRef: 'Psalm 1:3',
    reflection: 'Thirty days of steadfast daily communion. What began as a mustard-seed step has grown into a deep-rooted spiritual pillar in your life.',
    unlockedPerks: [
      '+150 Grace Points awarded to your Sanctuary',
      'Gold Anchor Seal in Trophy Cabinet',
      'Golden Pillar Glow badge for your profile',
    ],
  },
  {
    id: 'b1',
    title: 'First Step',
    subtitle: 'Dawn of a Daily Sacred Walk',
    description: 'Began your first Scripture check-in and opened your heart before God',
    category: 'faith',
    earned: false,
    icon: '✦',
    tier: 'bronze',
    tierLabel: 'Bronze Spark',
    tierColor: '#CD7F32',
    requirement: 'Log your first daily quiet time check-in',
    currentProgress: 0,
    targetProgress: 1,
    rewardPoints: 25,
    scripture: 'Your word is a lamp to my feet and a light to my path.',
    scriptureRef: 'Psalm 119:105',
    reflection: 'Every great spiritual journey begins with a single humble step into the presence of God.',
    unlockedPerks: ['+25 Grace Points', 'Pilgrim Compass Seal'],
  },
  {
    id: 'b3',
    title: 'Honest Heart',
    subtitle: 'Vulnerable Prayer Before the Lord',
    description: 'Brought seeking, questions, or doubt openly before the Lord in honest prayer',
    category: 'reflection',
    earned: false,
    icon: '♡',
    tier: 'bronze',
    tierLabel: 'Tender Gold',
    tierColor: '#B8746B',
    requirement: 'Log an honest emotional check-in with God',
    currentProgress: 0,
    targetProgress: 1,
    rewardPoints: 50,
    scripture: 'Trust in him at all times, O people; pour out your heart before him; God is a refuge for us.',
    scriptureRef: 'Psalm 62:8',
    reflection: 'God loves genuine vulnerability. In holding nothing back, you encounter His profound comfort.',
    unlockedPerks: ['+50 Grace Points', 'Honest Heart Seal'],
  },
  {
    id: 'b_sabbath',
    title: 'Sabbath Peace',
    subtitle: 'Honoring Holy Rest',
    description: 'Observed intentional Sabbath rest, trading striving for holy abiding in Christ’s grace',
    category: 'grace',
    earned: false,
    icon: '🕊️',
    tier: 'silver',
    tierLabel: 'Silver Rest',
    tierColor: '#37C6C2',
    requirement: 'Observe an intentional Sabbath day of rest',
    currentProgress: 0,
    targetProgress: 1,
    rewardPoints: 50,
    scripture: 'Come to me, all who labor and are heavy laden, and I will give you rest.',
    scriptureRef: 'Matthew 11:28',
    reflection: 'Sabbath rest is an act of holy trust: believing God rules the world even when our striving ceases.',
    unlockedPerks: ['+50 Grace Points', 'Streak Preservation Shield'],
  },
  {
    id: 'b4',
    title: 'Psalm 23 Abider',
    subtitle: 'Resting by Quiet Waters',
    description: 'Completed 5 peaceful abiding reflections in God’s restorative presence',
    category: 'faith',
    earned: false,
    icon: '💧',
    tier: 'silver',
    tierLabel: 'Living Waters',
    tierColor: '#6B8CAE',
    requirement: 'Log 5 Peaceful quiet time check-ins',
    currentProgress: 0,
    targetProgress: 5,
    rewardPoints: 60,
    scripture: 'He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
    scriptureRef: 'Psalm 23:2-3',
    reflection: 'You have lingered beside still waters and allowed the Good Shepherd to restore your soul.',
    unlockedPerks: ['+60 Grace Points', 'Quiet Waters Icon'],
  },
  {
    id: 'b_living_word',
    title: 'Living Word Rooted',
    subtitle: 'Deep Abiding in Holy Scripture',
    description: 'Consecrated 14 days of reading and meditating upon God’s Word',
    category: 'streak',
    earned: false,
    icon: '📖',
    tier: 'gold',
    tierLabel: 'Golden Scroll',
    tierColor: '#E3B15E',
    requirement: 'Complete 14 days of daily scripture reading',
    currentProgress: 0,
    targetProgress: 14,
    rewardPoints: 100,
    scripture: 'Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom.',
    scriptureRef: 'Colossians 3:16',
    reflection: 'Feeding on God’s Word daily trains your ears to recognize the Shepherd’s voice above the noise.',
    unlockedPerks: ['+100 Grace Points', 'Living Word Seal'],
  },
  {
    id: 'b_sanctuary_pillar',
    title: 'Sanctuary Pillar',
    subtitle: 'Diamond Crown of Devotion',
    description: 'Accumulated over 500 Grace Points through faithful devotions and holy habits',
    category: 'grace',
    earned: false,
    icon: '💎',
    tier: 'diamond',
    tierLabel: 'Diamond Crown',
    tierColor: '#9C74E8',
    requirement: 'Earn 500 Grace Points in your Sanctuary',
    currentProgress: 0,
    targetProgress: 500,
    rewardPoints: 200,
    scripture: 'The one who conquers, I will make him a pillar in the temple of my God.',
    scriptureRef: 'Revelation 3:12',
    reflection: 'A steadfast pillar standing tall in faith, anchored in Christ through all seasons.',
    unlockedPerks: ['+200 Grace Points', 'Diamond Sanctuary Halo'],
  },
];

const DEFAULT_JOURNAL: JournalEntry[] = [
  {
    id: 'journal_seed_1',
    date: '2026-09-22 · 08:30 AM',
    timestamp: new Date('2026-09-22T08:30:00').getTime(),
    mood: 'grateful',
    moodEmoji: '🙏',
    moodLabel: 'Grateful',
    moodColor: '#E3B15E',
    text: 'Woke up early with a deep sense of gratitude for morning mercies. God has been so faithful through the transitions this week.',
    scriptureRef: 'Lamentations 3:22-23',
    scriptureSnippet: 'The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.',
    tags: ['#Gratitude', '#MorningMercy', '#Praise'],
    isFavorite: true,
  },
  {
    id: 'journal_seed_2',
    date: '2026-09-20 · 07:15 PM',
    timestamp: new Date('2026-09-20T19:15:00').getTime(),
    mood: 'sabbath',
    moodEmoji: '🕊️',
    moodLabel: 'Sabbath Rest',
    moodColor: '#735DA3',
    text: 'Observed intentional quietness and ceased striving today. Let go of work anxiety and rested in Christ’s completed work.',
    scriptureRef: 'Matthew 11:28',
    scriptureSnippet: 'Come to me, all who labor and are heavy laden, and I will give you rest.',
    tags: ['#SabbathRest', '#Peace', '#Stillness'],
    isFavorite: true,
  },
  {
    id: 'journal_seed_3',
    date: '2026-09-18 · 09:00 AM',
    timestamp: new Date('2026-09-18T09:00:00').getTime(),
    mood: 'seeking',
    moodEmoji: '🔍',
    moodLabel: 'Seeking',
    moodColor: '#7B62B8',
    text: 'Praying for wisdom and clear discernment regarding family decisions. Asking God to guide my steps and quiet my doubts.',
    scriptureRef: 'Proverbs 3:5-6',
    scriptureSnippet: 'Trust in the Lord with all your heart, and do not lean on your own understanding.',
    tags: ['#SeekingWisdom', '#Guidance', '#Discernment'],
    isFavorite: false,
  },
  {
    id: 'journal_seed_4',
    date: '2026-09-15 · 06:45 AM',
    timestamp: new Date('2026-09-15T06:45:00').getTime(),
    mood: 'peaceful',
    moodEmoji: '🕊',
    moodLabel: 'Peaceful',
    moodColor: '#37C6C2',
    text: 'Meditated on Psalm 23 by the window. Realizing that the Good Shepherd leads me beside still waters even in demanding seasons.',
    scriptureRef: 'Psalm 23:1-3',
    scriptureSnippet: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.',
    tags: ['#Peace', '#Psalm23', '#Abiding'],
    isFavorite: false,
  },
];

// Intensity styling helpers
export const INTENSITY_COLORS = [
  { level: 0, label: 'Rest / Missed', bg: 'bg-[#F2EDF8]', border: 'border-gray-200', text: 'text-gray-400', badge: 'bg-gray-100 text-gray-600' },
  { level: 1, label: 'Light (Check-in)', bg: 'bg-[#BCEBE7]', border: 'border-[#72D5CF]', text: 'text-[#0E6C68]', badge: 'bg-[#BCEBE7] text-[#0E6C68]' },
  { level: 2, label: 'Moderate (Scripture)', bg: 'bg-[#5DD1CC]', border: 'border-[#2EAEA8]', text: 'text-[#094F4C]', badge: 'bg-[#5DD1CC] text-[#094F4C]' },
  { level: 3, label: 'Deep (Prayer & Word)', bg: 'bg-[#1FB6B0]', border: 'border-[#138A85]', text: 'text-white', badge: 'bg-[#1FB6B0] text-white' },
  { level: 4, label: 'Peak Abiding Rhythm 🔥', bg: 'bg-gradient-to-br from-[#E3B15E] via-[#F28C38] to-[#1FB6B0]', border: 'border-[#E3B15E]', text: 'text-white', badge: 'bg-[#F28C38] text-white' },
];

function computeEvaluatedBadges(
  calendarRecords: Record<string, DayActivityRecord>,
  gracePoints: number,
  journalCount: number,
  longestStreak: number,
  persistedBadgeData: Record<string, { earned?: boolean; earnedDate?: string; currentProgress?: number }>
): Badge[] {
  const totalDaysActive = Object.values(calendarRecords).filter(isRecordActive).length;
  const scriptureDaysCount = Object.values(calendarRecords).filter((r) => r.scriptureRead).length;
  const sabbathDaysCount = Object.values(calendarRecords).filter((r) => r.isSabbathRest).length;
  const peacefulDaysCount = Object.values(calendarRecords).filter(
    (r) => r.mood === 'peaceful' || r.isSabbathRest
  ).length;

  return DEFAULT_BADGES.map((b) => {
    const persisted = persistedBadgeData[b.id];
    let prog = persisted?.currentProgress ?? 0;
    let earned = persisted?.earned ?? false;

    if (b.id === 'b1') {
      prog = totalDaysActive >= 1 ? 1 : 0;
      earned = totalDaysActive >= 1;
    } else if (b.id === 'b_faithful_week') {
      prog = Math.min(7, longestStreak);
      earned = longestStreak >= 7;
    } else if (b.id === 'b_monthly_reflection') {
      prog = Math.min(30, longestStreak);
      earned = longestStreak >= 30;
    } else if (b.id === 'b3') {
      prog = journalCount >= 1 ? 1 : 0;
      earned = journalCount >= 1;
    } else if (b.id === 'b_sabbath') {
      prog = sabbathDaysCount >= 1 ? 1 : 0;
      earned = sabbathDaysCount >= 1;
    } else if (b.id === 'b4') {
      prog = Math.min(5, peacefulDaysCount);
      earned = peacefulDaysCount >= 5;
    } else if (b.id === 'b_living_word') {
      prog = Math.min(14, scriptureDaysCount);
      earned = scriptureDaysCount >= 14;
    } else if (b.id === 'b_sanctuary_pillar') {
      prog = Math.min(500, gracePoints);
      earned = gracePoints >= 500;
    }

    return {
      ...b,
      currentProgress: prog,
      earned,
      earnedDate: earned ? (persisted?.earnedDate || 'Earned') : undefined,
    };
  });
}

export function ProgressScreen({ deviceId }: { deviceId?: string }) {
  useIsMounted();
  const { user } = useUser();
  const { user: christianUser } = useChristianAuth();
  const [tab, setTab] = useState<'calendar' | 'milestones' | 'trends' | 'journal' | 'pulse'>('calendar');
  const [selectedMilestone, setSelectedMilestone] = useState<StreakMilestone | null>(null);

  // Weekly Spiritual Pulse email state
  const defaultUserEmail = christianUser?.email || user?.primaryEmailAddress?.emailAddress || '';
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

  // Daily Notification Reminder Settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.dailyReminderSettings');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);

  const handleSaveNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.dailyReminderSettings', JSON.stringify(newSettings));
    }
  };

  // Format 24h time to 12h for UI badges
  const formatReminderTime12h = (time24: string) => {
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return time24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' : ''}${m} ${ampm}`;
  };

  // Calendar state
  const [calendarViewDate] = useState(() => new Date());
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

  const [persistedBadgeData, setPersistedBadgeData] = useState<Record<string, { earned?: boolean; earnedDate?: string; currentProgress?: number }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.badges');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map: Record<string, { earned?: boolean; earnedDate?: string; currentProgress?: number }> = {};
            parsed.forEach((b: Badge) => {
              map[b.id] = { earned: b.earned, earnedDate: b.earnedDate, currentProgress: b.currentProgress };
            });
            return map;
          }
        }
      } catch {
        // fallback
      }
    }
    return {};
  });

  // Active badge celebration animation modal state
  const [activeBadgeCelebration, setActiveBadgeCelebration] = useState<BadgeCelebrationData | null>(null);

  // Helper to convert badge to celebration modal format
  const badgeToCelebrationData = (badge: Badge): BadgeCelebrationData => {
    return {
      id: badge.id,
      title: badge.title,
      subtitle: badge.subtitle || badge.description,
      tier: badge.tierLabel || badge.tier || 'Spiritual Milestone',
      tierColor: badge.tierColor,
      icon: badge.icon,
      badgeEmoji: badge.tier === 'gold' ? '👑' : badge.tier === 'diamond' ? '💎' : '🌿',
      primaryColor: badge.tierColor || '#1FB6B0',
      accentColor: badge.tier === 'gold' ? '#FFD700' : '#72D5CF',
      rewardPoints: badge.rewardPoints || 50,
      scripture: badge.scripture || 'Let us run with endurance the race that is set before us.',
      scriptureRef: badge.scriptureRef || 'Hebrews 12:1',
      reflection: badge.reflection || badge.description,
      unlockedPerks: badge.unlockedPerks || [
        `+${badge.rewardPoints || 50} Grace Points awarded to your Sanctuary`,
        `${badge.title} Seal unlocked in Trophy Cabinet`,
      ],
    };
  };

  // Inspect or replay celebration animation for an earned badge
  const handleTriggerBadgeCelebration = (badge: Badge) => {
    setActiveBadgeCelebration(badgeToCelebrationData(badge));
  };

  // Direct unlock action (e.g. testing or immediate achievement)
  const handleUnlockBadgeDirectly = (badgeId: string) => {
    const targetBadge = badges.find((b) => b.id === badgeId);
    if (!targetBadge) return;

    setPersistedBadgeData((prev) => ({
      ...prev,
      [badgeId]: {
        earned: true,
        earnedDate: 'Just now',
        currentProgress: targetBadge.targetProgress || 1,
      },
    }));

    const reward = targetBadge.rewardPoints || 50;
    setGracePoints((pts) => {
      const newPts = pts + reward;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lifebook.gracePoints', String(newPts));
      }
      return newPts;
    });

    setActiveBadgeCelebration(badgeToCelebrationData({
      ...targetBadge,
      earned: true,
      earnedDate: 'Just now',
      currentProgress: targetBadge.targetProgress || 1,
    }));
  };

  // Claim reward handler from celebration modal
  const handleClaimBadgeReward = (badgeId: string, points: number) => {
    setGracePoints((prev) => {
      const next = prev + points;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lifebook.gracePoints', String(next));
      }
      return next;
    });
  };

  const [gracePoints, setGracePoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.gracePoints');
        if (saved) return parseInt(saved, 10);
      } catch {
        // fallback
      }
    }
    return 0;
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

  // Sync calendarRecords, gracePoints, and journal when DailyRitualModal completes
  useEffect(() => {
    const syncFromRitual = () => {
      try {
        const savedCal = localStorage.getItem('lifebook.calendar.streakHistory');
        if (savedCal) setCalendarRecords(JSON.parse(savedCal));

        const savedPts = localStorage.getItem('lifebook.gracePoints');
        if (savedPts) setGracePoints(parseInt(savedPts, 10));

        const savedJ = localStorage.getItem('lifebook.journal');
        if (savedJ) setJournal(JSON.parse(savedJ));
      } catch {
        // ignore
      }
    };

    window.addEventListener(LIFEBOOK_RITUAL_COMPLETED_EVENT, syncFromRitual);
    return () => {
      window.removeEventListener(LIFEBOOK_RITUAL_COMPLETED_EVENT, syncFromRitual);
    };
  }, []);

  // Calculate current active streak and historical metrics dynamically from genuine data
  const streakCalculation = useMemo(() => {
    return calculateConsecutiveStreak(calendarRecords);
  }, [calendarRecords]);

  const { currentStreak, longestStreak, activeStreakDates } = streakCalculation;
  const [simulatedStreak, setSimulatedStreak] = useState<number | null>(null);
  const effectiveCurrentStreak = simulatedStreak !== null ? simulatedStreak : currentStreak;
  const effectiveLongestStreak = Math.max(longestStreak, effectiveCurrentStreak);

  // Synchronize badge unlocks dynamically with actual devotional actions and records
  const badges: Badge[] = computeEvaluatedBadges(
    calendarRecords,
    gracePoints,
    journal.length,
    longestStreak,
    persistedBadgeData
  );

  // Persist updated badge records to localStorage whenever devotional progress or persisted badge state updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const computed = computeEvaluatedBadges(
          calendarRecords,
          gracePoints,
          journal.length,
          longestStreak,
          persistedBadgeData
        );
        localStorage.setItem('lifebook.badges', JSON.stringify(computed));
      } catch {
        // ignore
      }
    }
  }, [calendarRecords, gracePoints, journal.length, longestStreak, persistedBadgeData]);

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

  // STREAK MILESTONE CELEBRATION ANIMATION (7, 14, 21, 30, 50, 100-Day Triggers)
  const [activeCelebrationMilestone, setActiveCelebrationMilestone] = useState<number | null>(null);
  const prevStreakRef = useRef<number | null>(null);

  // Trigger celebration animation whenever the user reaches a milestone (e.g. 7, 14, 21, 30, 50, 100 days)
  useEffect(() => {
    if (prevStreakRef.current !== null && prevStreakRef.current !== currentStreak) {
      const milestoneThresholds = [7, 14, 21, 30, 50, 100];
      const reached = milestoneThresholds.find(
        (m) => currentStreak >= m && (prevStreakRef.current ?? 0) < m
      );
      if (reached) {
        setActiveCelebrationMilestone(reached);
      }
    }
    prevStreakRef.current = currentStreak;
  }, [currentStreak]);

  // First-load check: If user's current active streak qualifies for a milestone and has not yet been celebrated in this browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const celebrated: number[] = JSON.parse(localStorage.getItem('lifebook.streakMilestones.celebrated') || '[]');
      const milestoneThresholds = [7, 14, 21, 30, 50, 100];
      const uncelebrated = milestoneThresholds
        .slice()
        .reverse()
        .find((m) => currentStreak >= m && !celebrated.includes(m));
      if (uncelebrated) {
        const timer = setTimeout(() => {
          setActiveCelebrationMilestone(uncelebrated);
        }, 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // fallback
    }
  }, [currentStreak]);

  const handleClaimMilestoneReward = (points: number, milestoneDays: number) => {
    setGracePoints((prev) => {
      const updated = prev + points;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lifebook.gracePoints', String(updated));
      }
      return updated;
    });

    if (typeof window !== 'undefined') {
      try {
        const celebrated: number[] = JSON.parse(localStorage.getItem('lifebook.streakMilestones.celebrated') || '[]');
        if (!celebrated.includes(milestoneDays)) {
          localStorage.setItem('lifebook.streakMilestones.celebrated', JSON.stringify([...celebrated, milestoneDays]));
        }

        const claimed: string[] = JSON.parse(localStorage.getItem('lifebook.claimedMilestones') || '[]');
        const milestoneId = `streak-${milestoneDays}`;
        if (!claimed.includes(milestoneId)) {
          localStorage.setItem('lifebook.claimedMilestones', JSON.stringify([...claimed, milestoneId]));
        }
      } catch {
        // fallback
      }
    }
  };

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
    setPersistedBadgeData((prev) => ({
      ...prev,
      b_sabbath: { earned: true, earnedDate: 'Today', currentProgress: 1 },
    }));

    // Auto-record Sabbath reflection to spiritual journal
    const sabbathJournalEntry: JournalEntry = {
      id: `j_sabbath_${target}`,
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

  // Handle adding an enriched journal entry from DynamicMoodJournal
  function handleAddJournalEntry(newEntry: JournalEntry) {
    const nextJournal = [newEntry, ...journal];
    setJournal(nextJournal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.journal', JSON.stringify(nextJournal));
    }

    // Award +20 Grace Points
    const nextPoints = gracePoints + 20;
    setGracePoints(nextPoints);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.gracePoints', String(nextPoints));
    }

    // Also update today's calendar record
    const existing = calendarRecords[todayStr] || {
      date: todayStr,
      dayLabel: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mood: null,
      intensity: 0,
      scriptureRead: false,
      prayerCompleted: false,
      stillnessPractice: false,
      journalWritten: false,
    };

    const entryMood = (newEntry.mood && newEntry.mood !== 'sabbath') ? (newEntry.mood as MoodItem['id']) : existing.mood;
    const updated: DayActivityRecord = {
      ...existing,
      journalWritten: true,
      mood: entryMood,
      isSabbathRest: newEntry.mood === 'sabbath' ? true : existing.isSabbathRest,
      intensity: Math.max(1, Math.min(4, (existing.intensity || 0) + 1)),
      reflectionSnippet: newEntry.text.slice(0, 120),
      scriptureRef: newEntry.scriptureRef || existing.scriptureRef,
    };

    const newMap = {
      ...calendarRecords,
      [todayStr]: updated,
    };
    setCalendarRecords(newMap);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.calendar.streakHistory', JSON.stringify(newMap));
    }
  }

  function handleDeleteJournalEntry(id: string) {
    const nextJournal = journal.filter(j => j.id !== id);
    setJournal(nextJournal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.journal', JSON.stringify(nextJournal));
    }
  }

  function handleToggleFavoriteJournal(id: string) {
    const nextJournal = journal.map(j => (j.id === id ? { ...j, isFavorite: !j.isFavorite } : j));
    setJournal(nextJournal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.journal', JSON.stringify(nextJournal));
    }
  }

  function handleUpdateGracePoints(newPoints: number) {
    setGracePoints(newPoints);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.gracePoints', String(newPoints));
    }
  }

  function toggleTodayPractice(key: 'scriptureRead' | 'prayerCompleted' | 'journalWritten') {
    const existing = calendarRecords[todayStr] || {
      date: todayStr,
      dayLabel: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mood: null,
      intensity: 0,
      scriptureRead: false,
      prayerCompleted: false,
      stillnessPractice: false,
      journalWritten: false,
    };

    const updated = {
      ...existing,
      [key]: !existing[key],
    };

    let score = 0;
    if (updated.scriptureRead) score++;
    if (updated.prayerCompleted) score++;
    if (updated.stillnessPractice) score++;
    if (updated.journalWritten) score++;
    if (updated.mood && score === 0) score = 1;
    updated.intensity = Math.min(4, score);

    const newMap = {
      ...calendarRecords,
      [todayStr]: updated,
    };
    setCalendarRecords(newMap);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.calendar.streakHistory', JSON.stringify(newMap));
    }

    if (updated[key]) {
      const pts = key === 'journalWritten' ? 20 : 10;
      handleUpdateGracePoints(gracePoints + pts);
    }
  }

  // Current spiritual level calculation for top cards
  const currentLevelNumber = useMemo(() => {
    for (let i = SPIRITUAL_LEVELS.length - 1; i >= 0; i--) {
      if (gracePoints >= SPIRITUAL_LEVELS[i].minPoints) {
        return SPIRITUAL_LEVELS[i].level;
      }
    }
    return 1;
  }, [gracePoints]);

  // Monthly stats
  const currentMonthCells = calendarGrid.filter(c => c.isCurrentMonth);
  const activeDaysThisMonth = currentMonthCells.filter(c => c.record && c.record.intensity > 0).length;
  const consistencyRate = currentMonthCells.length > 0
    ? Math.round((activeDaysThisMonth / currentMonthCells.length) * 100)
    : 0;

  // Update and persist a calendar record + evaluate milestone badges
  const handleUpdateCalendarRecord = (dateStr: string, updated: DayActivityRecord) => {
    const newMap = {
      ...calendarRecords,
      [dateStr]: updated,
    };
    setCalendarRecords(newMap);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.calendar.streakHistory', JSON.stringify(newMap));
    }

    // Evaluate if any milestone badge is unlocked for the first time
    const activeCount = Object.values(newMap).filter(
      (r) => (r.intensity > 0 || r.isSabbathRest) && r.mood
    ).length;

    let earnedBadgeId: string | null = null;

    if (!persistedBadgeData['b_faithful_week']?.earned && currentStreak >= 7) {
      earnedBadgeId = 'b_faithful_week';
    } else if (!persistedBadgeData['b_monthly_reflection']?.earned && activeCount >= 30) {
      earnedBadgeId = 'b_monthly_reflection';
    } else if (!persistedBadgeData['b3']?.earned && (updated.mood === 'seeking' || updated.mood === 'doubting')) {
      earnedBadgeId = 'b3';
    } else if (!persistedBadgeData['b_sabbath']?.earned && updated.isSabbathRest) {
      earnedBadgeId = 'b_sabbath';
    } else if (!persistedBadgeData['b1']?.earned && updated.mood) {
      earnedBadgeId = 'b1';
    }

    if (earnedBadgeId) {
      const baseBadge = DEFAULT_BADGES.find((b) => b.id === earnedBadgeId);
      if (baseBadge) {
        const newlyEarnedBadge: Badge = {
          ...baseBadge,
          earned: true,
          earnedDate: 'Just now',
          currentProgress: baseBadge.targetProgress || 1,
        };
        setPersistedBadgeData((prev) => ({
          ...prev,
          [earnedBadgeId!]: {
            earned: true,
            earnedDate: 'Just now',
            currentProgress: baseBadge.targetProgress || 1,
          },
        }));

        const reward = baseBadge.rewardPoints || 50;
        setGracePoints((pts) => {
          const nPts = pts + reward;
          if (typeof window !== 'undefined') {
            localStorage.setItem('lifebook.gracePoints', String(nPts));
          }
          return nPts;
        });
        setActiveBadgeCelebration(badgeToCelebrationData(newlyEarnedBadge));
      }
    }
  };

  return (
    <div id="progress-screen" className="page-shell text-[#1e1931] dark:text-[#F4EFE6]">
      {deviceId && <div className="sr-only">Device: {deviceId}</div>}

      {/* Section Header matching landing page design system */}
      <div className="section-heading mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-[0.14em]">
            <Link href="/" className="text-[#5A4B7C] dark:text-[#4EE2D8] hover:underline flex items-center gap-1">
              ← Home
            </Link>
            <span className="text-[#705e8c]">·</span>
            <Link href="/dashboard" className="text-[#5A4B7C] dark:text-[#C8C2D6] hover:underline">
              Daily Sanctuary
            </Link>
            <span className="text-[#705e8c]">·</span>
            <span className="showcase-eyebrow m-0">Spiritual Rhythm & Consistency</span>
          </div>
          <h2>
            {christianUser?.fullName ? (
              <>
                {christianUser.fullName}’s <em>Devotional Walk.</em>
              </>
            ) : (
              <>
                Your Devotional <em>Progress & Trends.</em>
              </>
            )}
          </h2>
        </div>
        <div>
          <p>
            {christianUser?.faithSeason
              ? `Faith Season: ${christianUser.faithSeason} · Translation: ${christianUser.translation}`
              : "Build a faithful rhythm of daily Scripture, stillness, prayer, and soul reflections with God."}
          </p>
        </div>
      </div>

      {/* Tab Switcher & Reminder Tool matching landing page styling */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#2d2542]/10 dark:border-white/12 mb-8">
        <div id="progress-tabs" className="inline-flex rounded-2xl bg-[#f3edf7] dark:bg-[#1B1630] border border-[#2d2542]/10 dark:border-white/12 p-1.5 shadow-inner flex-wrap gap-1">
          <button
            id="tab-calendar"
            type="button"
            onClick={() => setTab('calendar')}
            className={`min-h-[40px] px-4 sm:px-5 py-2 text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'calendar'
                ? 'bg-[#17151a] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold shadow-sm'
                : 'text-[#4E4366] dark:text-[#C8C2D6] hover:text-[#17151a] dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 font-semibold'
            }`}
          >
            <CalendarBlank weight="bold" className="w-4 h-4" />
            <span>Monthly Mood Heatmap</span>
          </button>
          <button
            id="tab-milestones"
            type="button"
            onClick={() => setTab('milestones')}
            className={`min-h-[40px] px-4 sm:px-5 py-2 text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'milestones'
                ? 'bg-[#17151a] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold shadow-sm'
                : 'text-[#4E4366] dark:text-[#C8C2D6] hover:text-[#17151a] dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 font-semibold'
            }`}
          >
            <Trophy weight="bold" className="w-4 h-4" />
            <span>Milestones ({unlockedMilestonesCount}/{STREAK_MILESTONES.length})</span>
          </button>
          <button
            id="tab-trends"
            type="button"
            onClick={() => setTab('trends')}
            className={`min-h-[40px] px-4 sm:px-5 py-2 text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'trends'
                ? 'bg-[#17151a] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold shadow-sm'
                : 'text-[#4E4366] dark:text-[#C8C2D6] hover:text-[#17151a] dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 font-semibold'
            }`}
          >
            <ChartLineUp weight="bold" className="w-4 h-4" />
            <span>30-Day Trends</span>
          </button>
          <button
            id="tab-journal"
            type="button"
            onClick={() => setTab('journal')}
            className={`min-h-[40px] px-4 sm:px-5 py-2 text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'journal'
                ? 'bg-[#17151a] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold shadow-sm'
                : 'text-[#4E4366] dark:text-[#C8C2D6] hover:text-[#17151a] dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 font-semibold'
            }`}
          >
            <PencilSimpleLine weight="bold" className="w-4 h-4" />
            <span>Journal & Scripture</span>
          </button>
          <button
            id="tab-pulse"
            type="button"
            onClick={() => setTab('pulse')}
            className={`min-h-[40px] px-4 sm:px-5 py-2 text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'pulse'
                ? 'bg-[#17151a] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold shadow-sm'
                : 'text-[#4E4366] dark:text-[#C8C2D6] hover:text-[#17151a] dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 font-semibold'
            }`}
          >
            <Sparkle weight="bold" className="w-4 h-4" />
            <span>Weekly Pulse</span>
          </button>
        </div>

        {/* Quick Ritual & Notification Controls in Header */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            id="progress-start-ritual-btn"
            type="button"
            onClick={() => setIsRitualModalOpen(true)}
            className="min-h-[40px] px-4 py-2.5 text-xs font-bold rounded-full bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <span>✦</span>
            <span>Start 5-Min Ritual</span>
          </button>

          <button
            id="header-notification-settings-btn"
            type="button"
            onClick={() => setIsNotificationSettingsOpen(true)}
            className="min-h-[40px] px-4 py-2.5 text-xs font-bold rounded-full border border-[#2d2542]/15 dark:border-white/20 bg-white dark:bg-[#1B1630] hover:bg-[#fbfaf7] dark:hover:bg-[#272042] text-[#1e1931] dark:text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer group"
            title="Configure daily reminder time and mood check-in flow"
          >
            <Bell weight="bold" className="w-4 h-4 text-[#705e8c] dark:text-[#4EE2D8] group-hover:text-[#1e1931] dark:group-hover:text-white group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Daily Reminder</span>
            <span className="text-[#705e8c]">·</span>
            <span className="font-mono text-[#0E716D] dark:text-[#4EE2D8] font-extrabold">
              {notificationSettings.enabled ? formatReminderTime12h(notificationSettings.time) : 'Off'}
            </span>
          </button>
        </div>
      </div>

      {/* USER PROFILE & VISUAL STREAK COUNTER COMPONENT */}
      <div id="user-profile-streak-banner" className="mt-6">
        <VisualStreakCounter
          variant="profile"
          records={calendarRecords}
        />
      </div>

      {/* STAGGERED FADE-IN STREAK COUNTER CARDS (Styled with Landing Page Palette) */}
      <div id="streak-counter-cards-grid" className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 0: Current Streak (Deep Plum matching landing page) */}
        <div
          id="streak-card-current"
          className="streak-card-stagger streak-card-delay-0 rounded-3xl bg-[#211b3b] text-white p-5 sm:p-6 border border-white/12 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-[#66c8bb]/50 transition-all"
        >
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-[#66c8bb]/15 blur-xl group-hover:bg-[#66c8bb]/25 transition-all" />
          <div>
            <div className="flex items-center justify-between">
              <Flame weight="fill" className="w-6 h-6 text-amber-400" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#66c8bb]/20 text-[#66c8bb] border border-[#66c8bb]/30">
                Active Streak
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-normal font-serif text-white">
                {currentStreak}
              </span>
              <span className="text-sm text-[#f5f0e7]/70 font-serif ml-1.5">Days</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#f5f0e7]/70 line-clamp-1">
            {currentStreak > 0 ? 'Unbroken walk with Jesus' : 'Start your day 1 check-in'}
          </p>

          {/* Quick Streak Milestone Animation Triggers */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1.5 relative z-10">
            <button
              type="button"
              id="card-celebrate-7day-milestone-btn"
              onClick={() => setActiveCelebrationMilestone(7)}
              className="text-left text-[11px] font-bold text-[#66c8bb] hover:text-white flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#66c8bb]/15 hover:bg-[#66c8bb]/25 border border-[#66c8bb]/30 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkle weight="bold" className="w-3.5 h-3.5 text-[#66c8bb]" />
                <span>{currentStreak >= 7 ? '7-Day Rhythm Unlocked' : '7-Day Milestone'}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/90">
                {currentStreak >= 7 ? 'Celebrate' : 'Preview ✦'}
              </span>
            </button>

            <button
              type="button"
              id="card-celebrate-30day-milestone-btn"
              onClick={() => setActiveCelebrationMilestone(30)}
              className="text-left text-[11px] font-bold text-[#e8ba6a] hover:text-white flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#e8ba6a]/15 hover:bg-[#e8ba6a]/25 border border-[#e8ba6a]/30 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Crown weight="fill" className="w-3.5 h-3.5 text-[#e8ba6a]" />
                <span>{currentStreak >= 30 ? '30-Day Pillar Unlocked' : '30-Day Milestone'}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/90">
                {currentStreak >= 30 ? 'Celebrate' : 'Preview ✦'}
              </span>
            </button>
          </div>
        </div>

        {/* Card 1: Longest Record (Benefit Gold/Sand) */}
        <div
          id="streak-card-longest"
          className="streak-card-stagger streak-card-delay-1 rounded-3xl bg-[#f2dfbc] p-5 sm:p-6 text-[#1e1931] border border-[#2d2542]/12 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
        >
          <div>
            <div className="flex items-center justify-between">
              <Crown weight="fill" className="w-6 h-6 text-amber-700" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1e1931] text-white">
                Personal Best
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-normal font-serif text-[#1e1931]">
                {longestStreak}
              </span>
              <span className="text-sm text-[#705e8c] font-serif ml-1.5">Days</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#5d4f77] line-clamp-1">
            Longest consecutive walk
          </p>
        </div>

        {/* Card 2: 30-Day Consistency (Benefit Mint) */}
        <div
          id="streak-card-consistency"
          className="streak-card-stagger streak-card-delay-2 rounded-3xl bg-[#d8efdc] p-5 sm:p-6 text-[#124d3e] border border-[#2d2542]/12 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
        >
          <div>
            <div className="flex items-center justify-between">
              <ShieldCheck weight="bold" className="w-6 h-6 text-emerald-700" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#124d3e] text-white">
                Consistency
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-normal font-serif text-[#124d3e]">
                {consistencyRate}%
              </span>
              <span className="text-xs text-[#124d3e]/80 ml-1.5 font-medium">({activeDaysThisMonth}d)</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#124d3e]/70 line-clamp-1">
            Active days this month
          </p>
        </div>

        {/* Card 3: Grace Points & Spiritual Level (Benefit Blue) */}
        <div
          id="streak-card-grace-points"
          onClick={() => setTab('milestones')}
          className="streak-card-stagger streak-card-delay-3 rounded-3xl bg-[#d9e7f3] p-5 sm:p-6 text-[#17324d] border border-[#2d2542]/12 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div>
            <div className="flex items-center justify-between">
              <Lightning weight="fill" className="w-6 h-6 text-sky-700" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#17324d] text-white group-hover:bg-[#1e1931] transition-all">
                Level {currentLevelNumber} ✦
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-normal font-serif text-[#17324d]">
                {gracePoints}
              </span>
              <span className="text-sm text-[#17324d]/70 font-serif ml-1.5">GP</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#17324d]/80 font-medium flex items-center justify-between">
            <span>Gamification Cabinet</span>
            <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
          </p>
        </div>
      </div>

      {/* 7-DAY & 30-DAY STREAK MILESTONES VISUAL PROGRESS BAR & CONFETTI ANIMATION */}
      <div id="streak-milestones-progress-container" className="mt-6">
        <StreakMilestoneProgressBarCard
          currentStreak={effectiveCurrentStreak}
          longestStreak={effectiveLongestStreak}
          onCelebrateMilestone={(days) => setActiveCelebrationMilestone(days)}
          onSimulateStreak={(days) => setSimulatedStreak(days)}
        />
      </div>

      {/* PAST JOURNAL ENTRIES SEARCH BAR (FILTER BY KEYWORD OR DATE) */}
      <div id="progress-journal-search-container" className="mt-6">
        <JournalSearchBar
          entries={journal}
          onOpenJournalTab={() => setTab('journal')}
          onDeleteEntry={handleDeleteJournalEntry}
          onToggleFavorite={handleToggleFavoriteJournal}
        />
      </div>

      {/* Motivational Streak Banner */}
      <div
        id="streak-motivation-banner"
        className="mt-6 rounded-3xl bg-[#211b3b] border border-white/12 p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-[#66c8bb]/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e8ba6a] to-[#d48962] flex items-center justify-center shadow-md shrink-0">
            <Flame weight="fill" className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#66c8bb]">
                Active Devotional Streak
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#66c8bb]/20 text-[#66c8bb] border border-[#66c8bb]/30">
                Live
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white mt-0.5">
              {currentStreak} Days Walking with Jesus
            </h2>
            <p className="text-xs text-[#f5f0e7]/70 mt-0.5 max-w-lg">
              {currentStreak > 0
                ? `You’ve maintained an unbroken daily rhythm! Log today to reach ${currentStreak + 1} days.`
                : 'Take a quiet moment today to begin a new streak in Scripture and prayer.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Milestone Celebration Banner Triggers */}
          <button
            id="banner-celebrate-7day-milestone"
            type="button"
            onClick={() => setActiveCelebrationMilestone(7)}
            className="px-3.5 py-2 rounded-full bg-[#66c8bb]/20 hover:bg-[#66c8bb]/30 border border-[#66c8bb]/40 text-[#66c8bb] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Celebrate 7-Day Consistent Streak"
          >
            <Sparkle weight="bold" className="w-3.5 h-3.5" />
            <span>7-Day Celebration</span>
            <span className="text-amber-300">✦</span>
          </button>

          <button
            id="banner-celebrate-30day-milestone"
            type="button"
            onClick={() => setActiveCelebrationMilestone(30)}
            className="px-3.5 py-2 rounded-full bg-[#e8ba6a]/20 hover:bg-[#e8ba6a]/30 border border-[#e8ba6a]/40 text-[#e8ba6a] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Celebrate 30-Day Consistent Streak"
          >
            <Crown weight="fill" className="w-3.5 h-3.5" />
            <span>30-Day Celebration</span>
            <span className="text-amber-200">✦</span>
          </button>

          <button
            id="banner-sabbath-btn"
            type="button"
            onClick={() => {
              setTab('calendar');
              setTimeout(() => {
                document.getElementById('burnout-prevention-card')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className={`px-3.5 py-2 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              calendarRecords[todayStr]?.isSabbathRest
                ? 'bg-[#66c8bb]/30 hover:bg-[#66c8bb]/40 border-[#66c8bb]/60 text-white'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-[#f5f0e7]'
            }`}
          >
            <ShieldCheck weight="bold" className="w-4 h-4" />
            <span>{calendarRecords[todayStr]?.isSabbathRest ? 'Sabbath Shield Active' : 'Burnout Check · Rest'}</span>
          </button>

          <button
            id="banner-weekly-pulse-btn"
            type="button"
            onClick={() => setTab('pulse')}
            className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[#f5f0e7] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ChartLineUp weight="bold" className="w-4 h-4" />
            <span>Weekly Pulse</span>
          </button>

          <button
            id="banner-recurring-patterns-btn"
            type="button"
            onClick={() => {
              setTab('calendar');
              setTimeout(() => {
                document.getElementById('recurring-emotional-patterns-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="px-3.5 py-2 rounded-full bg-[#66c8bb]/15 hover:bg-[#66c8bb]/25 border border-[#66c8bb]/30 text-[#66c8bb] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkle weight="bold" className="w-4 h-4" />
            <span>Soul Patterns</span>
          </button>

          <button
            id="banner-notification-reminder-btn"
            type="button"
            onClick={() => setIsNotificationSettingsOpen(true)}
            className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[#f5f0e7] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Set daily notification time for mood check-in"
          >
            <Bell weight="bold" className="w-4 h-4" />
            <span>Daily Reminder ({notificationSettings.enabled ? formatReminderTime12h(notificationSettings.time) : 'Off'})</span>
          </button>

          <div className="flex items-center gap-3 bg-white/10 p-2.5 px-3 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-1.5">
              <span className="text-[9px] uppercase font-semibold text-[#f5f0e7]/60">Longest</span>
              <p className="text-lg font-normal font-serif text-[#e8ba6a]">{longestStreak}d</p>
            </div>
            <div className="w-[1px] h-6 bg-white/20" />
            <div className="text-center px-1.5">
              <span className="text-[9px] uppercase font-semibold text-[#f5f0e7]/60">Consistency</span>
              <p className="text-lg font-normal font-serif text-[#66c8bb]">{consistencyRate}%</p>
            </div>
            <div className="w-[1px] h-6 bg-white/20" />
            <div className="text-center px-1.5">
              <span className="text-[9px] uppercase font-semibold text-[#f5f0e7]/60">Active</span>
              <p className="text-lg font-normal font-serif text-white">{activeDaysThisMonth}d</p>
            </div>
          </div>
        </div>
      </div>

      {/* WEEKLY CONSISTENCY SCORE CARD: 7-DAY 5-MINUTE HABIT AGGREGATION WITH PROGRESS DOTS */}
      <WeeklyConsistencyCard
        calendarRecords={calendarRecords}
        todayStr={todayStr}
        onUpdateRecord={handleUpdateCalendarRecord}
        onGracePointsAwarded={(pts) => handleUpdateGracePoints(gracePoints + pts)}
        className="mt-6"
      />

      {/* DAILY 5-MINUTE DEVOTION GOAL & VISUAL PROGRESS COMPONENT */}
      <DailyDevotionGoalCard
        todayStr={todayStr}
        todayRecord={calendarRecords[todayStr]}
        onUpdateRecord={handleUpdateCalendarRecord}
        onGracePointsAwarded={(pts) => handleUpdateGracePoints(gracePoints + pts)}
        className="mt-6"
      />

      {/* DAILY SPIRITUAL HABIT GOAL COMPONENT */}
      <DailyGoalCard
        todayStr={todayStr}
        gracePoints={gracePoints}
        onUpdateGracePoints={handleUpdateGracePoints}
        todayRecord={calendarRecords[todayStr]}
        onTogglePractice={toggleTodayPractice}
      />

      {/* P3 RETENTION PROTECTION: 5-DAY JOURNEY GRACE DAYS */}
      <JourneyGraceProtectionCard
        onGracePointsAwarded={(pts) => handleUpdateGracePoints(gracePoints + pts)}
      />

      {/* TAB 1: CALENDAR VIEW WITH COLOR-CODED INTENSITY TILES */}
      {tab === 'calendar' && (
        <div className="mt-8 space-y-8">
          {/* VISUAL MOOD UPDATE & SOUL POSTURE TRACKER */}
          <VisualMoodUpdateCard
            todayStr={todayStr}
            selectedDateStr={selectedDateStr}
            calendarRecords={calendarRecords}
            onUpdateRecord={handleUpdateCalendarRecord}
            onOpenJournal={() => setTab('journal')}
            onSelectDate={setSelectedDateStr}
          />

          {/* Quick Rewards Cabinet Teaser */}
          <div
            id="calendar-rewards-teaser"
            className="rounded-3xl bg-gradient-to-r from-[#FAF8FC] via-[#F6F2FB] to-[#EDFAF9] border border-[#D8CFEC] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E3B15E] to-[#B38018] text-white flex items-center justify-center shadow-xs shrink-0">
                <Crown weight="fill" className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E6F12]">
                    Sanctuary Rewards
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E3B15E]/20 text-[#6B4E0E] font-bold">
                    {badges.filter(b => b.earned).length} of {badges.length} Badges Unlocked
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#1E1835] mt-0.5">
                  Milestones: Faithful Week & Monthly Reflection
                </h4>
                <p className="text-xs text-[#6B5F84]">
                  Celebrate your spiritual consistency. Unlock sacred seals and experience celebratory animations as you walk with Christ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="view-rewards-cabinet-btn"
                onClick={() => setTab('milestones')}
                className="px-4 py-2 rounded-full bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trophy weight="fill" className="w-3.5 h-3.5" />
                <span>Open Rewards Cabinet</span>
              </button>
            </div>
          </div>

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

          {/* Daily Notification Reminder & Consistent Check-In Card */}
          <div
            id="calendar-notification-reminder-card"
            className="rounded-3xl bg-gradient-to-r from-[#FAF8FC] via-[#F6F3FA] to-[#EDFAF9] border border-[#D8CFEC] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2A2146] text-white flex items-center justify-center shadow-xs shrink-0">
                <Bell weight="fill" className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1FB6B0]">
                    Rhythm & Habit Cue
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1FB6B0]/15 text-[#0E716D] font-mono font-bold">
                    {notificationSettings.enabled ? `Alert: ${formatReminderTime12h(notificationSettings.time)}` : 'Reminders Paused'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#1E1835] mt-0.5">
                  Daily Check-In Reminder
                </h4>
                <p className="text-xs text-[#6B5F84]">
                  {calendarRecords[todayStr]?.mood ? (
                    <span>
                      Today’s mood is logged (<strong className="capitalize text-[#1FB6B0]">{calendarRecords[todayStr].mood}</strong>). Next reminder at <strong>{formatReminderTime12h(notificationSettings.time)}</strong>.
                    </span>
                  ) : (
                    <span>
                      Consistent data entry fuels meaningful trends. Log today’s soul posture to protect your {currentStreak}-day streak!
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <button
                id="edit-notification-reminder-settings-btn"
                type="button"
                onClick={() => setIsNotificationSettingsOpen(true)}
                className="px-4 py-2 rounded-full border border-gray-300 hover:bg-white text-xs font-bold text-[#3E3458] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Gear weight="bold" className="w-3.5 h-3.5" />
                <span>Set Time ({formatReminderTime12h(notificationSettings.time)})</span>
              </button>

              <button
                id="jump-to-mood-checkin-btn"
                type="button"
                onClick={() => {
                  setSelectedDateStr(todayStr);
                  setTimeout(() => {
                    document.getElementById('monthly-mood-heatmap-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                className="px-4 py-2 rounded-full bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Heart weight="fill" className="w-3.5 h-3.5 text-[#37C6C2]" />
                <span>Check In Mood</span>
              </button>
            </div>
          </div>
          {/* Quick Weekly Spiritual Pulse Teaser Card */}
          <div
            id="calendar-weekly-pulse-card"
            className="rounded-3xl bg-gradient-to-r from-[#FAF8FC] via-[#F4F1FA] to-[#EDFAF9] border border-[#D8CFEC] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2A2146] text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkle weight="fill" className="w-6 h-6 text-[#37C6C2]" />
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
                className="px-4 py-2 rounded-full bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                View Full Pulse →
              </button>
              <button
                type="button"
                disabled={isSendingPulse}
                onClick={() => handleSendSpiritualPulse()}
                className="px-4 py-2 rounded-full bg-[#1FB6B0] hover:bg-[#189b96] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <EnvelopeSimple weight="bold" className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>
          </div>
          {/* RESPONSIVE ROW/STACK CONTAINER: HEATMAP CALENDAR & RECHARTS CONTAINER (< 760px STACKED, >= 760px ROW) */}
          <div
            id="heatmap-recharts-layout-container"
            data-testid="heatmap-recharts-container"
            className="progress-heatmap-recharts-row flex flex-col min-[760px]:flex-row gap-8 w-full items-start"
          >
            {/* 1. Heatmap Calendar Container */}
            <div
              id="heatmap-calendar-container"
              data-testid="heatmap-calendar-container"
              className="heatmap-calendar-container w-full min-[760px]:w-1/2 min-[760px]:flex-1 min-w-0"
            >
              <MonthlyMoodHeatmap
                calendarRecords={calendarRecords}
                onUpdateRecord={handleUpdateCalendarRecord}
                selectedDateStr={selectedDateStr}
                onSelectDate={setSelectedDateStr}
                todayStr={todayStr}
                activeStreakDates={activeStreakDates}
                onOpenJournal={() => setTab("journal")}
                onOpenPulse={() => setTab("pulse")}
                onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
                notificationReminderTime={notificationSettings.enabled ? formatReminderTime12h(notificationSettings.time) : undefined}
              />
            </div>

            {/* 2. Recharts Visualization Container */}
            <div
              id="recharts-container"
              data-testid="recharts-container"
              className="recharts-container w-full min-[760px]:w-1/2 min-[760px]:flex-1 min-w-0"
            >
              <WeeklyInsightChart
                pulseData={weeklyPulseData}
                calendarRecords={calendarRecords}
                onSelectDate={(dateStr) => {
                  setSelectedDateStr(dateStr);
                }}
              />
            </div>
          </div>

          {/* 3. Recurring Emotional Patterns & Soul Rhythms Summary Section */}
          <RecurringEmotionalPatternsSummary
            calendarRecords={calendarRecords}
            journalEntries={journal}
            onSelectDate={(dateStr) => {
              setSelectedDateStr(dateStr);
              document.getElementById('heatmap-calendar-container')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenJournal={() => setTab('journal')}
          />
        </div>
      )}

      {/* TAB 2: MILESTONES & STREAK GAMIFICATION */}
      {tab === 'milestones' && (
        <div className="mt-8 space-y-6">
          {/* Interactive Streak Milestone Celebration Showcase Banner */}
          <div
            id="streak-milestone-interactive-banner"
            className="rounded-3xl bg-gradient-to-r from-[#1D1635] via-[#261E47] to-[#122F3A] p-6 text-white border border-white/10 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1FB6B0]/20 border border-[#1FB6B0]/40 text-[#37C6C2] text-[11px] font-extrabold uppercase tracking-widest">
                <span>✦</span>
                <span>Consistency Milestones Engine</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mt-2">
                Devotional Streak Milestones (7, 21, 50+ Days)
              </h3>
              <p className="text-xs text-[#C5BCD9] mt-1 max-w-xl">
                Experience celebratory harmonic fanfares, sacred Scripture illumination, and real-time confetti physics commemorating your steady walk with Christ.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                id="milestone-showcase-7day-btn"
                onClick={() => setActiveCelebrationMilestone(7)}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#1FB6B0] to-[#0E7773] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                title="7-Day Sabbath Rhythm Celebration"
              >
                <Sparkle weight="bold" className="w-3.5 h-3.5" />
                <span>7-Day</span>
                <span className="text-amber-200">✦</span>
              </button>

              <button
                type="button"
                id="milestone-showcase-21day-btn"
                onClick={() => setActiveCelebrationMilestone(21)}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                title="21-Day Habit of Grace Celebration"
              >
                <Trophy weight="bold" className="w-3.5 h-3.5" />
                <span>21-Day</span>
                <span className="text-purple-200">✦</span>
              </button>

              <button
                type="button"
                id="milestone-showcase-30day-btn"
                onClick={() => setActiveCelebrationMilestone(30)}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#E3B15E] to-[#B88424] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                title="30-Day Spiritual Pillar Celebration"
              >
                <Crown weight="fill" className="w-3.5 h-3.5" />
                <span>30-Day</span>
                <span className="text-amber-100">✦</span>
              </button>

              <button
                type="button"
                id="milestone-showcase-50day-btn"
                onClick={() => setActiveCelebrationMilestone(50)}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#EC4899] to-[#BE185D] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                title="50-Day Pentecost Jubilee Celebration"
              >
                <Flame weight="fill" className="w-3.5 h-3.5" />
                <span>50-Day</span>
                <span className="text-pink-100">✦</span>
              </button>

              <button
                type="button"
                id="milestone-showcase-100day-btn"
                onClick={() => setActiveCelebrationMilestone(100)}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#38BDF8] to-[#0284C7] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                title="100-Day Diamond Covenant Celebration"
              >
                <Lightning weight="bold" className="w-3.5 h-3.5" />
                <span>100-Day</span>
                <span className="text-cyan-100">✦</span>
              </button>
            </div>
          </div>

          <StreakGamificationCard
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            gracePoints={gracePoints}
            todayRecord={calendarRecords[todayStr]}
            onUpdateGracePoints={handleUpdateGracePoints}
            onTogglePractice={toggleTodayPractice}
            onOpenJournal={() => setTab('journal')}
            onTriggerMilestoneCelebration={(days) => setActiveCelebrationMilestone(days)}
          />

          {/* VISUAL REWARDS SYSTEM: SANCTUARY BADGES & MILESTONES */}
          <VisualRewardsBadgesCard
            badges={badges}
            currentStreak={currentStreak}
            gracePoints={gracePoints}
            onTriggerBadgeCelebration={handleTriggerBadgeCelebration}
            onUnlockBadgeDirectly={handleUnlockBadgeDirectly}
          />
        </div>
      )}

      {/* TAB 3: RECHARTS 30-DAY MOOD FREQUENCY & STREAK CORRELATION */}
      {tab === 'trends' && (
        <div className="mt-8 space-y-8">
          {/* Recurring Emotional Patterns & Soul Rhythms Summary */}
          <RecurringEmotionalPatternsSummary
            calendarRecords={calendarRecords}
            journalEntries={journal}
            onSelectDate={(dateStr) => {
              setSelectedDateStr(dateStr);
              setTab('calendar');
              setTimeout(() => {
                document.getElementById('heatmap-calendar-container')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            onOpenJournal={() => setTab('journal')}
          />

          <MoodTrendsAnalytics
            calendarRecords={calendarRecords}
            onCheckInMood={handleCheckInMood}
          />
        </div>
      )}

      {/* TAB 4: DYNAMIC MOOD JOURNAL & SCRIPTURE REFLECTIONS */}
      {tab === 'journal' && (
        <div className="mt-8">
          <DynamicMoodJournal
            entries={journal}
            todayStr={todayStr}
            todayRecord={calendarRecords[todayStr]}
            onAddEntry={handleAddJournalEntry}
            onDeleteEntry={handleDeleteJournalEntry}
            onToggleFavorite={handleToggleFavoriteJournal}
            onCheckInMood={handleCheckInMood}
            onHonorSabbath={handleHonorSabbath}
          />
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
                  <EnvelopeSimple weight="bold" className="w-3.5 h-3.5" />
                  <span>Email This Summary</span>
                </button>
                <button
                  id="pulse-preview-html-toggle-btn"
                  type="button"
                  onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2 cursor-pointer"
                >
                  <Eye weight="bold" className="w-3.5 h-3.5" />
                  <span>{showHtmlPreview ? 'Hide HTML Preview' : 'Preview Email Layout'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <Flame weight="fill" className="w-6 h-6 text-amber-400" />
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.currentStreak} Days
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#37C6C2] mt-0.5">
                  Consecutive Streak
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <Sparkle weight="fill" className="w-6 h-6 text-[#E3B15E]" />
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.dominantMood.label}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#E3B15E] mt-0.5">
                  Dominant Soul State
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <ShieldCheck weight="bold" className="w-6 h-6 text-[#37C6C2]" />
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.consistencyRate}%
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#37C6C2] mt-0.5">
                  7-Day Consistency ({weeklyPulseData.totalCheckIns}/7)
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <Trophy weight="fill" className="w-6 h-6 text-[#C4B7E0]" />
                <div className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                  {weeklyPulseData.milestonesUnlocked.length} Badges
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C4B7E0] mt-0.5">
                  Milestones Earned
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE 7-DAY SPIRITUAL INSIGHT CHART */}
          <WeeklyInsightChart
            pulseData={weeklyPulseData}
            calendarRecords={calendarRecords}
            onSelectDate={(dateStr) => {
              setSelectedDateStr(dateStr);
              setTab('calendar');
            }}
          />

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
                  <Sparkle weight="fill" className="w-4 h-4 text-[#136864] shrink-0" />
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
                  <BookOpen weight="bold" className="w-6 h-6 mx-auto text-[#E3B15E]" />
                  <span className="text-2xl font-bold font-serif text-[#211B3B] block mt-1">
                    {weeklyPulseData.practicesTotals.scriptureDays}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7B6E96] block">Scripture Days</span>
                </div>

                <div className="bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-4 text-center">
                  <Sparkle weight="bold" className="w-6 h-6 mx-auto text-[#7B62B8]" />
                  <span className="text-2xl font-bold font-serif text-[#211B3B] block mt-1">
                    {weeklyPulseData.practicesTotals.stillnessMinutes}m
                  </span>
                  <span className="text-[11px] font-semibold text-[#7B6E96] block">Stillness Practiced</span>
                </div>

                <div className="bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-4 text-center">
                  <HandsPraying weight="bold" className="w-6 h-6 mx-auto text-[#37C6C2]" />
                  <span className="text-2xl font-bold font-serif text-[#211B3B] block mt-1">
                    {weeklyPulseData.practicesTotals.prayersOffered}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7B6E96] block">Prayers Offered</span>
                </div>

                <div className="bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-4 text-center">
                  <PencilSimpleLine weight="bold" className="w-6 h-6 mx-auto text-[#B8746B]" />
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
                  ({weeklyPulseData.weeklyScripture.reference})
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
                    <EnvelopeSimple weight="bold" className="w-4 h-4" />
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
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-sm transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X weight="bold" className="w-4 h-4" />
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
                  <span className="w-5 h-5 rounded-full bg-[#1FB6B0] text-white flex items-center justify-center text-xs">
                    <Check weight="bold" className="w-3 h-3" />
                  </span>
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
                ({selectedMilestone.scriptureRef})
              </span>
            </div>

            {/* Reward Title & Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Honorary Title</span>
                <p className="text-xs font-bold text-[#1E1931]">{selectedMilestone.rewardTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {[7, 14, 21, 30, 50, 100].includes(selectedMilestone.days) && (
                  <button
                    type="button"
                    onClick={() => {
                      const days = selectedMilestone.days;
                      setSelectedMilestone(null);
                      setActiveCelebrationMilestone(days);
                    }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#1FB6B0] to-[#0E7773] hover:opacity-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trophy weight="bold" className="w-3.5 h-3.5" />
                    <span>Experience Animation</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="px-5 py-2 rounded-full bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-DAY & 30-DAY STREAK MILESTONE CELEBRATION ANIMATION */}
      {activeCelebrationMilestone && (
        <StreakMilestoneAnimation
          key={`streak-milestone-${activeCelebrationMilestone}`}
          milestoneDays={activeCelebrationMilestone}
          isOpen={Boolean(activeCelebrationMilestone)}
          onClose={() => setActiveCelebrationMilestone(null)}
          onClaimReward={handleClaimMilestoneReward}
        />
      )}

      {/* VISUAL REWARDS BADGE CELEBRATION MODAL ANIMATION */}
      {activeBadgeCelebration && (
        <BadgeCelebrationModal
          key={`badge-celebration-${activeBadgeCelebration.id}`}
          badge={activeBadgeCelebration}
          isOpen={Boolean(activeBadgeCelebration)}
          onClose={() => setActiveBadgeCelebration(null)}
          onClaimReward={handleClaimBadgeReward}
        />
      )}

      {/* DAILY NOTIFICATION TIME SETTINGS MODAL & DIRECT CHECK-IN FLOW */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        settings={notificationSettings}
        onSaveSettings={handleSaveNotificationSettings}
        onStartMoodCheckIn={(moodId) => {
          if (moodId) {
            handleCheckInMood(moodId);
          }
          setTab('calendar');
          setSelectedDateStr(todayStr);
          setTimeout(() => {
            document.getElementById('monthly-mood-heatmap-panel')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        todayHasMoodLogged={Boolean(calendarRecords[todayStr]?.mood)}
        todayMood={calendarRecords[todayStr]?.mood}
      />

      <DailyRitualModal
        isOpen={isRitualModalOpen}
        onClose={() => setIsRitualModalOpen(false)}
      />
    </div>
  );
}

export default ProgressScreen;
