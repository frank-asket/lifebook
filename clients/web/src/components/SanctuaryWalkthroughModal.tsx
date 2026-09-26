"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { markWalkthroughCompleted } from "@/lib/live-call";

interface SanctuaryWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onSelectFeatureAction?: (actionId: string) => void;
}

interface WalkthroughStep {
  id: string;
  roman: string;
  categoryEn: string;
  categoryFr: string;
  titleEn: string;
  titleFr: string;
  subtitleEn: string;
  subtitleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  keyPointsEn: string[];
  keyPointsFr: string[];
  howToUseEn: string;
  howToUseFr: string;
  interactivePromptEn: string;
  interactivePromptFr: string;
  interactiveActionLabelEn: string;
  interactiveActionLabelFr: string;
  interactiveRoute?: string;
  interactiveCallbackId?: string;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "sanctuary-command",
    roman: "I",
    categoryEn: "Sanctuary Ledger & Daily Rhythm",
    categoryFr: "Registre du Sanctuaire & Rythme Quotidien",
    titleEn: "Welcome to LifeBook Sanctuary",
    titleFr: "Bienvenue dans le Sanctuaire LifeBook",
    subtitleEn: "Your personal sacred archive for Scripture, prayer, and pastoral communion",
    subtitleFr: "Votre archive sacrée personnelle pour l'Écriture, la prière et la communion pastorale",
    descriptionEn:
      "LifeBook is structured as a quiet, distraction-free contemplative ledger. Every day opens with a curated Scripture meditation, a 3-Step Daily Sacred Ritual, and persistent cloud synchronization across your devices.",
    descriptionFr:
      "LifeBook est conçu comme un registre contemplatif calme et sans distraction. Chaque journée s'ouvre sur une méditation biblique, un Rituel Sacré Quotidien en 3 étapes et une synchronisation cloud continue.",
    keyPointsEn: [
      "Daily Sacred Ritual: Read today's verse, speak your affirmation aloud, and seal a written reflection",
      "66-Book Biblical Canon: Track chapters read and verses meditated across Old and New Testaments",
      " Bilingual Switching: Toggle seamlessly between English (KJV) and French (Louis Segond 1910)",
    ],
    keyPointsFr: [
      "Rituel Sacré Quotidien : Lisez le verset du jour, proclamez votre affirmation et scellez une réflexion",
      "Canon Biblique de 66 Livres : Suivez les chapitres lus et les versets médités dans l'Ancien et le Nouveau Testament",
      "Basculement Bilingue : Passez instantanément de l'anglais (KJV) au français (Louis Segond 1910)",
    ],
    howToUseEn:
      "Use the top navigation bar to switch between Sanctuary, Living Word, Voice Room, Reflection Journal, and the Teachers Portal.",
    howToUseFr:
      "Utilisez la barre de navigation supérieure pour passer entre Sanctuaire, Parole Vivante, Salle Vocale, Journal et Portail Enseignants.",
    interactivePromptEn: "Acknowledge your daily rhythm or open the 3-Step Daily Ritual directly from your dashboard.",
    interactivePromptFr: "Validez votre rythme quotidien ou ouvrez le Rituel Quotidien en 3 étapes depuis votre tableau de bord.",
    interactiveActionLabelEn: "Preview Daily Sacred Ritual",
    interactiveActionLabelFr: "Aperçu du Rituel Sacré Quotidien",
    interactiveCallbackId: "open-daily-ritual",
  },
  {
    id: "living-word-voices",
    roman: "II",
    categoryEn: "Scripture Narration & Regional Voices",
    categoryFr: "Narration Biblique & Voix Régionales",
    titleEn: "The Living Word & Authentic Accents",
    titleFr: "La Parole Vivante & Accents Authentiques",
    subtitleEn: "Contextually warm human-cadence voices in Nigerian English, Côte d'Ivoire French, and American English",
    subtitleFr: "Voix humaines chaleureuses en anglais nigérian, français de Côte d'Ivoire et anglais américain",
    descriptionEn:
      "Hear the Scriptures read with natural pastoral cadence and breath. The HumanVoiceSelector lets you filter and toggle between Nigerian English (Lagos & Abuja warmth), Côte d'Ivoire French (Abidjan West African cadence), and American English.",
    descriptionFr:
      "Écoutez les Écritures lues avec une cadence pastorale naturelle. Le sélecteur vocal vous permet de choisir entre l'anglais nigérian, le français de Côte d'Ivoire (cadence d'Abidjan) et l'anglais américain.",
    keyPointsEn: [
      "Regional Accent Filter: Switch between Nigerian (EN-NG), Ivorian (FR-CI), and American (EN-US) presets",
      "Acoustic Warmth & Breath: Tuned pitch, pastoral pacing, and gentle room resonance for lifelike reading",
      "Verse-by-Verse Sync: Follow along visually as each Scripture passage is narrated aloud",
    ],
    keyPointsFr: [
      "Filtre d'Accents Régionaux : Basculez entre les profils Nigérian (EN-NG), Ivoirien (FR-CI) et Américain (EN-US)",
      "Chaleur Acoustique : Timbre ajusté, rythme pastoral et résonance douce pour une lecture vivante",
      "Synchronisation Verset par Verset : Suivez visuellement chaque passage biblique pendant la narration",
    ],
    howToUseEn:
      "Open 'Living Word' or click the Voice Selector in any Scripture card to audition and lock in your preferred regional narrator.",
    howToUseFr:
      "Ouvrez « Parole Vivante » ou cliquez sur le sélecteur de voix dans une carte biblique pour choisir votre narrateur régional.",
    interactivePromptEn: "Test a short audio sample of pastoral Scripture narration right now.",
    interactivePromptFr: "Testez dès maintenant un court extrait audio de narration biblique pastorale.",
    interactiveActionLabelEn: "Audition Scripture Voice Sample",
    interactiveActionLabelFr: "Écouter un Extrait Vocal",
    interactiveCallbackId: "test-voice-sample",
  },
  {
    id: "christian-melodies",
    roman: "III",
    categoryEn: "Sacred Acoustic Overlay",
    categoryFr: "Fond Musical Sacré",
    titleEn: "Christian Melodies & Instrumental Worship",
    titleFr: "Mélodies Chrétiennes & Louange Instrumentale",
    subtitleEn: "Harmonic worship pads, altar piano, and contemplative strings layered beneath your meditation",
    subtitleFr: "Nappes d'adoration, piano d'autel et cordes contemplatives superposés à votre méditation",
    descriptionEn:
      "Powered by the SanctuaryAudioProvider and lib/christian-melodies, you can overlay continuous, harmonic Christian instrumentals during prayer, journaling, or spoken Scripture narration without drowning out the voice.",
    descriptionFr:
      "Grâce au SanctuaryAudioProvider et à lib/christian-melodies, superposez des instrumentaux chrétiens harmonieux pendant la prière, le journal ou la narration biblique sans couvrir la voix.",
    keyPointsEn: [
      "6 Curated Instrumentals: Cathedral Grand Piano, String Adagio, Acoustic Harp, Warm Organ, and Kora & Pad",
      "Independent Volume Ducking: Balance background instrumental volume separately from spoken teaching audio",
      "Persistent Sanctuary Playback: Melodies continue smoothly while you move between Bible chapters and journal entries",
    ],
    keyPointsFr: [
      "6 Instrumentaux Sacrés : Piano de Cathédrale, Adagio à Cordes, Harpe Acoustique, Orgue Doux et Kora & Pad",
      "Volume Indépendant : Équilibrez le volume instrumental séparément de la voix parlée",
      "Lecture Continue : Les mélodies se poursuivent pendant votre navigation entre la Bible et le journal",
    ],
    howToUseEn:
      "Use the Christian Melodies panel on your dashboard or inside the global audio bar at the bottom of the screen to start or change instrumentals.",
    howToUseFr:
      "Utilisez le panneau Mélodies Chrétiennes sur le tableau de bord ou dans la barre audio inférieure pour lancer un instrumental.",
    interactivePromptEn: "Preview the Christian Melodies selector or toggle ambient worship accompaniment.",
    interactivePromptFr: "Prévisualisez le sélecteur de Mélodies Chrétiennes ou activez l'accompagnement instrumental.",
    interactiveActionLabelEn: "Focus Christian Melodies Panel",
    interactiveActionLabelFr: "Voir le Panneau des Mélodies",
    interactiveCallbackId: "focus-melodies",
  },
  {
    id: "voice-practice-journal",
    roman: "IV",
    categoryEn: "Spoken Affirmation & Sacred Archive",
    categoryFr: "Affirmation Parlée & Archive Sacrée",
    titleEn: "Voice Room & Contemplative Journal",
    titleFr: "Salle Vocale & Journal Contemplatif",
    subtitleEn: "Speak Scripture aloud with real-time word tracking and record prayers in your personal archive",
    subtitleFr: "Proclamez l'Écriture à haute voix avec suivi mot à mot et inscrivez vos prières dans votre archive",
    descriptionEn:
      "Faith is strengthened when spoken and written. In the Voice Room, read verses aloud while real-time speech recognition highlights each word and computes your accuracy. In the Journal, preserve prayers and gratitude notes with automatic cloud backup.",
    descriptionFr:
      "La foi s'affermit lorsqu'elle est proclamée et écrite. Dans la Salle Vocale, lisez les versets à haute voix avec suivi mot à mot. Dans le Journal, conservez vos prières et notes de gratitude.",
    keyPointsEn: [
      "Live Speech Tracking: Word-by-word visual verification as you recite verses in English or French",
      "Voice Prayer Memos: Record spoken prayers directly into your reflection timeline",
      "Searchable Prayer Ledger: Filter your written reflections by mood, Scripture reference, or date",
    ],
    keyPointsFr: [
      "Suivi Vocal en Direct : Vérification visuelle mot à mot pendant votre récitation en anglais ou en français",
      "Mémos Vocaux de Prière : Enregistrez vos prières parlées directement dans votre chronologie",
      "Registre de Prière Consultable : Filtrez vos réflexions écrites par état d'esprit, référence ou date",
    ],
    howToUseEn:
      "Select 'Voice Room' to practice speaking Scripture aloud, or 'Journal' to write and archive a personal meditation.",
    howToUseFr:
      "Sélectionnez « Salle Vocale » pour réciter l'Écriture, ou « Journal » pour rédiger et archiver une méditation personnelle.",
    interactivePromptEn: "Open the Voice Room or Journal tab on your dashboard to begin.",
    interactivePromptFr: "Ouvrez l'onglet Salle Vocale ou Journal sur votre tableau de bord pour commencer.",
    interactiveActionLabelEn: "Switch to Voice Practice Tab",
    interactiveActionLabelFr: "Ouvrir la Salle Vocale",
    interactiveCallbackId: "open-voice-tab",
  },
  {
    id: "webrtc-live-calling",
    roman: "V",
    categoryEn: "WebRTC Pastoral Communion & Teachers Portal",
    categoryFr: "Communion Pastorale WebRTC & Portail Enseignants",
    titleEn: "1-on-1 WebRTC Audio & 40-Seat Live Rooms",
    titleFr: "Audio WebRTC 1-à-1 & Salles en Direct (40 Places)",
    subtitleEn: "Teacher-initiated real-time 1-on-1 pastoral audio calls and SFU group rooms with microphone permission verification",
    subtitleFr: "Appels audio pastoraux 1-à-1 en temps réel initiés par l'enseignant et salles de groupe avec gestion du microphone",
    descriptionEn:
      "Only verified Teachers can initiate live calls. Teachers can launch either a direct 1-on-1 WebRTC Audio Call with a specific pilgrim (complete with SDP offer/answer handshake, ICE candidate exchange, and explicit navigator.mediaDevices.getUserMedia microphone permission handling) or a 40-seat group sanctuary session.",
    descriptionFr:
      "Seuls les enseignants vérifiés peuvent initier des appels en direct : soit un appel audio WebRTC 1-à-1 direct avec un pèlerin (avec négociation SDP/ICE et vérification de permission microphone), soit une session de groupe jusqu'à 40 participants.",
    keyPointsEn: [
      "Real-Time 1-on-1 WebRTC Audio: Direct teacher-to-user pastoral counseling with live microphone level diagnostics",
      "Microphone Permission Guard: Clear browser permission request flow with fallback recovery if access is blocked",
      "Teachers Directory & Analytics: Filter teachers by Theological Specialty, sort by Most Teachings Published, and inspect completion rates",
    ],
    keyPointsFr: [
      "Audio WebRTC 1-à-1 en Temps Réel : Accompagnement pastoral direct enseignant-pèlerin avec diagnostic micro",
      "Gestion des Permissions Micro : Demande explicite d'accès au microphone avec guide de dépannage",
      "Répertoire & Analytique : Filtrez par spécialité théologique, triez par enseignements publiés et consultez les statistiques",
    ],
    howToUseEn:
      "Click 'Live Call' in the top bar to open the WebRTC Console, test your microphone permissions, or initiate a 1-on-1 pastoral session.",
    howToUseFr:
      "Cliquez sur « Appel Direct » dans la barre supérieure pour ouvrir la console WebRTC, tester votre micro ou lancer un appel 1-à-1.",
    interactivePromptEn: "Open the Live Call WebRTC Console to inspect 1-on-1 calling and microphone permission checks.",
    interactivePromptFr: "Ouvrez la console d'appel WebRTC pour découvrir l'appel 1-à-1 et la vérification du microphone.",
    interactiveActionLabelEn: "Open WebRTC Live Call Console",
    interactiveActionLabelFr: "Ouvrir la Console d'Appel WebRTC",
    interactiveCallbackId: "open-live-call",
  },
];

export default function SanctuaryWalkthroughModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  onSelectFeatureAction,
}: SanctuaryWalkthroughModalProps) {
  const { language } = useLanguage();
  const router = useRouter();
  const isFr = language === "fr";

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [acknowledgedSteps, setAcknowledgedSteps] = useState<Record<string, boolean>>({});
  const [voicePreviewPlaying, setVoicePreviewPlaying] = useState(false);
  const [interactiveFeedback, setInteractiveFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setInteractiveFeedback(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setInteractiveFeedback(null);
  }, [currentStepIndex]);

  if (!isOpen) return null;

  const step = WALKTHROUGH_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === WALKTHROUGH_STEPS.length - 1;
  const completedCount = Object.keys(acknowledgedSteps).length;

  const handleCompleteWalkthrough = () => {
    markWalkthroughCompleted(userEmail);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  const handleNext = () => {
    setAcknowledgedSteps((prev) => ({ ...prev, [step.id]: true }));
    if (isLastStep) {
      handleCompleteWalkthrough();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleInteractiveAction = () => {
    setAcknowledgedSteps((prev) => ({ ...prev, [step.id]: true }));

    if (step.interactiveCallbackId === "test-voice-sample") {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const sampleText = isFr
          ? "L'Éternel est mon berger: je ne manquerai de rien. Il me fait reposer dans de verts pâturages."
          : "The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures.";
        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.lang = isFr ? "fr-FR" : "en-NG";
        utterance.rate = 0.92;
        utterance.pitch = 0.96;
        utterance.onstart = () => setVoicePreviewPlaying(true);
        utterance.onend = () => setVoicePreviewPlaying(false);
        utterance.onerror = () => setVoicePreviewPlaying(false);
        window.speechSynthesis.speak(utterance);
        setInteractiveFeedback(
          isFr
            ? "Lecture de l'extrait vocal pastoral en cours (Psaume 23:1-2)..."
            : "Playing pastoral Scripture voice sample (Psalm 23:1-2)..."
        );
      } else {
        setInteractiveFeedback(
          isFr
            ? "Synthèse vocale prête dans l'onglet Parole Vivante."
            : "Voice synthesis ready inside the Living Word tab."
        );
      }
      return;
    }

    if (step.interactiveCallbackId && onSelectFeatureAction) {
      markWalkthroughCompleted(userEmail);
      onClose();
      onSelectFeatureAction(step.interactiveCallbackId);
      return;
    }

    if (step.interactiveRoute) {
      markWalkthroughCompleted(userEmail);
      onClose();
      router.push(step.interactiveRoute);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-modal-title"
    >
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-800 rounded-xl shadow-xl overflow-hidden my-auto">
        {/* Top Archival Ledger Header */}
        <div className="px-6 py-4 bg-[#F3EFE6] dark:bg-[#1C1917] border-b border-stone-300/80 dark:border-stone-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-amber-900 dark:text-amber-400 font-semibold">
              {isFr ? "MANUEL D'ORIENTATION" : "FIRST-LOGIN ORIENTATION"}
            </span>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <span className="font-mono text-xs text-stone-600 dark:text-stone-400 tabular-nums">
              {isFr
                ? `Étape ${currentStepIndex + 1} sur ${WALKTHROUGH_STEPS.length}`
                : `Step ${currentStepIndex + 1} of ${WALKTHROUGH_STEPS.length}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCompleteWalkthrough}
            className="text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors px-2.5 py-1 border border-transparent hover:border-stone-300 dark:hover:border-stone-700 rounded"
          >
            {isFr ? "Fermer le guide" : "Skip & Enter"}
          </button>
        </div>

        {/* Step Navigation Ledger Strip */}
        <div className="grid grid-cols-5 border-b border-stone-200 dark:border-stone-800/80 bg-[#FAF8F5] dark:bg-[#141210]">
          {WALKTHROUGH_STEPS.map((item, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isDone = idx < currentStepIndex || acknowledgedSteps[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`px-3 py-3 text-left border-r last:border-r-0 border-stone-200 dark:border-stone-800/80 transition-colors ${
                  isCurrent
                    ? "bg-amber-900/8 dark:bg-amber-500/10 border-b-2 border-b-amber-800 dark:border-b-amber-500"
                    : "hover:bg-stone-100 dark:hover:bg-stone-900/60"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className={`font-serif text-xs font-bold ${
                      isCurrent
                        ? "text-amber-900 dark:text-amber-400"
                        : isDone
                        ? "text-emerald-800 dark:text-emerald-400"
                        : "text-stone-400 dark:text-stone-600"
                    }`}
                  >
                    {item.roman}.
                  </span>
                  {isDone && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      {isFr ? "Lu" : "Read"}
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] font-medium truncate ${
                    isCurrent
                      ? "text-stone-900 dark:text-stone-100"
                      : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {isFr ? item.titleFr : item.titleEn}
                </p>
              </button>
            );
          })}
        </div>

        {/* Main Step Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Category & Personalized Greeting */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-amber-900 dark:text-amber-400 font-semibold">
                {step.roman} — {isFr ? step.categoryFr : step.categoryEn}
              </span>
              {userName && currentStepIndex === 0 && (
                <span className="text-xs font-serif italic text-stone-600 dark:text-stone-400">
                  {isFr ? `Préparé pour ${userName}` : `Prepared for ${userName}`}
                </span>
              )}
            </div>

            <h2
              id="walkthrough-modal-title"
              className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight"
            >
              {isFr ? step.titleFr : step.titleEn}
            </h2>

            <p className="text-sm font-serif italic text-stone-600 dark:text-stone-300">
              {isFr ? step.subtitleFr : step.subtitleEn}
            </p>
          </div>

          {/* Core Explanation */}
          <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
            {isFr ? step.descriptionFr : step.descriptionEn}
          </p>

          {/* Architectural Ledger of Capabilities */}
          <div className="border-t border-b border-stone-200 dark:border-stone-800 py-4 space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 font-semibold">
              {isFr ? "CAPACITÉS CLÉS DE CE PILIER" : "CORE CAPABILITIES IN THIS PILLAR"}
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {(isFr ? step.keyPointsFr : step.keyPointsEn).map((point, idx) => {
                const [headline, ...rest] = point.split(":");
                const detail = rest.join(":");
                return (
                  <div
                    key={idx}
                    className="flex items-baseline gap-3 text-sm text-stone-800 dark:text-stone-200"
                  >
                    <span className="font-mono text-xs text-amber-800 dark:text-amber-400 font-semibold shrink-0 tabular-nums">
                      0{idx + 1}
                    </span>
                    <p className="leading-snug">
                      {detail ? (
                        <>
                          <strong className="font-semibold text-stone-900 dark:text-stone-100">
                            {headline}:
                          </strong>
                          <span className="text-stone-600 dark:text-stone-300">{detail}</span>
                        </>
                      ) : (
                        point
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Try-It Box */}
          <div className="p-4 rounded-lg bg-[#F3EFE6] dark:bg-[#1C1917] border border-stone-300/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-400 font-semibold">
                {isFr ? "ACTION DIRECTE & PRATIQUE" : "HANDS-ON ORIENTATION"}
              </p>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                {isFr ? step.howToUseFr : step.howToUseEn}
              </p>
              {interactiveFeedback && (
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400 pt-1">
                  {interactiveFeedback}
                </p>
              )}
            </div>

            {step.interactiveCallbackId && (
              <button
                type="button"
                onClick={handleInteractiveAction}
                className="shrink-0 px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                {voicePreviewPlaying && step.interactiveCallbackId === "test-voice-sample"
                  ? isFr
                    ? "Lecture en cours..."
                    : "Playing Voice..."
                  : isFr
                  ? step.interactiveActionLabelFr
                  : step.interactiveActionLabelEn}
              </button>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-[#F3EFE6] dark:bg-[#1C1917] border-t border-stone-300/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              {isFr ? "← Précédent" : "← Previous"}
            </button>

            <span className="text-xs font-mono text-stone-500 dark:text-stone-400 px-2">
              {completedCount}/{WALKTHROUGH_STEPS.length}{" "}
              {isFr ? "piliers explorés" : "pillars reviewed"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-lg bg-amber-800 hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              {isLastStep
                ? isFr
                  ? "Terminer & Entrer dans le Sanctuaire"
                  : "Complete & Enter Sanctuary"
                : isFr
                ? "Étape Suivante →"
                : "Next Feature →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SanctuaryWalkthroughModal };
