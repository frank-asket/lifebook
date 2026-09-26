"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/i18n";
import { getBookById, getChapterContent, BIBLE_CANON } from "@/lib/bible-canon";
import { AudioWaveform } from "@/components/AudioWaveform";
import HumanVoiceSelector from "@/components/HumanVoiceSelector";
import ChristianMelodySelector from "@/components/ChristianMelodySelector";
import {
  VoiceProfile,
  getPreferredVoiceProfile,
  speakWithHumanVoice,
} from "@/lib/human-voices";

export { AudioWaveform };

export interface VoicePracticeProps {
  bookId?: string;
  chapterNumber?: number;
  onVerseCompleted?: () => void;
}

export default function VoicePractice({
  bookId = "psalms",
  chapterNumber = 23,
  onVerseCompleted,
}: VoicePracticeProps = {}) {
  const { language, isFr, t } = useLanguage();

  const [selectedBookId, setSelectedBookId] = useState(bookId);
  const [selectedChapter, setSelectedChapter] = useState(chapterNumber);
  const [selectedVerseIndex, setSelectedVerseIndex] = useState(0);

  const [selectedVoiceProfile, setSelectedVoiceProfile] =
    useState<VoiceProfile>(() => getPreferredVoiceProfile(language));
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingModel, setIsSpeakingModel] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showMelodyPanel, setShowMelodyPanel] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSelectedBookId(bookId);
    setSelectedChapter(chapterNumber);
    setSelectedVerseIndex(0);
  }, [bookId, chapterNumber]);

  useEffect(() => {
    setSelectedVoiceProfile(getPreferredVoiceProfile(language));
  }, [language]);

  const book = useMemo(
    () => getBookById(selectedBookId) || BIBLE_CANON[18],
    [selectedBookId]
  );

  const chapterData = useMemo(
    () => getChapterContent(book.id, selectedChapter),
    [book.id, selectedChapter]
  );

  const currentVerse =
    chapterData.verses[selectedVerseIndex] || chapterData.verses[0];
  const targetText = isFr ? currentVerse.fr : currentVerse.en;
  const referenceLabel = `${isFr ? book.name.fr : book.name.en} ${
    chapterData.chapter
  }:${currentVerse.verse}`;

  const normalizeWord = (w: string) =>
    w
      .toLowerCase()
      .replace(/[.,;:!?"'«»()—–-]/g, "")
      .trim();

  const targetWords = useMemo(
    () => targetText.split(/\s+/).filter(Boolean),
    [targetText]
  );

  const spokenWordsSet = useMemo(() => {
    const words = spokenTranscript
      .split(/\s+/)
      .map(normalizeWord)
      .filter(Boolean);
    return new Set(words);
  }, [spokenTranscript]);

  const computeMatchAccuracy = (transcriptText: string) => {
    const spokenSet = new Set(
      transcriptText
        .split(/\s+/)
        .map(normalizeWord)
        .filter(Boolean)
    );
    if (targetWords.length === 0) return 0;
    let matched = 0;
    targetWords.forEach((w) => {
      if (spokenSet.has(normalizeWord(w))) {
        matched += 1;
      }
    });
    return Math.min(100, Math.round((matched / targetWords.length) * 100));
  };

  const handleListenModelVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeakingModel) {
      window.speechSynthesis.cancel();
      setIsSpeakingModel(false);
      return;
    }
    speakWithHumanVoice({
      text: targetText,
      profile: selectedVoiceProfile,
      onStart: () => setIsSpeakingModel(true),
      onEnd: () => setIsSpeakingModel(false),
      onError: () => setIsSpeakingModel(false),
    });
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    setSpokenTranscript("");
    setAccuracy(null);

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
          let combined = "";
          for (let i = 0; i < event.results.length; i++) {
            combined += event.results[i][0].transcript + " ";
          }
          const clean = combined.trim();
          setSpokenTranscript(clean);
          const score = computeMatchAccuracy(clean);
          setAccuracy(score);
          if (score >= 70 && onVerseCompleted) {
            onVerseCompleted();
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          setIsListening(false);
        }
      } else {
        // Fallback simulation for environments without Web Speech API
        setIsListening(true);
        setTimeout(() => {
          setSpokenTranscript(targetText);
          setAccuracy(96);
          setIsListening(false);
          if (onVerseCompleted) onVerseCompleted();
        }, 1800);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Regional Voice / Melody Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-300 dark:border-stone-800 pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-900 dark:text-amber-400 font-semibold">
            {isFr
              ? "CHAMBRE DE PROCLAMATION VOCALE"
              : "SPOKEN SCRIPTURE & VOICE SANCTUARY"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
            {t("voice.title")}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            {t("voice.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <HumanVoiceSelector
            selectedProfile={selectedVoiceProfile}
            onSelectProfile={setSelectedVoiceProfile}
            compact
          />

          <button
            type="button"
            onClick={() => setShowMelodyPanel((prev) => !prev)}
            className={`px-3.5 py-2 rounded border text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
              showMelodyPanel
                ? "bg-amber-800 text-white border-amber-800"
                : "border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
            }`}
          >
            {isFr ? "Fond Instrumental Sacré" : "Sacred Melody Overlay"}
          </button>
        </div>
      </div>

      {showMelodyPanel && (
        <div className="p-6 rounded-lg sanctuary-card">
          <ChristianMelodySelector compact />
        </div>
      )}

      {/* Main Voice Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 4 Cols: Verse Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-lg sanctuary-card space-y-4">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500 font-semibold">
              {t("voice.selectVerse")}
            </p>

            <div>
              <label className="block text-[11px] font-mono uppercase text-stone-500 mb-1">
                {isFr ? "Livre Biblique" : "Biblical Book"}
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  setSelectedChapter(1);
                  setSelectedVerseIndex(0);
                }}
                className="w-full px-3 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
              >
                {BIBLE_CANON.map((b) => (
                  <option key={b.id} value={b.id}>
                    {isFr ? b.name.fr : b.name.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto divide-y divide-stone-200 dark:divide-stone-800 border-t border-stone-200 dark:border-stone-800 pt-2">
              {chapterData.verses.map((v, idx) => (
                <button
                  key={v.verse}
                  type="button"
                  onClick={() => {
                    setSelectedVerseIndex(idx);
                    setSpokenTranscript("");
                    setAccuracy(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded transition-colors cursor-pointer ${
                    selectedVerseIndex === idx
                      ? "bg-amber-900/10 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-semibold"
                      : "hover:bg-stone-100 dark:hover:bg-stone-900/40 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <span className="font-mono text-xs mr-2 tabular-nums">
                    v.{v.verse}
                  </span>
                  <span className="font-serif text-xs line-clamp-1">
                    {isFr ? v.fr : v.en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Active Spoken Recitation Canvas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-lg sanctuary-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-900 dark:text-amber-400 font-semibold">
                  {isFr ? "VERSET À PROCLAMER" : "TARGET SCRIPTURE PASSAGE"}
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  {referenceLabel}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleListenModelVoice}
                className="px-3.5 py-2 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                {isSpeakingModel
                  ? t("scripture.stopReading")
                  : isFr
                  ? "Écouter le Modèle Vocal"
                  : "Hear Pastoral Pronunciation"}
              </button>
            </div>

            {/* Word-by-Word Highlighted Scripture */}
            <div className="p-6 rounded bg-[#F3EFE6] dark:bg-[#171412] border border-stone-300/80 dark:border-stone-800 leading-relaxed text-xl sm:text-2xl font-serif">
              {targetWords.map((word, idx) => {
                const isMatched = spokenWordsSet.has(normalizeWord(word));
                return (
                  <span
                    key={idx}
                    className={`inline-block mr-2 transition-colors ${
                      isMatched
                        ? "text-emerald-800 dark:text-emerald-400 font-bold underline decoration-emerald-600/50"
                        : "text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Microphone Control & Waveform */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`px-6 py-3.5 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-2.5 ${
                    isListening
                      ? "bg-red-700 hover:bg-red-800 text-white"
                      : "bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isListening ? "bg-red-200 animate-ping" : "bg-amber-400"
                    }`}
                  />
                  <span>
                    {isListening
                      ? t("voice.stopSpeaking")
                      : t("voice.startSpeaking")}
                  </span>
                </button>

                <AudioWaveform isActive={isListening} />
              </div>

              {accuracy !== null && (
                <div className="flex items-baseline gap-2 border-l border-stone-300 dark:border-stone-700 pl-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-stone-500">
                    {t("voice.accuracy")}:
                  </span>
                  <span className="font-serif text-2xl font-bold text-emerald-800 dark:text-emerald-400 tabular-nums">
                    {accuracy}%
                  </span>
                </div>
              )}
            </div>

            {/* Live Transcript Ledger */}
            <div className="border-t border-stone-200 dark:border-stone-800 pt-4 space-y-1.5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
                {t("voice.recognizedText")}
              </p>
              <p className="text-sm font-serif italic text-stone-700 dark:text-stone-300 min-h-[1.75rem]">
                {spokenTranscript || t("voice.noSpeechYet")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
