"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { AudioWaveform } from "@/components/AudioWaveform";
import { recordDailyActivity } from "@/lib/streak";
import { getGracePoints, LIFEBOOK_RITUAL_COMPLETED_EVENT } from "@/lib/daily-ritual";
import {
  speakWithHumanVoice,
  stopHumanVoice,
  useHumanVoice,
} from "@/lib/human-voice";
import { HumanVoiceSelector } from "@/components/HumanVoiceSelector";

export { AudioWaveform };

type VoiceStatus = "idle" | "listening" | "thinking" | "answered" | "unsupported";
type VoiceStudioMode = "prayer-dictation" | "scripture-search";

type SoulMoodOption = {
  id: "peaceful" | "grateful" | "seeking" | "convicted" | "doubting" | "distant";
  labelEn: string;
  labelFr: string;
  emoji: string;
  color: string;
  defaultVerseEn: string;
  defaultVerseFr: string;
};

const VOICE_MOOD_OPTIONS: SoulMoodOption[] = [
  {
    id: "peaceful",
    labelEn: "Peaceful",
    labelFr: "Paisible",
    emoji: "🕊️",
    color: "#37C6C2",
    defaultVerseEn: "Psalm 23:1-3 (ESV)",
    defaultVerseFr: "Psaume 23:1-3 (LSG)",
  },
  {
    id: "grateful",
    labelEn: "Grateful",
    labelFr: "Reconnaissant",
    emoji: "🙏",
    color: "#E3B15E",
    defaultVerseEn: "Lamentations 3:22-23 (ESV)",
    defaultVerseFr: "Lamentations 3:22-23 (LSG)",
  },
  {
    id: "seeking",
    labelEn: "Seeking",
    labelFr: "En quête",
    emoji: "🔍",
    color: "#7B62B8",
    defaultVerseEn: "Proverbs 3:5-6 (ESV)",
    defaultVerseFr: "Proverbes 3:5-6 (LSG)",
  },
  {
    id: "convicted",
    labelEn: "Convicted",
    labelFr: "Repentant",
    emoji: "🕯️",
    color: "#B8746B",
    defaultVerseEn: "Psalm 51:10-12 (ESV)",
    defaultVerseFr: "Psaume 51:12-14 (LSG)",
  },
  {
    id: "doubting",
    labelEn: "Doubting",
    labelFr: "En doute",
    emoji: "🤔",
    color: "#6B8CAE",
    defaultVerseEn: "Mark 9:23-24 (ESV)",
    defaultVerseFr: "Marc 9:23-24 (LSG)",
  },
  {
    id: "distant",
    labelEn: "Distant",
    labelFr: "Éloigné",
    emoji: "🌫️",
    color: "#8A7DAD",
    defaultVerseEn: "Romans 8:38-39 (ESV)",
    defaultVerseFr: "Romains 8:38-39 (LSG)",
  },
];

type SpeechResultEvent = Event & {
  results: {
    [index: number]: {
      [index: number]: { transcript: string };
      isFinal: boolean;
    };
    length: number;
  };
};

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

function answerQuestion(question: string, isFr: boolean) {
  const normalized = question.toLowerCase();

  if (isFr) {
    if (normalized.includes("trinit") || normalized.includes("trinité") || normalized.includes("dieu")) {
      return {
        title: "Éclairage biblique sur la Trinité",
        body: "L'Écriture enseigne qu'il existe un seul vrai Dieu qui subsiste éternellement en trois personnes distinctes : le Père, le Fils et le Saint-Esprit (Matthieu 28:19). Chacune possède la plénitude de la divinité et agit en parfaite harmonie pour votre salut et votre sanctification quotidienne.",
        verse: "Matthieu 28:19 (LSG)",
      };
    }
    if (normalized.includes("anxi") || normalized.includes("peur") || normalized.includes("inquiét") || normalized.includes("stress")) {
      return {
        title: "L'Écriture face à l'anxiété et l'inquiétude",
        body: "Dieu nous invite à ne pas porter seuls nos tourments : « Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. » Déposez dès maintenant ce fardeau entre Ses mains.",
        verse: "Philippiens 4:6-7 (LSG)",
      };
    }
    if (normalized.includes("gratitude") || normalized.includes("reconn") || normalized.includes("merci")) {
      return {
        title: "Cultiver un cœur reconnaissant",
        body: "La reconnaissance est un bouclier contre l'amertume et le découragement. « Rendez grâces en toutes choses, car c'est à votre égard la volonté de Dieu en Jésus-Christ. » Prenez 30 secondes pour nommer trois grâces reçues aujourd'hui.",
        verse: "1 Thessaloniciens 5:18 (LSG)",
      };
    }
    return {
      title: "Écriture pour la sagesse et la direction",
      body: "Dieu promet d'accorder la sagesse avec générosité à quiconque la lui demande dans la foi (Jacques 1:5). Présentez-lui vos décisions importantes dans la prière et faites le prochain pas dans la confiance.",
      verse: "Jacques 1:5 (LSG)",
    };
  }

  if (normalized.includes("trinity")) {
    return {
      title: "Biblical clarity on the Trinity",
      body: "Scripture teaches that there is one God who eternally exists in three persons: the Father, the Son, and the Holy Spirit (Matthew 28:19). Each person is fully God, equal in glory and purpose, working together in your salvation and daily walk.",
      verse: "Matthew 28:19 (ESV)",
    };
  }
  if (normalized.includes("anxi") || normalized.includes("worr") || normalized.includes("fear") || normalized.includes("stress")) {
    return {
      title: "Scripture for anxiety and peace",
      body: "God invites us to trade our heavy burdens for His supernatural rest: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.' (Philippians 4:6-7).",
      verse: "Philippians 4:6-7 (ESV)",
    };
  }
  return {
    title: "Scripture for wisdom and direction",
    body: "God promises to provide wisdom generously to anyone who asks in faith without second-guessing (James 1:5). Read the surrounding verses in James chapter 1, bring your decision to God in prayer, and take the next obedient step today.",
    verse: "James 1:5 (ESV)",
  };
}

/**
 * Persists a spoken prayer or voice reflection directly into BOTH
 * ProgressScreen (`lifebook.journal`) and Dashboard (`lifebook.dashboard.journal`),
 * updates the user's streak & Grace Points, and dispatches a sync event.
 */
function persistSpokenEntryToSoulJournal(params: {
  text: string;
  mood: SoulMoodOption;
  scriptureRef: string;
  scriptureSnippet: string;
  isFr: boolean;
}) {
  if (typeof window === "undefined") return;
  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const timeFormatted = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const entryId = `voice_${Date.now()}`;
  const moodLabel = params.isFr ? params.mood.labelFr : params.mood.labelEn;

  // 1. Save to ProgressScreen journal (`lifebook.journal`)
  try {
    const raw = localStorage.getItem("lifebook.journal");
    const existing = raw ? JSON.parse(raw) : [];
    const progressEntry = {
      id: entryId,
      date: `${isoDate} · ${timeFormatted}`,
      timestamp: now.getTime(),
      mood: params.mood.id,
      moodEmoji: params.mood.emoji,
      moodLabel,
      moodColor: params.mood.color,
      text: params.text,
      scriptureRef: params.scriptureRef,
      scriptureSnippet: params.scriptureSnippet,
      tags: ["#VoicePrayer", "#SpokenSanctuary", `#${params.mood.labelEn}`],
      isFavorite: true,
    };
    localStorage.setItem("lifebook.journal", JSON.stringify([progressEntry, ...existing]));
  } catch {
    // ignore
  }

  // 2. Save to Dashboard journal (`lifebook.dashboard.journal`)
  try {
    const dashRaw = localStorage.getItem("lifebook.dashboard.journal");
    const existingDash = dashRaw ? JSON.parse(dashRaw) : [];
    const dashEntry = {
      id: `dj-${entryId}`,
      date: `${isoDate} · ${timeFormatted}`,
      isoDate,
      time: timeFormatted,
      text: params.text,
      mood: params.mood.id,
      moodEmoji: params.mood.emoji,
      moodLabel,
      moodColor: params.mood.color,
      scriptureRef: params.scriptureRef,
      scriptureSnippet: params.scriptureSnippet,
      tags: ["#VoicePrayer", "#SpokenSanctuary"],
      isFavorite: true,
    };
    localStorage.setItem("lifebook.dashboard.journal", JSON.stringify([dashEntry, ...existingDash]));
  } catch {
    // ignore
  }

  // 3. Award +20 Grace Points & record daily activity
  const updatedStreak = recordDailyActivity(false);
  const prevPoints = getGracePoints();
  const totalGracePoints = prevPoints + 20;
  try {
    localStorage.setItem("lifebook.gracePoints", String(totalGracePoints));
  } catch {
    // ignore
  }

  window.dispatchEvent(
    new CustomEvent(LIFEBOOK_RITUAL_COMPLETED_EVENT, {
      detail: {
        dateStr: isoDate,
        mood: params.mood.id,
        translation: "ESV",
        scriptureRef: params.scriptureRef,
        scriptureText: params.scriptureSnippet,
        reflectionText: params.text,
        prayerDurationSec: 60,
        isSabbathRest: false,
        gracePointsAwarded: 20,
        totalGracePoints,
        updatedStreak,
      },
    })
  );
}

export default function VoicePractice() {
  const { isFr } = useLanguage();
  const { activePersona } = useHumanVoice(isFr);
  const [studioMode, setStudioMode] = useState<VoiceStudioMode>("prayer-dictation");
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedMood, setSelectedMood] = useState<SoulMoodOption>(VOICE_MOOD_OPTIONS[0]);
  const [answer, setAnswer] = useState<ReturnType<typeof answerQuestion> | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const barsRef = useRef<HTMLSpanElement | null>(null);
  const liveVolumeRef = useRef<number | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const streamTimerRef = useRef<number | null>(null);

  const handleVolumeChange = useCallback((volume: number) => {
    liveVolumeRef.current = volume;
    const el = barsRef.current;
    if (el) {
      const scaled = Math.max(0.35, Math.min(1.55, 0.45 + volume * 1.1));
      el.style.setProperty("--voice-intensity", scaled.toFixed(3));
    }
  }, []);

  // Audio intensity loop that drives natural fluid pulsing when live volume is not overriding
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;

    if (status !== "listening") {
      liveVolumeRef.current = null;
      el.style.setProperty("--voice-intensity", status === "thinking" ? "0.75" : "1");
      return;
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const updateIntensity = (now: number) => {
      if (liveVolumeRef.current === null) {
        const elapsed = (now - startTime) / 1000;
        const phrase = Math.sin(elapsed * 1.75) * 0.35 + 0.65;
        const syllables = Math.sin(elapsed * 4.6) * 0.26 + Math.cos(elapsed * 9.2) * 0.14;
        const microTremor = Math.sin(elapsed * 24.3) * 0.06 + Math.cos(elapsed * 38.7) * 0.04;
        const rawIntensity = phrase * (0.85 + syllables) + microTremor;
        const clampedIntensity = Math.max(0.32, Math.min(1.45, rawIntensity));
        el.style.setProperty("--voice-intensity", clampedIntensity.toFixed(3));
      }
      animationFrameId = requestAnimationFrame(updateIntensity);
    };

    animationFrameId = requestAnimationFrame(updateIntensity);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (streamTimerRef.current) {
        window.clearInterval(streamTimerRef.current);
      }
      stopHumanVoice();
    };
  }, []);

  function speak(text: string) {
    speakWithHumanVoice({
      text,
      persona: activePersona,
    });
  }

  function respond(question: string) {
    setStatus("thinking");
    window.setTimeout(() => {
      const useFrenchResponse = activePersona.primaryLanguage === "fr" || isFr;
      const nextAnswer = answerQuestion(question, useFrenchResponse);
      setAnswer(nextAnswer);
      setStatus("answered");
      speak(`${nextAnswer.title}. ${nextAnswer.body}`);
    }, 550);
  }

  function stopLiveDictation() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setInterimTranscript("");
    setStatus((prev) => (prev === "listening" ? "answered" : prev));
  }

  function simulateLiveStreamingDictation(targetSentence: string, shouldAnswerAfter: boolean) {
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
    }
    const words = targetSentence.split(" ");
    let idx = 0;
    setInterimTranscript("");

    streamTimerRef.current = window.setInterval(() => {
      idx += 1;
      const partial = words.slice(0, idx).join(" ");
      if (idx < words.length) {
        setInterimTranscript(partial);
      } else {
        if (streamTimerRef.current) {
          window.clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        setInterimTranscript("");
        setTranscript((prev) => (prev ? `${prev.trim()} ${targetSentence}` : targetSentence));
        if (shouldAnswerAfter) {
          respond(targetSentence);
        } else {
          setStatus("answered");
        }
      }
    }, 140);
  }

  function startListening() {
    if (status === "listening") {
      stopLiveDictation();
      return;
    }

    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSaved(false);
    setInterimTranscript("");
    if (studioMode === "scripture-search") {
      setTranscript("");
      setAnswer(null);
    }
    setStatus("listening");

    const samplePrayer = isFr
      ? "Seigneur Jésus, Tu es mon Berger aujourd'hui. Je Te remets mes réunions, mes inquiétudes et ma famille. Conduis-moi près de Tes eaux paisibles et garde mon cœur dans Ta paix."
      : "Lord Jesus, You are my Shepherd today. I place my schedule, my unspoken worries, and my family into Your hands. Lead me beside Your still waters and anchor my heart in Your peace.";

    const sampleQuestion = isFr
      ? "Bonjour LifeBook, comment trouver la paix de Dieu dans mes journées chargées ?"
      : "Hey LifeBook, how do I stay rooted in Scripture and prayer?";

    if (!Constructor) {
      simulateLiveStreamingDictation(
        studioMode === "prayer-dictation" ? samplePrayer : sampleQuestion,
        studioMode === "scripture-search"
      );
      return;
    }

    try {
      const recognition = new Constructor();
      recognitionRef.current = recognition;
      recognition.continuous = studioMode === "prayer-dictation";
      recognition.interimResults = true;
      recognition.lang = activePersona.langCode || (isFr ? "fr-CI" : "en-NG");

      recognition.onresult = (event) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + " ";
          } else {
            interimChunk += item[0].transcript;
          }
        }

        if (finalChunk.trim()) {
          setTranscript(finalChunk.trim());
        }
        setInterimTranscript(interimChunk);

        if (studioMode === "scripture-search" && finalChunk.trim()) {
          respond(finalChunk.trim());
        }
      };

      recognition.onerror = () => {
        simulateLiveStreamingDictation(
          studioMode === "prayer-dictation" ? samplePrayer : sampleQuestion,
          studioMode === "scripture-search"
        );
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setInterimTranscript("");
        setStatus((current) => (current === "listening" ? "answered" : current));
      };

      recognition.start();
    } catch {
      simulateLiveStreamingDictation(
        studioMode === "prayer-dictation" ? samplePrayer : sampleQuestion,
        studioMode === "scripture-search"
      );
    }
  }

  function handlePromptClick(promptText: string) {
    setSaved(false);
    if (studioMode === "prayer-dictation") {
      setStatus("listening");
      simulateLiveStreamingDictation(promptText, false);
    } else {
      setTranscript(promptText);
      respond(promptText);
    }
  }

  function saveToSoulJournal() {
    const textToSave = (transcript || interimTranscript).trim();
    if (!textToSave) return;

    const scriptureRef =
      studioMode === "scripture-search" && answer
        ? answer.verse
        : isFr
        ? selectedMood.defaultVerseFr
        : selectedMood.defaultVerseEn;

    const scriptureSnippet =
      studioMode === "scripture-search" && answer
        ? answer.body
        : isFr
        ? "Prière vocale transcrite en direct dans le sanctuaire LifeBook."
        : "Spoken prayer transcribed live in the LifeBook Voice Sanctuary.";

    persistSpokenEntryToSoulJournal({
      text: textToSave,
      mood: selectedMood,
      scriptureRef,
      scriptureSnippet,
      isFr,
    });

    localStorage.setItem(
      "lifebook-voice-reflection",
      JSON.stringify({
        question: textToSave,
        mood: selectedMood.id,
        scriptureRef,
        savedAt: new Date().toISOString(),
      })
    );

    setSaved(true);
    setSavedCount((c) => c + 1);
  }

  const isListening = status === "listening";
  const isThinking = status === "thinking";
  const combinedTranscript = [transcript, interimTranscript].filter(Boolean).join(" ").trim();

  const buttonLabel = isListening
    ? studioMode === "prayer-dictation"
      ? isFr
        ? "Transcription en direct... (Appuyez pour terminer)"
        : "Transcribing Live Prayer... (Tap to Finish)"
      : isFr
      ? "À l'écoute de votre question..."
      : "Listening for your question..."
    : isThinking
    ? isFr
      ? "Recherche dans l'Écriture..."
      : "Searching Scripture..."
    : studioMode === "prayer-dictation"
    ? isFr
      ? "Dicter ma prière à voix haute"
      : "Start Live Prayer Dictation"
    : isFr
    ? "Poser ma question biblique"
    : "Ask your Bible question";

  return (
    <section className="voice-section" id="voice">
      <div className="page-shell voice-shell">
        <div className="voice-copy">
          <p className="showcase-eyebrow">
            {isFr ? "Sanctuaire Vocal & Transcription Live" : "Live Voice Transcription & Scripture"}
          </p>
          <h2>
            {isFr
              ? "Exprimez vos prières à voix haute et enregistrez-les dans votre Journal."
              : "Speak your prayers aloud and save them straight to your Soul Journal."}
          </h2>
          <p>
            {isFr
              ? "Dictez votre prière du matin avec la transcription vocale en temps réel, ou posez une question biblique pour recevoir un passage vérifié."
              : "Dictate your morning prayer with live speech-to-text transcription, or speak what you are wrestling with to receive verified Scripture context."}
          </p>
          <ul className="space-y-2.5 my-5 text-sm text-[#E8E2F2] list-disc pl-4">
            <li>
              <strong className="text-white">
                {isFr ? "Transcription en temps réel :" : "Live speech-to-text:"}
              </strong>{" "}
              {isFr
                ? "vos paroles s'affichent instantanément pendant que vous priez"
                : "watch your spoken prayer transcribe word-by-word in real time"}
            </li>
            <li>
              <strong className="text-white">
                {isFr ? "Sauvegarde en un clic :" : "One-click Soul Journal sync:"}
              </strong>{" "}
              {isFr
                ? "ajoutez la prière transcrite à votre journal (/progress & /dashboard) et gagnez +20 Points de Grâce"
                : "save spoken prayers directly to your Soul Journal (/progress & /dashboard) and earn +20 Grace Points"}
            </li>
            <li>
              <strong className="text-white">
                {isFr ? "Confidentialité totale :" : "100% browser-private:"}
              </strong>{" "}
              {isFr
                ? "l'audio est traité localement dans votre navigateur"
                : "microphone audio is processed locally and never sold or shared"}
            </li>
          </ul>
          <span className="voice-privacy">
            {isFr
              ? "100 % confidentiel : l'audio est traité directement dans votre navigateur sans stockage externe."
              : "100% private: audio is processed in your browser and never uploaded or stored."}
          </span>
        </div>

        <div className="voice-console">
          <div className="voice-console-top">
            <span>LifeBook {isFr ? "Studio Vocal" : "Voice Studio"}</span>
            <span className="voice-live">
              <i />{" "}
              {isListening
                ? isFr
                  ? "Transcription en direct"
                  : "live speech-to-text"
                : isFr
                ? "Prêt à écouter"
                : "ready to transcribe"}
            </span>
          </div>

          {/* Mode Switcher: Live Prayer Dictation vs Scripture Voice Search */}
          <div className="mb-3">
            <HumanVoiceSelector compact />
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 mb-3 rounded-xl bg-[#EFEAF7] dark:bg-[#19142B] border border-[#2D2542]/10 dark:border-white/15">
            <button
              type="button"
              id="voice-mode-dictation-btn"
              onClick={() => {
                setStudioMode("prayer-dictation");
                setSaved(false);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap truncate ${
                studioMode === "prayer-dictation"
                  ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
              }`}
            >
              🎙️ {isFr ? "Dictée de Prière Live" : "Live Prayer Dictation"}
            </button>
            <button
              type="button"
              id="voice-mode-search-btn"
              onClick={() => {
                setStudioMode("scripture-search");
                setSaved(false);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap truncate ${
                studioMode === "scripture-search"
                  ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
              }`}
            >
              📖 {isFr ? "Recherche Biblique" : "Scripture Voice Search"}
            </button>
          </div>

          <div className="voice-conversation">
            {/* Soul Mood Tag Selector for Journal Attribution */}
            <div className="mb-3">
              <small className="block text-[11px] font-semibold text-[#5E5279] dark:text-[#C8C2D6] mb-1.5">
                {isFr
                  ? "État d'âme pour le Journal Spirituel :"
                  : "Tag Soul Disposition for Journal:"}
              </small>
              <div className="flex flex-wrap gap-1.5">
                {VOICE_MOOD_OPTIONS.map((m) => {
                  const active = selectedMood.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        active
                          ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-[#2D2542] dark:border-[#4EE2D8]"
                          : "bg-white/80 dark:bg-[#1E1836] text-[#3F3750] dark:text-[#D5CEE6] border-[#D5CBE4] dark:border-white/15 hover:bg-white"
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{isFr ? m.labelFr : m.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="voice-prompt">
              <small>
                {studioMode === "prayer-dictation"
                  ? isFr
                    ? "Parlez au micro ou appuyez sur un modèle de prière :"
                    : "Speak into your mic or tap a prayer starter below:"
                  : isFr
                  ? "Essayez de poser à voix haute ou appuyez ci-dessous :"
                  : "Try asking aloud or tap below:"}
              </small>
              <button
                type="button"
                onClick={() =>
                  handlePromptClick(
                    studioMode === "prayer-dictation"
                      ? isFr
                        ? "Seigneur Jésus, Tu es mon Berger aujourd'hui. Apaise mes pensées pressées et conduis mes pas dans Ta sagesse et Ta grâce."
                        : "Lord Jesus, You are my Shepherd today. Quiet my hurried thoughts and guide every conversation in Your wisdom and grace."
                      : isFr
                      ? "Bonjour LifeBook, j'aimerais comprendre le sens de la Trinité."
                      : "Hey LifeBook, I would like to understand the Trinity."
                  )
                }
                className="text-left font-bold text-[#1E1931] dark:text-white hover:text-[#705EAA] dark:hover:text-[#4EE2D8] transition-colors cursor-pointer block mt-1"
              >
                {studioMode === "prayer-dictation"
                  ? isFr
                    ? "« Seigneur Jésus, Tu es mon Berger aujourd'hui. Apaise mes pensées pressées... »"
                    : "“Lord Jesus, You are my Shepherd today. Quiet my hurried thoughts...”"
                  : isFr
                  ? "« Bonjour LifeBook, j'aimerais comprendre le sens de la Trinité. »"
                  : "“Hey LifeBook, I would like to understand the Trinity.”"}
              </button>
            </div>

            <AudioWaveform
              status={status}
              isFr={isFr}
              onVolumeChange={handleVolumeChange}
              className="mt-3"
            />

            {/* Editable Live Speech-to-Text Transcript Area */}
            <div className="mt-3 p-3.5 rounded-2xl bg-white/95 dark:bg-[#19142B] border border-[#D5CBE4] dark:border-white/15 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-[#5E5279] dark:text-[#4EE2D8]">
                  {isListening
                    ? isFr
                      ? "● Transcription vocale en cours..."
                      : "● Live Speech-to-Text Streaming..."
                    : isFr
                    ? "Transcription de votre prière / réflexion (modifiable)"
                    : "Live Prayer & Reflection Transcript (Editable)"}
                </span>
                {combinedTranscript && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript("");
                      setInterimTranscript("");
                      setSaved(false);
                    }}
                    className="text-[11px] text-[#6E628A] hover:text-rose-600 dark:text-[#C8C2D6] cursor-pointer"
                  >
                    {isFr ? "Effacer" : "Clear"}
                  </button>
                )}
              </div>

              <textarea
                id="voice-live-transcript-textarea"
                rows={3}
                value={combinedTranscript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setInterimTranscript("");
                  setSaved(false);
                }}
                placeholder={
                  isFr
                    ? "Appuyez sur le bouton micro ci-dessous pour dicter votre prière à voix haute, ou écrivez directement ici..."
                    : "Tap the microphone button below to dictate your prayer aloud, or type/edit directly here..."
                }
                className="w-full bg-transparent text-xs sm:text-sm text-[#1E1931] dark:text-white placeholder:text-[#8A7E9F] focus:outline-none resize-none leading-relaxed"
              />

              {/* One-Click Save to Soul Journal CTA */}
              <div className="mt-2.5 pt-2.5 border-t border-[#E6E0F0] dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#5E5279] dark:text-[#B8B0C8]">
                  {selectedMood.emoji}{" "}
                  {isFr ? selectedMood.defaultVerseFr : selectedMood.defaultVerseEn}
                </span>

                <div className="flex items-center gap-2">
                  {combinedTranscript && (
                    <button
                      type="button"
                      onClick={() => speak(combinedTranscript)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F2ECE1] dark:bg-white/10 hover:bg-[#E5DEC9] text-[#1E1931] dark:text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      🔊 {activePersona.countryFlag}{" "}
                      {isFr ? "Écouter avec la Voix" : "Read Aloud"}
                    </button>
                  )}
                  <button
                    type="button"
                    id="voice-save-soul-journal-btn"
                    disabled={!combinedTranscript}
                    onClick={saveToSoulJournal}
                    className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] disabled:opacity-45 text-[#071F1E] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {saved
                      ? isFr
                        ? "✓ Enregistré dans le Journal (+20 GP)"
                        : "✓ Saved to Soul Journal (+20 GP)"
                      : isFr
                      ? "Enregistrer dans mon Journal (+20 GP)"
                      : "Save Spoken Prayer to Soul Journal (+20 GP)"}
                  </button>
                </div>
              </div>

              {saved && (
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                  <span>
                    {isFr
                      ? `Prière synchronisée avec votre Journal Spirituel (${savedCount}).`
                      : `Spoken prayer synced to your Soul Journal & Streak (${savedCount}).`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 font-semibold">
                    <Link href="/progress" className="underline hover:opacity-80">
                      {isFr ? "Voir Progrès ↗" : "View in Progress ↗"}
                    </Link>
                    <span>·</span>
                    <Link href="/dashboard" className="underline hover:opacity-80">
                      {isFr ? "Dashboard ↗" : "Dashboard ↗"}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {studioMode === "scripture-search" && answer && (
              <div className="voice-answer mt-3">
                <div>
                  <small>{isFr ? "Contexte scripturaire" : "Scripture context"}</small>
                  <h3>{answer.title}</h3>
                  <p>{answer.body}</p>
                  <b>{answer.verse}</b>
                </div>
                <button type="button" className="voice-save" onClick={saveToSoulJournal}>
                  {saved
                    ? isFr
                      ? "Enregistré dans le journal ✓"
                      : "Saved to Soul Journal ✓"
                    : isFr
                    ? "Enregistrer dans mon journal privé"
                    : "Save reflection to Soul Journal"}
                </button>
              </div>
            )}
          </div>

          <div className="voice-controls">
            <button
              className={`voice-button voice-button-${status} ${
                isListening || isThinking ? "voice-button-active" : ""
              }`}
              type="button"
              id="voice-primary-mic-btn"
              onClick={startListening}
              disabled={isThinking}
              aria-label={buttonLabel}
            >
              <span ref={barsRef} className="voice-bars" aria-hidden="true">
                <i className="voice-bar voice-bar-1" />
                <i className="voice-bar voice-bar-2" />
                <i className="voice-bar voice-bar-3" />
                <i className="voice-bar voice-bar-4" />
                <i className="voice-bar voice-bar-5" />
              </span>
              <span className="voice-button-label">{buttonLabel}</span>
            </button>

            <div className="flex flex-wrap gap-2 justify-center mt-1">
              <button
                type="button"
                onClick={() =>
                  handlePromptClick(
                    studioMode === "prayer-dictation"
                      ? isFr
                        ? "Seigneur, je Te remets toute mon anxiété aujourd'hui. Remplis mon esprit de Ta paix qui surpasse toute intelligence."
                        : "Lord, I hand over my anxiety to You this morning. Guard my heart and mind in Your peace that surpasses understanding."
                      : isFr
                      ? "Versets pour apaiser l'anxiété"
                      : "Bible verses for anxiety"
                  )
                }
                className="min-h-[38px] text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white dark:bg-[#221C38] hover:bg-[#F2ECE1] dark:hover:bg-[#2E264A] text-[#2D2542] dark:text-[#FDFCFB] border border-[#2D2542]/15 dark:border-white/20 transition-all cursor-pointer"
              >
                {isFr ? "✦ Paix & Anxiété" : "✦ Peace & Anxiety"}
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePromptClick(
                    studioMode === "prayer-dictation"
                      ? isFr
                        ? "Père, accorde-moi Ta sagesse pour mes décisions de travail aujourd'hui. Que je ne m'appuie pas sur ma propre intelligence."
                        : "Father, grant me clear wisdom for today's work decisions so I lean on Your Spirit and not my own strength."
                      : isFr
                      ? "Sagesse pour un choix difficile"
                      : "Wisdom for decisions"
                  )
                }
                className="min-h-[38px] text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white dark:bg-[#221C38] hover:bg-[#F2ECE1] dark:hover:bg-[#2E264A] text-[#2D2542] dark:text-[#FDFCFB] border border-[#2D2542]/15 dark:border-white/20 transition-all cursor-pointer"
              >
                {isFr ? "✦ Sagesse" : "✦ Wisdom"}
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePromptClick(
                    studioMode === "prayer-dictation"
                      ? isFr
                        ? "Merci Seigneur parce que Tes compassions se renouvellent ce matin. Ouvre mes yeux pour encourager quelqu'un aujourd'hui."
                        : "Thank You Father that Your mercies are brand new this morning. Open my eyes to encourage someone around me today."
                      : isFr
                      ? "Rendre grâce aujourd'hui"
                      : "Gratitude in prayer"
                  )
                }
                className="min-h-[38px] text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white dark:bg-[#221C38] hover:bg-[#F2ECE1] dark:hover:bg-[#2E264A] text-[#2D2542] dark:text-[#FDFCFB] border border-[#2D2542]/15 dark:border-white/20 transition-all cursor-pointer"
              >
                {isFr ? "✦ Gratitude" : "✦ Gratitude"}
              </button>
            </div>
            <span className="voice-hint">
              {studioMode === "prayer-dictation"
                ? isFr
                  ? "Astuce : Dictez votre prière puis cliquez sur « Enregistrer dans mon Journal »."
                  : "Tip: Speak your prayer aloud, then click “Save Spoken Prayer to Soul Journal”."
                : isFr
                ? "Suggestion : « Quels versets bibliques aident face au stress au travail ? »"
                : "Suggested: “What Bible verses help with anxiety at work?”"}
            </span>
          </div>
        </div>
      </div>

      {/* Full Human Voice Studio Card (Nigerian EN, Côte d'Ivoire FR, American EN) */}
      <div className="page-shell mt-8">
        <HumanVoiceSelector />
      </div>
    </section>
  );
}
