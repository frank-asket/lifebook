'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Sparkle,
  GearSix,
  Check,
  CalendarBlank,
  Target,
} from '@phosphor-icons/react';
import type { DayActivityRecord } from './ProgressScreen';

export interface DevotionGoalSettings {
  targetMinutes: number; // default 5
  timeOfDay: 'morning' | 'midday' | 'evening' | 'night' | 'anytime';
  focus: 'stillness' | 'scripture' | 'prayer' | 'gratitude' | 'custom';
  customFocusText?: string;
  reminderEnabled: boolean;
}

export interface DailyDevotionLog {
  dateStr: string;
  targetMinutes: number;
  secondsCompleted: number;
  completed: boolean;
  completedAt?: string;
  focus: string;
  history?: Record<string, number>; // dateStr -> secondsCompleted
}

interface DailyDevotionGoalCardProps {
  todayStr: string;
  todayRecord?: DayActivityRecord;
  onUpdateRecord?: (dateStr: string, updated: DayActivityRecord) => void;
  onGracePointsAwarded?: (points: number) => void;
  className?: string;
}

const DEFAULT_SETTINGS: DevotionGoalSettings = {
  targetMinutes: 5,
  timeOfDay: 'morning',
  focus: 'stillness',
  customFocusText: '',
  reminderEnabled: true,
};

const DEVOTION_FOCUS_DETAILS: Record<
  DevotionGoalSettings['focus'],
  { label: string; icon: string; prompt: string; scriptureRef: string; scriptureText: string }
> = {
  stillness: {
    label: 'Silent Abiding Prayer',
    icon: '🕊️',
    prompt: 'Breathe deeply. Release striving. Rest silently in the loving presence of Christ.',
    scriptureRef: 'Psalm 46:10',
    scriptureText: 'Be still, and know that I am God.',
  },
  scripture: {
    label: 'Scripture Lectio Divina',
    icon: '📖',
    prompt: 'Read the holy word slowly. Let one word or phrase sink deep into your spirit.',
    scriptureRef: 'Psalm 119:105',
    scriptureText: 'Your word is a lamp to my feet and a light to my path.',
  },
  prayer: {
    label: 'Heart Prayers & Intercession',
    icon: '🕯️',
    prompt: 'Pour out your honest burdens, thanksgiving, and prayers for those you love.',
    scriptureRef: 'Philippians 4:6-7',
    scriptureText: 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.',
  },
  gratitude: {
    label: 'Thanksgiving & Praise',
    icon: '✨',
    prompt: 'Recall three specific mercies or gifts God has provided in your life today.',
    scriptureRef: '1 Thessalonians 5:18',
    scriptureText: 'Give thanks in all circumstances; for this is God’s will for you in Christ Jesus.',
  },
  custom: {
    label: 'Personal Sanctuary Intention',
    icon: '🎯',
    prompt: 'Walk intentionally with God according to the custom focus of your heart today.',
    scriptureRef: 'Micah 6:8',
    scriptureText: 'Act justly, love mercy, and walk humbly with your God.',
  },
};

const MINUTE_BEADS = [
  { minute: 1, title: 'Arrival & Stillness', sub: 'Breathe in peace' },
  { minute: 2, title: 'Word of Grace', sub: 'Receive truth' },
  { minute: 3, title: 'Silent Abiding', sub: 'Rest with God' },
  { minute: 4, title: 'Heart Prayer', sub: 'Lay burdens down' },
  { minute: 5, title: 'Benediction', sub: 'Go in hope' },
];

export function DailyDevotionGoalCard({
  todayStr,
  todayRecord,
  onUpdateRecord,
  onGracePointsAwarded,
  className = '',
}: DailyDevotionGoalCardProps) {
  // 1. Settings state
  const [settings, setSettings] = useState<DevotionGoalSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.devotionGoal.settings');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editTargetMinutes, setEditTargetMinutes] = useState(settings.targetMinutes);
  const [editTimeOfDay, setEditTimeOfDay] = useState(settings.timeOfDay);
  const [editFocus, setEditFocus] = useState(settings.focus);
  const [editCustomFocus, setEditCustomFocus] = useState(settings.customFocusText || '');

  // 2. Daily progress state
  const [devotionLog, setDevotionLog] = useState<DailyDevotionLog>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.dailyDevotionGoal');
        if (saved) {
          const parsed: DailyDevotionLog = JSON.parse(saved);
          if (parsed.dateStr === todayStr) {
            return parsed;
          }
          // Preserve history across days
          return {
            dateStr: todayStr,
            targetMinutes: settings.targetMinutes,
            secondsCompleted: 0,
            completed: false,
            focus: settings.focus,
            history: {
              ...(parsed.history || {}),
              [parsed.dateStr]: parsed.secondsCompleted,
            },
          };
        }
      } catch {
        // fallback
      }
    }
    return {
      dateStr: todayStr,
      targetMinutes: settings.targetMinutes,
      secondsCompleted: 0,
      completed: false,
      focus: settings.focus,
      history: {},
    };
  });

  // 3. Active timer state
  const [isRunning, setIsRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [showCelebration, setShowCelebration] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

  const targetSeconds = (settings.targetMinutes || 5) * 60;
  const progressPercent = Math.min(100, Math.round((devotionLog.secondsCompleted / targetSeconds) * 100));
  const minutesLogged = Math.floor(devotionLog.secondsCompleted / 60);
  const secondsLoggedRemainder = devotionLog.secondsCompleted % 60;
  const secondsRemaining = Math.max(0, targetSeconds - devotionLog.secondsCompleted);
  const remMinutes = Math.floor(secondsRemaining / 60);
  const remSeconds = secondsRemaining % 60;

  // Gentle audio chime synthesizer using standard Web Audio API
  const playGentleChime = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz (Peaceful Miracle Tone)
      osc.frequency.exponentialRampToValueAtTime(792, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.6);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  // Save log helper
  const saveLog = useCallback((updated: DailyDevotionLog) => {
    setDevotionLog(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lifebook.dailyDevotionGoal', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }, []);

  // Complete devotion trigger
  const handleDevotionGoalFulfilled = useCallback(() => {
    setIsRunning(false);
    setShowCelebration(true);
    playGentleChime();

    // Award 25 Grace Points
    if (onGracePointsAwarded) {
      onGracePointsAwarded(25);
    }

    // Automatically mark stillness & prayer on today's calendar record
    if (onUpdateRecord) {
      const existing = todayRecord || {
        date: todayStr,
        dayLabel: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        mood: 'peaceful',
        intensity: 0,
        scriptureRead: false,
        prayerCompleted: false,
        stillnessPractice: false,
        journalWritten: false,
      };

      const updatedRecord: DayActivityRecord = {
        ...existing,
        stillnessPractice: true,
        prayerCompleted: true,
        intensity: Math.max(3, existing.intensity + 1),
        mood: existing.mood || 'peaceful',
        scriptureRef: existing.scriptureRef || DEVOTION_FOCUS_DETAILS[settings.focus].scriptureRef,
        reflectionSnippet: existing.reflectionSnippet || `Completed daily 5-minute devotion: ${DEVOTION_FOCUS_DETAILS[settings.focus].label}.`,
      };

      onUpdateRecord(todayStr, updatedRecord);
    }

    // Notify streak counters across the app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lifebook-streak-updated'));
    }
  }, [onGracePointsAwarded, onUpdateRecord, playGentleChime, settings.focus, todayRecord, todayStr]);

  // Handle active running timer
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      return;
    }

    // Breathing pacer cycle (4s inhale, 2s hold, 4s exhale)
    breathTimerRef.current = setInterval(() => {
      setBreathPhase(prev => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);

    timerRef.current = setInterval(() => {
      setDevotionLog(prev => {
        const nextSeconds = prev.secondsCompleted + 1;
        const reachedTarget = nextSeconds >= targetSeconds;

        const updated: DailyDevotionLog = {
          ...prev,
          secondsCompleted: nextSeconds,
          completed: reachedTarget ? true : prev.completed,
          completedAt: reachedTarget && !prev.completed ? new Date().toISOString() : prev.completedAt,
        };

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('lifebook.dailyDevotionGoal', JSON.stringify(updated));
          } catch {
            // ignore
          }
        }

        if (reachedTarget && !prev.completed) {
          handleDevotionGoalFulfilled();
        }

        return updated;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [handleDevotionGoalFulfilled, isRunning, targetSeconds]);

  // Quick log full 5 minutes
  const handleQuickLogFullGoal = () => {
    const updated: DailyDevotionLog = {
      ...devotionLog,
      secondsCompleted: targetSeconds,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    saveLog(updated);
    handleDevotionGoalFulfilled();
  };

  // Add 1 minute
  const handleAddOneMinute = () => {
    const nextSeconds = Math.min(targetSeconds * 2, devotionLog.secondsCompleted + 60);
    const reached = nextSeconds >= targetSeconds;
    const updated: DailyDevotionLog = {
      ...devotionLog,
      secondsCompleted: nextSeconds,
      completed: reached ? true : devotionLog.completed,
      completedAt: reached && !devotionLog.completed ? new Date().toISOString() : devotionLog.completedAt,
    };
    saveLog(updated);
    if (reached && !devotionLog.completed) {
      handleDevotionGoalFulfilled();
    }
  };

  // Reset today's progress
  const handleResetProgress = () => {
    setIsRunning(false);
    const updated: DailyDevotionLog = {
      ...devotionLog,
      secondsCompleted: 0,
      completed: false,
      completedAt: undefined,
    };
    saveLog(updated);
  };

  // Save goal settings
  const handleSaveSettings = () => {
    const updated: DevotionGoalSettings = {
      targetMinutes: editTargetMinutes,
      timeOfDay: editTimeOfDay,
      focus: editFocus,
      customFocusText: editCustomFocus,
      reminderEnabled: settings.reminderEnabled,
    };
    setSettings(updated);
    setIsEditingGoal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.devotionGoal.settings', JSON.stringify(updated));
    }
  };

  // 7-day mini consistency calculation
  const pastWeekDays = useMemo(() => {
    const history = devotionLog.history || {};
    const result = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      const isToday = k === todayStr;
      const sec = isToday ? devotionLog.secondsCompleted : history[k] || 0;
      const targetSec = settings.targetMinutes * 60;
      const isDone = sec >= targetSec || (isToday && devotionLog.completed);
      result.push({
        dateStr: k,
        dayLetter: dayNames[d.getDay()],
        isToday,
        isDone,
        sec,
      });
    }
    return result;
  }, [devotionLog.completed, devotionLog.history, devotionLog.secondsCompleted, settings.targetMinutes, todayStr]);

  const activeFocus = DEVOTION_FOCUS_DETAILS[settings.focus];

  return (
    <div
      id="daily-5min-devotion-goal-card"
      className={`rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F3ECE0] border border-[#E8DFC8] p-6 sm:p-7 shadow-md relative overflow-hidden transition-all ${className}`}
    >
      {/* Decorative Warm Ambient Rays */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#E3B15E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1FB6B0]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Row: Title, Target Badge, Settings Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DFC8]/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E3B15E] animate-ping opacity-75" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9A7328]">
              Daily Devotion Goal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3B15E]/20 text-[#75500A] border border-[#E3B15E]/30">
              {settings.targetMinutes}-Minute Rhythm
            </span>
            {devotionLog.completed && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span>✓</span> Goal Reached!
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A2146] mt-1">
            5-Minute Sacred Stillness
          </h2>
          <p className="text-xs text-[#6B5E86] mt-0.5 max-w-xl">
            Consecrate 5 intentional minutes each day to rest in God’s Word, quiet prayer, and holy abiding.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="configure-devotion-goal-btn"
            onClick={() => {
              setEditTargetMinutes(settings.targetMinutes);
              setEditTimeOfDay(settings.timeOfDay);
              setEditFocus(settings.focus);
              setEditCustomFocus(settings.customFocusText || '');
              setIsEditingGoal(!isEditingGoal);
            }}
            className="px-3.5 py-1.5 rounded-full bg-white border border-[#D5C9B0] hover:bg-[#F7F2E7] text-[#4A3D24] text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Customize your daily devotion duration and sacred intention"
          >
            <GearSix weight="bold" className="w-3.5 h-3.5" />
            <span>{isEditingGoal ? 'Close Settings' : 'Set Devotion Goal'}</span>
          </button>
        </div>
      </div>

      {/* Goal Configuration Drawer */}
      {isEditingGoal && (
        <div
          id="devotion-goal-settings-panel"
          className="mt-5 p-5 rounded-2xl bg-white border border-[#E2D6BE] shadow-sm space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#2A2146] flex items-center gap-2">
              <Target weight="bold" className="w-4 h-4 text-[#9A7328]" />
              <span>Customize Your Daily Devotion Goal</span>
            </h4>
            <span className="text-[11px] text-[#7A6E94]">Saves to your spiritual profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* 1. Daily Duration */}
            <div>
              <label className="block font-bold text-[#453A5C] mb-1.5">
                Target Minutes: <span className="text-[#A0701C] font-extrabold">{editTargetMinutes} mins</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 5, 10, 15].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEditTargetMinutes(m)}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      editTargetMinutes === m
                        ? 'bg-[#2A2146] text-white shadow-xs'
                        : 'bg-[#FAF8FC] text-[#554A70] hover:bg-[#EFEBF6] border border-[#EADBFC]'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Time Window Intention */}
            <div>
              <label className="block font-bold text-[#453A5C] mb-1.5">
                Sacred Time Window:
              </label>
              <select
                value={editTimeOfDay}
                onChange={e => setEditTimeOfDay(e.target.value as DevotionGoalSettings['timeOfDay'])}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8FC] border border-[#EADBFC] text-[#2A2146] font-medium"
              >
                <option value="morning">🌅 Morning Watch (Dawn)</option>
                <option value="midday">☀️ Midday Manna (12:00 PM)</option>
                <option value="evening">🌇 Evening Vespers (Dusk)</option>
                <option value="night">🌙 Night Compline (Bedtime)</option>
                <option value="anytime">🕊️ Flexible / Anytime</option>
              </select>
            </div>

            {/* 3. Devotion Modality */}
            <div>
              <label className="block font-bold text-[#453A5C] mb-1.5">
                Spiritual Posture:
              </label>
              <select
                value={editFocus}
                onChange={e => setEditFocus(e.target.value as DevotionGoalSettings['focus'])}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8FC] border border-[#EADBFC] text-[#2A2146] font-medium"
              >
                <option value="stillness">🕊️ Silent Abiding Prayer</option>
                <option value="scripture">📖 Scripture Lectio Divina</option>
                <option value="prayer">🕯️ Heart Prayers & Intercession</option>
                <option value="gratitude">✨ Thanksgiving & Praise</option>
                <option value="custom">🎯 Custom Intention</option>
              </select>
            </div>
          </div>

          {editFocus === 'custom' && (
            <div>
              <label className="block text-xs font-bold text-[#453A5C] mb-1">
                Your Custom Devotion Intention:
              </label>
              <input
                type="text"
                value={editCustomFocus}
                onChange={e => setEditCustomFocus(e.target.value)}
                placeholder="e.g. Meditate on Romans 8 and pray for family..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF8FC] border border-[#EADBFC] text-[#2A2146]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditingGoal(false)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              id="save-devotion-goal-btn"
              onClick={handleSaveSettings}
              className="px-5 py-1.5 rounded-full bg-[#2A2146] text-white text-xs font-bold hover:bg-[#1E1835] shadow-xs cursor-pointer"
            >
              Save Daily Goal
            </button>
          </div>
        </div>
      )}

      {/* Main Visualization & Interactive Tracker Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left (5 Cols): Circular SVG Radial Progress Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Background SVG Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-[#E6DCC6]"
                strokeWidth="10"
                fill="none"
              />
              {/* Active Progress Arc */}
              <circle
                cx="60"
                cy="60"
                r="50"
                className="transition-all duration-700 ease-out"
                stroke={devotionLog.completed ? '#10B981' : '#E3B15E'}
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - progressPercent / 100)}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
              <span className="text-2xl sm:text-3xl mb-0.5">
                {devotionLog.completed ? '🎉' : isRunning ? '🕊️' : activeFocus.icon}
              </span>
              <div className="font-mono font-extrabold text-2xl sm:text-3xl text-[#2A2146]">
                {minutesLogged}:{secondsLoggedRemainder < 10 ? '0' : ''}{secondsLoggedRemainder}
              </div>
              <span className="text-[11px] font-semibold text-[#827252] uppercase tracking-wider">
                of {settings.targetMinutes}:00 mins
              </span>
              <div className="mt-1">
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    devotionLog.completed
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRunning
                      ? 'bg-[#E3B15E]/20 text-[#85580C]'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {devotionLog.completed ? 'Completed ✓' : isRunning ? 'In Communion' : 'Ready to Start'}
                </span>
              </div>
            </div>
          </div>

          {/* Guided Breath Indicator when running */}
          {isRunning && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#7A5B18] bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="capitalize">{breathPhase}: {breathPhase === 'inhale' ? 'Breathe in peace' : breathPhase === 'hold' ? 'Rest in His grace' : 'Release worry'}</span>
            </div>
          )}
        </div>

        {/* Right (7 Cols): Minute Segments, Scripture Focus & Action Controls */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Active Scripture & Intention Card */}
          <div className="p-4 rounded-2xl bg-white/90 border border-[#E5DAC0] shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#8A6115] flex items-center gap-1.5">
                <span>{activeFocus.icon}</span>
                <span>Focus: {activeFocus.label}</span>
              </span>
              <span className="font-serif italic text-[#6B5E86]">{activeFocus.scriptureRef}</span>
            </div>
            <p className="text-xs font-serif italic text-[#382D1B] leading-relaxed">
              “{activeFocus.scriptureText}”
            </p>
            <p className="text-[11px] text-[#7A6F8F] mt-1.5">
              {activeFocus.prompt}
            </p>
          </div>

          {/* 5 Minute Pearls / Progress Segments */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#453A5C] mb-2">
              <span>Sacred Minute Milestones</span>
              <span className="text-[#8C6212] font-mono">
                {Math.min(5, minutesLogged)}/5 Steps
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {MINUTE_BEADS.map(bead => {
                const isPassed = devotionLog.secondsCompleted >= bead.minute * 60;
                const isCurrent =
                  devotionLog.secondsCompleted >= (bead.minute - 1) * 60 &&
                  devotionLog.secondsCompleted < bead.minute * 60;

                return (
                  <div
                    key={bead.minute}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      isPassed
                        ? 'bg-[#1FB6B0] text-white border-[#189B95] shadow-xs'
                        : isCurrent
                        ? 'bg-[#FFF7E8] text-[#8C6212] border-[#E3B15E] ring-2 ring-[#E3B15E]/40 font-bold'
                        : 'bg-white/70 text-[#7A6F8F] border-[#E8DFC8]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono font-bold">
                      {isPassed ? '✓ Done' : `Min ${bead.minute}`}
                    </div>
                    <div className="text-[10px] font-bold line-clamp-1 mt-0.5">
                      {bead.title.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {!devotionLog.completed && (
              <button
                type="button"
                id="devotion-timer-toggle-btn"
                onClick={() => setIsRunning(!isRunning)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-[#2A2146] hover:bg-[#1E1835] text-white'
                }`}
              >
                {isRunning ? (
                  <Pause weight="fill" className="w-3.5 h-3.5" />
                ) : (
                  <Play weight="fill" className="w-3.5 h-3.5" />
                )}
                <span>{isRunning ? 'Pause Timer' : 'Begin 5-Minute Devotion'}</span>
                {isRunning && <span className="font-mono text-amber-200">({remMinutes}:{remSeconds < 10 ? '0' : ''}{remSeconds})</span>}
              </button>
            )}

            {!devotionLog.completed && (
              <button
                type="button"
                id="quick-log-5min-devotion-btn"
                onClick={handleQuickLogFullGoal}
                className="px-4 py-2.5 rounded-full bg-white hover:bg-[#F7F2E7] border border-[#D5C9B0] text-[#4A3D24] text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="Mark the full 5-minute devotion completed for today"
              >
                <Sparkle weight="bold" className="w-3.5 h-3.5 text-[#E3B15E]" />
                <span>Quick Log 5 Mins</span>
              </button>
            )}

            <button
              type="button"
              id="add-one-min-devotion-btn"
              onClick={handleAddOneMinute}
              className="px-3.5 py-2.5 rounded-full bg-white/80 hover:bg-white border border-[#D5C9B0] text-[#4A3D24] text-xs font-semibold transition-all cursor-pointer"
              title="Add 1 minute of devotion"
            >
              +1 Min
            </button>

            {devotionLog.secondsCompleted > 0 && (
              <button
                type="button"
                id="reset-devotion-btn"
                onClick={handleResetProgress}
                className="px-3.5 py-2.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                title="Reset today's devotion progress"
              >
                Reset
              </button>
            )}

            {devotionLog.completed && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                <Check weight="bold" className="w-4 h-4 text-emerald-700" />
                <span>Today’s 5-minute devotion fulfilled (+25 Grace Points)!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: 7-Day Consistency Track for 5-Minute Goal */}
      <div className="mt-6 pt-4 border-t border-[#E8DFC8]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#6B5E86]">
          <CalendarBlank weight="regular" className="w-4 h-4 text-[#8C6212]" />
          <span className="font-bold text-[#2A2146]">Weekly Devotion Rhythm:</span>
          <span>
            {pastWeekDays.filter(d => d.isDone).length} of 7 Days Completed
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pastWeekDays.map(d => (
            <div
              key={d.dateStr}
              className={`w-8 h-9 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                d.isDone
                  ? 'bg-[#1FB6B0] text-white font-bold shadow-2xs'
                  : d.isToday
                  ? 'bg-white border-2 border-dashed border-[#E3B15E] text-[#8C6212] font-bold'
                  : 'bg-white/60 text-gray-400 border border-[#E8DFC8]'
              }`}
              title={`${d.dateStr}: ${d.isDone ? '5-Min Goal Completed' : 'Pending'}`}
            >
              <span className="text-[9px] uppercase opacity-80">{d.dayLetter}</span>
              <span className="text-[11px] font-bold mt-0.5">
                {d.isDone ? '✓' : d.isToday ? '•' : '–'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration Toast Modal */}
      {showCelebration && (
        <div
          id="devotion-goal-celebration-toast"
          className="fixed bottom-6 right-6 z-50 p-5 rounded-2xl bg-[#2A2146] text-white shadow-2xl border border-white/20 flex items-start gap-4 max-w-sm animate-slideUp"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F28C38] to-[#E3B15E] flex items-center justify-center text-xl shrink-0 shadow-sm">
            🕊️
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Daily Devotion Fulfilled!</h4>
              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="text-white/60 hover:text-white text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#D8CFEB] mt-1">
              You walked in sacred stillness today. +25 Grace Points awarded to your Sanctuary!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
