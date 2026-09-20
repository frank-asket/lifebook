'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';

export type MilestoneDays = 7 | 14 | 21 | 30 | 50 | 100;

export interface StreakMilestoneConfig {
  days: MilestoneDays;
  title: string;
  titleFr: string;
  subtitle: string;
  subtitleFr: string;
  tier: string;
  tierFr: string;
  icon: string;
  badgeEmoji: string;
  primaryColor: string;
  accentColor: string;
  gradientBg: string;
  haloColor: string;
  rewardPoints: number;
  scripture: string;
  scriptureFr: string;
  scriptureRef: string;
  scriptureRefFr: string;
  reflection: string;
  reflectionFr: string;
  unlockedPerks: string[];
  unlockedPerksFr: string[];
}

export const MILESTONE_CONFIGS: Record<MilestoneDays, StreakMilestoneConfig> = {
  7: {
    days: 7,
    title: '7-Day Sabbath Rhythm',
    titleFr: 'Rythme du Sabbat de 7 Jours',
    subtitle: 'One Full Week of Daily Devotion',
    subtitleFr: 'Une Semaine Entière de Dévotion Quotidienne',
    tier: 'Silver Cadence',
    tierFr: 'Cadence d’Argent',
    icon: '🌿',
    badgeEmoji: '🕊️',
    primaryColor: '#1FB6B0',
    accentColor: '#72D5CF',
    gradientBg: 'from-[#0C242B] via-[#16383E] to-[#1C1635]',
    haloColor: 'rgba(31, 182, 176, 0.45)',
    rewardPoints: 75,
    scripture: 'By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.',
    scriptureFr: 'Dieu acheva au septième jour son œuvre, qu’il avait faite; et il se reposa au septième jour de toute son œuvre.',
    scriptureRef: 'Genesis 2:2',
    scriptureRefFr: 'Genèse 2:2',
    reflection: 'Seven continuous days walking with God. You have traded anxious hurry for a sacred cadence of daily Scripture, quiet prayer, and holy rest.',
    reflectionFr: 'Sept jours ininterrompus de marche avec Dieu. Vous avez remplacé la précipitation anxieuse par un rythme sacré d’Écritures, de prière et de repos saint.',
    unlockedPerks: [
      '+75 Grace Points awarded to your Sanctuary',
      'Silver Cadence Seal unlocked in Trophy Cabinet',
      'Sabbath Peace Shield recharged for 1 rest day',
    ],
    unlockedPerksFr: [
      '+75 Points de Grâce accordés à votre Sanctuaire',
      'Sceau Cadence d’Argent débloqué dans votre Cabinet',
      'Bouclier de Paix du Sabbat rechargé pour 1 jour de repos',
    ],
  },
  14: {
    days: 14,
    title: '14-Day Fortnight of Faith',
    titleFr: 'Quinzaine de Foi de 14 Jours',
    subtitle: 'Two Continuous Weeks Rooted in Christ',
    subtitleFr: 'Deux Semaines Continues Enracinées en Christ',
    tier: 'Emerald Abider',
    tierFr: 'Demeure d’Émeraude',
    icon: '🌱',
    badgeEmoji: '🌿',
    primaryColor: '#10B981',
    accentColor: '#6EE7B7',
    gradientBg: 'from-[#062419] via-[#0E3D2B] to-[#161B36]',
    haloColor: 'rgba(16, 185, 129, 0.45)',
    rewardPoints: 110,
    scripture: 'Abide in me, and I in you. Whoever abides in me and I in him bears much fruit, for apart from me you can do nothing.',
    scriptureFr: 'Demeurez en moi, et je demeurerai en vous. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit.',
    scriptureRef: 'John 15:4-5',
    scriptureRefFr: 'Jean 15:4-5',
    reflection: 'Two weeks of consistent spiritual abiding. What once felt like discipline is becoming your joyful home.',
    reflectionFr: 'Deux semaines de communion constante. Ce qui ressemblait à de la discipline devient maintenant votre demeure de paix.',
    unlockedPerks: [
      '+110 Grace Points awarded to your Sanctuary',
      'Emerald Abider Badge pinned to your spiritual mantle',
      'Expanded prayer reflections library unlocked',
    ],
    unlockedPerksFr: [
      '+110 Points de Grâce accordés à votre Sanctuaire',
      'Badge Demeure d’Émeraude épinglé à votre profil',
      'Bibliothèque étendue de méditations débloquée',
    ],
  },
  21: {
    days: 21,
    title: '21-Day Habit of Grace',
    titleFr: 'Habitude de Grâce de 21 Jours',
    subtitle: 'A Rewired Mind & Spiritual Heart',
    subtitleFr: 'Renouvellement de l’Esprit et du Cœur',
    tier: 'Amethyst Disciple',
    tierFr: 'Disciple d’Améthyste',
    icon: '💎',
    badgeEmoji: '💜',
    primaryColor: '#8B5CF6',
    accentColor: '#C4B5FD',
    gradientBg: 'from-[#1E1138] via-[#2A184D] to-[#121B35]',
    haloColor: 'rgba(139, 92, 246, 0.55)',
    rewardPoints: 130,
    scripture: 'Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God.',
    scriptureFr: 'Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l’intelligence.',
    scriptureRef: 'Romans 12:2',
    scriptureRefFr: 'Romains 12:2',
    reflection: 'Neuroscience and Scripture unite here: 21 unbroken days build a permanent neuropathway of devotion. Starting your morning in God’s Word is now an instinctual reflex.',
    reflectionFr: 'La science et les Écritures se rejoignent : 21 jours continus forgent un réflexe spirituel durable. Commencer votre journée dans la Parole est désormais naturel.',
    unlockedPerks: [
      '+130 Grace Points awarded to your Sanctuary',
      'Amethyst Disciple Seal unlocked in Trophy Cabinet',
      'Permanent Habit Anchor badge unlocked for your profile',
      'Grace Shield auto-repair unlocked',
    ],
    unlockedPerksFr: [
      '+130 Points de Grâce accordés à votre Sanctuaire',
      'Sceau Disciple d’Améthyste débloqué dans votre Cabinet',
      'Insigne Ancrage d’Habitude débloqué sur votre profil',
      'Auto-réparation du Bouclier de Grâce activée',
    ],
  },
  30: {
    days: 30,
    title: '30-Day Spiritual Pillar',
    titleFr: 'Pilier Spirituel de 30 Jours',
    subtitle: 'A Full Month Rooted in Christ',
    subtitleFr: 'Un Mois Entier Ancré dans la Parole',
    tier: 'Gold Anchor',
    tierFr: 'Ancre d’Or',
    icon: '👑',
    badgeEmoji: '🏛️',
    primaryColor: '#E3B15E',
    accentColor: '#FFD700',
    gradientBg: 'from-[#2A1D0B] via-[#3D2910] to-[#201538]',
    haloColor: 'rgba(227, 177, 94, 0.55)',
    rewardPoints: 150,
    scripture: 'He is like a tree planted by streams of water that yields its fruit in its season, and its leaf does not wither.',
    scriptureFr: 'Il est comme un arbre planté près d’un courant d’eau, qui donne son fruit en sa saison, et dont le feuillage ne se flétrit point.',
    scriptureRef: 'Psalm 1:3',
    scriptureRefFr: 'Psaume 1:3',
    reflection: 'Thirty days of steadfast daily communion. What began as a mustard-seed step has grown into a deep-rooted spiritual pillar in your life.',
    reflectionFr: 'Trente jours de communion persévérante. Ce qui a commencé comme une graine de moutarde est devenu un pilier inébranlable dans votre vie.',
    unlockedPerks: [
      '+150 Grace Points awarded to your Sanctuary',
      'Gold Anchor Seal unlocked in Trophy Cabinet',
      'Golden Pillar Glow badge for your profile',
      'Monthly Soul Trends Deep Analysis unlocked',
    ],
    unlockedPerksFr: [
      '+150 Points de Grâce accordés à votre Sanctuaire',
      'Sceau Ancre d’Or débloqué dans votre Cabinet',
      'Aura Pilier Doré activée pour votre profil',
      'Analyse approfondie des tendances mensuelles débloquée',
    ],
  },
  50: {
    days: 50,
    title: '50-Day Pentecost Jubilee',
    titleFr: 'Jubilé de Pentecôte de 50 Jours',
    subtitle: 'Fifty Days of Divine Outpouring & Peace',
    subtitleFr: 'Cinquante Jours d’Onction et de Paix',
    tier: 'Pentecost Flame',
    tierFr: 'Flamme de Pentecôte',
    icon: '🔥',
    badgeEmoji: '🕊️',
    primaryColor: '#EC4899',
    accentColor: '#F472B6',
    gradientBg: 'from-[#32081E] via-[#48122D] to-[#1C1635]',
    haloColor: 'rgba(236, 72, 153, 0.55)',
    rewardPoints: 250,
    scripture: 'When the day of Pentecost arrived, they were all together in one place... And they were all filled with the Holy Spirit.',
    scriptureFr: 'Le jour de la Pentecôte, ils étaient tous ensemble dans le même lieu... Et ils furent tous remplis du Saint-Esprit.',
    scriptureRef: 'Acts 2:1-4',
    scriptureRefFr: 'Actes 2:1-4',
    reflection: 'Fifty sacred days—honoring the biblical Jubilee and Pentecost. Your sustained obedience and quiet heart have invited an abundant outpouring of divine peace into your daily work and family.',
    reflectionFr: 'Cinquante jours sacrés honorant le Jubilé et la Pentecôte. Votre fidélité persévérante a invité une effusion abondante de paix divine dans vos journées et vos pensées.',
    unlockedPerks: [
      '+250 Grace Points awarded to your Sanctuary',
      'Pentecost Flame Crown unlocked in Trophy Cabinet',
      'Sanctuary Jubilee Aurora halo on your profile',
      'Advanced 50-Day Guided Prayer Archive unlocked',
    ],
    unlockedPerksFr: [
      '+250 Points de Grâce accordés à votre Sanctuaire',
      'Couronne Flamme de Pentecôte débloquée dans votre Cabinet',
      'Halo Jubilé Céleste activé sur votre profil',
      'Archives avancées de prière 50-Jours débloquées',
    ],
  },
  100: {
    days: 100,
    title: '100-Day Diamond Covenant',
    titleFr: 'Alliance de Diamant de 100 Jours',
    subtitle: 'A Century of Unbroken Faith & Perseverance',
    subtitleFr: 'Un Siècle de Jours Fidèles et Inébranlables',
    tier: 'Diamond Covenant',
    tierFr: 'Alliance de Diamant',
    icon: '👑',
    badgeEmoji: '✨',
    primaryColor: '#38BDF8',
    accentColor: '#7DD3FC',
    gradientBg: 'from-[#082032] via-[#0E3550] to-[#17132B]',
    haloColor: 'rgba(56, 189, 248, 0.6)',
    rewardPoints: 500,
    scripture: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
    scriptureFr: 'Ne nous lassons pas de faire le bien; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.',
    scriptureRef: 'Galatians 6:9',
    scriptureRefFr: 'Galates 6:9',
    reflection: 'One hundred days of walking with the Lord. Through joyful sunrises and demanding seasons, you honored your sacred appointment. Your faith is steady, quiet, and tempered like diamond.',
    reflectionFr: 'Cent jours de marche fidèle avec le Seigneur. À travers les matins joyeux comme les saisons exigeantes, votre foi est devenue inébranlable et pure comme le diamant.',
    unlockedPerks: [
      '+500 Grace Points awarded to your Sanctuary',
      'Diamond Century Crown displayed on your public seal',
      'Lifetime Sanctuary Benefactor status',
      'All premium contemplative soundscapes unlocked',
    ],
    unlockedPerksFr: [
      '+500 Points de Grâce accordés à votre Sanctuaire',
      'Couronne de Diamant affichée sur votre sceau',
      'Statut Bienfaiteur Perpétuel du Sanctuaire',
      'Toutes les ambiances contemplatives sonores débloquées',
    ],
  },
};

export interface StreakMilestoneAnimationProps {
  milestoneDays: number | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimReward?: (points: number, milestoneDays: number) => void;
}

// Play celebratory chime tailored to each milestone tier via Web Audio API
function playMilestoneChime(days: number) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    let freqs: number[];
    let waveType: OscillatorType = 'sine';

    if (days === 7) {
      // 7-day chime: Silver Cadence (Fmaj9 arpeggio: F4, A4, C5, E5, G5)
      freqs = [349.23, 440.0, 523.25, 659.25, 783.99];
    } else if (days === 14) {
      // 14-day chime: Emerald Abider (Gmaj7 arpeggio: G4, B4, D5, F#5, B5)
      freqs = [392.0, 493.88, 587.33, 739.99, 987.77];
    } else if (days === 21) {
      // 21-day chime: Transformed Heart Fanfare (Ebmaj9 arpeggio: Eb4, G4, Bb4, D5, F5, Bb5)
      freqs = [311.13, 392.0, 466.16, 587.33, 698.46, 932.33];
      waveType = 'triangle';
    } else if (days === 30) {
      // 30-day chime: Gold Anchor Triumph (C4, G4, C5, E5, G5, C6)
      freqs = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      waveType = 'triangle';
    } else if (days === 50) {
      // 50-day chime: Pentecost Jubilee Fanfare (Triumphant D major fanfare: D4, F#4, A4, D5, F#5, A5, D6)
      freqs = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0, 1174.66];
      waveType = 'triangle';
    } else {
      // 100-day chime: Diamond Century Majesty (Multi-octave grand chord: C4, E4, G4, C5, E5, G5, C6, E6)
      freqs = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51];
      waveType = 'triangle';
    }

    freqs.forEach((freq, idx) => {
      const noteTime = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.16, noteTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 2.4);
    });
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
  shape: 'circle' | 'star' | 'leaf' | 'diamond' | 'rect' | 'flame';
}

export function StreakMilestoneAnimation({
  milestoneDays,
  isOpen,
  onClose,
  onClaimReward,
}: StreakMilestoneAnimationProps) {
  const { isFr } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const hasClaimed = milestoneDays ? claimedDays.includes(milestoneDays) : false;

  // Match config or find closest supported milestone
  const config = useMemo<StreakMilestoneConfig | null>(() => {
    if (!milestoneDays) return null;
    if (milestoneDays in MILESTONE_CONFIGS) {
      return MILESTONE_CONFIGS[milestoneDays as MilestoneDays];
    }
    // Fallback: choose nearest
    const availableDays = [7, 14, 21, 30, 50, 100] as MilestoneDays[];
    const nearest = availableDays.reduce((prev, curr) =>
      Math.abs(curr - milestoneDays) < Math.abs(prev - milestoneDays) ? curr : prev
    );
    return MILESTONE_CONFIGS[nearest];
  }, [milestoneDays]);

  // Sound fanfare on open
  useEffect(() => {
    if (isOpen && config && !isMuted) {
      const timer = setTimeout(() => {
        playMilestoneChime(config.days);
      }, 150);
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

  // Spawn confetti burst with themed particles
  const spawnBurst = useCallback(
    (count = 150) => {
      const canvas = canvasRef.current;
      if (!canvas || !config) return;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height * 0.38;

      let palette: string[];
      let shapes: Particle['shape'][];

      if (config.days === 7) {
        palette = ['#1FB6B0', '#37C6C2', '#0E7773', '#72D5CF', '#E3B15E', '#F3FAF9', '#A8E5E0', '#FFFFFF'];
        shapes = ['circle', 'leaf', 'star', 'rect', 'diamond'];
      } else if (config.days === 14) {
        palette = ['#10B981', '#34D399', '#6EE7B7', '#059669', '#E3B15E', '#FFFFFF'];
        shapes = ['leaf', 'circle', 'star', 'diamond'];
      } else if (config.days === 21) {
        // 21-day Amethyst & Violet palette
        palette = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#7C3AED', '#E3B15E', '#FFD700', '#EDE9FE', '#FFFFFF'];
        shapes = ['diamond', 'star', 'circle', 'leaf', 'rect'];
      } else if (config.days === 30) {
        palette = ['#E3B15E', '#FFD700', '#F5BD47', '#FFAA00', '#FFF5D6', '#9C74E8', '#F3E8FF', '#FFFFFF'];
        shapes = ['star', 'diamond', 'circle', 'rect', 'star'];
      } else if (config.days === 50) {
        // 50-day Pentecost Holy Fire palette
        palette = ['#EC4899', '#F43F5E', '#F59E0B', '#EF4444', '#FFD700', '#FB7185', '#FFF176', '#FFFFFF'];
        shapes = ['flame', 'star', 'diamond', 'circle', 'rect'];
      } else {
        // 100-day Diamond palette
        palette = ['#38BDF8', '#7DD3FC', '#0284C7', '#E0F2FE', '#A78BFA', '#F8FAFC', '#FFFFFF'];
        shapes = ['diamond', 'star', 'star', 'circle', 'rect'];
      }

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3.5 + Math.random() * 10;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particlesRef.current.push({
          x: centerX + (Math.random() - 0.5) * 45,
          y: centerY + (Math.random() - 0.5) * 45,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
          vy: Math.sin(angle) * speed - 3.2 - Math.random() * 3.8, // upward burst
          size: Math.random() * 7 + 4,
          color,
          alpha: 1,
          decay: 0.005 + Math.random() * 0.007,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 9,
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
    spawnBurst(160);

    // Continuous ambient floating sparkles while modal is active
    const ambientInterval = setInterval(() => {
      if (!canvas || !config) return;
      const rect = canvas.getBoundingClientRect();
      const palette = [config.primaryColor, config.accentColor, '#FFFFFF', '#FFD700'];
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: Math.random() * rect.width,
          y: rect.height + 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -1.4 - Math.random() * 2.2,
          size: Math.random() * 4 + 2,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 0.85,
          decay: 0.004 + Math.random() * 0.004,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 4,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05,
          shape: Math.random() > 0.4 ? 'star' : 'diamond',
        });
      }
    }, 400);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.66, 2.0);
      lastTime = time;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const gravity = 0.17;
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
        } else if (p.shape === 'flame') {
          // Holy flame teardrop
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s * 1.2);
          ctx.quadraticCurveTo(s * 0.8, -s * 0.2, s * 0.6, s * 0.6);
          ctx.quadraticCurveTo(0, s, -s * 0.6, s * 0.6);
          ctx.quadraticCurveTo(-s * 0.8, -s * 0.2, 0, -s * 1.2);
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
    setClaimedDays((prev) => (config ? [...prev, config.days] : prev));
    spawnBurst(180);
    if (!isMuted) {
      playMilestoneChime(config.days);
    }
    if (onClaimReward) {
      onClaimReward(config.rewardPoints, config.days);
    }
  };

  const handleReplayFanfare = () => {
    spawnBurst(140);
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
            background: `linear-gradient(90deg, ${config.primaryColor}, ${config.accentColor}, #FFD700, ${config.primaryColor})`,
          }}
        />

        {/* Top Control Bar: Mute toggle & Close button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            id="streak-milestone-mute-btn"
            onClick={() => setIsMuted((prev) => !prev)}
            title={isMuted ? (isFr ? 'Activer le son' : 'Unmute Fanfare') : (isFr ? 'Couper le son' : 'Mute Fanfare')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            id="streak-milestone-close-btn"
            onClick={onClose}
            aria-label={isFr ? 'Fermer la célébration' : 'Close milestone celebration'}
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
            <span>
              {isFr ? config.tierFr : config.tier} · {config.days}-{isFr ? 'Jours Étape' : 'Day Milestone'}
            </span>
          </div>

          {/* Main Title */}
          <h2
            id="streak-milestone-title"
            className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3"
          >
            {isFr ? config.titleFr : config.title}
          </h2>
          <p className="text-sm sm:text-base text-[#D4CEE5] font-serif mt-1">
            {isFr ? config.subtitleFr : config.subtitle}
          </p>

          {/* Sacred Scripture Verse Plaque */}
          <div
            id="streak-milestone-scripture-plaque"
            className="mt-6 p-4 sm:p-5 rounded-2xl border bg-white/5 backdrop-blur-md text-left transition-all relative overflow-hidden"
            style={{ borderColor: `${config.accentColor}55` }}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
              <span>{isFr ? 'Parole Sacrée' : 'Sacred Scripture'}</span>
              <span className="text-[#37C6C2] font-semibold">
                {isFr ? (config.scriptureRefFr || config.scriptureRef) : config.scriptureRef}
              </span>
            </div>
            <blockquote className="mt-2 text-sm sm:text-[15px] font-serif italic text-white/95 leading-relaxed">
              “{isFr ? config.scriptureFr : config.scripture}”
            </blockquote>
            <p className="mt-3 text-xs text-[#A89EC5] leading-relaxed border-t border-white/10 pt-2.5">
              {isFr ? config.reflectionFr : config.reflection}
            </p>
          </div>

          {/* Unlocked Perks & Rewards Box */}
          <div className="mt-5 p-4 rounded-2xl bg-black/30 border border-white/10 text-left">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              <span>{isFr ? 'Bénédictions & Récompenses' : 'Blessings & Unlocks'}</span>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-extrabold"
                style={{ backgroundColor: `${config.primaryColor}30`, color: config.accentColor }}
              >
                +{config.rewardPoints} GP
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#D8D2E7]">
              {(isFr ? config.unlockedPerksFr : config.unlockedPerks).map((perk, idx) => (
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
                background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})`,
                boxShadow: `0 8px 20px ${config.haloColor}`,
              }}
            >
              <span>
                {hasClaimed
                  ? (isFr ? '✓ Bénédiction reçue ! Continuer' : '✓ Claimed! Continue Abiding')
                  : (isFr ? `Recevoir la Bénédiction (+${config.rewardPoints} GP)` : `Claim Blessing (+${config.rewardPoints} GP)`)}
              </span>
              <span className="text-lg">✦</span>
            </button>

            <button
              type="button"
              id="streak-milestone-replay-sound-btn"
              onClick={handleReplayFanfare}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title={isFr ? 'Rejouer la fanfare & les confettis' : 'Replay fanfare & confetti'}
            >
              <span>{isFr ? 'Rejouer 🎵' : 'Replay 🎵'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
