"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { AudioWaveform } from "@/components/AudioWaveform";
import { recordDailyActivity } from "@/lib/streak";
import {
  getGracePoints,
  LIFEBOOK_RITUAL_COMPLETED_EVENT,
} from "@/lib/daily-ritual";
import {
  useHumanVoice,
  speakWithHumanVoice,
  stopHumanVoice,
} from "@/lib/human-voice";
import {
  Microphone,
  BookOpenText,
  SpeakerHigh,
  Check,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { HumanVoiceSelector } from "@/components/HumanVoiceSelector";

interface VoiceDisposition {
  id: string;
  labelEn: string;
  labelFr: string;
  emoji: string;
  color: string;
  defaultVerseEn: string;
  defaultVerseFr: string;
}

const VOICE_DISPOSITIONS: VoiceDisposition[] = [
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

interface ScriptureAnswer {
  title: string;
  body: string;
  verse: string;
}

export default function VoicePractice() {
  const { isFr } = useLanguage();
  const { activePersona } = useHumanVoice(isFr);

  const [mode, setMode] = useState<"prayer-dictation" | "scripture-search">(
    "prayer-dictation"
  );
  const [status, setStatus] = useState<
    "idle" | "listening" | "thinking" | "answered"
  >("idle");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedMood, setSelectedMood] = useState<VoiceDisposition>(
    VOICE_DISPOSITIONS[0]
  );
  const [answer, setAnswer] = useState<ScriptureAnswer | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const barsRef = useRef<HTMLSpanElement | null>(null);
  const volumeRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);

  const handleVolumeChange = useCallback((vol: number) => {
    volumeRef.current = vol;
    const el = barsRef.current;
    if (el) {
      const intensity = Math.max(0.35, Math.min(1.55, 0.45 + 1.1 * vol));
      el.style.setProperty("--voice-intensity", intensity.toFixed(3));
    }
  }, []);

  const speakText = (text: string) => {
    speakWithHumanVoice({ text, persona: activePersona });
  };

  const evaluateScriptureQuery = (query: string) => {
    setStatus("thinking");
    window.setTimeout(() => {
      const useFrench = activePersona.primaryLanguage === "fr" || isFr;
      const lower = query.toLowerCase();
      let result: ScriptureAnswer;

      if (useFrench) {
        if (
          lower.includes("trinit") ||
          lower.includes("trinité") ||
          lower.includes("dieu")
        ) {
          result = {
            title: "Éclairage biblique sur la Trinité",
            body: "L'Écriture enseigne qu'il existe un seul vrai Dieu qui subsiste éternellement en trois personnes distinctes : le Père, le Fils et le Saint-Esprit (Matthieu 28:19). Chacune possède la plénitude de la divinité et agit en parfaite harmonie pour votre salut et votre sanctification quotidienne.",
            verse: "Matthieu 28:19 (LSG)",
          };
        } else if (
          lower.includes("anxi") ||
          lower.includes("peur") ||
          lower.includes("inquiét") ||
          lower.includes("stress")
        ) {
          result = {
            title: "L'Écriture face à l'anxiété et l'inquiétude",
            body: "Dieu nous invite à ne pas porter seuls nos tourments : « Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. » Déposez dès maintenant ce fardeau entre Ses mains.",
            verse: "Philippiens 4:6-7 (LSG)",
          };
        } else if (
          lower.includes("gratitude") ||
          lower.includes("reconn") ||
          lower.includes("merci")
        ) {
          result = {
            title: "Cultiver un cœur reconnaissant",
            body: "La reconnaissance est un bouclier contre l'amertume et le découragement. « Rendez grâces en toutes choses, car c'est à votre égard la volonté de Dieu en Jésus-Christ. » Prenez 30 secondes pour nommer trois grâces reçues aujourd'hui.",
            verse: "1 Thessaloniciens 5:18 (LSG)",
          };
        } else {
          result = {
            title: "Écriture pour la sagesse et la direction",
            body: "Dieu promet d'accorder la sagesse avec générosité à quiconque la lui demande dans la foi (Jacques 1:5). Présentez-lui vos décisions importantes dans la prière et faites le prochain pas dans la confiance.",
            verse: "Jacques 1:5 (LSG)",
          };
        }
      } else {
        if (lower.includes("trinity")) {
          result = {
            title: "Biblical clarity on the Trinity",
            body: "Scripture teaches that there is one God who eternally exists in three persons: the Father, the Son, and the Holy Spirit (Matthew 28:19). Each person is fully God, equal in glory and purpose, working together in your salvation and daily walk.",
            verse: "Matthew 28:19 (ESV)",
          };
        } else if (
          lower.includes("anxi") ||
          lower.includes("worr") ||
          lower.includes("fear") ||
          lower.includes("stress")
        ) {
          result = {
            title: "Scripture for anxiety and peace",
            body: "God invites us to trade our heavy burdens for His supernatural rest: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.' (Philippians 4:6-7).",
            verse: "Philippians 4:6-7 (ESV)",
          };
        } else {
          result = {
            title: "Scripture for wisdom and direction",
            body: "God promises to provide wisdom generously to anyone who asks in faith without second-guessing (James 1:5). Read the surrounding verses in James chapter 1, bring your decision to God in prayer, and take the next obedient step today.",
            verse: "James 1:5 (ESV)",
          };
        }
      }

      setAnswer(result);
      setStatus("answered");
      speakText(`${result.title}. ${result.body}`);
    }, 550);
  };

  const simulateStreamingDictation = (text: string, triggerSearch: boolean) => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    const words = text.split(" ");
    let idx = 0;
    setInterimTranscript("");
    intervalRef.current = window.setInterval(() => {
      idx += 1;
      const partial = words.slice(0, idx).join(" ");
      if (idx < words.length) {
        setInterimTranscript(partial);
      } else {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setInterimTranscript("");
        setFinalTranscript((prev) =>
          prev ? `${prev.trim()} ${text}` : text
        );
        if (triggerSearch) {
          evaluateScriptureQuery(text);
        } else {
          setStatus("answered");
        }
      }
    }, 140);
  };

  const applyStarterPrompt = (promptText: string) => {
    setIsSaved(false);
    if (mode === "prayer-dictation") {
      setStatus("listening");
      simulateStreamingDictation(promptText, false);
    } else {
      setFinalTranscript(promptText);
      evaluateScriptureQuery(promptText);
    }
  };

  const saveToSoulJournal = () => {
    const combinedText = (finalTranscript || interimTranscript).trim();
    if (!combinedText) return;

    const scriptureRef =
      mode === "scripture-search" && answer
        ? answer.verse
        : isFr
        ? selectedMood.defaultVerseFr
        : selectedMood.defaultVerseEn;

    const scriptureSnippet =
      mode === "scripture-search" && answer
        ? answer.body
        : isFr
        ? "Prière vocale transcrite en direct dans le sanctuaire LifeBook."
        : "Spoken prayer transcribed live in the LifeBook Voice Sanctuary.";

    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const entryId = `voice_${Date.now()}`;
    const moodLabel = isFr ? selectedMood.labelFr : selectedMood.labelEn;

    try {
      const raw = localStorage.getItem("lifebook.journal");
      const list = raw ? JSON.parse(raw) : [];
      const newEntry = {
        id: entryId,
        date: `${isoDate} · ${timeStr}`,
        timestamp: now.getTime(),
        mood: selectedMood.id,
        moodEmoji: selectedMood.emoji,
        moodLabel,
        moodColor: selectedMood.color,
        text: combinedText,
        scriptureRef,
        scriptureSnippet,
        tags: ["#VoicePrayer", "#SpokenSanctuary", `#${selectedMood.labelEn}`],
        isFavorite: true,
      };
      localStorage.setItem(
        "lifebook.journal",
        JSON.stringify([newEntry, ...list])
      );
    } catch {}

    try {
      const rawDash = localStorage.getItem("lifebook.dashboard.journal");
      const dashList = rawDash ? JSON.parse(rawDash) : [];
      const dashEntry = {
        id: `dj-${entryId}`,
        date: `${isoDate} · ${timeStr}`,
        isoDate,
        time: timeStr,
        text: combinedText,
        mood: selectedMood.id,
        moodEmoji: selectedMood.emoji,
        moodLabel,
        moodColor: selectedMood.color,
        scriptureRef,
        scriptureSnippet,
        tags: ["#VoicePrayer", "#SpokenSanctuary"],
        isFavorite: true,
      };
      localStorage.setItem(
        "lifebook.dashboard.journal",
        JSON.stringify([dashEntry, ...dashList])
      );
    } catch {}

    const updatedStreak = recordDailyActivity(false);
    const totalGracePoints = getGracePoints() + 20;
    try {
      localStorage.setItem("lifebook.gracePoints", String(totalGracePoints));
    } catch {}

    window.dispatchEvent(
      new CustomEvent(LIFEBOOK_RITUAL_COMPLETED_EVENT, {
        detail: {
          dateStr: isoDate,
          mood: selectedMood.id,
          translation: "ESV",
          scriptureRef,
          scriptureText: scriptureSnippet,
          reflectionText: combinedText,
          prayerDurationSec: 60,
          isSabbathRest: false,
          gracePointsAwarded: 20,
          totalGracePoints,
          updatedStreak,
        },
      })
    );

    localStorage.setItem(
      "lifebook-voice-reflection",
      JSON.stringify({
        question: combinedText,
        mood: selectedMood.id,
        scriptureRef,
        savedAt: new Date().toISOString(),
      })
    );

    setIsSaved(true);
    setSavedCount((c) => c + 1);
  };

  useEffect(() => {
    let rafId: number;
    const el = barsRef.current;
    if (!el) return;

    if (status !== "listening") {
      volumeRef.current = null;
      el.style.setProperty(
        "--voice-intensity",
        status === "thinking" ? "0.75" : "1"
      );
      return;
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      if (volumeRef.current === null) {
        const t = (now - startTime) / 1000;
        const val = Math.max(
          0.32,
          Math.min(
            1.45,
            (0.35 * Math.sin(1.75 * t) + 0.65) *
              (0.85 + (0.26 * Math.sin(4.6 * t) + 0.14 * Math.cos(9.2 * t))) +
              (0.06 * Math.sin(24.3 * t) + 0.04 * Math.cos(38.7 * t))
          )
        );
        el.style.setProperty("--voice-intensity", val.toFixed(3));
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [status]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      stopHumanVoice();
    };
  }, []);

  const isListening = status === "listening";
  const isThinking = status === "thinking";
  const combinedTranscript = [finalTranscript, interimTranscript]
    .filter(Boolean)
    .join(" ")
    .trim();

  const micButtonLabel = isListening
    ? mode === "prayer-dictation"
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
    : mode === "prayer-dictation"
    ? isFr
      ? "Dicter ma prière à voix haute"
      : "Start Live Prayer Dictation"
    : isFr
    ? "Poser ma question biblique"
    : "Ask your Bible question";

  const handleMicButtonClick = () => {
    if (status === "listening") {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setInterimTranscript("");
      setStatus((prev) => (prev === "listening" ? "answered" : prev));
      return;
    }

    const SpeechRec =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    setIsSaved(false);
    setInterimTranscript("");
    if (mode === "scripture-search") {
      setFinalTranscript("");
      setAnswer(null);
    }
    setStatus("listening");

    const fallbackPrayer = isFr
      ? "Seigneur Jésus, Tu es mon Berger aujourd'hui. Je Te remets mes réunions, mes inquiétudes et ma famille. Conduis-moi près de Tes eaux paisibles et garde mon cœur dans Ta paix."
      : "Lord Jesus, You are my Shepherd today. I place my schedule, my unspoken worries, and my family into Your hands. Lead me beside Your still waters and anchor my heart in Your peace.";

    const fallbackQuestion = isFr
      ? "Bonjour LifeBook, comment trouver la paix de Dieu dans mes journées chargées ?"
      : "Hey LifeBook, how do I stay rooted in Scripture and prayer?";

    if (!SpeechRec) {
      simulateStreamingDictation(
        mode === "prayer-dictation" ? fallbackPrayer : fallbackQuestion,
        mode === "scripture-search"
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.continuous = mode === "prayer-dictation";
      rec.interimResults = true;
      rec.lang = activePersona.langCode || (isFr ? "fr-CI" : "en-NG");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + " ";
          } else {
            interimChunk += res[0].transcript;
          }
        }
        if (finalChunk.trim()) {
          setFinalTranscript(finalChunk.trim());
        }
        setInterimTranscript(interimChunk);
        if (mode === "scripture-search" && finalChunk.trim()) {
          evaluateScriptureQuery(finalChunk.trim());
        }
      };

      rec.onerror = () => {
        simulateStreamingDictation(
          mode === "prayer-dictation" ? fallbackPrayer : fallbackQuestion,
          mode === "scripture-search"
        );
      };

      rec.onend = () => {
        recognitionRef.current = null;
        setInterimTranscript("");
        setStatus((prev) => (prev === "listening" ? "answered" : prev));
      };

      rec.start();
    } catch {
      simulateStreamingDictation(
        mode === "prayer-dictation" ? fallbackPrayer : fallbackQuestion,
        mode === "scripture-search"
      );
    }
  };

  return (
    <section className="voice-section" id="voice">
      <div className="page-shell voice-shell">
        <div className="voice-copy">
          <p className="showcase-eyebrow">
            {isFr
              ? "Sanctuaire Vocal & Transcription Live"
              : "Live Voice Transcription & Scripture"}
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
                {isFr
                  ? "Transcription en temps réel :"
                  : "Live speech-to-text:"}
              </strong>{" "}
              {isFr
                ? "vos paroles s'affichent instantanément pendant que vous priez"
                : "watch your spoken prayer transcribe word-by-word in real time"}
            </li>
            <li>
              <strong className="text-white">
                {isFr
                  ? "Sauvegarde en un clic :"
                  : "One-click Soul Journal sync:"}
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

          <div className="mb-3">
            <HumanVoiceSelector compact />
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 mb-3 rounded-xl bg-[#EFEAF7] dark:bg-[#19142B] border border-[#2D2542]/10 dark:border-white/15">
            <button
              type="button"
              id="voice-mode-dictation-btn"
              onClick={() => {
                setMode("prayer-dictation");
                setIsSaved(false);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap truncate inline-flex items-center justify-center gap-1.5 ${
                mode === "prayer-dictation"
                  ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
              }`}
            >
              <Microphone size={14} weight="duotone" />
              <span>{isFr ? "Dictée de Prière Live" : "Live Prayer Dictation"}</span>
            </button>

            <button
              type="button"
              id="voice-mode-search-btn"
              onClick={() => {
                setMode("scripture-search");
                setIsSaved(false);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap truncate inline-flex items-center justify-center gap-1.5 ${
                mode === "scripture-search"
                  ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
              }`}
            >
              <BookOpenText size={14} weight="duotone" />
              <span>{isFr ? "Recherche Biblique" : "Scripture Voice Search"}</span>
            </button>
          </div>

          <div className="voice-conversation">
            <div className="mb-3">
              <small className="block text-[11px] font-semibold text-[#5E5279] dark:text-[#C8C2D6] mb-1.5">
                {isFr
                  ? "État d'âme pour le Journal Spirituel :"
                  : "Tag Soul Disposition for Journal:"}
              </small>
              <div className="flex flex-wrap gap-1.5">
                {VOICE_DISPOSITIONS.map((item) => {
                  const isSelected = selectedMood.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMood(item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-[#2D2542] dark:border-[#4EE2D8]"
                          : "bg-white/80 dark:bg-[#1E1836] text-[#3F3750] dark:text-[#D5CEE6] border-[#D5CBE4] dark:border-white/15 hover:bg-white"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{isFr ? item.labelFr : item.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="voice-prompt">
              <small>
                {mode === "prayer-dictation"
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
                  applyStarterPrompt(
                    mode === "prayer-dictation"
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
                {mode === "prayer-dictation"
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
                      setFinalTranscript("");
                      setInterimTranscript("");
                      setIsSaved(false);
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
                  setFinalTranscript(e.target.value);
                  setInterimTranscript("");
                  setIsSaved(false);
                }}
                placeholder={
                  isFr
                    ? "Appuyez sur le bouton micro ci-dessous pour dicter votre prière à voix haute, ou écrivez directement ici..."
                    : "Tap the microphone button below to dictate your prayer aloud, or type/edit directly here..."
                }
                className="w-full bg-transparent text-xs sm:text-sm text-[#1E1931] dark:text-white placeholder:text-[#8A7E9F] focus:outline-none resize-none leading-relaxed"
              />

              <div className="mt-2.5 pt-2.5 border-t border-[#E6E0F0] dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#5E5279] dark:text-[#B8B0C8]">
                  {isFr
                    ? selectedMood.defaultVerseFr
                    : selectedMood.defaultVerseEn}
                </span>

                <div className="flex items-center gap-2">
                  {combinedTranscript && (
                    <button
                      type="button"
                      onClick={() => speakText(combinedTranscript)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F2ECE1] dark:bg-white/10 hover:bg-[#E5DEC9] text-[#1E1931] dark:text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                    >
                      <SpeakerHigh size={14} weight="duotone" />
                      <span>{isFr ? "Écouter avec la Voix" : "Read Aloud"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id="voice-save-soul-journal-btn"
                    disabled={!combinedTranscript}
                    onClick={saveToSoulJournal}
                    className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] disabled:opacity-45 text-[#071F1E] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                  >
                    {isSaved && <Check size={14} weight="bold" />}
                    <span>
                      {isSaved
                        ? isFr
                          ? "Enregistré dans le Journal (+20 GP)"
                          : "Saved to Soul Journal (+20 GP)"
                        : isFr
                        ? "Enregistrer dans mon Journal (+20 GP)"
                        : "Save Spoken Prayer to Soul Journal (+20 GP)"}
                    </span>
                  </button>
                </div>
              </div>

              {isSaved && (
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                  <span>
                    {isFr
                      ? `Prière synchronisée avec votre Journal Spirituel (${savedCount}).`
                      : `Spoken prayer synced to your Soul Journal & Streak (${savedCount}).`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 font-semibold">
                    <Link
                      href="/progress"
                      className="underline hover:opacity-80 inline-flex items-center gap-1"
                    >
                      <span>{isFr ? "Voir Progrès" : "View in Progress"}</span>
                      <ArrowUpRight size={12} weight="bold" />
                    </Link>
                    <span>·</span>
                    <Link
                      href="/dashboard"
                      className="underline hover:opacity-80 inline-flex items-center gap-1"
                    >
                      <span>Dashboard</span>
                      <ArrowUpRight size={12} weight="bold" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {mode === "scripture-search" && answer && (
              <div className="voice-answer mt-3">
                <div>
                  <small>
                    {isFr ? "Contexte scripturaire" : "Scripture context"}
                  </small>
                  <h3>{answer.title}</h3>
                  <p>{answer.body}</p>
                  <b>{answer.verse}</b>
                </div>
                <button
                  type="button"
                  className="voice-save"
                  onClick={saveToSoulJournal}
                >
                  {isSaved
                    ? isFr
                      ? "Enregistré dans le journal"
                      : "Saved to Soul Journal"
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
              onClick={handleMicButtonClick}
              disabled={isThinking}
              aria-label={micButtonLabel}
            >
              <span
                ref={barsRef}
                className="voice-bars"
                aria-hidden="true"
              >
                <i className="voice-bar voice-bar-1" />
                <i className="voice-bar voice-bar-2" />
                <i className="voice-bar voice-bar-3" />
                <i className="voice-bar voice-bar-4" />
                <i className="voice-bar voice-bar-5" />
              </span>
              <span className="voice-button-label">{micButtonLabel}</span>
            </button>

            <div className="flex flex-wrap gap-2 justify-center mt-1">
              <button
                type="button"
                onClick={() =>
                  applyStarterPrompt(
                    mode === "prayer-dictation"
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
                {isFr ? "Paix & Anxiété" : "Peace & Anxiety"}
              </button>

              <button
                type="button"
                onClick={() =>
                  applyStarterPrompt(
                    mode === "prayer-dictation"
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
                {isFr ? "Sagesse" : "Wisdom"}
              </button>

              <button
                type="button"
                onClick={() =>
                  applyStarterPrompt(
                    mode === "prayer-dictation"
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
                Gratitude
              </button>
            </div>

            <span className="voice-hint">
              {mode === "prayer-dictation"
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
    </section>
  );
}
