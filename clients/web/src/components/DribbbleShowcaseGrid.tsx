"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

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
    icon: string;
    actionLabel: string;
    href: string;
    features: string[];
  };
}

export function DribbbleShowcaseGrid() {
  const { isFr } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<"all" | "devotion" | "audio" | "journal" | "stats">("all");
  const [likedShots, setLikedShots] = useState<Record<string, boolean>>({});
  const [savedShots, setSavedShots] = useState<Record<string, boolean>>({});
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({
    "shot-1": 348,
    "shot-2": 512,
    "shot-3": 289,
    "shot-4": 421,
    "shot-5": 310,
    "shot-6": 467,
  });

  const shots: ShotItem[] = [
    {
      id: "shot-1",
      title: isFr ? "Étude Expositive Quotidienne en 3 Étapes" : "3-Step Daily Quiet Time & Expository Verse",
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
      },
      metrics: {
        views: "14.2k",
        likes: likesCounts["shot-1"],
        saves: 84,
      },
      preview: {
        eyebrow: isFr ? "ROUTINE DU MATIN" : "MORNING ROUTINE",
        headline: isFr ? "Lire · Méditer · Prier en 5 Minutes" : "Read · Reflect · Pray in 5 Minutes",
        subline: isFr ? "Psaume 23:3 · « Il restaure mon âme dans les sentiers de justice »" : "Psalm 23:3 · “He restores my soul; he leads me in paths of righteousness”",
        tag: isFr ? "5 Versions Bibliques" : "5 Verified Translations",
        icon: "📖",
        actionLabel: isFr ? "Explorer l'Étude" : "Open Devotion",
        href: "#how-it-works",
        features: [
          isFr ? "Traductions LSG, Semeur & ESV" : "ESV, NIV, CSB & LSG texts",
          isFr ? "3 Questions de réflexion concrète" : "3 real-world application prompts",
          isFr ? "Chiffrement local sur votre appareil" : "Private local device storage",
        ],
      },
    },
    {
      id: "shot-2",
      title: isFr ? "Studio Living Word & Disque Audio Sacré" : "Living Word Sanctuary & Dedicated Sacred Audio",
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
      },
      metrics: {
        views: "21.8k",
        likes: likesCounts["shot-2"],
        saves: 142,
      },
      preview: {
        eyebrow: isFr ? "STREAMING SACRÉ" : "SACRED STREAMING",
        headline: isFr ? "The Cost of Discipleship & Romans 8" : "The Cost of Discipleship & Romans 8",
        subline: isFr ? "Discours audio avec égaliseur fréquence & signets de versets" : "Lossless audio visualizer with live equalizer and timestamp bookmarks",
        tag: isFr ? "Flux RSS Apple & Spotify" : "Apple & Spotify RSS 2.0",
        icon: "🎙️",
        actionLabel: isFr ? "Écouter l'Enseignement" : "Listen in Studio",
        href: "/living-word",
        features: [
          isFr ? "Mode audio sombre sans distraction" : "Distraction-free dark audio mode",
          isFr ? "Signet de note à 01:45 vers le journal" : "Timestamp bookmark syncs to journal",
          isFr ? "Tiroir interactif de références croisées" : "Interactive Scripture cross-reference drawer",
        ],
      },
    },
    {
      id: "shot-3",
      title: isFr ? "Matrice d'Habitude & Heatmap 30 Jours" : "30-Day Dwell-Time Consistency Heatmap",
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
      },
      metrics: {
        views: "9.6k",
        likes: likesCounts["shot-3"],
        saves: 67,
      },
      preview: {
        eyebrow: isFr ? "SÉRIES & SABBAT" : "STREAKS & SABBATH",
        headline: isFr ? "14 Jours de Série · Protection de Grâce" : "14-Day Active Streak · Grace Protection",
        subline: isFr ? "Le repos du sabbat préserve votre élan sans jamais réinitialiser à zéro" : "Intentional Sabbath rest protects your spiritual rhythm without guilt resets",
        tag: isFr ? "93% Taux de Régularité" : "93% Monthly Consistency",
        icon: "🔥",
        actionLabel: isFr ? "Voir mes Métriques" : "View Heatmap",
        href: "/progress",
        features: [
          isFr ? "Grille d'intensité 30 jours cliquable" : "Clickable 30-day intensity grid",
          isFr ? "Plafond de points de grâce hebdomadaire" : "+50 Grace points for Sabbath rest",
          isFr ? "Trophées débloquables (Flamme, Sabbat)" : "Unlockable milestone badges & seals",
        ],
      },
    },
    {
      id: "shot-4",
      title: isFr ? "Journal Spirituel Intime & Exportation JSON" : "Private Spiritual Journal & JSON Data Portability",
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
      },
      metrics: {
        views: "11.1k",
        likes: likesCounts["shot-4"],
        saves: 95,
      },
      preview: {
        eyebrow: isFr ? "MÉDITATIONS PRIVÉES" : "PRIVATE MEDITATIONS",
        headline: isFr ? "Écrire sans Peur d'Être Suivi" : "Reflect Without Telemetry or Tracking",
        subline: isFr ? "Vos notes intimes restent sur votre matériel, jamais revendues" : "Your deeply personal prayers stay encrypted locally with zero ad profiling",
        tag: isFr ? "Export JSON en 1 Clic" : "1-Click JSON Export",
        icon: "✍️",
        actionLabel: isFr ? "Ouvrir le Journal" : "Open Journal",
        href: "/progress#journal",
        features: [
          isFr ? "Sauvegarde automatique instantanée" : "Instant local autosave across sessions",
          isFr ? "Étiquettes thématiques (#Paix, #Sagesse)" : "Topical tags (#Peace, #Wisdom)",
          isFr ? "Export complet en fichier .json sécurisé" : "Full offline JSON backup download",
        ],
      },
    },
    {
      id: "shot-5",
      title: isFr ? "Recherche Vocale Sanctifiée & Onde Sonore" : "Sanctified Voice Assistant & Ripple Visualizer",
      category: "audio",
      author: {
        name: "LifeBook Voice",
        avatar: "/logol.png",
        role: isFr ? "Prière Orale" : "Voice AI",
        badge: "LABS",
      },
      palette: {
        from: "from-[#1A2530]",
        to: "to-[#0F171F]",
        accent: "#E5B96B",
        border: "border-[#2D3F52]",
      },
      metrics: {
        views: "18.4k",
        likes: likesCounts["shot-5"],
        saves: 110,
      },
      preview: {
        eyebrow: isFr ? "PRIÈRE PARLÉE" : "SPOKEN PRAYER",
        headline: isFr ? "Spectre Fréquentiel & Versets Proposés" : "Frequency Visualizer & Scripture Recommendations",
        subline: isFr ? "Exprimez vos fardeaux à haute voix et recevez la parole adaptée" : "Speak honest burdens into the microphone and receive rooted pastoral peace",
        tag: isFr ? "Microphone Direct" : "Live Web Audio API",
        icon: "🎙️",
        actionLabel: isFr ? "Tester la Voix" : "Try Voice Studio",
        href: "/voice",
        features: [
          isFr ? "Visualiseur concentrique en temps réel" : "Live concentric ripple audio bars",
          isFr ? "Suggestions selon l'étude récente" : "Contextualized by recent sermon studied",
          isFr ? "Conserve la prière dans vos favoris" : "Save audio reflections to favorites",
        ],
      },
    },
    {
      id: "shot-6",
      title: isFr ? "Parcours Thématiques en 5 Jours Chrono" : "5-Day Topical Sprints with Clear Finish Lines",
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
      },
      metrics: {
        views: "16.9k",
        likes: likesCounts["shot-6"],
        saves: 88,
      },
      preview: {
        eyebrow: isFr ? "SÉRIES COURTES" : "SHORT CURRICULA",
        headline: isFr ? "Surmonter l'Anxiété & Décisions Pro" : "Overcoming Workplace Anxiety & Decisions",
        subline: isFr ? "Finissez ce que vous commencez sans vous perdre dans des plans de 6 mois" : "Finish what you start without dropping out of overwhelming 180-day tracks",
        tag: isFr ? "5 Jours · 5 Minutes" : "5 Days · 5 Minutes",
        icon: "🧭",
        actionLabel: isFr ? "Aperçu du Programme" : "Preview Curriculum",
        href: "#journey-preview",
        features: [
          isFr ? "Objectifs clairs du Jour 1 au Jour 5" : "Clear daily milestone roadmap",
          isFr ? "Ancrage dans Philippiens 4 & Jean 14" : "Rooted in Philippians 4 & John 14",
          isFr ? "Zéro culpabilité si vous manquez un jour" : "Zero guilt if your week gets busy",
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
    <section className="dribbble-showcase-section py-20 bg-[#FBF9F5] border-t border-b border-[#2D2542]/8" id="design-showcase">
      <div className="page-shell">
        {/* Editorial Heading in Dribbble Design style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA4C89] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#705E8C] font-semibold">
                {isFr ? "GALERIE DESIGN INSPIRÉE DE DRIBBBLE" : "DRIBBBLE-INSPIRED PRODUCT SHOWCASE"}
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#1E1931] tracking-tight leading-[1.08] text-balance">
              {isFr ? "Une interface conçue avec " : "Crafted with the aesthetic rigor of a "}
              <em className="text-[#705EAA] not-italic font-serif">
                {isFr ? "la grâce et la précision d'un designer." : "world-class design studio."}
              </em>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#685D7C] max-w-2xl leading-relaxed">
              {isFr
                ? "Parcourez nos modules clés présentés sous forme de Shots Dribbble interactifs : étudiez l'Écriture, écoutez des prédications avec égaliseur dynamique, et suivez votre sanctification."
                : "Explore our signature features rendered as interactive Dribbble design cards: daily expository study, sacred audio studio with dynamic visualizers, and mindful discipleship metrics."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E1931] text-white text-xs font-bold shadow-md hover:bg-[#322852] hover:-translate-y-0.5 transition-all"
            >
              <span>{isFr ? "Accéder au Dashboard Dribbble" : "Open Dribbble Dashboard"}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Category Pill Filters (Dribbble style segmented bar) */}
        <div className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-[#2D2542]/10 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: "all" as const, label: isFr ? "Tous les Shots" : "All Shots" },
              { id: "devotion" as const, label: isFr ? "Méditation Quotidienne" : "Daily Devotion" },
              { id: "audio" as const, label: isFr ? "Studio Audio Sacré" : "Sacred Audio" },
              { id: "journal" as const, label: isFr ? "Journal Intime" : "Soul Journal" },
              { id: "stats" as const, label: isFr ? "Métriques & Sabbat" : "Consistency & Sabbath" },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#1E1931] text-white shadow-xs"
                      : "bg-white text-[#65597C] hover:bg-[#F2ECE1] border border-[#2D2542]/10"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-[#705E8C] font-mono">
            <span>{filteredShots.length} {isFr ? "MODULES DISPONIBLES" : "FEATURE SHOTS"}</span>
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
                className="group flex flex-col rounded-3xl bg-white border border-[#2D2542]/10 shadow-[0_4px_24px_rgba(30,25,49,0.06)] hover:shadow-[0_18px_40px_rgba(30,25,49,0.12)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
              >
                {/* Visual Canvas Area */}
                <div
                  className={`relative p-6 sm:p-7 min-h-[280px] bg-gradient-to-br ${shot.palette.from} ${shot.palette.to} flex flex-col justify-between border-b ${shot.palette.border} overflow-hidden`}
                >
                  {/* Subtle Background Pattern */}
                  <div
                    className="absolute -right-8 -top-8 w-44 h-44 rounded-full opacity-15 pointer-events-none"
                    style={{ background: shot.palette.accent }}
                  />

                  {/* Top Bar inside Shot */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                        isDark
                          ? "bg-white/10 text-white/90 border border-white/15"
                          : "bg-black/5 text-[#514468] border border-black/10"
                      }`}
                    >
                      {shot.preview.eyebrow}
                    </span>

                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base shadow-xs"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.12)" : "#FFFFFF",
                        color: isDark ? "#FFFFFF" : "#1E1931",
                      }}
                    >
                      {shot.preview.icon}
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

                  {/* Feature Bullets inside preview */}
                  <div className="relative z-10 pt-3 border-t border-black/5 dark:border-white/10">
                    <ul className="space-y-1 text-[11px]">
                      {shot.preview.features.map((feat, idx) => (
                        <li
                          key={idx}
                          className={`flex items-center gap-1.5 ${
                            isDark ? "text-white/80" : "text-[#473B5E]"
                          }`}
                        >
                          <span style={{ color: shot.palette.accent }}>✓</span>
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hover Overlay with Quick Action Button */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 z-20">
                    <Link
                      href={shot.preview.href}
                      className="px-5 py-2.5 rounded-full bg-white text-[#1E1931] text-xs font-bold shadow-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      <span>{shot.preview.actionLabel}</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>

                {/* Footer Metadata & Creator Info (Classic Dribbble anatomy) */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#1E1931] text-white flex items-center justify-center text-[10px] font-bold font-serif shrink-0">
                      LB
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#1E1931] truncate">
                          {shot.author.name}
                        </span>
                        {shot.author.badge && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-[#1E1931]/8 text-[9px] font-mono font-bold text-[#51436B]">
                            {shot.author.badge}
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-[#7E7494] truncate">
                        {shot.author.role}
                      </span>
                    </div>
                  </div>

                  {/* Social Counters (Likes, Saves, Views) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleLike(shot.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        isLiked
                          ? "bg-[#EA4C89]/15 text-[#EA4C89]"
                          : "text-[#6B5F82] hover:bg-[#F2ECE1] hover:text-[#1E1931]"
                      }`}
                      title={isLiked ? "Unlike" : "Like this shot"}
                      aria-label="Like shot"
                    >
                      <span className={isLiked ? "scale-115 transition-transform" : ""}>
                        {isLiked ? "❤️" : "🤍"}
                      </span>
                      <span>{shot.metrics.likes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSave(shot.id)}
                      className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                        isSaved
                          ? "bg-[#1FB6B0]/15 text-[#0E726D]"
                          : "text-[#6B5F82] hover:bg-[#F2ECE1] hover:text-[#1E1931]"
                      }`}
                      title={isSaved ? "Saved to collection" : "Save to collection"}
                      aria-label="Save shot"
                    >
                      <span>{isSaved ? "🔖" : "📑"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dribbble Style Bottom Call to Action Banner */}
        <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-[#1E1835] text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-[#EA4C89]/15 blur-3xl pointer-events-none" />
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-[#56C2B4]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="text-xs font-mono font-bold tracking-widest text-[#E5B96B] uppercase">
              {isFr ? "DISCIPLESHIP MODERNE & ÉPURÉ" : "REFINED SPIRITUAL ARCHITECTURE"}
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif mt-1 font-bold text-balance">
              {isFr
                ? "Prêt à transformer vos matinées avec un design qui honore Dieu ?"
                : "Experience faith technology designed without distraction or clutter."}
            </h3>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              {isFr
                ? "Rejoignez des milliers de croyants bâtissant un rythme quotidien en 5 minutes avec verset du jour, méditation guidée et prière authentique."
                : "Join disciples anchoring their mornings with curated Scripture, guided prayer reflection, and a grace-protected 30-day streak."}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-full bg-[#EA4C89] hover:bg-[#F05E98] text-white text-xs font-bold shadow-lg hover:shadow-pink-500/25 hover:-translate-y-0.5 transition-all"
            >
              {isFr ? "Explorer le Dashboard Dribbble" : "Launch Dribbble Dashboard"}
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 hover:-translate-y-0.5 transition-all"
            >
              {isFr ? "Commencer Gratuitement" : "Get Started Free"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
