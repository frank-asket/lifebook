"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChristianAuth } from "@/lib/christian-auth";
import LivingWord from "./LivingWord";
import VoicePractice from "./VoicePractice";

const benefits = [
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
];

const steps = [
  ["Read the daily passage", "Take 90 seconds to read one focused Scripture text with verified historical context."],
  ["Answer 3 reflection prompts", "Spend 2 minutes applying the verse directly to your work, family, and relationships."],
  ["Record a 60-second prayer", "Close your quiet time with an honest prayer stored privately on your device."],
];

const stepCards = [
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
];

const moodScriptures: Record<string, { mood: string; quote: string; ref: string }> = {
  peace: {
    mood: "Peaceful",
    quote: "“The Lord is my shepherd; I shall not want.”",
    ref: "Psalm 23:1 (ESV)",
  },
  seek: {
    mood: "Seeking",
    quote: "“If any of you lacks wisdom, you should ask God, who gives generously.”",
    ref: "James 1:5 (ESV)",
  },
  grateful: {
    mood: "Grateful",
    quote: "“Give thanks in all circumstances; for this is God's will in Christ.”",
    ref: "1 Thessalonians 5:18 (ESV)",
  },
  doubt: {
    mood: "Questions",
    quote: "“Cast all your anxiety on him because he cares for you.”",
    ref: "1 Peter 5:7 (ESV)",
  },
};

const faqs = [
  ["How much time does each devotion take?", "Exactly 5 minutes. You read one key passage (90 seconds), answer three reflection prompts (2 minutes), and record a private prayer (90 seconds)."],
  ["What happens if I miss a day?", "You never get penalized. LifeBook includes built-in Sabbath rest and grace protection, so your momentum stays intact when life gets busy."],
  ["Which Bible translations do you provide?", "LifeBook includes the English Standard Version (ESV), New International Version (NIV), Christian Standard Bible (CSB), King James Version (KJV), and New Living Translation (NLT)."],
  ["Are my prayers and notes kept private?", "Yes. Your journal entries and prayers remain securely stored on your own device with local encryption. We never sell your data or serve third-party ads."],
];

function ArrowIcon() { return <span aria-hidden="true">↗</span>; }
function Mark() { return <span className="brand-logo" aria-hidden="true"><Image src="/logol.png" alt="" fill unoptimized /></span>; }

export default function Home() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [selectedMood, setSelectedMood] = useState<"peace" | "seek" | "grateful" | "doubt">("peace");
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();
  const { user, isSignedIn, signOut } = useChristianAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sectionIds = ["top", "features", "how-it-works", "journeys", "voice", "living-word", "questions", "join"];
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
            <a href="#features" className={activeSection === "features" ? "active-link" : ""}>Daily Practice</a>
            <a href="#how-it-works" className={activeSection === "how-it-works" ? "active-link" : ""}>How It Works</a>
            <a href="#journeys" className={activeSection === "journeys" ? "active-link" : ""}>5-Day Studies</a>
            <Link href="/voice" className={activeSection === "voice" ? "active-link" : ""}>Voice Search</Link>
            <Link href="/living-word" className={activeSection === "living-word" ? "active-link" : ""}>Audio Teachings</Link>
            <Link href="/progress">My Progress</Link>
            <a href="#questions" className={activeSection === "questions" ? "active-link" : ""}>FAQ</a>
          </div>
          <div className="auth-actions">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/progress"
                  id="user-profile-nav-pill"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EADBFC] hover:bg-[#F2ECE1] transition-colors text-xs font-semibold text-[#2A2146]"
                  title="View your devotional progress and streaks"
                >
                  <span className="w-6 h-6 rounded-full bg-[#2A2146] text-white flex items-center justify-center text-xs font-bold">
                    {user?.avatarInitial || "LB"}
                  </span>
                  <span>{user?.firstName || "Pilgrim"}</span>
                </Link>
                <button
                  type="button"
                  id="nav-sign-out-btn"
                  onClick={() => signOut()}
                  className="text-xs text-[#8A7E9F] hover:text-[#2A2146] transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/sign-in" className="nav-sign-in" id="nav-sign-in-btn">
                  Sign in
                </Link>
                <Link href="/sign-up" className="pill-button pill-dark" id="nav-begin-journey-btn">
                  Start 5-minute devotion
                </Link>
              </>
            )}
          </div>
          <button
            className={`mobile-menu-button ${menuOpen ? "menu-open" : ""}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <b>{menuOpen ? "Close" : "Menu"}</b>
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
              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">Daily Devotion</p>
                <a href="#features" className={activeSection === "features" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>Daily Practice</span>
                  <span className="text-xs text-[#8c8297]">5 mins</span>
                </a>
                <a href="#how-it-works" className={activeSection === "how-it-works" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>How It Works</span>
                  <span className="text-xs text-[#8c8297]">3 steps</span>
                </a>
                <a href="#journeys" className={activeSection === "journeys" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>5-Day Studies</span>
                  <span className="text-xs text-[#8c8297]">Topical</span>
                </a>
              </div>
              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">Scripture & Audio</p>
                <Link href="/voice" className={activeSection === "voice" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>Voice Scripture Search</span>
                  <span className="text-xs text-[#8c8297]">Instant</span>
                </Link>
                <Link href="/living-word" className={activeSection === "living-word" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>Audio Bible Teachings</span>
                  <span className="text-xs text-[#8c8297]">10 mins</span>
                </Link>
              </div>
              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">Community & Help</p>
                <Link href="/progress" onClick={() => setMenuOpen(false)}>
                  <span>My Progress & Streaks</span>
                  <span className="text-xs text-[#8c8297]">Track</span>
                </Link>
                <a href="#questions" className={activeSection === "questions" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
                  <span>Frequently Asked Questions</span>
                  <span className="text-xs text-[#8c8297]">FAQ</span>
                </a>
              </div>
              {isSignedIn ? (
                <div className="mobile-account flex items-center justify-between pt-2 border-t border-[#2d2542]/10 w-full">
                  <Link
                    href="/progress"
                    onClick={() => setMenuOpen(false)}
                    className="text-xs font-semibold text-[#2d2542] flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#2d2542] text-[#fbfaf7] flex items-center justify-center text-[10px] font-bold">
                      {user?.avatarInitial || "LB"}
                    </span>
                    <span>{user?.fullName || "My Progress and Streaks"} →</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="text-xs text-[#776e82] hover:text-[#1e1931]"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#2d2542]/10 w-full">
                  <Link
                    href="/sign-in"
                    className="nav-sign-in w-full text-center py-2.5 block text-[#2d2542] hover:text-[#1e1931] border border-[#2d2542]/15 rounded-full"
                    id="mobile-sign-in-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="mobile-join w-full text-center block"
                    id="mobile-begin-journey-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    Start 5-minute devotion ↗
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
            <p className="showcase-eyebrow">Daily 5-minute quiet time</p>
            <h1>Build a steady daily Bible and prayer habit in <em>5 minutes a day.</em></h1>
            <p>Get one daily Scripture passage, three practical reflection prompts, and a private prayer journal delivered every morning.</p>

            <ul className="space-y-2 mb-6 text-sm text-[#463B5D]">
              <li className="flex items-start gap-2">
                <span className="text-[#705EAA] font-bold shrink-0">✓</span>
                <span><strong>Open directly to today&apos;s verse:</strong> zero flipping through long reading plans</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#705EAA] font-bold shrink-0">✓</span>
                <span><strong>Write honest prayers:</strong> saved securely and privately on your device</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#705EAA] font-bold shrink-0">✓</span>
                <span><strong>Never lose momentum:</strong> built-in grace days protect your consistency when life gets busy</span>
              </li>
            </ul>

            <p className="text-xs text-[#5D5276] mb-3 font-medium">
              Free to start. No credit card required. No 50-chapter commitments.
            </p>

            <div className="showcase-actions">
              {isSignedIn ? (
                <Link className="pill-button pill-dark" href="/progress" id="hero-continue-journey-btn">
                  Continue your 5-minute devotion <ArrowIcon />
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className="pill-button pill-dark"
                  id="hero-begin-journey-btn"
                >
                  Start today&apos;s 5-minute devotion <ArrowIcon />
                </Link>
              )}
              <span className="rating-note">
                <b>5</b> verified translations<br />
                <small>ESV, NIV, CSB, KJV, NLT · 100% ad-free</small>
              </span>
            </div>
          </div>
          <div className="preview-stage" aria-label="LifeBook app preview">
            <div className="preview-glow" />
            <div className="preview-card preview-card-back">
              <span>Current 5-day study</span>
              <strong>Peace in Busy Workdays</strong>
              <small>Day 3 of 5 completed</small>
              <div className="progress-track"><i /></div>
            </div>
            <div className="preview-phone">
              <div className="preview-status"><span>9:41</span><span>•••</span></div>
              <div className="preview-heading">
                <small>Good morning</small>
                <strong>Today&apos;s 5-minute devotion</strong>
              </div>
              <div className="preview-moods" role="group" aria-label="Devotional mood selection">
                <button
                  type="button"
                  onClick={() => setSelectedMood("peace")}
                  className={`mood-peace ${selectedMood === "peace" ? "active-mood" : ""}`}
                  aria-pressed={selectedMood === "peace"}
                  title="Choose Peaceful quiet time"
                >
                  <span>◌</span>
                  <b>Peaceful</b>
                  <small>Anchor in God&apos;s rest</small>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMood("seek")}
                  className={`mood-seek ${selectedMood === "seek" ? "active-mood" : ""}`}
                  aria-pressed={selectedMood === "seek"}
                  title="Choose Seeking quiet time"
                >
                  <span>⌕</span>
                  <b>Seeking</b>
                  <small>Wisdom for decisions</small>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMood("grateful")}
                  className={`mood-grateful ${selectedMood === "grateful" ? "active-mood" : ""}`}
                  aria-pressed={selectedMood === "grateful"}
                  title="Choose Grateful quiet time"
                >
                  <span>✦</span>
                  <b>Grateful</b>
                  <small>Give thanks today</small>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMood("doubt")}
                  className={`mood-doubt ${selectedMood === "doubt" ? "active-mood" : ""}`}
                  aria-pressed={selectedMood === "doubt"}
                  title="Choose Questions quiet time"
                >
                  <span>?</span>
                  <b>Questions</b>
                  <small>Bring honest burdens</small>
                </button>
              </div>
              <div className="preview-tabbar">
                <span>Today</span>
                <span>Studies</span>
                <b>Practice</b>
                <span>Journal</span>
              </div>
            </div>
            <div className="preview-card preview-card-front" aria-live="polite">
              <b>Today&apos;s Scripture ({moodScriptures[selectedMood].mood})</b>
              <p>{moodScriptures[selectedMood].quote}</p>
              <small>{moodScriptures[selectedMood].ref}</small>
            </div>
          </div>
        </div>
        <a
          href="#how-it-works"
          className="hero-scroll page-shell cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-3"
          aria-label="See how the 5-minute morning devotion works"
        >
          <span>See how it works</span>
          <i />
        </a>
      </section>

      <section className="benefits-section page-shell" id="features">
        <div className="section-heading">
          <div>
            <p className="showcase-eyebrow">Core daily practice</p>
            <h2>Replace distracted mornings with a <em>focused 3-step quiet time.</em></h2>
          </div>
          <div>
            <p>Most Christians want to read the Bible daily, but struggle with busy schedules and long reading plans. LifeBook gives you a simple, repeatable morning routine you will actually finish.</p>
            <ul className="mt-4 space-y-1 text-xs text-[#5D5276] list-disc pl-4">
              <li><strong>Fits into your morning coffee:</strong> exactly 5 minutes from start to finish</li>
              <li><strong>Zero preparation needed:</strong> Scripture, reflection, and prayer prompt ready when you wake up</li>
              <li><strong>Guilt-free consistency:</strong> grace days protect your streak when unexpected emergencies hit</li>
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
            <p className="showcase-eyebrow">Your 5-minute morning routine</p>
            <h2>How your 5-minute devotion works.</h2>
            <p>Three straightforward steps designed to give you clarity and peace before your workday begins.</p>
          </div>
          <div className="how-grid">
            <div className="step-list" role="tablist" aria-label="Morning routine steps">
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
                <span>Today&apos;s Reading</span>
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
                  Read (90s)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`cursor-pointer transition-colors ${activeStep === 1 ? "text-white font-bold underline" : "text-white/60 hover:text-white"}`}
                >
                  Reflect (2m)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className={`cursor-pointer transition-colors ${activeStep === 2 ? "text-white font-bold underline" : "text-white/60 hover:text-white"}`}
                >
                  Pray (60s)
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
            <small>days to<br />complete each track</small>
          </div>
          <div className="journey-panel-copy">
            <p className="showcase-eyebrow">Topical Bible studies</p>
            <h2>Finish a 5-day topical study without falling behind.</h2>
            <p>Tackle real-world challenges in short 5-day sprints instead of 6-month commitments you abandon after week two.</p>
            <ul className="space-y-2 my-4 text-xs text-[#5D5276] list-disc pl-4">
              <li><strong>Finish what you start:</strong> 5-day tracks give you a clear finish line and real sense of accomplishment</li>
              <li><strong>Relevant topics:</strong> studies focused on anxiety, career decisions, patience, and family relationships</li>
              <li><strong>Actionable takeaways:</strong> every track concludes with practical steps for daily obedience</li>
            </ul>
            <p className="text-xs text-[#705EAA] font-semibold mb-3">
              Takes 5 minutes per day. Start or pause anytime without penalty.
            </p>
            <Link className="underlined-link" href="/sign-up">
              Browse 5-day topical studies <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <VoicePractice />

      <LivingWord />

      <section className="community-proof-section page-shell">
        <div>
          <p className="showcase-eyebrow">Biblical integrity and privacy</p>
          <h2>Read Scripture with <em>absolute confidence.</em></h2>
        </div>
        <div className="proof-copy">
          <p>LifeBook is built with orthodox theological grounding, strict data privacy, and zero ad networks so your quiet time stays focused on God.</p>
          <ul className="space-y-2 my-4 text-xs text-[#5D5276] list-disc pl-4">
            <li><strong>5 major translations:</strong> read and compare passages in ESV, NIV, CSB, KJV, and NLT</li>
            <li><strong>Local device encryption:</strong> your private prayers and journal notes stay on your phone</li>
            <li><strong>Zero ads or sponsored interruptions:</strong> no banners, popups, or tracking algorithms</li>
          </ul>
          <div className="proof-note">
            <span>✦</span>
            <strong>Grounded in verified Scripture</strong>
            <small>Every daily passage is paired with verified chapter context.</small>
          </div>
          <Link className="underlined-link" href="/sign-up">
            Create your free account <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className="team-section page-shell">
        <div className="team-heading">
          <p className="showcase-eyebrow">Biblical stewardship</p>
          <h2>Rooted in pastoral care and <em>faithful teaching.</em></h2>
          <p>LifeBook is curated and reviewed by pastors and biblical educators committed to sound doctrine and practical discipleship.</p>
          <ul className="mt-4 space-y-1 text-xs text-[#5D5276] list-disc pl-4 text-left max-w-md mx-auto">
            <li><strong>Pastoral oversight:</strong> teachings checked for doctrinal clarity and pastoral sensitivity</li>
            <li><strong>Christ-centered focus:</strong> every devotional moves from Scripture to prayerful obedience</li>
          </ul>
        </div>
        <div className="team-portraits">
          <div>
            <Image src="/AsketOfficialPic (1).png" alt="Pastor Asket, teaching contributor" width={180} height={220} />
            <span>Pastor Asket · Teaching contributor</span>
          </div>
          <div>
            <Image src="/myself.jpeg" alt="LifeBook contributor" width={180} height={220} />
            <span>Editorial and Pastoral contributor</span>
          </div>
        </div>
      </section>

      <section className="questions-section page-shell" id="questions">
        <div className="questions-heading">
          <p className="showcase-eyebrow">Frequently asked questions</p>
          <h2>Common questions before you start.</h2>
          <span className="question-mark">?</span>
        </div>
        <div className="faq-list" role="region" aria-label="Frequently asked questions list">
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
            <p className="showcase-eyebrow">Get started in 30 seconds</p>
            <h2>Start tomorrow morning with Scripture in <em>under 5 minutes.</em></h2>
          </div>
          <div className="closing-form">
            <p>Enter your email to receive tomorrow morning&apos;s devotional, reflection prompts, and prayer guide directly in your inbox.</p>
            <p className="text-xs text-[#6B5E82] font-medium mb-3">
              No spam. No credit card. Unsubscribe in one click anytime.
            </p>
            {joined ? (
              <div className="success-message">You are registered. Your first 5-minute devotional arrives tomorrow morning. <span>✦</span></div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="email">Your email address</label>
                <div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <button type="submit" aria-label="Send me tomorrow's devotional">
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            )}
            <small>Free daily devotional guide · Join over 500 daily readers</small>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell">
          <div className="footer-lead">
            <a className="footer-logo" href="#top" aria-label="LifeBook home">
              <Image src="/logol.png" alt="LifeBook" width={78} height={78} unoptimized />
            </a>
            <p>“Draw near to God, and he will draw near to you.”<small>James 4:8 (ESV)</small></p>
          </div>
          <div className="footer-nav">
            <div className="footer-column">
              <h3>Daily Practice</h3>
              <a href="#features">Today&apos;s Scripture</a>
              <a href="#how-it-works">3-Step Routine</a>
              <a href="#journeys">5-Day Studies</a>
              <Link href="/voice">Voice Search</Link>
            </div>
            <div className="footer-column">
              <h3>Study and Grow</h3>
              <Link href="/living-word">Audio Teachings</Link>
              <Link href="/progress">Habit Tracker</Link>
              <a href="#questions">FAQ</a>
              <a href="#join">Email Devotional</a>
            </div>
            <div className="footer-column">
              <h3>Community</h3>
              <Link href="/progress">Prayer Journal</Link>
              <a href="#questions">Pastoral Questions</a>
              <Link href="/moderation">Moderation Standards</Link>
            </div>
            <div className="footer-column">
              <h3>Trust and Privacy</h3>
              <span className="footer-note">5 verified translations (ESV, NIV, CSB, KJV, NLT). Private local device storage.</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 LifeBook</span>
            <span>Daily 5-minute Bible and prayer companion</span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <a href="#top">Terms</a>
              <a href="#top">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>

      {isSignedIn ? (
        <Link className="sticky-mobile-cta" href="/progress" id="sticky-continue-journey-btn">
          Continue 5-minute devotion <ArrowIcon />
        </Link>
      ) : (
        <Link
          href="/sign-up"
          className="sticky-mobile-cta"
          id="sticky-begin-journey-btn"
        >
          Start 5-minute devotion <ArrowIcon />
        </Link>
      )}

      {scrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed right-6 bottom-20 md:bottom-6 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-[#1e1931] text-[#fbfaf7] shadow-lg hover:bg-[#34294f] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#fbfaf7]/15"
          aria-label="Back to top"
          title="Back to top"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </main>
  );
}
