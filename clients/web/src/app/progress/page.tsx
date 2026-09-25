"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProgressScreen from "../../components/ProgressScreen";
import { LanguageToggle } from "../../components/LanguageToggle";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useChristianAuth } from "@/lib/christian-auth";
import { useLanguage } from "@/lib/i18n";
import { VisualStreakCounter } from "@/components/VisualStreakCounter";

function Mark() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <Image src="/logol.png" alt="LifeBook" fill unoptimized />
    </span>
  );
}

export default function ProgressPage() {
  const { isFr, t } = useLanguage();
  const { user, isSignedIn, signOut } = useChristianAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="showcase-page min-h-screen">
      {/* Sticky Navigation Header matching landing page */}
      <header className={`sticky-nav-header ${scrolled ? "header-scrolled" : ""}`}>
        <nav className="showcase-nav page-shell" aria-label="Main navigation">
          <Link className="wordmark" href="/dashboard" aria-label="LifeBook Sanctuary Dashboard">
            <Mark />
            <span>LifeBook</span>
          </Link>

          <div className="showcase-links">
            <Link href="/dashboard">{isFr ? "Tableau de Bord" : "Dashboard"}</Link>
            <Link href="/living-word">{t("nav_audio_teachings")}</Link>
            <Link href="/voice">{t("nav_voice_search")}</Link>
            <Link href="/progress" className="active-link">
              {isFr ? "Progrès & Séries" : "Progress & Trends"}
            </Link>
          </div>

          <div className="auth-actions flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            {isSignedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <VisualStreakCounter variant="compact" />
                <div
                  id="user-profile-nav-pill"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#faf8f5] border border-[#eadbfc] text-xs font-semibold text-[#2a2146]"
                >
                  <span className="w-6 h-6 rounded-full bg-[#2a2146] text-white flex items-center justify-center text-xs font-bold">
                    {user?.avatarInitial || "LB"}
                  </span>
                  <span className="hidden sm:inline">{user?.firstName || (isFr ? "Pèlerin" : "Pilgrim")}</span>
                </div>
                <button
                  type="button"
                  id="nav-sign-out-btn"
                  onClick={() => signOut()}
                  className="text-xs text-[#8a7e9f] hover:text-[#2a2146] transition-colors cursor-pointer"
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

          {/* Mobile Menu Button */}
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

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/25 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
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
              <div className="flex items-center justify-between pb-3 border-b border-[#2d2542]/10 mb-2">
                <span className="text-xs font-semibold text-[#6a6078]">
                  {isFr ? "Thème nuit HD :" : "Night Mode:"}
                </span>
                <ThemeToggle variant="segmented" showLabel showIndicator={false} />
              </div>
              <div className="mobile-nav-group">
                <p className="mobile-nav-heading">{t("mobile_nav_devotion")}</p>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  <span>{isFr ? "Tableau de Bord" : "Sanctuary Dashboard"}</span>
                  <span className="text-xs text-[#8c8297]">5 mins</span>
                </Link>
                <Link href="/voice" onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_voice_search")}</span>
                  <span className="text-xs text-[#8c8297]">{isFr ? "Instantané" : "Instant"}</span>
                </Link>
                <Link href="/living-word" onClick={() => setMenuOpen(false)}>
                  <span>{t("nav_audio_teachings")}</span>
                  <span className="text-xs text-[#8c8297]">10 mins</span>
                </Link>
                <Link href="/progress" className="active-link" onClick={() => setMenuOpen(false)}>
                  <span>{isFr ? "Progrès & Séries" : "Progress & Trends"}</span>
                  <span className="text-xs text-[#8c8297]">✦</span>
                </Link>
              </div>

              {isSignedIn ? (
                <div className="mobile-account flex flex-col gap-2 pt-2 border-t border-[#2d2542]/10 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#2d2542] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#2d2542] text-[#fbfaf7] flex items-center justify-center text-[10px] font-bold">
                        {user?.avatarInitial || "LB"}
                      </span>
                      <span>{user?.fullName || (isFr ? "Pèlerin" : "Pilgrim")}</span>
                    </span>
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
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav_sign_in")}
                  </Link>
                  <Link
                    href="/sign-up"
                    className="mobile-join w-full text-center block"
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

      {/* Main Dashboard Screen */}
      <div className="py-6 sm:py-10">
        <ProgressScreen />
      </div>

      {/* Site Footer matching landing page */}
      <footer className="site-footer">
        <div className="page-shell">
          <div className="footer-lead">
            <Link className="footer-logo" href="/" aria-label="LifeBook home">
              <Image src="/logol.png" alt="LifeBook" width={78} height={78} unoptimized />
            </Link>
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
              <Link href="/#features">{isFr ? "Verset du jour" : "Today's Scripture"}</Link>
              <Link href="/#how-it-works">{isFr ? "Routine en 3 étapes" : "3-Step Routine"}</Link>
              <Link href="/#journeys">{t("nav_journeys")}</Link>
              <Link href="/voice">{t("nav_voice_search")}</Link>
            </div>
            <div className="footer-column">
              <h3>{isFr ? "Étudier et grandir" : "Study and Grow"}</h3>
              <Link href="/living-word">{t("nav_audio_teachings")}</Link>
              <Link href="/progress">{isFr ? "Suivi d'habitude" : "Habit Tracker"}</Link>
              <Link href="/#questions">{t("nav_faq")}</Link>
              <Link href="/#join">{isFr ? "Méditation par e-mail" : "Email Devotional"}</Link>
            </div>
            <div className="footer-column">
              <h3>{isFr ? "Communauté" : "Community"}</h3>
              <Link href="/progress">{isFr ? "Journal de prière" : "Prayer Journal"}</Link>
              <Link href="/#questions">{isFr ? "Questions pastorales" : "Pastoral Questions"}</Link>
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
              <Link href="/#top">{t("footer_terms")}</Link>
              <Link href="/#top">{isFr ? "Accessibilité" : "Accessibility"}</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Back to top button */}
      {scrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed right-6 bottom-20 md:bottom-6 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-[#1e1931] text-[#fbfaf7] shadow-lg hover:bg-[#34294f] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#fbfaf7]/15"
          aria-label={t("footer_back_to_top")}
          title={t("footer_back_to_top")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </main>
  );
}
