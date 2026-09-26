"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import {
  WALKTHROUGH_OPEN_EVENT,
  markWalkthroughCompleted,
  shouldAutoOpenWalkthrough,
} from "@/lib/live-call";

interface WalkthroughFeatureStep {
  stepNumber: string;
  id: string;
  titleEn: string;
  titleFr: string;
  subtitleEn: string;
  subtitleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  howToStepsEn: string[];
  howToStepsFr: string[];
  actionLabelEn: string;
  actionLabelFr: string;
  targetAction: "ritual" | "progress" | "teachers" | "live-call" | "journal" | "voice";
}

const WALKTHROUGH_STEPS: WalkthroughFeatureStep[] = [
  {
    stepNumber: "01",
    id: "daily-sanctuary",
    titleEn: "01. Daily 5-Minute Sanctuary & Guided Ritual",
    titleFr: "01. Sanctuaire Quotidien de 5 Minutes & Rituel Guidé",
    subtitleEn: "Your morning home base (/dashboard)",
    subtitleFr: "Votre point d'ancrage chaque matin (/dashboard)",
    descriptionEn:
      "Every morning, LifeBook opens directly into your Sanctuary Dashboard—never a marketing page. Anchor your heart in Scripture before checking email or messages.",
    descriptionFr:
      "Chaque matin, LifeBook s'ouvre directement sur votre Tableau de Bord Sanctuaire. Ancrez votre cœur dans la Parole avant vos réunions.",
    howToStepsEn: [
      "Read Today's Anchor Scripture and switch between Psalm 23, Romans 8, or John 15.",
      "Click “Begin 5-Min Guided Ritual” to walk through 4 unhurried steps: Scripture → Audio Meditation → Personal Reflection → Amen Seal.",
      "Click “3-Min Audio” anytime to listen to the pastoral audio commentary in the persistent player.",
    ],
    howToStepsFr: [
      "Lisez le passage biblique du jour (Psaume 23, Romains 8 ou Jean 15).",
      "Cliquez sur « Démarrer le Rituel 5-Min » pour vivre les 4 étapes : Écriture → Audio → Méditation → Amen.",
      "Écoutez le commentaire audio pastoral de 3 minutes à tout moment.",
    ],
    actionLabelEn: "Open 5-Min Daily Ritual",
    actionLabelFr: "Ouvrir le Rituel 5-Min",
    targetAction: "ritual",
  },
  {
    stepNumber: "02",
    id: "progress-heatmap",
    titleEn: "02. Progress, Streaks, Sabbath Shield & 30-Day Heatmap",
    titleFr: "02. Progrès, Séries, Bouclier du Sabbat & Heatmap 30 Jours",
    subtitleEn: "Integrated inside your Dashboard ('Progress, Charts & Heatmap' tab)",
    subtitleFr: "Intégré directement dans votre Tableau de Bord",
    descriptionEn:
      "Your spiritual rhythm is tracked without legalism or guilt. Intentional Sabbath rest days protect your streak momentum automatically.",
    descriptionFr:
      "Suivez votre régularité spirituelle sans culpabilité. Les jours de repos du Sabbat protègent automatiquement votre série.",
    howToStepsEn: [
      "View your Continuous Days streak and next milestone progress bar at the top of the Dashboard.",
      "Switch to the “Progress, Charts & Heatmap” tab inside /dashboard to inspect Weekly Insight Charts (Reflection, Prayer & Consistency).",
      "Activate Sabbath Shield on rest days (🌿) so your streak is preserved without resetting to zero.",
    ],
    howToStepsFr: [
      "Consultez vos jours consécutifs et votre prochain palier en haut du Tableau de Bord.",
      "Ouvrez l'onglet « Progrès, Graphiques & Sabbat » pour voir vos graphiques hebdomadaires et la matrice 30 jours.",
      "Activez le repos du Sabbat (🌿) pour préserver votre élan sans remise à zéro.",
    ],
    actionLabelEn: "View Progress & Charts Tab",
    actionLabelFr: "Voir Progrès & Graphiques",
    targetAction: "progress",
  },
  {
    stepNumber: "03",
    id: "teachers-portal",
    titleEn: "03. Teachers Portal & Pastor Contributor Pages",
    titleFr: "03. Portail des Pasteurs & Pages Contributeurs",
    subtitleEn: "Curated by LifeBook Leadership (/teachers)",
    subtitleFr: "Choisis par la Direction LifeBook (/teachers)",
    descriptionEn:
      "To safeguard sound doctrine, contributor pages are not open to random public uploads. LifeBook Leadership appoints trusted pastors and publishes their teachings inside each teacher’s page.",
    descriptionFr:
      "La direction de LifeBook choisit chaque pasteur contributeur et ajoute leurs enseignements directement dans la page de l'enseignant.",
    howToStepsEn: [
      "Filter the Teachers Directory by Theological Specialty or sort by Most Teachings Published.",
      "Leadership can review total listen counts and completion rates in the Performance Analytics panel.",
      "Open any Pastor’s Contributor Page (/teachers/[slug]) to listen to their teachings or add new teachings.",
    ],
    howToStepsFr: [
      "Filtrez l'annuaire des pasteurs par Spécialité Théologique ou triez par nombre d'enseignements publiés.",
      "Consultez le panneau d'Analytique de Performance (écoutes totales et taux de complétion).",
      "Ouvrez la page dédiée d'un pasteur pour écouter ou publier un enseignement.",
    ],
    actionLabelEn: "Explore Teachers Portal",
    actionLabelFr: "Explorer le Portail des Pasteurs",
    targetAction: "teachers",
  },
  {
    stepNumber: "04",
    id: "live-teacher-call",
    titleEn: "04. Teacher-Hosted Live Sanctuary Calls (40 Users Max)",
    titleFr: "04. Appels en Direct des Enseignants (40 Participants Max)",
    subtitleEn: "Strict Teacher-Only Host Control · WhatsApp-style Mid-Call Invites",
    subtitleFr: "Création réservée aux enseignants · Invitations en direct",
    descriptionEn:
      "Only appointed LifeBook Teachers can start a Live Sanctuary Call, capped at 40 participants maximum for intimate pastoral fellowship. Members can join active calls or accept mid-call invitations.",
    descriptionFr:
      "Seuls les enseignants nommés peuvent démarrer un appel en direct (limité à 40 croyants maximum). Les membres peuvent rejoindre l'appel ou accepter une invitation.",
    howToStepsEn: [
      "Teacher-Only Start Rule: Regular users cannot start a call—only Teachers can launch a Live Audio/Video Fellowship room (up to 40 users).",
      "Mid-Call Invitations: While a call is live, the Host Teacher can dynamically invite & ring additional believers mid-call up to the 40-person cap.",
      "Member Participation: Click “Join Teacher's Call” on the Dashboard or Teachers Portal, toggle your mic/camera, or raise your hand (✋) for prayer.",
    ],
    howToStepsFr: [
      "Règle Hôte Enseignant : Seul un enseignant peut démarrer un appel en direct (maximum 40 participants).",
      "Invitation en cours d'appel : L'enseignant peut inviter dynamiquement des membres pendant l'appel jusqu'à 40 personnes.",
      "Participation : Rejoignez l'appel depuis le Tableau de Bord, activez votre micro/caméra ou levez la main (✋) pour la prière.",
    ],
    actionLabelEn: "Focus Live Call Sanctuary",
    actionLabelFr: "Voir l'Appel en Direct",
    targetAction: "live-call",
  },
  {
    stepNumber: "05",
    id: "soul-journal-prayer",
    titleEn: "05. Private Soul Journal & Community Prayer Wall",
    titleFr: "05. Journal Intime de l'Âme & Mur de Prière",
    subtitleEn: "Encrypted local reflection, mood tagging & PDF export",
    subtitleFr: "Méditation privée, états d'âme & export PDF",
    descriptionEn:
      "Record your honest prayers and reflections tagged by spiritual season (Peaceful, Grateful, Seeking, or Sabbath Rest) and pray alongside the global LifeBook community.",
    descriptionFr:
      "Notez vos prières et réflexions par saison spirituelle, filtrez vos archives et priez avec la communauté.",
    howToStepsEn: [
      "Open the “Soul Journal” tab in /dashboard to filter entries by date, keyword, or spiritual mood.",
      "Use the “Instant Private Prayer” box on your Dashboard to save quick morning prayers.",
      "Click “Praying Hands (🙏)” in the Community Prayer Wall to intercede for fellow believers.",
    ],
    howToStepsFr: [
      "Ouvrez l'onglet « Journal Intime » pour rechercher vos notes par date ou par état spirituel.",
      "Utilisez la boîte « Prière du Matin Directe » pour enregistrer rapidement une prière.",
      "Soutenez les autres croyants dans la prière communautaire.",
    ],
    actionLabelEn: "Open Soul Journal Tab",
    actionLabelFr: "Ouvrir le Journal Intime",
    targetAction: "journal",
  },
  {
    stepNumber: "06",
    id: "voice-and-pwa",
    titleEn: "06. LifeBook Voice & Offline Home-Screen App (PWA)",
    titleFr: "06. Prière Vocale LifeBook & Application Hors-Ligne (PWA)",
    subtitleEn: "Bilingual EN/FR Voice Companion & Direct /dashboard Launch",
    subtitleFr: "Compagnon vocal bilingue FR/EN & lancement direct",
    descriptionEn:
      "Bring your questions or burdens to LifeBook Voice for Scripture-anchored encouragement, and install LifeBook to your phone or desktop so it opens straight into /dashboard even offline.",
    descriptionFr:
      "Posez vos questions spirituelles à LifeBook Voice et installez l'application sur votre écran d'accueil pour un accès hors-ligne direct.",
    howToStepsEn: [
      "Visit “Voice Practice” (/voice) to speak or type questions in English or French and receive Scripture-grounded guidance.",
      "Click “Install App” in the top bar to add LifeBook to your Home Screen—configured to launch directly into /dashboard.",
      "Toggle EN/FR language and Light/Dark sanctuary themes anytime in the top navigation bar.",
    ],
    howToStepsFr: [
      "Visitez « Prière Vocale » (/voice) pour poser vos questions en français ou en anglais.",
      "Cliquez sur « Installer l'App » pour ajouter LifeBook à votre écran d'accueil avec ouverture directe sur /dashboard.",
      "Basculez entre Français/Anglais et le mode Clair/Sombre à tout moment.",
    ],
    actionLabelEn: "Visit LifeBook Voice",
    actionLabelFr: "Découvrir Prière Vocale",
    targetAction: "voice",
  },
];

export interface SanctuaryWalkthroughModalProps {
  onSelectDashboardTab?: (tab: "overview" | "heatmap" | "journal" | "audio") => void;
  onOpenDailyRitual?: () => void;
  onFocusLiveCall?: () => void;
}

export function SanctuaryWalkthroughModal({
  onSelectDashboardTab,
  onOpenDailyRitual,
  onFocusLiveCall,
}: SanctuaryWalkthroughModalProps) {
  const router = useRouter();
  const { isFr } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(() => shouldAutoOpenWalkthrough());
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showAllGrid, setShowAllGrid] = useState<boolean>(false);

  useEffect(() => {
    const handleOpen = () => {
      setCurrentStepIndex(0);
      setShowAllGrid(false);
      setIsOpen(true);
    };
    window.addEventListener(WALKTHROUGH_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(WALKTHROUGH_OPEN_EVENT, handleOpen);
    };
  }, []);

  const handleComplete = () => {
    markWalkthroughCompleted();
    setIsOpen(false);
  };

  const handleAction = (
    targetAction: WalkthroughFeatureStep["targetAction"]
  ) => {
    markWalkthroughCompleted();
    setIsOpen(false);
    if (targetAction === "ritual") {
      onOpenDailyRitual?.();
    } else if (targetAction === "progress") {
      onSelectDashboardTab?.("heatmap");
    } else if (targetAction === "journal") {
      onSelectDashboardTab?.("journal");
    } else if (targetAction === "live-call") {
      onFocusLiveCall?.();
    } else if (targetAction === "teachers") {
      router.push("/teachers");
    } else if (targetAction === "voice") {
      router.push("/voice");
    }
  };

  if (!isOpen) return null;

  const currentStep = WALKTHROUGH_STEPS[currentStepIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-modal-title"
    >
      <div className="bg-[#FAF8F5] dark:bg-[#171229] border border-[#2D2542]/15 dark:border-white/15 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D2542]/10 dark:border-white/12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0E726D] dark:text-[#4EE2D8] font-semibold">
              <span>✦</span>
              <span>
                {isFr
                  ? "GUIDE D'ACCUEIL DES NOUVEAUX MEMBRES · 6 FONCTIONNALITÉS"
                  : "NEW USER INTERACTIVE WALKTHROUGH · ALL 6 FEATURES EXPLAINED"}
              </span>
            </div>
            <h2
              id="walkthrough-modal-title"
              className="text-xl sm:text-2xl font-serif font-bold text-[#1E1931] dark:text-white mt-1"
            >
              {isFr
                ? "Bienvenue dans votre Sanctuaire LifeBook"
                : "Welcome to Your LifeBook Sanctuary"}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowAllGrid(!showAllGrid)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-[#2D2542]/15 dark:border-white/15 text-xs font-semibold text-[#1E1931] dark:text-white cursor-pointer whitespace-nowrap"
            >
              {showAllGrid
                ? isFr
                  ? "Vue Étape par Étape"
                  : "Step-by-Step View"
                : isFr
                ? "Voir les 6 en Grille"
                : "View All 6 Features"}
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="w-8 h-8 rounded-xl bg-[#2D2542]/10 dark:bg-white/10 hover:bg-[#2D2542]/20 text-xs font-bold text-[#1E1931] dark:text-white cursor-pointer"
              title={isFr ? "Fermer le guide" : "Skip / Close Walkthrough"}
            >
              ✕
            </button>
          </div>
        </div>

        {!showAllGrid && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {WALKTHROUGH_STEPS.map((step, idx) => {
              const isSelected = idx === currentStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-transparent"
                      : "bg-white dark:bg-[#1E1836] text-[#5A506B] dark:text-[#C8C2D6] border-[#2D2542]/10 dark:border-white/10 hover:border-[#2D2542]/30"
                  }`}
                >
                  <div className="text-[11px] font-mono tabular-nums font-bold">
                    {isFr ? `Étape ${step.stepNumber}` : `Step ${step.stepNumber}`}
                  </div>
                  <div className="text-xs font-semibold truncate mt-0.5">
                    {(isFr ? step.titleFr : step.titleEn).replace(/^\d+\.\s*/, "")}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showAllGrid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">
            {WALKTHROUGH_STEPS.map((step) => (
              <div
                key={step.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1E1836] border border-[#2D2542]/10 dark:border-white/12 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-[#0E726D] dark:text-[#4EE2D8] font-bold">
                    {isFr ? step.subtitleFr : step.subtitleEn}
                  </div>
                  <h3 className="text-sm font-serif font-bold text-[#1E1931] dark:text-white">
                    {isFr ? step.titleFr : step.titleEn}
                  </h3>
                  <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                    {isFr ? step.descriptionFr : step.descriptionEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(step.targetAction)}
                  className="self-start px-3 py-1.5 rounded-lg bg-[#F2ECE1] dark:bg-white/10 hover:bg-[#2D2542] hover:text-white dark:hover:bg-[#4EE2D8] dark:hover:text-[#0E0C18] text-xs font-bold text-[#1E1931] dark:text-white transition-colors cursor-pointer"
                >
                  {isFr ? step.actionLabelFr : step.actionLabelEn} →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1836] border border-[#2D2542]/10 dark:border-white/12 space-y-5">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[#0E726D] dark:text-[#4EE2D8] font-bold">
                {isFr ? currentStep.subtitleFr : currentStep.subtitleEn}
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white">
                {isFr ? currentStep.titleFr : currentStep.titleEn}
              </h3>
              <p className="text-xs sm:text-sm text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                {isFr ? currentStep.descriptionFr : currentStep.descriptionEn}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#2D2542]/10 dark:border-white/10">
              <div className="text-xs font-bold text-[#1E1931] dark:text-white">
                {isFr
                  ? "Comment utiliser cette fonctionnalité :"
                  : "How to use this feature:"}
              </div>
              <ol className="space-y-2">
                {(isFr ? currentStep.howToStepsFr : currentStep.howToStepsEn).map(
                  (line, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-[#2D2542] dark:text-[#E2DCEF] leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#F2ECE1] dark:bg-white/10 text-[#1E1931] dark:text-[#4EE2D8] font-mono tabular-nums font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  )
                )}
              </ol>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleAction(currentStep.targetAction)}
                className="px-4 py-2 rounded-xl bg-[#1FB6B0]/15 hover:bg-[#1FB6B0]/25 border border-[#1FB6B0]/40 text-[#0E726D] dark:text-[#4EE2D8] text-xs font-bold transition-colors cursor-pointer"
              >
                {isFr ? currentStep.actionLabelFr : currentStep.actionLabelEn} →
              </button>
              <span className="text-xs font-mono tabular-nums text-[#5A506B] dark:text-[#C8C2D6]">
                {currentStepIndex + 1} / {WALKTHROUGH_STEPS.length}{" "}
                {isFr ? "fonctionnalités" : "features explained"}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleComplete}
            className="text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white cursor-pointer"
          >
            {isFr
              ? "Marquer comme lu & entrer dans le Sanctuaire"
              : "Mark Walkthrough Complete & Enter Sanctuary"}
          </button>

          <div className="flex items-center gap-2.5">
            {!showAllGrid && currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() =>
                  setCurrentStepIndex((prev) => Math.max(0, prev - 1))
                }
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-[#2D2542]/15 dark:border-white/15 text-xs font-bold text-[#1E1931] dark:text-white cursor-pointer"
              >
                ← {isFr ? "Précédent" : "Previous"}
              </button>
            )}
            {!showAllGrid && currentStepIndex < WALKTHROUGH_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min(WALKTHROUGH_STEPS.length - 1, prev + 1)
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                {isFr ? "Fonctionnalité Suivante →" : "Next Feature →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="px-5 py-2.5 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B] text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                {isFr
                  ? "Commencer dans le Sanctuaire ✓"
                  : "Finish Walkthrough & Begin ✓"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SanctuaryWalkthroughModal;
