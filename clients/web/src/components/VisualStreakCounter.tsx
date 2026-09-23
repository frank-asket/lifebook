'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Sparkle, Check } from '@phosphor-icons/react';
import { useDevotionalStreak, type StreakData } from '../lib/streak-utils';
import type { DayActivityRecord } from './ProgressScreen';

export interface VisualStreakCounterProps {
  variant?: 'compact' | 'card' | 'profile' | 'hero';
  streakData?: StreakData;
  records?: Record<string, DayActivityRecord>;
  className?: string;
  showWeeklyDots?: boolean;
  showMilestoneProgress?: boolean;
  onClick?: () => void;
  ctaHref?: string;
  ctaText?: string;
}

export function VisualStreakCounter({
  variant = 'card',
  streakData: providedStreakData,
  records,
  className = '',
  showWeeklyDots = true,
  showMilestoneProgress = true,
  onClick,
  ctaHref,
  ctaText,
}: VisualStreakCounterProps) {
  const hookStreakData = useDevotionalStreak(records);
  const data = providedStreakData || hookStreakData;
  const { currentStreak, longestStreak, todayActive, last7Days, streakTier, nextMilestone } = data;

  // 1. Compact Variant (for Navbar, User Profile Pill, or Small Badges)
  if (variant === 'compact') {
    return (
      <div
        id="visual-streak-counter-compact"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
          todayActive
            ? 'bg-gradient-to-r from-[#FFF5E6] to-[#FFEBD0] border border-[#F2C485] text-[#915B06] shadow-2xs'
            : currentStreak > 0
            ? 'bg-[#FAF8FC] border border-[#EADBFC] text-[#554770]'
            : 'bg-gray-100 border border-gray-200 text-gray-500'
        } ${className}`}
        title={`Consecutive practice streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}${
          todayActive ? ' (Practiced Today ✓)' : ' (Awaiting today’s practice)'
        }`}
      >
        <span
          className={`inline-block transition-transform ${
            currentStreak > 0 ? 'scale-110 animate-pulse text-[#e8ba6a]' : 'opacity-60 text-emerald-600'
          }`}
        >
          {currentStreak > 0 ? (
            <Flame weight="fill" className="w-3.5 h-3.5" />
          ) : (
            <Sparkle weight="fill" className="w-3.5 h-3.5" />
          )}
        </span>
        <span className="font-mono font-extrabold text-[13px]">{currentStreak}</span>
        <span className="text-[10px] tracking-tight uppercase opacity-80">
          {currentStreak === 1 ? 'day' : 'days'}
        </span>
        {todayActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
        )}
      </div>
    );
  }

  // 2. Profile Variant (for User Profile card or User Menu Popover)
  if (variant === 'profile') {
    return (
      <div
        id="visual-streak-counter-profile"
        className={`rounded-2xl bg-gradient-to-br from-[#271E44] to-[#18132C] text-white p-4 sm:p-5 border border-white/10 shadow-lg relative overflow-hidden ${className}`}
      >
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[#E3B15E]/15 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F28C38] via-[#E3B15E] to-[#1FB6B0] flex items-center justify-center text-white shadow-md shrink-0">
              <Flame weight="fill" className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#37C6C2]">
                  Consecutive Practice
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  todayActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {todayActive ? 'Today Done ✓' : 'Awaiting Today'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-serif font-extrabold text-white">
                  {currentStreak}
                </span>
                <span className="text-xs text-[#D8CFEB] font-medium">
                  {currentStreak === 1 ? 'Day of Devotion' : 'Consecutive Days'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right hidden xs:block">
            <span className="text-[10px] text-[#A69BBF] block uppercase font-semibold">Best Record</span>
            <span className="text-sm font-bold font-serif text-[#E3B15E]">
              {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* 7-Day Consistency Track */}
        {showWeeklyDots && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-[#A69BBF] mb-2 font-medium">
              <span>Past 7 Days Rhythm</span>
              <span>
                {last7Days.filter(d => d.active).length} of 7 Days Active
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {last7Days.map(day => (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center py-1.5 rounded-lg text-center transition-all ${
                    day.active
                      ? 'bg-[#1FB6B0]/25 text-white border border-[#1FB6B0]/40'
                      : day.isToday
                      ? 'bg-white/10 text-white/90 border border-white/25 border-dashed'
                      : 'bg-white/5 text-white/40 border border-white/5'
                  }`}
                  title={`${day.dateStr}: ${day.active ? 'Devotion Recorded' : 'No Practice Recorded'}`}
                >
                  <span className="text-[9px] uppercase font-semibold tracking-wider opacity-80">
                    {day.dayLabel}
                  </span>
                  <span className="text-xs font-bold mt-0.5">
                    {day.active ? '✓' : day.isToday ? '•' : '–'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Hero Variant (for Home Screen Hero or Practice Showcase)
  if (variant === 'hero') {
    return (
      <div
        id="visual-streak-counter-hero"
        className={`w-full rounded-3xl bg-[#211b3b] text-[#fbf7f0] p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden ${className}`}
      >
        {/* Subtle Brand Orbit and Ambient Disc (matching landing page showcase style) */}
        <div className="pointer-events-none absolute -right-24 -bottom-48 w-[420px] h-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-12 -bottom-36 w-[320px] h-[320px] rounded-full border border-white/5" />
        <div className="pointer-events-none absolute top-0 right-1/3 w-64 h-64 rounded-full bg-[#e8ba6a]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Animated Flame Icon */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#e8ba6a] to-[#d18779] flex items-center justify-center text-white shadow-lg">
                <Flame weight="fill" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              {todayActive && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#66c8bb] border-2 border-[#211b3b] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  <Check weight="bold" className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e8ba6a]">
                  Daily Devotional Walk
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15"
                >
                  {streakTier.badgeIcon} {streakTier.title}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    todayActive
                      ? 'bg-[#66c8bb]/20 text-[#66c8bb] border border-[#66c8bb]/40'
                      : 'bg-[#e8ba6a]/20 text-[#e8ba6a] border border-[#e8ba6a]/40'
                  }`}
                >
                  {todayActive ? 'Today’s Devotion Complete ✓' : 'Today Awaiting Devotion'}
                </span>
              </div>

              <div className="mt-1 flex items-baseline gap-3">
                <h3 className="text-3xl sm:text-4xl font-serif font-normal text-white tracking-tight">
                  {currentStreak} {currentStreak === 1 ? 'Consecutive Day' : 'Consecutive Days'}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-white/75 mt-1 max-w-xl font-normal leading-relaxed">
                {currentStreak > 0
                  ? todayActive
                    ? `Praise God! You have maintained your steady spiritual rhythm today. Keep abiding in His presence.`
                    : `You’re currently on a ${currentStreak}-day unbroken walk. Take 5 quiet minutes today to sustain your streak.`
                  : `Begin your daily practice today with 5 minutes of Scripture and stillness before God.`}
              </p>
            </div>
          </div>

          {/* Right Section: Weekly Mini Track & CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0">
            {showWeeklyDots && (
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/12 w-full sm:w-auto">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e8ba6a] mb-2 flex items-center justify-between gap-3">
                  <span>Last 7 Days</span>
                  <span className="font-mono text-white/90">
                    {last7Days.filter(d => d.active).length}/7 Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {last7Days.map(day => (
                    <div
                      key={day.dateStr}
                      className={`w-7 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all ${
                        day.active
                          ? 'bg-[#66c8bb] text-[#17132c] font-bold shadow-xs'
                          : day.isToday
                          ? 'bg-white/20 text-white border border-white/40 border-dashed font-bold'
                          : 'bg-white/5 text-white/40'
                      }`}
                      title={`${day.dateStr}: ${day.active ? 'Practiced' : 'Unlogged'}`}
                    >
                      <span className="text-[8px] uppercase opacity-75">{day.dayLabel[0]}</span>
                      <span>{day.active ? '✓' : day.isToday ? '•' : '–'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ctaHref ? (
              <Link
                href={ctaHref}
                id="visual-streak-hero-cta"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 rounded-full bg-[#fbfaf7] text-[#17151a] hover:bg-white text-xs font-bold transition-all shadow-md cursor-pointer hover:-translate-y-0.5"
              >
                <span>{ctaText || (todayActive ? 'View Devotional Progress' : 'Start 5-Minute Devotion')}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ) : onClick ? (
              <button
                type="button"
                id="visual-streak-hero-btn"
                onClick={onClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 rounded-full bg-[#fbfaf7] text-[#17151a] hover:bg-white text-xs font-bold transition-all shadow-md cursor-pointer hover:-translate-y-0.5"
              >
                <span>{ctaText || (todayActive ? 'View Devotional Progress' : 'Start 5-Minute Devotion')}</span>
                <span aria-hidden="true">↗</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Milestone Bar */}
        {showMilestoneProgress && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-base">{nextMilestone.icon}</span>
              <span>
                Next Milestone: <strong className="text-white font-medium">{nextMilestone.title}</strong> ({nextMilestone.targetDays} Days)
              </span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-64">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#66c8bb] to-[#e8ba6a] rounded-full transition-all duration-500"
                  style={{ width: `${nextMilestone.progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#e8ba6a] font-bold shrink-0">
                {nextMilestone.daysLeft === 0 ? 'Reached!' : `${nextMilestone.daysLeft}d left`}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Card Variant (Default Standard Widget)
  return (
    <div
      id="visual-streak-counter-card"
      className={`rounded-3xl bg-white border border-[#EADBFC] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F28C38] to-[#E3B15E] flex items-center justify-center text-white shadow-xs shrink-0">
            <Flame weight="fill" className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A6999]">
              Consecutive Practice
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#2A2146]">
                {currentStreak}
              </span>
              <span className="text-xs text-[#7A6999] font-medium">
                {currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              todayActive
                ? 'bg-[#E7F8F7] text-[#0E7A75] border border-[#A1E3DF]'
                : 'bg-[#FFF6E7] text-[#8C5E0D] border border-[#F2D7A5]'
            }`}
          >
            {todayActive ? 'Logged Today ✓' : 'Pending Today'}
          </span>
          <span className="text-[11px] text-[#8C7E9F]">
            Best: <strong className="text-[#2A2146]">{longestStreak}d</strong>
          </span>
        </div>
      </div>

      {/* 7-Day Visual Row */}
      {showWeeklyDots && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-[11px] text-[#7A6999] mb-2 font-medium">
            <span>7-Day Cadence</span>
            <span className="text-xs text-[#0E7A75] font-semibold">
              {last7Days.filter(d => d.active).length}/7 Days
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {last7Days.map(d => (
              <div
                key={d.dateStr}
                className={`py-1 rounded-lg text-center transition-all ${
                  d.active
                    ? 'bg-[#1FB6B0] text-white font-bold'
                    : d.isToday
                    ? 'bg-gray-100 border border-dashed border-[#7A6999] text-[#2A2146]'
                    : 'bg-[#FAF8FC] text-gray-400'
                }`}
              >
                <span className="text-[9px] uppercase block opacity-80">{d.dayLabel[0]}</span>
                <span className="text-[11px]">{d.active ? '✓' : d.isToday ? '•' : '–'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
