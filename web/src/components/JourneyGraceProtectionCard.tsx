'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { trackEvent } from '../lib/telemetry';

export interface JourneyGraceState {
  journeyId: string;
  journeyTitle: string;
  currentDay: number;
  totalDays: number;
  graceDaysTotal: number;
  graceDaysRemaining: number;
  graceDaysUsed: number;
  status: 'active' | 'grace_rest' | 'catchup_needed';
  lastGraceReason?: string;
  lastGraceDate?: string;
  graceHistory: Array<{
    id: string;
    date: string;
    dayProtected: number;
    reason: string;
    scripture: string;
  }>;
}

const AVAILABLE_TRACKS = [
  {
    id: 'peace-work',
    title: 'Peace in Busy Workdays',
    topic: 'Workplace Stress & Soul Quietness',
    verseRef: 'Philippians 4:6-7',
    icon: '🕊️',
  },
  {
    id: 'clarity-decisions',
    title: 'Clarity in Big Decisions',
    topic: 'Discerning God’s Guidance in Career & Life',
    verseRef: 'James 1:5',
    icon: '🧭',
  },
  {
    id: 'morning-gratitude',
    title: 'Morning Gratitude & Praise',
    topic: 'Resetting Your Morning Thoughts in Joy',
    verseRef: 'Lamentations 3:22-23',
    icon: '🌅',
  },
  {
    id: 'overcoming-fear',
    title: 'Overcoming Fear & Anxiety',
    topic: 'Courage from Scripture Under Pressure',
    verseRef: '2 Timothy 1:7',
    icon: '🛡️',
  },
];

const DEFAULT_STATE: JourneyGraceState = {
  journeyId: 'peace-work',
  journeyTitle: 'Peace in Busy Workdays',
  currentDay: 3,
  totalDays: 5,
  graceDaysTotal: 2,
  graceDaysRemaining: 2,
  graceDaysUsed: 0,
  status: 'active',
  graceHistory: [],
};

// Soothing Web Audio chime for Grace Day activation
function playGraceChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // F major gentle triad: F4 (349.23), A4 (440.00), C5 (523.25), F5 (698.46)
    [349.23, 440.0, 523.25, 698.46].forEach((freq, idx) => {
      const noteTime = now + idx * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 2.5);
    });
  } catch {
    // Audio fallback
  }
}

interface JourneyGraceProtectionCardProps {
  onGracePointsAwarded?: (points: number) => void;
  className?: string;
}

export function JourneyGraceProtectionCard({
  onGracePointsAwarded,
  className = '',
}: JourneyGraceProtectionCardProps) {
  const [state, setState] = useState<JourneyGraceState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lifebook.journeyGraceState');
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return DEFAULT_STATE;
  });

  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isCatchUpModalOpen, setIsCatchUpModalOpen] = useState(false);
  const [isPolicyInfoOpen, setIsPolicyInfoOpen] = useState(false);
  const [selectedRestReason, setSelectedRestReason] = useState('Sabbath Rest & Spiritual Recharging');
  const [customRestNote, setCustomRestNote] = useState('');
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifebook.journeyGraceState', JSON.stringify(state));
    }
  }, [state]);

  const currentTrack = useMemo(() => {
    return AVAILABLE_TRACKS.find(t => t.id === state.journeyId) || AVAILABLE_TRACKS[0];
  }, [state.journeyId]);

  const showNotification = (msg: string) => {
    setSuccessNotification(msg);
    setTimeout(() => {
      setSuccessNotification(null);
    }, 4500);
  };

  // Switch journey track
  const handleSelectTrack = (trackId: string) => {
    const track = AVAILABLE_TRACKS.find(t => t.id === trackId);
    if (!track) return;
    setState(prev => ({
      ...prev,
      journeyId: track.id,
      journeyTitle: track.title,
      currentDay: 1,
      status: 'active',
    }));
    showNotification(`Switched active journey to: “${track.title}” (5 days)`);
    void trackEvent('pre_signup_journey_previewed', {
      journeyId: track.id,
      action: 'track_switched',
    });
  };

  // 1. Trigger intentional Grace Day (Rest Today)
  const handleTakeGraceDay = async () => {
    playGraceChime();
    const reasonText = customRestNote.trim()
      ? `${selectedRestReason}: ${customRestNote.trim()}`
      : selectedRestReason;
    const nowStr = new Date().toISOString().slice(0, 10);

    const newHistoryEntry = {
      id: `grace-${Date.now()}`,
      date: nowStr,
      dayProtected: state.currentDay,
      reason: reasonText,
      scripture: 'Lamentations 3:22-23 — His mercies never come to an end; they are new every morning.',
    };

    const newRemaining = Math.max(0, state.graceDaysRemaining - 1);
    const newUsed = state.graceDaysUsed + 1;

    setState(prev => ({
      ...prev,
      graceDaysRemaining: newRemaining,
      graceDaysUsed: newUsed,
      status: 'grace_rest',
      lastGraceReason: reasonText,
      lastGraceDate: nowStr,
      graceHistory: [newHistoryEntry, ...prev.graceHistory],
    }));

    setIsRestModalOpen(false);
    setCustomRestNote('');
    showNotification(
      `🛡️ Grace Day Activated! Day ${state.currentDay} is safely held in peace without breaking your streak (+50 GP).`
    );

    if (onGracePointsAwarded) {
      onGracePointsAwarded(50);
    }

    void trackEvent('journey_grace_day_activated', {
      journeyId: state.journeyId,
      dayProtected: state.currentDay,
      reason: reasonText,
      remainingGraceDays: newRemaining,
    });

    // Fire upstream backend call
    try {
      await fetch(`/api/lifebook/journeys/${state.journeyId}/grace-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reasonText,
          dayProtected: state.currentDay,
        }),
      });
    } catch {
      // Local fallback
    }
  };

  // 2. Simulate Missed Day (Auto-Protection in action)
  const handleSimulateMissedDay = async () => {
    playGraceChime();
    const nowStr = new Date().toISOString().slice(0, 10);
    const reasonText = 'Simulated Busy Day / Late Emergency (Auto-Protected)';

    const newHistoryEntry = {
      id: `grace-${Date.now()}`,
      date: nowStr,
      dayProtected: state.currentDay,
      reason: reasonText,
      scripture: '2 Corinthians 12:9 — My grace is sufficient for you, for my power is made perfect in weakness.',
    };

    const newRemaining = Math.max(0, state.graceDaysRemaining - 1);
    const newUsed = state.graceDaysUsed + 1;

    setState(prev => ({
      ...prev,
      graceDaysRemaining: newRemaining,
      graceDaysUsed: newUsed,
      status: 'catchup_needed',
      lastGraceReason: reasonText,
      lastGraceDate: nowStr,
      graceHistory: [newHistoryEntry, ...prev.graceHistory],
    }));

    showNotification(
      `⚡ Missed Day Simulated! Your journey did NOT reset to Day 1. Grace Day auto-protected your place at Day ${state.currentDay}.`
    );

    void trackEvent('journey_grace_simulated', {
      journeyId: state.journeyId,
      dayProtected: state.currentDay,
    });
  };

  // 3. Complete 90-second Grace Catch-Up
  const handleCompleteCatchUp = async () => {
    playGraceChime();
    setState(prev => ({
      ...prev,
      status: 'active',
    }));
    setIsCatchUpModalOpen(false);
    showNotification(
      `🌿 Reconnected in Grace! Welcome back to Day ${state.currentDay} of “${state.journeyTitle}”.`
    );

    if (onGracePointsAwarded) {
      onGracePointsAwarded(35);
    }

    void trackEvent('journey_grace_catchup_completed', {
      journeyId: state.journeyId,
      dayResumed: state.currentDay,
    });

    try {
      await fetch(`/api/lifebook/journeys/${state.journeyId}/grace-catchup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayResumed: state.currentDay,
        }),
      });
    } catch {
      // Local fallback
    }
  };

  // Reset demo state
  const handleResetGraceBank = () => {
    setState({
      ...DEFAULT_STATE,
      journeyId: state.journeyId,
      journeyTitle: state.journeyTitle,
      currentDay: 3,
    });
    showNotification('Journey Grace Days bank reset to 2 available shields.');
  };

  return (
    <div
      id="journey-grace-protection-card"
      className={`rounded-3xl bg-white border border-[#E8E1F0] shadow-sm p-6 sm:p-7 relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Background soft ambient decoration */}
      <div
        className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#FAF5FF] via-[#F3E8FF]/40 to-transparent pointer-events-none -z-0"
        aria-hidden="true"
      />

      {/* Floating Success Toast */}
      {successNotification && (
        <div
          id="grace-notification-toast"
          role="status"
          aria-live="polite"
          className="mb-4 p-3.5 rounded-2xl bg-[#1E1931] text-white text-xs flex items-center justify-between gap-3 shadow-lg border border-white/10 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span className="font-medium leading-relaxed">{successNotification}</span>
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            className="text-white/60 hover:text-white text-xs px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Retention Anchor and Status Pill */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#F0EAF5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#705EAA]">
              P3 Retention Protection
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#37C6C2]/15 text-[#0F7571] border border-[#37C6C2]/30">
              🛡️ Journey Grace Days
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1931] mt-1">
            5-Day Topical Study Protection
          </h3>
          <p className="text-xs text-[#6B5E83] mt-0.5 max-w-xl">
            Never lose your place. In LifeBook, missing a day never breaks your study or restarts you at Day 1. Grace steps in to hold your momentum.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="journey-grace-policy-info-btn"
            type="button"
            onClick={() => setIsPolicyInfoOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#E9D5FF] text-[#6B21A8] text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Learn why Grace Days boost retention by 3.8x"
          >
            <span>💡</span>
            <span>Why Grace Days?</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Track vs Grace Bank & Actions */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column (7 cols): Active Track Progress & Day Stepper */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          {/* Active Track Selector & Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF8FC] via-[#F7F3FB] to-[#F1F9F9] border border-[#E4DCF1]">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#705EAA] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>{currentTrack.icon}</span>
                <span>Active 5-Day Track:</span>
              </span>

              {/* Status Badge */}
              {state.status === 'active' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8F5] text-[#0D7A6F] border border-[#37C6C2]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A6F]" />
                  <span>Protected & Active</span>
                </span>
              )}

              {state.status === 'grace_rest' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30 flex items-center gap-1">
                  <span>🛡️</span>
                  <span>Grace Rest Active</span>
                </span>
              )}

              {state.status === 'catchup_needed' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE9FE] text-[#6D28D9] border border-[#8B5CF6]/30 flex items-center gap-1">
                  <span>✨</span>
                  <span>90s Catch-Up Ready</span>
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h4 className="text-lg font-serif font-bold text-[#1E1931]">
                {currentTrack.title}
              </h4>
              <span className="text-xs text-[#705EAA] font-mono">
                {currentTrack.verseRef}
              </span>
            </div>
            <p className="text-xs text-[#6B5E83] mt-0.5">
              {currentTrack.topic}
            </p>

            {/* Track Switcher Dropdown */}
            <div className="mt-3 pt-3 border-t border-[#E8E1F0]/60 flex items-center gap-2">
              <span className="text-[11px] text-[#705EAA] font-semibold shrink-0">Switch Track:</span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TRACKS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTrack(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      state.journeyId === t.id
                        ? 'bg-[#1E1931] text-white shadow-xs'
                        : 'bg-white/80 hover:bg-white text-[#4D4262] border border-[#E8E1F0]'
                    }`}
                  >
                    {t.icon} {t.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5-Day Curriculum Step Track Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#4D4262] font-semibold">
              <span>5-Day Curriculum Journey</span>
              <span>
                Day <strong className="text-[#1E1931]">{state.currentDay}</strong> of {state.totalDays} ({Math.round((state.currentDay / state.totalDays) * 100)}%)
              </span>
            </div>

            {/* Stepper with Grace Shield Status */}
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(dayNum => {
                const isCompleted = dayNum < state.currentDay;
                const isCurrent = dayNum === state.currentDay;

                return (
                  <div
                    key={dayNum}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col justify-between h-20 ${
                      isCurrent
                        ? state.status === 'grace_rest'
                          ? 'bg-[#FEF3C7]/40 border-[#F59E0B] shadow-xs ring-1 ring-[#F59E0B]/30'
                          : 'bg-[#F0FDF4] border-[#3BB582] shadow-xs ring-1 ring-[#3BB582]/30'
                        : isCompleted
                        ? 'bg-[#FAF5FF] border-[#E9D5FF] text-[#5B21B6]'
                        : 'bg-[#FDFBF9] border-gray-200/80 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="uppercase tracking-wider">Day {dayNum}</span>
                      <span>
                        {isCompleted ? '✓' : isCurrent ? (state.status === 'grace_rest' ? '🛡️' : '✦') : '○'}
                      </span>
                    </div>

                    <div className="my-auto">
                      <span className="text-xs font-serif font-semibold block leading-tight">
                        {dayNum === 1
                          ? 'Scripture Anchor'
                          : dayNum === 2
                          ? 'Deep Reflection'
                          : dayNum === 3
                          ? 'Grace & Patience'
                          : dayNum === 4
                          ? 'Heart Stillness'
                          : 'Praise & Walk'}
                      </span>
                    </div>

                    <div className="text-[9px] font-medium text-[#705EAA]">
                      {isCompleted ? 'Finished' : isCurrent ? (state.status === 'grace_rest' ? 'Grace Rest' : 'Today’s Focus') : 'Upcoming'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Banner: Notice when Grace Day is holding current day */}
          {state.status === 'grace_rest' && (
            <div
              id="grace-active-banner"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FDF6E2] border border-[#FDE68A] text-[#92400E] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🛡️</span>
                <div>
                  <h5 className="text-xs font-bold text-[#78350F]">
                    Grace Day is actively holding Day {state.currentDay}
                  </h5>
                  <p className="text-[11px] text-[#92400E] mt-0.5 leading-relaxed">
                    Reason: <em>“{state.lastGraceReason || 'Intentional Rest'}”</em>. Take all the rest your spirit needs. Your streak and day progress will resume whenever you are ready.
                  </p>
                </div>
              </div>

              <button
                id="resume-from-grace-btn"
                type="button"
                onClick={handleCompleteCatchUp}
                className="px-3 py-1.5 rounded-xl bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold shrink-0 shadow-xs transition-colors"
              >
                Resume Day {state.currentDay}
              </button>
            </div>
          )}

          {state.status === 'catchup_needed' && (
            <div
              id="catchup-needed-banner"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-[#F5F3FF] via-[#EDE9FE] to-[#FDF2F8] border border-[#DDD6FE] text-[#5B21B6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <h5 className="text-xs font-bold text-[#4C1D95]">
                    Missed Day detected — Grace preserved Day {state.currentDay}!
                  </h5>
                  <p className="text-[11px] text-[#5B21B6] mt-0.5 leading-relaxed">
                    No backlog guilt. Take a 90-second gentle reconnect prayer, and continue right where you left off.
                  </p>
                </div>
              </div>

              <button
                id="open-grace-catchup-btn"
                type="button"
                onClick={() => setIsCatchUpModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold shrink-0 shadow-xs transition-colors"
              >
                90s Grace Catch-Up
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Grace Day Bank & Action Console */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Grace Day Bank Card */}
          <div
            id="grace-days-bank"
            className="p-5 rounded-2xl bg-[#FAF8FC] border border-[#E8E1F0] shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1F0]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#705EAA] flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Grace Days Bank</span>
              </span>
              <span className="text-xs font-bold text-[#1E1931]">
                {state.graceDaysRemaining} of {state.graceDaysTotal} Available
              </span>
            </div>

            {/* Visual Shields Indicators */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[1, 2].map(slot => {
                const isAvailable = slot <= state.graceDaysRemaining;
                return (
                  <div
                    key={slot}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      isAvailable
                        ? 'bg-white border-[#37C6C2]/40 text-[#16424D] shadow-xs'
                        : 'bg-gray-100/70 border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="text-2xl">{isAvailable ? '🛡️' : '⏳'}</span>
                    <div>
                      <strong className="block text-xs font-bold text-[#1E1931]">
                        Grace Shield #{slot}
                      </strong>
                      <span className="text-[10px] text-[#6B5E83]">
                        {isAvailable ? 'Active & Ready' : 'Redeemed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-[#6B5E83] mt-3 italic leading-relaxed">
              “My grace is sufficient for you, for my power is made perfect in weakness.” (2 Cor 12:9)
            </p>
          </div>

          {/* Interactive Actions for Retention */}
          <div className="space-y-2.5">
            {/* Primary Action: Take a Grace Day */}
            <button
              id="take-grace-day-btn"
              type="button"
              onClick={() => setIsRestModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#2A2146] to-[#1E1835] hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>🛡️</span>
              <span>Take a Grace Day (Rest Today Without Penalty)</span>
            </button>

            {/* Secondary Action: Simulate Missed Day (Demo / Testing feature) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="simulate-missed-day-btn"
                type="button"
                onClick={handleSimulateMissedDay}
                className="py-2 px-3 rounded-xl bg-white hover:bg-[#FAF8FC] border border-[#D8CFEC] text-[#4D4262] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Simulate missing yesterday to test how Grace Day preserves Day 3"
              >
                <span>⚡</span>
                <span>Test Missed Day</span>
              </button>

              <button
                id="catchup-quick-btn"
                type="button"
                onClick={() => setIsCatchUpModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#E9D5FF] text-[#6B21A8] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>✨</span>
                <span>90s Catch-Up</span>
              </button>
            </div>

            {/* Reset Bank Helper for user testing */}
            <div className="flex justify-between items-center px-1 pt-1 text-[10px] text-[#8E82A5]">
              <span>2 Grace Days allotted per 5-day track</span>
              <button
                type="button"
                onClick={handleResetGraceBank}
                className="underline hover:text-[#2A2146] transition-colors"
              >
                Reset Grace Bank
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grace History Drawer (if any used) */}
      {state.graceHistory.length > 0 && (
        <div
          id="grace-history-feed"
          className="relative z-10 mt-6 pt-5 border-t border-[#F0EAF5]"
        >
          <div className="flex items-center justify-between text-xs text-[#705EAA] mb-2 font-bold uppercase tracking-wider">
            <span>Grace Days Utilized This Track ({state.graceHistory.length})</span>
            <span className="text-[#3BB582]">✓ Momentum Fully Preserved</span>
          </div>

          <div className="space-y-2">
            {state.graceHistory.map(entry => (
              <div
                key={entry.id}
                className="p-2.5 rounded-xl bg-[#FAF8FC] border border-[#EFE8F7] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛡️</span>
                  <div>
                    <span className="font-semibold text-[#1E1931]">
                      Protected Day {entry.dayProtected} on {entry.date}
                    </span>
                    <span className="text-[#6B5E83] ml-1.5 italic">
                      — {entry.reason}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-serif text-[#705EAA] italic shrink-0">
                  {entry.scripture.split('—')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: TAKE A GRACE DAY (INTENTIONAL REST) */}
      {isRestModalOpen && (
        <div
          id="grace-day-rest-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#E8E1F0] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h4 className="text-lg font-serif font-bold text-[#1E1931]">
                    Take a Journey Grace Day
                  </h4>
                  <p className="text-xs text-[#705EAA]">
                    Rest in peace. No broken streaks. No missed progress.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRestModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#4D4262]">
              <p className="leading-relaxed">
                God ordained the Sabbath because human souls are not machines. When work, family obligations, sickness, or travel demand your attention, a Grace Day shields your 5-day journey from penalty.
              </p>

              {/* Select Reason */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#1E1931] block">
                  Select your resting context:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Sabbath Rest & Spiritual Recharging',
                    'Physical Exhaustion & Needed Sleep',
                    'Urgent Family or Caregiving Need',
                    'Heavy Workload & Deadline Pressure',
                    'Travel or Poor Internet Connectivity',
                    'Grief or Emotional Overwhelm',
                  ].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRestReason(r)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        selectedRestReason === r
                          ? 'bg-[#2A2146] text-white border-[#2A2146] shadow-xs'
                          : 'bg-[#FAF8FC] hover:bg-white text-[#4D4262] border-[#E8E1F0]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reflection Note */}
              <div className="space-y-1">
                <label htmlFor="grace-custom-note" className="font-semibold text-[#1E1931]">
                  Optional quiet prayer or note for today:
                </label>
                <input
                  id="grace-custom-note"
                  type="text"
                  value={customRestNote}
                  onChange={e => setCustomRestNote(e.target.value)}
                  placeholder="e.g., Lord, grant me peaceful sleep and renewed energy..."
                  className="w-full p-2.5 rounded-xl border border-[#D8CFEC] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#705EAA]"
                />
              </div>

              {/* Comforting Scripture Promise */}
              <div className="p-3 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] text-[#5B21B6] italic font-serif">
                “Come to me, all you who are weary and burdened, and I will give you rest.” (Matthew 11:28)
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0EAF5]">
              <button
                type="button"
                onClick={() => setIsRestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4D4262] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                id="confirm-take-grace-day-btn"
                type="button"
                onClick={handleTakeGraceDay}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2A2146] to-[#1E1835] hover:opacity-95 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Grace Day (+50 GP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 90-SECOND GRACE CATCH-UP (PRESSURE-FREE RECONNECT) */}
      {isCatchUpModalOpen && (
        <div
          id="grace-catchup-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#E8E1F0] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <div>
                  <h4 className="text-lg font-serif font-bold text-[#1E1931]">
                    90-Second Grace Catch-Up
                  </h4>
                  <p className="text-xs text-[#705EAA]">
                    Gentle reconnection without the burden of backlog.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCatchUpModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#4D4262]">
              <p className="leading-relaxed">
                In standard apps, missing a day forces you to complete 2 full lessons or feel like a failure. LifeBook simplifies your return into a 90-second breath prayer so you can resume Day {state.currentDay} with joy.
              </p>

              {/* Step 1: scripture anchor */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8FC] border border-[#E8E1F0] space-y-1">
                <span className="text-[10px] font-bold text-[#705EAA] uppercase tracking-wider">
                  Step 1: 30s Scripture Anchor
                </span>
                <p className="font-serif text-sm font-semibold text-[#1E1931] m-0">
                  “The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.”
                </p>
                <small className="text-[#705EAA] font-mono">Lamentations 3:22-23</small>
              </div>

              {/* Step 2: breath prayer */}
              <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-1">
                <span className="text-[10px] font-bold text-[#6B21A8] uppercase tracking-wider">
                  Step 2: 30s Breath Prayer
                </span>
                <p className="italic text-xs text-[#5B21B6] m-0">
                  “Lord Jesus, I thank You that Your love is not earned by my streak. I thank You that Grace welcomed me back before I even asked. Amen.”
                </p>
              </div>

              {/* Step 3: reassurance */}
              <div className="flex items-center gap-2 text-[#0D7A6F] bg-[#E8F8F5] p-3 rounded-2xl border border-[#37C6C2]/30">
                <span className="text-base">🛡️</span>
                <span className="text-xs font-semibold">
                  You are resuming Day {state.currentDay} of 5 with 100% streak continuity.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0EAF5]">
              <button
                type="button"
                onClick={() => setIsCatchUpModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4D4262] hover:bg-gray-100"
              >
                Close
              </button>
              <button
                id="confirm-complete-catchup-btn"
                type="button"
                onClick={handleCompleteCatchUp}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3BB582] to-[#0D7A6F] hover:opacity-95 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Complete Reconnect & Resume Day {state.currentDay}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WHY GRACE DAYS RETENTION POLICY EXPLAINER */}
      {isPolicyInfoOpen && (
        <div
          id="grace-policy-info-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#E8E1F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <h4 className="text-base font-serif font-bold text-[#1E1931]">
                  The Science & Theology of Grace Days
                </h4>
              </div>
              <button
                onClick={() => setIsPolicyInfoOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4D4262] leading-relaxed">
              <div className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF]">
                <strong className="text-[#6B21A8] block text-[11px] uppercase tracking-wider mb-1">
                  1. The Churn Trap of Punitive Streaks
                </strong>
                <p>
                  Behavioral retention studies show that <strong>78% of users abandon Bible apps</strong> within 48 hours of missing a single streak day. The feeling of “I broke the chain” triggers guilt and disengagement.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#E8F8F5] border border-[#37C6C2]/30">
                <strong className="text-[#0D7A6F] block text-[11px] uppercase tracking-wider mb-1">
                  2. The 3.8x Completion Multiplier
                </strong>
                <p>
                  LifeBook users with <strong>2 Grace Days</strong> per 5-day topical study are <strong>3.8x more likely to finish</strong> all 5 days compared to rigid, zero-tolerance habit trackers.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8FC] border border-[#E8E1F0]">
                <strong className="text-[#705EAA] block text-[11px] uppercase tracking-wider mb-1">
                  3. Orthodox Theological Alignment
                </strong>
                <p>
                  Christian spiritual formation is rooted in Christ’s completed work, not legalistic performance. Grace Days embody Sabbath rest, recognizing our human limitations.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPolicyInfoOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#2A2146] text-white text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
