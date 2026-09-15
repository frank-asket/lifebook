'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface StreakMilestoneConfig {
  days: 7 | 30;
  title: string;
  subtitle: string;
  tier: string;
  icon: string;
  badgeEmoji: string;
  primaryColor: string;
  accentColor: string;
  gradientBg: string;
  haloColor: string;
  rewardPoints: number;
  scripture: string;
  scriptureRef: string;
  reflection: string;
  unlockedPerks: string[];
}

export const MILESTONE_CONFIGS: Record<7 | 30, StreakMilestoneConfig> = {
  7: {
    days: 7,
    title: '7-Day Sabbath Rhythm',
    subtitle: 'One Full Week of Daily Devotion',
    tier: 'Silver Cadence',
    icon: '🌿',
    badgeEmoji: '🕊️',
    primaryColor: '#1FB6B0',
    accentColor: '#72D5CF',
    gradientBg: 'from-[#0C242B] via-[#16383E] to-[#1C1635]',
    haloColor: 'rgba(31, 182, 176, 0.45)',
    rewardPoints: 75,
    scripture: 'By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.',
    scriptureRef: 'Genesis 2:2',
    reflection: 'Seven continuous days walking with God. You have traded anxious hurry for a sacred cadence of daily Scripture, prayer, and holy rest.',
    unlockedPerks: [
      '+75 Grace Points awarded to your Sanctuary',
      'Silver Cadence Seal unlocked in Trophy Cabinet',
      'Sabbath Peace Shield recharged for 1 rest day',
    ],
  },
  30: {
    days: 30,
    title: '30-Day Spiritual Pillar',
    subtitle: 'A Full Month Rooted in Christ',
    tier: 'Gold Anchor',
    icon: '👑',
    badgeEmoji: '🏛️',
    primaryColor: '#E3B15E',
    accentColor: '#FFD700',
    gradientBg: 'from-[#2A1D0B] via-[#3D2910] to-[#201538]',
    haloColor: 'rgba(227, 177, 94, 0.55)',
    rewardPoints: 150,
    scripture: 'He is like a tree planted by streams of water that yields its fruit in its season, and its leaf does not wither.',
    scriptureRef: 'Psalm 1:3',
    reflection: 'Thirty days of steadfast daily communion. What began as a mustard-seed step has grown into a deep-rooted spiritual pillar in your life.',
    unlockedPerks: [
      '+150 Grace Points awarded to your Sanctuary',
      'Gold Anchor Seal unlocked in Trophy Cabinet',
      'Golden Pillar Glow badge for your profile',
    ],
  },
};

interface StreakMilestoneAnimationProps {
  milestoneDays: 7 | 30 | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimReward?: (points: number, milestoneDays: 7 | 30) => void;
}

// Play celebratory chime via Web Audio API
function playMilestoneChime(days: 7 | 30) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (days === 7) {
      // 7-day chime: Silver Cadence (Fmaj9 arpeggio: F4, A4, C5, E5, G5)
      const freqs = [349.23, 440.0, 523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const noteTime = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.9);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 2.1);
      });
    } else {
      // 30-day chime: Gold Anchor Triumph (C4, G4, C5, E5, G5, C6)
      const freqs = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const noteTime = now + idx * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 2.6);
      });
    }
  } catch {
    // Audio fallback
  }
}

interface Particle {
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
  shape: 'circle' | 'star' | 'leaf' | 'diamond' | 'rect';
}

export function StreakMilestoneAnimation({
  milestoneDays,
  isOpen,
  onClose,
  onClaimReward,
}: StreakMilestoneAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const config = milestoneDays ? MILESTONE_CONFIGS[milestoneDays] : null;

  // Sound fanfare on open
  useEffect(() => {
    if (isOpen && config && !isMuted) {
      const timer = setTimeout(() => {
        playMilestoneChime(config.days);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, config, isMuted]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Spawn confetti burst
  const spawnBurst = useCallback(
    (count = 140) => {
      const canvas = canvasRef.current;
      if (!canvas || !config) return;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height * 0.38;

      const palette7 = [
        '#1FB6B0',
        '#37C6C2',
        '#0E7773',
        '#72D5CF',
        '#E3B15E',
        '#F3FAF9',
        '#A8E5E0',
        '#FFFFFF',
      ];
      const palette30 = [
        '#E3B15E',
        '#FFD700',
        '#F5BD47',
        '#FFAA00',
        '#FFF5D6',
        '#9C74E8',
        '#F3E8FF',
        '#FFFFFF',
      ];
      const palette = config.days === 7 ? palette7 : palette30;
      const shapes: Particle['shape'][] =
        config.days === 7
          ? ['circle', 'leaf', 'star', 'rect', 'diamond']
          : ['star', 'diamond', 'circle', 'rect', 'star'];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 9.5;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particlesRef.current.push({
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
          vy: Math.sin(angle) * speed - 2.8 - Math.random() * 3.5, // upward bias
          size: Math.random() * 7 + 4,
          color,
          alpha: 1,
          decay: 0.006 + Math.random() * 0.008,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.06 + Math.random() * 0.08,
          shape,
        });
      }
    },
    [config]
  );

  // Initialize Canvas & Physics Loop
  useEffect(() => {
    if (!isOpen || !config) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Initial burst
    particlesRef.current = [];
    spawnBurst(150);

    // Continuous ambient floating sparkles while modal is active
    const ambientInterval = setInterval(() => {
      if (!canvas || !config) return;
      const rect = canvas.getBoundingClientRect();
      const palette = config.days === 7 ? ['#1FB6B0', '#72D5CF', '#E3B15E', '#FFFFFF'] : ['#E3B15E', '#FFD700', '#F5BD47', '#FFFFFF'];
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: Math.random() * rect.width,
          y: rect.height + 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -1.2 - Math.random() * 2.2,
          size: Math.random() * 4 + 2,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 0.8,
          decay: 0.004 + Math.random() * 0.004,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 4,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05,
          shape: Math.random() > 0.5 ? 'star' : 'circle',
        });
      }
    }, 450);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.66, 2.0);
      lastTime = time;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const gravity = 0.18;
      const drag = 0.985;

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        p.vx *= drag;
        p.vy = (p.vy + gravity * dt) * drag;
        p.wobble += p.wobbleSpeed * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 1.2) * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0 || p.y > h + 40) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          // 4-point holy sparkle
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        } else if (p.shape === 'leaf') {
          // Olive leaf shape
          const s = p.size;
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.6, s * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.7, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.7, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // rectangle ribbon
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', updateSize);
      clearInterval(ambientInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, config, spawnBurst]);

  if (!isOpen || !config) return null;

  const handleClaim = () => {
    if (hasClaimed) {
      onClose();
      return;
    }
    setHasClaimed(true);
    spawnBurst(180);
    if (!isMuted) {
      playMilestoneChime(config.days);
    }
    if (onClaimReward) {
      onClaimReward(config.rewardPoints, config.days);
    }
  };

  const handleReplayFanfare = () => {
    spawnBurst(120);
    playMilestoneChime(config.days);
  };

  return (
    <div
      id="streak-milestone-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-milestone-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 60FPS Confetti Canvas Layer */}
      <canvas
        ref={canvasRef}
        id="streak-milestone-canvas"
        className="fixed inset-0 pointer-events-none z-55"
      />

      {/* Main Celebration Dialogue Card */}
      <div
        ref={containerRef}
        id="streak-milestone-dialog"
        className="relative z-60 w-full max-w-lg rounded-3xl bg-[#17132B] text-white shadow-2xl border border-white/20 overflow-hidden my-auto animate-milestone-pop"
      >
        {/* Background Radiant Halo Light */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-60 animate-sacred-pulse"
          style={{ backgroundColor: config.primaryColor }}
        />

        {/* Decorative Top Accent Bar */}
        <div
          className="h-2 w-full"
          style={{
            background:
              config.days === 7
                ? 'linear-gradient(90deg, #1FB6B0, #72D5CF, #E3B15E)'
                : 'linear-gradient(90deg, #E3B15E, #FFD700, #F5BD47, #E3B15E)',
          }}
        />

        {/* Top Control Bar: Mute toggle & Close button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            id="streak-milestone-mute-btn"
            onClick={() => setIsMuted((prev) => !prev)}
            title={isMuted ? 'Unmute Fanfare' : 'Mute Fanfare'}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            id="streak-milestone-close-btn"
            onClick={onClose}
            aria-label="Close milestone celebration"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-8 text-center relative z-10">
          {/* Animated Heraldic Badge Container */}
          <div className="relative inline-flex items-center justify-center mx-auto mt-2">
            {/* Pulsing Light Rings */}
            <div
              className="absolute inset-0 -m-3 rounded-full animate-ping opacity-25"
              style={{ backgroundColor: config.primaryColor }}
            />
            <div
              className="absolute inset-0 -m-6 rounded-full opacity-30 blur-md animate-sacred-pulse"
              style={{ backgroundColor: config.haloColor }}
            />

            {/* Rotating Sacred Sunburst SVG */}
            <svg
              className="absolute -inset-8 w-36 h-36 animate-celestial-halo opacity-35 text-white/40 pointer-events-none"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <polygon
                  key={deg}
                  points="50,10 52,38 50,42 48,38"
                  transform={`rotate(${deg} 50 50)`}
                  fill={config.primaryColor}
                />
              ))}
            </svg>

            {/* Center Heraldic Badge */}
            <div
              id="streak-milestone-badge-icon"
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center shadow-2xl border-2 transition-transform duration-500 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, #2A1F45, #1B1530)`,
                borderColor: config.accentColor,
                boxShadow: `0 0 35px ${config.haloColor}`,
              }}
            >
              <div className="text-5xl sm:text-6xl filter drop-shadow-md select-none animate-bounce">
                {config.icon}
              </div>
              {/* Corner mini badge */}
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-xs shadow-md"
                style={{ backgroundColor: config.primaryColor }}
              >
                {config.badgeEmoji}
              </div>
            </div>
          </div>

          {/* Tier Label Pill */}
          <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-white/10 border border-white/20 text-white shadow-xs">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: config.accentColor }}
            />
            <span>{config.tier} · {config.days}-Day Milestone</span>
          </div>

          {/* Main Title */}
          <h2
            id="streak-milestone-title"
            className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3"
          >
            {config.title}
          </h2>
          <p className="text-sm sm:text-base text-[#D4CEE5] font-serif mt-1">
            {config.subtitle}
          </p>

          {/* Sacred Scripture Verse Plaque */}
          <div
            id="streak-milestone-scripture-plaque"
            className="mt-6 p-4 sm:p-5 rounded-2xl border bg-white/5 backdrop-blur-md text-left transition-all relative overflow-hidden"
            style={{ borderColor: `${config.accentColor}55` }}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
              <span>Sacred Scripture</span>
              <span className="text-[#37C6C2] font-semibold">{config.scriptureRef}</span>
            </div>
            <blockquote className="mt-2 text-sm sm:text-[15px] font-serif italic text-white/95 leading-relaxed">
              “{config.scripture}”
            </blockquote>
            <p className="mt-3 text-xs text-[#A89EC5] leading-relaxed border-t border-white/10 pt-2.5">
              {config.reflection}
            </p>
          </div>

          {/* Unlocked Perks & Rewards Box */}
          <div className="mt-5 p-4 rounded-2xl bg-black/30 border border-white/10 text-left">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              <span>Blessings & Unlocks</span>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-extrabold"
                style={{ backgroundColor: `${config.primaryColor}30`, color: config.accentColor }}
              >
                +{config.rewardPoints} GP
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#D8D2E7]">
              {config.unlockedPerks.map((perk, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="streak-milestone-claim-btn"
              onClick={handleClaim}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-xl transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              style={{
                background:
                  config.days === 7
                    ? 'linear-gradient(135deg, #1FB6B0, #0E7773)'
                    : 'linear-gradient(135deg, #E3B15E, #B88424)',
                boxShadow: `0 8px 20px ${config.haloColor}`,
              }}
            >
              <span>{hasClaimed ? '✓ Claimed! Continue Abiding' : `Claim Blessing (+${config.rewardPoints} GP)`}</span>
              <span className="text-lg">✦</span>
            </button>

            <button
              type="button"
              id="streak-milestone-replay-sound-btn"
              onClick={handleReplayFanfare}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title="Replay fanfare & confetti"
            >
              <span>Replay 🎵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
