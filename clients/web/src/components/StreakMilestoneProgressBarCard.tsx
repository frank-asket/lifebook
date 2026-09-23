'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Flame,
  Sparkle,
  Crown,
  ShieldCheck,
  SlidersHorizontal,
} from '@phosphor-icons/react';

interface StreakMilestoneProgressBarCardProps {
  currentStreak: number;
  longestStreak: number;
  onCelebrateMilestone: (days: 7 | 30) => void;
  onSimulateStreak?: (days: number) => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  shape: 'circle' | 'star' | 'diamond' | 'rect';
}

// Celebratory audio chime for milestone completion
function playCelebrationChime(days: 7 | 30) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const freqs =
      days === 7
        ? [349.23, 440.0, 523.25, 659.25, 783.99] // 7-day Fmaj9 arpeggio
        : [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // 30-day C major triumph

    freqs.forEach((freq, idx) => {
      const noteTime = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = days === 7 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 2.1);
    });
  } catch {
    // audio fallback
  }
}

export function StreakMilestoneProgressBarCard({
  currentStreak,
  longestStreak,
  onCelebrateMilestone,
  onSimulateStreak,
}: StreakMilestoneProgressBarCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [activeCelebratingDay, setActiveCelebratingDay] = useState<7 | 30 | null>(null);
  const [showSimulateOptions, setShowSimulateOptions] = useState(false);

  const hasReached7Day = currentStreak >= 7 || longestStreak >= 7;
  const hasReached30Day = currentStreak >= 30 || longestStreak >= 30;

  const percent7 = Math.min(100, Math.round((currentStreak / 7) * 100));
  const percent30 = Math.min(100, Math.round((currentStreak / 30) * 100));

  const daysLeft7 = Math.max(0, 7 - currentStreak);
  const daysLeft30 = Math.max(0, 30 - currentStreak);

  // Confetti particle spawner
  const triggerConfetti = useCallback((days: 7 | 30) => {
    setActiveCelebratingDay(days);
    setIsConfettiActive(true);
    playCelebrationChime(days);

    setTimeout(() => {
      setIsConfettiActive(false);
      setActiveCelebratingDay(null);
    }, 4500);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const count = days === 30 ? 180 : 120;
    const palette =
      days === 30
        ? ['#FFD700', '#F59E0B', '#E3B15E', '#FFAA00', '#FFF5D6', '#9C74E8', '#FFFFFF', '#38BDF8']
        : ['#1FB6B0', '#37C6C2', '#0E7773', '#72D5CF', '#E3B15E', '#A8E5E0', '#FFFFFF'];

    const shapes: ConfettiParticle['shape'][] = ['circle', 'star', 'diamond', 'rect'];

    // Spawn from both sides and center
    for (let i = 0; i < count; i++) {
      const originX =
        i % 3 === 0
          ? rect.width * 0.2
          : i % 3 === 1
          ? rect.width * 0.8
          : rect.width * 0.5;
      const originY = rect.height * 0.4;

      const angle =
        originX < rect.width * 0.4
          ? Math.random() * (Math.PI / 2) - Math.PI / 6
          : originX > rect.width * 0.6
          ? Math.PI - Math.random() * (Math.PI / 2) + Math.PI / 6
          : -Math.PI / 2 + (Math.random() - 0.5) * 1.2;

      const speed = 4 + Math.random() * 9;

      particlesRef.current.push({
        x: originX + (Math.random() - 0.5) * 30,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed - 2.5 - Math.random() * 3,
        size: Math.random() * 7 + 4,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: 0.007 + Math.random() * 0.008,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.08 + Math.random() * 0.08,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
  }, []);

  // Run canvas confetti physics animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.parentElement?.clientHeight || 450;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!running) return;
      const rectW = canvas.parentElement?.clientWidth || window.innerWidth;
      const rectH = canvas.parentElement?.clientHeight || 450;

      ctx.clearRect(0, 0, rectW, rectH);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.vx *= 0.985; // air resistance
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        if (p.alpha <= 0 || p.y > rectH + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        const w = p.size * (1 + Math.sin(p.wobble) * 0.3);
        const h = p.size;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          // 5-point star
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(
              Math.cos(((18 + s * 72) * Math.PI) / 180) * (p.size * 0.9),
              -Math.sin(((18 + s * 72) * Math.PI) / 180) * (p.size * 0.9)
            );
            ctx.lineTo(
              Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.45),
              -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.45)
            );
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.7, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.7, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // rect streamer
          ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        ctx.restore();
      }

      if (particles.length === 0) {
        setIsConfettiActive(false);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Automatic celebration check when user reaches 7 or 30 days
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      if (currentStreak >= 30) {
        const key = 'lifebook.milestoneCelebrated_30';
        if (localStorage.getItem(key) !== 'true') {
          localStorage.setItem(key, 'true');
          timer = setTimeout(() => {
            triggerConfetti(30);
          }, 200);
        }
      } else if (currentStreak >= 7) {
        const key = 'lifebook.milestoneCelebrated_7';
        if (localStorage.getItem(key) !== 'true') {
          localStorage.setItem(key, 'true');
          timer = setTimeout(() => {
            triggerConfetti(7);
          }, 200);
        }
      }
    } catch {
      // ignore
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentStreak, triggerConfetti]);

  const handleCelebrate = (days: 7 | 30) => {
    triggerConfetti(days);
    onCelebrateMilestone(days);
  };

  return (
    <div
      id="streak-milestone-progress-card"
      className="relative rounded-3xl bg-gradient-to-br from-[#211A3A] via-[#2A2048] to-[#142A35] p-6 sm:p-7 text-white shadow-xl border border-white/10 overflow-hidden"
    >
      {/* Confetti Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-30 w-full h-full"
      />

      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#1FB6B0]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-[#E3B15E]/15 blur-3xl" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1FB6B0]/20 border border-[#1FB6B0]/40 text-[#37C6C2] text-[11px] font-extrabold uppercase tracking-widest">
            <Sparkle weight="bold" className="w-3.5 h-3.5" />
            <span>Streak Milestone Engine</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-2 flex items-center gap-2">
            <span>Devotional Milestone Progress</span>
            <span className="text-sm font-sans font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-[#FFD700] border border-white/15 inline-flex items-center gap-1.5">
              <Flame weight="fill" className="w-4 h-4 text-[#FFD700]" />
              <span>{currentStreak} Days</span>
            </span>
          </h3>
          <p className="text-xs text-[#C5BCD9] mt-1 max-w-xl">
            Track your journey toward the <strong>7-Day Sabbath Rhythm</strong> and <strong>30-Day Spiritual Pillar</strong>. Celebrate each victory with joyful confetti and sacred Scripture fanfares.
          </p>
        </div>

        {/* Action / Simulation Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {onSimulateStreak && (
            <button
              type="button"
              id="toggle-simulate-streak-btn"
              onClick={() => setShowSimulateOptions(!showSimulateOptions)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer flex items-center gap-1.5"
              title="Test milestone progress states"
            >
              <SlidersHorizontal weight="bold" className="w-3.5 h-3.5" />
              <span>{showSimulateOptions ? 'Hide Test Tools' : 'Test Milestones'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Active Celebration Banner */}
      {isConfettiActive && activeCelebratingDay && (
        <div
          id="active-streak-celebration-toast"
          className="relative z-20 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#FFD700]/25 via-[#1FB6B0]/30 to-[#E3B15E]/25 border border-[#FFD700]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-bold text-white">
                Milestone Celebration Active: {activeCelebratingDay}-Day Devotional Streak!
              </p>
              <p className="text-xs text-amber-200">
                {activeCelebratingDay === 30
                  ? '30-Day Spiritual Pillar Unlocked! +200 Grace Points & Diamond Sanctuary Halo.'
                  : '7-Day Sabbath Rhythm Unlocked! +50 Grace Points & Bronze Halo.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCelebrate(activeCelebratingDay)}
            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            Replay Confetti ✦
          </button>
        </div>
      )}

      {/* Simulator Quick Testing Bar (optional developer / review helper) */}
      {showSimulateOptions && onSimulateStreak && (
        <div className="relative z-10 mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-fade-in">
          <span className="text-[#C4B7DF] font-semibold flex items-center gap-1.5">
            <span>🧪</span>
            <span>Simulate Streak:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSimulateStreak(3)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
            >
              Day 3 (In Progress)
            </button>
            <button
              type="button"
              onClick={() => {
                onSimulateStreak(7);
                triggerConfetti(7);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#1FB6B0]/30 hover:bg-[#1FB6B0]/40 text-[#72D5CF] border border-[#1FB6B0]/50 font-bold transition-all cursor-pointer"
            >
              Day 7 (Unlock 7-Day 🎉)
            </button>
            <button
              type="button"
              onClick={() => onSimulateStreak(18)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
            >
              Day 18 (Approaching 30)
            </button>
            <button
              type="button"
              onClick={() => {
                onSimulateStreak(30);
                triggerConfetti(30);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#E3B15E]/30 hover:bg-[#E3B15E]/40 text-[#FFD700] border border-[#E3B15E]/50 font-bold transition-all cursor-pointer"
            >
              Day 30 (Unlock 30-Day 🏆)
            </button>
          </div>
        </div>
      )}

      {/* Active Milestone Highlight Banner (if 7 or 30 days reached) */}
      {(hasReached7Day || hasReached30Day) && (
        <div
          id="milestone-active-celebration-banner"
          className="relative z-10 mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#1FB6B0]/20 via-[#E3B15E]/20 to-[#8B5CF6]/20 border border-[#1FB6B0]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#E3B15E] text-white flex items-center justify-center shadow-xs shrink-0">
              {hasReached30Day ? <Crown weight="fill" className="w-5 h-5 text-white" /> : <ShieldCheck weight="fill" className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFD700]">
                  Milestone Achieved
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#1FB6B0]/30 text-[#72D5CF] text-[10px] font-bold">
                  {hasReached30Day ? '30-Day Spiritual Pillar' : '7-Day Sabbath Rhythm'}
                </span>
              </div>
              <p className="text-xs text-white font-medium mt-0.5">
                {hasReached30Day
                  ? '“Like a tree planted by streams of water, yielding fruit in season.” (Psalm 1:3)'
                  : '“So on the seventh day he rested from all his work.” (Genesis 2:2)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasReached7Day && (
              <button
                type="button"
                id="banner-celebrate-7day-confetti-btn"
                onClick={() => handleCelebrate(7)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1FB6B0] to-[#0E7773] hover:opacity-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Sparkle weight="fill" className="w-4 h-4 text-white" />
                <span>Confetti (7-Day)</span>
              </button>
            )}
            {hasReached30Day && (
              <button
                type="button"
                id="banner-celebrate-30day-confetti-btn"
                onClick={() => handleCelebrate(30)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E3B15E] to-[#B88424] hover:opacity-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Trophy weight="fill" className="w-4 h-4 text-white" />
                <span>Confetti (30-Day)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* DUAL PROGRESS BARS GRID: 7-DAY & 30-DAY */}
      <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* MILESTONE 1: 7-DAY SABBATH RHYTHM PROGRESS BAR */}
        <div
          id="milestone-progress-7day-card"
          className={`rounded-2xl p-5 border transition-all ${
            hasReached7Day
              ? 'bg-[#122A30]/80 border-[#1FB6B0]/50 shadow-md ring-1 ring-[#1FB6B0]/30'
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#1FB6B0]/20 border border-[#1FB6B0]/40 text-[#72D5CF] flex items-center justify-center text-lg">
                <ShieldCheck weight="fill" className="w-4 h-4 text-[#72D5CF]" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>7-Day Sabbath Rhythm</span>
                  {hasReached7Day && <span className="text-[#37C6C2] text-xs">✓ Unlocked</span>}
                </h4>
                <p className="text-[11px] text-[#A69BBF]">Silver Cadence · 1 Full Week</p>
              </div>
            </div>

            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                hasReached7Day
                  ? 'bg-[#1FB6B0] text-[#0C242B]'
                  : 'bg-white/10 text-[#72D5CF]'
              }`}
            >
              {percent7}%
            </span>
          </div>

          {/* Visual Progress Bar Track */}
          <div className="mt-4">
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] via-[#37C6C2] to-[#72D5CF] transition-all duration-700 ease-out relative shadow-[0_0_12px_rgba(31,182,176,0.5)]"
                style={{ width: `${percent7}%` }}
              >
                {/* Shimmer pulse effect */}
                <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Stepper info */}
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[#C5BCD9]">
              <span>
                {currentStreak} of 7 Days Completed
              </span>
              <span>
                {hasReached7Day ? (
                  <span className="text-[#72D5CF] font-bold">Week Complete! 🕊️</span>
                ) : (
                  <span>{daysLeft7} day{daysLeft7 === 1 ? '' : 's'} remaining</span>
                )}
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#A69BBF] italic">
              Reward: +75 GP & Silver Seal
            </span>
            <button
              type="button"
              id="celebrate-7day-action-btn"
              onClick={() => handleCelebrate(7)}
              className="px-3 py-1.5 rounded-xl bg-[#1FB6B0]/20 hover:bg-[#1FB6B0]/35 border border-[#1FB6B0]/40 text-[#72D5CF] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{hasReached7Day ? '🎉' : '✨'}</span>
              <span>{hasReached7Day ? 'Celebrate 7-Day Confetti' : 'Preview Celebration'}</span>
            </button>
          </div>
        </div>

        {/* MILESTONE 2: 30-DAY SPIRITUAL PILLAR PROGRESS BAR */}
        <div
          id="milestone-progress-30day-card"
          className={`rounded-2xl p-5 border transition-all ${
            hasReached30Day
              ? 'bg-[#2E2416]/80 border-[#E3B15E]/50 shadow-md ring-1 ring-[#E3B15E]/30'
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#E3B15E]/20 border border-[#E3B15E]/40 text-[#FFD700] flex items-center justify-center text-lg">
                <Crown weight="fill" className="w-4 h-4 text-[#FFD700]" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>30-Day Spiritual Pillar</span>
                  {hasReached30Day && <span className="text-[#FFD700] text-xs">✓ Unlocked</span>}
                </h4>
                <p className="text-[11px] text-[#A69BBF]">Gold Anchor · 1 Full Month</p>
              </div>
            </div>

            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                hasReached30Day
                  ? 'bg-[#E3B15E] text-[#241A06]'
                  : 'bg-white/10 text-[#FFD700]'
              }`}
            >
              {percent30}%
            </span>
          </div>

          {/* Visual Progress Bar Track */}
          <div className="mt-4">
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B88424] via-[#E3B15E] to-[#FFD700] transition-all duration-700 ease-out relative shadow-[0_0_12px_rgba(227,177,94,0.5)]"
                style={{ width: `${percent30}%` }}
              >
                {/* Shimmer pulse effect */}
                <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Stepper info */}
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[#C5BCD9]">
              <span>
                {currentStreak} of 30 Days Completed
              </span>
              <span>
                {hasReached30Day ? (
                  <span className="text-[#FFD700] font-bold">Month Complete! 🏛️</span>
                ) : (
                  <span>{daysLeft30} day{daysLeft30 === 1 ? '' : 's'} remaining</span>
                )}
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#A69BBF] italic">
              Reward: +150 GP & Gold Pillar
            </span>
            <button
              type="button"
              id="celebrate-30day-action-btn"
              onClick={() => handleCelebrate(30)}
              className="px-3 py-1.5 rounded-xl bg-[#E3B15E]/20 hover:bg-[#E3B15E]/35 border border-[#E3B15E]/40 text-[#FFD700] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{hasReached30Day ? '🏆' : '✨'}</span>
              <span>{hasReached30Day ? 'Celebrate 30-Day Confetti' : 'Preview Celebration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
