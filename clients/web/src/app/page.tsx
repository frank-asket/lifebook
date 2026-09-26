"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useChristianAuth } from "@/lib/christian-auth";
import { getDailyMeditation, BIBLE_CANON } from "@/lib/bible-canon";
import {
  getPreferredVoiceProfile,
  speakWithHumanVoice,
} from "@/lib/human-voices";

export default function HomePage() {
  const { language, setLanguage, t } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { isSignedIn, user, loginAsDemo } = useChristianAuth();
  const isFr = language === "fr";

  const [dailyMeditation, setDailyMeditation] = useState(() =>
    getDailyMeditation(0)
  );
  const [meditationIndex, setMeditationIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000
    );
    setMeditationIndex(dayOfYear);
    setDailyMeditation(getDailyMeditation(dayOfYear));
  }, []);

  const cycleDailyVerse = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    const nextIdx = meditationIndex + 1;
    setMeditationIndex(nextIdx);
    setDailyMeditation(getDailyMeditation(nextIdx));
  };

  const speakDailyVerse = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = isFr ? dailyMeditation.verse.fr : dailyMeditation.verse.en;
    const profile = getPreferredVoiceProfile(language);
    speakWithHumanVoice({
      text,
      profile,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const verseReference = isFr
    ? `${dailyMeditation.book.name.fr} ${dailyMeditation.chapter.chapter}:${dailyMeditation.verse.verse}`
    : `${dailyMeditation.book.name.en} ${dailyMeditation.chapter.chapter}:${dailyMeditation.verse.verse}`;

  const verseText = isFr ? dailyMeditation.verse.fr : dailyMeditation.verse.en;
  const meditationNote = isFr
    ? dailyMeditation.verse.meditation.fr
    : dailyMeditation.verse.meditation.en;

  const totalCanonChapters = BIBLE_CANON.reduce(
    (acc, b) => acc + b.totalChapters,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#12100E] text-stone-900 dark:text-stone-100">
      {/* Archival 3-Zone Header */}
      <header className="sticky top-0 z-30 border-b border-stone-300/80 dark:border-stone-800 bg-[#FAF8F5]/95 dark:bg-[#12100E]/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-stone-50 dark:text-stone-900 font-serif font-bold text-sm tracking-wider">
              LB
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-lg font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                LifeBook
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                {isFr ? "Sanctuaire & Canon" : "Sanctuary & Canon"}
              </span>
            </div>
          </Link>

          {/* Zone 2: Editorial Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-[0.14em] text-stone-600 dark:text-stone-400">
            <Link
              href="/living-word"
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              {isFr ? "I. Parole Vivante" : "I. Living Word"}
            </Link>
            <Link
              href="/teachers"
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              {isFr ? "II. Enseignants" : "II. Teachers Portal"}
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              {isFr ? "III. Sanctuaire" : "III. Sanctuary"}
            </Link>
          </nav>

          {/* Zone 3: Locale, Theme & Entry */}
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center border border-stone-300 dark:border-stone-800 rounded p-0.5 bg-[#F3EFE6] dark:bg-[#1C1917]">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 text-[11px] font-mono uppercase transition-colors cursor-pointer rounded-xs ${
                  language === "en"
                    ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`px-2 py-1 text-[11px] font-mono uppercase transition-colors cursor-pointer rounded-xs ${
                  language === "fr"
                    ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400"
                }`}
              >
                FR
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t("theme.toggle")}
              className="p-2 rounded border border-stone-300 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {resolvedTheme === "dark" ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded bg-amber-800 hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors"
              >
                {t("landing.openDashboard")}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="hidden sm:inline-block px-3 py-2 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 rounded bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-xs font-mono uppercase tracking-wider font-semibold transition-colors"
                >
                  {t("nav.signUp")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Editorial Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-14 lg:pt-14 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Editorial Manifesto & Primary Actions */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-3 border-b border-stone-300 dark:border-stone-800 pb-3">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-amber-900 dark:text-amber-400 font-semibold">
                  {isFr ? "ARCHIVE SPIRITUELLE BILINGUE" : "BILINGUAL SCRIPTURE & PASTORAL ARCHIVE"}
                </span>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <span className="font-mono text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                  66 {isFr ? "Livres" : "Books"} / {totalCanonChapters} {isFr ? "Chapitres" : "Chapters"}
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-serif font-bold tracking-tight leading-[1.08] text-stone-900 dark:text-stone-100">
                  {t("landing.heroTitle")}{" "}
                  <span className="italic font-normal text-amber-900 dark:text-amber-400">
                    {t("landing.heroTitleHighlight")}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                  {t("landing.heroSubtitle")}
                </p>
              </div>

              {/* Primary & Secondary Action Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="px-6 py-3.5 rounded bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-xs font-mono uppercase tracking-wider font-semibold transition-colors inline-flex items-center gap-2.5"
                  >
                    <span>
                      {isFr
                        ? `Entrer dans le Sanctuaire (${user?.firstName || "Pèlerin"})`
                        : `Enter Your Sanctuary (${user?.firstName || "Pilgrim"})`}
                    </span>
                    <span>→</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/sign-up"
                      className="px-6 py-3.5 rounded bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-xs font-mono uppercase tracking-wider font-semibold transition-colors inline-flex items-center gap-2"
                    >
                      <span>{t("landing.enterSanctuary")}</span>
                      <span>→</span>
                    </Link>

                    <button
                      type="button"
                      onClick={loginAsDemo}
                      className="px-5 py-3.5 rounded border border-stone-400 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-300 text-stone-800 dark:text-stone-200 text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                    >
                      {t("auth.demoLogin")}
                    </button>
                  </>
                )}

                <Link
                  href="/teachers"
                  className="px-5 py-3.5 rounded border border-amber-800/40 dark:border-amber-500/30 bg-amber-900/5 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 hover:bg-amber-900/10 text-xs font-mono uppercase tracking-wider font-semibold transition-colors"
                >
                  {isFr ? "Portail des Enseignants" : "Teachers Portal"}
                </Link>
              </div>

              {/* Architectural Ledger Metrics (Replacing Floating Pill Badges) */}
              <div className="grid grid-cols-3 border-t border-b border-stone-300 dark:border-stone-800 py-4 gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    {isFr ? "VOIX RÉGIONALES" : "REGIONAL VOICES"}
                  </p>
                  <p className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {isFr ? "Nigéria · Côte d'Ivoire · US" : "Nigerian · Ivorian · US"}
                  </p>
                </div>
                <div className="border-l border-stone-300 dark:border-stone-800 pl-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    {isFr ? "AUDIO PASTORAL" : "PASTORAL AUDIO"}
                  </p>
                  <p className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {isFr ? "WebRTC 1-à-1 & 40 Places" : "1-on-1 WebRTC & 40-Seat"}
                  </p>
                </div>
                <div className="border-l border-stone-300 dark:border-stone-800 pl-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    {isFr ? "ACCOMPAGNEMENT" : "ACOUSTIC WORSHIP"}
                  </p>
                  <p className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {isFr ? "6 Instrumentaux Sacrés" : "6 Sacred Instrumentals"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Curated Daily Scripture Ledger & Sanctuary Visual */}
            <div className="lg:col-span-5 space-y-5">
              {/* Illuminated Manuscript Hero Visual */}
              <div className="relative h-56 sm:h-64 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-800">
                <Image
                  src="/images/sanctuary-hero.png"
                  alt="Sanctuary Illuminated Scripture"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300 font-semibold">
                      {isFr ? "LECTURE CONTEMPLATIVE" : "DAILY CANONICAL READING"}
                    </p>
                    <p className="text-white font-serif text-lg font-bold">
                      {verseReference}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-stone-300 uppercase tracking-wider">
                    {isFr ? "Louis Segond 1910" : "King James Version"}
                  </span>
                </div>
              </div>

              {/* Daily Verse Interactive Reading Card */}
              <div className="p-6 rounded-lg bg-[#F3EFE6] dark:bg-[#1C1917] border border-stone-300 dark:border-stone-800 space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-stone-300/80 dark:border-stone-800 pb-3">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-amber-900 dark:text-amber-400 font-semibold">
                    {t("landing.dailyVerseLabel")} — {verseReference}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={speakDailyVerse}
                      className={`px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSpeaking
                          ? "bg-amber-800 text-white"
                          : "border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      <span>{isSpeaking ? (isFr ? "Arrêter" : "Stop") : (isFr ? "Écouter" : "Listen")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={cycleDailyVerse}
                      title={isFr ? "Autre verset" : "Another verse"}
                      className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                    >
                      {isFr ? "Suivant" : "Next"}
                    </button>
                  </div>
                </div>

                <blockquote className="text-lg sm:text-xl font-serif italic leading-relaxed text-stone-900 dark:text-stone-100">
                  &ldquo;{verseText}&rdquo;
                </blockquote>

                <div className="pt-3 border-t border-stone-300/70 dark:border-stone-800">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-1">
                    {t("scripture.meditationNote")}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {meditationNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four Editorial Pillars (Museum / Exhibition Catalog Layout) */}
        <section className="border-t border-stone-300 dark:border-stone-800 bg-[#F3EFE6]/60 dark:bg-[#171412] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-300 dark:border-stone-800 pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-900 dark:text-amber-400 font-semibold">
                  {isFr ? "ARCHITECTURE DU SANCTUAIRE" : "SANCTUARY ARCHITECTURE"}
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {isFr
                    ? "Quatre disciplines pour la vie intérieure"
                    : "Four Disciplines for the Contemplative Life"}
                </h2>
              </div>
              <Link
                href="/living-word"
                className="text-xs font-mono uppercase tracking-wider text-amber-900 dark:text-amber-400 hover:underline"
              >
                {isFr ? "Explorer les 66 livres →" : "Explore all 66 books →"}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Pillar I */}
              <div className="border-t-2 border-stone-900 dark:border-stone-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-bold text-amber-900 dark:text-amber-400">
                    I.
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
                    {isFr ? "Écriture & Voix" : "Scripture & Voice"}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                  {t("landing.feature1Title")}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t("landing.feature1Desc")}
                </p>
              </div>

              {/* Pillar II */}
              <div className="border-t-2 border-stone-900 dark:border-stone-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-bold text-amber-900 dark:text-amber-400">
                    II.
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
                    {isFr ? "Proclamation" : "Spoken Word"}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                  {t("landing.feature2Title")}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t("landing.feature2Desc")}
                </p>
              </div>

              {/* Pillar III */}
              <div className="border-t-2 border-stone-900 dark:border-stone-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-bold text-amber-900 dark:text-amber-400">
                    III.
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
                    {isFr ? "Archive & Prière" : "Prayer Ledger"}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                  {t("landing.feature3Title")}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t("landing.feature3Desc")}
                </p>
              </div>

              {/* Pillar IV */}
              <div className="border-t-2 border-stone-900 dark:border-stone-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-bold text-amber-900 dark:text-amber-400">
                    IV.
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
                    {isFr ? "Appel WebRTC 1-à-1" : "1-on-1 WebRTC Audio"}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                  {isFr
                    ? "Enseignants & Appels Pastoraux"
                    : "Teachers & Live Pastoral Calls"}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {isFr
                    ? "Écoutez des maîtres spirituels vérifiés et participez à des appels audio WebRTC 1-à-1 ou des salles de 40 places."
                    : "Listen to verified spiritual teachers and join teacher-initiated 1-on-1 WebRTC audio sessions or 40-seat live rooms."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Archival Footer */}
      <footer className="border-t border-stone-300 dark:border-stone-800 py-6 px-4 sm:px-8 bg-[#FAF8F5] dark:bg-[#12100E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
              LifeBook
            </span>
            <span>—</span>
            <span>{t("footer.tagline")}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/living-word" className="hover:text-stone-900 dark:hover:text-stone-100">
              {isFr ? "Parole Vivante" : "Living Word"}
            </Link>
            <Link href="/teachers" className="hover:text-stone-900 dark:hover:text-stone-100">
              {isFr ? "Enseignants" : "Teachers"}
            </Link>
            <Link href="/dashboard" className="hover:text-stone-900 dark:hover:text-stone-100">
              {isFr ? "Sanctuaire" : "Sanctuary"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
