'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import type { SpiritualPulseData } from '../app/api/spiritual-pulse/send/route';
import type { DayActivityRecord } from './ProgressScreen';

export type InsightPeriod = 7 | 14 | 30;

export interface WeeklyInsightChartProps {
  pulseData: SpiritualPulseData;
  calendarRecords: Record<string, DayActivityRecord>;
  onSelectDate?: (dateStr: string) => void;
  initialPeriod?: InsightPeriod;
}

type ChartViewMode = 'practices' | 'mood' | 'balance';

export interface MoodDetail {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  scriptureText: string;
  scriptureRef: string;
  postureNote: string;
}

export const MOOD_DETAILS: Record<string, MoodDetail> = {
  grateful: {
    id: 'grateful',
    label: 'Grateful',
    emoji: '🙏',
    color: '#E3B15E',
    description: 'Heart overflowing with thanksgiving and awareness of God’s daily gifts.',
    scriptureText: 'Give thanks to the Lord, for he is good; his love endures forever.',
    scriptureRef: 'Psalm 107:1',
    postureNote: 'Your heart has consistently paused to count blessings and praise God.',
  },
  peaceful: {
    id: 'peaceful',
    label: 'Peaceful',
    emoji: '🕊️',
    color: '#37C6C2',
    description: 'Deep inner stillness anchored in the assurance of Christ’s presence.',
    scriptureText: 'Peace I leave with you; my peace I give you. Do not let your hearts be troubled.',
    scriptureRef: 'John 14:27',
    postureNote: 'You have walked in quiet trust, shielded against hurry, anxiety, and distraction.',
  },
  seeking: {
    id: 'seeking',
    label: 'Seeking',
    emoji: '🔍',
    color: '#9D88CA',
    description: 'A hunger for divine wisdom, spiritual clarity, and closer fellowship.',
    scriptureText: 'You will seek me and find me when you seek me with all your heart.',
    scriptureRef: 'Jeremiah 29:13',
    postureNote: 'You have actively pressed in for wisdom, discernment, and deeper divine intimacy.',
  },
  convicted: {
    id: 'convicted',
    label: 'Convicted',
    emoji: '🕯️',
    color: '#B8746B',
    description: 'Humble responsiveness to the Holy Spirit’s refining guidance.',
    scriptureText: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.',
    scriptureRef: 'Psalm 51:10',
    postureNote: 'Your heart remained tender and quick to realign with the Father’s will.',
  },
  doubting: {
    id: 'doubting',
    label: 'Doubting',
    emoji: '🤔',
    color: '#6B8CAE',
    description: 'Wrestling honestly with questions while choosing to stay before the Lord.',
    scriptureText: 'I do believe; help me overcome my unbelief!',
    scriptureRef: 'Mark 9:24',
    postureNote: 'You brought genuine uncertainties directly into the light of grace.',
  },
  distant: {
    id: 'distant',
    label: 'Distant',
    emoji: '🌫️',
    color: '#8A7DAD',
    description: 'Enduring spiritual dryness by trusting God’s promise over fluctuating feelings.',
    scriptureText: 'Where can I go from your Spirit? Where can I flee from your presence?',
    scriptureRef: 'Psalm 139:7',
    postureNote: 'You persevered through dryness, standing on covenant faithfulness.',
  },
};

interface PracticeDayChartItem {
  date: string;
  dayLabel: string;
  dayShort: string;
  scriptureMins: number;
  prayerMins: number;
  stillnessMins: number;
  journalMins: number;
  totalMins: number;
  moodLevel: number;
  moodLabel: string;
  moodEmoji: string;
  moodColor: string;
  isSabbath: boolean;
  intensity: number;
}

// Custom Practice Breakdown Tooltip
function PracticeTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PracticeDayChartItem }> }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/20 bg-[#1C1733] p-4 text-xs text-white shadow-2xl min-w-[200px] backdrop-blur-md">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="font-bold text-white text-sm">{data.dayLabel}</span>
        <span className="text-base">{data.moodEmoji}</span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="flex justify-between items-center text-[#E3B15E]">
          <span className="flex items-center gap-1.5">
            <span>📖</span> Scripture:
          </span>
          <span className="font-bold">{data.scriptureMins}m</span>
        </div>
        <div className="flex justify-between items-center text-[#37C6C2]">
          <span className="flex items-center gap-1.5">
            <span>🙏</span> Prayer:
          </span>
          <span className="font-bold">{data.prayerMins}m</span>
        </div>
        <div className="flex justify-between items-center text-[#9D88CA]">
          <span className="flex items-center gap-1.5">
            <span>🕯️</span> Stillness:
          </span>
          <span className="font-bold">{data.stillnessMins}m</span>
        </div>
        <div className="flex justify-between items-center text-[#1FB6B0]">
          <span className="flex items-center gap-1.5">
            <span>✍️</span> Reflection:
          </span>
          <span className="font-bold">{data.journalMins}m</span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 flex justify-between font-bold text-white">
        <span>Total Devotional Time:</span>
        <span className="text-[#37C6C2]">{data.totalMins} mins</span>
      </div>

      {data.isSabbath && (
        <div className="mt-2 px-2 py-1 rounded-lg bg-[#735DA3]/30 text-[#D1C5EB] text-[10px] font-bold border border-[#735DA3]/50 text-center">
          🕊️ Holy Sabbath Rest Day
        </div>
      )}
    </div>
  );
}

// Custom Mood Trajectory Tooltip
function MoodTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PracticeDayChartItem }> }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/20 bg-[#1C1733] p-4 text-xs text-white shadow-2xl min-w-[190px]">
      <div className="text-[#A69DC0] font-medium">{data.dayLabel}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-2xl">{data.moodEmoji}</span>
        <div>
          <div className="font-bold text-sm" style={{ color: data.moodColor }}>
            {data.moodLabel}
          </div>
          <div className="text-[10px] text-gray-300">
            {data.intensity > 0 ? `Spiritual Intensity: ${data.intensity}/4` : 'Rest Day'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeeklyInsightChart({
  pulseData,
  calendarRecords,
  onSelectDate,
  initialPeriod = 7,
}: WeeklyInsightChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<InsightPeriod>(initialPeriod);
  const [viewMode, setViewMode] = useState<ChartViewMode>('practices');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Formatted date range label for the selected period
  const dateRangeLabel = useMemo(() => {
    const endD = new Date();
    const startD = new Date();
    startD.setDate(startD.getDate() - (selectedPeriod - 1));
    const startFmt = startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endFmt = endD.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFmt} – ${endFmt}`;
  }, [selectedPeriod]);

  // Aggregate and highlight the user's most frequent mood over the selected period
  const moodSummary = useMemo(() => {
    const counts: Record<string, number> = {
      grateful: 0,
      peaceful: 0,
      seeking: 0,
      convicted: 0,
      doubting: 0,
      distant: 0,
    };
    let totalLoggedDays = 0;

    for (let i = selectedPeriod - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const rec = calendarRecords[dateKey];
      if (rec?.mood && counts[rec.mood] !== undefined) {
        counts[rec.mood] += 1;
        totalLoggedDays += 1;
      }
    }

    let topMoodKey = 'peaceful';
    let maxCount = -1;
    for (const [key, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        topMoodKey = key;
      }
    }

    // Fallback if no records found for mood in local storage
    if (maxCount <= 0) {
      const pulseDominantKey = pulseData.dominantMood.label.toLowerCase();
      topMoodKey = counts[pulseDominantKey] !== undefined ? pulseDominantKey : 'grateful';
      maxCount = Math.max(1, Math.round((pulseData.dominantMood.percentage / 100) * selectedPeriod));
      totalLoggedDays = Math.max(totalLoggedDays, maxCount);
    }

    const topMood = MOOD_DETAILS[topMoodKey] || MOOD_DETAILS['grateful'];
    const percentageOfLogged = totalLoggedDays > 0 ? Math.round((maxCount / totalLoggedDays) * 100) : 100;
    const periodPercentage = Math.round((maxCount / selectedPeriod) * 100);

    const distribution = Object.entries(counts)
      .map(([key, count]) => ({
        key,
        count,
        percentage: totalLoggedDays > 0 ? Math.round((count / totalLoggedDays) * 100) : 0,
        detail: MOOD_DETAILS[key] || MOOD_DETAILS['grateful'],
        isTop: key === topMoodKey,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      topMood,
      topMoodKey,
      maxCount,
      totalLoggedDays,
      percentageOfLogged,
      periodPercentage,
      distribution,
    };
  }, [selectedPeriod, calendarRecords, pulseData]);

  // Map pulse and calendar records for the selected period into structured Recharts dataset
  const chartData: PracticeDayChartItem[] = useMemo(() => {
    const items: PracticeDayChartItem[] = [];

    for (let i = selectedPeriod - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const rec = calendarRecords[dateStr];
      const isSabbath = Boolean(rec?.isSabbathRest);

      // Estimated devotional minutes based on deliberate practices
      const scriptureMins = rec?.scriptureRead ? 10 : 0;
      const prayerMins = rec?.prayerCompleted ? 10 : 0;
      const stillnessMins = rec?.stillnessPractice ? 10 : 0;
      const journalMins = rec?.journalWritten ? 10 : 0;
      const totalMins = isSabbath
        ? Math.max(scriptureMins + prayerMins + stillnessMins + journalMins, 25)
        : scriptureMins + prayerMins + stillnessMins + journalMins;

      // Numeric mood level: Grateful=6, Peaceful=5, Seeking=4, Convicted=3, Doubting=2, Distant=1, Sabbath=5.5
      let moodLevel = 0;
      const moodKey = rec?.mood;
      if (isSabbath) moodLevel = 5.5;
      else if (moodKey === 'grateful') moodLevel = 6;
      else if (moodKey === 'peaceful') moodLevel = 5;
      else if (moodKey === 'seeking') moodLevel = 4;
      else if (moodKey === 'convicted') moodLevel = 3;
      else if (moodKey === 'doubting') moodLevel = 2;
      else if (moodKey === 'distant') moodLevel = 1;
      else if (rec && rec.intensity > 0) moodLevel = 4.5;

      const moodDetail = moodKey ? MOOD_DETAILS[moodKey] : null;

      const dayShort = selectedPeriod <= 7
        ? d.toLocaleDateString(undefined, { weekday: 'short' })
        : `${d.getMonth() + 1}/${d.getDate()}`;

      const dayLabel = `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

      items.push({
        date: dateStr,
        dayLabel,
        dayShort,
        scriptureMins,
        prayerMins,
        stillnessMins,
        journalMins,
        totalMins,
        moodLevel,
        moodLabel: isSabbath ? 'Sabbath Rest' : (moodDetail?.label || (rec?.intensity ? 'Active Practice' : 'Rest Day')),
        moodEmoji: isSabbath ? '🕊️' : (moodDetail?.emoji || '✦'),
        moodColor: isSabbath ? '#735DA3' : (moodDetail?.color || '#37C6C2'),
        isSabbath,
        intensity: rec?.intensity || 0,
      });
    }

    return items;
  }, [selectedPeriod, calendarRecords]);

  const activeDayIndex = selectedDayIndex !== null && selectedDayIndex >= 0 && selectedDayIndex < chartData.length
    ? selectedDayIndex
    : chartData.length - 1;

  // Aggregate period totals
  const weeklyTotals = useMemo(() => {
    let totalMinutes = 0;
    let scriptureDays = 0;
    let prayerDays = 0;
    let stillnessMinutes = 0;
    let journalDays = 0;

    chartData.forEach(item => {
      totalMinutes += item.totalMins;
      if (item.scriptureMins > 0) scriptureDays += 1;
      if (item.prayerMins > 0) prayerDays += 1;
      stillnessMinutes += item.stillnessMins;
      if (item.journalMins > 0) journalDays += 1;
    });

    return {
      totalMinutes,
      scriptureDays,
      prayerDays,
      stillnessMinutes,
      journalDays,
      avgMinsPerDay: Math.round(totalMinutes / selectedPeriod),
    };
  }, [chartData, selectedPeriod]);

  const selectedDayItem = chartData[activeDayIndex] || chartData[chartData.length - 1];

  return (
    <div id="weekly-insight-chart-container" className="space-y-6">
      {/* SUMMARY SECTION ABOVE THE WEEKLY INSIGHT CHART: HIGHLIGHTS MOST FREQUENT MOOD OVER SELECTED PERIOD */}
      <section
        id="weekly-insight-frequent-mood-summary"
        aria-label="Most Frequent Mood Summary"
        className="rounded-3xl bg-gradient-to-br from-[#1B1530] via-[#231A3E] to-[#122A33] p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden"
      >
        {/* Subtle ambient light reflecting dominant mood color */}
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: moodSummary.topMood.color }}
        />

        {/* Section Header with Period Range and Period Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-extrabold uppercase tracking-widest text-[#37C6C2]">
              <span>✦</span>
              <span>Soul Atmosphere · Mood Summary</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-white mt-1.5">
              Most Frequent Spiritual Mood
            </h3>
            <p className="text-xs text-[#C8BFDE] mt-0.5">
              Highlighting your dominant soul state for{' '}
              <span className="font-semibold text-white">{dateRangeLabel}</span> ({selectedPeriod} days).
            </p>
          </div>

          {/* Period Selector Toggle */}
          <div
            id="insight-period-selector"
            role="group"
            aria-label="Select insight period"
            className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/15 self-start sm:self-auto shrink-0"
          >
            {([7, 14, 30] as const).map(period => (
              <button
                key={period}
                id={`insight-period-btn-${period}`}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === period
                    ? 'bg-[#1FB6B0] text-[#082021] shadow-md'
                    : 'text-[#C5BCD9] hover:text-white'
                }`}
                aria-pressed={selectedPeriod === period}
              >
                {period === 7 ? '7 Days' : period === 14 ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Grid: Top Mood Feature Card + Period Mood Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 relative z-10">
          {/* Featured Dominant Mood Spotlight */}
          <div
            id="frequent-mood-spotlight-card"
            className="lg:col-span-7 rounded-2xl p-5 sm:p-6 border transition-all duration-500 flex flex-col justify-between"
            style={{
              backgroundColor: `${moodSummary.topMood.color}14`,
              borderColor: `${moodSummary.topMood.color}45`,
            }}
          >
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    id="frequent-mood-hero-emoji"
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border shrink-0 transition-transform hover:scale-105 duration-300"
                    style={{
                      backgroundColor: `${moodSummary.topMood.color}25`,
                      borderColor: `${moodSummary.topMood.color}65`,
                    }}
                  >
                    <span>{moodSummary.topMood.emoji}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A69DC0]">
                        Top Soul Posture
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white border border-white/15">
                        <span>★</span> Most Frequent
                      </span>
                    </div>
                    <h4
                      id="frequent-mood-title"
                      className="text-2xl sm:text-3xl font-serif font-bold mt-0.5 tracking-tight"
                      style={{ color: moodSummary.topMood.color }}
                    >
                      {moodSummary.topMood.label}
                    </h4>
                  </div>
                </div>

                {/* Primary Metric Pill */}
                <div className="sm:text-right">
                  <span
                    id="frequent-mood-frequency-badge"
                    className="inline-flex flex-col items-start sm:items-end px-3.5 py-1.5 rounded-xl border font-bold text-xs shadow-sm"
                    style={{
                      backgroundColor: `${moodSummary.topMood.color}20`,
                      borderColor: `${moodSummary.topMood.color}55`,
                      color: moodSummary.topMood.color,
                    }}
                  >
                    <span className="text-sm font-extrabold">
                      {moodSummary.maxCount} of {selectedPeriod} days
                    </span>
                    <span className="text-[10px] opacity-85 font-medium">
                      {moodSummary.periodPercentage}% of selected period
                    </span>
                  </span>
                </div>
              </div>

              {/* Thoughtful Posture Insight */}
              <p
                id="frequent-mood-reflection"
                className="text-xs sm:text-sm text-[#E2DCF0] mt-4 leading-relaxed font-sans"
              >
                {moodSummary.topMood.postureNote}
              </p>
            </div>

            {/* Scripture Anchor Quote */}
            <div
              id="frequent-mood-scripture-anchor"
              className="mt-5 pt-3.5 border-t border-white/10 flex items-start gap-2.5 rounded-xl bg-black/25 p-3.5"
            >
              <span className="text-xl leading-none select-none text-[#E3B15E]">“</span>
              <div className="text-xs">
                <p className="text-[#DCD4EE] italic">
                  {moodSummary.topMood.scriptureText}
                </p>
                <p className="text-[11px] font-bold mt-1" style={{ color: moodSummary.topMood.color }}>
                  ({moodSummary.topMood.scriptureRef})
                </p>
              </div>
            </div>
          </div>

          {/* Period Mood Distribution Column */}
          <div
            id="period-mood-distribution-card"
            className="lg:col-span-5 rounded-2xl bg-black/25 border border-white/10 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5BCD9]">
                  Period Mood Balance
                </span>
                <span className="text-[11px] text-[#37C6C2] font-semibold">
                  {moodSummary.totalLoggedDays} logged {moodSummary.totalLoggedDays === 1 ? 'day' : 'days'}
                </span>
              </div>

              {/* Distribution rows */}
              <div className="mt-3 space-y-2">
                {moodSummary.distribution.map(item => (
                  <div
                    key={item.key}
                    id={`mood-dist-row-${item.key}`}
                    className={`p-2 rounded-xl transition-all ${
                      item.isTop
                        ? 'bg-white/10 border border-white/15 shadow-xs'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <span>{item.detail.emoji}</span>
                        <span style={{ color: item.isTop ? item.detail.color : '#EDE8F7' }}>
                          {item.detail.label}
                        </span>
                        {item.isTop && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-white/15 text-[#E3B15E]">
                            Top
                          </span>
                        )}
                      </span>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: item.isTop ? item.detail.color : '#A69DC0' }}
                      >
                        {item.count}d <span className="font-normal opacity-70">({item.percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.detail.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-[#A69DC0] flex items-center justify-between">
              <span>Primary focus: <strong style={{ color: moodSummary.topMood.color }}>{moodSummary.topMood.label}</strong></span>
              <span className="text-[#37C6C2] font-medium">Soul Trajectory</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Chart Header Card */}
      <div
        id="weekly-insight-recharts-card"
        data-testid="recharts-chart-panel"
        className="recharts-container-card rounded-3xl bg-gradient-to-r from-[#1C1633] via-[#241B42] to-[#13323B] p-6 sm:p-8 text-white shadow-xl border border-white/10"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1FB6B0]/20 border border-[#1FB6B0]/40 text-[#37C6C2] text-[11px] font-extrabold uppercase tracking-widest">
              <span>📊</span>
              <span>Interactive Weekly Insights</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-white mt-1.5">
              {selectedPeriod === 7
                ? 'Seven-Day Spiritual Rhythm Chart'
                : selectedPeriod === 14
                ? 'Fourteen-Day Spiritual Rhythm Chart'
                : 'Thirty-Day Spiritual Rhythm Chart'}
            </h3>
            <p className="text-xs text-[#C8BFDE] mt-0.5 max-w-xl">
              Visualizing the balance between Word, Prayer, Quiet Abiding, and your soul’s emotional trajectory over the past {selectedPeriod} days.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/15 self-start lg:self-auto">
            <button
              id="chart-mode-practices-btn"
              type="button"
              onClick={() => setViewMode('practices')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'practices'
                  ? 'bg-[#1FB6B0] text-[#122423] shadow-md'
                  : 'text-[#C5BCD9] hover:text-white'
              }`}
            >
              <span>⏱️</span>
              <span>Practice Time</span>
            </button>

            <button
              id="chart-mode-mood-btn"
              type="button"
              onClick={() => setViewMode('mood')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'mood'
                  ? 'bg-[#1FB6B0] text-[#122423] shadow-md'
                  : 'text-[#C5BCD9] hover:text-white'
              }`}
            >
              <span>🕊️</span>
              <span>Soul Trajectory</span>
            </button>

            <button
              id="chart-mode-balance-btn"
              type="button"
              onClick={() => setViewMode('balance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'balance'
                  ? 'bg-[#1FB6B0] text-[#122423] shadow-md'
                  : 'text-[#C5BCD9] hover:text-white'
              }`}
            >
              <span>⚖️</span>
              <span>Spiritual Balance</span>
            </button>
          </div>
        </div>

        {/* Dynamic Chart Body */}
        <div className="mt-6">
          {viewMode === 'practices' && (
            <div className="w-full">
              <div className="flex flex-wrap items-center justify-between text-xs text-[#C5BCD9] mb-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-[#E3B15E]" /> Scripture
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-[#37C6C2]" /> Prayer
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-[#9D88CA]" /> Stillness
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-[#1FB6B0]" /> Reflection
                  </span>
                </div>
                <span className="text-[11px] text-[#A69BBF] italic">
                  (Goal: 20 mins daily abiding)
                </span>
              </div>

              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    key={`practice-barchart-${selectedPeriod}-${viewMode}`}
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    onClick={(state) => {
                      if (state && typeof state.activeTooltipIndex === 'number') {
                        setSelectedDayIndex(state.activeTooltipIndex);
                        const selectedDate = chartData[state.activeTooltipIndex]?.date;
                        if (selectedDate && onSelectDate) onSelectDate(selectedDate);
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dayShort"
                      interval={selectedPeriod === 30 ? 3 : selectedPeriod === 14 ? 1 : 0}
                      tick={{ fill: '#C5BCD9', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                    />
                    <YAxis
                      domain={[0, 45]}
                      ticks={[0, 10, 20, 30, 40]}
                      tickFormatter={(val: number) => `${val}m`}
                      tick={{ fill: '#C5BCD9', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                    />
                    <Tooltip content={<PracticeTooltip />} />
                    <ReferenceLine
                      y={20}
                      stroke="#E3B15E"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Daily Goal (20m)',
                        fill: '#E3B15E',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    <Bar
                      dataKey="scriptureMins"
                      name="Scripture"
                      stackId="a"
                      fill="#E3B15E"
                      radius={[0, 0, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      animationBegin={100}
                    />
                    <Bar
                      dataKey="prayerMins"
                      name="Prayer"
                      stackId="a"
                      fill="#37C6C2"
                      radius={[0, 0, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      animationBegin={200}
                    />
                    <Bar
                      dataKey="stillnessMins"
                      name="Stillness"
                      stackId="a"
                      fill="#9D88CA"
                      radius={[0, 0, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      animationBegin={300}
                    />
                    <Bar
                      dataKey="journalMins"
                      name="Journal"
                      stackId="a"
                      fill="#1FB6B0"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      animationBegin={400}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {viewMode === 'mood' && (
            <div className="w-full">
              <div className="flex items-center justify-between text-xs text-[#C5BCD9] mb-3">
                <span>Soul Trajectory (Higher = Greater Peace & Gratitude)</span>
                <span className="text-[11px] text-[#37C6C2] font-semibold">
                  Dominant: {pulseData.dominantMood.emoji} {pulseData.dominantMood.label}
                </span>
              </div>

              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    key={`mood-composedchart-${selectedPeriod}-${viewMode}`}
                    data={chartData}
                    margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                    onClick={(state) => {
                      if (state && typeof state.activeTooltipIndex === 'number') {
                        setSelectedDayIndex(state.activeTooltipIndex);
                        const selectedDate = chartData[state.activeTooltipIndex]?.date;
                        if (selectedDate && onSelectDate) onSelectDate(selectedDate);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="weeklyMoodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1FB6B0" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1FB6B0" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dayShort"
                      interval={selectedPeriod === 30 ? 3 : selectedPeriod === 14 ? 1 : 0}
                      tick={{ fill: '#C5BCD9', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                    />
                    <YAxis
                      domain={[0.5, 6.5]}
                      ticks={[1, 2, 3, 4, 5, 6]}
                      tickFormatter={(val: number) => {
                        const m: Record<number, string> = {
                          6: '🙏 Grateful',
                          5: '🕊 Peaceful',
                          4: '🔍 Seeking',
                          3: '🕯 Convicted',
                          2: '🤔 Doubting',
                          1: '🌫 Distant',
                        };
                        return m[val] || '';
                      }}
                      tick={{ fill: '#C5BCD9', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                    />
                    <Tooltip content={<MoodTooltip />} />
                    <ReferenceLine
                      y={4.5}
                      stroke="rgba(55, 198, 194, 0.3)"
                      strokeDasharray="3 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="moodLevel"
                      fill="url(#weeklyMoodGrad)"
                      stroke="transparent"
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                      animationBegin={150}
                    />
                    <Line
                      type="monotone"
                      dataKey="moodLevel"
                      stroke="#37C6C2"
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                      animationBegin={150}
                      dot={(props: { cx?: number; cy?: number; index?: number }) => {
                        const item = chartData[props.index || 0];
                        if (!props.cx || !props.cy) return <g key={props.index} />;
                        return (
                          <g key={props.index} className="cursor-pointer">
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={12}
                              fill="#1C1733"
                              stroke={item?.moodColor || '#37C6C2'}
                              strokeWidth={2}
                            />
                            <text
                              x={props.cx}
                              y={props.cy + 4}
                              textAnchor="middle"
                              fontSize={11}
                            >
                              {item?.moodEmoji || '✦'}
                            </text>
                          </g>
                        );
                      }}
                      activeDot={{ r: 16, stroke: '#FFFFFF', strokeWidth: 2, fill: '#1FB6B0' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {viewMode === 'balance' && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Scripture Consistency */}
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className="text-base">📖</span> Word of God (Scripture)
                    </span>
                    <span className="font-bold text-[#E3B15E]">
                      {weeklyTotals.scriptureDays}/{selectedPeriod} Days ({Math.round((weeklyTotals.scriptureDays / selectedPeriod) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#E3B15E] rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyTotals.scriptureDays / selectedPeriod) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#C5BCD9]">
                    {weeklyTotals.scriptureDays >= Math.round(selectedPeriod * 0.7)
                      ? 'Thriving in the Word: Strong daily biblical anchoring.'
                      : 'Room to deepen: Aim for 10 minutes of daily gospel abiding.'}
                  </p>
                </div>

                {/* 2. Prayer Communion */}
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className="text-base">🙏</span> Prayer & Communion
                    </span>
                    <span className="font-bold text-[#37C6C2]">
                      {weeklyTotals.prayerDays}/{selectedPeriod} Days ({Math.round((weeklyTotals.prayerDays / selectedPeriod) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#37C6C2] rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyTotals.prayerDays / selectedPeriod) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#C5BCD9]">
                    {weeklyTotals.prayerDays >= Math.round(selectedPeriod * 0.7)
                      ? 'Continual prayer: Heart aligned in active fellowship.'
                      : 'Invite God into daily decisions through short breath prayers.'}
                  </p>
                </div>

                {/* 3. Quiet Stillness */}
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className="text-base">🕯️</span> Solitude & Stillness
                    </span>
                    <span className="font-bold text-[#9D88CA]">
                      {weeklyTotals.stillnessMinutes} mins practiced
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#9D88CA] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (weeklyTotals.stillnessMinutes / (selectedPeriod * 10)) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#C5BCD9]">
                    Silence silences the world’s panic so you can hear Christ’s peace.
                  </p>
                </div>

                {/* 4. Soul Journaling */}
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className="text-base">✍️</span> Soul Journaling
                    </span>
                    <span className="font-bold text-[#1FB6B0]">
                      {weeklyTotals.journalDays}/{selectedPeriod} Days ({Math.round((weeklyTotals.journalDays / selectedPeriod) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#1FB6B0] rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyTotals.journalDays / selectedPeriod) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#C5BCD9]">
                    Chronicling God’s guidance builds an altar of remembrance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Day Inspector Pill */}
        {selectedDayItem && (
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedDayItem.moodEmoji}</span>
              <div>
                <span className="font-bold text-white text-sm">
                  {selectedDayItem.dayLabel}
                </span>
                <span className="text-xs text-[#C5BCD9] block">
                  Soul State: <strong style={{ color: selectedDayItem.moodColor }}>{selectedDayItem.moodLabel}</strong> · Total Time: {selectedDayItem.totalMins}m
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              {selectedDayItem.scriptureMins > 0 && <span className="px-2 py-0.5 rounded-md bg-[#E3B15E]/20 text-[#E3B15E]">📖 Word</span>}
              {selectedDayItem.prayerMins > 0 && <span className="px-2 py-0.5 rounded-md bg-[#37C6C2]/20 text-[#37C6C2]">🙏 Prayer</span>}
              {selectedDayItem.stillnessMins > 0 && <span className="px-2 py-0.5 rounded-md bg-[#9D88CA]/20 text-[#9D88CA]">🕯️ Stillness</span>}
              {selectedDayItem.journalMins > 0 && <span className="px-2 py-0.5 rounded-md bg-[#1FB6B0]/20 text-[#1FB6B0]">✍️ Reflection</span>}
              {selectedDayItem.isSabbath && <span className="px-2 py-0.5 rounded-md bg-[#735DA3]/30 text-[#D1C5EB]">🕊️ Sabbath Rest</span>}
            </div>
          </div>
        )}
      </div>

      {/* 4 Vitality Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
          <span className="text-2xl block">⏱️</span>
          <span className="text-2xl font-serif font-bold text-[#1E1931] mt-1 block">
            {weeklyTotals.totalMinutes} mins
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706782]">
            Total Devotional Time
          </span>
          <span className="text-[10px] text-[#1FB6B0] font-semibold block mt-0.5">
            ~{weeklyTotals.avgMinsPerDay} mins daily average
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
          <span className="text-2xl block">🌱</span>
          <span className="text-2xl font-serif font-bold text-[#1E1931] mt-1 block">
            {Math.round((chartData.filter(d => d.totalMins > 0).length / selectedPeriod) * 100)}%
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706782]">
            {selectedPeriod}-Day Consistency
          </span>
          <span className="text-[10px] text-[#37C6C2] font-semibold block mt-0.5">
            {chartData.filter(d => d.totalMins > 0).length} of {selectedPeriod} days engaged
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
          <span className="text-2xl block">{moodSummary.topMood.emoji}</span>
          <span className="text-2xl font-serif font-bold text-[#1E1931] mt-1 block truncate">
            {moodSummary.topMood.label}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706782]">
            Dominant Soul Posture
          </span>
          <span className="text-[10px] text-[#E3B15E] font-semibold block mt-0.5">
            {moodSummary.periodPercentage}% of {selectedPeriod}-day period
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
          <span className="text-2xl block">👑</span>
          <span className="text-2xl font-serif font-bold text-[#1E1931] mt-1 block">
            {pulseData.currentStreak} Days
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706782]">
            Unbroken Active Streak
          </span>
          <span className="text-[10px] text-[#735DA3] font-semibold block mt-0.5">
            Milestones within reach
          </span>
        </div>
      </div>
    </div>
  );
}
