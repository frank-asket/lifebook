"use client";

import React, { useState, useMemo } from 'react';
import {
  Palette,
  Flame,
  CaretLeft,
  CaretRight,
  Bell,
  BookOpen,
  HandsPraying,
  PencilSimpleLine,
  ChatCircleDots,
  Check,
  Plus,
  Sparkle,
} from '@phosphor-icons/react';
import type { MoodItem, DayActivityRecord } from './ProgressScreen';
import { MOODS } from './ProgressScreen';

export interface MonthlyMoodHeatmapProps {
  calendarRecords: Record<string, DayActivityRecord>;
  onUpdateRecord: (dateStr: string, updated: DayActivityRecord) => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  todayStr: string;
  activeStreakDates?: Set<string>;
  onOpenJournal?: () => void;
  onOpenPulse?: () => void;
  onOpenNotificationSettings?: () => void;
  notificationReminderTime?: string;
}

// Mood Theme Visual Styling Configuration
interface MoodTheme {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  badge: string;
  dot: string;
  glow: string;
  hex: string;
  scriptureRef: string;
  scriptureText: string;
  reflection: string;
}

const MOOD_THEMES: Record<string, MoodTheme> = {
  grateful: {
    bg: 'bg-[#FFF8EB] hover:bg-[#FEF0D6]',
    bgLight: 'bg-[#FFFBF2]',
    border: 'border-[#F2CA79]',
    text: 'text-[#8A5E0B]',
    badge: 'bg-[#FBE4B3] text-[#7A4E04] border-[#F2CA79]',
    dot: 'bg-[#E3B15E]',
    glow: 'rgba(227,177,94,0.32)',
    hex: '#E3B15E',
    scriptureRef: 'Psalm 107:1',
    scriptureText: 'Give thanks to the Lord, for he is good; his love endures forever.',
    reflection: 'Attuned to God’s daily providence and gifts. Gratitude anchors hope in unseen blessings.',
  },
  peaceful: {
    bg: 'bg-[#EDFAF9] hover:bg-[#DDF5F3]',
    bgLight: 'bg-[#F4FCFC]',
    border: 'border-[#72D6D0]',
    text: 'text-[#0B6763]',
    badge: 'bg-[#C1EFEA] text-[#08524F] border-[#72D6D0]',
    dot: 'bg-[#37C6C2]',
    glow: 'rgba(55,198,194,0.32)',
    hex: '#37C6C2',
    scriptureRef: 'John 14:27',
    scriptureText: 'Peace I leave with you; my peace I give you. Do not let your hearts be troubled.',
    reflection: 'Resting in Christ’s unshakable peace, sheltered from the world’s noise and hurry.',
  },
  seeking: {
    bg: 'bg-[#F5F2FC] hover:bg-[#EBE5F8]',
    bgLight: 'bg-[#FAF8FE]',
    border: 'border-[#C2B1E6]',
    text: 'text-[#4A3184]',
    badge: 'bg-[#DFD5F5] text-[#3D2575] border-[#C2B1E6]',
    dot: 'bg-[#7B62B8]',
    glow: 'rgba(123,98,184,0.32)',
    hex: '#7B62B8',
    scriptureRef: 'Jeremiah 29:13',
    scriptureText: 'You will seek me and find me when you seek me with all your heart.',
    reflection: 'Approaching the throne with holy curiosity and deep longing for divine wisdom and guidance.',
  },
  convicted: {
    bg: 'bg-[#FAF0EE] hover:bg-[#F4E1DD]',
    bgLight: 'bg-[#FDF7F6]',
    border: 'border-[#E3B0A9]',
    text: 'text-[#7D342C]',
    badge: 'bg-[#F5D0CB] text-[#692922] border-[#E3B0A9]',
    dot: 'bg-[#B8746B]',
    glow: 'rgba(184,116,107,0.32)',
    hex: '#B8746B',
    scriptureRef: '1 John 1:9',
    scriptureText: 'If we confess our sins, he is faithful and just and will forgive us and cleanse us.',
    reflection: 'Tender conviction realigning the heart with holy grace. There is no condemnation in Christ.',
  },
  doubting: {
    bg: 'bg-[#F0F5FA] hover:bg-[#E1EDF7]',
    bgLight: 'bg-[#F7FAFD]',
    border: 'border-[#ADC6DE]',
    text: 'text-[#284D72]',
    badge: 'bg-[#D2E3F2] text-[#1E3E5E] border-[#ADC6DE]',
    dot: 'bg-[#6B8CAE]',
    glow: 'rgba(107,140,174,0.32)',
    hex: '#6B8CAE',
    scriptureRef: 'Mark 9:24',
    scriptureText: 'I do believe; help me overcome my unbelief!',
    reflection: 'Honest questions and wrestling held gently before God. Biblical faith clings even in mystery.',
  },
  distant: {
    bg: 'bg-[#F2EFF7] hover:bg-[#E6E0F0]',
    bgLight: 'bg-[#F9F7FC]',
    border: 'border-[#BCB3D0]',
    text: 'text-[#373053]',
    badge: 'bg-[#DDD7EA] text-[#2C2644] border-[#BCB3D0]',
    dot: 'bg-[#5B5580]',
    glow: 'rgba(91,85,128,0.32)',
    hex: '#5B5580',
    scriptureRef: 'Psalm 139:9-10',
    scriptureText: 'If I rise on the wings of the dawn... even there your hand will guide me.',
    reflection: 'Spiritual stillness in dry ground. Even when feelings are quiet, His covenant love is constant.',
  },
};

const DEFAULT_UNLOGGED_THEME: MoodTheme = {
  bg: 'bg-[#FAF8F5] hover:bg-[#F3EFE9]',
  bgLight: 'bg-[#FCFBF9]',
  border: 'border-dashed border-gray-200',
  text: 'text-gray-400',
  badge: 'bg-gray-100 text-gray-500 border-gray-200',
  dot: 'bg-gray-300',
  glow: 'rgba(0,0,0,0.05)',
  hex: '#C5BDAB',
  scriptureRef: 'Psalm 46:10',
  scriptureText: 'Be still, and know that I am God.',
  reflection: 'A quiet day of rest or awaiting the next faithful devotional step.',
};

export function MonthlyMoodHeatmap({
  calendarRecords,
  onUpdateRecord,
  selectedDateStr,
  onSelectDate,
  todayStr,
  activeStreakDates,
  onOpenJournal,
  onOpenPulse,
  onOpenNotificationSettings,
  notificationReminderTime,
}: MonthlyMoodHeatmapProps) {
  // Navigation: month view date
  const [viewDate, setViewDate] = useState(() => new Date());
  // Active mood filter chip (null means show all)
  const [activeMoodFilter, setActiveMoodFilter] = useState<MoodItem['id'] | null>(null);
  // View mode: color-code by primary mood vs color-code by practice intensity
  const [displayMode, setDisplayMode] = useState<'mood' | 'intensity'>('mood');

  // Month navigation handlers
  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(todayStr);
  };

  // Month name formatting
  const monthTitle = useMemo(() => {
    return viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [viewDate]);

  // Build the 7-column calendar matrix for the month
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      record?: DayActivityRecord;
      isPartOfActiveStreak: boolean;
    }> = [];

    // Preceding padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pDate = new Date(year, month - 1, pDay);
      const dateStr = pDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNumber: pDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        record: calendarRecords[dateStr],
        isPartOfActiveStreak: activeStreakDates?.has(dateStr) ?? false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        record: calendarRecords[dateStr],
        isPartOfActiveStreak: activeStreakDates?.has(dateStr) ?? false,
      });
    }

    // Trailing padding days
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nDate = new Date(year, month + 1, i);
      const dateStr = nDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        record: calendarRecords[dateStr],
        isPartOfActiveStreak: activeStreakDates?.has(dateStr) ?? false,
      });
    }

    return days;
  }, [viewDate, calendarRecords, todayStr, activeStreakDates]);

  // Aggregate monthly emotional journey statistics
  const monthlyStats = useMemo(() => {
    const currentMonthDays = calendarDays.filter(d => d.isCurrentMonth);
    const totalDays = currentMonthDays.length;

    const moodCounts: Record<string, number> = {
      grateful: 0,
      peaceful: 0,
      seeking: 0,
      convicted: 0,
      doubting: 0,
      distant: 0,
    };

    let loggedDays = 0;
    let scriptureDays = 0;
    let prayerDays = 0;
    let stillnessDays = 0;
    let journalDays = 0;
    let sabbathDays = 0;

    for (const d of currentMonthDays) {
      const rec = d.record;
      if (rec) {
        if (rec.mood && moodCounts[rec.mood] !== undefined) {
          moodCounts[rec.mood] += 1;
          loggedDays += 1;
        } else if (rec.intensity > 0 || rec.isSabbathRest) {
          loggedDays += 1;
        }

        if (rec.scriptureRead) scriptureDays += 1;
        if (rec.prayerCompleted) prayerDays += 1;
        if (rec.stillnessPractice) stillnessDays += 1;
        if (rec.journalWritten) journalDays += 1;
        if (rec.isSabbathRest) sabbathDays += 1;
      }
    }

    // Find dominant mood
    let dominantMoodKey: MoodItem['id'] = 'peaceful';
    let maxCount = -1;
    for (const [key, count] of Object.entries(moodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantMoodKey = key as MoodItem['id'];
      }
    }

    // Peace & Gratitude centered index
    const centeredCount = (moodCounts.grateful || 0) + (moodCounts.peaceful || 0);
    const centeredPercentage = loggedDays > 0 ? Math.round((centeredCount / loggedDays) * 100) : 0;

    return {
      totalDays,
      loggedDays,
      moodCounts,
      dominantMoodKey,
      dominantCount: maxCount > 0 ? maxCount : 0,
      centeredPercentage,
      scriptureDays,
      prayerDays,
      stillnessDays,
      journalDays,
      sabbathDays,
    };
  }, [calendarDays]);

  // Active selected day record
  const currentRecord = useMemo(() => {
    return (
      calendarRecords[selectedDateStr] || {
        date: selectedDateStr,
        dayLabel: new Date(selectedDateStr + 'T12:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        mood: null,
        intensity: 0,
        scriptureRead: false,
        prayerCompleted: false,
        stillnessPractice: false,
        journalWritten: false,
      }
    );
  }, [calendarRecords, selectedDateStr]);

  // Quick action: Set mood for selected date
  const handleSetMood = (moodId: MoodItem['id']) => {
    const updated: DayActivityRecord = {
      ...currentRecord,
      mood: moodId,
      intensity: Math.max(1, currentRecord.intensity),
    };
    onUpdateRecord(selectedDateStr, updated);
  };

  // Quick action: Toggle practice on selected date
  const handleTogglePractice = (
    key: 'scriptureRead' | 'prayerCompleted' | 'stillnessPractice' | 'journalWritten'
  ) => {
    const updated: DayActivityRecord = {
      ...currentRecord,
      [key]: !currentRecord[key],
    };

    let score = 0;
    if (updated.scriptureRead) score++;
    if (updated.prayerCompleted) score++;
    if (updated.stillnessPractice) score++;
    if (updated.journalWritten) score++;
    if (updated.mood && score === 0) score = 1;

    updated.intensity = Math.min(4, score);
    onUpdateRecord(selectedDateStr, updated);
  };

  const selectedMoodTheme = currentRecord.mood
    ? MOOD_THEMES[currentRecord.mood] || DEFAULT_UNLOGGED_THEME
    : DEFAULT_UNLOGGED_THEME;

  const selectedMoodItem = currentRecord.mood
    ? MOODS.find(m => m.id === currentRecord.mood)
    : null;

  return (
    <div id="monthly-mood-heatmap-component" className="space-y-6">
      {/* SECTION 1: HEATMAP HEADER & EMOTIONAL SNAPSHOT BAR */}
      <section
        id="monthly-mood-heatmap-panel"
        data-testid="heatmap-calendar"
        className="rounded-3xl bg-white border border-gray-200/90 p-6 sm:p-8 shadow-sm transition-all"
      >
        {/* Top Control Ribbon: Title, Month Navigation & Display Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                Emotional Journey Heatmap
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#37C6C2]/15 text-[#0A6763] border border-[#37C6C2]/30">
                Monthly Snapshot
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#1E1931] mt-1 tracking-tight">
              {monthTitle}
            </h3>
            <p className="text-xs text-[#6F6486] mt-0.5">
              A daily color-coded tapestry of your spiritual emotions, honest reflections, and inner rhythms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-full bg-[#EAE4F2] p-1 shadow-inner">
              <button
                id="heatmap-mode-mood"
                type="button"
                onClick={() => setDisplayMode('mood')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'mood'
                    ? 'bg-[#2A2146] text-white shadow-xs'
                    : 'text-[#62557B] hover:text-[#1E1931]'
                }`}
              >
                <Palette weight="bold" className="w-3.5 h-3.5" />
                <span>Mood Heatmap</span>
              </button>
              <button
                id="heatmap-mode-intensity"
                type="button"
                onClick={() => setDisplayMode('intensity')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayMode === 'intensity'
                    ? 'bg-[#2A2146] text-white shadow-xs'
                    : 'text-[#62557B] hover:text-[#1E1931]'
                }`}
              >
                <Flame weight="bold" className="w-3.5 h-3.5" />
                <span>Practice Habits</span>
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1.5">
              <button
                id="heatmap-prev-month-btn"
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-[#4E4466] hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <CaretLeft weight="bold" className="w-3 h-3" />
                <span>Prev</span>
              </button>
              <button
                id="heatmap-today-jump-btn"
                type="button"
                onClick={handleJumpToToday}
                className="px-4 py-1.5 rounded-full bg-[#2A2146] text-white text-xs font-bold hover:bg-[#1E1835] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                This Month
              </button>
              <button
                id="heatmap-next-month-btn"
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-[#4E4466] hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <CaretRight weight="bold" className="w-3 h-3" />
              </button>

              {onOpenNotificationSettings && (
                <button
                  id="heatmap-notification-reminder-btn"
                  type="button"
                  onClick={onOpenNotificationSettings}
                  title="Set daily reminder notification time for mood check-in"
                  className="px-3.5 py-1.5 rounded-full border border-[#D5CBE7] bg-[#F7F4FB] hover:bg-[#EFE9F7] text-[#2C214A] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell weight="bold" className="w-3.5 h-3.5 text-[#2C214A]" />
                  <span className="hidden sm:inline">Daily Reminder</span>
                  {notificationReminderTime && (
                    <span className="text-[10px] font-mono font-extrabold text-[#0E716D] bg-[#E7F7F6] px-1.5 py-0.2 rounded-full border border-[#9DE1DD]">
                      {notificationReminderTime}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MONTHLY EMOTIONAL POSTURE SUMMARY BAR */}
        <div
          id="monthly-emotional-summary-banner"
          className="mt-6 rounded-2xl bg-gradient-to-r from-[#FAF8FC] via-[#F4F2F9] to-[#F1F9F8] border border-[#E0D8EE] p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Stat 1: Dominant Monthly Posture */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs border shrink-0"
                style={{
                  backgroundColor: `${MOOD_THEMES[monthlyStats.dominantMoodKey]?.hex || '#37C6C2'}22`,
                  borderColor: MOOD_THEMES[monthlyStats.dominantMoodKey]?.hex || '#37C6C2',
                }}
              >
                {MOODS.find(m => m.id === monthlyStats.dominantMoodKey)?.emoji || '🕊'}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#796B94]">
                  Dominant Posture
                </span>
                <h4 className="text-base font-bold text-[#1E1835] capitalize flex items-center gap-1.5">
                  <span>{MOODS.find(m => m.id === monthlyStats.dominantMoodKey)?.label || 'Peaceful'}</span>
                  <span className="text-xs font-semibold text-[#8778A3]">
                    ({monthlyStats.dominantCount} days)
                  </span>
                </h4>
              </div>
            </div>

            {/* Stat 2: Centered Peace & Gratitude Rate */}
            <div className="border-t md:border-t-0 md:border-l border-gray-200/80 pt-3 md:pt-0 md:pl-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#796B94]">
                Centered Harmony
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-[#1FB6B0]">
                  {monthlyStats.centeredPercentage}%
                </span>
                <span className="text-xs text-[#71658C]">
                  Grateful or Peaceful
                </span>
              </div>
            </div>

            {/* Stat 3: Total Logged Reflections */}
            <div className="border-t md:border-t-0 md:border-l border-gray-200/80 pt-3 md:pt-0 md:pl-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#796B94]">
                Devotional Rhythms
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-[#2A2146]">
                  {monthlyStats.loggedDays} / {monthlyStats.totalDays}
                </span>
                <span className="text-xs text-[#71658C]">
                  days recorded
                </span>
              </div>
            </div>

            {/* Action / Link */}
            <div className="flex items-center justify-start md:justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-200/80 pt-3 md:pt-0 md:pl-4">
              {onOpenPulse && (
                <button
                  type="button"
                  onClick={onOpenPulse}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#D5CBE5] hover:bg-[#FAF8FD] text-[#2A2146] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkle weight="bold" className="w-3.5 h-3.5 text-[#1FB6B0]" />
                  <span>Weekly Pulse</span>
                </button>
              )}
              {onOpenJournal && (
                <button
                  type="button"
                  onClick={onOpenJournal}
                  className="px-3.5 py-1.5 rounded-full bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PencilSimpleLine weight="bold" className="w-3.5 h-3.5 text-[#E3B15E]" />
                  <span>Journal</span>
                </button>
              )}
            </div>
          </div>

          {/* Proportional Mood Spectrum Bar */}
          <div className="mt-4 pt-3 border-t border-gray-200/70">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#6E6386] mb-1.5">
              <span>Monthly Emotional Spectrum</span>
              <span>{monthlyStats.loggedDays} days mapped</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200/70 overflow-hidden flex shadow-inner">
              {MOODS.map(m => {
                const count = monthlyStats.moodCounts[m.id] || 0;
                if (count === 0) return null;
                const pct = (count / Math.max(1, monthlyStats.loggedDays)) * 100;
                return (
                  <div
                    key={m.id}
                    title={`${m.label}: ${count} days (${Math.round(pct)}%)`}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: m.color,
                    }}
                    className="h-full transition-all duration-300 hover:brightness-110 hover:scale-y-110"
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* INTERACTIVE MOOD FILTER CHIPS */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-[#71658A] mr-1">
            Filter by Mood:
          </span>
          <button
            id="mood-filter-all"
            type="button"
            onClick={() => setActiveMoodFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeMoodFilter === null
                ? 'bg-[#2A2146] text-white shadow-xs'
                : 'bg-gray-100 text-[#554C6C] hover:bg-gray-200/70'
            }`}
          >
            All Days ({monthlyStats.totalDays})
          </button>
          {MOODS.map(m => {
            const count = monthlyStats.moodCounts[m.id] || 0;
            const isSelected = activeMoodFilter === m.id;
            const theme = MOOD_THEMES[m.id];
            return (
              <button
                key={m.id}
                id={`mood-filter-${m.id}`}
                type="button"
                onClick={() => setActiveMoodFilter(isSelected ? null : m.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? `${theme.badge} ring-2 ring-offset-1 shadow-xs ${theme.border}`
                    : 'bg-white border-gray-200 text-[#4C4362] hover:bg-gray-50'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 font-semibold">
                  {count}
                </span>
              </button>
            );
          })}
          {activeMoodFilter && (
            <button
              type="button"
              onClick={() => setActiveMoodFilter(null)}
              className="text-xs text-[#1FB6B0] hover:underline font-bold ml-1"
            >
              Clear filter ✕
            </button>
          )}
        </div>

        {/* DAY OF WEEK COLUMN HEADERS */}
        <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <span key={day} className="text-xs font-bold uppercase tracking-wider text-[#8A7E9F] py-1">
              {day}
            </span>
          ))}
        </div>

        {/* 7-COLUMN MONTHLY HEATMAP MATRIX TILES */}
        <div
          key={`${viewDate.getFullYear()}-${viewDate.getMonth()}-${displayMode}`}
          className="mt-2 grid grid-cols-7 gap-2 sm:gap-3"
        >
          {calendarDays.map((cell, cellIdx) => {
            const rec = cell.record;
            const moodId = rec?.mood;
            const intensity = rec?.intensity || 0;
            const isSabbath = Boolean(rec?.isSabbathRest);
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.isToday;

            // Check if filter dims this tile
            const matchesFilter = activeMoodFilter === null || moodId === activeMoodFilter;

            // Mood Visuals
            const moodObj = moodId ? MOODS.find(m => m.id === moodId) : null;

            // Staggered entry delay
            const entryDelayMs = Math.min(cellIdx * 12, 400);

            // Compute Tile Styling based on displayMode (Mood Heatmap vs Practice Intensity)
            let tileClass = '';
            let tileBorder = '';
            let tileGlow = '';

            if (displayMode === 'mood') {
              if (isSabbath) {
                tileClass =
                  'bg-gradient-to-br from-[#F6F3FC] via-[#EEFAF8] to-[#FFF9F0] text-[#36275C] font-bold shadow-xs';
                tileBorder = 'border-[#BCAFE0] hover:border-[#8E7BB7]';
                tileGlow = 'hover:shadow-[0_12px_24px_-4px_rgba(142,123,183,0.4)]';
              } else if (moodId && MOOD_THEMES[moodId]) {
                const mt = MOOD_THEMES[moodId];
                tileClass = `${mt.bg} ${mt.text} font-semibold`;
                tileBorder = `${mt.border}`;
                tileGlow = `hover:shadow-[0_12px_22px_-4px_${mt.glow}]`;
              } else if (intensity > 0) {
                tileClass = 'bg-[#F2FAF9] text-[#0C615D] font-semibold';
                tileBorder = 'border-[#A6E8E4]';
                tileGlow = 'hover:shadow-md';
              } else {
                tileClass = 'bg-[#FAF8F5] text-gray-400';
                tileBorder = 'border-gray-200/80 hover:border-[#1FB6B0]/50';
                tileGlow = 'hover:shadow-sm';
              }
            } else {
              // Practice Intensity mode
              if (isSabbath) {
                tileClass =
                  'bg-gradient-to-br from-[#F6F3FC] via-[#EEFAF8] to-[#FFF9F0] text-[#36275C] font-bold shadow-xs';
                tileBorder = 'border-[#BCAFE0]';
                tileGlow = 'hover:shadow-[0_12px_24px_-4px_rgba(142,123,183,0.4)]';
              } else if (intensity === 1) {
                tileClass = 'bg-[#C5EFEA] text-[#0C615D] font-semibold';
                tileBorder = 'border-[#81DBD5]';
                tileGlow = 'hover:shadow-[0_10px_20px_-4px_rgba(31,182,176,0.38)]';
              } else if (intensity === 2) {
                tileClass = 'bg-[#5CD2CC] text-[#084845] font-semibold';
                tileBorder = 'border-[#2EB2AB]';
                tileGlow = 'hover:shadow-[0_12px_24px_-4px_rgba(31,182,176,0.52)]';
              } else if (intensity === 3) {
                tileClass = 'bg-[#1FB6B0] text-white font-bold';
                tileBorder = 'border-[#16948F]';
                tileGlow = 'hover:shadow-[0_14px_28px_-3px_rgba(22,148,143,0.62)]';
              } else if (intensity === 4) {
                tileClass = 'bg-gradient-to-br from-[#E3B15E] via-[#F28C38] to-[#1FB6B0] text-white font-bold shadow-md';
                tileBorder = 'border-[#E3B15E]';
                tileGlow = 'hover:shadow-[0_16px_32px_-3px_rgba(242,140,56,0.68)]';
              } else {
                tileClass = 'bg-[#FAF8F5] text-gray-400';
                tileBorder = 'border-gray-200';
                tileGlow = 'hover:shadow-sm';
              }
            }

            return (
              <button
                key={cell.dateStr}
                id={`mood-heatmap-tile-${cell.dateStr}`}
                type="button"
                style={{ animationDelay: `${entryDelayMs}ms` }}
                onClick={() => onSelectDate(cell.dateStr)}
                title={`${cell.dateStr} · ${
                  moodObj ? `Primary Mood: ${moodObj.emoji} ${moodObj.label}` : 'No mood logged'
                }${isSabbath ? ' · Sabbath Rest' : ''}${intensity > 0 ? ` · ${intensity}/4 practices completed` : ''}`}
                className={`calendar-tile-entry group relative flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border transition-all duration-200 ease-out min-h-[72px] sm:min-h-[90px] text-left overflow-hidden cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FB6B0] ${tileClass} ${tileBorder} ${tileGlow} ${
                  !cell.isCurrentMonth
                    ? 'opacity-30 hover:opacity-80'
                    : matchesFilter
                    ? 'opacity-100'
                    : 'opacity-25 blur-[0.4px] hover:opacity-80 hover:blur-none'
                } ${
                  isSelected
                    ? 'ring-3 ring-[#2A2146] ring-offset-2 scale-[1.05] -translate-y-1 z-20 shadow-xl'
                    : 'hover:scale-[1.06] hover:-translate-y-1.5 hover:z-10'
                }`}
              >
                {/* Subtle Sheen Highlight on Hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />

                {/* Top Row: Day Number & Indicators (Today, Sabbath, Streak) */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-serif transition-transform duration-200 group-hover:scale-110 ${
                      isToday
                        ? 'px-1.5 py-0.5 rounded-md bg-[#2A2146] text-white font-sans font-bold text-[10px] shadow-xs'
                        : ''
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  <div className="flex items-center gap-1">
                    {isSabbath && (
                      <span
                        title="Holy Sabbath Rest Day"
                        className="text-xs select-none drop-shadow-xs"
                      >
                        🕊️
                      </span>
                    )}
                    {cell.isPartOfActiveStreak && intensity > 0 && !isSabbath && (
                      <span
                        title="Active continuous streak"
                        className="text-[11px] select-none transform group-hover:scale-125 transition-transform"
                      >
                        🔥
                      </span>
                    )}
                  </div>
                </div>

                {/* Center / Mood Highlight: Primary Mood Emoji & Label */}
                <div className="relative z-10 flex items-center justify-between w-full my-auto py-0.5">
                  {moodObj ? (
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span
                        className="text-base sm:text-lg select-none transform transition-transform duration-200 group-hover:scale-125 drop-shadow-xs shrink-0"
                        title={moodObj.label}
                      >
                        {moodObj.emoji}
                      </span>
                      <span className="hidden sm:inline-block text-[10px] font-bold truncate tracking-tight opacity-90">
                        {moodObj.label}
                      </span>
                    </div>
                  ) : isSabbath ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#735DA3] bg-[#735DA3]/15 px-1.5 py-0.5 rounded-md">
                      Sabbath
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-300 font-serif italic group-hover:text-[#1FB6B0]">
                      -
                    </span>
                  )}
                </div>

                {/* Bottom Row: Devotional Practice Dots (Scripture, Prayer, Stillness, Journal) */}
                <div className="relative z-10 flex items-center justify-between w-full pt-1 border-t border-black/5">
                  <div className="flex items-center gap-0.5" title="Devotional practices completed">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        rec?.scriptureRead ? 'bg-[#E3B15E]' : 'bg-black/10'
                      }`}
                      title="Scripture"
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        rec?.prayerCompleted ? 'bg-[#37C6C2]' : 'bg-black/10'
                      }`}
                      title="Prayer"
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        rec?.stillnessPractice ? 'bg-[#7B62B8]' : 'bg-black/10'
                      }`}
                      title="Stillness"
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        rec?.journalWritten ? 'bg-[#1FB6B0]' : 'bg-black/10'
                      }`}
                      title="Journal"
                    />
                  </div>

                  {rec && (rec.intensity > 0 || isSabbath) && (
                    <span className="text-[9px] font-mono font-semibold opacity-70">
                      {isSabbath ? 'REST' : `${intensity}/4`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* HEATMAP LEGEND: MOOD COLORS & HABIT DOTS */}
        <div className="mt-7 pt-5 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          {/* Mood Color-Coding Legend */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#706782]">Primary Moods:</span>
            {MOODS.map(m => {
              const theme = MOOD_THEMES[m.id];
              return (
                <div
                  key={m.id}
                  title={`${m.label}: ${m.desc}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold cursor-default ${theme.bg} ${theme.border} ${theme.text}`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </div>
              );
            })}

            {/* Sabbath Resting Badge */}
            <div
              title="Sabbath Rest: Grace-shielded streak with spiritual peace"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F6F3FC] to-[#FFF9F0] border border-[#BCAFE0] text-[#36275C] text-[11px] font-bold"
            >
              <span>🕊️</span>
              <span>Sabbath</span>
            </div>
          </div>

          {/* Devotional practice indicator dots guide */}
          <div className="flex items-center gap-3 text-[#706782] text-[11px]">
            <span className="font-semibold">Practice dots:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E3B15E]" /> Word
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#37C6C2]" /> Prayer
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7B62B8]" /> Stillness
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1FB6B0]" /> Journal
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE DAY EMOTIONAL SNAPSHOT CARD */}
      <section
        id="selected-day-emotional-snapshot"
        className="rounded-3xl bg-[#201A39] text-white p-6 sm:p-8 shadow-xl border border-white/10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Column 1: Date & Primary Mood State */}
          <div className="lg:col-span-1 space-y-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#37C6C2]">
                Day Emotional Snapshot
              </span>
              {selectedDateStr === todayStr && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#1FB6B0]/20 text-[#37C6C2] font-bold text-[10px] border border-[#1FB6B0]/30">
                  Today
                </span>
              )}
            </div>

            <div>
              <h4 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h4>
              <p className="text-xs text-[#C2B7D9] mt-1">
                {currentRecord.isSabbathRest
                  ? '🕊️ Consecrated Sabbath Rest Day: shielded by grace'
                  : currentRecord.intensity > 0
                  ? `Devotional engagement: ${currentRecord.intensity} of 4 practices completed`
                  : 'Rest day or awaiting spiritual check-in'}
              </p>
            </div>

            {/* Current Primary Mood Banner */}
            <div
              className="p-4 rounded-2xl border transition-all"
              style={{
                backgroundColor: `${selectedMoodTheme.hex}18`,
                borderColor: `${selectedMoodTheme.hex}50`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{selectedMoodItem?.emoji || '🕊'}</span>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                      Primary Mood
                    </span>
                    <h5 className="text-lg font-bold capitalize text-white">
                      {selectedMoodItem?.label || 'Unlogged / Resting'}
                    </h5>
                  </div>
                </div>
                {selectedMoodItem && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                    style={{
                      backgroundColor: `${selectedMoodTheme.hex}30`,
                      borderColor: selectedMoodTheme.hex,
                      color: '#FFFFFF',
                    }}
                  >
                    Level {selectedMoodItem.level} / 6
                  </span>
                )}
              </div>
              <p className="text-xs text-[#E3DCF2] mt-2.5 leading-relaxed">
                {selectedMoodTheme.reflection}
              </p>
            </div>

            {/* Scripture Anchor for this Emotional State */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E3B15E]">
                Anchor Scripture · {selectedMoodTheme.scriptureRef}
              </span>
              <p className="text-xs italic text-[#EBE6F5] mt-1.5 leading-relaxed font-serif">
                “{selectedMoodTheme.scriptureText}”
              </p>
            </div>
          </div>

          {/* Column 2: Direct Mood Assignment & Habit Logger */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Mood Assignment Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5BCD8]">
                  Set or Update Primary Mood for this Day:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#A699BF]">
                    Tap to record heart posture
                  </span>
                  {onOpenNotificationSettings && (
                    <button
                      type="button"
                      id="day-detail-set-reminder-btn"
                      onClick={onOpenNotificationSettings}
                      className="text-[11px] font-semibold text-[#37C6C2] hover:text-white underline flex items-center gap-1 cursor-pointer"
                      title="Set daily reminder notification time"
                    >
                      <span>🔔</span>
                      <span>Set Reminder</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {MOODS.map(m => {
                  const isCur = currentRecord.mood === m.id;
                  const theme = MOOD_THEMES[m.id];
                  return (
                    <button
                      key={m.id}
                      id={`set-mood-btn-${m.id}`}
                      type="button"
                      onClick={() => handleSetMood(m.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all active:scale-95 ${
                        isCur
                          ? 'ring-2 ring-white border-transparent scale-105 shadow-md'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      style={{
                        backgroundColor: isCur ? theme.hex : undefined,
                        color: isCur ? '#17122B' : '#FFFFFF',
                      }}
                    >
                      <span className="text-xl select-none">{m.emoji}</span>
                      <span className="text-[11px] font-bold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Practices Checklist & Toggle */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5BCD8]">
                  Devotional Practices on this Day:
                </span>
                <span className="text-xs font-semibold text-[#37C6C2]">
                  {currentRecord.intensity} of 4 Completed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Practice 1: Scripture */}
                <button
                  type="button"
                  id="toggle-practice-scripture"
                  onClick={() => handleTogglePractice('scriptureRead')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[72px] active:scale-95 cursor-pointer ${
                    currentRecord.scriptureRead
                      ? 'bg-[#E3B15E]/20 border-[#E3B15E] text-[#FFF6E5]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <BookOpen weight="bold" className="w-5 h-5 text-[#E3B15E]" />
                    <span className="text-xs font-bold">
                      {currentRecord.scriptureRead ? <Check weight="bold" className="w-3.5 h-3.5" /> : <Plus weight="bold" className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Scripture</div>
                    <div className="text-[10px] opacity-75">Daily Passage</div>
                  </div>
                </button>

                {/* Practice 2: Prayer */}
                <button
                  type="button"
                  id="toggle-practice-prayer"
                  onClick={() => handleTogglePractice('prayerCompleted')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[72px] active:scale-95 cursor-pointer ${
                    currentRecord.prayerCompleted
                      ? 'bg-[#37C6C2]/20 border-[#37C6C2] text-[#DCFAF9]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <HandsPraying weight="bold" className="w-5 h-5 text-[#37C6C2]" />
                    <span className="text-xs font-bold">
                      {currentRecord.prayerCompleted ? <Check weight="bold" className="w-3.5 h-3.5" /> : <Plus weight="bold" className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Prayer</div>
                    <div className="text-[10px] opacity-75">Conversation</div>
                  </div>
                </button>

                {/* Practice 3: Stillness */}
                <button
                  type="button"
                  id="toggle-practice-stillness"
                  onClick={() => handleTogglePractice('stillnessPractice')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[72px] active:scale-95 cursor-pointer ${
                    currentRecord.stillnessPractice
                      ? 'bg-[#7B62B8]/25 border-[#9A82D4] text-[#EFEAF9]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Sparkle weight="bold" className="w-5 h-5 text-[#9A82D4]" />
                    <span className="text-xs font-bold">
                      {currentRecord.stillnessPractice ? <Check weight="bold" className="w-3.5 h-3.5" /> : <Plus weight="bold" className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Stillness</div>
                    <div className="text-[10px] opacity-75">Abiding Peace</div>
                  </div>
                </button>

                {/* Practice 4: Journal */}
                <button
                  type="button"
                  id="toggle-practice-journal"
                  onClick={() => handleTogglePractice('journalWritten')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[72px] active:scale-95 cursor-pointer ${
                    currentRecord.journalWritten
                      ? 'bg-[#1FB6B0]/25 border-[#1FB6B0] text-[#D4F7F5]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <PencilSimpleLine weight="bold" className="w-5 h-5 text-[#1FB6B0]" />
                    <span className="text-xs font-bold">
                      {currentRecord.journalWritten ? <Check weight="bold" className="w-3.5 h-3.5" /> : <Plus weight="bold" className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Journal</div>
                    <div className="text-[10px] opacity-75">Written Word</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Reflection Quote Snippet if present */}
            {currentRecord.reflectionSnippet && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <ChatCircleDots weight="bold" className="w-5 h-5 text-[#37C6C2] shrink-0" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#37C6C2]">
                    Recorded Reflection
                  </span>
                  <p className="text-xs text-[#ECE6F7] mt-0.5 italic">
                    “{currentRecord.reflectionSnippet}”
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
