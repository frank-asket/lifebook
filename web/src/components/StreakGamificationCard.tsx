'use client';

import React, { useState, useMemo } from 'react';
import type { StreakMilestone, DayActivityRecord } from './ProgressScreen';
import { STREAK_MILESTONES } from './ProgressScreen';

interface StreakGamificationCardProps {
  currentStreak: number;
  longestStreak: number;
  gracePoints: number;
  todayRecord?: DayActivityRecord;
  onUpdateGracePoints: (newPoints: number) => void;
  onTogglePractice: (practiceKey: 'scriptureRead' | 'prayerCompleted' | 'journalWritten') => void;
  onOpenJournal?: () => void;
  onTriggerMilestoneCelebration?: (days: 7 | 30) => void;
}

export interface SpiritualLevelInfo {
  level: number;
  title: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  verse: string;
  verseRef: string;
}

export const SPIRITUAL_LEVELS: SpiritualLevelInfo[] = [
  { level: 1, title: 'Mustard Seed', icon: '🌱', minPoints: 0, maxPoints: 100, verse: 'Faith as small as a mustard seed can move mountains.', verseRef: 'Matthew 17:20' },
  { level: 2, title: 'Gentle Seeker', icon: '🕯️', minPoints: 100, maxPoints: 250, verse: 'You will seek me and find me when you seek me with all your heart.', verseRef: 'Jeremiah 29:13' },
  { level: 3, title: 'Faithful Abider', icon: '🕊️', minPoints: 250, maxPoints: 500, verse: 'Whoever abides in me and I in him, he it is that bears much fruit.', verseRef: 'John 15:5' },
  { level: 4, title: 'Rooted Disciple', icon: '🌿', minPoints: 500, maxPoints: 900, verse: 'Rooted and built up in him and established in the faith.', verseRef: 'Colossians 2:7' },
  { level: 5, title: 'Living Pillar', icon: '🏛️', minPoints: 900, maxPoints: 1500, verse: 'The one who conquers, I will make him a pillar in the temple of my God.', verseRef: 'Revelation 3:12' },
  { level: 6, title: 'Kingdom Beacon', icon: '🌟', minPoints: 1500, maxPoints: 2500, verse: 'Let your light shine before others, so that they may see your good works.', verseRef: 'Matthew 5:16' },
  { level: 7, title: 'Oak of Righteousness', icon: '🌳', minPoints: 2500, maxPoints: 5000, verse: 'That they may be called oaks of righteousness, the planting of the Lord.', verseRef: 'Isaiah 61:3' },
];

// Play celebratory major-chord chime when claiming a blessing
function playBlessingChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Arpeggiated C major chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 1.8);
    });
  } catch {
    // Audio fallback
  }
}

export function StreakGamificationCard({
  currentStreak,
  longestStreak,
  gracePoints,
  todayRecord,
  onUpdateGracePoints,
  onTogglePractice,
  onOpenJournal,
  onTriggerMilestoneCelebration,
}: StreakGamificationCardProps) {
  // Claimed milestones state persisted in localStorage
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.claimedMilestones');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return ['streak-3']; // Default 3-day claimed
  });

  // Grace Shield status (Streak Freeze)
  const [graceShields, setGraceShields] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.graceShields');
        if (saved !== null) return parseInt(saved, 10);
      } catch {
        // fallback
      }
    }
    return 1; // 1 shield ready by default
  });

  const [shieldActive, setShieldActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('lifebook.graceShieldActive') === 'true';
      } catch {
        // fallback
      }
    }
    return true; // Enabled by default to protect new users
  });

  // Active milestone claim modal
  const [celebratingMilestone, setCelebratingMilestone] = useState<StreakMilestone | null>(null);

  // Filter for milestones
  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Calculate current spiritual level from Grace Points
  const currentLevel = useMemo(() => {
    for (let i = SPIRITUAL_LEVELS.length - 1; i >= 0; i--) {
      if (gracePoints >= SPIRITUAL_LEVELS[i].minPoints) {
        return SPIRITUAL_LEVELS[i];
      }
    }
    return SPIRITUAL_LEVELS[0];
  }, [gracePoints]);

  const nextLevel = useMemo(() => {
    const nextIdx = currentLevel.level;
    return nextIdx < SPIRITUAL_LEVELS.length ? SPIRITUAL_LEVELS[nextIdx] : null;
  }, [currentLevel]);

  const levelProgress = useMemo(() => {
    if (!nextLevel) return 100;
    const range = nextLevel.minPoints - currentLevel.minPoints;
    const currentInRange = gracePoints - currentLevel.minPoints;
    return Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));
  }, [currentLevel, nextLevel, gracePoints]);

  // Daily Trinity state
  const isScriptureDone = Boolean(todayRecord?.scriptureRead);
  const isPrayerDone = Boolean(todayRecord?.prayerCompleted);
  const isJournalDone = Boolean(todayRecord?.journalWritten);
  const isTrinityComplete = isScriptureDone && isPrayerDone && isJournalDone;

  // Toggle Grace Shield
  function handleToggleShield() {
    if (!shieldActive && graceShields <= 0) {
      alert('You have no Grace Shields remaining this month. Earn more by reaching 7-day milestones!');
      return;
    }
    const nextState = !shieldActive;
    setShieldActive(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.graceShieldActive', String(nextState));
    }
  }

  // Handle claiming a milestone blessing
  function handleClaimBlessing(m: StreakMilestone) {
    if (claimedMilestones.includes(m.id)) return;

    playBlessingChime();
    const newClaimed = [...claimedMilestones, m.id];
    setClaimedMilestones(newClaimed);

    const bonusPoints = 100;
    const newTotal = gracePoints + bonusPoints;
    onUpdateGracePoints(newTotal);
    setGraceShields(prev => Math.min(3, prev + 1));

    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.claimedMilestones', JSON.stringify(newClaimed));
      localStorage.setItem('lifebook.gracePoints', String(newTotal));
      localStorage.setItem('lifebook.graceShields', String(Math.min(3, graceShields + 1)));
    }

    setCelebratingMilestone(m);
  }

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return STREAK_MILESTONES.filter(m => {
      const isAchieved = currentStreak >= m.days || longestStreak >= m.days;
      if (milestoneFilter === 'unlocked') return isAchieved;
      if (milestoneFilter === 'locked') return !isAchieved;
      return true;
    });
  }, [milestoneFilter, currentStreak, longestStreak]);

  const unlockedCount = useMemo(() => {
    return STREAK_MILESTONES.filter(m => currentStreak >= m.days || longestStreak >= m.days).length;
  }, [currentStreak, longestStreak]);

  return (
    <div id="streak-gamification-engine" className="space-y-8 animate-fade-in">
      {/* 1. TOP DUAL CARDS: SPIRITUAL LEVEL & GRACE SHIELD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spiritual Level & Grace Points XP Card */}
        <div
          id="spiritual-level-card"
          className="lg:col-span-2 rounded-3xl bg-gradient-to-r from-[#211B3B] via-[#2A1F4A] to-[#16424D] p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm">✦</span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#37C6C2]">
                  Spiritual Level & Grace Points
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E3B15E]/20 border border-[#E3B15E]/40 text-[#E3B15E] text-xs font-bold shadow-xs">
                {gracePoints} Total GP
              </span>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl shadow-lg shrink-0">
                  {currentLevel.icon}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#37C6C2]">
                    Level {currentLevel.level} of {SPIRITUAL_LEVELS.length}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-0.5">
                    {currentLevel.title}
                  </h3>
                  <p className="text-xs text-[#D1C7E6] mt-0.5 italic">
                    “{currentLevel.verse}” <strong className="text-[#37C6C2] not-italic">— {currentLevel.verseRef}</strong>
                  </p>
                </div>
              </div>

              {nextLevel && (
                <div className="sm:text-right shrink-0 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-2xl">
                  <span className="text-xs text-[#C5BCD9]">Next Milestone:</span>
                  <div className="font-bold text-sm text-[#E3B15E] mt-0.5">
                    {nextLevel.icon} {nextLevel.title}
                  </div>
                  <span className="text-[11px] text-[#A69BBF]">
                    {nextLevel.minPoints - gracePoints} GP needed
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs text-[#C5BCD9] mb-1.5 font-medium">
              <span>Current Progress to Level {nextLevel?.level || currentLevel.level}</span>
              <span className="font-bold text-[#37C6C2]">{levelProgress}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/15 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] via-[#37C6C2] to-[#E3B15E] transition-all duration-500 shadow-sm"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Grace Shield (Streak Freeze Protection) */}
        <div
          id="grace-shield-card"
          className="rounded-3xl bg-[#FAF8F5] border border-[#E8E1CE] p-6 sm:p-7 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1CE]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#7B6E4A]">
                  Grace Shield
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  shieldActive
                    ? 'bg-[#1FB6B0]/15 text-[#0F7571] border-[#1FB6B0]/30'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {shieldActive ? 'Active 🛡️' : 'Standby'}
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-serif font-bold text-[#2B2313]">
                Streak Freeze Protection
              </h4>
              <p className="text-xs text-[#6B5E43] mt-1 leading-relaxed">
                If sickness, travel, or unexpected grief interrupts your daily rhythm, God’s grace shields your streak from resetting.
              </p>
              <blockquote className="mt-3 text-[11px] font-serif italic text-[#8A7539] bg-white p-2.5 rounded-xl border border-[#DFD7C1]">
                “My grace is sufficient for you, for my power is made perfect in weakness.” (2 Cor 12:9)
              </blockquote>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E8E1CE] flex items-center justify-between gap-3">
            <div className="text-xs text-[#6B5E43]">
              <span>Shields Ready: </span>
              <strong className="text-[#2B2313] font-bold">{graceShields} available</strong>
            </div>

            <button
              id="toggle-grace-shield-btn"
              type="button"
              onClick={handleToggleShield}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                shieldActive
                  ? 'bg-[#1FB6B0] hover:bg-[#189b96] text-[#122423]'
                  : 'bg-[#2B2313] hover:bg-[#433722] text-white'
              }`}
            >
              {shieldActive ? 'Shield Armed' : 'Equip Shield'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. DAILY GRACE TRINITY (DAILY QUEST CHECKLIST) */}
      <section
        id="daily-grace-trinity-card"
        className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 shadow-sm ${
          isTrinityComplete
            ? 'bg-gradient-to-r from-[#F4FAF8] via-[#FAF7F2] to-[#FAF5FC] border-[#B9E8E4]'
            : 'bg-white border-gray-200/80'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                Daily Quest
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1FB6B0]/15 text-[#0F7571] border border-[#1FB6B0]/30">
                Daily Grace Trinity
              </span>
            </div>
            <h3 className="text-2xl font-serif text-[#1E1931] mt-0.5">
              Three Sacred Daily Rhythms
            </h3>
            <p className="text-xs text-[#706782] mt-0.5">
              Complete all three today to unlock the <strong>Daily Trinity Crown (+25 GP Bonus)</strong> and build an unbreakable streak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-1.5 shadow-xs ${
              isTrinityComplete
                ? 'bg-[#E3B15E] text-white border-[#E3B15E]'
                : 'bg-gray-50 border-gray-200 text-[#554A70]'
            }`}>
              <span>👑</span>
              <span>{isTrinityComplete ? 'Trinity Complete! (+25 GP Bonus)' : 'In Progress (1-2 to go)'}</span>
            </span>
          </div>
        </div>

        {/* The 3 Trinity Micro-Habits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* 1. Scripture */}
          <div
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isScriptureDone
                ? 'bg-[#F2FAF9] border-[#A8E5E0] shadow-xs'
                : 'bg-[#FAF8FC] border-gray-200/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">📖</span>
                <span className="text-[11px] font-bold text-[#1FB6B0] bg-[#1FB6B0]/10 px-2 py-0.5 rounded-md">
                  +10 GP
                </span>
              </div>
              <h4 className="text-base font-bold font-serif text-[#1E1931] mt-3">
                1. Word of God
              </h4>
              <p className="text-xs text-[#706782] mt-1">
                Read or meditate upon Scripture today.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
              <span className={`text-xs font-bold ${isScriptureDone ? 'text-[#0E7773]' : 'text-gray-400'}`}>
                {isScriptureDone ? '✓ Completed' : 'Pending'}
              </span>
              <button
                type="button"
                onClick={() => onTogglePractice('scriptureRead')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isScriptureDone
                    ? 'bg-[#1FB6B0] text-white'
                    : 'bg-white border border-gray-300 text-[#332A4C] hover:bg-gray-50'
                }`}
              >
                {isScriptureDone ? 'Completed ✓' : 'Mark Done'}
              </button>
            </div>
          </div>

          {/* 2. Prayer */}
          <div
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isPrayerDone
                ? 'bg-[#F2FAF9] border-[#A8E5E0] shadow-xs'
                : 'bg-[#FAF8FC] border-gray-200/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🙏</span>
                <span className="text-[11px] font-bold text-[#1FB6B0] bg-[#1FB6B0]/10 px-2 py-0.5 rounded-md">
                  +10 GP
                </span>
              </div>
              <h4 className="text-base font-bold font-serif text-[#1E1931] mt-3">
                2. Heartfelt Prayer
              </h4>
              <p className="text-xs text-[#706782] mt-1">
                Bring praise, petition, or quiet listening before the Lord.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
              <span className={`text-xs font-bold ${isPrayerDone ? 'text-[#0E7773]' : 'text-gray-400'}`}>
                {isPrayerDone ? '✓ Completed' : 'Pending'}
              </span>
              <button
                type="button"
                onClick={() => onTogglePractice('prayerCompleted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isPrayerDone
                    ? 'bg-[#1FB6B0] text-white'
                    : 'bg-white border border-gray-300 text-[#332A4C] hover:bg-gray-50'
                }`}
              >
                {isPrayerDone ? 'Completed ✓' : 'Mark Done'}
              </button>
            </div>
          </div>

          {/* 3. Soul Reflection / Journal */}
          <div
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isJournalDone
                ? 'bg-[#F2FAF9] border-[#A8E5E0] shadow-xs'
                : 'bg-[#FAF8FC] border-gray-200/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">✍️</span>
                <span className="text-[11px] font-bold text-[#E3B15E] bg-[#E3B15E]/15 px-2 py-0.5 rounded-md">
                  +20 GP
                </span>
              </div>
              <h4 className="text-base font-bold font-serif text-[#1E1931] mt-3">
                3. Soul Reflection
              </h4>
              <p className="text-xs text-[#706782] mt-1">
                Write a journal reflection or log your soul’s posture.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
              <span className={`text-xs font-bold ${isJournalDone ? 'text-[#0E7773]' : 'text-gray-400'}`}>
                {isJournalDone ? '✓ Completed' : 'Pending'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onOpenJournal) {
                    onOpenJournal();
                  } else {
                    onTogglePractice('journalWritten');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isJournalDone
                    ? 'bg-[#1FB6B0] text-white'
                    : 'bg-white border border-gray-300 text-[#332A4C] hover:bg-gray-50'
                }`}
              >
                {isJournalDone ? 'Written ✓' : 'Write Journal'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONSECUTIVE STREAK MILESTONES WITH "CLAIM BLESSING" ACTION */}
      <section
        id="streak-milestones-gamified-cabinet"
        className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
              Trophy Cabinet & Blessings
            </span>
            <h3 className="text-2xl font-serif text-[#1E1931] mt-0.5">
              Consecutive Streak Milestones
            </h3>
            <p className="text-xs text-[#706782] mt-0.5">
              Earn commemorative spiritual seals and claim +100 GP blessings for consecutive walking records.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMilestoneFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                milestoneFilter === 'all'
                  ? 'bg-white text-[#1E1931] shadow-xs'
                  : 'text-[#706782] hover:text-[#1E1931]'
              }`}
            >
              All ({STREAK_MILESTONES.length})
            </button>
            <button
              type="button"
              onClick={() => setMilestoneFilter('unlocked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                milestoneFilter === 'unlocked'
                  ? 'bg-white text-[#1E1931] shadow-xs'
                  : 'text-[#706782] hover:text-[#1E1931]'
              }`}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              type="button"
              onClick={() => setMilestoneFilter('locked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                milestoneFilter === 'locked'
                  ? 'bg-white text-[#1E1931] shadow-xs'
                  : 'text-[#706782] hover:text-[#1E1931]'
              }`}
            >
              In Progress ({STREAK_MILESTONES.length - unlockedCount})
            </button>
          </div>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredMilestones.map(m => {
            const isUnlocked = currentStreak >= m.days || longestStreak >= m.days;
            const isClaimed = claimedMilestones.includes(m.id);
            const progress = Math.min(100, Math.round((currentStreak / m.days) * 100));
            const daysRemaining = Math.max(0, m.days - currentStreak);

            return (
              <div
                key={m.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? isClaimed
                      ? 'bg-gradient-to-br from-[#FAF8FD] to-[#F5FAF9] border-[#D1C6EB] shadow-xs hover:border-[#1FB6B0]'
                      : 'bg-gradient-to-br from-[#FFFDF7] to-[#F3FAF9] border-[#E8CB72] shadow-md ring-2 ring-[#E3B15E]/40'
                    : 'bg-[#FAF8FC]/70 border-gray-200/80 opacity-70'
                }`}
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-2xs">
                      {m.icon}
                    </div>

                    <div>
                      {isUnlocked ? (
                        isClaimed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#1FB6B0]/15 text-[#0F7571] border border-[#1FB6B0]/30">
                            <span>✓</span> Claimed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleClaimBlessing(m)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#E3B15E] to-[#F28C38] text-white shadow-sm hover:brightness-110 active:scale-95 cursor-pointer animate-pulse"
                          >
                            <span>🎁</span> Claim +100 GP
                          </button>
                        )
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

                    <h4 className="text-base font-bold font-serif text-[#1E1931] mt-0.5">
                      {m.title}
                    </h4>
                    <p className="text-xs text-[#706782] mt-1 leading-relaxed line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                </div>

                {/* Progress & Scripture */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-[11px] mb-1 font-medium">
                    <span className="text-gray-500">
                      {isUnlocked ? 'Record achieved!' : `${currentStreak} / ${m.days} days`}
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

                  {/* 7-Day & 30-Day Milestone Celebration Trigger Button */}
                  {(m.days === 7 || m.days === 30) && onTriggerMilestoneCelebration && (
                    <button
                      type="button"
                      id={`milestone-${m.days}-celebration-trigger`}
                      onClick={() => onTriggerMilestoneCelebration(m.days as 7 | 30)}
                      className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        isUnlocked
                          ? 'bg-gradient-to-r from-[#17132B] to-[#2B1D4B] hover:to-[#382662] text-white border border-white/20 hover:border-[#37C6C2]/60'
                          : 'bg-white hover:bg-gray-50 text-[#554A70] border border-gray-200'
                      }`}
                    >
                      <span>🎉</span>
                      <span>{isUnlocked ? `Celebrate ${m.days}-Day Milestone` : `Preview ${m.days}-Day Animation`}</span>
                      <span className="text-[#E3B15E]">✦</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CELEBRATION MODAL FOR CLAIMED BLESSINGS */}
      {celebratingMilestone && (
        <div
          id="blessing-claim-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#211B3B] to-[#162734] border border-[#E3B15E]/40 p-6 sm:p-8 text-white text-center shadow-2xl relative">
            <button
              type="button"
              onClick={() => setCelebratingMilestone(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white text-base p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#E3B15E] to-[#F28C38] flex items-center justify-center text-4xl shadow-xl animate-bounce">
              {celebratingMilestone.icon}
            </div>

            <span className="inline-block mt-4 px-3 py-1 rounded-full bg-[#E3B15E]/20 text-[#E3B15E] text-[11px] font-extrabold uppercase tracking-widest border border-[#E3B15E]/30">
              Blessing Claimed · +100 Grace Points!
            </span>

            <h3 className="text-2xl font-serif font-bold text-white mt-2">
              {celebratingMilestone.title}
            </h3>
            <p className="text-xs text-[#C5BCD9] mt-1">
              {celebratingMilestone.description}
            </p>

            <blockquote className="mt-4 p-4 rounded-2xl bg-white/10 border border-white/15 text-xs font-serif italic text-[#E5DCF6] leading-relaxed">
              “{celebratingMilestone.scripture}”
              <strong className="block not-italic text-[#37C6C2] mt-1">
                — {celebratingMilestone.scriptureRef}
              </strong>
            </blockquote>

            <button
              type="button"
              onClick={() => setCelebratingMilestone(null)}
              className="mt-6 w-full py-3 rounded-full bg-[#1FB6B0] hover:bg-[#189b96] text-[#122423] font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Praise God & Continue Journey
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
