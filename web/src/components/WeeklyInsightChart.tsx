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

interface WeeklyInsightChartProps {
  pulseData: SpiritualPulseData;
  calendarRecords: Record<string, DayActivityRecord>;
  onSelectDate?: (dateStr: string) => void;
}

type ChartViewMode = 'practices' | 'mood' | 'balance';

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
}: WeeklyInsightChartProps) {
  const [viewMode, setViewMode] = useState<ChartViewMode>('practices');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today (last item in 7 days)

  // Map 7-day pulse data into structured Recharts dataset
  const chartData: PracticeDayChartItem[] = useMemo(() => {
    return pulseData.days.map(d => {
      const rec = calendarRecords[d.date];
      const isSabbath = Boolean(rec?.isSabbathRest);

      // Estimated devotional minutes based on deliberate practices
      const scriptureMins = d.practices.scriptureRead ? 10 : 0;
      const prayerMins = d.practices.prayerOffered ? 10 : 0;
      const stillnessMins = d.practices.stillnessMinutes > 0 ? d.practices.stillnessMinutes : 0;
      const journalMins = d.practices.journalWritten ? 10 : 0;
      const totalMins = isSabbath ? Math.max(scriptureMins + prayerMins + stillnessMins + journalMins, 25) : (scriptureMins + prayerMins + stillnessMins + journalMins);

      // Numeric mood level: Grateful=6, Peaceful=5, Seeking=4, Convicted=3, Doubting=2, Distant=1, Sabbath=5.5
      let moodLevel = 0;
      if (isSabbath) moodLevel = 5.5;
      else if (d.mood === 'grateful') moodLevel = 6;
      else if (d.mood === 'peaceful') moodLevel = 5;
      else if (d.mood === 'seeking') moodLevel = 4;
      else if (d.mood === 'convicted') moodLevel = 3;
      else if (d.mood === 'doubting') moodLevel = 2;
      else if (d.mood === 'distant') moodLevel = 1;
      else if (d.intensity > 0) moodLevel = 4.5;

      return {
        date: d.date,
        dayLabel: `${d.dayName.slice(0, 3)} ${d.formattedDate}`,
        dayShort: d.dayName.slice(0, 3),
        scriptureMins,
        prayerMins,
        stillnessMins,
        journalMins,
        totalMins,
        moodLevel,
        moodLabel: isSabbath ? 'Sabbath Rest' : d.moodLabel,
        moodEmoji: isSabbath ? '🕊️' : d.moodEmoji,
        moodColor: isSabbath ? '#735DA3' : d.moodColor,
        isSabbath,
        intensity: d.intensity,
      };
    });
  }, [pulseData.days, calendarRecords]);

  // Aggregate weekly totals
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
      avgMinsPerDay: Math.round(totalMinutes / 7),
    };
  }, [chartData]);

  const selectedDayItem = chartData[selectedDayIndex] || chartData[chartData.length - 1];

  return (
    <div id="weekly-insight-chart-container" className="space-y-6">
      {/* Visual Chart Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1C1633] via-[#241B42] to-[#13323B] p-6 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1FB6B0]/20 border border-[#1FB6B0]/40 text-[#37C6C2] text-[11px] font-extrabold uppercase tracking-widest">
              <span>📊</span>
              <span>Interactive Weekly Insights</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-white mt-1.5">
              Seven-Day Spiritual Rhythm Chart
            </h3>
            <p className="text-xs text-[#C8BFDE] mt-0.5 max-w-xl">
              Visualizing the balance between Word, Prayer, Quiet Abiding, and your soul’s emotional trajectory.
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
                  — Goal: 20 mins daily abiding
                </span>
              </div>

              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
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
                    />
                    <Bar
                      dataKey="prayerMins"
                      name="Prayer"
                      stackId="a"
                      fill="#37C6C2"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="stillnessMins"
                      name="Stillness"
                      stackId="a"
                      fill="#9D88CA"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="journalMins"
                      name="Journal"
                      stackId="a"
                      fill="#1FB6B0"
                      radius={[6, 6, 0, 0]}
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
                    />
                    <Line
                      type="monotone"
                      dataKey="moodLevel"
                      stroke="#37C6C2"
                      strokeWidth={3}
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
                      {weeklyTotals.scriptureDays}/7 Days ({Math.round((weeklyTotals.scriptureDays / 7) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#E3B15E] rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyTotals.scriptureDays / 7) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#C5BCD9]">
                    {weeklyTotals.scriptureDays >= 5
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
                      {weeklyTotals.prayerDays}/7 Days ({Math.round((weeklyTotals.prayerDays / 7) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#37C6C2] rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyTotals.prayerDays / 7) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#C5BCD9]">
                    {weeklyTotals.prayerDays >= 5
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
                      style={{ width: `${Math.min(100, (weeklyTotals.stillnessMinutes / 60) * 100)}%` }}
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
                      {weeklyTotals.journalDays}/7 Days ({Math.round((weeklyTotals.journalDays / 7) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#1FB6B0] rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyTotals.journalDays / 7) * 100}%` }}
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

      {/* 4 Weekly Vitality Summary Metrics */}
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
            {pulseData.consistencyRate}%
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706782]">
            Weekly Consistency
          </span>
          <span className="text-[10px] text-[#37C6C2] font-semibold block mt-0.5">
            {pulseData.totalCheckIns} of 7 days engaged
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
          <span className="text-2xl block">{pulseData.dominantMood.emoji}</span>
          <span className="text-2xl font-serif font-bold text-[#1E1931] mt-1 block truncate">
            {pulseData.dominantMood.label}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706782]">
            Dominant Soul Posture
          </span>
          <span className="text-[10px] text-[#E3B15E] font-semibold block mt-0.5">
            {pulseData.dominantMood.percentage}% of weekly focus
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
