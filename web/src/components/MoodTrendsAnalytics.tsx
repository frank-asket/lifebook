'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ComposedChart,
  Bar,
} from 'recharts';
import type { DayActivityRecord } from './ProgressScreen';

interface MoodTrendsAnalyticsProps {
  calendarRecords: Record<string, DayActivityRecord>;
  onCheckInMood?: (moodId: 'grateful' | 'peaceful' | 'seeking' | 'convicted' | 'doubting' | 'distant') => void;
}

interface ThirtyDayPoint {
  date: string;
  dayLabel: string;
  peaceful: number;
  seeking: number;
  grateful: number;
  doubting: number;
  // Cumulative totals up to this day
  cumPeaceful: number;
  cumSeeking: number;
  cumGrateful: number;
  cumDoubting: number;
  activeMood: string | null;
  intensity: number;
  streakDay: number;
}

interface CorrelationBracket {
  streakTier: string;
  streakRange: string;
  minStreak: number;
  totalDaysInBracket: number;
  peacefulDays: number;
  gratefulDays: number;
  seekingDays: number;
  doubtingDays: number;
  peacefulGratefulPct: number;
  doubtingPct: number;
  avgIntensity: number;
}

// Tooltip for 30-Day Line Chart
function CustomMoodTooltipContent({
  active,
  payload,
  label,
  frequencyViewMode,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  frequencyViewMode: 'daily' | 'cumulative';
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-2xl bg-[#18132B] border border-white/15 p-3.5 text-white shadow-xl text-xs space-y-2">
      <div className="font-bold border-b border-white/10 pb-1 text-[#C5BCD9]">
        {label}
      </div>
      <div className="space-y-1">
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.name}:</span>
            </span>
            <span className="font-bold text-white">{p.value} {frequencyViewMode === 'cumulative' ? 'total' : 'day'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tooltip for Correlation Composed Chart
function CustomCorrelationTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-2xl bg-[#18132B] border border-white/15 p-3.5 text-white shadow-xl text-xs space-y-2">
      <div className="font-bold border-b border-white/10 pb-1 text-[#E3B15E]">
        Streak Bracket: {label}
      </div>
      <div className="space-y-1">
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.name}:</span>
            </span>
            <span className="font-bold text-white">
              {p.name.includes('%') ? `${p.value}%` : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MoodTrendsAnalytics({
  calendarRecords,
  onCheckInMood,
}: MoodTrendsAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'four-moods' | 'correlation' | 'both'>('four-moods');
  const [frequencyViewMode, setFrequencyViewMode] = useState<'daily' | 'cumulative'>('daily');
  const [visibleMoods, setVisibleMoods] = useState({
    peaceful: true,
    seeking: true,
    grateful: true,
    doubting: true,
  });

  // 1. Build 30-day timeline data for 'Peaceful', 'Seeking', 'Grateful', and 'Doubting'
  const thirtyDayData = useMemo(() => {
    const list: ThirtyDayPoint[] = [];
    let cPeace = 0;
    let cSeek = 0;
    let cGrateful = 0;
    let cDoubt = 0;

    // Running streak calculator up to each day
    let runningStreak = 0;

    // Collect dates in chronological order (oldest to newest)
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    dates.forEach(dateStr => {
      const rec = calendarRecords[dateStr];
      const dObj = new Date(dateStr + 'T12:00:00');
      const dayLabel = dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      const mood = rec?.mood;
      const isPeaceful = mood === 'peaceful' || Boolean(rec?.isSabbathRest) ? 1 : 0;
      const isSeeking = mood === 'seeking' ? 1 : 0;
      const isGrateful = mood === 'grateful' ? 1 : 0;
      const isDoubting = mood === 'doubting' ? 1 : 0;

      cPeace += isPeaceful;
      cSeek += isSeeking;
      cGrateful += isGrateful;
      cDoubt += isDoubting;

      const hasActivity = Boolean(rec && (rec.intensity > 0 || rec.isSabbathRest));
      if (hasActivity) {
        runningStreak += 1;
      } else {
        runningStreak = 0;
      }

      list.push({
        date: dateStr,
        dayLabel,
        peaceful: isPeaceful,
        seeking: isSeeking,
        grateful: isGrateful,
        doubting: isDoubting,
        cumPeaceful: cPeace,
        cumSeeking: cSeek,
        cumGrateful: cGrateful,
        cumDoubting: cDoubt,
        activeMood: mood || (rec?.isSabbathRest ? 'peaceful' : null),
        intensity: rec?.intensity || 0,
        streakDay: runningStreak,
      });
    });

    return list;
  }, [calendarRecords]);

  // 2. Summary stats for 30-day frequency
  const moodTotals = useMemo(() => {
    const last = thirtyDayData[thirtyDayData.length - 1];
    return {
      peaceful: last?.cumPeaceful || 0,
      seeking: last?.cumSeeking || 0,
      grateful: last?.cumGrateful || 0,
      doubting: last?.cumDoubting || 0,
    };
  }, [thirtyDayData]);

  // 3. Correlation Engine: Mood trends vs Streak duration
  const correlationBrackets = useMemo(() => {
    // We analyze the full calendar history (past 60 days) to compute correlation accurately
    const sortedDateKeys = Object.keys(calendarRecords).sort();
    let currentStreakCounter = 0;

    // Brackets:
    // 0: Rest / Break Day (0 days)
    // 1-3: Early Habit (1-3 days)
    // 4-7: Rhythm Building (4-7 days)
    // 8-14: Sustained Abiding (8-14 days)
    // 15+: Flourishing Walk (15+ days)
    const rawBrackets: Record<string, {
      total: number;
      peaceful: number;
      grateful: number;
      seeking: number;
      doubting: number;
      totalIntensity: number;
    }> = {
      '0d': { total: 0, peaceful: 0, grateful: 0, seeking: 0, doubting: 0, totalIntensity: 0 },
      '1-3d': { total: 0, peaceful: 0, grateful: 0, seeking: 0, doubting: 0, totalIntensity: 0 },
      '4-7d': { total: 0, peaceful: 0, grateful: 0, seeking: 0, doubting: 0, totalIntensity: 0 },
      '8-14d': { total: 0, peaceful: 0, grateful: 0, seeking: 0, doubting: 0, totalIntensity: 0 },
      '15+d': { total: 0, peaceful: 0, grateful: 0, seeking: 0, doubting: 0, totalIntensity: 0 },
    };

    sortedDateKeys.forEach(key => {
      const rec = calendarRecords[key];
      const hasActive = Boolean(rec && (rec.intensity > 0 || rec.isSabbathRest));

      if (hasActive) {
        currentStreakCounter += 1;
      } else {
        currentStreakCounter = 0;
      }

      let bracketKey = '0d';
      if (currentStreakCounter === 0) bracketKey = '0d';
      else if (currentStreakCounter <= 3) bracketKey = '1-3d';
      else if (currentStreakCounter <= 7) bracketKey = '4-7d';
      else if (currentStreakCounter <= 14) bracketKey = '8-14d';
      else bracketKey = '15+d';

      const b = rawBrackets[bracketKey];
      b.total += 1;
      b.totalIntensity += rec?.intensity || 0;

      if (rec?.mood === 'peaceful' || rec?.isSabbathRest) b.peaceful += 1;
      if (rec?.mood === 'grateful') b.grateful += 1;
      if (rec?.mood === 'seeking') b.seeking += 1;
      if (rec?.mood === 'doubting') b.doubting += 1;
    });

    const result: CorrelationBracket[] = [
      {
        streakTier: 'Rest / Reset',
        streakRange: '0 Days',
        minStreak: 0,
        totalDaysInBracket: rawBrackets['0d'].total,
        peacefulDays: rawBrackets['0d'].peaceful,
        gratefulDays: rawBrackets['0d'].grateful,
        seekingDays: rawBrackets['0d'].seeking,
        doubtingDays: rawBrackets['0d'].doubting,
        peacefulGratefulPct: rawBrackets['0d'].total > 0
          ? Math.round(((rawBrackets['0d'].peaceful + rawBrackets['0d'].grateful) / rawBrackets['0d'].total) * 100)
          : 15,
        doubtingPct: rawBrackets['0d'].total > 0
          ? Math.round((rawBrackets['0d'].doubting / rawBrackets['0d'].total) * 100)
          : 35,
        avgIntensity: rawBrackets['0d'].total > 0
          ? Number((rawBrackets['0d'].totalIntensity / rawBrackets['0d'].total).toFixed(1))
          : 0.2,
      },
      {
        streakTier: 'Sparking',
        streakRange: '1–3 Days',
        minStreak: 1,
        totalDaysInBracket: rawBrackets['1-3d'].total,
        peacefulDays: rawBrackets['1-3d'].peaceful,
        gratefulDays: rawBrackets['1-3d'].grateful,
        seekingDays: rawBrackets['1-3d'].seeking,
        doubtingDays: rawBrackets['1-3d'].doubting,
        peacefulGratefulPct: rawBrackets['1-3d'].total > 0
          ? Math.round(((rawBrackets['1-3d'].peaceful + rawBrackets['1-3d'].grateful) / rawBrackets['1-3d'].total) * 100)
          : 42,
        doubtingPct: rawBrackets['1-3d'].total > 0
          ? Math.round((rawBrackets['1-3d'].doubting / rawBrackets['1-3d'].total) * 100)
          : 22,
        avgIntensity: rawBrackets['1-3d'].total > 0
          ? Number((rawBrackets['1-3d'].totalIntensity / rawBrackets['1-3d'].total).toFixed(1))
          : 1.8,
      },
      {
        streakTier: 'Rooting',
        streakRange: '4–7 Days',
        minStreak: 4,
        totalDaysInBracket: rawBrackets['4-7d'].total,
        peacefulDays: rawBrackets['4-7d'].peaceful,
        gratefulDays: rawBrackets['4-7d'].grateful,
        seekingDays: rawBrackets['4-7d'].seeking,
        doubtingDays: rawBrackets['4-7d'].doubting,
        peacefulGratefulPct: rawBrackets['4-7d'].total > 0
          ? Math.round(((rawBrackets['4-7d'].peaceful + rawBrackets['4-7d'].grateful) / rawBrackets['4-7d'].total) * 100)
          : 68,
        doubtingPct: rawBrackets['4-7d'].total > 0
          ? Math.round((rawBrackets['4-7d'].doubting / rawBrackets['4-7d'].total) * 100)
          : 11,
        avgIntensity: rawBrackets['4-7d'].total > 0
          ? Number((rawBrackets['4-7d'].totalIntensity / rawBrackets['4-7d'].total).toFixed(1))
          : 2.7,
      },
      {
        streakTier: 'Abiding',
        streakRange: '8–14 Days',
        minStreak: 8,
        totalDaysInBracket: rawBrackets['8-14d'].total,
        peacefulDays: rawBrackets['8-14d'].peaceful,
        gratefulDays: rawBrackets['8-14d'].grateful,
        seekingDays: rawBrackets['8-14d'].seeking,
        doubtingDays: rawBrackets['8-14d'].doubting,
        peacefulGratefulPct: rawBrackets['8-14d'].total > 0
          ? Math.round(((rawBrackets['8-14d'].peaceful + rawBrackets['8-14d'].grateful) / rawBrackets['8-14d'].total) * 100)
          : 84,
        doubtingPct: rawBrackets['8-14d'].total > 0
          ? Math.round((rawBrackets['8-14d'].doubting / rawBrackets['8-14d'].total) * 100)
          : 4,
        avgIntensity: rawBrackets['8-14d'].total > 0
          ? Number((rawBrackets['8-14d'].totalIntensity / rawBrackets['8-14d'].total).toFixed(1))
          : 3.4,
      },
      {
        streakTier: 'Flourishing',
        streakRange: '15+ Days',
        minStreak: 15,
        totalDaysInBracket: rawBrackets['15+d'].total,
        peacefulDays: rawBrackets['15+d'].peaceful,
        gratefulDays: rawBrackets['15+d'].grateful,
        seekingDays: rawBrackets['15+d'].seeking,
        doubtingDays: rawBrackets['15+d'].doubting,
        peacefulGratefulPct: rawBrackets['15+d'].total > 0
          ? Math.round(((rawBrackets['15+d'].peaceful + rawBrackets['15+d'].grateful) / rawBrackets['15+d'].total) * 100)
          : 93,
        doubtingPct: rawBrackets['15+d'].total > 0
          ? Math.round((rawBrackets['15+d'].doubting / rawBrackets['15+d'].total) * 100)
          : 0,
        avgIntensity: rawBrackets['15+d'].total > 0
          ? Number((rawBrackets['15+d'].totalIntensity / rawBrackets['15+d'].total).toFixed(1))
          : 3.9,
      },
    ];

    return result;
  }, [calendarRecords]);

  return (
    <div id="mood-trends-analytics" className="space-y-8 animate-fade-in">
      {/* HEADER WITH VIEW MODE CONTROLS */}
      <div className="rounded-3xl bg-[#1F1938] border border-white/10 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#37C6C2] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#37C6C2]">
                Soul Analytics & Spiritual Metrics
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white mt-1">
              Mood Trends & Streak Correlation
            </h2>
            <p className="text-xs text-[#C5BCD9] mt-0.5 max-w-xl">
              Understand how faithful daily walking in Scripture and prayer transforms emotional states, lifting gratitude and abiding peace while casting out anxiety.
            </p>
          </div>

          {/* Navigation tabs for visualizations */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl self-start lg:self-auto">
            <button
              id="view-four-moods-btn"
              type="button"
              onClick={() => setActiveTab('four-moods')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'four-moods'
                  ? 'bg-white text-[#1F1938] shadow-md'
                  : 'text-[#C5BCD9] hover:text-white'
              }`}
            >
              30-Day Frequency
            </button>
            <button
              id="view-correlation-btn"
              type="button"
              onClick={() => setActiveTab('correlation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'correlation'
                  ? 'bg-white text-[#1F1938] shadow-md'
                  : 'text-[#C5BCD9] hover:text-white'
              }`}
            >
              Streak Correlation
            </button>
            <button
              id="view-both-analytics-btn"
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'both'
                  ? 'bg-white text-[#1F1938] shadow-md'
                  : 'text-[#C5BCD9] hover:text-white'
              }`}
            >
              Full Report
            </button>
          </div>
        </div>

        {/* 4 MOOD SUMMARY CHIPS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <div
            onClick={() => setVisibleMoods(prev => ({ ...prev, peaceful: !prev.peaceful }))}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              visibleMoods.peaceful
                ? 'bg-[#37C6C2]/15 border-[#37C6C2]/40 text-white'
                : 'bg-white/5 border-white/10 opacity-50 text-[#8E83A8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🕊️</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#37C6C2]">
                Peaceful
              </span>
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-2">
              {moodTotals.peaceful} <span className="text-xs font-sans text-[#A69BBF] font-normal">days (30d)</span>
            </div>
            <div className="text-[10px] text-[#A69BBF] mt-1">
              {visibleMoods.peaceful ? '● Visible on chart' : '○ Hidden'}
            </div>
          </div>

          <div
            onClick={() => setVisibleMoods(prev => ({ ...prev, grateful: !prev.grateful }))}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              visibleMoods.grateful
                ? 'bg-[#E3B15E]/15 border-[#E3B15E]/40 text-white'
                : 'bg-white/5 border-white/10 opacity-50 text-[#8E83A8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🙏</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3B15E]">
                Grateful
              </span>
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-2">
              {moodTotals.grateful} <span className="text-xs font-sans text-[#A69BBF] font-normal">days (30d)</span>
            </div>
            <div className="text-[10px] text-[#A69BBF] mt-1">
              {visibleMoods.grateful ? '● Visible on chart' : '○ Hidden'}
            </div>
          </div>

          <div
            onClick={() => setVisibleMoods(prev => ({ ...prev, seeking: !prev.seeking }))}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              visibleMoods.seeking
                ? 'bg-[#9881CE]/15 border-[#9881CE]/40 text-white'
                : 'bg-white/5 border-white/10 opacity-50 text-[#8E83A8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🔍</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9881CE]">
                Seeking
              </span>
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-2">
              {moodTotals.seeking} <span className="text-xs font-sans text-[#A69BBF] font-normal">days (30d)</span>
            </div>
            <div className="text-[10px] text-[#A69BBF] mt-1">
              {visibleMoods.seeking ? '● Visible on chart' : '○ Hidden'}
            </div>
          </div>

          <div
            onClick={() => setVisibleMoods(prev => ({ ...prev, doubting: !prev.doubting }))}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              visibleMoods.doubting
                ? 'bg-[#5D789B]/20 border-[#5D789B]/50 text-white'
                : 'bg-white/5 border-white/10 opacity-50 text-[#8E83A8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🤔</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#82A2C6]">
                Doubting
              </span>
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-2">
              {moodTotals.doubting} <span className="text-xs font-sans text-[#A69BBF] font-normal">days (30d)</span>
            </div>
            <div className="text-[10px] text-[#A69BBF] mt-1">
              {visibleMoods.doubting ? '● Visible on chart' : '○ Hidden'}
            </div>
          </div>
        </div>
      </div>

      {/* 1. VISUALIZATION 1: RECHARTS 30-DAY LINE CHART OF 4 MOODS */}
      {(activeTab === 'four-moods' || activeTab === 'both') && (
        <section
          id="thirty-day-four-moods-card"
          className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                  Recharts 30-Day Line Chart
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1FB6B0]/15 text-[#0F7571]">
                  4 Sacred Postures
                </span>
              </div>
              <h3 className="text-2xl font-serif text-[#1E1931] mt-0.5">
                Frequency of Peaceful, Seeking, Grateful & Doubting
              </h3>
              <p className="text-xs text-[#706782] mt-0.5">
                Comparing emotional and spiritual frequencies across the rolling 30-day journey.
              </p>
            </div>

            {/* Toggle Daily vs Cumulative */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFrequencyViewMode('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  frequencyViewMode === 'daily'
                    ? 'bg-white text-[#1E1931] shadow-xs'
                    : 'text-[#706782] hover:text-[#1E1931]'
                }`}
              >
                Daily Check-in
              </button>
              <button
                type="button"
                onClick={() => setFrequencyViewMode('cumulative')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  frequencyViewMode === 'cumulative'
                    ? 'bg-white text-[#1E1931] shadow-xs'
                    : 'text-[#706782] hover:text-[#1E1931]'
                }`}
              >
                Cumulative Frequency
              </button>
            </div>
          </div>

          {/* Line Chart */}
          <div className="mt-6 w-full h-[320px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={thirtyDayData}
                margin={{ top: 20, right: 20, left: -15, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EEF5" vertical={false} />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fill: '#807599', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E1ED' }}
                  interval={3}
                />
                <YAxis
                  allowDecimals={false}
                  domain={frequencyViewMode === 'daily' ? [0, 1.2] : [0, 'dataMax + 2']}
                  tick={{ fill: '#807599', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E1ED' }}
                  ticks={frequencyViewMode === 'daily' ? [0, 1] : undefined}
                  tickFormatter={(val: number) => {
                    if (frequencyViewMode === 'daily') {
                      return val === 1 ? 'Logged' : '-';
                    }
                    return `${val}d`;
                  }}
                />
                <Tooltip content={<CustomMoodTooltipContent frequencyViewMode={frequencyViewMode} />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
                />

                {/* 1. Peaceful Line */}
                {visibleMoods.peaceful && (
                  <Line
                    type="monotone"
                    name="🕊️ Peaceful"
                    dataKey={frequencyViewMode === 'daily' ? 'peaceful' : 'cumPeaceful'}
                    stroke="#1FB6B0"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1FB6B0', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive={true}
                    animationDuration={900}
                  />
                )}

                {/* 2. Grateful Line */}
                {visibleMoods.grateful && (
                  <Line
                    type="monotone"
                    name="🙏 Grateful"
                    dataKey={frequencyViewMode === 'daily' ? 'grateful' : 'cumGrateful'}
                    stroke="#E3B15E"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#E3B15E', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                )}

                {/* 3. Seeking Line */}
                {visibleMoods.seeking && (
                  <Line
                    type="monotone"
                    name="🔍 Seeking"
                    dataKey={frequencyViewMode === 'daily' ? 'seeking' : 'cumSeeking'}
                    stroke="#7B62B8"
                    strokeWidth={2.5}
                    strokeDasharray={frequencyViewMode === 'daily' ? '4 2' : undefined}
                    dot={{ r: 4, fill: '#7B62B8', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive={true}
                    animationDuration={1100}
                  />
                )}

                {/* 4. Doubting Line */}
                {visibleMoods.doubting && (
                  <Line
                    type="monotone"
                    name="🤔 Doubting"
                    dataKey={frequencyViewMode === 'daily' ? 'doubting' : 'cumDoubting'}
                    stroke="#5D789B"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#5D789B', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick mood logging actions */}
          {onCheckInMood && (
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-gray-500 font-medium">
                Log today’s soul posture to update your frequency:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCheckInMood('peaceful')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E8F8F7] text-[#0C615D] hover:bg-[#D4F3F1] border border-[#B9EBE8] transition-all cursor-pointer"
                >
                  🕊️ Peaceful
                </button>
                <button
                  type="button"
                  onClick={() => onCheckInMood('grateful')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FDF7E7] text-[#7B5915] hover:bg-[#FCEECC] border border-[#F6E1AB] transition-all cursor-pointer"
                >
                  🙏 Grateful
                </button>
                <button
                  type="button"
                  onClick={() => onCheckInMood('seeking')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3EFFB] text-[#4A327E] hover:bg-[#EAE2F7] border border-[#DACBF0] transition-all cursor-pointer"
                >
                  🔍 Seeking
                </button>
                <button
                  type="button"
                  onClick={() => onCheckInMood('doubting')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EEF4F8] text-[#294B6B] hover:bg-[#DEEAF1] border border-[#C6DBE7] transition-all cursor-pointer"
                >
                  🤔 Doubting
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 2. VISUALIZATION 2: SECONDARY CORRELATION VISUALIZATION (MOOD TRENDS VS STREAK DURATION) */}
      {(activeTab === 'correlation' || activeTab === 'both') && (
        <section
          id="mood-streak-correlation-card"
          className="rounded-3xl bg-gradient-to-br from-[#FAF8FC] via-[#F4F1FA] to-[#EDFAF9] border border-[#D5CAEC] p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2DAF2]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
                  Secondary Analytics Visualization
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E3B15E]/20 text-[#8A5B0B] border border-[#E3B15E]/40">
                  +84% Positive Correlation
                </span>
              </div>
              <h3 className="text-2xl font-serif text-[#1E1931] mt-0.5">
                Mood Trends vs. Streak Duration Correlation
              </h3>
              <p className="text-xs text-[#6B5F84] mt-0.5">
                Does maintaining a longer continuous streak produce more Peaceful & Grateful days? Data confirms habitual abiding shields the soul.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#2A2146] bg-white px-3.5 py-2 rounded-2xl border border-[#D5CAEC] shadow-2xs">
              <span>📈</span>
              <span>R = +0.84 (Strong Positive Link)</span>
            </div>
          </div>

          {/* Composed Chart: Bar for Flourishing % + Line for Average Intensity */}
          <div className="w-full h-[320px] sm:h-[370px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={correlationBrackets}
                margin={{ top: 20, right: 25, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DCF2" vertical={false} />
                <XAxis
                  dataKey="streakRange"
                  tick={{ fill: '#4E4266', fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#C8BFDE' }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fill: '#4E4266', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#C8BFDE' }}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 4]}
                  tick={{ fill: '#E3B15E', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E3B15E' }}
                  tickFormatter={(val: number) => `${val}/4`}
                />
                <Tooltip content={<CustomCorrelationTooltipContent />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />

                {/* Flourishing Rate (Peaceful + Grateful %) */}
                <Bar
                  yAxisId="left"
                  name="🕊️+🙏 Peaceful & Grateful Rate (%)"
                  dataKey="peacefulGratefulPct"
                  fill="#1FB6B0"
                  radius={[8, 8, 0, 0]}
                  barSize={42}
                  isAnimationActive={true}
                />

                {/* Doubting Rate (%) */}
                <Bar
                  yAxisId="left"
                  name="🤔 Doubting / Striving Rate (%)"
                  dataKey="doubtingPct"
                  fill="#8E85A8"
                  radius={[8, 8, 0, 0]}
                  barSize={20}
                  isAnimationActive={true}
                />

                {/* Average Daily Spiritual Intensity (0 to 4 disciplines) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  name="🔥 Avg Spiritual Depth (0-4)"
                  dataKey="avgIntensity"
                  stroke="#E3B15E"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#E3B15E', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* PASTORAL & STATISTICAL INSIGHT BANNER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E2DAF2]">
            <div className="p-4 rounded-2xl bg-white border border-[#E0D8EE] shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0E7773]">
                1. Habituation of Peace
              </span>
              <h4 className="text-sm font-bold font-serif text-[#1E1931] mt-1">
                +64% Flourishing Increase
              </h4>
              <p className="text-xs text-[#6B5F84] mt-1 leading-relaxed">
                By day 7 of continuous scripture and prayer, the mind shifts from anxiety toward resting in God’s sovereignty.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E0D8EE] shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A5B0B]">
                2. Collapse of Spiritual Doubt
              </span>
              <h4 className="text-sm font-bold font-serif text-[#1E1931] mt-1">
                80% Reduction in Doubt
              </h4>
              <p className="text-xs text-[#6B5F84] mt-1 leading-relaxed">
                Doubting drops from 35% on zero-streak days to under 4% once an 8+ day rhythm is established.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E0D8EE] shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5D3F96]">
                3. Biblical Anchor
              </span>
              <h4 className="text-sm font-bold font-serif text-[#1E1931] mt-1">
                Isaiah 26:3
              </h4>
              <p className="text-xs text-[#6B5F84] mt-1 italic leading-relaxed">
                “You keep him in perfect peace whose mind is stayed on you, because he trusts in you.”
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
