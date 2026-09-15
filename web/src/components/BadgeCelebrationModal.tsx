'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface BadgeCelebrationData {
  id: string;
  title: string;
  subtitle: string;
  tier: string;
  tierColor?: string;
  icon: string;
  badgeEmoji: string;
  primaryColor: string;
  accentColor: string;
  rewardPoints: number;
  scripture: string;
  scriptureRef: string;
  reflection: string;
  unlockedPerks: string[];
}

interface BadgeCelebrationModalProps {
  badge: BadgeCelebrationData | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimReward?: (badgeId: string, rewardPoints: number) => void;
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

// Play celebratory chime via Web Audio API
function playSacredBadgeChime(tier: string) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Different arpeggio chords depending on tier
    let freqs = [349.23, 440.0, 523.25, 659.25, 783.99]; // Default: Fmaj9
    if (tier.toLowerCase().includes('gold') || tier.toLowerCase().includes('pillar')) {
      freqs = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // Cmaj9 regal
    } else if (tier.toLowerCase().includes('diamond')) {
      freqs = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0, 1174.66]; // Dmaj9 bright
    }

    freqs.forEach((freq, idx) => {
      const noteTime = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.14, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 2.1);
    });
  } catch {
    // AudioContext blocked or not supported
  }
}

export function BadgeCelebrationModal({
  badge,
  isOpen,
  onClose,
  onClaimReward,
}: BadgeCelebrationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  // Sound fanfare on open
  useEffect(() => {
    if (isOpen && badge && !isMuted) {
      const timer = setTimeout(() => {
        playSacredBadgeChime(badge.tier);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen, badge, isMuted]);

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
    (count = 150) => {
      const canvas = canvasRef.current;
      if (!canvas || !badge) return;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height * 0.36;

      const palette = [
        badge.primaryColor,
        badge.accentColor,
        '#E3B15E',
        '#FFD700',
        '#72D5CF',
        '#FFFFFF',
        '#EDE7F6',
      ];
      const shapes: Particle['shape'][] = ['circle', 'leaf', 'star', 'rect', 'diamond'];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3.5 + Math.random() * 9.5;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particlesRef.current.push({
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
          vy: Math.sin(angle) * speed - 3.2 - Math.random() * 3.5,
          size: Math.random() * 7 + 4,
          color,
          alpha: 1,
          decay: 0.006 + Math.random() * 0.007,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.06 + Math.random() * 0.08,
          shape,
        });
      }
    },
    [badge]
  );

  // Initialize Canvas & Physics Loop
  useEffect(() => {
    if (!isOpen || !badge) return;

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
    spawnBurst(160);

    // Continuous ambient floating sparkles while modal is active
    const ambientInterval = setInterval(() => {
      if (!canvas || !badge) return;
      const rect = canvas.getBoundingClientRect();
      const palette = [badge.primaryColor, badge.accentColor, '#FFFFFF', '#E3B15E'];
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

    const loop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const gravity = 180;
      const drag = 0.985;

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.vy += gravity * delta;
        p.vx *= drag;
        p.vy *= drag;

        p.x += p.vx * delta * 60;
        p.y += p.vy * delta * 60;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > rect.height + 30) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        const currentSize = p.size * (0.8 + Math.sin(p.wobble) * 0.2);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, currentSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-currentSize / 2, -currentSize / 3, currentSize, currentSize * 0.7);
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, currentSize * 0.65, currentSize * 0.3);
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -currentSize / 2);
          ctx.lineTo(currentSize / 2, 0);
          ctx.lineTo(0, currentSize / 2);
          ctx.lineTo(-currentSize / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'leaf') {
          ctx.beginPath();
          ctx.moveTo(0, -currentSize / 2);
          ctx.quadraticCurveTo(currentSize / 2, 0, 0, currentSize / 2);
          ctx.quadraticCurveTo(-currentSize / 2, 0, 0, -currentSize / 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', updateSize);
      clearInterval(ambientInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, badge, spawnBurst]);

  if (!isOpen || !badge) return null;

  const handleClaim = () => {
    if (hasClaimed) {
      onClose();
      return;
    }
    setHasClaimed(true);
    spawnBurst(180);
    if (!isMuted) {
      playSacredBadgeChime(badge.tier);
    }
    if (onClaimReward) {
      onClaimReward(badge.id, badge.rewardPoints);
    }
  };

  const handleReplayFanfare = () => {
    spawnBurst(130);
    playSacredBadgeChime(badge.tier);
  };

  return (
    <div
      id="badge-celebration-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-celebration-title"
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
        id="badge-celebration-canvas"
        className="fixed inset-0 pointer-events-none z-55"
      />

      {/* Main Celebration Dialogue Card */}
      <div
        ref={containerRef}
        id="badge-celebration-dialog"
        className="relative z-60 w-full max-w-lg rounded-3xl bg-[#17132B] text-white shadow-2xl border border-white/20 overflow-hidden my-auto animate-milestone-pop"
      >
        {/* Background Radiant Halo Light */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-60 animate-sacred-pulse"
          style={{ backgroundColor: badge.primaryColor }}
        />

        {/* Decorative Top Accent Bar */}
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${badge.primaryColor}, ${badge.accentColor}, #E3B15E, ${badge.primaryColor})`,
          }}
        />

        {/* Top Control Bar: Mute toggle & Close button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            id="badge-celebration-mute-btn"
            onClick={() => setIsMuted((prev) => !prev)}
            title={isMuted ? 'Unmute Fanfare' : 'Mute Fanfare'}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            id="badge-celebration-close-btn"
            onClick={onClose}
            aria-label="Close celebration"
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
              style={{ backgroundColor: badge.primaryColor }}
            />
            <div
              className="absolute inset-0 -m-6 rounded-full opacity-35 blur-md animate-sacred-pulse"
              style={{ backgroundColor: badge.accentColor }}
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
                  fill={badge.primaryColor}
                />
              ))}
            </svg>

            {/* Badge Medallion Core */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-xl flex items-center justify-center border-2 border-white/30 transform transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, #241D3F, #181329)`,
                boxShadow: `0 0 35px ${badge.primaryColor}60`,
              }}
            >
              <span className="text-5xl sm:text-6xl filter drop-shadow-md select-none">
                {badge.icon}
              </span>
              <span
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-[#17132B] flex items-center justify-center text-sm shadow-md"
                style={{ backgroundColor: badge.primaryColor }}
              >
                {badge.badgeEmoji}
              </span>
            </div>
          </div>

          {/* Tier Badge Ribbon */}
          <div className="mt-5">
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest border shadow-xs"
              style={{
                backgroundColor: `${badge.primaryColor}25`,
                borderColor: `${badge.primaryColor}80`,
                color: badge.accentColor || '#FFFFFF',
              }}
            >
              <span>✦</span>
              <span>{badge.tier} Milestone Unlocked</span>
              <span>✦</span>
            </span>
          </div>

          {/* Title & Subtitle */}
          <h2
            id="badge-celebration-title"
            className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3 tracking-tight"
          >
            {badge.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#C8C0DD] mt-1 font-medium">
            {badge.subtitle}
          </p>

          {/* Sacred Scripture Anchor */}
          <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-left relative overflow-hidden group">
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: badge.primaryColor }}
            />
            <p className="font-serif italic text-xs sm:text-sm text-[#F4EEFF] leading-relaxed pl-2">
              “{badge.scripture}”
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A89EC0]">
                Scripture Anchor
              </span>
              <span
                className="text-[11px] font-bold font-mono"
                style={{ color: badge.accentColor }}
              >
                {badge.scriptureRef}
              </span>
            </div>
          </div>

          {/* Pastoral Reflection */}
          <p className="text-xs text-[#DDD7EC] mt-3.5 leading-relaxed text-left">
            {badge.reflection}
          </p>

          {/* Unlocked Sanctuary Perks */}
          <div className="mt-4 pt-3 border-t border-white/10 text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A89EC0] block mb-2">
              Unlocked Rewards & Perks:
            </span>
            <div className="space-y-1.5">
              {badge.unlockedPerks.map((perk, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#EBE6F5]">
                  <span className="text-sm shrink-0" style={{ color: badge.primaryColor }}>
                    ✓
                  </span>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="badge-claim-reward-btn"
              onClick={handleClaim}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: badge.primaryColor,
                color: '#120E22',
                boxShadow: `0 8px 24px ${badge.primaryColor}50`,
              }}
            >
              <span>{hasClaimed ? '✓ Blessing Claimed' : `Claim +${badge.rewardPoints} Grace Points`}</span>
              <span className="text-base">✦</span>
            </button>

            <button
              type="button"
              id="badge-replay-fanfare-btn"
              onClick={handleReplayFanfare}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Replay fanfare & confetti"
            >
              <span>✨</span>
              <span>Replay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}
