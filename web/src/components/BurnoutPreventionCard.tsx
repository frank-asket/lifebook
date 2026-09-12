'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { DayActivityRecord } from './ProgressScreen';

interface BurnoutPreventionCardProps {
  calendarRecords: Record<string, DayActivityRecord>;
  todayStr: string;
  currentStreak: number;
  gracePoints: number;
  onHonorSabbath: (dateStr?: string) => void;
  onCancelSabbath: (dateStr?: string) => void;
  onOpenJournal?: () => void;
}

// Gentle Web Audio API Synthesizer: 432Hz harmonic singing bowl chime
function playPeaceChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic frequencies: 432Hz (root), 648Hz (fifth), 864Hz (octave)
    [432, 648, 864].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const baseVolume = i === 0 ? 0.14 : i === 1 ? 0.08 : 0.04;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(baseVolume, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.0);
    });
  } catch {
    // AudioContext permission fallback
  }
}

export function BurnoutPreventionCard({
  calendarRecords,
  todayStr,
  currentStreak,
  gracePoints,
  onHonorSabbath,
  onCancelSabbath,
  onOpenJournal,
}: BurnoutPreventionCardProps) {
  // Test simulation toggle
  const [burnoutSimulated, setBurnoutSimulated] = useState(false);

  // Visualizer resting mode: 'orb' | 'waters' | 'candle'
  const [restMode, setRestMode] = useState<'orb' | 'waters' | 'candle'>('orb');

  // Guided resting silence timer (60s)
  const [restTimerSeconds, setRestTimerSeconds] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [chimeFeedback, setChimeFeedback] = useState(false);

  // 10-second breathing rhythm cycle
  // 0-3s: Inhale (4s)
  // 4-5s: Hold (2s)
  // 6-9s: Exhale (4s)
  const [breathSecond, setBreathSecond] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathSecond(prev => (prev + 1) % 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Guided resting timer countdown
  useEffect(() => {
    if (!isTimerActive) return;

    const timer = setInterval(() => {
      setRestTimerSeconds(prev => {
        if (prev <= 1) {
          setIsTimerActive(false);
          playPeaceChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive]);

  // Handle playing chime with visual confirmation
  function handlePlayChime() {
    playPeaceChime();
    setChimeFeedback(true);
    setTimeout(() => setChimeFeedback(false), 2400);
  }

  // Calculate streak intensity and burnout metrics from calendarRecords
  const burnoutAnalysis = useMemo(() => {
    let consecutiveActiveDays = 0;
    let highIntensityDays7 = 0;
    let totalIntensity7 = 0;
    let foundRest = false;

    // Check last 14 days
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      const rec = calendarRecords[k];

      const isSabbath = Boolean(rec?.isSabbathRest);
      const isActive = Boolean(rec && rec.intensity > 0 && !isSabbath);

      if (!foundRest) {
        if (!isActive || isSabbath) {
          foundRest = true;
        } else {
          consecutiveActiveDays++;
        }
      }

      if (i < 7) {
        const intensity = rec?.intensity || 0;
        totalIntensity7 += intensity;
        if (intensity >= 3) {
          highIntensityDays7++;
        }
      }
    }

    const todayRec = calendarRecords[todayStr];
    const isSabbathToday = Boolean(todayRec?.isSabbathRest);
    const avgIntensity7 = Number((totalIntensity7 / 7).toFixed(1));

    // Thresholds:
    // User is in high intensity run if consecutive active days >= 6 OR >= 4 high intensity days in the last 7 days
    const isHighIntensityDetected =
      !isSabbathToday && (burnoutSimulated || consecutiveActiveDays >= 6 || highIntensityDays7 >= 4);

    const riskLevel: 'elevated' | 'moderate' | 'balanced' = isSabbathToday
      ? 'balanced'
      : isHighIntensityDetected
      ? 'elevated'
      : consecutiveActiveDays >= 4 || highIntensityDays7 >= 3
      ? 'moderate'
      : 'balanced';

    return {
      consecutiveActiveDays,
      highIntensityDays7,
      avgIntensity7,
      isSabbathToday,
      isHighIntensityDetected,
      riskLevel,
    };
  }, [calendarRecords, todayStr, burnoutSimulated]);

  // Dynamic breath instruction
  const breathPhase = breathSecond < 4 ? 'inhale' : breathSecond < 6 ? 'hold' : 'exhale';
  const breathText =
    breathPhase === 'inhale'
      ? 'Inhale Grace · Receive God’s Unmerited Favor (4s)'
      : breathPhase === 'hold'
      ? 'Hold in Stillness · Be Still and Know He is God (2s)'
      : 'Exhale Striving · Release Burdens and Performance (4s)';

  const breathPillClass =
    breathPhase === 'inhale'
      ? 'bg-[#1FB6B0]/30 text-[#43E4DC] border-[#1FB6B0]/50'
      : breathPhase === 'hold'
      ? 'bg-[#E3B15E]/30 text-[#FFD078] border-[#E3B15E]/50'
      : 'bg-[#8E7BB7]/30 text-[#D8C7FF] border-[#8E7BB7]/50';

  return (
    <section
      id="burnout-prevention-card"
      className={`relative rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl p-6 sm:p-8 ${
        burnoutAnalysis.isSabbathToday
          ? 'bg-gradient-to-br from-[#1B1832] via-[#201D3D] to-[#122A30] border-[#3ED1C8]/40 shadow-[0_15px_35px_-5px_rgba(62,209,200,0.18)]'
          : burnoutAnalysis.isHighIntensityDetected
          ? 'bg-gradient-to-br from-[#231731] via-[#2C1F3D] to-[#1C2538] border-[#E3B15E]/50 shadow-[0_15px_35px_-5px_rgba(227,177,94,0.18)]'
          : 'bg-gradient-to-br from-[#1C172E] via-[#231E3B] to-[#1B2933] border-[#3D3559]'
      } text-white`}
    >
      {/* Background celestial ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#1FB6B0]/15 to-[#E3B15E]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-[#8E7BB7]/15 to-transparent blur-3xl"
      />

      {/* TOP BAR: Badge, Status, and Pacing Metrics */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#45D6D0]">
              Burnout Prevention & Holy Rest
            </span>
            <span>·</span>
            {burnoutAnalysis.isSabbathToday ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1FB6B0]/30 text-[#43E4DC] border border-[#1FB6B0]/60 shadow-xs">
                <span>🕊️</span>
                <span>Sabbath Day Active · Streak Sheltered</span>
              </span>
            ) : burnoutAnalysis.isHighIntensityDetected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F28C38]/30 text-[#FFAE66] border border-[#F28C38]/60 animate-pulse">
                <span>⚠️</span>
                <span>Long High-Intensity Streak Detected · Sabbath Day Recommended</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-[#C5BDD8] border border-white/15">
                <span>🌿</span>
                <span>Spiritual Pacing: Balanced Rhythm</span>
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            {burnoutAnalysis.isSabbathToday
              ? 'Sabbath Sanctuary: Soul Rest in Christ'
              : burnoutAnalysis.isHighIntensityDetected
              ? 'Invitation to Holy Rest: Trade Striving for Abiding'
              : 'Spiritual Pacing & Sabbath Monitor'}
          </h3>
          <p className="text-xs text-[#CBC1DF] mt-1 max-w-2xl leading-relaxed">
            {burnoutAnalysis.isSabbathToday
              ? 'Today is consecrated as intentional Sabbath rest. Your continuous streak remains fully protected by grace while your spirit recharges.'
              : burnoutAnalysis.isHighIntensityDetected
              ? `You’ve sustained ${burnoutAnalysis.consecutiveActiveDays} consecutive days of high devotional intensity without a rest pause. God instituted the Sabbath so His children would never reduce faith to exhausting performance.`
              : `You’ve completed ${burnoutAnalysis.consecutiveActiveDays} consecutive days of practice. Keep listening to your soul—remember to weave holy rest into your weekly journey.`}
          </p>
        </div>

        {/* Pacing Metrics Cluster & Simulation Trigger */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-3.5 py-2.5 rounded-2xl backdrop-blur-xs">
            <div className="text-center px-1">
              <span className="text-[10px] uppercase font-semibold text-[#A89EC0]">Active Run</span>
              <p className="text-base font-bold font-serif text-[#FFAE66]">
                {burnoutAnalysis.consecutiveActiveDays}d
              </p>
            </div>
            <div className="w-[1px] h-6 bg-white/20" />
            <div className="text-center px-1">
              <span className="text-[10px] uppercase font-semibold text-[#A89EC0]">7d Avg</span>
              <p className="text-base font-bold font-serif text-[#3ED1C8]">
                {burnoutAnalysis.avgIntensity7}/4
              </p>
            </div>
            <div className="w-[1px] h-6 bg-white/20" />
            <div className="text-center px-1">
              <span className="text-[10px] uppercase font-semibold text-[#A89EC0]">Grace Points</span>
              <p className="text-base font-bold font-serif text-[#FFD078]">
                {gracePoints}
              </p>
            </div>
          </div>

          {/* Test Simulation Mode Toggle */}
          <button
            type="button"
            onClick={() => setBurnoutSimulated(prev => !prev)}
            title="Toggle simulation to test the Burnout Prevention prompt and resting animation"
            className={`px-3 py-2 rounded-2xl text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-xs ${
              burnoutSimulated
                ? 'bg-[#E3B15E] text-[#1E1931] border-[#FFD078] ring-2 ring-[#FFD078]/50'
                : 'bg-white/10 hover:bg-white/20 text-[#D8CFEA] border-white/15'
            }`}
          >
            <span>🧪</span>
            <span>{burnoutSimulated ? 'Simulating High Load' : 'Test Alert State'}</span>
          </button>
        </div>
      </div>

      {/* MAIN BODY: 2-Column Grid (Visualizer & Theological Reward Actions) */}
      <div className="relative z-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* LEFT COLUMN: THE RESTING ANIMATION VISUALIZER (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#130E24]/80 border border-white/10 shadow-inner">
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/10 mb-6 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setRestMode('orb')}
              className={`px-3 py-1 rounded-full transition-all ${
                restMode === 'orb'
                  ? 'bg-[#1FB6B0] text-white shadow-xs'
                  : 'text-[#B4A7CE] hover:text-white'
              }`}
            >
              Sanctuary Breath
            </button>
            <button
              type="button"
              onClick={() => setRestMode('waters')}
              className={`px-3 py-1 rounded-full transition-all ${
                restMode === 'waters'
                  ? 'bg-[#1FB6B0] text-white shadow-xs'
                  : 'text-[#B4A7CE] hover:text-white'
              }`}
            >
              Still Waters
            </button>
            <button
              type="button"
              onClick={() => setRestMode('candle')}
              className={`px-3 py-1 rounded-full transition-all ${
                restMode === 'candle'
                  ? 'bg-[#1FB6B0] text-white shadow-xs'
                  : 'text-[#B4A7CE] hover:text-white'
              }`}
            >
              Holy Candle
            </button>
          </div>

          {/* Animated Sanctuary Stage */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            
            {/* Ripple Rings */}
            <div
              aria-hidden="true"
              className="sabbath-ripple-1 absolute w-36 h-36 rounded-full border border-[#1FB6B0]/40 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="sabbath-ripple-2 absolute w-36 h-36 rounded-full border border-[#E3B15E]/30 pointer-events-none"
            />

            {/* Central Animated Element based on restMode */}
            {restMode === 'orb' && (
              <div className="sabbath-breathe-orb relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#166B67] via-[#1FB6B0] to-[#E3B15E] flex flex-col items-center justify-center text-center p-4 border-2 border-white/40 shadow-2xl">
                <span className="text-3xl select-none sabbath-float">🕊️</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white mt-0.5">
                  Sabbath
                </span>
                <span className="text-[9px] text-[#E0F8F6] opacity-90">Holy Rest</span>
              </div>
            )}

            {restMode === 'waters' && (
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-b from-[#144754] via-[#1FB6B0] to-[#0D383F] flex flex-col items-center justify-center text-center p-4 border border-[#3ED1C8]/60 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.25),transparent_70%)]" />
                <span className="relative z-10 text-3xl sabbath-float">🌊</span>
                <span className="relative z-10 text-[10px] font-bold text-white mt-1">Psalm 23:2</span>
                <span className="relative z-10 text-[9px] text-[#C2FAF6]">Still Waters</span>
              </div>
            )}

            {restMode === 'candle' && (
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[#2D1B13] via-[#482813] to-[#25150C] flex flex-col items-center justify-center text-center p-4 border border-[#E3B15E]/60 shadow-2xl overflow-hidden">
                <div className="sabbath-golden-ray absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(227,177,94,0.2),transparent)]" />
                <span className="relative z-10 text-3xl flame-streak-indicator">🕯️</span>
                <span className="relative z-10 text-[10px] font-bold text-[#FFD078] mt-1">Light of Christ</span>
                <span className="relative z-10 text-[9px] text-[#FFE8B8]">Gentle Peace</span>
              </div>
            )}
          </div>

          {/* Breathing Guide Synchronized Ticker */}
          <div className="mt-5 w-full text-center">
            <div
              className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border transition-colors duration-300 ${breathPillClass}`}
            >
              {breathText}
            </div>
          </div>

          {/* Audio Chime & Guided Silence Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handlePlayChime}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                chimeFeedback
                  ? 'bg-[#1FB6B0] text-white border-[#1FB6B0] scale-105 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-[#D8CFEA] border-white/15'
              }`}
            >
              <span>🔔</span>
              <span>{chimeFeedback ? 'Chime Resonating...' : 'Peace Chime (432Hz)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isTimerActive) {
                  setIsTimerActive(false);
                } else {
                  if (restTimerSeconds === 0) setRestTimerSeconds(60);
                  setIsTimerActive(true);
                  playPeaceChime();
                }
              }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#D8CFEA] border border-white/15 transition-all flex items-center gap-1.5"
            >
              <span>⏱️</span>
              <span>
                {isTimerActive
                  ? `Resting... ${restTimerSeconds}s (Pause)`
                  : restTimerSeconds < 60
                  ? `Resume (${restTimerSeconds}s)`
                  : '1-Min Sacred Silence'}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: THEOLOGY, INTENTIONAL REWARD, AND GRACE SHIELD (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Scripture Anchor Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E3B15E]">
              <span>📖</span>
              <span>Matthew 11:28 · The Master’s Promise</span>
            </div>
            <p className="text-sm italic text-[#F1EDF9] leading-relaxed">
              “Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls.”
            </p>
            <p className="text-xs text-[#B2A4CA] pt-1 border-t border-white/10">
              <strong>Spiritual Truth:</strong> God rested on the seventh day not because He was tired, but because His creative work was complete. When you practice Sabbath, you declare that Jesus is your righteousness, not your daily output.
            </p>
          </div>

          {/* REWARD BREAKDOWN & CALL TO ACTION */}
          {!burnoutAnalysis.isSabbathToday ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Reward Item 1: Streak Grace Shield */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#1FB6B0]/20 text-[#3ED1C8] flex items-center justify-center text-base shrink-0 border border-[#1FB6B0]/30">
                    🛡️
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white">Streak Grace Shield</h5>
                    <p className="text-[11px] text-[#B8ACCB] mt-0.5">
                      Your {currentStreak}-day continuous streak does NOT break. Sabbath rest is counted as faithful obedience.
                    </p>
                  </div>
                </div>

                {/* Reward Item 2: Grace Points Bonus */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#E3B15E]/20 text-[#FFD078] flex items-center justify-center text-base shrink-0 border border-[#E3B15E]/30">
                    🪙
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white">+50 Grace Points</h5>
                    <p className="text-[11px] text-[#B8ACCB] mt-0.5">
                      Rewarded instantly for choosing intentional spiritual rest over self-reliance.
                    </p>
                  </div>
                </div>

                {/* Reward Item 3: Sabbath Peace Badge */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#8E7BB7]/20 text-[#D8C7FF] flex items-center justify-center text-base shrink-0 border border-[#8E7BB7]/30">
                    🏆
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white">Sabbath Peace Badge</h5>
                    <p className="text-[11px] text-[#B8ACCB] mt-0.5">
                      Unlocks the commemorative milestone badge on your spiritual trophy shelf.
                    </p>
                  </div>
                </div>

                {/* Reward Item 4: Soul Restoration Reflection */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#F28C38]/20 text-[#FFAE66] flex items-center justify-center text-base shrink-0 border border-[#F28C38]/30">
                    ✍️
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white">Soul Journal Entry</h5>
                    <p className="text-[11px] text-[#B8ACCB] mt-0.5">
                      Autosaves a peaceful reflection entry in your journal commemorating this day of rest.
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON: Honor Sabbath Rest Today */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  id="btn-honor-sabbath-today"
                  onClick={() => onHonorSabbath(todayStr)}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1FB6B0] via-[#24C2BB] to-[#E3B15E] hover:brightness-110 active:scale-95 text-[#141022] font-bold text-sm transition-all shadow-[0_10px_25px_-4px_rgba(31,182,176,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">🕊️</span>
                  <span>Honor Sabbath Day Today (+50 Grace Points & Shield)</span>
                </button>
              </div>
            </div>
          ) : (
            /* CELEBRATION REWARD CARD (WHEN SABBATH IS ACTIVE TODAY) */
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1B2F38] via-[#242A46] to-[#2B1F3F] border border-[#3ED1C8]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#1FB6B0] text-[#141022] flex items-center justify-center text-xl shadow-md">
                    🕊️
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Sabbath Rest Honored & Sheltered
                    </h4>
                    <span className="text-xs text-[#3ED1C8] font-medium">
                      Streak Protected by Grace · Holy Limits Kept
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E3B15E]/25 text-[#FFD078] border border-[#E3B15E]/40">
                  +50 Points Claimed
                </span>
              </div>

              <p className="text-xs text-[#E1DAF0] leading-relaxed">
                You’ve laid down striving today. Your <strong>{currentStreak}-day devotional streak</strong> is safe under God’s grace shield. Remember: the Sabbath was made for you, to breathe and commune with your Creator without deadlines.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {onOpenJournal && (
                  <button
                    type="button"
                    onClick={onOpenJournal}
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    <span>✍️</span>
                    <span>View Sabbath Journal Reflection</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onCancelSabbath(todayStr)}
                  className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/10 text-xs text-[#BBAFCF] hover:text-white transition-all underline decoration-white/30"
                >
                  ↩ Resume Regular Logging
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
