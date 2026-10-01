"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  NotePencil,
  Leaf,
  Compass,
  Sparkle,
  Headphones,
  UsersThree,
  Microphone,
  SpeakerHigh,
  Stop,
} from "@phosphor-icons/react";
import { useLanguage } from "@/lib/i18n";
import { useChristianAuth } from "@/lib/christian-auth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PhoneMockup } from "@/components/PhoneMockup";
import { VisualStreakCounter } from "@/components/VisualStreakCounter";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { PWAInstallButton } from "@/components/PWAInstallPrompt";
import { CloudSyncBadge } from "@/components/CloudSyncBadge";
import { speakWithHumanVoice, stopHumanVoice } from "@/lib/human-voice";
import LivingWord from "./LivingWord";
import VoicePractice from "./VoicePractice";

function ArrowUpRightIcon() {
  return <span aria-hidden="true">↗</span>;
}

function BrandLogo() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <Image src="/logol.png" alt="" fill unoptimized />
    </span>
  );
}

export default function HomePage() {
  const { isFr, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [selectedStep, setSelectedStep] = useState(0);
  const [selectedTranslation, setSelectedTranslation] = useState<"ESV" | "NIV" | "KJV" | "LSG">("ESV");
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [isReadingStepAloud, setIsReadingStepAloud] = useState(false);

  const router = useRouter();
  const { user, isSignedIn, signOut } = useChristianAuth();

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("marketing") === "1"
    ) {
      return;
    }
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    if (isSignedIn || isStandalone) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, router]);

  const benefits = useMemo(
    () =>
      isFr
        ? [
            {
              title: "Méditer un passage biblique",
              text: "Commencez avec un passage sélectionné dans une collection biblique approuvée, puis avancez à travers une pratique guidée de lecture, réflexion et prière.",
              tone: "benefit-lilac",
              iconType: "book" as const,
            },
            {
              title: "Déposer ce que vous portez",
              text: "Écrivez librement. LifeBook repère un thème et propose un passage approuvé avec une méditation guidée. L’enregistrement dans votre historique reste facultatif.",
              tone: "benefit-blue",
              iconType: "pencil" as const,
            },
            {
              title: "Grandir avec des enseignements",
              text: "Explorez LivingWord par thème, restez avec un enseignement biblique et rejoignez les échanges de la communauté.",
              tone: "benefit-mint",
              iconType: "leaf" as const,
            },
          ]
        : [
            {
              title: "Meditate on a passage",
              text: "Begin with a passage selected from an approved Scripture collection, then move through a guided rhythm of reading, reflection, and prayer.",
              tone: "benefit-lilac",
              iconType: "book" as const,
            },
            {
              title: "Bring what you are carrying",
              text: "Write freely. LifeBook identifies a theme and offers an approved passage with a guided meditation. Saving it to your account history is optional.",
              tone: "benefit-blue",
              iconType: "pencil" as const,
            },
            {
              title: "Grow through teaching",
              text: "Explore LivingWord by topic, stay with a biblical teaching, and join conversations with the community.",
              tone: "benefit-mint",
              iconType: "leaf" as const,
            },
          ],
    [isFr]
  );

  const steps = useMemo(
    () =>
      isFr
        ? [
            [
              "Lire le passage",
              "Commencez par un passage tiré de la collection biblique approuvée de LifeBook.",
            ],
            [
              "Réfléchir et méditer",
              "Répondez à une question, puis choisissez un temps de méditation de 2, 5 ou 10 minutes.",
            ],
            [
              "Prier à votre rythme",
              "Terminez par une prière guidée ou écrite. Vous choisissez si vous souhaitez l'enregistrer.",
            ],
          ]
        : [
            [
              "Read the passage",
              "Begin with a focused text selected from LifeBook's approved Scripture collection.",
            ],
            [
              "Reflect and meditate",
              "Respond to one reflection question, then choose a 2, 5, or 10-minute meditation.",
            ],
            [
              "Pray at your pace",
              "Finish with a guided or written prayer. Choose whether to save it to your account history.",
            ],
          ],
    [isFr]
  );

  const stepCards = useMemo(() => {
    const verseByTranslation: Record<"ESV" | "NIV" | "KJV" | "LSG", { quote: string; ref: string }> = {
      ESV: {
        quote: "He restores my soul.\nHe leads me in paths of righteousness.",
        ref: "Psalm 23:3 · English Standard Version",
      },
      NIV: {
        quote: "He refreshes my soul.\nHe guides me along the right paths.",
        ref: "Psalm 23:3 · New International Version",
      },
      KJV: {
        quote: "He restoreth my soul:\nhe leadeth me in the paths of righteousness.",
        ref: "Psalm 23:3 · King James Version",
      },
      LSG: {
        quote: "Il restaure mon âme,\nIl me conduit dans les sentiers de la justice.",
        ref: "Psaume 23:3 · Louis Segond 1910",
      },
    };
    const activeVerse = verseByTranslation[isFr ? "LSG" : selectedTranslation];

    return isFr
      ? [
          {
            step: "01",
            label: "Étape 01 / 03 · Lire",
            quote: activeVerse.quote,
            ref: activeVerse.ref,
            phase: "Lire (90s)",
          },
          {
            step: "02",
            label: "Étape 02 / 03 · Méditer",
            quote: "Où avez-vous besoin de\nla paix de Dieu aujourd'hui ?",
            ref: "Une question · Application concrète",
            phase: "Réfléchir · Méditer",
          },
          {
            step: "03",
            label: "Étape 03 / 03 · Prier",
            quote: "« Seigneur, guide mes pas\net apaise mes inquiétudes. »",
            ref: "Prière guidée ou écrite · Enregistrement facultatif",
            phase: "Prier",
          },
        ]
      : [
          {
            step: "01",
            label: "Step 01 / 03 · Read",
            quote: activeVerse.quote,
            ref: activeVerse.ref,
            phase: "Read (90s)",
          },
          {
            step: "02",
            label: "Step 02 / 03 · Reflect",
            quote: "Where do you need\nGod's peace today?",
            ref: "One question · Practical application",
            phase: "Reflect · Meditate",
          },
          {
            step: "03",
            label: "Step 03 / 03 · Pray",
            quote: "“Lord, guide my steps\nand quiet my worry.”",
            ref: "Guided or written prayer · Optional saving",
            phase: "Pray",
          },
        ];
  }, [isFr, selectedTranslation]);

  const studyTracks = useMemo(
    () =>
      isFr
        ? [
            {
              title: "La paix dans le travail",
              scripture: "Philippiens 4:6-7 · Psaume 23",
              days: "5 jours · 5 min / jour",
              summary: "Déposez la pression des échéances et ancrez vos matinées dans la paix du Christ avant d'ouvrir vos messages.",
            },
            {
              title: "Sagesse et décisions",
              scripture: "Jacques 1:5 · Proverbes 3:5-6",
              days: "5 jours · 5 min / jour",
              summary: "Discernez vos choix professionnels et familiaux avec clarté biblique et prière structurée.",
            },
            {
              title: "La gratitude au réveil",
              scripture: "1 Thessaloniciens 5:18 · Psaume 103",
              days: "5 jours · 5 min / jour",
              summary: "Cultivez une reconnaissance durable qui transforme votre regard sur les défis quotidiens.",
            },
          ]
        : [
            {
              title: "Peace in Busy Workdays",
              scripture: "Philippians 4:6-7 · Psalm 23",
              days: "5 days · 5 min / day",
              summary: "Surrender deadline pressure and anchor your morning in Christ before opening your inbox.",
            },
            {
              title: "Wisdom for Decisions",
              scripture: "James 1:5 · Proverbs 3:5-6",
              days: "5 days · 5 min / day",
              summary: "Navigate career and family crossroads with Scripture, reflection, and focused prayer.",
            },
            {
              title: "The Habit of Gratitude",
              scripture: "1 Thessalonians 5:18 · Psalm 103",
              days: "5 days · 5 min / day",
              summary: "Build a steady rhythm of morning thanksgiving that reshapes how you carry daily responsibilities.",
            },
          ],
    [isFr]
  );

  const faqList = useMemo(
    () =>
      isFr
        ? [
            [
              "Combien de temps prend une pratique ?",
              "La pratique quotidienne est conçue pour tenir dans quelques minutes. La durée de méditation est au choix, et vous pouvez passer une étape si votre journée est chargée.",
            ],
            [
              "Que se passe-t-il si je manque un jour ?",
              "Vous n'êtes jamais pénalisé. LifeBook intègre le repos du sabbat et la protection de grâce pour préserver votre élan spirituel.",
            ],
            [
              "Quelle source biblique LifeBook utilise-t-il ?",
              "Les passages du parcours guidé sont sélectionnés dans une collection biblique approuvée. La référence reste visible à côté du texte.",
            ],
            [
              "Comment mes prières sont-elles utilisées ?",
              "Votre prière est envoyée à LifeBook pour repérer un thème; le texte original n'est pas inclus dans la demande de génération. L'enregistrement dans votre historique est facultatif et vous pouvez supprimer un élément enregistré.",
            ],
          ]
        : [
            [
              "How long does a practice take?",
              "The daily rhythm is designed to fit into a few minutes. Choose your meditation length, and skip a step when the day is full.",
            ],
            [
              "What happens if I miss a day?",
              "You never get penalized. LifeBook includes built-in Sabbath rest and grace protection, so your momentum stays intact when life gets busy.",
            ],
            [
              "What Scripture source does LifeBook use?",
              "Guided passages are selected from LifeBook's approved Scripture collection. The passage reference stays visible beside the text.",
            ],
            [
              "How is my prayer used?",
              "Your prayer is sent to LifeBook to identify a theme; the original text is not included in the generation request. Saving it to your account history is optional, and saved entries can be deleted.",
            ],
          ],
    [isFr]
  );

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const sectionIds = [
        "top",
        "features",
        "how-it-works",
        "journeys",
        "voice",
        "living-word",
        "questions",
        "join",
      ];
      const scrollPos = window.scrollY + 100;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".showcase-page");
    if (!page) return;
    const revealItems = Array.from(page.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach(item => item.classList.add("is-visible"));
      return;
    }

    page.classList.add("reveal-ready");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
    revealItems.forEach(item => observer.observe(item));

    return () => {
      observer.disconnect();
      page.classList.remove("reveal-ready");
    };
  }, []);

  const renderBenefitIcon = (type: "book" | "pencil" | "leaf") => {
    switch (type) {
      case "book":
        return <BookOpenText size={22} weight="duotone" className="text-[#2D2542] dark:text-[#4EE2D8]" />;
      case "pencil":
        return <NotePencil size={22} weight="duotone" className="text-[#2D2542] dark:text-[#4EE2D8]" />;
      case "leaf":
        return <Leaf size={22} weight="duotone" className="text-[#1D8A5F] dark:text-[#4EE2D8]" />;
    }
  };

  return (
    <main className="showcase-page">
      <header
        className={`sticky-nav-header ${isScrolled ? "header-scrolled" : ""}`}
      >
        <nav className="showcase-nav page-shell" aria-label="Main navigation">
          <a className="wordmark" href="#top" aria-label="LifeBook home">
            <BrandLogo />
            <span>LifeBook</span>
          </a>

          <div className="showcase-links">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5"
            >
              <Sparkle size={14} weight="duotone" />
              <span>{isFr ? "Sanctuaire" : "Sanctuary"}</span>
            </Link>
            <Link
              href="/living-word"
              className={`inline-flex items-center gap-1.5 ${activeSection === "living-word" ? "active-link" : ""}`}
            >
              <Headphones size={14} weight="duotone" />
              <span>{t("nav_audio_teachings")}</span>
            </Link>
            <Link
              href="/teachers"
              className="inline-flex items-center gap-1.5"
            >
              <UsersThree size={14} weight="duotone" />
              <span>{isFr ? "Pasteurs" : "Teachers"}</span>
            </Link>
            <Link
              href="/voice"
              className={`inline-flex items-center gap-1.5 ${activeSection === "voice" ? "active-link" : ""}`}
            >
              <Microphone size={14} weight="duotone" />
              <span>{t("nav_voice_search")}</span>
            </Link>
            <a
              href="#journeys"
              className={activeSection === "journeys" ? "active-link" : ""}
            >
              {t("nav_journeys")}
            </a>
          </div>

          <div className="auth-actions flex items-center gap-2.5">
            <LanguageToggle />

            {isSignedIn ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/dashboard"
                  id="user-profile-nav-pill"
                  className="pill-button pill-dark"
                  title={
                    isFr
                      ? "Ouvrir votre Tableau de Bord du Sanctuaire"
                      : "Open your Daily Sanctuary Dashboard"
                  }
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 text-current flex items-center justify-center text-[11px] font-bold">
                    {user?.avatarInitial || "LB"}
                  </span>
                  <span>
                    {user?.firstName ||
                      (isFr ? "Mon Sanctuaire" : "My Sanctuary")}
                  </span>
                </Link>
                <button
                  type="button"
                  id="nav-sign-out-btn"
                  onClick={() => signOut()}
                  className="text-xs font-semibold text-[#5E5470] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white transition-colors cursor-pointer px-2 py-1"
                >
                  {t("nav_sign_out")}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="nav-sign-in"
                  id="nav-sign-in-btn"
                >
                  {t("nav_sign_in")}
                </Link>
                <Link
                  href="/sign-up"
                  className="pill-button pill-dark"
                  id="nav-begin-journey-btn"
                >
                  {t("nav_start_devotion")}
                </Link>
              </>
            )}
          </div>

          <button
            className={`mobile-menu-button ${
              mobileMenuOpen ? "menu-open" : ""
            }`}
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={t(mobileMenuOpen ? "nav_close" : "nav_menu")}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <b>{t(mobileMenuOpen ? "nav_close" : "nav_menu")}</b>
          </button>
        </nav>

        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/25 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              className="mobile-navigation page-shell"
              id="mobile-navigation"
              role="dialog"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#2d2542]/10 mb-2">
                <span className="text-xs font-semibold text-[#6a6078]">
                  {isFr ? "Langue :" : "Language:"}
                </span>
                <LanguageToggle />
              </div>

              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">{t("mobile_nav_devotion")}</p>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{isFr ? "Sanctuaire Quotidien" : "Daily Sanctuary"}</span>
                  <span className="text-xs text-[#8c8297]">
                    {isFr ? "Application" : "Workspace"}
                  </span>
                </Link>
                <a
                  href="#features"
                  className={activeSection === "features" ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("nav_daily_practice")}</span>
                  <span className="text-xs text-[#8c8297]">5 mins</span>
                </a>
                <a
                  href="#how-it-works"
                  className={
                    activeSection === "how-it-works" ? "active-link" : ""
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("nav_how_it_works")}</span>
                  <span className="text-xs text-[#8c8297]">
                    3 {isFr ? "étapes" : "steps"}
                  </span>
                </a>
                <a
                  href="#journeys"
                  className={activeSection === "journeys" ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("nav_journeys")}</span>
                  <span className="text-xs text-[#8c8297]">
                    {isFr ? "Thématiques" : "Topical"}
                  </span>
                </a>
              </div>

              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">
                  {t("mobile_nav_scripture_audio")}
                </p>
                <Link
                  href="/voice"
                  className={activeSection === "voice" ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("nav_voice_search")}</span>
                  <span className="text-xs text-[#8c8297]">
                    {isFr ? "Instantané" : "Instant"}
                  </span>
                </Link>
                <Link
                  href="/living-word"
                  className={
                    activeSection === "living-word" ? "active-link" : ""
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("nav_audio_teachings")}</span>
                  <span className="text-xs text-[#8c8297]">10 mins</span>
                </Link>
              </div>

              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">
                  {t("mobile_nav_community_help")}
                </p>
                <Link
                  href="/teachers"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>
                    {isFr ? "Pasteurs & Enseignants" : "Teachers & Pastors"}
                  </span>
                </Link>
                <Link
                  href="/progress"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("nav_my_progress")}</span>
                  <span className="text-xs text-[#8c8297]">
                    {isFr ? "Suivi" : "Track"}
                  </span>
                </Link>
                <a
                  href="#questions"
                  className={activeSection === "questions" ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("nav_faq")}</span>
                </a>
              </div>

              {isSignedIn ? (
                <div className="mobile-account flex flex-col gap-2 pt-2 border-t border-[#2d2542]/10 w-full">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-semibold text-[#2d2542] flex items-center gap-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#2d2542] text-[#fbfaf7] flex items-center justify-center text-[10px] font-bold">
                        {user?.avatarInitial || "LB"}
                      </span>
                      <span>
                        {user?.fullName ||
                          (isFr
                            ? "Mon Tableau de Bord"
                            : "My Sanctuary Dashboard")}{" "}
                        →
                      </span>
                    </Link>
                    <VisualStreakCounter variant="compact" />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      className="text-xs text-[#776e82] hover:text-[#1e1931]"
                    >
                      {t("nav_sign_out")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#2d2542]/10 w-full">
                  <Link
                    href="/sign-in"
                    className="nav-sign-in w-full text-center py-2.5 block text-[#2d2542] hover:text-[#1e1931] border border-[#2d2542]/15 rounded-full"
                    id="mobile-sign-in-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav_sign_in")}
                  </Link>
                  <Link
                    href="/sign-up"
                    className="mobile-join w-full text-center block"
                    id="mobile-begin-journey-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav_start_devotion")}
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      <section className="showcase-hero" id="top">
        <div className="showcase-hero-grid page-shell">
          <div className="showcase-hero-copy">
            <p className="showcase-eyebrow">
              {isFr ? "Le sanctuaire quotidien" : "The 5-minute sanctuary"}
            </p>
            <h1>
              {isFr ? "Une prière quotidienne" : "A quiet place for"}
              <em>
                {isFr ? " simple, biblique et vraie" : "Scripture, prayer, and real growth"}
              </em>
            </h1>
            <p>
              {isFr
                ? "LifeBook vous aide à méditer la Parole, à apporter vos vraies préoccupations dans la prière et à grandir grâce à des enseignements bibliques."
                : "LifeBook helps you sit with Scripture, bring real concerns into prayer, and grow through biblical teaching and community."}
            </p>

            <div className="mt-6 mb-6 grid max-w-md gap-2 text-sm text-[#3D354E] dark:text-[#E2DCEF]">
              <div className="flex items-center gap-2">
                <span className="text-[#2D2542]">•</span>
                <span>
                  <strong>{isFr ? "Quelques minutes" : "A few minutes"}</strong>
                  {isFr ? " pour lire, réfléchir et prier" : " to read, reflect, and pray"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1D8A5F]">•</span>
                <span>
                  <strong>{isFr ? "À votre choix" : "Your choice"}</strong>
                  {isFr ? " pour enregistrer vos prières" : " whether to save a prayer"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#B36A3C]">•</span>
                <span>
                  <strong>{isFr ? "Ancré dans l'Écriture" : "Scripture first"}</strong>
                  {isFr ? " avec la référence toujours visible" : " with the source always visible"}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#4E4462] dark:text-[#C8C2D6] mb-4 font-medium">
              {isFr
                ? "Gratuit pour commencer · Aucune carte bancaire requise · Conçu pour la vie réelle"
                : "Free to start · No credit card required · Built for real life"}
            </p>

            <div className="showcase-actions flex-wrap gap-3">
              {isSignedIn ? (
                <Link
                  className="pill-button pill-dark"
                  href="/dashboard"
                  id="hero-continue-journey-btn"
                >
                  <span>
                    {isFr
                      ? "Ouvrir mon sanctuaire"
                      : "Open My Sanctuary"}
                  </span>
                  <ArrowUpRightIcon />
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className="pill-button pill-dark"
                  id="hero-begin-journey-btn"
                >
                  <span>{t("hero_cta_start")}</span>
                  <ArrowUpRightIcon />
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsRitualModalOpen(true)}
                className="pill-button pill-light cursor-pointer"
                id="hero-preview-journey-btn"
              >
                <span>
                  {isFr
                    ? "Essayer le rituel 5 min"
                    : "Try the 5-Min Ritual"}
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full pt-1">
                <PWAInstallButton />
                <CloudSyncBadge />
              </div>

              <span className="rating-note w-full sm:w-auto">
                <b>
                  {isFr ? "Source biblique" : "Scripture source"}:
                </b>
                <br />
                <small>
                  {isFr
                    ? "Collection approuvée · Référence affichée"
                    : "Approved collection · Source shown"}
                </small>
              </span>
            </div>
          </div>

          <div className="preview-stage-container w-full max-w-[480px] mx-auto">
            <PhoneMockup />
          </div>
        </div>

        <a
          href="#how-it-works"
          className="hero-scroll page-shell cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-3"
          aria-label={t("hero_scroll")}
        >
          <span>{t("hero_scroll")}</span>
          <i />
        </a>
      </section>

      <section className="benefits-section page-shell" id="features" data-reveal>
        <div className="section-heading">
          <div>
            <p className="showcase-eyebrow">
              {isFr ? "Conçu pour la vie réelle" : "Built for real life"}
            </p>
            <h2>
              {isFr
                ? "Un horaire de prière qui tient compte de votre semaine."
                : "A faith rhythm that meets your week where it is."}
              <em>
                {isFr
                  ? " Sans culpabilité. Sans surcharge."
                  : " No guilt. No overload."}
              </em>
            </h2>
          </div>

          <div>
            <p>
              {isFr
                ? "Trois façons complémentaires de rester près de la Parole : une pratique quotidienne, un espace de prière personnel et des enseignements à explorer."
                : "Three connected ways to stay close to the Word: a daily practice, a personal prayer space, and teaching to explore."}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4">
              <li>
                <strong>{isFr ? "Un rythme simple" : "A simple rhythm"}</strong>{" "}
                {isFr
                  ? "pour lire, réfléchir et prier"
                  : "to read, reflect, and pray"}
              </li>
              <li>
                <strong>{isFr ? "Prière personnelle" : "Personal prayer"}</strong>{" "}
                {isFr
                  ? "avec historique facultatif"
                  : "with optional private history"}
              </li>
              <li>
                <strong>{isFr ? "Écriture visible" : "Visible Scripture"}</strong>{" "}
                {isFr
                  ? "pour garder la source au centre"
                  : "to keep the source at the center"}
              </li>
            </ul>
          </div>
        </div>

        <div className="benefit-grid">
          {benefits.map((item, idx) => (
            <article
              key={item.title}
              className={`benefit-card ${item.tone} cursor-pointer`}
              data-reveal
              style={{ transitionDelay: `${idx * 90}ms` }}
              onClick={() => {
                setSelectedStep(idx);
                const el = document.getElementById("how-it-works");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="benefit-icon">
                {renderBenefitIcon(item.iconType)}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="benefit-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works" data-reveal>
        <div className="page-shell">
          <div className="how-heading">
            <p className="showcase-eyebrow">{t("how_eyebrow")}</p>
            <h2>{t("how_heading")}</h2>
            <p>{t("how_sub")}</p>
          </div>

          <div className="how-grid">
            <div
              className="step-list"
              role="tablist"
              aria-label={
                isFr
                  ? "Étapes de la routine du matin"
                  : "Morning routine steps"
              }
            >
              {steps.map(([title, desc], idx) => (
                <div
                  key={title}
                  className={`how-step ${
                    idx === selectedStep ? "selected-step" : ""
                  }`}
                  onClick={() => setSelectedStep(idx)}
                  role="tab"
                  tabIndex={0}
                  aria-selected={idx === selectedStep}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedStep(idx);
                    }
                  }}
                >
                  <span className="tabular-nums">0{idx + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                  <b aria-hidden="true">↗</b>
                </div>
              ))}
            </div>

            <div className="scripture-preview" aria-live="polite">
              <div className="scripture-top flex items-center justify-between gap-2 flex-wrap">
                <span>{isFr ? "Lecture du jour" : "Today's Reading"}</span>
                <div className="flex items-center gap-2">
                  {!isFr && selectedStep === 0 && (
                    <div className="inline-flex items-center gap-1 bg-white/10 rounded-md p-0.5">
                      {(["ESV", "NIV", "KJV"] as const).map((tr) => (
                        <button
                          key={tr}
                          type="button"
                          onClick={() => setSelectedTranslation(tr)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                            selectedTranslation === tr
                              ? "bg-white text-[#1E1931] font-bold"
                              : "text-white/75 hover:text-white"
                          }`}
                        >
                          {tr}
                        </button>
                      ))}
                    </div>
                  )}
                  <span>{stepCards[selectedStep].label}</span>
                </div>
              </div>

              <div className="scripture-art">
                <span>“</span>
                <p className="whitespace-pre-line">
                  {stepCards[selectedStep].quote}
                </p>
                <small>{stepCards[selectedStep].ref}</small>
              </div>

              <div className="scripture-bottom flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedStep(0)}
                  className={`cursor-pointer transition-colors whitespace-nowrap ${
                    selectedStep === 0
                      ? "text-white font-bold underline"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t("phase_read")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStep(1)}
                  className={`cursor-pointer transition-colors whitespace-nowrap ${
                    selectedStep === 1
                      ? "text-white font-bold underline"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t("phase_reflect")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStep(2)}
                  className={`cursor-pointer transition-colors whitespace-nowrap ${
                    selectedStep === 2
                      ? "text-white font-bold underline"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t("phase_pray")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isReadingStepAloud) {
                      stopHumanVoice();
                      setIsReadingStepAloud(false);
                    } else {
                      setIsReadingStepAloud(true);
                      void speakWithHumanVoice({
                        text: `${stepCards[selectedStep].quote.replace(/\n/g, " ")} ${stepCards[selectedStep].ref}`,
                        isFrFallback: isFr,
                        onEnd: () => setIsReadingStepAloud(false),
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  {isReadingStepAloud ? (
                    <Stop size={13} weight="fill" />
                  ) : (
                    <SpeakerHigh size={13} weight="duotone" />
                  )}
                  <span>
                    {isReadingStepAloud
                      ? isFr
                        ? "Arrêter"
                        : "Stop Audio"
                      : isFr
                      ? "Écouter"
                      : "Listen Aloud"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRitualModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1FB6B0] text-[#081C1B] text-xs font-bold hover:bg-[#199E99] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isFr ? "Démarrer ↗" : "Start Ritual ↗"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="journeys-section page-shell" id="journeys" data-reveal>
        <div className="journey-panel">
          <div className="journey-panel-art">
            <span className="journey-orbit" />
            <span className="journey-sun" aria-hidden="true">
              <Compass size={24} weight="duotone" />
            </span>
            <b className="tabular-nums">05</b>
            <small>
              {isFr
                ? "jours pour\nfinir un parcours"
                : "days to\ncomplete each track"}
            </small>
          </div>

          <div className="journey-panel-copy">
            <p className="showcase-eyebrow">{t("journeys_eyebrow")}</p>
            <h2>
              {isFr
                ? "Terminez une étude biblique de 5 jours sans jamais décrocher."
                : "Finish a 5-day topical study without falling behind."}
            </h2>
            <p>
              {isFr
                ? "Traitez les défis concrets de la vie en séries courtes de 5 jours plutôt que dans des plans de 6 mois qu'on abandonne après deux semaines."
                : "Tackle real-world challenges in short 5-day sprints instead of 6-month commitments you abandon after week two."}
            </p>

            {/* Interactive 5-Day Curriculum Selector */}
            <div className="my-5 p-4 rounded-2xl bg-[#FBFAF7] dark:bg-[#141024] border border-[#2D2542]/10 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {studyTracks.map((track, idx) => (
                  <button
                    key={track.title}
                    type="button"
                    onClick={() => setSelectedTrackIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedTrackIdx === idx
                        ? "bg-[#1E1931] dark:bg-[#4EE2D8] text-white dark:text-[#081C1B]"
                        : "text-[#4E4462] dark:text-[#C8C2D6] hover:bg-[#EDE7F6] dark:hover:bg-white/10"
                    }`}
                  >
                    0{idx + 1}. {track.title}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between text-xs text-[#5B4894] dark:text-[#4EE2D8] font-medium">
                  <span>{studyTracks[selectedTrackIdx].scripture}</span>
                  <span className="tabular-nums">{studyTracks[selectedTrackIdx].days}</span>
                </div>
                <p className="text-xs text-[#3F3750] dark:text-[#D5CEE6] m-0 leading-relaxed">
                  {studyTracks[selectedTrackIdx].summary}
                </p>
              </div>
            </div>

            <ul className="space-y-2 my-4 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4">
              <li>
                <strong>
                  {isFr ? "Allez jusqu'au bout :" : "Finish what you start:"}
                </strong>{" "}
                {isFr
                  ? "des parcours de 5 jours offrent une ligne d'arrivée claire et un vrai accomplissement"
                  : "5-day tracks give you a clear finish line and real sense of accomplishment"}
              </li>
              <li>
                <strong>
                  {isFr ? "Sujets ancrés dans la vie :" : "Relevant topics:"}
                </strong>{" "}
                {isFr
                  ? "études sur l'anxiété, les décisions pro, la patience et la famille"
                  : "studies focused on anxiety, career decisions, patience, and family relationships"}
              </li>
              <li>
                <strong>
                  {isFr ? "Applications concrètes :" : "Actionable takeaways:"}
                </strong>{" "}
                {isFr
                  ? "chaque parcours s'achève par un pas d'obéissance et de prière"
                  : "every track concludes with practical steps for daily obedience"}
              </li>
            </ul>
            <p className="text-xs text-[#5B4894] dark:text-[#4EE2D8] font-semibold mb-4">
              {isFr
                ? "Une courte pratique quotidienne · Reprenez à votre rythme"
                : "A short daily practice · Return at your own pace"}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="underlined-link" href="/dashboard">
                <span>
                  {isFr
                    ? "Ouvrir les parcours dans le Sanctuaire"
                    : "Open 5-day studies in Sanctuary"}
                </span>{" "}
                <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div data-reveal><VoicePractice /></div>

      <div data-reveal><LivingWord /></div>

      <section className="community-proof-section page-shell" data-reveal>
        <div>
          <p className="showcase-eyebrow">
            {isFr
              ? "Intégrité biblique et respect de la vie privée"
              : "Biblical integrity and privacy"}
          </p>
          <h2>
            {isFr ? "Lisez l'Écriture avec une " : "Read Scripture with "}
            <em>{isFr ? "totale confiance." : "absolute confidence."}</em>
          </h2>
        </div>

        <div className="proof-copy">
          <p>
            {isFr
              ? "La référence biblique apparaît à côté du passage; la méditation générée est clairement séparée du texte cité. Vos mots restent privés et leur enregistrement est facultatif."
              : "The Scripture reference appears beside the passage; generated meditation is clearly separated from quoted text. Your prayer stays private, and saving it is optional."}
          </p>
          <ul className="space-y-2 my-4 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4">
            <li>
              <strong>
                {isFr ? "Source affichée :" : "Visible source:"}
              </strong>{" "}
              {isFr
                ? "chaque passage guidé montre sa référence"
                : "each guided passage includes its reference"}
            </li>
            <li>
              <strong>
                {isFr ? "Historique facultatif :" : "Optional history:"}
              </strong>{" "}
              {isFr
                ? "enregistrez ou supprimez une prière depuis votre compte"
                : "save or delete a prayer from your account"}
            </li>
            <li>
              <strong>
                {isFr
                  ? "Zéro publicité :"
                  : "Zero ads or sponsored interruptions:"}
              </strong>{" "}
              {isFr
                ? "ni bannières, ni popups intrusifs, ni suivi publicitaire"
                : "no banners, popups, or tracking algorithms"}
            </li>
          </ul>
          <div className="proof-note">
            <strong>
              {isFr
                ? "Texte et méditation distingués"
                : "Scripture and reflection distinguished"}
            </strong>
            <small>
              {isFr
                ? "La référence reste visible; la méditation générée est identifiée séparément."
                : "The source stays visible; generated meditation is labeled separately."}
            </small>
          </div>
          <Link className="underlined-link" href="/sign-up">
            <span>
              {isFr
                ? "Créer mon compte gratuit"
                : "Create your free account"}
            </span>{" "}
            <ArrowUpRightIcon />
          </Link>
        </div>
      </section>

      <section className="team-section page-shell" data-reveal>
        <div className="team-heading">
          <p className="showcase-eyebrow">
            {isFr ? "Une source claire" : "A clear source"}
          </p>
          <h2>
              {isFr
                ? "La Parole au centre, la réflexion en "
                : "Scripture at the center, reflection in "}
            <em>
              {isFr ? "complément." : "its place."}
            </em>
          </h2>
          <p>
              {isFr
                ? "Les passages cités proviennent d'une collection approuvée. Le texte biblique et la méditation générée ne sont jamais confondus."
                : "Quoted passages come from an approved collection. Scripture text and generated meditation are never presented as the same thing."}
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4 text-left max-w-md mx-auto">
            <li>
              <strong>
                {isFr ? "Référence visible :" : "Visible reference:"}
              </strong>{" "}
              {isFr
                ? "le passage cité peut être consulté à sa source"
                : "the quoted passage can be checked at its source"}
            </li>
            <li>
              <strong>
                {isFr ? "Réflexion distincte :" : "Distinct reflection:"}
              </strong>{" "}
              {isFr
                ? "les textes générés sont présentés comme des aides à la réflexion"
                : "generated text is presented as reflection guidance"}
            </li>
          </ul>
          <div className="partner-path">
            <span>{isFr ? "Enseignants et équipes de ministère" : "For teachers and ministry teams"}</span>
            <Link href="/teachers">{isFr ? "Explorer les contributeurs" : "Explore teaching contributors"} <ArrowUpRightIcon /></Link>
          </div>
        </div>

        <div className="team-portraits">
          <div>
            <Image
              src="/AsketOfficialPic (1).png"
              alt="Pastor Asket, teaching contributor"
              width={180}
              height={220}
            />
            <span>
              Pastor Asket ·{" "}
              {isFr
                ? "Contributeur d'enseignement"
                : "Teaching contributor"}
            </span>
          </div>
          <div>
            <Image
              src="/myself.jpeg"
              alt="LifeBook contributor"
              width={180}
              height={220}
            />
            <span>
              {isFr
                ? "Contributeur éditorial et pastoral"
                : "Editorial and Pastoral contributor"}
            </span>
          </div>
        </div>
      </section>

      <section className="questions-section page-shell" id="questions" data-reveal>
        <div className="questions-heading">
          <p className="showcase-eyebrow">{t("faq_eyebrow")}</p>
          <h2>{t("faq_heading")}</h2>
          <span className="question-mark" aria-hidden="true">?</span>
        </div>

        <div
          className="faq-list"
          role="region"
          aria-label={
            isFr ? "Foire aux questions" : "Frequently asked questions list"
          }
        >
          {faqList.map(([question, answer], idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={question}
                className={`faq-row ${isOpen ? "faq-open" : ""}`}
              >
                <button
                  type="button"
                  id={`faq-btn-${idx}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                >
                  <span>{question}</span>
                  <b aria-hidden="true">{isOpen ? "−" : "+"}</b>
                </button>
                {isOpen && (
                  <p
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-btn-${idx}`}
                  >
                    {answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="closing-section" id="join" data-reveal>
        <div className="closing-band page-shell">
          <div>
            <p className="showcase-eyebrow">{t("cta_eyebrow")}</p>
            <h2>{t("cta_heading")}</h2>
          </div>

          <div className="closing-form">
            <p>{t("cta_desc")}</p>
            <p className="text-xs text-[#D5CEE6] font-medium mb-3">
              {isFr
                ? "Sans spam · Sans carte bancaire · Désinscription en un clic à tout moment"
                : "No spam · No credit card · Unsubscribe in one click anytime"}
            </p>

            {submitted ? (
              <div className="success-message">
                <span>{t("cta_success")}</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) {
                    setSubmitted(true);
                    router.push("/sign-up");
                  }
                }}
              >
                <label htmlFor="email">{t("cta_placeholder")}</label>
                <div>
                  <input
                    id="email"
                    type="email"
                    placeholder={
                      isFr ? "nom@exemple.com" : "name@example.com"
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" aria-label={t("cta_button")}>
                    <ArrowUpRightIcon />
                  </button>
                </div>
              </form>
            )}
            <small>{t("cta_note")}</small>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell">
          <div className="footer-lead">
            <a
              className="footer-logo"
              href="#top"
              aria-label="LifeBook home"
            >
              <Image
                src="/logol.png"
                alt="LifeBook"
                width={78}
                height={78}
                unoptimized
              />
            </a>
            <p>
              {isFr
                ? "« Approchez-vous de Dieu, et il s'approchera de vous. »"
                : "“Draw near to God, and he will draw near to you.”"}
              <small>
                {isFr ? "Jacques 4:8 (LSG)" : "James 4:8 (ESV)"}
              </small>
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-column">
              <h3>{t("nav_daily_practice")}</h3>
              <Link href="/dashboard">
                {isFr ? "Sanctuaire Quotidien" : "Daily Sanctuary"}
              </Link>
              <a href="#how-it-works">
                {isFr ? "Routine en 3 étapes" : "3-Step Routine"}
              </a>
              <a href="#journeys">{t("nav_journeys")}</a>
              <Link href="/voice">{t("nav_voice_search")}</Link>
            </div>

            <div className="footer-column">
              <h3>{isFr ? "Étudier et grandir" : "Study and Grow"}</h3>
              <Link href="/living-word">{t("nav_audio_teachings")}</Link>
              <Link href="/progress">
                {isFr ? "Suivi d'habitude" : "Habit Tracker"}
              </Link>
              <a href="#questions">{t("nav_faq")}</a>
              <a href="#join">
                {isFr ? "Méditation par e-mail" : "Email Devotional"}
              </a>
            </div>

            <div className="footer-column">
              <h3>{isFr ? "Communauté" : "Community"}</h3>
              <Link href="/progress">
                {isFr ? "Journal de prière" : "Prayer Journal"}
              </Link>
              <Link href="/teachers">
                {isFr ? "Pasteurs & Enseignants" : "Teachers & Pastors"}
              </Link>
              <a href="#questions">
                {isFr ? "Questions pastorales" : "Pastoral Questions"}
              </a>
              <Link href="/waitlist">
                {isFr ? "Groupes d'étude" : "Study Cohorts"}
              </Link>
            </div>

            <div className="footer-column">
              <h3>
                {isFr ? "Confiance et vie privée" : "Trust and Privacy"}
              </h3>
              <span className="footer-note">
                {isFr
                  ? "Interface en français et en anglais. Les références bibliques restent visibles; l'enregistrement des prières est facultatif."
                  : "English and French interface. Scripture references stay visible; saving prayers is optional."}
              </span>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 LifeBook</span>
            <span>{t("footer_copyright")}</span>
            <div>
              <Link href="/privacy">{t("footer_privacy")}</Link>
              <a href="#top">{t("footer_terms")}</a>
              <a href="#top">
                {isFr ? "Accessibilité" : "Accessibility"}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {isScrolled && (isSignedIn ? (
        <Link
          className="sticky-mobile-cta"
          href="/dashboard"
          id="sticky-continue-journey-btn"
        >
          <span>{isFr ? "Ouvrir mon sanctuaire" : "Open My Sanctuary"}</span>{" "}
          <ArrowUpRightIcon />
        </Link>
      ) : (
        <Link
          href="/sign-up"
          className="sticky-mobile-cta"
          id="sticky-begin-journey-btn"
        >
          <span>{t("nav_start_devotion")}</span> <ArrowUpRightIcon />
        </Link>
      ))}

      {isScrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="hidden md:flex fixed right-6 bottom-6 z-40 items-center justify-center w-11 h-11 rounded-full bg-[#1e1931] text-[#fbfaf7] shadow-lg hover:bg-[#34294f] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#fbfaf7]/15 text-sm font-bold"
          aria-label={t("footer_back_to_top")}
          title={t("footer_back_to_top")}
        >
          ↑
        </button>
      )}

      <DailyRitualModal
        isOpen={isRitualModalOpen}
        onClose={() => setIsRitualModalOpen(false)}
      />
    </main>
  );
}
