"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useChristianAuth } from "@/lib/christian-auth";
import { BIBLE_CANON, getDailyMeditation, BibleBook } from "@/lib/bible-canon";
import {
  SanctuaryCloudState,
  ReflectionEntry,
  DailyRitualState,
  fetchCloudState,
  saveCloudState,
  loadLocalState,
  saveLocalState,
  mergeSanctuaryStates,
  computeNextStreak,
} from "@/lib/cloud-sync";
import LivingWord from "../LivingWord";
import VoicePractice from "../VoicePractice";
import ProgressScreen from "@/components/ProgressScreen";
import DailyRitualModal from "@/components/DailyRitualModal";
import CloudSyncBadge, { SyncStatus } from "@/components/CloudSyncBadge";
import ChristianTeachingsSection from "@/components/ChristianTeachingsSection";
import HumanVoiceSelector from "@/components/HumanVoiceSelector";
import ChristianMelodySelector from "@/components/ChristianMelodySelector";
import TeacherLiveCallModal from "@/components/TeacherLiveCallModal";
import SanctuaryWalkthroughModal from "@/components/SanctuaryWalkthroughModal";
import {
  fetchActiveLiveCall,
  ActiveTeacherLiveCall,
  OneOnOneWebRTCSession,
  shouldTriggerFirstLoginWalkthrough,
  hasCompletedWalkthrough,
} from "@/lib/live-call";
import {
  VoiceProfile,
  getPreferredVoiceProfile,
  speakWithHumanVoice,
} from "@/lib/human-voices";

type ActiveTab = "overview" | "bible" | "voice" | "journal" | "teachers";
type MoodKey = "peaceful" | "grateful" | "hopeful" | "seeking" | "rejoicing";

const TODAY_KEY = new Date().toISOString().split("T")[0];

export default function DashboardPage() {
  const { language, setLanguage, t } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { isLoaded, isSignedIn, user, signOut } = useChristianAuth();
  const isFr = language === "fr";

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [selectedBookId, setSelectedBookId] = useState<string>("psalms");
  const [selectedChapter, setSelectedChapter] = useState<number>(23);

  // Cloud & Local Persisted State
  const [sanctuaryState, setSanctuaryState] = useState<SanctuaryCloudState>(() =>
    loadLocalState()
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [isInitialCloudLoaded, setIsInitialCloudLoaded] = useState(false);

  // Modals
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [isLiveCallModalOpen, setIsLiveCallModalOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [activeLiveCall, setActiveLiveCall] =
    useState<ActiveTeacherLiveCall | null>(null);
  const [activeOneOnOneCall, setActiveOneOnOneCall] =
    useState<OneOnOneWebRTCSession | null>(null);

  // Daily Meditation
  const [dailyMeditation, setDailyMeditation] = useState(() =>
    getDailyMeditation(0)
  );
  const [isSpeakingDaily, setIsSpeakingDaily] = useState(false);
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<VoiceProfile>(
    () => getPreferredVoiceProfile(language)
  );

  // Journal Form State
  const [reflectionTitle, setReflectionTitle] = useState("");
  const [reflectionContent, setReflectionContent] = useState("");
  const [reflectionReference, setReflectionReference] = useState("");
  const [reflectionMood, setReflectionMood] = useState<MoodKey>("peaceful");
  const [journalSearch, setJournalSearch] = useState("");
  const [journalMoodFilter, setJournalMoodFilter] = useState<MoodKey | "all">(
    "all"
  );
  const [savedToast, setSavedToast] = useState(false);

  // Voice Note Recording inside Journal
  const [isRecordingPrayer, setIsRecordingPrayer] = useState(false);
  const [recordedVoiceTranscript, setRecordedVoiceTranscript] = useState("");
  const [recordingDurationSec, setRecordingDurationSec] = useState(0);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const med = getDailyMeditation(dayOfYear);
    setDailyMeditation(med);
    setReflectionReference(
      isFr
        ? `${med.book.name.fr} ${med.chapter.chapter}:${med.verse.verse}`
        : `${med.book.name.en} ${med.chapter.chapter}:${med.verse.verse}`
    );
  }, [isFr]);

  // Keep voice profile synced when language changes
  useEffect(() => {
    setSelectedVoiceProfile(getPreferredVoiceProfile(language));
  }, [language]);

  // Poll for active teacher live call & 1-on-1 WebRTC session
  useEffect(() => {
    let mounted = true;
    const checkCalls = async () => {
      const state = await fetchActiveLiveCall();
      if (mounted) {
        setActiveLiveCall(state.activeCall);
        setActiveOneOnOneCall(state.oneOnOneSession);
      }
    };
    checkCalls();
    const interval = setInterval(checkCalls, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Trigger interactive step-by-step walkthrough automatically on first login
  useEffect(() => {
    if (!isLoaded) return;
    const email = user?.email;
    if (
      shouldTriggerFirstLoginWalkthrough(email) ||
      !hasCompletedWalkthrough(email)
    ) {
      setIsWalkthroughOpen(true);
    }
  }, [isLoaded, user?.email]);

  // Initial Load & Merge from Cloud if signed in
  useEffect(() => {
    if (!isLoaded) return;

    const local = loadLocalState();
    setSanctuaryState(local);

    if (isSignedIn) {
      setSyncStatus("syncing");
      fetchCloudState()
        .then((res) => {
          if (res.authenticated && res.state) {
            const merged = mergeSanctuaryStates(local, res.state);
            setSanctuaryState(merged);
            saveLocalState(merged);
            setSyncStatus("synced");
          } else {
            setSyncStatus("local");
          }
          setIsInitialCloudLoaded(true);
        })
        .catch(() => {
          setSyncStatus("local");
          setIsInitialCloudLoaded(true);
        });
    } else {
      setSyncStatus("local");
      setIsInitialCloudLoaded(true);
    }
  }, [isLoaded, isSignedIn]);

  // Helper to update state & persist to Local + Cloud
  const updateSanctuaryState = useCallback(
    (updater: (prev: SanctuaryCloudState) => SanctuaryCloudState) => {
      setSanctuaryState((prev) => {
        const next = updater(prev);
        const stamped: SanctuaryCloudState = {
          ...next,
          updatedAt: new Date().toISOString(),
        };
        saveLocalState(stamped);

        if (isSignedIn) {
          setSyncStatus("syncing");
          saveCloudState(stamped)
            .then((ok) => {
              setSyncStatus(ok ? "synced" : "local");
            })
            .catch(() => {
              setSyncStatus("local");
            });
        }
        return stamped;
      });
    },
    [isSignedIn]
  );

  const handleManualSync = async () => {
    if (!isSignedIn) return;
    setSyncStatus("syncing");
    const ok = await saveCloudState(sanctuaryState);
    setSyncStatus(ok ? "synced" : "local");
  };

  // Speak daily verse with authentic regional voice
  const toggleSpeakDailyVerse = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeakingDaily) {
      window.speechSynthesis.cancel();
      setIsSpeakingDaily(false);
      return;
    }

    const text = isFr ? dailyMeditation.verse.fr : dailyMeditation.verse.en;
    speakWithHumanVoice({
      text,
      profile: selectedVoiceProfile,
      onStart: () => setIsSpeakingDaily(true),
      onEnd: () => setIsSpeakingDaily(false),
      onError: () => setIsSpeakingDaily(false),
    });
  };

  // Mark chapter completed
  const handleMarkChapterRead = (bookId: string, chapter: number) => {
    const chapterKey = `${bookId}-${chapter}`;
    updateSanctuaryState((prev) => {
      const alreadyCompleted = prev.completedChapters.includes(chapterKey);
      const nextCompleted = alreadyCompleted
        ? prev.completedChapters
        : [...prev.completedChapters, chapterKey];
      const streakUpdate = computeNextStreak(prev.streak, prev.lastActiveDate);

      return {
        ...prev,
        completedChapters: nextCompleted,
        streak: streakUpdate.streak,
        lastActiveDate: streakUpdate.lastActiveDate,
      };
    });
  };

  // Record spoken verse from VoicePractice
  const handleVerseSpoken = () => {
    updateSanctuaryState((prev) => {
      const streakUpdate = computeNextStreak(prev.streak, prev.lastActiveDate);
      const isTodayRitual = prev.dailyRitual?.date === TODAY_KEY;
      const updatedRitual: DailyRitualState = isTodayRitual
        ? { ...prev.dailyRitual, stepSpeakDone: true }
        : {
            date: TODAY_KEY,
            stepReadDone: false,
            stepSpeakDone: true,
            stepReflectDone: false,
            completedAt: null,
          };

      return {
        ...prev,
        versesSpoken: prev.versesSpoken + 1,
        streak: streakUpdate.streak,
        lastActiveDate: streakUpdate.lastActiveDate,
        dailyRitual: updatedRitual,
      };
    });
  };

  // Update Daily Ritual state
  const handleUpdateRitual = (nextRitual: DailyRitualState) => {
    updateSanctuaryState((prev) => {
      const streakUpdate = computeNextStreak(prev.streak, prev.lastActiveDate);
      return {
        ...prev,
        dailyRitual: nextRitual,
        streak: streakUpdate.streak,
        lastActiveDate: streakUpdate.lastActiveDate,
      };
    });
  };

  // Complete Daily Ritual & save reflection
  const handleCompleteRitualWithReflection = (
    reflectionText: string,
    reference: string
  ) => {
    const newEntry: ReflectionEntry = {
      id: `ritual-${Date.now()}`,
      title: isFr
        ? `Méditation du Rituel Quotidien (${reference})`
        : `Daily Ritual Meditation (${reference})`,
      content: reflectionText,
      scriptureReference: reference,
      mood: "peaceful",
      createdAt: new Date().toISOString().split("T")[0],
    };

    updateSanctuaryState((prev) => {
      const streakUpdate = computeNextStreak(prev.streak, prev.lastActiveDate);
      return {
        ...prev,
        reflections: [newEntry, ...prev.reflections],
        versesSpoken: prev.versesSpoken + 1,
        streak: streakUpdate.streak,
        lastActiveDate: streakUpdate.lastActiveDate,
        dailyRitual: {
          date: TODAY_KEY,
          stepReadDone: true,
          stepSpeakDone: true,
          stepReflectDone: true,
          completedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Voice Note Prayer Recording in Journal
  const toggleRecordPrayerVoiceNote = () => {
    if (isRecordingPrayer) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setIsRecordingPrayer(false);
      return;
    }

    setRecordedVoiceTranscript("");
    setRecordingDurationSec(0);
    setIsRecordingPrayer(true);

    recordingTimerRef.current = setInterval(() => {
      setRecordingDurationSec((prev) => prev + 1);
    }, 1000);

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = isFr ? "fr-FR" : "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + " ";
          }
          setRecordedVoiceTranscript(transcript.trim());
          setReflectionContent((prev) => {
            if (!prev.trim()) return transcript.trim();
            return prev;
          });
        };

        recognition.onerror = () => {
          setIsRecordingPrayer(false);
          if (recordingTimerRef.current)
            clearInterval(recordingTimerRef.current);
        };

        recognition.onend = () => {
          setIsRecordingPrayer(false);
          if (recordingTimerRef.current)
            clearInterval(recordingTimerRef.current);
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {}
      }
    }
  };

  // Save Journal Reflection
  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionTitle.trim() && !reflectionContent.trim()) return;

    const newEntry: ReflectionEntry = {
      id: `ref-${Date.now()}`,
      title:
        reflectionTitle.trim() ||
        (isFr ? "Prière du Sanctuaire" : "Sanctuary Prayer"),
      content: reflectionContent.trim(),
      scriptureReference:
        reflectionReference.trim() || (isFr ? "Psaumes 23:1" : "Psalms 23:1"),
      mood: reflectionMood,
      createdAt: new Date().toISOString().split("T")[0],
      voiceNoteTranscript: recordedVoiceTranscript || undefined,
      voiceNoteDurationSec:
        recordingDurationSec > 0 ? recordingDurationSec : undefined,
    };

    updateSanctuaryState((prev) => {
      const streakUpdate = computeNextStreak(prev.streak, prev.lastActiveDate);
      return {
        ...prev,
        reflections: [newEntry, ...prev.reflections],
        streak: streakUpdate.streak,
        lastActiveDate: streakUpdate.lastActiveDate,
      };
    });

    setReflectionTitle("");
    setReflectionContent("");
    setRecordedVoiceTranscript("");
    setRecordingDurationSec(0);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleDeleteReflection = (id: string) => {
    updateSanctuaryState((prev) => ({
      ...prev,
      reflections: prev.reflections.filter((r) => r.id !== id),
    }));
  };

  const openBookInBible = (book: BibleBook, chapter = 1) => {
    setSelectedBookId(book.id);
    setSelectedChapter(chapter);
    setActiveTab("bible");
  };

  // Interactive Walkthrough Feature Action Handler
  const handleWalkthroughFeatureAction = (actionId: string) => {
    if (actionId === "open-daily-ritual") {
      setIsRitualModalOpen(true);
    } else if (actionId === "open-voice-tab") {
      setActiveTab("voice");
    } else if (actionId === "open-live-call") {
      setIsLiveCallModalOpen(true);
    } else if (actionId === "focus-melodies") {
      setActiveTab("overview");
      const el = document.getElementById("christian-melodies-panel");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const verseReference = isFr
    ? `${dailyMeditation.book.name.fr} ${dailyMeditation.chapter.chapter}:${dailyMeditation.verse.verse}`
    : `${dailyMeditation.book.name.en} ${dailyMeditation.chapter.chapter}:${dailyMeditation.verse.verse}`;

  const verseText = isFr ? dailyMeditation.verse.fr : dailyMeditation.verse.en;
  const meditationNote = isFr
    ? dailyMeditation.verse.meditation.fr
    : dailyMeditation.verse.meditation.en;

  const isTodayRitualComplete =
    sanctuaryState.dailyRitual?.date === TODAY_KEY &&
    Boolean(sanctuaryState.dailyRitual?.completedAt);

  const moodLabels: Record<MoodKey, string> = {
    peaceful: t("journal.moods.peaceful"),
    grateful: t("journal.moods.grateful"),
    hopeful: t("journal.moods.hopeful"),
    seeking: t("journal.moods.seeking"),
    rejoicing: t("journal.moods.rejoicing"),
  };

  const filteredReflections = sanctuaryState.reflections.filter((entry) => {
    const matchesMood =
      journalMoodFilter === "all" || entry.mood === journalMoodFilter;
    const q = journalSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      entry.title.toLowerCase().includes(q) ||
      entry.content.toLowerCase().includes(q) ||
      entry.scriptureReference.toLowerCase().includes(q);
    return matchesMood && matchesSearch;
  });

  const displayName =
    user?.firstName ||
    user?.fullName ||
    (isFr ? "Pèlerin Bien-Aimé" : "Beloved Pilgrim");

  const hasAnyLiveSession = Boolean(activeLiveCall || activeOneOnOneCall);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#12100E] text-stone-900 dark:text-stone-100">
      {/* Disciplined 3-Zone Sanctuary Header */}
      <header className="sticky top-0 z-30 border-b border-stone-300/80 dark:border-stone-800 bg-[#FAF8F5]/95 dark:bg-[#12100E]/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand & Cloud Ledger Status */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-stone-50 dark:text-stone-900 font-serif font-bold text-sm tracking-wider">
                LB
              </div>
              <span className="text-base sm:text-lg font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                LifeBook
              </span>
            </Link>

            {isInitialCloudLoaded && (
              <div className="hidden lg:block">
                <CloudSyncBadge
                  status={syncStatus}
                  lastSyncedAt={sanctuaryState.updatedAt}
                  onManualSync={handleManualSync}
                />
              </div>
            )}
          </div>

          {/* Zone 2: Primary Sanctuary Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {(
              [
                { id: "overview", label: t("dashboard.tabs.overview") },
                { id: "bible", label: t("dashboard.tabs.bible") },
                { id: "voice", label: t("dashboard.tabs.voice") },
                { id: "journal", label: t("dashboard.tabs.journal") },
                { id: "teachers", label: t("dashboard.tabs.teachers") },
              ] as { id: ActiveTab; label: string }[]
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                    active
                      ? "border-amber-800 dark:border-amber-400 text-stone-900 dark:text-stone-100 font-semibold"
                      : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Consolidated Utility & Live WebRTC Controls */}
          <div className="flex items-center gap-2">
            {/* WebRTC Live Call Button (1-on-1 & 40-Seat) */}
            <button
              type="button"
              onClick={() => setIsLiveCallModalOpen(true)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 cursor-pointer border ${
                hasAnyLiveSession
                  ? "bg-emerald-800 text-white border-emerald-900"
                  : "border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hasAnyLiveSession
                    ? "bg-emerald-300 animate-pulse"
                    : "bg-amber-700 dark:bg-amber-400"
                }`}
              />
              <span>
                {activeOneOnOneCall
                  ? isFr
                    ? "Appel 1-à-1"
                    : "1-on-1 Live"
                  : activeLiveCall
                  ? `${isFr ? "Direct" : "Live"} (${activeLiveCall.participants.length}/40)`
                  : isFr
                  ? "Appel WebRTC"
                  : "WebRTC Call"}
              </span>
            </button>

            {/* Walkthrough Orientation Trigger */}
            <button
              type="button"
              onClick={() => setIsWalkthroughOpen(true)}
              title={
                isFr
                  ? "Ouvrir le guide d'orientation étape par étape"
                  : "Open interactive step-by-step orientation"
              }
              className="px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isFr ? "Guide" : "Guide"}
            </button>

            {/* Language Switcher */}
            <div className="hidden sm:inline-flex items-center border border-stone-300 dark:border-stone-800 rounded p-0.5 bg-[#F3EFE6] dark:bg-[#1C1917]">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 text-[11px] font-mono uppercase transition-colors cursor-pointer rounded-xs ${
                  language === "en"
                    ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold"
                    : "text-stone-500"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`px-2 py-0.5 text-[11px] font-mono uppercase transition-colors cursor-pointer rounded-xs ${
                  language === "fr"
                    ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold"
                    : "text-stone-500"
                }`}
              >
                FR
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t("theme.toggle")}
              className="p-1.5 rounded border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {resolvedTheme === "dark" ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* User Profile / Sign Out */}
            {isSignedIn ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-300 dark:border-stone-800">
                <div
                  title={user?.email || displayName}
                  className="w-7 h-7 rounded bg-amber-900/15 dark:bg-amber-500/20 border border-amber-800/30 text-amber-900 dark:text-amber-300 flex items-center justify-center font-serif font-bold text-xs"
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                >
                  {t("nav.signOut")}
                </button>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="px-3 py-1.5 rounded bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-mono uppercase tracking-wider font-semibold"
              >
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Tab Strip */}
        <div className="md:hidden flex items-center overflow-x-auto border-t border-stone-200 dark:border-stone-800 px-4 bg-[#FAF8F5] dark:bg-[#12100E]">
          {(
            [
              { id: "overview", label: t("dashboard.tabs.overview") },
              { id: "bible", label: t("dashboard.tabs.bible") },
              { id: "voice", label: t("dashboard.tabs.voice") },
              { id: "journal", label: t("dashboard.tabs.journal") },
              { id: "teachers", label: t("dashboard.tabs.teachers") },
            ] as { id: ActiveTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap border-b-2 ${
                  active
                    ? "border-amber-800 dark:border-amber-400 text-stone-900 dark:text-stone-100 font-semibold"
                    : "border-transparent text-stone-500 dark:text-stone-400"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Active 1-on-1 WebRTC or Group Call Banner */}
      {(activeOneOnOneCall || activeLiveCall) && (
        <div className="bg-emerald-950 text-emerald-50 border-b border-emerald-800 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono uppercase tracking-wider text-emerald-300 font-semibold">
                {activeOneOnOneCall
                  ? isFr
                    ? "SESSION AUDIO WEBRTC 1-À-1 EN COURS"
                    : "ACTIVE 1-ON-1 WEBRTC AUDIO SESSION"
                  : isFr
                  ? "SALLE PASTORALE EN DIRECT (40 PLACES)"
                  : "ACTIVE 40-SEAT PASTORAL ROOM"}
              </span>
              <span className="text-emerald-200 font-serif italic">
                {activeOneOnOneCall
                  ? `${activeOneOnOneCall.teacherName} ↔ ${activeOneOnOneCall.targetUserName} (${activeOneOnOneCall.topic})`
                  : `${activeLiveCall?.teacherName} — ${activeLiveCall?.topic}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLiveCallModalOpen(true)}
              className="px-3 py-1 rounded bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              {isFr ? "Rejoindre / Ouvrir Console →" : "Join / Open Console →"}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Editorial Welcome & Daily Sacred Ritual Banner */}
            <div className="p-6 sm:p-8 rounded-lg bg-[#F3EFE6] dark:bg-[#1C1917] border border-stone-300 dark:border-stone-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.16em] text-amber-900 dark:text-amber-400">
                    <span>
                      {t("dashboard.welcome")}, {displayName}
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">|</span>
                    <span className="text-stone-600 dark:text-stone-400">
                      {isTodayRitualComplete
                        ? isFr
                          ? "Rituel Quotidien Accompli"
                          : "Daily Ritual Completed"
                        : isFr
                        ? "Rituel Quotidien en 3 Étapes"
                        : "3-Step Daily Sacred Ritual"}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
                    {t("dashboard.subtitle")}
                  </h1>

                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {isFr
                      ? "Commencez par le Rituel Sacré Quotidien, écoutez la Parole avec des voix régionales authentiques ou initiez un appel pastoral WebRTC 1-à-1."
                      : "Begin with your 3-Step Daily Sacred Ritual, listen to Scripture in authentic regional voices, or enter a 1-on-1 WebRTC pastoral audio session."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRitualModalOpen(true)}
                    className={`px-5 py-3 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                      isTodayRitualComplete
                        ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                        : "bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900"
                    }`}
                  >
                    {isTodayRitualComplete
                      ? isFr
                        ? "Revoir le Rituel du Jour"
                        : "Review Today's Ritual"
                      : isFr
                      ? "Commencer le Rituel (3 Étapes) →"
                      : "Start 3-Step Daily Ritual →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLiveCallModalOpen(true)}
                    className="px-4 py-3 rounded border border-stone-400 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-300 text-stone-800 dark:text-stone-200 text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  >
                    {isFr ? "Appel Audio 1-à-1" : "1-on-1 Audio Call"}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Metrics Ledger */}
            <ProgressScreen
              streak={sanctuaryState.streak}
              completedChaptersCount={sanctuaryState.completedChapters.length}
              versesSpoken={sanctuaryState.versesSpoken}
              reflectionsCount={sanctuaryState.reflections.length}
            />

            {/* Two-Column Core Sanctuary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left 7 Cols: Daily Scripture Meditation & Authentic Voice Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 sm:p-8 rounded-lg sanctuary-card space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-900 dark:text-amber-400 font-semibold">
                        {t("dashboard.dailyMeditation")}
                      </span>
                      <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                        {verseReference}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <HumanVoiceSelector
                        selectedProfile={selectedVoiceProfile}
                        onSelectProfile={(profile) => {
                          setSelectedVoiceProfile(profile);
                          if (
                            typeof window !== "undefined" &&
                            "speechSynthesis" in window
                          ) {
                            window.speechSynthesis.cancel();
                            setIsSpeakingDaily(false);
                          }
                        }}
                        compact
                      />

                      <button
                        type="button"
                        onClick={toggleSpeakDailyVerse}
                        className={`px-3.5 py-2 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSpeakingDaily
                            ? "bg-amber-800 text-white"
                            : "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:opacity-90"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <span>
                          {isSpeakingDaily
                            ? t("scripture.stopReading")
                            : t("scripture.listenAloud")}
                        </span>
                      </button>
                    </div>
                  </div>

                  <blockquote className="text-xl sm:text-2xl font-serif italic text-stone-900 dark:text-stone-100 leading-relaxed">
                    &ldquo;{verseText}&rdquo;
                  </blockquote>

                  <div className="p-4 rounded bg-[#F3EFE6] dark:bg-[#171412] border border-stone-300/80 dark:border-stone-800">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-900 dark:text-amber-400 font-semibold mb-1">
                      {t("scripture.meditationNote")}
                    </p>
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                      {meditationNote}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        openBookInBible(
                          dailyMeditation.book,
                          dailyMeditation.chapter.chapter
                        )
                      }
                      className="px-4 py-2.5 rounded bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                    >
                      {t("dashboard.openBible")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("voice")}
                      className="px-4 py-2.5 rounded border border-stone-300 dark:border-stone-700 hover:border-stone-800 dark:hover:border-stone-400 text-stone-800 dark:text-stone-200 text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                    >
                      {t("dashboard.practiceVoice")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("journal")}
                      className="px-4 py-2.5 rounded border border-stone-300 dark:border-stone-700 hover:border-stone-800 dark:hover:border-stone-400 text-stone-800 dark:text-stone-200 text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                    >
                      {t("dashboard.writeReflection")}
                    </button>
                  </div>
                </div>

                {/* Canonical Quick-Access Shelf */}
                <div className="p-6 rounded-lg sanctuary-card space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                    <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                      {isFr
                        ? "Accès Rapide au Canon Biblique (66 Livres)"
                        : "Canonical Scripture Shelf (66 Books)"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("bible")}
                      className="text-xs font-mono uppercase tracking-wider text-amber-900 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {isFr ? "Tout voir →" : "Full Canon →"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {BIBLE_CANON.filter((b) =>
                      [
                        "genesis",
                        "psalms",
                        "proverbs",
                        "isaiah",
                        "matthew",
                        "john",
                        "romans",
                        "revelation",
                      ].includes(b.id)
                    ).map((book) => {
                      const isDone = sanctuaryState.completedChapters.some((k) =>
                        k.startsWith(`${book.id}-`)
                      );
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => openBookInBible(book, 1)}
                          className="p-3 rounded border border-stone-200 dark:border-stone-800 hover:border-amber-800 dark:hover:border-amber-500 bg-[#FAF8F5] dark:bg-[#141210] text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500">
                            <span>{book.testament === "OT" ? "OT" : "NT"}</span>
                            {isDone && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                {isFr ? "Lu" : "Read"}
                              </span>
                            )}
                          </div>
                          <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate mt-1">
                            {isFr ? book.name.fr : book.name.en}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Christian Melodies Panel & Recent Reflections Ledger */}
              <div className="lg:col-span-5 space-y-6">
                <div
                  id="christian-melodies-panel"
                  className="p-6 rounded-lg sanctuary-card"
                >
                  <ChristianMelodySelector />
                </div>

                {/* Recent Reflections Archive */}
                <div className="p-6 rounded-lg sanctuary-card space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                    <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                      {t("dashboard.recentReflections")}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("journal")}
                      className="text-xs font-mono uppercase tracking-wider text-amber-900 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {isFr ? "Ouvrir Journal →" : "Open Journal →"}
                    </button>
                  </div>

                  <div className="divide-y divide-stone-200 dark:divide-stone-800">
                    {sanctuaryState.reflections.slice(0, 3).map((item) => (
                      <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400 mb-1">
                          <span className="text-amber-900 dark:text-amber-400 font-semibold">
                            {item.scriptureReference}
                          </span>
                          <span className="tabular-nums">{item.createdAt}</span>
                        </div>
                        <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Christian Teachings Section */}
            <div className="pt-6 border-t border-stone-300 dark:border-stone-800">
              <ChristianTeachingsSection maxItems={3} showHeader={true} />
            </div>
          </div>
        )}

        {activeTab === "bible" && (
          <LivingWord
            initialBookId={selectedBookId}
            initialChapter={selectedChapter}
            completedChapters={sanctuaryState.completedChapters}
            onMarkChapterRead={handleMarkChapterRead}
            onOpenVoicePractice={(bookId, chapter) => {
              setSelectedBookId(bookId);
              setSelectedChapter(chapter);
              setActiveTab("voice");
            }}
          />
        )}

        {activeTab === "voice" && (
          <VoicePractice
            bookId={selectedBookId}
            chapterNumber={selectedChapter}
            onVerseCompleted={handleVerseSpoken}
          />
        )}

        {activeTab === "journal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 5 Cols: New Reflection & Voice Prayer Note Form */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleSaveReflection}
                className="p-6 rounded-lg sanctuary-card space-y-5 sticky top-24"
              >
                <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-900 dark:text-amber-400 font-semibold">
                    {isFr ? "NOUVELLE ENTRÉE D'ARCHIVE" : "NEW ARCHIVE ENTRY"}
                  </span>
                  <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {t("journal.title")}
                  </h2>
                </div>

                {savedToast && (
                  <div className="p-3 rounded bg-emerald-900/10 border border-emerald-700/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono uppercase tracking-wider">
                    {t("journal.savedSuccess")}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                    {t("journal.entryTitlePlaceholder")}
                  </label>
                  <input
                    type="text"
                    value={reflectionTitle}
                    onChange={(e) => setReflectionTitle(e.target.value)}
                    placeholder={t("journal.entryTitlePlaceholder")}
                    className="w-full px-3.5 py-2.5 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                      {t("journal.scriptureRefPlaceholder")}
                    </label>
                    <input
                      type="text"
                      value={reflectionReference}
                      onChange={(e) => setReflectionReference(e.target.value)}
                      placeholder={t("journal.scriptureRefPlaceholder")}
                      className="w-full px-3 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                      {t("journal.moodLabel")}
                    </label>
                    <select
                      value={reflectionMood}
                      onChange={(e) =>
                        setReflectionMood(e.target.value as MoodKey)
                      }
                      className="w-full px-3 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-800"
                    >
                      {(Object.keys(moodLabels) as MoodKey[]).map((m) => (
                        <option key={m} value={m}>
                          {moodLabels[m]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Voice Prayer Memo Recorder */}
                <div className="p-3.5 rounded bg-[#F3EFE6] dark:bg-[#171412] border border-stone-300 dark:border-stone-800">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-stone-800 dark:text-stone-200 font-semibold">
                        {isFr ? "Mémo Vocal de Prière" : "Voice Prayer Memo"}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {isRecordingPrayer
                          ? isFr
                            ? `Enregistrement... (${recordingDurationSec}s)`
                            : `Recording prayer... (${recordingDurationSec}s)`
                          : isFr
                          ? "Dictez votre prière à haute voix"
                          : "Dictate your spoken prayer directly"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleRecordPrayerVoiceNote}
                      className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                        isRecordingPrayer
                          ? "bg-red-700 text-white"
                          : "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900"
                      }`}
                    >
                      {isRecordingPrayer
                        ? isFr
                          ? "Arrêter"
                          : "Stop"
                        : isFr
                        ? "Dicter"
                        : "Dictate"}
                    </button>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={5}
                    value={reflectionContent}
                    onChange={(e) => setReflectionContent(e.target.value)}
                    placeholder={t("journal.contentPlaceholder")}
                    className="w-full px-3.5 py-2.5 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-800 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded bg-amber-800 hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                >
                  {t("journal.saveEntry")}
                </button>
              </form>
            </div>

            {/* Right 7 Cols: Searchable Reflections Ledger */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-4 rounded-lg sanctuary-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={journalSearch}
                    onChange={(e) => setJournalSearch(e.target.value)}
                    placeholder={
                      isFr
                        ? "Rechercher par titre, verset ou prière..."
                        : "Search by title, Scripture reference, or prayer..."
                    }
                    className="w-full px-3.5 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-800"
                  />
                </div>

                <select
                  value={journalMoodFilter}
                  onChange={(e) =>
                    setJournalMoodFilter(e.target.value as MoodKey | "all")
                  }
                  className="px-3 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300"
                >
                  <option value="all">
                    {isFr ? "Tous les états" : "All Dispositions"}
                  </option>
                  {(Object.keys(moodLabels) as MoodKey[]).map((m) => (
                    <option key={m} value={m}>
                      {moodLabels[m]}
                    </option>
                  ))}
                </select>
              </div>

              {filteredReflections.length === 0 ? (
                <div className="p-12 rounded-lg sanctuary-card text-center text-stone-500 dark:text-stone-400 font-serif italic">
                  {t("journal.emptyState")}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReflections.map((entry) => (
                    <article
                      key={entry.id}
                      className="p-6 rounded-lg sanctuary-card space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2.5 text-xs font-mono">
                        <div className="flex items-center gap-2.5">
                          <span className="text-amber-900 dark:text-amber-400 font-semibold">
                            {entry.scriptureReference}
                          </span>
                          <span className="text-stone-300 dark:text-stone-700">
                            |
                          </span>
                          <span className="uppercase tracking-wider text-stone-500">
                            {moodLabels[entry.mood]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-stone-400 tabular-nums">
                            {entry.createdAt}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteReflection(entry.id)}
                            className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title={isFr ? "Supprimer" : "Delete"}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                        {entry.title}
                      </h3>

                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                        {entry.content}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "teachers" && (
          <div className="space-y-6">
            <ChristianTeachingsSection showHeader={true} />
          </div>
        )}
      </main>

      {/* 3-Step Daily Sacred Ritual Modal */}
      <DailyRitualModal
        isOpen={isRitualModalOpen}
        onClose={() => setIsRitualModalOpen(false)}
        meditation={dailyMeditation}
        ritualState={
          sanctuaryState.dailyRitual?.date === TODAY_KEY
            ? sanctuaryState.dailyRitual
            : {
                date: TODAY_KEY,
                stepReadDone: false,
                stepSpeakDone: false,
                stepReflectDone: false,
                completedAt: null,
              }
        }
        onUpdateRitual={handleUpdateRitual}
        onCompleteRitualWithReflection={handleCompleteRitualWithReflection}
      />

      {/* Real-Time WebRTC 1-on-1 & 40-Seat Live Call Console Modal */}
      <TeacherLiveCallModal
        isOpen={isLiveCallModalOpen}
        onClose={() => setIsLiveCallModalOpen(false)}
      />

      {/* Interactive First-Login Step-by-Step Walkthrough Modal */}
      <SanctuaryWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        userName={displayName}
        userEmail={user?.email}
        onSelectFeatureAction={handleWalkthroughFeatureAction}
      />
    </div>
  );
}
