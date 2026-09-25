"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useChristianAuth } from "@/lib/christian-auth";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import PhoneMockup from "@/components/PhoneMockup";
import { VisualStreakCounter } from "@/components/VisualStreakCounter";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import LivingWord from "./LivingWord";
import VoicePractice from "./VoicePractice";

function ArrowIcon() { return <span aria-hidden="true">↗</span>; }
function Mark() { return <span className="brand-logo" aria-hidden="true"><Image src="/logol.png" alt="" fill unoptimized /></span>; }

export default function Home() {
  const { isFr, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [activeStep, setActiveStep] = useState(0);
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const router = useRouter();
  const { user, isSignedIn, signOut } = useChristianAuth();

  const benefits = useMemo(() => isFr ? [
    {
      title: "Lire le verset du jour sans chercher",
      text: "Ouvrez l'application et trouvez le passage du jour prêt dans votre version préférée (Louis Segond, Semeur, etc.). Zéro recherche superflue.",
      tone: "benefit-lilac",
      icon: "📖",
    },
    {
      title: "Prier avec des questions guidées",
      text: "Répondez à trois questions concrètes basées sur la lecture du matin pour ancrer la vérité biblique dans vos actions quotidiennes.",
      tone: "benefit-blue",
      icon: "✍️",
    },
    {
      title: "Garder votre habitude sans culpabilité",
      text: "Une journée chargée ? Le repos du sabbat et la protection de grâce préservent votre élan spirituel sans jamais remettre votre série à zéro.",
      tone: "benefit-mint",
      icon: "🌿",
    },
  ] : [
    {
      title: "Read today's verse without searching",
      text: "Open the app and find today's curated passage ready in your preferred translation (ESV, NIV, CSB, KJV, NLT). Zero flipping or guessing.",
      tone: "benefit-lilac",
      icon: "📖",
    },
    {
      title: "Pray with guided reflection prompts",
      text: "Answer three short, practical questions based on the morning reading to turn biblical truth into real-world action.",
      tone: "benefit-blue",
      icon: "✍️",
    },
    {
      title: "Keep your habit without guilt",
      text: "Missed a hectic day? Sabbath rest and grace protection keep your spiritual rhythm alive without resetting your streak to zero.",
      tone: "benefit-mint",
      icon: "🌿",
    },
  ], [isFr]);

  const steps = useMemo(() => isFr ? [
    ["Lire le passage quotidien", "Prenez 90 secondes pour lire un texte biblique ciblé avec son contexte historique vérifié."],
    ["Répondre à 3 questions de réflexion", "Passez 2 minutes à relier le verset à votre travail, votre famille et vos défis."],
    ["Enregistrer une prière de 60 secondes", "Clôturez votre recueillement par une prière sincère conservée en toute intimité sur votre appareil."],
  ] : [
    ["Read the daily passage", "Take 90 seconds to read one focused Scripture text with verified historical context."],
    ["Answer 3 reflection prompts", "Spend 2 minutes applying the verse directly to your work, family, and relationships."],
    ["Record a 60-second prayer", "Close your quiet time with an honest prayer stored privately on your device."],
  ], [isFr]);

  const stepCards = useMemo(() => isFr ? [
    {
      step: "01",
      label: "Étape 01 / 03 · Lire",
      quote: "Il restaure\nmon âme.",
      ref: "Psaume 23:3 (Louis Segond)",
      phase: "Lire (90s)",
    },
    {
      step: "02",
      label: "Étape 02 / 03 · Méditer",
      quote: "Où avez-vous besoin de\nla paix de Dieu aujourd'hui ?",
      ref: "Question 01 sur 03",
      phase: "Méditer (2m)",
    },
    {
      step: "03",
      label: "Étape 03 / 03 · Prier",
      quote: "« Seigneur, guide mes pas\net apaise mes inquiétudes. »",
      ref: "Sauvegardé sur l'appareil",
      phase: "Prier (60s)",
    },
  ] : [
    {
      step: "01",
      label: "Step 01 / 03 · Read",
      quote: "He restores\nmy soul.",
      ref: "Psalm 23:3 (ESV)",
      phase: "Read (90s)",
    },
    {
      step: "02",
      label: "Step 02 / 03 · Reflect",
      quote: "Where do you need\nGod's peace today?",
      ref: "Prompt 01 of 03",
      phase: "Reflect (2m)",
    },
    {
      step: "03",
      label: "Step 03 / 03 · Pray",
      quote: "“Lord, guide my steps\nand quiet my worry.”",
      ref: "Saved securely on device",
      phase: "Pray (60s)",
    },
  ], [isFr]);

  const faqs = useMemo(() => isFr ? [
    ["Combien de temps prend chaque méditation ?", "Exactement 5 minutes. Vous lisez un passage clé (90 secondes), répondez à trois questions de réflexion (2 minutes) et enregistrez une prière privée (90 secondes)."],
    ["Que se passe-t-il si je manque un jour ?", "Vous n'êtes jamais pénalisé. LifeBook intègre le repos du sabbat et la protection de grâce pour préserver votre élan spirituel."],
    ["Quelles versions de la Bible sont proposées ?", "LifeBook propose la version Louis Segond (LSG) et la Bible du Semeur en français, ainsi que ESV, NIV, CSB, KJV et NLT en anglais."],
    ["Mes prières et notes restent-elles privées ?", "Oui. Vos réflexions et prières restent exclusivement stockées sur votre appareil avec un chiffrement local."],
  ] : [
    ["How much time does each devotion take?", "Exactly 5 minutes. You read one key passage (90 seconds), answer three reflection prompts (2 minutes), and record a private prayer (90 seconds)."],
    ["What happens if I miss a day?", "You never get penalized. LifeBook includes built-in Sabbath rest and grace protection, so your momentum stays intact when life gets busy."],
    ["Which Bible translations do you provide?", "LifeBook includes the English Standard Version (ESV), New International Version (NIV), Christian Standard Bible (CSB), King James Version (KJV), and New Living Translation (NLT), as well as Louis Segond (LSG) in French."],
    ["Are my prayers and notes kept private?", "Yes. Your journal entries and prayers remain securely stored on your own device with local encryption. We never sell your data or serve third-party ads."],
  ], [isFr]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sectionIds = ["top", "features", "how-it-works", "journey-preview", "journeys", "voice", "living-word", "questions", "join"];
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) {
      setJoined(true);
      router.push("/thank-you");
    }
  }

  return (
    <main className="showcase-page">
      <header className={`sticky-nav-header ${scrolled ? "header-scrolled" : ""}`}>
        <nav className="showcase-nav page-shell" aria-label="Main navigation">
          <a className="wordmark" href="#top" aria-label="LifeBook home"><Mark /><span>LifeBook</span></a>
          <div className="showcase-links">
            <a href="#features" className={activeSection === "features" ? "active-link" : ""}>{t("nav_daily_practice")}</a>
            <a href="#journeys" className={activeSection === "journeys" ? "active-link" : ""}>{t("nav_journeys")}</a>
            <Link href="/living-word" className={activeSection === "living-word" ? "active-link" : ""}>{t("nav_audio_teachings")}</Link>
            <Link href="/voice" className={activeSection === "voice" ? "active-link" : ""}>{t("nav_voice_search")}</Link>
          </div>
          <div className="auth-actions flex items-center gap-2.5">
            <LanguageToggle />
            <ThemeToggle />
            {isSignedIn ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/progress"
                  id="user-profile-nav-pill"
                  className="pill-button pill-dark"
                  title={isFr ? "Voir vos progrès et séries" : "View your devotional progress and streaks"}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 text- currentColor flex items-center justify-center text-[11px] font-bold">
                    {user?.avatarInitial || "LB"}
                  </span>
                  <span>{user?.firstName || (isFr ? "Mon Sanctuaire" : "My Sanctuary")}</span>
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
                <Link href="/sign-in" className="nav-sign-in" id="nav-sign-in-btn">
                  {t("nav_sign_in")}
                </Link>
                <Link href="/sign-up" className="pill-button pill-dark" id="nav-begin-journey-btn">
                  {t("nav_start_devotion")}
                </Link>
              </>
            )}
          </div>
          <button
            className={`mobile-menu-button ${menuOpen ? "menu-open" : ""}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? t("nav_close") : t("nav_menu")}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <b>{menuOpen ? t("nav_close") : t("nav_menu")}</b>
          </button>
        </nav>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/25 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="mobile-navigation page-shell" id="mobile-navigation" role="dialog" aria-label="Navigation menu">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#2d2542]/10 mb-2">
                <span className="text-xs font-semibold text-[#6a6078]">{isFr ? "Langue :" : "Language:"}</span>
                <LanguageToggle />
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#2d2542]/10 mb-2">
                <span className="text-xs font-semibold text-[#6a6078]">{isFr ? "Thème nuit HD :" : "Night Mode:"}</span>
                <ThemeToggle variant="segmented" showLabel showIndicator={false} />
              </div>
              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">{t("mobile_nav_devotion")}</p>
                <a href="#features" className={activeSection === "features" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_daily_practice")}</span>
                  <span className="text-xs text-[#8c8297]">5 mins</span>
                </a>
                <a href="#how-it-works" className={activeSection === "how-it-works" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_how_it_works")}</span>
                  <span className="text-xs text-[#8c8297]">3 {isFr ? "étapes" : "steps"}</span>
                </a>
                <a href="#journeys" className={activeSection === "journeys" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_journeys")}</span>
                  <span className="text-xs text-[#8c8297]">{isFr ? "Thématiques" : "Topical"}</span>
                </a>
              </div>
              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">{t("mobile_nav_scripture_audio")}</p>
                <Link href="/voice" className={activeSection === "voice" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_voice_search")}</span>
                  <span className="text-xs text-[#8c8297]">{isFr ? "Instantané" : "Instant"}</span>
                </Link>
                <Link href="/living-word" className={activeSection === "living-word" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_audio_teachings")}</span>
                  <span className="text-xs text-[#8c8297]">10 mins</span>
                </Link>
              </div>
              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">{t("mobile_nav_community_help")}</p>
                <Link href="/waitlist" onClick={() => setMenuOpen(false)}>
                  <span>{isFr ? "Cohortes & Liste d'attente" : "Waitlist Cohorts"}</span>
                </Link>
                <Link href="/progress" onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_my_progress")}</span>
                  <span className="text-xs text-[#8c8297]">{isFr ? "Suivi" : "Track"}</span>
                </Link>
                <a href="#questions" className={activeSection === "questions" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_faq")}</span>
                </a>
              </div>
              {isSignedIn ? (
                <div className="mobile-account flex flex-col gap-2 pt-2 border-t border-[#2d2542]/10 w-full">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/progress"
                      onClick={() => setMenuOpen(false)}
                      className="text-xs font-semibold text-[#2d2542] flex items-center gap-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#2d2542] text-[#fbfaf7] flex items-center justify-center text-[10px] font-bold">
                        {user?.avatarInitial || "LB"}
                      </span>
                      <span>{user?.fullName || (isFr ? "Mes Progrès et Séries" : "My Progress and Streaks")} →</span>
                    </Link>
                    <VisualStreakCounter variant="compact" />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
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
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav_sign_in")}
                  </Link>
                  <Link
                    href="/sign-up"
                    className="mobile-join w-full text-center block"
                    id="mobile-begin-journey-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav_start_devotion")} ↗
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
            <p className="showcase-eyebrow">{t("hero_eyebrow")}</p>
            <h1>
              {t("hero_title_part1")}
              <em>{t("hero_title_em")}</em>
              {t("hero_title_part2")}
            </h1>
            <p>{t("hero_desc")}</p>

            <ul className="space-y-2.5 mb-6 text-sm text-[#3D354E] dark:text-[#E2DCEF]">
              <li className="flex items-start gap-2.5">
                <span className="text-[#1FB6B0] font-bold shrink-0">✓</span>
                <span>
                  <strong>{isFr ? "Directement sur le verset du jour :" : "Open directly to today's verse:"}</strong>{" "}
                  {isFr ? "aucun temps perdu à chercher dans de longs plans" : "zero flipping through long reading plans"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#1FB6B0] font-bold shrink-0">✓</span>
                <span>
                  <strong>{isFr ? "Prières authentiques :" : "Write honest prayers:"}</strong>{" "}
                  {isFr ? "sauvegardées en toute sécurité et intimité sur votre appareil" : "saved securely and privately on your device"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#1FB6B0] font-bold shrink-0">✓</span>
                <span>
                  <strong>{isFr ? "Pas de découragement :" : "Never lose momentum:"}</strong>{" "}
                  {isFr ? "des jours de grâce intégrés protègent votre régularité" : "built-in grace days protect your consistency when life gets busy"}
                </span>
              </li>
            </ul>

            <p className="text-xs text-[#4E4462] dark:text-[#C8C2D6] mb-4 font-medium">
              {isFr
                ? "Gratuit pour commencer · Aucune carte bancaire requise · Zéro engagement lourd"
                : "Free to start · No credit card required · No 50-chapter commitments"}
            </p>

            <div className="showcase-actions flex-wrap gap-3">
              {isSignedIn ? (
                <Link className="pill-button pill-dark" href="/progress" id="hero-continue-journey-btn">
                  {isFr ? "Continuer votre méditation" : "Continue your 5-minute devotion"} <ArrowIcon />
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className="pill-button pill-dark"
                  id="hero-begin-journey-btn"
                >
                  {t("hero_cta_start")} <ArrowIcon />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setIsRitualModalOpen(true)}
                className="pill-button pill-light cursor-pointer"
                id="hero-preview-journey-btn"
              >
                <span>✦</span>
                <span>{isFr ? "Pratiquer le rituel 5-min maintenant" : "Try 5-Min Guided Ritual Now"}</span>
              </button>
              <span className="rating-note w-full sm:w-auto">
                <b>{isFr ? "Versions bibliques" : "5 verified translations"}:</b><br />
                <small>{isFr ? "Louis Segond (LSG), Semeur, ESV, NIV, KJV · Sans publicité" : "ESV, NIV, CSB, KJV, NLT · 100% ad-free"}</small>
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

      <section className="benefits-section page-shell" id="features">
        <div className="section-heading">
          <div>
            <p className="showcase-eyebrow">{isFr ? "Pratique quotidienne essentielle" : "Core daily practice"}</p>
            <h2>
              {isFr
                ? "Remplacez les matinées dispersées par un "
                : "Replace distracted mornings with a "}
              <em>{isFr ? "moment de recueillement en 3 étapes." : "focused 3-step quiet time."}</em>
            </h2>
          </div>
          <div>
            <p>
              {isFr
                ? "Beaucoup de croyants désirent lire la Bible chaque matin, mais se heurtent à des plannings surchargés. LifeBook vous propose un rythme simple et apaisant que vous achèverez chaque jour."
                : "Most Christians want to read the Bible daily, but struggle with busy schedules and long reading plans. LifeBook gives you a simple, repeatable morning routine you will actually finish."}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4">
              <li>
                <strong>{isFr ? "S'intègre à votre café :" : "Fits into your morning coffee:"}</strong>{" "}
                {isFr ? "exactement 5 minutes du début à la fin" : "exactly 5 minutes from start to finish"}
              </li>
              <li>
                <strong>{isFr ? "Zéro préparation requise :" : "Zero preparation needed:"}</strong>{" "}
                {isFr ? "passage, question de méditation et prière prêts à votre réveil" : "Scripture, reflection, and prayer prompt ready when you wake up"}
              </li>
              <li>
                <strong>{isFr ? "Régularité bienveillante :" : "Guilt-free consistency:"}</strong>{" "}
                {isFr ? "des jours de grâce sauvent votre série en cas d'imprévu" : "grace days protect your streak when unexpected emergencies hit"}
              </li>
            </ul>
          </div>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article className={`benefit-card ${benefit.tone}`} key={benefit.title}>
              <span className="benefit-icon">{benefit.icon}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
              <span className="benefit-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="page-shell">
          <div className="how-heading">
            <p className="showcase-eyebrow">{t("how_eyebrow")}</p>
            <h2>{t("how_heading")}</h2>
            <p>{t("how_sub")}</p>
          </div>
          <div className="how-grid">
            <div className="step-list" role="tablist" aria-label={isFr ? "Étapes de la routine du matin" : "Morning routine steps"}>
              {steps.map(([title, text], index) => (
                <div
                  className={`how-step ${index === activeStep ? "selected-step" : ""}`}
                  key={title}
                  onClick={() => setActiveStep(index)}
                  role="tab"
                  tabIndex={0}
                  aria-selected={index === activeStep}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStep(index);
                    }
                  }}
                >
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <b aria-hidden="true">↗</b>
                </div>
              ))}
            </div>
            <div className="scripture-preview" aria-live="polite">
              <div className="scripture-top">
                <span>{isFr ? "Lecture du jour" : "Today's Reading"}</span>
                <span>{stepCards[activeStep].label}</span>
              </div>
              <div className="scripture-art">
                <span>“</span>
                <p style={{ whiteSpace: "pre-line" }}>{stepCards[activeStep].quote}</p>
                <small>{stepCards[activeStep].ref}</small>
              </div>
              <div className="scripture-bottom flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className={`cursor-pointer transition-colors ${activeStep === 0 ? "text-white font-bold underline" : "text-white/60 hover:text-white"}`}
                >
                  {t("phase_read")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`cursor-pointer transition-colors ${activeStep === 1 ? "text-white font-bold underline" : "text-white/60 hover:text-white"}`}
                >
                  {t("phase_reflect")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className={`cursor-pointer transition-colors ${activeStep === 2 ? "text-white font-bold underline" : "text-white/60 hover:text-white"}`}
                >
                  {t("phase_pray")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRitualModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#1FB6B0] text-[#081C1B] text-xs font-bold hover:bg-[#199E99] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isFr ? "Démarrer ↗" : "Start Ritual ↗"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="journeys-section page-shell" id="journeys">
        <div className="journey-panel">
          <div className="journey-panel-art">
            <span className="journey-orbit" />
            <span className="journey-sun">✦</span>
            <b>05</b>
            <small>{isFr ? "jours pour\nfinir un parcours" : "days to\ncomplete each track"}</small>
          </div>
          <div className="journey-panel-copy">
            <p className="showcase-eyebrow">{t("journeys_eyebrow")}</p>
            <h2>{isFr ? "Terminez une étude biblique de 5 jours sans jamais décrocher." : "Finish a 5-day topical study without falling behind."}</h2>
            <p>{isFr ? "Traitez les défis concrets de la vie en séries courtes de 5 jours plutôt que dans des plans de 6 mois qu'on abandonne après deux semaines." : "Tackle real-world challenges in short 5-day sprints instead of 6-month commitments you abandon after week two."}</p>
            <ul className="space-y-2 my-4 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4">
              <li>
                <strong>{isFr ? "Allez jusqu'au bout :" : "Finish what you start:"}</strong>{" "}
                {isFr ? "des parcours de 5 jours offrent une ligne d'arrivée claire et un vrai accomplissement" : "5-day tracks give you a clear finish line and real sense of accomplishment"}
              </li>
              <li>
                <strong>{isFr ? "Sujets ancrés dans la vie :" : "Relevant topics:"}</strong>{" "}
                {isFr ? "études sur l'anxiété, les décisions pro, la patience et la famille" : "studies focused on anxiety, career decisions, patience, and family relationships"}
              </li>
              <li>
                <strong>{isFr ? "Applications concrètes :" : "Actionable takeaways:"}</strong>{" "}
                {isFr ? "chaque parcours s'achève par un pas d'obéissance et de prière" : "every track concludes with practical steps for daily obedience"}
              </li>
            </ul>
            <p className="text-xs text-[#5B4894] dark:text-[#4EE2D8] font-semibold mb-4">
              {isFr ? "5 minutes par jour · Commencez ou suspendez à tout moment sans pénalité" : "Takes 5 minutes per day · Start or pause anytime without penalty"}
            </p>
            <Link className="underlined-link" href="/sign-up">
              {isFr ? "Découvrir les parcours thématiques" : "Browse 5-day topical studies"} <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <VoicePractice />

      <LivingWord />

      <section className="community-proof-section page-shell">
        <div>
          <p className="showcase-eyebrow">{isFr ? "Intégrité biblique et respect de la vie privée" : "Biblical integrity and privacy"}</p>
          <h2>
            {isFr ? "Lisez l'Écriture avec une " : "Read Scripture with "}
            <em>{isFr ? "totale confiance." : "absolute confidence."}</em>
          </h2>
        </div>
        <div className="proof-copy">
          <p>
            {isFr
              ? "LifeBook repose sur un ancrage théologique fidèle, une stricte confidentialité des données et l'absence totale de régies publicitaires pour que votre recueillement reste centré sur Dieu."
              : "LifeBook is built with orthodox theological grounding, strict data privacy, and zero ad networks so your quiet time stays focused on God."}
          </p>
          <ul className="space-y-2 my-4 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4">
            <li>
              <strong>{isFr ? "Traductions reconnues :" : "5 major translations:"}</strong>{" "}
              {isFr ? "lisez et comparez en Louis Segond (LSG), Semeur, ESV, NIV, KJV" : "read and compare passages in ESV, NIV, CSB, KJV, and NLT"}
            </li>
            <li>
              <strong>{isFr ? "Chiffrement local :" : "Local device encryption:"}</strong>{" "}
              {isFr ? "vos prières et notes privées ne quittent jamais votre appareil" : "your private prayers and journal notes stay on your phone"}
            </li>
            <li>
              <strong>{isFr ? "Zéro publicité :" : "Zero ads or sponsored interruptions:"}</strong>{" "}
              {isFr ? "ni bannières, ni popups intrusifs, ni suivi publicitaire" : "no banners, popups, or tracking algorithms"}
            </li>
          </ul>
          <div className="proof-note">
            <span>✦</span>
            <strong>{isFr ? "Enraciné dans la Parole vérifiée" : "Grounded in verified Scripture"}</strong>
            <small>{isFr ? "Chaque passage quotidien est remis dans le contexte de son chapitre." : "Every daily passage is paired with verified chapter context."}</small>
          </div>
          <Link className="underlined-link" href="/sign-up">
            {isFr ? "Créer mon compte gratuit" : "Create your free account"} <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className="team-section page-shell">
        <div className="team-heading">
          <p className="showcase-eyebrow">{isFr ? "Engagement pastoral" : "Biblical stewardship"}</p>
          <h2>
            {isFr ? "Porté par le soin pastoral et un " : "Rooted in pastoral care and "}
            <em>{isFr ? "enseignement fidèle." : "faithful teaching."}</em>
          </h2>
          <p>
            {isFr
              ? "LifeBook est conçu et relu par des pasteurs et enseignants engagés pour une doctrine solide et une vie de disciple pratique."
              : "LifeBook is curated and reviewed by pastors and biblical educators committed to sound doctrine and practical discipleship."}
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4 text-left max-w-md mx-auto">
            <li>
              <strong>{isFr ? "Veille pastorale :" : "Pastoral oversight:"}</strong>{" "}
              {isFr ? "enseignements vérifiés pour leur justesse biblique et leur sensibilité humaine" : "teachings checked for doctrinal clarity and pastoral sensitivity"}
            </li>
            <li>
              <strong>{isFr ? "Centré sur Christ :" : "Christ-centered focus:"}</strong>{" "}
              {isFr ? "chaque méditation mène du texte à la prière et à l'obéissance concrète" : "every devotional moves from Scripture to prayerful obedience"}
            </li>
          </ul>
        </div>
        <div className="team-portraits">
          <div>
            <Image src="/AsketOfficialPic (1).png" alt="Pastor Asket, teaching contributor" width={180} height={220} />
            <span>Pastor Asket · {isFr ? "Contributeur d'enseignement" : "Teaching contributor"}</span>
          </div>
          <div>
            <Image src="/myself.jpeg" alt="LifeBook contributor" width={180} height={220} />
            <span>{isFr ? "Contributeur éditorial et pastoral" : "Editorial and Pastoral contributor"}</span>
          </div>
        </div>
      </section>

      <section className="questions-section page-shell" id="questions">
        <div className="questions-heading">
          <p className="showcase-eyebrow">{t("faq_eyebrow")}</p>
          <h2>{t("faq_heading")}</h2>
          <span className="question-mark">?</span>
        </div>
        <div className="faq-list" role="region" aria-label={isFr ? "Foire aux questions" : "Frequently asked questions list"}>
          {faqs.map(([question, answer], index) => {
            const isOpen = openFaq === index;
            return (
              <div className={`faq-row ${isOpen ? "faq-open" : ""}`} key={question}>
                <button
                  type="button"
                  id={`faq-btn-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                >
                  <span>{question}</span>
                  <b aria-hidden="true">{isOpen ? "−" : "+"}</b>
                </button>
                {isOpen && (
                  <p id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-btn-${index}`}>
                    {answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="closing-section" id="join">
        <div className="closing-band page-shell">
          <div>
            <p className="showcase-eyebrow">{t("cta_eyebrow")}</p>
            <h2>{t("cta_heading")}</h2>
          </div>
          <div className="closing-form">
            <p>{t("cta_desc")}</p>
            <p className="text-xs text-[#D5CEE6] font-medium mb-3">
              {isFr ? "Sans spam · Sans carte bancaire · Désinscription en un clic à tout moment" : "No spam · No credit card · Unsubscribe in one click anytime"}
            </p>
            {joined ? (
              <div className="success-message">{t("cta_success")} <span>✦</span></div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="email">{t("cta_placeholder")}</label>
                <div>
                  <input
                    id="email"
                    type="email"
                    placeholder={isFr ? "nom@exemple.com" : "name@example.com"}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <button type="submit" aria-label={t("cta_button")}>
                    <ArrowIcon />
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
            <a className="footer-logo" href="#top" aria-label="LifeBook home">
              <Image src="/logol.png" alt="LifeBook" width={78} height={78} unoptimized />
            </a>
            <p>
              {isFr
                ? "« Approchez-vous de Dieu, et il s'approchera de vous. »"
                : "“Draw near to God, and he will draw near to you.”"}
              <small>{isFr ? "Jacques 4:8 (LSG)" : "James 4:8 (ESV)"}</small>
            </p>
          </div>
          <div className="footer-nav">
            <div className="footer-column">
              <h3>{t("nav_daily_practice")}</h3>
              <a href="#features">{isFr ? "Verset du jour" : "Today's Scripture"}</a>
              <a href="#how-it-works">{isFr ? "Routine en 3 étapes" : "3-Step Routine"}</a>
              <a href="#journeys">{t("nav_journeys")}</a>
              <Link href="/voice">{t("nav_voice_search")}</Link>
            </div>
            <div className="footer-column">
              <h3>{isFr ? "Étudier et grandir" : "Study and Grow"}</h3>
              <Link href="/living-word">{t("nav_audio_teachings")}</Link>
              <Link href="/progress">{isFr ? "Suivi d'habitude" : "Habit Tracker"}</Link>
              <a href="#questions">{t("nav_faq")}</a>
              <a href="#join">{isFr ? "Méditation par e-mail" : "Email Devotional"}</a>
            </div>
            <div className="footer-column">
              <h3>{isFr ? "Communauté" : "Community"}</h3>
              <Link href="/progress">{isFr ? "Journal de prière" : "Prayer Journal"}</Link>
              <a href="#questions">{isFr ? "Questions pastorales" : "Pastoral Questions"}</a>
              <Link href="/moderation">{isFr ? "Normes de modération" : "Moderation Standards"}</Link>
              <Link href="/analytics">{isFr ? "Télémétrie & Habitude" : "Funnel & Habit Telemetry"}</Link>
            </div>
            <div className="footer-column">
              <h3>{isFr ? "Confiance et vie privée" : "Trust and Privacy"}</h3>
              <span className="footer-note">
                {isFr
                  ? "Bilingue Français & Anglais. Versions LSG, Semeur, ESV, NIV. Sauvegarde locale privée."
                  : "Bilingual English & French. Versions ESV, NIV, CSB, KJV, LSG. Private local device storage."}
              </span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 LifeBook</span>
            <span>{t("footer_copyright")}</span>
            <div>
              <Link href="/privacy">{t("footer_privacy")}</Link>
              <a href="#top">{t("footer_terms")}</a>
              <a href="#top">{isFr ? "Accessibilité" : "Accessibility"}</a>
            </div>
          </div>
        </div>
      </footer>

      {isSignedIn ? (
        <Link className="sticky-mobile-cta" href="/progress" id="sticky-continue-journey-btn">
          {isFr ? "Continuer la méditation (5 min)" : "Continue 5-minute devotion"} <ArrowIcon />
        </Link>
      ) : (
        <Link
          href="/sign-up"
          className="sticky-mobile-cta"
          id="sticky-begin-journey-btn"
        >
          {t("nav_start_devotion")} <ArrowIcon />
        </Link>
      )}

      {scrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="hidden md:flex fixed right-6 bottom-6 z-40 items-center justify-center w-11 h-11 rounded-full bg-[#1e1931] text-[#fbfaf7] shadow-lg hover:bg-[#34294f] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#fbfaf7]/15"
          aria-label={t("footer_back_to_top")}
          title={t("footer_back_to_top")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      <DailyRitualModal
        isOpen={isRitualModalOpen}
        onClose={() => setIsRitualModalOpen(false)}
      />
    </main>
  );
}
