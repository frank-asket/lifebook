"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import {
  Palette,
  TextAa,
  Sparkle,
  DeviceMobileCamera,
  Compass,
  BookOpenText,
  MicrophoneStage,
  ChartBar,
  Feather,
  Waveform,
  Heart,
  BookmarkSimple,
  ArrowUpRight,
  CheckCircle,
  SealCheck,
  Eye,
} from "@phosphor-icons/react";

export interface ShotItem {
  id: string;
  title: string;
  category: "all" | "devotion" | "audio" | "journal" | "stats";
  author: {
    name: string;
    avatar: string;
    role: string;
    badge?: string;
  };
  palette: {
    from: string;
    to: string;
    accent: string;
    border: string;
    swatches: string[];
  };
  metrics: {
    views: string;
    likes: number;
    saves: number;
  };
  preview: {
    eyebrow: string;
    headline: string;
    subline: string;
    tag: string;
    iconType: "book" | "mic" | "chart" | "feather" | "wave" | "compass";
    actionLabel: string;
    href: string;
    features: string[];
  };
}

const COOLORS_SWATCHES = [
  { hex: "#FBFAF7", nameEn: "Alabaster Parchment", nameFr: "Parchemin Albâtre" },
  { hex: "#F5F0E7", nameEn: "Warm Travertine", nameFr: "Travertin Chaud" },
  { hex: "#1E1931", nameEn: "Sanctuary Plum", nameFr: "Prune Sanctuaire" },
  { hex: "#1FB6B0", nameEn: "Living Water Teal", nameFr: "Eau Vive Sarcelle" },
  { hex: "#E3B15E", nameEn: "Sacred Gold", nameFr: "Or Sacré" },
  { hex: "#EA4C89", nameEn: "Dribbble Rose", nameFr: "Rose Éditorial" },
];

export function DribbbleShowcaseGrid() {
  const { isFr } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<
    "all" | "devotion" | "audio" | "journal" | "stats"
  >("all");
  const [likedShots, setLikedShots] = useState<Record<string, boolean>>({});
  const [savedShots, setSavedShots] = useState<Record<string, boolean>>({});
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({
    "shot-1": 348,
    "shot-2": 512,
    "shot-3": 289,
    "shot-4": 421,
    "shot-5": 310,
    "shot-6": 467,
  });

  const handleCopyHex = (hex: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hex).catch(() => {});
    }
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1600);
  };

  const renderShotIcon = (
    type: ShotItem["preview"]["iconType"],
    isDark: boolean,
    accent: string
  ) => {
    const color = isDark ? "#FFFFFF" : accent;
    switch (type) {
      case "book":
        return <BookOpenText size={18} weight="duotone" style={{ color }} />;
      case "mic":
        return <MicrophoneStage size={18} weight="duotone" style={{ color }} />;
      case "chart":
        return <ChartBar size={18} weight="duotone" style={{ color }} />;
      case "feather":
        return <Feather size={18} weight="duotone" style={{ color }} />;
      case "wave":
        return <Waveform size={18} weight="duotone" style={{ color }} />;
      case "compass":
        return <Compass size={18} weight="duotone" style={{ color }} />;
    }
  };

  const shots: ShotItem[] = [
    {
      id: "shot-1",
      title: isFr
        ? "Étude Expositive Quotidienne en 3 Étapes"
        : "3-Step Daily Quiet Time & Expository Verse",
      category: "devotion",
      author: {
        name: "LifeBook Editorial",
        avatar: "/logol.png",
        role: isFr ? "Soin Pastoral" : "Pastoral Care",
        badge: "PRO",
      },
      palette: {
        from: "from-[#FDFBF7]",
        to: "to-[#F4EBE1]",
        accent: "#C27A4E",
        border: "border-[#EADBCE]",
        swatches: ["#FDFBF7", "#F4EBE1", "#C27A4E", "#1E1931"],
      },
      metrics: {
        views: "14.2k",
        likes: likesCounts["shot-1"],
        saves: 84,
      },
      preview: {
        eyebrow: isFr ? "ROUTINE DU MATIN" : "MORNING ROUTINE",
        headline: isFr
          ? "Lire · Méditer · Prier en 5 Minutes"
          : "Read · Reflect · Pray in 5 Minutes",
        subline: isFr
          ? "Psaume 23:3 · « Il restaure mon âme dans les sentiers de justice »"
          : "Psalm 23:3 · “He restores my soul; he leads me in paths of righteousness”",
        tag: isFr ? "5 Versions Bibliques" : "5 Verified Translations",
        iconType: "book",
        actionLabel: isFr ? "Explorer l'Étude" : "Open Devotion",
        href: "#how-it-works",
        features: [
          isFr ? "Traductions LSG, Semeur & ESV" : "ESV, NIV, CSB & LSG texts",
          isFr
            ? "3 Questions de réflexion concrète"
            : "3 real-world application prompts",
          isFr
            ? "Chiffrement local sur votre appareil"
            : "Private local device storage",
        ],
      },
    },
    {
      id: "shot-2",
      title: isFr
        ? "Studio Living Word & Disque Audio Sacré"
        : "Living Word Sanctuary & Dedicated Sacred Audio",
      category: "audio",
      author: {
        name: "Timothy Keller Archive",
        avatar: "/logol.png",
        role: isFr ? "Enseignement" : "Sermon Audio",
        badge: "CURATED",
      },
      palette: {
        from: "from-[#201A38]",
        to: "to-[#120F24]",
        accent: "#56C2B4",
        border: "border-[#3A2F5E]",
        swatches: ["#201A38", "#120F24", "#56C2B4", "#E3B15E"],
      },
      metrics: {
        views: "21.8k",
        likes: likesCounts["shot-2"],
        saves: 142,
      },
      preview: {
        eyebrow: isFr ? "STREAMING SACRÉ" : "SACRED STREAMING",
        headline: isFr
          ? "The Cost of Discipleship & Romans 8"
          : "The Cost of Discipleship & Romans 8",
        subline: isFr
          ? "Discours audio avec égaliseur fréquence & signets de versets"
          : "Lossless audio visualizer with live equalizer and timestamp bookmarks",
        tag: isFr ? "Flux RSS Apple & Spotify" : "Apple & Spotify RSS 2.0",
        iconType: "mic",
        actionLabel: isFr ? "Écouter l'Enseignement" : "Listen in Studio",
        href: "/living-word",
        features: [
          isFr
            ? "Mode audio sombre sans distraction"
            : "Distraction-free dark audio mode",
          isFr
            ? "Signet de note à 01:45 vers le journal"
            : "Timestamp bookmark syncs to journal",
          isFr
            ? "Tiroir interactif de références croisées"
            : "Interactive Scripture cross-reference drawer",
        ],
      },
    },
    {
      id: "shot-3",
      title: isFr
        ? "Matrice d'Habitude & Heatmap 30 Jours"
        : "30-Day Dwell-Time Consistency Heatmap",
      category: "stats",
      author: {
        name: "Sanctuary Analytics",
        avatar: "/logol.png",
        role: isFr ? "Persévérance" : "Discipleship Rhythm",
        badge: "METRICS",
      },
      palette: {
        from: "from-[#F3F8F6]",
        to: "to-[#E5EFEA]",
        accent: "#1FB6B0",
        border: "border-[#CCE2D8]",
        swatches: ["#F3F8F6", "#E5EFEA", "#1FB6B0", "#0E726D"],
      },
      metrics: {
        views: "9.6k",
        likes: likesCounts["shot-3"],
        saves: 67,
      },
      preview: {
        eyebrow: isFr ? "SÉRIES & SABBAT" : "STREAKS & SABBATH",
        headline: isFr
          ? "14 Jours de Série · Protection de Grâce"
          : "14-Day Active Streak · Grace Protection",
        subline: isFr
          ? "Le repos du sabbat préserve votre élan sans jamais réinitialiser à zéro"
          : "Intentional Sabbath rest protects your spiritual rhythm without guilt resets",
        tag: isFr ? "93% Taux de Régularité" : "93% Monthly Consistency",
        iconType: "chart",
        actionLabel: isFr ? "Voir mes Métriques" : "View Heatmap",
        href: "/progress",
        features: [
          isFr
            ? "Grille d'intensité 30 jours cliquable"
            : "Clickable 30-day intensity grid",
          isFr
            ? "Plafond de points de grâce hebdomadaire"
            : "+50 Grace points for Sabbath rest",
          isFr
            ? "Trophées débloquables (Flamme, Sabbat)"
            : "Unlockable milestone badges & seals",
        ],
      },
    },
    {
      id: "shot-4",
      title: isFr
        ? "Journal Spirituel Intime & Exportation JSON"
        : "Private Spiritual Journal & JSON Data Portability",
      category: "journal",
      author: {
        name: "Soul Sanctuary",
        avatar: "/logol.png",
        role: isFr ? "Intimité" : "Local Storage",
        badge: "ENCRYPTED",
      },
      palette: {
        from: "from-[#F9F7FD]",
        to: "to-[#EDE6F8]",
        accent: "#8B65C9",
        border: "border-[#DDD1F2]",
        swatches: ["#F9F7FD", "#EDE6F8", "#8B65C9", "#2A2146"],
      },
      metrics: {
        views: "11.1k",
        likes: likesCounts["shot-4"],
        saves: 95,
      },
      preview: {
        eyebrow: isFr ? "MÉDITATIONS PRIVÉES" : "PRIVATE MEDITATIONS",
        headline: isFr
          ? "Écrire sans Peur d'Être Suivi"
          : "Reflect Without Telemetry or Tracking",
        subline: isFr
          ? "Vos notes intimes restent sur votre matériel, jamais revendues"
          : "Your deeply personal prayers stay encrypted locally with zero ad profiling",
        tag: isFr ? "Export JSON en 1 Clic" : "1-Click JSON Export",
        iconType: "feather",
        actionLabel: isFr ? "Ouvrir le Journal" : "Open Journal",
        href: "/progress#journal",
        features: [
          isFr
            ? "Sauvegarde automatique instantanée"
            : "Instant local autosave across sessions",
          isFr
            ? "Étiquettes thématiques (#Paix, #Sagesse)"
            : "Topical tags (#Peace, #Wisdom)",
          isFr
            ? "Export complet en fichier .json sécurisé"
            : "Full offline JSON backup download",
        ],
      },
    },
    {
      id: "shot-5",
      title: isFr
        ? "Recherche Vocale Sanctifiée & Onde Sonore"
        : "Sanctified Voice Assistant & Ripple Visualizer",
      category: "audio",
      author: {
        name: "LifeBook Voice",
        avatar: "/logol.png",
        role: isFr ? "Prière Orale" : "Voice Studio",
        badge: "LABS",
      },
      palette: {
        from: "from-[#1A2530]",
        to: "to-[#0F171F]",
        accent: "#E5B96B",
        border: "border-[#2D3F52]",
        swatches: ["#1A2530", "#0F171F", "#E5B96B", "#37C6C2"],
      },
      metrics: {
        views: "18.4k",
        likes: likesCounts["shot-5"],
        saves: 110,
      },
      preview: {
        eyebrow: isFr ? "PRIÈRE PARLÉE" : "SPOKEN PRAYER",
        headline: isFr
          ? "Spectre Fréquentiel & Versets Proposés"
          : "Frequency Visualizer & Scripture Recommendations",
        subline: isFr
          ? "Exprimez vos fardeaux à haute voix et recevez la parole adaptée"
          : "Speak honest burdens into the microphone and receive rooted pastoral peace",
        tag: isFr ? "Microphone Direct" : "Live Web Audio API",
        iconType: "wave",
        actionLabel: isFr ? "Tester la Voix" : "Try Voice Studio",
        href: "/voice",
        features: [
          isFr
            ? "Visualiseur concentrique en temps réel"
            : "Live concentric ripple audio bars",
          isFr
            ? "Suggestions selon l'étude récente"
            : "Contextualized by recent sermon studied",
          isFr
            ? "Conserve la prière dans vos favoris"
            : "Save audio reflections to favorites",
        ],
      },
    },
    {
      id: "shot-6",
      title: isFr
        ? "Parcours Thématiques en 5 Jours Chrono"
        : "5-Day Topical Sprints with Clear Finish Lines",
      category: "devotion",
      author: {
        name: "Pastoral Curriculum",
        avatar: "/logol.png",
        role: isFr ? "Enseignement" : "Discipleship",
        badge: "VERIFIED",
      },
      palette: {
        from: "from-[#F6F8FD]",
        to: "to-[#E5EDF9]",
        accent: "#3E74C4",
        border: "border-[#C9D9F2]",
        swatches: ["#F6F8FD", "#E5EDF9", "#3E74C4", "#1E1931"],
      },
      metrics: {
        views: "16.9k",
        likes: likesCounts["shot-6"],
        saves: 88,
      },
      preview: {
        eyebrow: isFr ? "SÉRIES COURTES" : "SHORT CURRICULA",
        headline: isFr
          ? "Surmonter l'Anxiété & Décisions Pro"
          : "Overcoming Workplace Anxiety & Decisions",
        subline: isFr
          ? "Finissez ce que vous commencez sans vous perdre dans des plans de 6 mois"
          : "Finish what you start without dropping out of overwhelming 180-day tracks",
        tag: isFr ? "5 Jours · 5 Minutes" : "5 Days · 5 Minutes",
        iconType: "compass",
        actionLabel: isFr ? "Aperçu du Programme" : "Preview Curriculum",
        href: "#journeys",
        features: [
          isFr
            ? "Objectifs clairs du Jour 1 au Jour 5"
            : "Clear daily milestone roadmap",
          isFr
            ? "Ancrage dans Philippiens 4 & Jean 14"
            : "Rooted in Philippians 4 & John 14",
          isFr
            ? "Zéro culpabilité si vous manquez un jour"
            : "Zero guilt if your week gets busy",
        ],
      },
    },
  ];

  const filteredShots = shots.filter(
    (shot) => activeCategory === "all" || shot.category === activeCategory
  );

  const toggleLike = (id: string) => {
    setLikedShots((prev) => {
      const isLiked = !prev[id];
      setLikesCounts((c) => ({
        ...c,
        [id]: c[id] + (isLiked ? 1 : -1),
      }));
      return { ...prev, [id]: isLiked };
    });
  };

  const toggleSave = (id: string) => {
    setSavedShots((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div id="design-showcase" className="space-y-12">
      {/* Editorial Heading in Dribbble & Identity Designed style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA4C89] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#705E8C] dark:text-[#37C6C2] font-semibold">
              {isFr
                ? "ARCHITECTURE DESIGN · DRIBBBLE & IDENTITY DESIGNED"
                : "DRIBBBLE-INSPIRED PRODUCT SHOWCASE & DESIGN SYSTEM"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#1E1931] dark:text-white tracking-tight leading-[1.08] text-balance">
            {isFr
              ? "Une interface conçue avec "
              : "Crafted with the aesthetic rigor of a "}
            <em className="text-[#705EAA] dark:text-[#E3B15E] not-italic font-serif">
              {isFr
                ? "la grâce et la précision d'un studio éditorial."
                : "world-class design studio."}
            </em>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5A506B] dark:text-[#C8C2D6] max-w-2xl leading-relaxed">
            {isFr
              ? "Inspiré par Dribbble et Identity Designed : palette harmonieuse Coolors, typographie éditoriale Fontshare, iconographie Phosphor et maquettes Mockups Design."
              : "Inspired by Dribbble and Identity Designed: curated Coolors sanctuary palettes, Fontshare editorial typography, Phosphor duotone icons, and Mockups Design studio frames."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E1931] dark:bg-[#37C6C2] text-white dark:text-[#082220] text-xs font-bold shadow-md hover:opacity-95 transition-all whitespace-nowrap"
          >
            <span>
              {isFr ? "Accéder au Sanctuaire" : "Open Sanctuary Dashboard"}
            </span>
            <ArrowUpRight size={15} weight="bold" />
          </Link>
        </div>
      </div>

      {/* 5-Pillar Design System Spec Bar: Coolors · Fontshare · Phosphor · Mockups Design · Identity Designed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5 rounded-3xl bg-white dark:bg-[#1B152C] border border-[#2D2542]/10 dark:border-white/10 shadow-xs">
        {/* 1. Colors: Coolors */}
        <div className="p-3.5 rounded-2xl bg-[#FBFAF7] dark:bg-[#120E1E] border border-[#2D2542]/8 dark:border-white/8 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#1E1931] dark:text-white">
            <span className="inline-flex items-center gap-1.5">
              <Palette size={16} weight="duotone" className="text-[#EA4C89]" />
              <span>Colors: Coolors</span>
            </span>
            <span className="text-[10px] font-mono text-[#705E8C] dark:text-[#37C6C2]">
              {copiedHex ? `Copied ${copiedHex}` : "60·30·10"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {COOLORS_SWATCHES.map((s) => (
              <button
                key={s.hex}
                type="button"
                onClick={() => handleCopyHex(s.hex)}
                title={`${isFr ? s.nameFr : s.nameEn} (${s.hex})`}
                className="h-6 flex-1 rounded-md border border-black/15 dark:border-white/20 transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: s.hex }}
                aria-label={s.hex}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6] leading-snug">
            {isFr
              ? "Albâtre #FBFAF7, Prune #1E1931, Sarcelle #1FB6B0 & Or #E3B15E"
              : "Alabaster #FBFAF7, Plum #1E1931, Teal #1FB6B0 & Gold #E3B15E"}
          </p>
        </div>

        {/* 2. Typo: Fontshare */}
        <div className="p-3.5 rounded-2xl bg-[#FBFAF7] dark:bg-[#120E1E] border border-[#2D2542]/8 dark:border-white/8 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1E1931] dark:text-white">
            <span className="inline-flex items-center gap-1.5">
              <TextAa size={16} weight="duotone" className="text-[#1FB6B0]" />
              <span>Typo: Fontshare</span>
            </span>
            <span className="text-[10px] font-mono text-[#705E8C] dark:text-[#37C6C2]">
              2+1 Scale
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-lg font-bold text-[#1E1931] dark:text-white leading-none">
              Zodiak
            </span>
            <span className="text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6]">
              + Satoshi
            </span>
          </div>
          <p className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6] leading-snug">
            {isFr
              ? "Sérif éditorial Zodiak & Cormorant associé au corps géométrique Satoshi"
              : "Zodiak & Clash Display paired with high-legibility Satoshi prose"}
          </p>
        </div>

        {/* 3. Icons: Phosphor */}
        <div className="p-3.5 rounded-2xl bg-[#FBFAF7] dark:bg-[#120E1E] border border-[#2D2542]/8 dark:border-white/8 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1E1931] dark:text-white">
            <span className="inline-flex items-center gap-1.5">
              <Sparkle size={16} weight="duotone" className="text-[#E3B15E]" />
              <span>Icons: Phosphor</span>
            </span>
            <span className="text-[10px] font-mono text-[#705E8C] dark:text-[#37C6C2]">
              Duotone
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[#1E1931] dark:text-[#37C6C2]">
            <BookOpenText size={18} weight="duotone" />
            <MicrophoneStage size={18} weight="duotone" />
            <Waveform size={18} weight="duotone" />
            <ChartBar size={18} weight="duotone" />
            <Feather size={18} weight="duotone" />
            <SealCheck size={18} weight="duotone" />
          </div>
          <p className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6] leading-snug">
            {isFr
              ? "Système d'icônes vectorielles Phosphor à double tonalité"
              : "Consistent vector affordances with semantic duotone weights"}
          </p>
        </div>

        {/* 4. Mockups: Mockups Design */}
        <div className="p-3.5 rounded-2xl bg-[#FBFAF7] dark:bg-[#120E1E] border border-[#2D2542]/8 dark:border-white/8 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1E1931] dark:text-white">
            <span className="inline-flex items-center gap-1.5">
              <DeviceMobileCamera
                size={16}
                weight="duotone"
                className="text-[#705EAA]"
              />
              <span>Mockups Design</span>
            </span>
            <span className="text-[10px] font-mono text-[#705E8C] dark:text-[#37C6C2]">
              Interactive
            </span>
          </div>
          <div className="text-xs font-serif font-bold text-[#1E1931] dark:text-white">
            {isFr ? "Châssis Studio iPhone 16 Pro" : "iPhone 16 Pro Studio Frame"}
          </div>
          <p className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6] leading-snug">
            {isFr
              ? "Aperçus matériels tactiles en direct avec ombres portées calibrées"
              : "Tactile hardware bezels with live interactive devotion tabs"}
          </p>
        </div>

        {/* 5. Inspiration: Identity Designed */}
        <div className="p-3.5 rounded-2xl bg-[#FBFAF7] dark:bg-[#120E1E] border border-[#2D2542]/8 dark:border-white/8 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1E1931] dark:text-white">
            <span className="inline-flex items-center gap-1.5">
              <Compass size={16} weight="duotone" className="text-[#1FB6B0]" />
              <span>Identity Designed</span>
            </span>
            <span className="text-[10px] font-mono text-[#705E8C] dark:text-[#37C6C2]">
              Editorial
            </span>
          </div>
          <div className="text-xs font-serif font-bold text-[#1E1931] dark:text-white">
            {isFr ? "Grille Suisse & Monogramme" : "Swiss Grid & Brand Identity"}
          </div>
          <p className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6] leading-snug">
            {isFr
              ? "Hiérarchie calme, filets subtils 1px et proportions d'édition"
              : "Architectural hairlines, unboxed metadata & print rhythm"}
          </p>
        </div>
      </div>

      {/* Category Filter Tabs (Dribbble segmented bar) */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#2D2542]/10 dark:border-white/10 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          {[
            { id: "all" as const, label: isFr ? "Tous les Shots" : "All Shots" },
            {
              id: "devotion" as const,
              label: isFr ? "Méditation Quotidienne" : "Daily Devotion",
            },
            {
              id: "audio" as const,
              label: isFr ? "Studio Audio Sacré" : "Sacred Audio",
            },
            {
              id: "journal" as const,
              label: isFr ? "Journal Intime" : "Soul Journal",
            },
            {
              id: "stats" as const,
              label: isFr ? "Métriques & Sabbat" : "Consistency & Sabbath",
            },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#1E1931] dark:bg-[#37C6C2] text-white dark:text-[#082220] shadow-xs"
                    : "bg-white dark:bg-[#1B152C] text-[#65597C] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-[#251D3B] border border-[#2D2542]/10 dark:border-white/10"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#705E8C] dark:text-[#37C6C2] font-mono tabular-nums">
          <span>{filteredShots.length}</span>
          <span>·</span>
          <span>{isFr ? "MODULES INTERACTIFS" : "INTERACTIVE SHOTS"}</span>
        </div>
      </div>

      {/* 3-Column Dribbble Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredShots.map((shot) => {
          const isLiked = Boolean(likedShots[shot.id]);
          const isSaved = Boolean(savedShots[shot.id]);
          const isDark = shot.category === "audio";

          return (
            <div
              key={shot.id}
              className="group flex flex-col rounded-3xl bg-white dark:bg-[#1B152C] border border-[#2D2542]/10 dark:border-white/10 shadow-[0_4px_24px_rgba(30,25,49,0.06)] hover:shadow-[0_18px_40px_rgba(30,25,49,0.12)] hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              {/* Visual Canvas Area */}
              <div
                className={`relative p-6 sm:p-7 min-h-[280px] bg-gradient-to-br ${shot.palette.from} ${shot.palette.to} flex flex-col justify-between border-b ${shot.palette.border} overflow-hidden`}
              >
                {/* Subtle Background Orb */}
                <div
                  className="absolute -right-8 -top-8 w-44 h-44 rounded-full opacity-15 pointer-events-none"
                  style={{ background: shot.palette.accent }}
                />

                {/* Top Bar inside Shot */}
                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                      isDark ? "text-white/85" : "text-[#514468]"
                    }`}
                  >
                    {shot.preview.eyebrow} · {shot.preview.tag}
                  </span>

                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-xs"
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,0.12)"
                        : "#FFFFFF",
                    }}
                  >
                    {renderShotIcon(
                      shot.preview.iconType,
                      isDark,
                      shot.palette.accent
                    )}
                  </span>
                </div>

                {/* Canvas Center Typography */}
                <div className="relative z-10 my-4">
                  <h3
                    className={`text-xl font-serif font-bold tracking-tight leading-snug line-clamp-2 ${
                      isDark ? "text-white" : "text-[#1E1931]"
                    }`}
                  >
                    {shot.preview.headline}
                  </h3>
                  <p
                    className={`mt-2 text-xs leading-relaxed line-clamp-2 ${
                      isDark ? "text-white/75" : "text-[#584D6F]"
                    }`}
                  >
                    {shot.preview.subline}
                  </p>
                </div>

                {/* Feature Bullets + Coolors Mini Swatch Strip inside preview */}
                <div className="relative z-10 pt-3 border-t border-black/5 dark:border-white/10 space-y-2.5">
                  <ul className="space-y-1 text-[11px]">
                    {shot.preview.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className={`flex items-center gap-1.5 ${
                          isDark ? "text-white/80" : "text-[#473B5E]"
                        }`}
                      >
                        <CheckCircle
                          size={13}
                          weight="fill"
                          style={{ color: shot.palette.accent }}
                        />
                        <span className="line-clamp-1">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      {shot.palette.swatches.map((hex) => (
                        <span
                          key={hex}
                          className="w-3 h-3 rounded-full border border-black/15"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[10px] font-mono tabular-nums inline-flex items-center gap-1 ${
                        isDark ? "text-white/60" : "text-[#6B5F82]"
                      }`}
                    >
                      <Eye size={12} />
                      {shot.metrics.views}
                    </span>
                  </div>
                </div>

                {/* Hover Overlay with Quick Action Button */}
                <div className="absolute inset-0 bg-black/45 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 z-20">
                  <Link
                    href={shot.preview.href}
                    className="px-5 py-2.5 rounded-full bg-white text-[#1E1931] text-xs font-bold shadow-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>{shot.preview.actionLabel}</span>
                    <ArrowUpRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>

              {/* Footer Metadata & Creator Info (Classic Dribbble anatomy) */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-white dark:bg-[#1B152C]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#1E1931] dark:bg-[#37C6C2] text-white dark:text-[#082220] flex items-center justify-center text-[10px] font-bold font-serif shrink-0">
                    LB
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-[#1E1931] dark:text-white truncate">
                      <span className="font-bold truncate">
                        {shot.author.name}
                      </span>
                      {shot.author.badge && (
                        <>
                          <span aria-hidden="true" className="text-[#7E7494]">
                            ·
                          </span>
                          <span className="text-[10px] font-mono text-[#705E8C] dark:text-[#37C6C2]">
                            {shot.author.badge}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="block text-[10px] text-[#7E7494] dark:text-[#A99FB8] truncate">
                      {shot.author.role}
                    </span>
                  </div>
                </div>

                {/* Social Counters (Likes, Saves) with Phosphor Icons */}
                <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                  <button
                    type="button"
                    onClick={() => toggleLike(shot.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      isLiked
                        ? "bg-[#EA4C89]/15 text-[#EA4C89]"
                        : "text-[#6B5F82] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-white/10"
                    }`}
                    title={isLiked ? "Unlike" : "Like this shot"}
                    aria-label="Like shot"
                  >
                    <Heart
                      size={14}
                      weight={isLiked ? "fill" : "bold"}
                      className={
                        isLiked ? "text-[#EA4C89]" : "text-current"
                      }
                    />
                    <span>{shot.metrics.likes}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSave(shot.id)}
                    className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                      isSaved
                        ? "bg-[#1FB6B0]/15 text-[#0E726D] dark:text-[#37C6C2]"
                        : "text-[#6B5F82] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-white/10"
                    }`}
                    title={
                      isSaved ? "Saved to collection" : "Save to collection"
                    }
                    aria-label="Save shot"
                  >
                    <BookmarkSimple
                      size={15}
                      weight={isSaved ? "fill" : "bold"}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
