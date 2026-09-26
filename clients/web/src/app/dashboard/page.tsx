"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChristianAuth } from "@/lib/christian-auth";
import {
  getStreakData,
  getMilestoneProgress,
  recordDailyActivity,
  STREAK_CHANGE_EVENT,
  type StreakData,
} from "@/lib/streak";
import {
  getGracePoints,
  getTodayRitualCompletion,
  LIFEBOOK_RITUAL_COMPLETED_EVENT,
  type CompletedRitualPayload,
} from "@/lib/daily-ritual";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { CloudSyncBadge } from "@/components/CloudSyncBadge";
import { PWAInstallButton } from "@/components/PWAInstallPrompt";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";
import ProgressScreen from "@/components/ProgressScreen";
import { TeacherLiveCallBanner } from "@/components/TeacherLiveCallModal";
import { SanctuaryWalkthroughModal } from "@/components/SanctuaryWalkthroughModal";
import { triggerOpenWalkthrough } from "@/lib/live-call";
import { HumanVoiceSelector } from "@/components/HumanVoiceSelector";
import { speakWithHumanVoice, stopHumanVoice } from "@/lib/human-voice";

export interface DashboardJournalEntry {
  id: string;
  date: string; // e.g. "2026-09-22" or "Yesterday · 8:30 AM"
  isoDate: string; // "YYYY-MM-DD" for date filtering
  time?: string;
  text: string;
  mood: "grateful" | "peaceful" | "seeking" | "convicted" | "doubting" | "distant" | "sabbath";
  moodEmoji: string;
  moodLabel: string;
  moodColor: string;
  scriptureRef: string;
  scriptureSnippet?: string;
  tags?: string[];
  isFavorite?: boolean;
}

const INITIAL_JOURNAL_ENTRIES: DashboardJournalEntry[] = [
  {
    id: "dj-1",
    date: "2026-09-22 · 8:30 AM",
    isoDate: "2026-09-22",
    time: "8:30 AM",
    text: "“The Lord is my shepherd, I shall not want.” Learning to let go of the pressure to control tomorrow and simply rest in His goodness and sovereign providence.",
    mood: "peaceful",
    moodEmoji: "🕊",
    moodLabel: "Peaceful",
    moodColor: "#37C6C2",
    scriptureRef: "Psalm 23:1-3",
    scriptureSnippet: "He restores my soul. He leads me in paths of righteousness for his name’s sake.",
    tags: ["#Peace", "#Surrender", "#Abiding"],
    isFavorite: true,
  },
  {
    id: "dj-2",
    date: "2026-09-20 · 7:15 AM",
    isoDate: "2026-09-20",
    time: "7:15 AM",
    text: "Felt unsettled in the morning with impending client deadlines, but sitting quietly with Psalm 46:10 reminded me that being still before God is never wasted time.",
    mood: "grateful",
    moodEmoji: "🙏",
    moodLabel: "Grateful",
    moodColor: "#E3B15E",
    scriptureRef: "Psalm 46:10",
    scriptureSnippet: "Be still, and know that I am God.",
    tags: ["#Gratitude", "#Stillness"],
    isFavorite: false,
  },
  {
    id: "dj-3",
    date: "2026-09-18 · 9:40 PM",
    isoDate: "2026-09-18",
    time: "9:40 PM",
    text: "Wrestling with direction for my work this season. Asking for wisdom from above and trusting His guidance step-by-step rather than rushing ahead.",
    mood: "seeking",
    moodEmoji: "🔍",
    moodLabel: "Seeking",
    moodColor: "#7B62B8",
    scriptureRef: "Proverbs 3:5-6",
    scriptureSnippet: "Trust in the Lord with all your heart, and do not lean on your own understanding.",
    tags: ["#SeekingWisdom", "#Discernment"],
    isFavorite: true,
  },
  {
    id: "dj-4",
    date: "2026-09-15 · 6:50 AM",
    isoDate: "2026-09-15",
    time: "6:50 AM",
    text: "Nothing in all creation will be able to separate us from the love of God in Christ Jesus. Whatever the week holds, this covenant promise is immovable.",
    mood: "peaceful",
    moodEmoji: "🕊",
    moodLabel: "Peaceful",
    moodColor: "#37C6C2",
    scriptureRef: "Romans 8:38-39",
    scriptureSnippet: "Neither death nor life, nor angels nor rulers... will be able to separate us from the love of God.",
    tags: ["#EternalSecurity", "#Grace"],
    isFavorite: true,
  },
  {
    id: "dj-5",
    date: "2026-09-12 · 8:10 AM",
    isoDate: "2026-09-12",
    time: "8:10 AM",
    text: "Sabbath morning stillness. Put devices on silent. Remembered that my worth is not anchored in my productivity but in Christ's finished sacrifice.",
    mood: "sabbath",
    moodEmoji: "🌿",
    moodLabel: "Sabbath Rest",
    moodColor: "#1FB6B0",
    scriptureRef: "Genesis 2:2-3",
    scriptureSnippet: "And on the seventh day God ended His work which He had done.",
    tags: ["#Sabbath", "#Rest", "#Grace"],
    isFavorite: false,
  },
  {
    id: "dj-6",
    date: "2026-09-08 · 7:00 AM",
    isoDate: "2026-09-08",
    time: "7:00 AM",
    text: "“Abide in me, and I in you.” Without Him I can do nothing of eternal weight. Starting the day surrendered to the true Vine.",
    mood: "grateful",
    moodEmoji: "🙏",
    moodLabel: "Grateful",
    moodColor: "#E3B15E",
    scriptureRef: "John 15:4-5",
    scriptureSnippet: "As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you.",
    tags: ["#Abiding", "#VineAndBranches"],
    isFavorite: false,
  },
];

export default function DribbbleDashboard() {
  const router = useRouter();
  const { isFr } = useLanguage();
  const { user, isSignedIn, signOut } = useChristianAuth();
  const { playTrack, currentTrack, isPlaying: isGlobalAudioPlaying, togglePlay: toggleGlobalAudio } = useSanctuaryAudio();

  // Active view filters: 'overview' | 'audio' | 'journal' | 'heatmap' | 'community'
  const [activeTab, setActiveTab] = useState<"overview" | "audio" | "journal" | "heatmap" | "community">(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam === "progress" || tabParam === "heatmap") return "heatmap";
      if (tabParam === "journal") return "journal";
      if (tabParam === "audio") return "audio";
    }
    return "overview";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScripture, setSelectedScripture] = useState<"psalm23" | "romans8" | "john15">("psalm23");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [savedDevotions, setSavedDevotions] = useState<Record<string, boolean>>({ "dev-1": true });
  const [quickPrayerText, setQuickPrayerText] = useState("");
  const [prayerSubmitted, setPrayerSubmitted] = useState(false);

  // Persistent 14-day streak state using lib/streak.ts
  const [streakData, setStreakData] = useState<StreakData>(() => getStreakData());
  const [gracePoints, setGracePoints] = useState<number>(() => getGracePoints());
  const [isRitualModalOpen, setIsRitualModalOpen] = useState<boolean>(false);
  const [todayRitual, setTodayRitual] = useState<CompletedRitualPayload | null>(() =>
    getTodayRitualCompletion()
  );

  // Journal tab specific filter & search states
  const [journalSearch, setJournalSearch] = useState("");
  const [journalDateFilter, setJournalDateFilter] = useState(""); // YYYY-MM-DD
  const [journalEntries, setJournalEntries] = useState<DashboardJournalEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("lifebook.dashboard.journal");
        if (stored) return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    return INITIAL_JOURNAL_ENTRIES;
  });

  useEffect(() => {
    const handleStreakChange = (e: Event) => {
      const customEvt = e as CustomEvent<StreakData>;
      if (customEvt.detail) {
        setStreakData(customEvt.detail);
      } else {
        setStreakData(getStreakData());
      }
      setGracePoints(getGracePoints());
      setTodayRitual(getTodayRitualCompletion());
    };

    const handleRitualComplete = (e: Event) => {
      const customEvt = e as CustomEvent<CompletedRitualPayload>;
      if (customEvt.detail) {
        setTodayRitual(customEvt.detail);
        setStreakData(customEvt.detail.updatedStreak);
        setGracePoints(customEvt.detail.totalGracePoints);
      }
      try {
        const stored = localStorage.getItem("lifebook.dashboard.journal");
        if (stored) setJournalEntries(JSON.parse(stored));
      } catch {
        // ignore
      }
    };

    window.addEventListener(STREAK_CHANGE_EVENT, handleStreakChange);
    window.addEventListener(LIFEBOOK_RITUAL_COMPLETED_EVENT, handleRitualComplete);
    window.addEventListener("storage", handleStreakChange);
    return () => {
      window.removeEventListener(STREAK_CHANGE_EVENT, handleStreakChange);
      window.removeEventListener(LIFEBOOK_RITUAL_COMPLETED_EVENT, handleRitualComplete);
      window.removeEventListener("storage", handleStreakChange);
    };
  }, []);

  const milestone = useMemo(() => {
    return getMilestoneProgress(streakData.currentStreak);
  }, [streakData.currentStreak]);

  const scriptures = {
    psalm23: {
      ref: isFr ? "Psaume 23:1-3 (LSG)" : "Psalm 23:1-3 (ESV)",
      text: isFr
        ? "« L'Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles. Il restaure mon âme. »"
        : "“The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.”",
      theme: isFr ? "Repos et Providence Divine" : "Rest & Divine Providence",
      verseCount: "3 verses · 90s read",
    },
    romans8: {
      ref: isFr ? "Romains 8:38-39 (LSG)" : "Romans 8:38-39 (ESV)",
      text: isFr
        ? "« Car j'ai l'assurance que ni la mort ni la vie, ni les anges ni les dominations... ne pourra nous séparer de l'amour de Dieu manifesté en Jésus-Christ notre Seigneur. »"
        : "“For I am sure that neither death nor life, nor angels nor rulers... will be able to separate us from the love of God in Christ Jesus our Lord.”",
      theme: isFr ? "Sécurité Éternelle & Grâce" : "Eternal Security & Grace",
      verseCount: "2 verses · 60s read",
    },
    john15: {
      ref: isFr ? "Jean 15:4-5 (LSG)" : "John 15:4-5 (ESV)",
      text: isFr
        ? "« Demeurez en moi, et je demeurerai en vous. Comme le sarment ne peut de lui-même porter du fruit... ainsi vous ne le pouvez non plus, si vous ne demeurez en moi. »"
        : "“Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me.”",
      theme: isFr ? "Demeurer dans la Vigne" : "Abiding in the True Vine",
      verseCount: "2 verses · 75s read",
    },
  };

  const handleToggleSave = (id: string) => {
    setSavedDevotions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePostPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrayerText.trim()) return;

    // Add entry to journalEntries
    const today = new Date();
    const isoDate = today.toISOString().slice(0, 10);
    const timeFormatted = today.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const newEntry: DashboardJournalEntry = {
      id: `dj-${Date.now()}`,
      date: `${isoDate} · ${timeFormatted}`,
      isoDate,
      time: timeFormatted,
      text: quickPrayerText.trim(),
      mood: "peaceful",
      moodEmoji: "🕊",
      moodLabel: isFr ? "Prière & Paix" : "Peaceful Prayer",
      moodColor: "#37C6C2",
      scriptureRef: scriptures[selectedScripture].ref,
      scriptureSnippet: scriptures[selectedScripture].text.slice(0, 80) + "...",
      tags: ["#Prayer", "#MorningQuietTime"],
      isFavorite: false,
    };

    setJournalEntries((prev) => {
      const updated = [newEntry, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("lifebook.dashboard.journal", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });

    // Record daily activity into streak tracker
    const updatedStreak = recordDailyActivity(false);
    setStreakData(updatedStreak);

    setPrayerSubmitted(true);
    setTimeout(() => {
      setQuickPrayerText("");
      setPrayerSubmitted(false);
    }, 3000);
  };

  // Filter journal entries based on Scripture reference or date or search query
  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      // Date filter check
      if (journalDateFilter) {
        if (entry.isoDate !== journalDateFilter && !entry.date.includes(journalDateFilter)) {
          return false;
        }
      }

      // Search query check: matches Scripture reference, text, tags, or mood
      if (journalSearch.trim()) {
        const query = journalSearch.toLowerCase().trim();
        const refMatch = entry.scriptureRef.toLowerCase().includes(query);
        const textMatch = entry.text.toLowerCase().includes(query);
        const dateMatch = entry.date.toLowerCase().includes(query) || entry.isoDate.includes(query);
        const tagMatch = Boolean(entry.tags?.some((t) => t.toLowerCase().includes(query)));
        const moodMatch = entry.moodLabel.toLowerCase().includes(query);

        if (!refMatch && !textMatch && !dateMatch && !tagMatch && !moodMatch) {
          return false;
        }
      }

      return true;
    });
  }, [journalEntries, journalDateFilter, journalSearch]);


  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#120F1D] text-[#1E1931] dark:text-[#F4EFE6] flex flex-col font-sans transition-colors">
      {/* Top Sanctuary App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#171326]/95 backdrop-blur-md border-b border-[#2D2542]/10 dark:border-white/12 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] flex items-center justify-center font-serif text-sm font-bold shadow-xs group-hover:scale-105 transition-transform">
                LB
              </div>
              <div>
                <span className="font-serif font-bold text-lg tracking-tight text-[#1E1931] dark:text-white block leading-none">
                  LifeBook
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5A4B7C] dark:text-[#4EE2D8] font-semibold">
                  {isFr ? "Sanctuaire Quotidien" : "Daily Sanctuary"}
                </span>
              </div>
            </Link>

            {/* Quick Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#2D2542]/10 dark:border-white/12 text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6]">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab !== "heatmap"
                    ? "text-[#1E1931] dark:text-white bg-[#F2ECE1] dark:bg-white/10"
                    : "hover:text-[#1E1931] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10"
                }`}
              >
                {isFr ? "Tableau de Bord" : "Dashboard"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("heatmap")}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "heatmap"
                    ? "text-[#1E1931] dark:text-white bg-[#F2ECE1] dark:bg-white/10"
                    : "hover:text-[#1E1931] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10"
                }`}
              >
                {isFr ? "Progrès & Habitudes" : "Progress & Rhythm"}
              </button>
              <Link href="/living-word" className="px-3 py-2 rounded-lg hover:text-[#1E1931] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors">
                {isFr ? "Enseignements" : "Teachings"}
              </Link>
              <Link href="/teachers" className="px-3 py-2 rounded-lg hover:text-[#1E1931] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors">
                {isFr ? "Portail des Pasteurs" : "Teachers Portal"}
              </Link>
              <Link href="/voice" className="px-3 py-2 rounded-lg hover:text-[#1E1931] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors">
                {isFr ? "Prière Vocale" : "Voice Practice"}
              </Link>
              <button
                type="button"
                onClick={triggerOpenWalkthrough}
                className="px-3 py-2 rounded-lg text-[#0E726D] dark:text-[#4EE2D8] hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isFr ? "Guide des Fonctionnalités" : "Feature Walkthrough"}
              </button>
            </nav>
          </div>

          {/* Search Box & Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden sm:block w-48 lg:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFr ? "Rechercher passage, thème..." : "Search passage, topic..."}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#F2ECE1] dark:bg-[#1E1836] text-[#1E1931] dark:text-white rounded-xl border border-transparent focus:border-[#2D2542]/20 dark:focus:border-white/25 focus:bg-white dark:focus:bg-[#120E22] outline-none transition-all placeholder:text-[#6E6285] dark:placeholder:text-[#A9A0BC]"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6E6285]" aria-hidden="true">
                🔍
              </span>
            </div>

            <LanguageToggle />
            <ThemeToggle />

            {/* User Profile & Session Controls */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#2D2542]/10 dark:border-white/12">
              <div className="w-8 h-8 rounded-full bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.firstName?.charAt(0) || "P"}
              </div>
              <span className="text-xs font-bold text-[#1E1931] dark:text-white hidden lg:inline">
                {user?.fullName || (isFr ? "Pèlerin" : "Pilgrim")}
              </span>
              {isSignedIn ? (
                <button
                  type="button"
                  id="dashboard-sign-out-btn"
                  onClick={async () => {
                    await signOut();
                    router.push("/?marketing=1");
                  }}
                  className="text-xs font-semibold text-[#6E6285] dark:text-[#B8B0C8] hover:text-[#1E1931] dark:hover:text-white transition-colors cursor-pointer px-2 py-1"
                >
                  {isFr ? "Déconnexion" : "Sign out"}
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="text-xs font-semibold text-[#2D2542] dark:text-[#4EE2D8] hover:underline px-2 py-1 whitespace-nowrap"
                >
                  {isFr ? "Connexion" : "Sign in"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Editorial Greeting Header */}
        <div className="rounded-3xl bg-gradient-to-r from-[#211B3B] via-[#2F2652] to-[#1A1530] text-white p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-[#E3B15E]/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-[#56C2B4]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-2 text-xs font-mono">
              <span className="font-bold uppercase tracking-wider text-[#FFD770]">
                {isFr ? "MÉDITATION DU JOUR" : "TODAY'S 5-MINUTE DEVOTION"}
              </span>
              <span className="text-white/60">·</span>
              <span className="text-white/85">5 MIN / 3 STEPS</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
              {isFr
                ? "« Il me fait reposer dans de verts pâturages. »"
                : "“He leads me beside still waters. He restores my soul.”"}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-white/85 leading-relaxed">
              {isFr
                ? "Déposez vos urgences avant vos réunions du matin. Écoutez le commentaire d'enseignement, notez votre méditation et préservez votre série de grâce."
                : "Anchor in quiet confidence before beginning work email. Stream audio commentary, reflect privately, and protect your 14-day discipleship streak."}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              id="dashboard-start-ritual-btn"
              onClick={() => setIsRitualModalOpen(true)}
              className="min-h-[42px] px-5 py-2.5 rounded-full bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B] text-xs font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>✦</span>
              <span>
                {todayRitual
                  ? isFr
                    ? "Méditation du jour scellée ✓ (Revoir)"
                    : "Today's Ritual Sealed ✓ (Review)"
                  : isFr
                  ? "Démarrer le Rituel 5-Min (3 Étapes)"
                  : "Begin 5-Min Guided Ritual (3 Steps)"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentTrack) {
                  toggleGlobalAudio();
                } else {
                  playTrack("psalm-23-still-waters");
                }
                setIsAudioPlaying(!isAudioPlaying);
              }}
              className="min-h-[42px] px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isGlobalAudioPlaying ? "⏸ Pause Audio" : "▶ 3-Min Audio"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("heatmap")}
              className="min-h-[42px] px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isFr ? "Progrès & Graphiques" : "Progress & Rhythm"}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Category & Sub-View Filter Segmented Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#2D2542]/10 dark:border-white/12 pb-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: "overview" as const, label: isFr ? "Vue d'Ensemble" : "Overview", icon: "✨" },
              { id: "heatmap" as const, label: isFr ? "Progrès, Graphiques & Sabbat" : "Progress, Charts & Heatmap", icon: "🔥" },
              { id: "journal" as const, label: isFr ? "Journal Intime" : "Soul Journal", icon: "✍️" },
              { id: "audio" as const, label: isFr ? "Studio Audio" : "Living Word Audio", icon: "🎙️" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                      : "bg-white dark:bg-[#1B1630] text-[#5A506B] dark:text-[#C8C2D6] hover:bg-[#EAE4D7] dark:hover:bg-[#272042] border border-[#2D2542]/10 dark:border-white/12"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerOpenWalkthrough}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/15 dark:border-white/15 text-xs font-bold text-[#1E1931] dark:text-white hover:bg-[#F2ECE1] dark:hover:bg-[#272042] transition-colors cursor-pointer whitespace-nowrap"
            >
              ✦ {isFr ? "Guide d'Utilisation (6)" : "Walkthrough Guide (6)"}
            </button>
            <CloudSyncBadge />
            <PWAInstallButton />
          </div>
        </div>

        {/* TEACHER-HOSTED LIVE SANCTUARY CALL (MAX 40 USERS · TEACHERS ONLY START) */}
        <section id="dashboard-live-call-section">
          <TeacherLiveCallBanner />
        </section>

        {/* FULL HUMAN VOICE STUDIO WHEN ON AUDIO TAB */}
        {activeTab === "audio" && (
          <section>
            <HumanVoiceSelector />
          </section>
        )}

        {/* VIEW 1: OVERVIEW DASHBOARD GRID */}
        {(activeTab === "overview" || activeTab === "heatmap") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric Card 1: Dynamic Streak Persisted in localStorage */}
            <div className="animate-stagger-card-1 rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/10 dark:border-white/12 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#1FB6B0]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl">
                  🔥
                </span>
                <span className="text-xs font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                  {isFr ? "Grâce active 🛡️" : "Grace Shield Active 🛡️"}
                </span>
              </div>
              <div className="my-4">
                <span className="text-4xl font-serif font-bold text-[#1E1931] dark:text-white">
                  {streakData.currentStreak}
                </span>
                <span className="text-sm font-serif text-[#5A4B7C] dark:text-[#C8C2D6] ml-2">
                  {isFr ? "Jours consécutifs" : "Continuous Days"}
                </span>
                <p className="mt-1 text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                  {isFr
                    ? `${streakData.sabbathRestDays} jours de repos du sabbat préservent votre élan spirituel.`
                    : `${streakData.sabbathRestDays} Sabbath rest days safely protect momentum without reset.`}
                </p>
              </div>

              {/* Dynamic Milestone Progress Bar */}
              <div className="pt-3 border-t border-[#2D2542]/10 dark:border-white/12 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#0E726D] dark:text-[#4EE2D8]">
                  <span>
                    {isFr ? `Objectif ${milestone.nextMilestoneDays} Jours` : `${milestone.nextMilestoneDays}-Day Milestone`}
                    <span className="text-xs font-mono font-normal text-[#5A4B7C] dark:text-[#C8C2D6] ml-1.5">
                      ({milestone.title})
                    </span>
                  </span>
                  <span className="font-mono">{milestone.progressPercent}%</span>
                </div>
                {/* Visual Progress Bar Track */}
                <div className="w-full h-2 rounded-full bg-[#EBF8F7] dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] to-[#56C2B4] transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(6, milestone.progressPercent)}%` }}
                    title={`${milestone.currentStreak}/${milestone.nextMilestoneDays} days (${milestone.daysRemaining} days remaining)`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#5A506B] dark:text-[#C8C2D6] pt-0.5">
                  <span>{milestone.currentStreak} / {milestone.nextMilestoneDays} days</span>
                  <span>{milestone.daysRemaining > 0 ? `${milestone.daysRemaining} days to go` : "Milestone reached!"}</span>
                </div>
              </div>
            </div>

            {/* Metric Card 2: Scripture Verses Studied */}
            <div className="animate-stagger-card-2 rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/10 dark:border-white/12 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#705EAA]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-[#EFEBF7] text-[#3D2E5C] flex items-center justify-center text-xl">
                  📖
                </span>
                <span className="text-xs font-mono font-bold text-[#5A4B7C] dark:text-[#C8C2D6]">
                  {isFr ? "LSG · ESV · NIV" : "ESV · NIV · KJV"}
                </span>
              </div>
              <div className="my-4">
                <span className="text-4xl font-serif font-bold text-[#1E1931] dark:text-white">48</span>
                <span className="text-sm font-serif text-[#5A4B7C] dark:text-[#C8C2D6] ml-2">
                  {isFr ? "Passages Clés" : "Verses Anchored"}
                </span>
                <p className="mt-1 text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                  {isFr
                    ? "Méditations ancrées dans les Psaumes, Romains et Jean."
                    : "Rooted across Psalms, Romans, and Gospels."}
                </p>
              </div>
              <div className="pt-3 border-t border-[#2D2542]/10 dark:border-white/12 flex items-center justify-between text-xs font-semibold text-[#5A4B7C] dark:text-[#4EE2D8]">
                <Link href="/living-word" className="hover:underline flex items-center gap-1">
                  <span>{isFr ? "Ouvrir le catalogue" : "Browse Expositions"}</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <span>3.4 hrs</span>
              </div>
            </div>

            {/* Metric Card 3: Grace Points */}
            <div className="animate-stagger-card-3 rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/10 dark:border-white/12 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl">
                  ✦
                </span>
                <span className="text-xs font-mono font-bold text-amber-800 dark:text-[#FFD770]">
                  {isFr ? "Niveau 3 · Abiding" : "Level 3 · Abiding"}
                </span>
              </div>
              <div className="my-4">
                <span className="text-4xl font-serif font-bold text-[#1E1931] dark:text-white tabular-nums">{gracePoints}</span>
                <span className="text-sm font-serif text-[#5A4B7C] dark:text-[#C8C2D6] ml-2">
                  {isFr ? "Points de Grâce" : "Grace Points"}
                </span>
                <p className="mt-1 text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                  {isFr
                    ? "+50 points débloqués avec le repos du sabbat."
                    : "Earned by quiet reflection and honoring rest."}
                </p>
              </div>
              <div className="pt-3 border-t border-[#2D2542]/10 dark:border-white/12 flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-[#FFD770]">
                <span>{isFr ? "Trophée Prochain" : "Next Milestone Seal"}</span>
                <span>{isFr ? "Flamme Sacrée" : "Sacred Flame"}</span>
              </div>
            </div>
          </div>
        )}


        {/* VIEW 2: DEDICATED JOURNAL TAB (Soul Journal with Search & Scripture/Date Filter) */}
        {activeTab === "journal" && (
          <div className="space-y-6 animate-stagger-card-1">
            {/* Journal Header & Search/Filter Bar */}
            <div className="bg-white dark:bg-[#1B1630] rounded-3xl border border-[#2D2542]/10 dark:border-white/12 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#2D2542]/10 dark:border-white/12">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#5A4B7C] dark:text-[#4EE2D8] font-semibold">
                    {isFr ? "JOURNAL INTIME DU PÈLERIN" : "PILGRIM'S SOUL JOURNAL"}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#1E1931] dark:text-white mt-0.5">
                    {isFr ? "Cahier de Méditations & Prières" : "Reflections & Scripture Notes"}
                  </h2>
                  <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] mt-1">
                    {isFr
                      ? "Filtrez vos réflexions intimes par passage biblique, date ou mot-clé."
                      : "Search and filter private journal entries by Scripture reference, date, or tags."}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono">
                  <span className="font-bold text-[#1E1931] dark:text-white">
                    {filteredJournalEntries.length} {isFr ? "entrées" : "entries"}
                  </span>
                  <span className="text-[#5A506B] dark:text-[#C8C2D6]">·</span>
                  <span className="text-[#0E726D] dark:text-[#4EE2D8] font-bold flex items-center gap-1">
                    <span>🔒</span>
                    <span>{isFr ? "Chiffrement Local" : "Client-Side Only"}</span>
                  </span>
                </div>
              </div>

              {/* Dribbble-Styled Filter Control Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Search Bar for Scripture or Content */}
                <div className="sm:col-span-7 lg:col-span-8 relative">
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm text-[#8D82A0]" aria-hidden="true">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={journalSearch}
                      onChange={(e) => setJournalSearch(e.target.value)}
                      placeholder={
                        isFr
                          ? "Rechercher par référence biblique (ex: Psaume 23), mot-clé, #tag..."
                          : "Search by Scripture ref (e.g. Psalm 23, Romans 8), keyword, #tag..."
                      }
                      className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#FAF8F5] hover:bg-[#F5F1E9] focus:bg-white rounded-2xl border border-[#2D2542]/15 focus:border-[#EA4C89] outline-none transition-all placeholder:text-[#8D82A0] text-[#1E1931]"
                    />
                    {journalSearch && (
                      <button
                        type="button"
                        onClick={() => setJournalSearch("")}
                        className="absolute right-3 text-xs text-[#8D82A0] hover:text-[#1E1931] cursor-pointer"
                        title={isFr ? "Effacer" : "Clear"}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Filter Input */}
                <div className="sm:col-span-5 lg:col-span-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={journalDateFilter}
                      onChange={(e) => setJournalDateFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] hover:bg-[#F5F1E9] focus:bg-white rounded-2xl border border-[#2D2542]/15 focus:border-[#EA4C89] outline-none transition-all text-[#1E1931] cursor-pointer font-mono"
                      title={isFr ? "Filtrer par date" : "Filter by calendar date"}
                    />
                  </div>

                  {(journalDateFilter || journalSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setJournalSearch("");
                        setJournalDateFilter("");
                      }}
                      className="px-3 py-2.5 rounded-2xl bg-[#F2ECE1] hover:bg-[#EAE4D7] text-[#1E1931] text-xs font-bold shrink-0 transition-colors cursor-pointer"
                      title={isFr ? "Réinitialiser les filtres" : "Reset filters"}
                    >
                      {isFr ? "Effacer" : "Reset"}
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Scripture Reference Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[11px] font-semibold text-[#8D82A0] shrink-0">
                  {isFr ? "Passages rapides :" : "Quick Scriptures:"}
                </span>
                {["Psalm 23", "Psalm 46", "Romans 8", "Proverbs 3", "John 15", "Genesis 2"].map((refChip) => {
                  const isSelected = journalSearch.toLowerCase() === refChip.toLowerCase();
                  return (
                    <button
                      key={refChip}
                      type="button"
                      onClick={() => setJournalSearch(isSelected ? "" : refChip)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#1E1931] text-white shadow-xs"
                          : "bg-[#F2ECE1] text-[#554A6B] hover:bg-[#E8E1D3]"
                      }`}
                    >
                      {refChip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtered Journal Entries List */}
            {filteredJournalEntries.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#2D2542]/10 p-12 text-center max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#2D2542]/10 text-2xl flex items-center justify-center mx-auto">
                  📖
                </div>
                <h3 className="text-base font-serif font-bold text-[#1E1931]">
                  {isFr ? "Aucune entrée correspondante" : "No Matching Journal Entries"}
                </h3>
                <p className="text-xs text-[#766B8A] leading-relaxed">
                  {isFr
                    ? "Aucune réflexion ne correspond à vos critères de recherche ou de date. Essayez un autre passage biblique ou réinitialisez les filtres."
                    : "No reflection notes match the selected Scripture reference or date. Try clearing your query to see all notes."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setJournalSearch("");
                    setJournalDateFilter("");
                  }}
                  className="px-4 py-2 rounded-full bg-[#1E1931] text-white text-xs font-bold hover:bg-[#342952] transition-colors cursor-pointer"
                >
                  {isFr ? "Réinitialiser la recherche" : "Clear All Filters"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJournalEntries.map((entry, idx) => (
                  <article
                    key={entry.id}
                    className="rounded-3xl bg-white border border-[#2D2542]/10 p-6 shadow-sm hover:border-[#EA4C89]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                    style={{
                      animation: `dribbble-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s forwards`,
                    }}
                  >
                    <div className="space-y-3">
                      {/* Top Meta Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-xs"
                            style={{ backgroundColor: `${entry.moodColor}20` }}
                          >
                            {entry.moodEmoji}
                          </span>
                          <div>
                            <span className="text-[11px] font-bold text-[#1E1931] block leading-none">
                              {entry.moodLabel}
                            </span>
                            <span className="text-[10px] font-mono text-[#8D82A0]">
                              {entry.date}
                            </span>
                          </div>
                        </div>

                        {/* Scripture Reference Badge */}
                        <button
                          type="button"
                          onClick={() => setJournalSearch(entry.scriptureRef)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F4EFE6] text-[#705E8C] hover:bg-[#EA4C89] hover:text-white transition-colors cursor-pointer"
                          title={isFr ? "Filtrer par ce passage" : "Filter by this passage"}
                        >
                          {entry.scriptureRef}
                        </button>
                      </div>

                      {/* Entry Body Text */}
                      <p className="text-xs sm:text-sm text-[#2D2542] leading-relaxed font-serif">
                        {entry.text}
                      </p>

                      {/* Scripture Snippet Quotation */}
                      {entry.scriptureSnippet && (
                        <div className="p-3 rounded-2xl bg-[#FAF8F5] border-l-2 border-[#EA4C89] text-xs text-[#554A6B] italic font-serif">
                          « {entry.scriptureSnippet} »
                        </div>
                      )}
                    </div>

                    {/* Footer Tags & Actions */}
                    <div className="pt-3 border-t border-[#2D2542]/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.tags?.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setJournalSearch(tag)}
                            className="text-[10px] font-mono text-[#705E8C] hover:text-[#EA4C89] hover:underline cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#8D82A0]">
                        {entry.isFavorite && <span title="Favorite">❤️</span>}
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          ✓ Saved
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}


        {/* INTERACTIVE COMPONENT: SCRIPTURE PASSAGE DRAWER WITH 3-STEP CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Scripture Reader (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1B1630] rounded-3xl border border-[#2D2542]/10 dark:border-white/12 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#2D2542]/10 dark:border-white/12">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5A4B7C] dark:text-[#4EE2D8]">
                  {isFr ? "ÉTAPE 01 · LECTURE EXPOSITIVE" : "STEP 01 · EXPOSITORY READING"}
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#1E1931] dark:text-white mt-0.5">
                  {scriptures[selectedScripture].ref}
                </h2>
              </div>

              {/* Version Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#F2ECE1] dark:bg-[#120E22] rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedScripture("psalm23")}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedScripture === "psalm23" ? "bg-white dark:bg-[#2D2542] text-[#1E1931] dark:text-white shadow-xs" : "text-[#5A4B7C] dark:text-[#C8C2D6]"
                  }`}
                >
                  Ps 23
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScripture("romans8")}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedScripture === "romans8" ? "bg-white dark:bg-[#2D2542] text-[#1E1931] dark:text-white shadow-xs" : "text-[#5A4B7C] dark:text-[#C8C2D6]"
                  }`}
                >
                  Rom 8
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScripture("john15")}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedScripture === "john15" ? "bg-white dark:bg-[#2D2542] text-[#1E1931] dark:text-white shadow-xs" : "text-[#5A4B7C] dark:text-[#C8C2D6]"
                  }`}
                >
                  Jn 15
                </button>
              </div>
            </div>

            {/* Scripture Quotation Canvas */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#EADBCE] dark:border-white/12 space-y-3 relative overflow-hidden">
              <span className="absolute right-4 top-2 text-6xl text-[#EADBCE] dark:text-white/10 font-serif select-none pointer-events-none">
                “
              </span>
              <p className="text-base sm:text-lg font-serif italic text-[#1E1931] dark:text-[#F4EFE6] leading-relaxed relative z-10">
                {scriptures[selectedScripture].text}
              </p>
              <div className="flex items-center justify-between text-xs text-[#5A4B7C] dark:text-[#C8C2D6] font-mono pt-2 border-t border-[#EADBCE]/50 dark:border-white/10">
                <span>{scriptures[selectedScripture].theme}</span>
                <span>{scriptures[selectedScripture].verseCount}</span>
              </div>
            </div>

            {/* Step 2 & 3 Guided Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F6F4FB] dark:bg-[#141024] border border-[#DDD3EF] dark:border-white/12 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#5A4B7C] dark:text-[#C8C2D6]">
                  <span>💡</span>
                  <span>{isFr ? "Étape 02 · Méditation" : "Step 02 · Reflection"}</span>
                </div>
                <p className="text-xs text-[#3E3356] dark:text-[#E2DCEF] leading-relaxed">
                  {isFr
                    ? "Où avez-vous besoin de déposer l'urgence et les délais professionnels aujourd'hui ?"
                    : "Where do you need to surrender hurried deadlines before checking work email today?"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F1F8F5] dark:bg-[#102222] border border-[#C5E5D8] dark:border-[#1FB6B0]/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                  <span>🙏</span>
                  <span>{isFr ? "Étape 03 · Prière Orale" : "Step 03 · Spoken Prayer"}</span>
                </div>
                <p className="text-xs text-[#1F4A3F] dark:text-[#D7F5F2] leading-relaxed">
                  {isFr
                    ? "« Seigneur, sois mon ancre dans le tumulte. Garde mes pensées dans Ta paix. »"
                    : "“Lord, be my anchor in the rush. Keep my thoughts in Your peace. Amen.”"}
                </p>
              </div>
            </div>

            {/* Quick Action Button Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleToggleSave("dev-1")}
                className={`min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  savedDevotions["dev-1"]
                    ? "bg-[#1FB6B0]/15 text-[#0E726D] dark:text-[#4EE2D8] border border-[#1FB6B0]/30"
                    : "bg-[#F2ECE1] dark:bg-[#120E22] text-[#5A506B] dark:text-[#C8C2D6] hover:bg-[#EADBCE]"
                }`}
              >
                <span>{savedDevotions["dev-1"] ? "✓ Enregistré" : "🔖 Ajouter aux Favoris"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("journal")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A4B7C] dark:text-[#4EE2D8] hover:text-[#1E1931] dark:hover:text-white transition-colors cursor-pointer"
              >
                <span>{isFr ? "Ouvrir dans le Journal Spirituel" : "Expand to Journal Notebook"}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* Right Column: Audio Equalizer & Interactive Prayer Composer (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Mini Player Widget */}
            <div className="rounded-3xl bg-[#201A38] text-white p-6 shadow-md border border-[#3A2F5E] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-[#56C2B4]">
                  EXPOSITORY AUDIO STUDIO
                </span>
                <span className="w-2 h-2 rounded-full bg-[#56C2B4]" />
              </div>

              <div>
                <h3 className="text-base font-serif font-bold text-white">
                  The Cost of Discipleship & Romans 8
                </h3>
                <p className="text-xs text-white/75">Pastor Samuel Ndlovu · Expository Series · 16:00</p>
              </div>

              {/* Dynamic Equalizer Bars */}
              <div className="flex items-center justify-between gap-1 h-8 px-2 bg-white/5 rounded-xl border border-white/10">
                {[12, 24, 18, 28, 14, 20, 32, 10, 22, 16, 30, 24, 18, 26, 14].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-[#56C2B4] transition-all"
                    style={{
                      height: isAudioPlaying ? `${Math.max(6, (h * (i % 2 === 0 ? 1.2 : 0.8))) % 30}px` : "6px",
                      opacity: isAudioPlaying ? 0.9 : 0.4,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-white/80">
                <button
                  type="button"
                  onClick={() => {
                    if (isAudioPlaying) {
                      stopHumanVoice();
                      setIsAudioPlaying(false);
                    } else {
                      setIsAudioPlaying(true);
                      speakWithHumanVoice({
                        text: `${scriptures[selectedScripture].ref}. ${scriptures[selectedScripture].text}`,
                        isFrFallback: isFr,
                        onEnd: () => setIsAudioPlaying(false),
                      });
                    }
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-full bg-[#56C2B4] text-[#120F24] font-bold text-xs hover:bg-[#68D8CA] transition-colors cursor-pointer"
                >
                  {isAudioPlaying
                    ? isFr
                      ? "⏸ Arrêter la Voix"
                      : "⏸ Stop Human Voice"
                    : isFr
                    ? "▶ Écouter la Parole (Voix Humaine)"
                    : "▶ Listen with Human Voice"}
                </button>
                <div className="flex items-center gap-3">
                  <Link href="/teachers" className="hover:text-white transition-colors underline">
                    {isFr ? "Portail des Pasteurs" : "Teachers Portal"}
                  </Link>
                  <Link href="/living-word" className="hover:text-white transition-colors underline">
                    {isFr ? "Mode Plein Écran" : "Dedicated Studio"}
                  </Link>
                </div>
              </div>

              {/* Quick Selector for Nigerian EN, Côte d'Ivoire FR, and American EN Voices */}
              <HumanVoiceSelector compact darkSurface />
            </div>

            {/* Quick Prayer Notepad Widget */}
            <div className="rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/10 dark:border-white/12 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-[#5A4B7C] dark:text-[#4EE2D8] font-semibold">
                  {isFr ? "PRIÈRE DU MATIN DIRECTE" : "INSTANT PRIVATE PRAYER"}
                </span>
                <span className="text-xs text-[#0E726D] dark:text-[#4EE2D8] font-bold">🔒 Chiffré Localement</span>
              </div>

              <form onSubmit={handlePostPrayer} className="space-y-3">
                <textarea
                  value={quickPrayerText}
                  onChange={(e) => setQuickPrayerText(e.target.value)}
                  placeholder={
                    isFr
                      ? "Écrivez ou dictez votre prière sincère du matin..."
                      : "Type your honest morning prayer or burden to God..."
                  }
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#120E22] text-[#1E1931] dark:text-white border border-[#2D2542]/15 dark:border-white/15 focus:border-[#705EAA] focus:bg-white dark:focus:bg-[#161129] outline-none resize-none transition-all placeholder:text-[#6E6285] dark:placeholder:text-[#A9A0BC]"
                />

                {prayerSubmitted && (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>{isFr ? "Prière ancrée dans votre journal privé." : "Prayer recorded in your private journal."}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                    {quickPrayerText.length} {isFr ? "caractères" : "characters"}
                  </span>
                  <button
                    type="submit"
                    disabled={!quickPrayerText.trim()}
                    className="min-h-[40px] px-4 py-2 rounded-full bg-[#2D2542] dark:bg-[#4EE2D8] hover:bg-[#3D315B] disabled:opacity-40 text-white dark:text-[#0E0C18] text-xs font-bold transition-all cursor-pointer"
                  >
                    {isFr ? "Conserver la Prière" : "Save to Journal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* INTEGRATED PROGRESS & SPIRITUAL RHYTHM ANALYTICS (Recharts, Sabbath Shield, Full 30-Day Matrix) */}
        {activeTab === "heatmap" ? (
          <div className="pt-2">
            <ProgressScreen />
          </div>
        ) : (
          /* 30-Day Heatmap Preview */
          <div className="rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/10 dark:border-white/12 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D2542]/10 dark:border-white/12">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#5A4B7C] dark:text-[#4EE2D8] font-semibold">
                  DWELL-TIME & CONSISTENCY MATRIX
                </span>
                <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white">
                  {isFr ? "Régularité Spirituelle sur 30 Jours" : "30-Day Spiritual Rhythm Heatmap"}
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#BCEBE7]" />
                  <span className="text-[#5A506B] dark:text-[#C8C2D6]">Light</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#1FB6B0]" />
                  <span className="text-[#5A506B] dark:text-[#C8C2D6]">Deep</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#F28C38]" />
                  <span className="text-[#5A506B] dark:text-[#C8C2D6]">Peak Rhythm 🔥</span>
                </span>
              </div>
            </div>

            {/* 30-Cell Interactive Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-15 gap-2 sm:gap-2.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const isPeak = day % 7 === 0 || day === 14;
                const isDeep = day % 3 === 0 && !isPeak;
                const isLight = day % 2 === 0 && !isDeep && !isPeak;
                const isRest = day % 5 === 0 && !isPeak && !isDeep;

                const bgClass = isPeak
                  ? "bg-gradient-to-br from-[#E3B15E] to-[#F28C38] text-white shadow-xs"
                  : isDeep
                  ? "bg-[#1FB6B0] text-white"
                  : isLight
                  ? "bg-[#BCEBE7] text-[#0E6C68]"
                  : isRest
                  ? "bg-[#EFE8F7] dark:bg-[#2A2145] text-[#5A4B7C] dark:text-[#D5CEE6] border border-[#DDD3EF] dark:border-white/15"
                  : "bg-[#F3EFE8] dark:bg-[#141024] text-[#5A506B] dark:text-[#A9A0BC]";

                return (
                  <div
                    key={i}
                    onClick={() => setActiveTab("heatmap")}
                    className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-105 ${bgClass}`}
                    title={`Day ${day}: ${isPeak ? "Peak devotion & prayer" : isDeep ? "Scripture & Stillness" : "Daily check-in"}`}
                  >
                    <span className="text-xs font-bold font-mono leading-none">{day}</span>
                    <span className="text-xs uppercase tracking-tighter opacity-90 mt-0.5 leading-none">
                      {isPeak ? "🔥" : isRest ? "🌿" : isDeep ? "✓" : "·"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2D2542]/10 dark:border-white/12 text-xs text-[#5A4B7C] dark:text-[#C8C2D6]">
              <p>
                {isFr
                  ? "Le repos du sabbat (🌿) préserve votre élan spirituel sans jamais remettre votre série à zéro."
                  : "Intentional Sabbath rest (🌿) protects your momentum without guilt resets."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("heatmap")}
                className="inline-flex items-center gap-1 font-bold text-[#1E1931] dark:text-[#4EE2D8] hover:text-[#705EAA] transition-colors cursor-pointer"
              >
                <span>{isFr ? "Ouvrir Progrès, Graphiques & Heatmap complète" : "Open Full Progress, Charts & Interactive Matrix"}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sanctuary Footer */}
      <footer className="mt-auto border-t border-[#2D2542]/10 dark:border-white/12 bg-white dark:bg-[#171326] py-6 px-4 sm:px-8 text-xs text-[#5A506B] dark:text-[#C8C2D6]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#1E1931] dark:text-white">LifeBook</span>
            <span>·</span>
            <span>{isFr ? "Sanctuaire quotidien de méditation et de prière" : "Daily Scripture, Stillness & Prayer Sanctuary"}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-[#1E1931] dark:hover:text-white transition-colors">{isFr ? "Tableau de Bord" : "Dashboard"}</Link>
            <Link href="/living-word" className="hover:text-[#1E1931] dark:hover:text-white transition-colors">{isFr ? "Enseignements" : "Teachings"}</Link>
            <Link href="/teachers" className="hover:text-[#1E1931] dark:hover:text-white transition-colors">{isFr ? "Portail des Pasteurs" : "Teachers Portal"}</Link>
            <Link href="/privacy" className="hover:text-[#1E1931] dark:hover:text-white transition-colors">{isFr ? "Confidentialité" : "Privacy"}</Link>
          </div>
        </div>
      </footer>

      <DailyRitualModal
        isOpen={isRitualModalOpen}
        onClose={() => setIsRitualModalOpen(false)}
      />

      <SanctuaryWalkthroughModal
        onSelectDashboardTab={(tab) => setActiveTab(tab)}
        onOpenDailyRitual={() => setIsRitualModalOpen(true)}
        onFocusLiveCall={() => {
          const el = document.getElementById("dashboard-live-call-section");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />
    </div>
  );
}
