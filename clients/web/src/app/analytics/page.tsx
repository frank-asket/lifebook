"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
}

interface AnalyticsSummary {
  totalEvents: number;
  uniqueDevices: number;
  guidedFlowStarts: number;
  guidedFlowCompletions: number;
  guidedFlowCompletionRate: number;
  habit5MinAchieved: number;
  onboardingStarts: number;
  onboardingCompletions: number;
  onboardingCompletionRate: number;
  stepDropOffs: Record<string, number>;
  averageDwellSeconds: Record<string, number>;
  funnel: FunnelStep[];
}

interface TelemetryEventItem {
  id: string;
  eventName: string;
  deviceId: string;
  timestamp: string;
  properties: Record<string, unknown>;
}

export default function AnalyticsDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<TelemetryEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [sumRes, evRes] = await Promise.all([
        fetch("/api/lifebook/analytics/summary"),
        fetch("/api/lifebook/analytics/events?limit=25"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData.events || []);
      }
    } catch {
      // Ignore network errors in dev
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      try {
        const [sumRes, evRes] = await Promise.all([
          fetch("/api/lifebook/analytics/summary"),
          fetch("/api/lifebook/analytics/events?limit=25"),
        ]);
        if (!isMounted) return;
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        }
        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData.events || []);
        }
      } catch {
        // Dev fallback
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void runFetch();

    if (!autoRefresh) {
      return () => {
        isMounted = false;
      };
    }

    const interval = setInterval(() => {
      void runFetch();
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatSec = (s: number = 0) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}m ${sec < 10 ? '0' : ''}${sec}s`;
  };

  return (
    <div id="analytics-page" className="min-h-screen bg-[#0E0C17] text-white">
      {/* Header Bar */}
      <header id="analytics-header" className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/60 hover:text-white text-xs tracking-wider uppercase font-medium">
            ← Back to LifeBook
          </Link>
          <span className="text-white/20">|</span>
          <span className="font-semibold text-sm text-white tracking-tight">Product Telemetry & Habit Analytics</span>
          <span className="bg-[#B8823A]/20 text-[#E3B15E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Live Pipeline
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            id="toggle-auto-refresh"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-md border ${
              autoRefresh 
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' 
                : 'border-white/20 text-white/60 hover:text-white'
            }`}
          >
            {autoRefresh ? '● Auto-refreshing (6s)' : 'Paused'}
          </button>
          <button
            id="refresh-analytics-btn"
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main id="analytics-content" className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Intro callout */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-1">Guided Flow & Onboarding Telemetry</h1>
            <p className="text-xs text-white/60 max-w-2xl">
              Acting on the principle that <span className="text-white font-medium">&ldquo;built, tested, and user-validated are different claims.&rdquo;</span> This real-time events layer tracks actual drop-offs, phase dwell times, and 5-minute daily habit achievement.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-mono font-bold text-[#45D3B4]">{summary?.totalEvents ?? 0}</span>
            <span className="block text-[11px] text-white/50 uppercase tracking-wider">Total Recorded Events</span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
            <span className="text-xs text-white/50 block mb-1">Guided Flow Starts</span>
            <div className="text-2xl font-bold text-white font-mono">{summary?.guidedFlowStarts ?? 0}</div>
            <span className="text-[11px] text-white/40 mt-1 block">Total sessions initialized</span>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
            <span className="text-xs text-white/50 block mb-1">Flow Completions</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {summary?.guidedFlowCompletions ?? 0}{' '}
              <span className="text-sm font-sans font-normal text-white/50">
                ({summary?.guidedFlowCompletionRate ?? 0}%)
              </span>
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">Full 4-phase completion</span>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
            <span className="text-xs text-white/50 block mb-1">5-Min Habit Achieved</span>
            <div className="text-2xl font-bold text-[#E3B15E] font-mono">{summary?.habit5MinAchieved ?? 0}</div>
            <span className="text-[11px] text-white/40 mt-1 block">Reached full 300s dwell target</span>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
            <span className="text-xs text-white/50 block mb-1">Onboarding Completion</span>
            <div className="text-2xl font-bold text-teal-300 font-mono">
              {summary?.onboardingCompletions ?? 0}{' '}
              <span className="text-sm font-sans font-normal text-white/50">
                ({summary?.onboardingCompletionRate ?? 0}%)
              </span>
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">Out of {summary?.onboardingStarts ?? 0} onboardings</span>
          </div>
        </div>

        {/* Funnel Visualizer */}
        <section id="guided-funnel-section" className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Guided Flow Funnel & Drop-Off</h2>
              <p className="text-xs text-white/50">Conversion through the 4-phase contemplative journey</p>
            </div>
            <span className="text-xs text-white/40 font-mono">Step Conversion %</span>
          </div>

          <div className="space-y-4">
            {summary?.funnel && summary.funnel.length > 0 ? (
              summary.funnel.map((f, i) => (
                <div key={f.step} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white capitalize">
                      {i + 1}. {f.step.replace(/_/g, ' ')}
                    </span>
                    <span className="text-white/70 font-mono">
                      {f.count} users ({f.conversionRate}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-[#E3B15E] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, Math.min(100, f.conversionRate))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-white/40">No funnel data recorded yet.</div>
            )}
          </div>
        </section>

        {/* Phase Dwell Times Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section id="dwell-times-section" className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Phase Dwell Times (User Depth)</h2>
            <p className="text-xs text-white/50 mb-4">Average time spent in each contemplative step</p>

            <div className="divide-y divide-white/10">
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-white/80">📖 Scripture Reading</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {formatSec(summary?.averageDwellSeconds?.['scripture'] ?? 0)}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-white/80">✍️ Reflection & Journaling</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {formatSec(summary?.averageDwellSeconds?.['reflect'] ?? 0)}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-white/80">🫁 Centering & Meditation</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {formatSec(summary?.averageDwellSeconds?.['meditate-run'] ?? summary?.averageDwellSeconds?.['meditate-select'] ?? 0)}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-white/80">🙏 Prayer & Committal</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {formatSec(summary?.averageDwellSeconds?.['pray'] ?? 0)}
                </span>
              </div>
            </div>
          </section>

          {/* Real-time Telemetry Stream */}
          <section id="live-events-section" className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Live Event Stream</h2>
                <p className="text-xs text-white/50">Real-time incoming telemetry buffer</p>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-2 font-mono text-xs">
              {events.length > 0 ? (
                events.map((ev) => (
                  <div key={ev.id} className="bg-white/[0.02] hover:bg-white/[0.05] p-2.5 rounded border border-white/5 flex items-start justify-between gap-3">
                    <div className="truncate">
                      <span className="text-teal-400 font-semibold">{ev.eventName}</span>
                      <span className="text-white/40 block text-[10px] truncate">
                        dev: {ev.deviceId?.slice(0, 16)}... | {JSON.stringify(ev.properties || {})}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/30 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/30 text-xs font-sans">
                  No telemetry events received yet. Complete a guided flow or onboarding to view live events.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
