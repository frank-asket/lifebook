"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n";
import { AudioWaveform } from "@/components/AudioWaveform";

export { AudioWaveform };

type VoiceStatus = "idle" | "listening" | "thinking" | "answered" | "unsupported";

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

  // English default
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

export default function VoicePractice() {
  const { isFr } = useLanguage();
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState<ReturnType<typeof answerQuestion> | null>(null);
  const [saved, setSaved] = useState(false);
  const barsRef = useRef<HTMLSpanElement | null>(null);
  const liveVolumeRef = useRef<number | null>(null);

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

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isFr ? "fr-FR" : "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function respond(question: string) {
    setStatus("thinking");
    window.setTimeout(() => {
      const nextAnswer = answerQuestion(question, isFr);
      setAnswer(nextAnswer);
      setStatus("answered");
      speak(`${nextAnswer.title}. ${nextAnswer.body}`);
    }, 600);
  }

  function startListening() {
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setTranscript("");
    setAnswer(null);
    setSaved(false);
    setStatus("listening");

    if (!Constructor) {
      // In sandbox/iframe or browsers without SpeechRecognition, run a simulated speech flow
      window.setTimeout(() => {
        const sampleSpoken = isFr
          ? "Bonjour LifeBook, comment trouver la paix de Dieu dans mes journées chargées ?"
          : "Hey LifeBook, how do I stay rooted in Scripture and prayer?";
        setTranscript(sampleSpoken);
        respond(sampleSpoken);
      }, 2600);
      return;
    }

    try {
      const recognition = new Constructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isFr ? "fr-FR" : "en-US";

      recognition.onresult = (event) => {
        const spokenText = Array.from(
          { length: event.results.length },
          (_, index) => event.results[index][0].transcript
        ).join(" ");
        setTranscript(spokenText);
        respond(spokenText);
      };

      recognition.onerror = () => {
        // Fallback gracefully so the user can still experience the response
        const fallbackSpoken = isFr
          ? "Que signifie s'arrêter et savoir que Dieu est là ?"
          : "What does it mean to be still and know God?";
        setTranscript(fallbackSpoken);
        respond(fallbackSpoken);
      };

      recognition.onend = () => {
        setStatus((current) => (current === "listening" ? "idle" : current));
      };

      recognition.start();
    } catch {
      // If mic permission blocked, run preview interaction
      window.setTimeout(() => {
        const sampleSpoken = isFr
          ? "Bonjour LifeBook, j'aimerais comprendre le sens de la Trinité."
          : "Hey LifeBook, I would like to understand the Trinity.";
        setTranscript(sampleSpoken);
        respond(sampleSpoken);
      }, 2600);
    }
  }

  function handlePromptClick(promptText: string) {
    setTranscript(promptText);
    respond(promptText);
  }

  function saveReflection() {
    if (!answer) return;
    localStorage.setItem("lifebook-voice-reflection", JSON.stringify({ question: transcript, ...answer }));
    setSaved(true);
  }

  const isActive = status === "listening" || status === "thinking";
  const buttonLabel =
    status === "listening"
      ? (isFr ? "À l'écoute de votre question..." : "Listening for your question...")
      : status === "thinking"
      ? (isFr ? "Recherche dans l'Écriture..." : "Searching Scripture...")
      : (isFr ? "Poser ma question biblique" : "Ask your Bible question");

  return (
    <section className="voice-section" id="voice">
      <div className="page-shell voice-shell">
        <div className="voice-copy">
          <p className="showcase-eyebrow">{isFr ? "Recherche biblique instantanée" : "Instant Scripture Search"}</p>
          <h2>{isFr ? "Trouvez des versets bibliques adaptés à votre situation en quelques secondes." : "Find Bible verses for your exact situation in seconds."}</h2>
          <p>
            {isFr
              ? "Exprimez vos questions, doutes ou combats du jour pour obtenir des passages pertinents, des explications contextualisées et une direction de prière immédiate."
              : "Speak or type what you are wrestling with today to get relevant Bible passages, contextual explanations, and a guided prayer step immediately."}
          </p>
          <ul className="space-y-2.5 my-5 text-sm text-[#E8E2F2] list-disc pl-4">
            <li>
              <strong className="text-white">{isFr ? "Réponses instantanées :" : "Instant answers:"}</strong>{" "}
              {isFr ? "recherchez des Écritures pour l'anxiété, les décisions, la paix ou le pardon" : "search Scripture for anxiety, work decisions, burnout, or forgiveness"}
            </li>
            <li>
              <strong className="text-white">{isFr ? "Contexte vérifié :" : "Verified context:"}</strong>{" "}
              {isFr ? "textes complets en version Louis Segond (LSG) et Bible du Semeur sans versets tronqués" : "read full passages in ESV, NIV, and CSB with zero cherry-picked fragments"}
            </li>
            <li>
              <strong className="text-white">{isFr ? "Confidentialité totale :" : "Private to your phone:"}</strong>{" "}
              {isFr ? "enregistrez vos méditations directement dans votre journal en un geste" : "save reflections straight to your personal journal in one tap"}
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
            <span>LifeBook {isFr ? "Vocal" : "Voice"}</span>
            <span className="voice-live">
              <i /> {isFr ? "Aperçu interactif" : "interactive preview"}
            </span>
          </div>
          <div className="voice-conversation">
            <div className="voice-prompt">
              <small>{isFr ? "Essayez de poser à voix haute ou appuyez ci-dessous :" : "Try asking aloud or tap below"}</small>
              <button
                type="button"
                onClick={() => handlePromptClick(isFr ? "Bonjour LifeBook, j'aimerais comprendre le sens de la Trinité." : "Hey LifeBook, I would like to understand the Trinity.")}
                className="text-left font-bold text-[#1E1931] dark:text-white hover:text-[#705EAA] dark:hover:text-[#4EE2D8] transition-colors cursor-pointer block mt-1"
              >
                {isFr ? "« Bonjour LifeBook, j'aimerais comprendre le sens de la Trinité. »" : "“Hey LifeBook, I would like to understand the Trinity.”"}
              </button>
            </div>
            <AudioWaveform
              status={status}
              isFr={isFr}
              onVolumeChange={handleVolumeChange}
              className="mt-3"
            />
            {transcript && (
              <div className="voice-transcript">
                <small>{isFr ? "Vous avez dit" : "You said"}</small>
                <p>{transcript}</p>
              </div>
            )}
            {answer && (
              <div className="voice-answer">
                <div>
                  <small>{isFr ? "Contexte scripturaire" : "Scripture context"}</small>
                  <h3>{answer.title}</h3>
                  <p>{answer.body}</p>
                  <b>{answer.verse}</b>
                </div>
                <button type="button" className="voice-save" onClick={saveReflection}>
                  {saved
                    ? (isFr ? "Enregistré dans le journal" : "Saved to Journal")
                    : (isFr ? "Enregistrer dans mon journal privé" : "Save reflection to journal")}
                </button>
              </div>
            )}
            {status === "unsupported" && (
              <p className="voice-error">
                {isFr
                  ? "La saisie vocale n'est pas disponible sur ce navigateur. Essayez Chrome ou Safari avec l'autorisation du micro activée."
                  : "Voice input is not available in this browser. Try Chrome or Safari with microphone permission enabled."}
              </p>
            )}
          </div>
          <div className="voice-controls">
            <button
              className={`voice-button voice-button-${status} ${isActive ? "voice-button-active" : ""}`}
              type="button"
              onClick={startListening}
              disabled={isActive}
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
                onClick={() => handlePromptClick(isFr ? "Versets pour apaiser l'anxiété" : "Bible verses for anxiety")}
                className="min-h-[38px] text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white dark:bg-[#221C38] hover:bg-[#F2ECE1] dark:hover:bg-[#2E264A] text-[#2D2542] dark:text-[#FDFCFB] border border-[#2D2542]/15 dark:border-white/20 transition-all cursor-pointer"
              >
                {isFr ? "✦ Anxiété" : "✦ Anxiety"}
              </button>
              <button
                type="button"
                onClick={() => handlePromptClick(isFr ? "Sagesse pour un choix difficile" : "Wisdom for decisions")}
                className="min-h-[38px] text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white dark:bg-[#221C38] hover:bg-[#F2ECE1] dark:hover:bg-[#2E264A] text-[#2D2542] dark:text-[#FDFCFB] border border-[#2D2542]/15 dark:border-white/20 transition-all cursor-pointer"
              >
                {isFr ? "✦ Sagesse" : "✦ Wisdom"}
              </button>
              <button
                type="button"
                onClick={() => handlePromptClick(isFr ? "Rendre grâce aujourd'hui" : "Gratitude in prayer")}
                className="min-h-[38px] text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white dark:bg-[#221C38] hover:bg-[#F2ECE1] dark:hover:bg-[#2E264A] text-[#2D2542] dark:text-[#FDFCFB] border border-[#2D2542]/15 dark:border-white/20 transition-all cursor-pointer"
              >
                {isFr ? "✦ Gratitude" : "✦ Gratitude"}
              </button>
            </div>
            <span className="voice-hint">
              {isFr
                ? "Suggestion : « Quels versets bibliques aident face au stress au travail ? »"
                : "Suggested: “What Bible verses help with anxiety at work?”"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
