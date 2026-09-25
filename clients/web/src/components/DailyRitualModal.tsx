"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import {
  RITUAL_TRACKS,
  completeDailyRitualSession,
  getTodayRitualCompletion,
  type RitualSoulMood,
  type BibleTranslation,
  type CompletedRitualPayload,
} from "@/lib/daily-ritual";

interface DailyRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMood?: RitualSoulMood;
  onCompleted?: (payload: CompletedRitualPayload) => void;
}

const MOOD_LIST: RitualSoulMood[] = [
  "peaceful",
  "grateful",
  "seeking",
  "convicted",
  "doubting",
  "distant",
  "sabbath",
];

const TRANSLATIONS: BibleTranslation[] = ["ESV", "NIV", "KJV", "LSG"];

export function DailyRitualModal({
  isOpen,
  onClose,
  initialMood = "peaceful",
  onCompleted,
}: DailyRitualModalProps) {
  const { isFr } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedMood, setSelectedMood] = useState<RitualSoulMood>(initialMood);
  const [translation, setTranslation] = useState<BibleTranslation>(isFr ? "LSG" : "ESV");
  const [activePromptIdx, setActivePromptIdx] = useState<number>(0);

  // Step 1: 90s Abiding Timer & Speech Synthesis
  const [readingTimerSec, setReadingTimerSec] = useState<number>(90);
  const [isReadingTimerActive, setIsReadingTimerActive] = useState<boolean>(false);
  const [isSpeakingScripture, setIsSpeakingScripture] = useState<boolean>(false);

  // Step 2: Reflection Text & 60s Spoken Prayer Microphone + SpeechRecognition
  const [reflectionText, setReflectionText] = useState<string>("");
  const [prayerSeconds, setPrayerSeconds] = useState<number>(0);
  const [isRecordingPrayer, setIsRecordingPrayer] = useState<boolean>(false);
  const [micLevels, setMicLevels] = useState<number[]>(() => Array(20).fill(18));
  const [micPermissionNote, setMicPermissionNote] = useState<string | null>(null);

  // Step 3 & 4: Sabbath toggle & Completion Seal
  const [isSabbathRest, setIsSabbathRest] = useState<boolean>(false);
  const [completedResult, setCompletedResult] = useState<CompletedRitualPayload | null>(() =>
    getTodayRitualCompletion()
  );

  // Audio / Speech refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const speechRecRef = useRef<{ stop: () => void } | null>(null);

  const currentTrack = RITUAL_TRACKS[selectedMood] || RITUAL_TRACKS.peaceful;
  const prompts = isFr ? currentTrack.promptsFr : currentTrack.promptsEn;

  // Tear down external browser media resources without synchronous setState in effect
  const releaseMediaHandles = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }
  };

  const stopAllMedia = () => {
    releaseMediaHandles();
    setIsSpeakingScripture(false);
    setIsRecordingPrayer(false);
  };

  useEffect(() => {
    if (!isOpen) {
      releaseMediaHandles();
    }
    return () => {
      releaseMediaHandles();
    };
  }, [isOpen]);

  // Step 1: 90s countdown timer
  useEffect(() => {
    if (!isReadingTimerActive) return;
    const interval = setInterval(() => {
      setReadingTimerSec((prev) => {
        if (prev <= 1) {
          setIsReadingTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isReadingTimerActive]);

  // Step 2: 60s spoken prayer timer
  useEffect(() => {
    if (!isRecordingPrayer) return;
    const interval = setInterval(() => {
      setPrayerSeconds((prev) => {
        if (prev >= 60) {
          stopAllMedia();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecordingPrayer]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Web Speech Synthesis for Scripture reading
  const handleToggleSpeakScripture = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeakingScripture) {
      window.speechSynthesis.cancel();
      setIsSpeakingScripture(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${
      isFr ? currentTrack.referenceFr : currentTrack.referenceEn
    }. ${currentTrack.translations[translation].replace(/[“”«»]/g, "")}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = translation === "LSG" || isFr ? "fr-FR" : "en-US";
    utterance.rate = 0.92;
    utterance.onend = () => setIsSpeakingScripture(false);
    utterance.onerror = () => setIsSpeakingScripture(false);
    setIsSpeakingScripture(true);
    window.speechSynthesis.speak(utterance);
  };

  // Real Microphone Visualizer + Browser SpeechRecognition
  const handleTogglePrayerRecording = async () => {
    if (isRecordingPrayer) {
      stopAllMedia();
      return;
    }

    setMicPermissionNote(null);
    setIsRecordingPrayer(true);

    // Optional Browser SpeechRecognition for live private transcription
    if (typeof window !== "undefined") {
      const SpeechRecConstructor =
        (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

      if (typeof SpeechRecConstructor === "function") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rec: any = new (SpeechRecConstructor as any)();
          rec.continuous = true;
          rec.interimResults = false;
          rec.lang = isFr ? "fr-FR" : "en-US";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rec.onresult = (event: any) => {
            let transcriptChunk = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                transcriptChunk += event.results[i][0].transcript + " ";
              }
            }
            if (transcriptChunk.trim()) {
              setReflectionText((prev) =>
                prev ? `${prev.trim()} ${transcriptChunk.trim()}` : transcriptChunk.trim()
              );
            }
          };
          rec.start();
          speechRecRef.current = rec;
        } catch {
          // SpeechRecognition optional fallback
        }
      }
    }

    // Connect Web Audio API AnalyserNode for acoustic bars
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateWaveform = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const bars = Array.from({ length: 20 }, (_, i) => {
            const val = dataArray[i % dataArray.length] || 0;
            return Math.max(14, Math.min(96, Math.round((val / 255) * 95)));
          });
          setMicLevels(bars);
          rafRef.current = requestAnimationFrame(updateWaveform);
        };
        rafRef.current = requestAnimationFrame(updateWaveform);
      }
    } catch {
      // Graceful simulated breathing cadence if mic permission is declined in sandbox
      setMicPermissionNote(
        isFr
          ? "Mode recueillement silencieux actif (aucun micro requis)."
          : "Quiet contemplation timer active (microphone optional)."
      );
    }
  };

  const handleUsePrayerStarter = () => {
    const starter = isFr ? currentTrack.prayerStarterFr : currentTrack.prayerStarterEn;
    setReflectionText((prev) => (prev.trim() ? `${prev}\n\n${starter}` : starter));
  };

  const handleSealRitual = () => {
    stopAllMedia();
    const result = completeDailyRitualSession({
      mood: isSabbathRest ? "sabbath" : selectedMood,
      translation,
      reflectionText,
      prayerDurationSec: Math.max(prayerSeconds, 60),
      isSabbathRest: isSabbathRest || selectedMood === "sabbath",
      isFr,
    });
    setCompletedResult(result);
    setStep(4);
    if (onCompleted) {
      onCompleted(result);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#120E22]/75 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-ritual-modal-title"
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#FAF8F5] dark:bg-[#171326] text-[#1E1931] dark:text-[#F4EFE6] border border-[#2D2542]/15 dark:border-white/15 shadow-2xl overflow-hidden my-auto">
        {/* Top Sanctuary Progress Bar */}
        <div className="px-6 py-4 bg-white dark:bg-[#1E1833] border-b border-[#2D2542]/10 dark:border-white/10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#5A4B7C] dark:text-[#4EE2D8]">
              <span>{isFr ? "Sanctuaire Quotidien · 5 Minutes" : "5-Minute Daily Sanctuary"}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {step === 4
                  ? isFr
                    ? "Méditation Scellée ✓"
                    : "Devotion Sealed ✓"
                  : isFr
                  ? `Étape 0${step} sur 03`
                  : `Step 0${step} of 03`}
              </span>
            </div>
            <h2
              id="daily-ritual-modal-title"
              className="text-xl sm:text-2xl font-serif font-bold text-[#1E1931] dark:text-white mt-0.5"
            >
              {step === 1 && (isFr ? "01. Lire & Demeurer dans la Parole" : "01. Read & Abide in the Word")}
              {step === 2 && (isFr ? "02. Méditer & Prier à Voix Haute" : "02. Reflect & Pray Aloud")}
              {step === 3 && (isFr ? "03. Sceller Votre Recueillement" : "03. Seal Today's Sanctuary")}
              {step === 4 && (isFr ? "Amen · Votre Journée est Ancrée" : "Amen · Today's Walk is Anchored")}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isFr ? "Fermer" : "Close"}
            className="min-h-[40px] min-w-[40px] rounded-xl border border-[#2D2542]/15 dark:border-white/15 bg-[#F2ECE1] dark:bg-white/10 text-[#1E1931] dark:text-white hover:bg-[#E5DEC9] dark:hover:bg-white/20 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Interactive Step Switcher Bar (Steps 1 - 3) */}
        {step < 4 && (
          <div className="px-6 py-3 bg-[#F3EFE8] dark:bg-[#130F21] border-b border-[#2D2542]/10 dark:border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              {[
                { id: 1 as const, label: isFr ? "01. Parole (90s)" : "01. Scripture (90s)" },
                { id: 2 as const, label: isFr ? "02. Prière & Note (2m)" : "02. Prayer & Journal (2m)" },
                { id: 3 as const, label: isFr ? "03. Sceller (+50 pts)" : "03. Seal Day (+50 pts)" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    step === item.id
                      ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18]"
                      : "text-[#5A506B] dark:text-[#C8C2D6] hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-[#5A4B7C] dark:text-[#C8C2D6] whitespace-nowrap hidden sm:inline">
              🔒 {isFr ? "100% privé sur appareil" : "100% on-device privacy"}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: READ & ABIDE */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Soul Posture Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4E4462] dark:text-[#C8C2D6]">
                    {isFr
                      ? "Comment se porte votre âme ce matin ?"
                      : "How is your soul arriving this morning?"}
                  </label>
                  <span className="text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                    {isFr ? currentTrack.themeFr : currentTrack.themeEn}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {MOOD_LIST.map((mKey) => {
                    const tr = RITUAL_TRACKS[mKey];
                    const isSelected = selectedMood === mKey;
                    return (
                      <button
                        key={mKey}
                        type="button"
                        onClick={() => {
                          setSelectedMood(mKey);
                          if (mKey === "sabbath") setIsSabbathRest(true);
                        }}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-[#2D2542] dark:border-[#4EE2D8] shadow-xs"
                            : "bg-white dark:bg-[#1E1833] text-[#4E4462] dark:text-[#D5CEE6] border-[#2D2542]/12 dark:border-white/15 hover:border-[#2D2542]/30"
                        }`}
                      >
                        <span>{tr.moodEmoji}</span>
                        <span>{isFr ? tr.moodLabelFr : tr.moodLabelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scripture Passage Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1833] border border-[#2D2542]/12 dark:border-white/15 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2D2542]/10 dark:border-white/10">
                  <div>
                    <span className="text-xs font-mono text-[#5A4B7C] dark:text-[#4EE2D8] font-semibold">
                      {isFr ? currentTrack.referenceFr : currentTrack.referenceEn} · {translation}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-[#1E1931] dark:text-white">
                      {isFr ? currentTrack.themeFr : currentTrack.themeEn}
                    </h3>
                  </div>

                  {/* Bible Version Switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F2ECE1] dark:bg-[#120E22]">
                    {TRANSLATIONS.map((ver) => (
                      <button
                        key={ver}
                        type="button"
                        onClick={() => setTranslation(ver)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          translation === ver
                            ? "bg-white dark:bg-[#2D2542] text-[#1E1931] dark:text-white shadow-xs"
                            : "text-[#5A4B7C] dark:text-[#C8C2D6]"
                        }`}
                      >
                        {ver}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-lg sm:text-xl font-serif italic text-[#1E1931] dark:text-[#F4EFE6] leading-relaxed">
                  {currentTrack.translations[translation]}
                </p>

                <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed pt-2 border-t border-[#2D2542]/10 dark:border-white/10">
                  <strong className="text-[#1E1931] dark:text-white">
                    {isFr ? "Contexte historique : " : "Historical Context: "}
                  </strong>
                  {isFr ? currentTrack.contextFr : currentTrack.contextEn}
                </p>

                {/* Audio Reader & 90s Quiet Abiding Timer Controls */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSpeakScripture}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B] text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>{isSpeakingScripture ? "⏹" : "🔊"}</span>
                      <span>
                        {isSpeakingScripture
                          ? isFr
                            ? "Arrêter la lecture"
                            : "Stop Audio Reading"
                          : isFr
                          ? "Écouter le passage"
                          : "Listen Aloud"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsReadingTimerActive(!isReadingTimerActive)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F2ECE1] dark:bg-white/10 hover:bg-[#E5DEC9] dark:hover:bg-white/15 text-[#1E1931] dark:text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap font-mono tabular-nums"
                    >
                      {isReadingTimerActive
                        ? `⏸ ${formatTimer(readingTimerSec)}`
                        : `⏱ ${
                            isFr ? "Silence 90s" : "90s Stillness"
                          } (${formatTimer(readingTimerSec)})`}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    {isFr ? "Continuer vers l'Étape 02 →" : "Continue to Step 02 →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REFLECT & 60s SPOKEN / WRITTEN PRAYER */}
          {step === 2 && (
            <div className="space-y-6">
              {/* 3 Guided Reflection Prompts */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4E4462] dark:text-[#C8C2D6]">
                    {isFr
                      ? "Choisissez une question d'application concrète :"
                      : "Choose a guided reflection prompt to anchor your prayer:"}
                  </span>
                  <span className="text-xs font-mono text-[#5A4B7C] dark:text-[#4EE2D8]">
                    {isFr ? `Question 0${activePromptIdx + 1} / 03` : `Prompt 0${activePromptIdx + 1} / 03`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {prompts.map((promptText, idx) => {
                    const active = activePromptIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePromptIdx(idx)}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          active
                            ? "bg-white dark:bg-[#231C3D] border-[#1FB6B0] shadow-xs"
                            : "bg-white/70 dark:bg-[#1B1630] border-[#2D2542]/10 dark:border-white/10 hover:border-[#2D2542]/25"
                        }`}
                      >
                        <span className="text-xs font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                          0{idx + 1}. {isFr ? "Réflexion" : "Prompt"}
                        </span>
                        <p className="text-xs text-[#1E1931] dark:text-[#F4EFE6] leading-relaxed">
                          {promptText}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 60-Second Spoken Prayer Acoustic Bar */}
              <div className="p-5 rounded-2xl bg-[#1E1833] text-white border border-white/15 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#4EE2D8]">
                      <span>🎙️ {isFr ? "Prière Vocale de 60 Secondes" : "60-Second Spoken Prayer"}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatTimer(prayerSeconds)} / 1:00</span>
                    </div>
                    <p className="text-xs text-[#D5CEE6] mt-0.5">
                      {isFr
                        ? "Priez à voix haute ou écrivez ci-dessous. Votre voix est traitée localement."
                        : "Speak your prayer aloud or write below. Audio stays 100% in your browser."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePrayerRecording}
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        isRecordingPrayer
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "bg-[#4EE2D8] hover:bg-[#37C6C2] text-[#0E0C18]"
                      }`}
                    >
                      <span>{isRecordingPrayer ? "⏹" : "🎙️"}</span>
                      <span>
                        {isRecordingPrayer
                          ? isFr
                            ? "Arrêter la prière vocale"
                            : "Stop Spoken Prayer"
                          : isFr
                          ? "Démarrer la prière (60s)"
                          : "Start 60s Spoken Prayer"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Live Acoustic Waveform Bars */}
                <div className="h-12 flex items-end gap-1.5 px-2 py-1 rounded-xl bg-black/25">
                  {micLevels.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-full transition-all duration-150"
                      style={{
                        height: `${isRecordingPrayer ? lvl : 20}%`,
                        backgroundColor: isRecordingPrayer ? "#4EE2D8" : "rgba(255,255,255,0.22)",
                      }}
                    />
                  ))}
                </div>

                {micPermissionNote && (
                  <p className="text-xs text-[#4EE2D8] font-mono">{micPermissionNote}</p>
                )}
              </div>

              {/* Private Journal Reflection Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="ritual-reflection-textarea"
                    className="text-xs font-semibold text-[#1E1931] dark:text-white"
                  >
                    {isFr
                      ? "Votre prière écrite ou note de méditation :"
                      : "Your written prayer or journal reflection:"}
                  </label>
                  <button
                    type="button"
                    onClick={handleUsePrayerStarter}
                    className="text-xs font-semibold text-[#0E726D] dark:text-[#4EE2D8] hover:underline cursor-pointer"
                  >
                    {isFr ? "+ Insérer le modèle de prière" : "+ Insert guided prayer starter"}
                  </button>
                </div>

                <textarea
                  id="ritual-reflection-textarea"
                  rows={4}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder={isFr ? currentTrack.prayerStarterFr : currentTrack.prayerStarterEn}
                  className="w-full p-4 rounded-2xl bg-white dark:bg-[#1E1833] text-sm text-[#1E1931] dark:text-white border border-[#2D2542]/15 dark:border-white/15 focus:border-[#1FB6B0] outline-none resize-none leading-relaxed placeholder:text-[#6E6285] dark:placeholder:text-[#A9A0BC]"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-[#2D2542]/15 dark:border-white/15 text-xs font-semibold text-[#4E4462] dark:text-[#C8C2D6] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isFr ? "← Retour au passage" : "← Back to Scripture"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    {isFr ? "Continuer vers l'Étape 03 →" : "Continue to Step 03 →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SEAL TODAY'S SANCTUARY */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1833] border border-[#2D2542]/12 dark:border-white/15 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#2D2542]/10 dark:border-white/10">
                  <div>
                    <span className="text-xs font-mono text-[#0E726D] dark:text-[#4EE2D8] font-bold">
                      {isFr ? "RÉCAPITULATIF DU RECUEILLEMENT" : "TODAY'S SANCTUARY SUMMARY"}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white mt-0.5">
                      {isFr ? currentTrack.referenceFr : currentTrack.referenceEn} ({translation})
                    </h3>
                  </div>
                  <span className="text-2xl">{currentTrack.moodEmoji}</span>
                </div>

                {/* 4 Pillar Practices Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#130F21] border border-[#2D2542]/10 dark:border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-[#1E1931] dark:text-white">
                      📖 {isFr ? "Lecture Biblique" : "Scripture Reading"}
                    </span>
                    <span className="font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                      ✓ {translation}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#130F21] border border-[#2D2542]/10 dark:border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-[#1E1931] dark:text-white">
                      🙏 {isFr ? "Prière & Communion" : "Spoken / Written Prayer"}
                    </span>
                    <span className="font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8] tabular-nums">
                      ✓ {prayerSeconds > 0 ? `${prayerSeconds}s` : "60s"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#130F21] border border-[#2D2542]/10 dark:border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-[#1E1931] dark:text-white">
                      🕯️ {isFr ? "Silence & Repos" : "Quiet Abiding"}
                    </span>
                    <span className="font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                      ✓ {isFr ? "Complété" : "Completed"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#130F21] border border-[#2D2542]/10 dark:border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-[#1E1931] dark:text-white">
                      ✍️ {isFr ? "Journal de l'Âme" : "Soul Journal Entry"}
                    </span>
                    <span className="font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                      ✓ {isFr ? "Prêt à sceller" : "Ready to seal"}
                    </span>
                  </div>
                </div>

                {/* Sabbath Rest Protection Toggle */}
                <div className="p-4 rounded-2xl bg-[#F1F8F5] dark:bg-[#102222] border border-[#C5E5D8] dark:border-[#1FB6B0]/30 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                      🌿 {isFr ? "Consacrer aujourd'hui comme Repos du Sabbat" : "Consecrate Today as Holy Sabbath Rest"}
                    </div>
                    <p className="text-xs text-[#1F4A3F] dark:text-[#D7F5F2] mt-0.5">
                      {isFr
                        ? "Active le Bouclier de Grâce pour protéger votre série sans culpabilité."
                        : "Activates the Grace Shield on your 30-day heatmap to honor unhurried rest."}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isSabbathRest}
                    onClick={() => setIsSabbathRest(!isSabbathRest)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      isSabbathRest
                        ? "bg-[#1FB6B0] text-[#081C1B]"
                        : "bg-white dark:bg-[#1B1630] text-[#4E4462] dark:text-[#C8C2D6] border border-[#2D2542]/15 dark:border-white/15"
                    }`}
                  >
                    {isSabbathRest
                      ? isFr
                        ? "Sabbat Actif ✓"
                        : "Sabbath Active ✓"
                      : isFr
                      ? "Activer"
                      : "Enable"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-[#2D2542]/15 dark:border-white/15 text-xs font-semibold text-[#4E4462] dark:text-[#C8C2D6] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isFr ? "← Modifier la prière" : "← Edit Prayer"}
                  </button>

                  <button
                    type="button"
                    id="seal-daily-ritual-btn"
                    onClick={handleSealRitual}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B] text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>✦</span>
                    <span>
                      {isFr
                        ? "Amen · Sceller la Méditation du Jour (+50 pts)"
                        : "Amen · Seal Today's Devotion (+50 Grace Points)"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETION SEAL & SYNCHRONIZED STREAK CONFIRMATION */}
          {step === 4 && completedResult && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1E1833] border border-[#2D2542]/12 dark:border-white/15 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#E8F6F3] dark:bg-[#102929] text-[#0E726D] dark:text-[#4EE2D8] flex items-center justify-center text-3xl mx-auto border border-[#1FB6B0]/30">
                {completedResult.isSabbathRest ? "🌿" : "🔥"}
              </div>

              <div className="space-y-1.5 max-w-lg mx-auto">
                <p className="text-xs font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                  {isFr
                    ? "SYNCHRONISÉ AVEC VOTRE JOURNAL & HEATMAP 30 JOURS"
                    : "SYNCED TO YOUR SOUL JOURNAL & 30-DAY HEATMAP"}
                </p>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1931] dark:text-white">
                  {isFr
                    ? `Série de ${completedResult.updatedStreak.currentStreak} Jours · +${completedResult.gracePointsAwarded} Points de Grâce`
                    : `${completedResult.updatedStreak.currentStreak}-Day Streak · +${completedResult.gracePointsAwarded} Grace Points`}
                </h3>
                <p className="text-xs sm:text-sm text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                  {isFr
                    ? "Votre lecture biblique, votre prière et votre réflexion sont maintenant enregistrées en toute sécurité sur votre appareil."
                    : "Your Scripture reading, spoken prayer, and reflection are now anchored in your Soul Journal and 30-Day Consistency Heatmap."}
                </p>
              </div>

              {/* Synced Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#130F21] border border-[#2D2542]/10 dark:border-white/10">
                  <div className="text-lg font-serif font-bold text-[#1E1931] dark:text-white tabular-nums">
                    {completedResult.updatedStreak.currentStreak}d
                  </div>
                  <div className="text-[#5A506B] dark:text-[#C8C2D6]">
                    {isFr ? "Série Active" : "Active Streak"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#130F21] border border-[#2D2542]/10 dark:border-white/10">
                  <div className="text-lg font-serif font-bold text-[#0E726D] dark:text-[#4EE2D8] tabular-nums">
                    {completedResult.totalGracePoints}
                  </div>
                  <div className="text-[#5A506B] dark:text-[#C8C2D6]">
                    {isFr ? "Points de Grâce" : "Grace Points"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#130F21] border border-[#2D2542]/10 dark:border-white/10">
                  <div className="text-lg font-serif font-bold text-[#1E1931] dark:text-white">
                    {completedResult.translation}
                  </div>
                  <div className="text-[#5A506B] dark:text-[#C8C2D6]">
                    {isFr ? "Passage Scellé" : "Word Sealed"}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/progress"
                  onClick={onClose}
                  className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-95 transition-opacity flex items-center gap-1.5"
                >
                  <span>{isFr ? "Voir la Heatmap & les Trophées" : "View Updated 30-Day Heatmap"}</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-5 py-2.5 rounded-xl border border-[#2D2542]/15 dark:border-white/15 text-xs font-semibold text-[#1E1931] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isFr ? "Retourner au Sanctuaire" : "Return to Sanctuary"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
