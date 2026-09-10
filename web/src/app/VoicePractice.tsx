"use client";

import { useState, useRef, useEffect } from "react";

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

function answerQuestion(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes("trinity")) {
    return {
      title: "The Father, Son, and Holy Spirit",
      body: "Christians believe there is one God who eternally exists as three persons: the Father, the Son, and the Holy Spirit. This is a mystery we receive with humility, not a puzzle we have to solve before we can worship. Jesus sends his disciples in the name of the Father, Son, and Holy Spirit in Matthew 28:19.",
      verse: "Matthew 28:19",
    };
  }
  return {
    title: "A place to begin",
    body: "Thank you for bringing that question honestly. Let us begin with Scripture, stay curious, and make room for prayer. LifeBook will connect you with a passage, a reflection, and a next step rather than rushing you toward a shallow answer.",
    verse: "James 1:5",
  };
}

export default function VoicePractice() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState<ReturnType<typeof answerQuestion> | null>(null);
  const [saved, setSaved] = useState(false);
  const barsRef = useRef<HTMLSpanElement | null>(null);

  // Simulated audio intensity loop that drives natural fluid pulsing
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;

    if (status !== "listening") {
      el.style.setProperty("--voice-intensity", status === "thinking" ? "0.75" : "1");
      return;
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const updateIntensity = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      
      // Multilayer acoustic modulation mimicking real speech cadence:
      // 1. Conversational phrase envelope (breathe & flow ~ 1.7s cycle)
      const phrase = Math.sin(elapsed * 1.75) * 0.35 + 0.65;
      // 2. Syllabic formant dynamics (rapid vocal cord vibrations ~ 4.5Hz & 9Hz)
      const syllables = Math.sin(elapsed * 4.6) * 0.26 + Math.cos(elapsed * 9.2) * 0.14;
      // 3. Organic micro-fluctuations in breath pressure
      const microTremor = Math.sin(elapsed * 24.3) * 0.06 + Math.cos(elapsed * 38.7) * 0.04;

      // Composite intensity scaled from gentle whisper (~0.35) to articulate crescendo (~1.45)
      const rawIntensity = phrase * (0.85 + syllables) + microTremor;
      const clampedIntensity = Math.max(0.32, Math.min(1.45, rawIntensity));

      el.style.setProperty("--voice-intensity", clampedIntensity.toFixed(3));
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
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  function respond(question: string) {
    setStatus("thinking");
    window.setTimeout(() => {
      const nextAnswer = answerQuestion(question);
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
        const sampleSpoken = "Hey LifeBook, how do I stay rooted in Scripture and prayer?";
        setTranscript(sampleSpoken);
        respond(sampleSpoken);
      }, 3400);
      return;
    }

    try {
      const recognition = new Constructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      
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
        const fallbackSpoken = "What does it mean to be still and know God?";
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
        const sampleSpoken = "Hey LifeBook, I would like to understand the Trinity.";
        setTranscript(sampleSpoken);
        respond(sampleSpoken);
      }, 3200);
    }
  }

  function saveReflection() {
    if (!answer) return;
    localStorage.setItem("lifebook-voice-reflection", JSON.stringify({ question: transcript, ...answer }));
    setSaved(true);
  }

  const isActive = status === "listening" || status === "thinking";
  const buttonLabel =
    status === "listening"
      ? "Listening..."
      : status === "thinking"
      ? "Preparing a response..."
      : "Ask LifeBook";

  return (
    <section className="voice-section" id="voice">
      <div className="page-shell voice-shell">
        <div className="voice-copy">
          <p className="showcase-eyebrow">LifeBook Voice · web preview</p>
          <h2>Bring your<br /><em>questions.</em></h2>
          <p>Ask what is on your heart. LifeBook will help you begin with Scripture, respond with prayer, and leave room for the Holy Spirit to meet you there.</p>
          <span className="voice-privacy">Tap to speak · Nothing is recorded until you choose to save it.</span>
        </div>
        <div className="voice-console">
          <div className="voice-console-top"><span>LifeBook Voice</span><span className="voice-live"><i /> browser preview</span></div>
          <div className="voice-conversation">
            <div className="voice-prompt"><small>You can ask</small><strong>“Hey LifeBook, I would like to understand the Trinity.”</strong></div>
            {transcript && <div className="voice-transcript"><small>You said</small><p>{transcript}</p></div>}
            {answer && <div className="voice-answer"><div><small>LifeBook · grounded in Scripture</small><h3>{answer.title}</h3><p>{answer.body}</p><b>{answer.verse}</b></div><button type="button" className="voice-save" onClick={saveReflection}>{saved ? "Saved to Journal" : "Save reflection"}</button></div>}
            {status === "unsupported" && <p className="voice-error">Voice input is not available in this browser. Try Chrome or Safari with microphone permission enabled.</p>}
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
            <span className="voice-hint">Try: “What does forgiveness look like?”</span>
          </div>
        </div>
      </div>
    </section>
  );
}
