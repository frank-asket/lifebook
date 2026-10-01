"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  CaretDown,
  X,
  List,
  Sun,
  Moon,
  SignOut,
  Sparkle,
  BookmarkSimple,
  HandsPraying,
  BookOpenText,
  Headphones,
  UsersThree,
  Microphone,
  Fire,
  CheckCircle,
  PaperPlaneTilt,
  Heart,
  Buildings,
  Translate,
} from "@phosphor-icons/react";
import { useLanguage } from "@/lib/i18n";
import { useChristianAuth } from "@/lib/christian-auth";
import { useTheme } from "@/lib/theme";
import { LifeBookLogo } from "./LifeBookLogo";

export interface YouVersionNavbarProps {
  activeTab?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

// Framer Motion springy & refined dropdown variants
const dropdownMotionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.98,
    transition: {
      duration: 0.14,
      ease: [0.2, 0, 0, 1],
    },
  },
};

const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: [0.2, 0, 0, 1] },
  },
};

const drawerVariants: Variants = {
  hidden: { x: "100%", opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    x: "100%",
    opacity: 0.8,
    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
  },
};

export function YouVersionNavbar({
  activeTab,
}: YouVersionNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, isFr } = useLanguage();
  const { user, isSignedIn, signOut } = useChristianAuth();
  const { resolvedTheme, setTheme } = useTheme();

  // Scroll state for translucent header
  const [isScrolled, setIsScrolled] = useState(false);

  // Active dropdown menu
  const [activeDropdown, setActiveDropdown] = useState<
    "product" | "partners" | "about" | "involved" | null
  >(null);

  // User menu & mobile drawer
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Modals for Partnership & Volunteer inquiries
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);

  // Modal form states
  const [partnerFormSubmitted, setPartnerFormSubmitted] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    organization: "",
    email: "",
    partnershipType: "church",
    notes: "",
  });

  const [volunteerFormSubmitted, setVolunteerFormSubmitted] = useState(false);
  const [volunteerForm, setVolunteerForm] = useState({
    name: "",
    email: "",
    team: "localization",
    notes: "",
  });

  const navRef = useRef<HTMLDivElement>(null);

  // Subtle elevation on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Escape closes dropdowns & modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
        setPartnerModalOpen(false);
        setVolunteerModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const closeMenus = () => {
    setActiveDropdown(null);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.email.trim()) return;
    setPartnerFormSubmitted(true);
    setTimeout(() => {
      setPartnerModalOpen(false);
      setPartnerFormSubmitted(false);
      setPartnerForm({
        name: "",
        organization: "",
        email: "",
        partnershipType: "church",
        notes: "",
      });
    }, 2000);
  };

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerForm.email.trim()) return;
    setVolunteerFormSubmitted(true);
    setTimeout(() => {
      setVolunteerModalOpen(false);
      setVolunteerFormSubmitted(false);
      setVolunteerForm({
        name: "",
        email: "",
        team: "localization",
        notes: "",
      });
    }, 2000);
  };

  const isCurrentActive = (path: string) => {
    if (activeTab) {
      if (activeTab === "overview" && path === "/dashboard") return true;
      if (activeTab === "livingword" && path === "/living-word") return true;
      if (activeTab === "teachers" && path === "/teachers") return true;
      if (activeTab === "voice" && path === "/voice") return true;
      if (activeTab === "fellowship" && path === "/fellowship") return true;
    }
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  return (
    <>
      <header
        ref={navRef}
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? "bg-white/95 dark:bg-[#12101C]/95 backdrop-blur-md border-b border-[#2A2146]/10 dark:border-white/10 shadow-xs"
            : "bg-[#FAF7F2] dark:bg-[#0E0C18] border-b border-[#2A2146]/8 dark:border-white/8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[68px] gap-3">
            {/* ======================================================== */}
            {/* Zone 1: Brand Wordmark & Emblem                          */}
            {/* ======================================================== */}
            <div className="flex items-center shrink-0">
              <Link
                href={isSignedIn ? "/dashboard" : "/"}
                className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2A2146] dark:focus-visible:ring-[#4EE2D8] rounded-xl p-1 -m-1"
                aria-label="LifeBook - Home"
              >
                <LifeBookLogo size={32} rounded="rounded-xl" />
                <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-[#1E1931] dark:text-[#FAF7F2] leading-none group-hover:text-[#49368C] dark:group-hover:text-[#4EE2D8] transition-colors">
                  LifeBook
                </span>
              </Link>
            </div>

            {/* ======================================================== */}
            {/* Zone 2: Startup Ecosystem Navigation Menus with Framer   */}
            {/* ======================================================== */}
            <nav
              className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-medium text-[#4E455E] dark:text-[#D1C9DE]"
              aria-label="Primary Navigation"
            >
              {/* Menu 1: Products */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "product" ? null : "product")
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors hover:text-[#1E1931] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    activeDropdown === "product" ||
                    isCurrentActive("/dashboard") ||
                    isCurrentActive("/living-word")
                      ? "text-[#1E1931] dark:text-white font-semibold bg-black/5 dark:bg-white/5"
                      : ""
                  }`}
                  aria-expanded={activeDropdown === "product"}
                >
                  <span>{isFr ? "Produits" : "Products"}</span>
                  <motion.span
                    animate={{ rotate: activeDropdown === "product" ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center"
                  >
                    <CaretDown size={12} weight="bold" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {activeDropdown === "product" && (
                    <motion.div
                      key="dropdown-products"
                      variants={dropdownMotionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#171326] border border-[#1E1931]/12 dark:border-white/12 rounded-2xl shadow-xl p-2.5 z-50 space-y-1 origin-top-left"
                    >
                      <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#766D87] dark:text-[#A79FB6]">
                          {isFr ? "La Suite Spirituelle LifeBook" : "The LifeBook Spiritual Suite"}
                        </span>
                      </div>

                      <Link
                        href="/dashboard?tab=overview"
                        onClick={closeMenus}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#1FB6B0]/15 text-[#0F7571] dark:text-[#1FB6B0] flex items-center justify-center shrink-0 mt-0.5">
                          <BookOpenText size={18} weight="duotone" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#0F7571] dark:group-hover:text-[#1FB6B0]">
                            {isFr ? "Sanctuaire Quotidien (5 Min)" : "Daily 5-Min Sanctuary"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Lecture biblique guidée, réflexion et prière"
                              : "Guided Scripture, reflection, and quiet prayer"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/living-word"
                        onClick={closeMenus}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#9677DF]/15 text-[#633DB3] dark:text-[#9677DF] flex items-center justify-center shrink-0 mt-0.5">
                          <Headphones size={18} weight="duotone" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#633DB3] dark:group-hover:text-[#9677DF]">
                            {isFr ? "LivingWord Audio" : "LivingWord Audio Library"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Enseignements bibliques audio et méditations thématiques"
                              : "Bilingual sermon commentary & audio reflections"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/fellowship"
                        onClick={closeMenus}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#37C6C2]/15 text-[#0F7571] dark:text-[#37C6C2] flex items-center justify-center shrink-0 mt-0.5">
                          <HandsPraying size={18} weight="duotone" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#0F7571] dark:group-hover:text-[#37C6C2]">
                            {isFr ? "Cercle de Prière Communautaire" : "Fellowship Prayer Circle"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Partagez et soutenez les prières des frères et sœurs"
                              : "Share prayer petitions & intercede together"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/voice"
                        onClick={closeMenus}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#51A08D]/15 text-[#2A7563] dark:text-[#51A08D] flex items-center justify-center shrink-0 mt-0.5">
                          <Microphone size={18} weight="duotone" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#2A7563] dark:group-hover:text-[#51A08D]">
                            {isFr ? "Pratique Vocale" : "Voice Practice"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Méditation guidée par voix humaine et prière parlée"
                              : "Spoken Scripture meditation & contemplative audio"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard?tab=heatmap"
                        onClick={closeMenus}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Fire size={18} weight="fill" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                            {isFr ? "Rythme Spirituel & Constance" : "Spiritual Consistency & Sabbat"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Séries de jours, grâce du sabbat et constance"
                              : "Habit tracking, grace days, and consistency"}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu 2: Pastors & Partners */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "partners" ? null : "partners")
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors hover:text-[#1E1931] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    activeDropdown === "partners" || isCurrentActive("/teachers")
                      ? "text-[#1E1931] dark:text-white font-semibold bg-black/5 dark:bg-white/5"
                      : ""
                  }`}
                  aria-expanded={activeDropdown === "partners"}
                >
                  <span>{isFr ? "Pasteurs & Partenaires" : "Pastors & Partners"}</span>
                  <motion.span
                    animate={{ rotate: activeDropdown === "partners" ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center"
                  >
                    <CaretDown size={12} weight="bold" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {activeDropdown === "partners" && (
                    <motion.div
                      key="dropdown-partners"
                      variants={dropdownMotionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#171326] border border-[#1E1931]/12 dark:border-white/12 rounded-2xl shadow-xl p-2.5 z-50 space-y-1 origin-top-left"
                    >
                      <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#766D87] dark:text-[#A79FB6]">
                          {isFr ? "Collaboration Ministère" : "Ministry Collaboration"}
                        </span>
                      </div>

                      <Link
                        href="/teachers"
                        onClick={closeMenus}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#E8BA6A]/15 text-[#A36D22] dark:text-[#E8BA6A] flex items-center justify-center shrink-0 mt-0.5">
                          <UsersThree size={18} weight="duotone" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#A36D22] dark:group-hover:text-[#E8BA6A]">
                            {isFr ? "Répertoire des Pasteurs" : "Pastoral Contributor Directory"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Pasteurs et enseignants théologiques vérifiés"
                              : "Verified pastoral voices & theological reflections"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/teachers#pastoral-directory-section"
                        onClick={closeMenus}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#1FB6B0]/15 text-[#0F7571] dark:text-[#1FB6B0] flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkle size={18} weight="duotone" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#0F7571] dark:group-hover:text-[#1FB6B0]">
                            {isFr ? "Devenir Contributeur Pastoral" : "Pastoral Contributor Portal"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Publiez vos séries d'enseignements sur LifeBook"
                              : "Publish teachings & sermon series to the library"}
                          </p>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          setPartnerModalOpen(true);
                        }}
                        className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#2A2146]/10 text-[#2A2146] dark:bg-white/10 dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Buildings size={18} weight="duotone" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#2A2146] dark:group-hover:text-white">
                            {isFr ? "Partenariats Églises & Ministères" : "Church & Ministry Partnerships"}
                          </div>
                          <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                            {isFr
                              ? "Déployez le rituel 5-min dans vos groupes de maison"
                              : "Integrate LifeBook into your small groups & parish"}
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu 3: About */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "about" ? null : "about")
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors hover:text-[#1E1931] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    activeDropdown === "about"
                      ? "text-[#1E1931] dark:text-white font-semibold bg-black/5 dark:bg-white/5"
                      : ""
                  }`}
                  aria-expanded={activeDropdown === "about"}
                >
                  <span>{isFr ? "À Propos" : "About"}</span>
                  <motion.span
                    animate={{ rotate: activeDropdown === "about" ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center"
                  >
                    <CaretDown size={12} weight="bold" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {activeDropdown === "about" && (
                    <motion.div
                      key="dropdown-about"
                      variants={dropdownMotionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#171326] border border-[#1E1931]/12 dark:border-white/12 rounded-2xl shadow-xl p-2.5 z-50 space-y-1 origin-top-left"
                    >
                      <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#766D87] dark:text-[#A79FB6]">
                          {isFr ? "Vision & Fondements" : "Vision & Story"}
                        </span>
                      </div>

                      <Link
                        href="/#features"
                        onClick={closeMenus}
                        className="block p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#2A2146] dark:group-hover:text-[#4EE2D8]">
                          {isFr ? "Notre Mission" : "Our Mission"}
                        </div>
                        <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                          {isFr
                            ? "Aider les croyants à s'ancrer dans la Parole au quotidien"
                            : "Restoring quiet, unhurried time with Scripture"}
                        </p>
                      </Link>

                      <Link
                        href="/#how-it-works"
                        onClick={closeMenus}
                        className="block p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#2A2146] dark:group-hover:text-[#4EE2D8]">
                          {isFr ? "La Philosophie des 5 Minutes" : "The 5-Minute Habit"}
                        </div>
                        <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                          {isFr
                            ? "Pourquoi la constance quotidienne surpasse les résolutions"
                            : "Why small faithful rhythms transform spiritual health"}
                        </p>
                      </Link>

                      <Link
                        href="/privacy"
                        onClick={closeMenus}
                        className="block p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#2A2146] dark:group-hover:text-[#4EE2D8]">
                          {isFr ? "Confiance & Intégrité Biblique" : "Biblical Integrity & Trust"}
                        </div>
                        <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                          {isFr
                            ? "Traductions approuvées (ESV, NIV, KJV, LSG) sans publicité"
                            : "Approved translations with zero ad distractions"}
                        </p>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu 4: Get Involved */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "involved" ? null : "involved")
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors hover:text-[#1E1931] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    activeDropdown === "involved"
                      ? "text-[#1E1931] dark:text-white font-semibold bg-black/5 dark:bg-white/5"
                      : ""
                  }`}
                  aria-expanded={activeDropdown === "involved"}
                >
                  <span>{isFr ? "S'Engager" : "Get Involved"}</span>
                  <motion.span
                    animate={{ rotate: activeDropdown === "involved" ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center"
                  >
                    <CaretDown size={12} weight="bold" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {activeDropdown === "involved" && (
                    <motion.div
                      key="dropdown-involved"
                      variants={dropdownMotionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#171326] border border-[#1E1931]/12 dark:border-white/12 rounded-2xl shadow-xl p-2.5 z-50 space-y-1 origin-top-right"
                    >
                      <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#766D87] dark:text-[#A79FB6]">
                          {isFr ? "Participer à l'Aventure" : "Join the Movement"}
                        </span>
                      </div>

                      <Link
                        href="/sign-up"
                        onClick={closeMenus}
                        className="block p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#1FB6B0]">
                          {isFr ? "Rejoindre la Communauté" : "Join the Fellowship"}
                        </div>
                        <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                          {isFr
                            ? "Créez votre profil de prière gratuit"
                            : "Create your free sanctuary habit today"}
                        </p>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          setVolunteerModalOpen(true);
                        }}
                        className="w-full block p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#9677DF]">
                          {isFr ? "Bénévolat & Traduction" : "Volunteer & Localization"}
                        </div>
                        <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                          {isFr
                            ? "Aidez à traduire et relire en anglais/français"
                            : "Assist with EN/FR translation & prayer intercession"}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          setPartnerModalOpen(true);
                        }}
                        className="w-full block p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#E8BA6A]">
                          {isFr ? "Partenaire de Vision" : "Become a Vision Partner"}
                        </div>
                        <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                          {isFr
                            ? "Soutenez le développement de l'application"
                            : "Support mobile audio & translation development"}
                        </p>
                      </button>

                      <a
                        href="mailto:support@lifebook.sanctuary"
                        onClick={closeMenus}
                        className="block p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="text-xs font-semibold text-[#1E1931] dark:text-white group-hover:text-[#2A2146] dark:group-hover:text-white">
                          {isFr ? "Contacter les Fondateurs" : "Contact the Founders"}
                        </div>
                        <p className="text-[11px] text-[#766D87] dark:text-[#A79FB6] leading-tight mt-0.5">
                          {isFr ? "support@lifebook.sanctuary" : "Direct line to our core team"}
                        </p>
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* ======================================================== */}
            {/* Zone 3: Utilities, Language, Theme & Conversion CTA      */}
            {/* ======================================================== */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer uppercase tracking-wider"
                title={isFr ? "Passer en anglais" : "Switch to French"}
                aria-label="Toggle language"
              >
                {language}
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title={
                  resolvedTheme === "dark"
                    ? isFr ? "Mode clair" : "Switch to light mode"
                    : isFr ? "Mode sombre" : "Switch to dark mode"
                }
                aria-label="Toggle appearance theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun size={17} weight="duotone" className="text-[#E8BA6A]" />
                ) : (
                  <Moon size={17} weight="duotone" className="text-[#49368C]" />
                )}
              </button>

              {/* Account / Conversion Action */}
              {isSignedIn ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      setUserDropdownOpen(!userDropdownOpen);
                    }}
                    className="flex items-center gap-1.5 p-1 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    aria-expanded={userDropdownOpen}
                    aria-label="User account menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2A2146] dark:bg-[#1FB6B0] text-white dark:text-[#0E0C18] flex items-center justify-center font-bold text-xs shadow-xs">
                      {user?.firstName?.charAt(0) || user?.avatarInitial || "P"}
                    </div>
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        key="dropdown-user"
                        variants={dropdownMotionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#171326] border border-[#1E1931]/12 dark:border-white/12 rounded-2xl shadow-xl p-2 z-50 origin-top-right"
                      >
                        <div className="px-3 py-2 border-b border-black/5 dark:border-white/5 mb-1.5">
                          <div className="text-sm font-bold text-[#1E1931] dark:text-white truncate">
                            {user?.fullName || (isFr ? "Pèlerin" : "Sanctuary Pilgrim")}
                          </div>
                          <div className="text-xs text-[#766D87] dark:text-[#A79FB6] truncate mt-0.5">
                            {user?.email || "pilgrim@lifebook.sanctuary"}
                          </div>
                        </div>

                        <Link
                          href="/dashboard?tab=overview"
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1E1931] dark:hover:text-white transition-colors"
                        >
                          <Sparkle size={15} weight="duotone" className="text-[#1FB6B0]" />
                          <span>{isFr ? "Sanctuaire Quotidien" : "Sanctuary Dashboard"}</span>
                        </Link>

                        <Link
                          href="/dashboard?tab=journal"
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1E1931] dark:hover:text-white transition-colors"
                        >
                          <BookmarkSimple size={15} weight="duotone" className="text-[#9677DF]" />
                          <span>{isFr ? "Journal & Notes" : "Saved Verses & Notes"}</span>
                        </Link>

                        <Link
                          href="/fellowship"
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1E1931] dark:hover:text-white transition-colors"
                        >
                          <HandsPraying size={15} weight="duotone" className="text-[#E8BA6A]" />
                          <span>{isFr ? "Communauté de Prière" : "Fellowship Circle"}</span>
                        </Link>

                        <div className="my-1 border-t border-black/5 dark:border-white/5" />

                        <button
                          type="button"
                          onClick={async () => {
                            closeMenus();
                            await signOut();
                            router.push("/?marketing=1");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                        >
                          <SignOut size={15} weight="bold" />
                          <span>{isFr ? "Se déconnecter" : "Sign out"}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/sign-in"
                    className="px-3 py-1.5 text-xs font-semibold text-[#3D354E] dark:text-[#D1C9DE] hover:text-[#1E1931] dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    {isFr ? "Connexion" : "Sign In"}
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-4 py-2 text-xs font-bold rounded-full bg-[#2A2146] text-white hover:bg-[#1D1633] dark:bg-[#1FB6B0] dark:text-[#0E0C18] dark:hover:bg-[#199E99] transition-all shadow-xs whitespace-nowrap"
                  >
                    {isFr ? "Commencer" : "Get Started"}
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-[#1E1931] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Mobile Navigation Drawer with Framer Motion              */}
        {/* ======================================================== */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                key="drawer-backdrop"
                variants={modalBackdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={closeMenus}
                aria-hidden="true"
              />

              <motion.div
                key="drawer-content"
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#FAF7F2] dark:bg-[#120F1D] text-[#1E1931] dark:text-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-50"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#1E1931]/10 dark:border-white/10">
                    <LifeBookLogo size={30} showWordmark />
                    <button
                      type="button"
                      onClick={closeMenus}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X size={20} weight="bold" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#766D87] dark:text-[#A79FB6] block px-3 mb-1">
                        {isFr ? "Produits" : "Products"}
                      </span>
                      <Link
                        href="/dashboard?tab=overview"
                        onClick={closeMenus}
                        className="block px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        {isFr ? "Sanctuaire Quotidien (5 Min)" : "Daily 5-Min Sanctuary"}
                      </Link>
                      <Link
                        href="/living-word"
                        onClick={closeMenus}
                        className="block px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        LivingWord Audio
                      </Link>
                      <Link
                        href="/fellowship"
                        onClick={closeMenus}
                        className="block px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        {isFr ? "Cercle de Prière" : "Fellowship Circle"}
                      </Link>
                      <Link
                        href="/voice"
                        onClick={closeMenus}
                        className="block px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        {isFr ? "Pratique Vocale" : "Voice Practice"}
                      </Link>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#766D87] dark:text-[#A79FB6] block px-3 mb-1">
                        {isFr ? "Pasteurs & Partenaires" : "Pastors & Partners"}
                      </span>
                      <Link
                        href="/teachers"
                        onClick={closeMenus}
                        className="block px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        {isFr ? "Répertoire Pastoral" : "Pastoral Directory"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          setPartnerModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        {isFr ? "Partenariat Églises" : "Church Partnerships"}
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#766D87] dark:text-[#A79FB6] block px-3 mb-1">
                        {isFr ? "S'Engager" : "Get Involved"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          setVolunteerModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        {isFr ? "Bénévolat & Traduction" : "Volunteer & Localization"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          setPartnerModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        {isFr ? "Partenaire de Vision" : "Become a Vision Partner"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1E1931]/10 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between px-3">
                      <span className="text-xs font-medium">{isFr ? "Langue" : "Language"}</span>
                      <button
                        type="button"
                        onClick={toggleLanguage}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-black/5 dark:bg-white/10"
                      >
                        {language.toUpperCase()}
                      </button>
                    </div>

                    <div className="flex items-center justify-between px-3">
                      <span className="text-xs font-medium">{isFr ? "Thème" : "Appearance"}</span>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-black/5 dark:bg-white/10"
                      >
                        {resolvedTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                        <span>{resolvedTheme === "dark" ? "Dark" : "Light"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#1E1931]/10 dark:border-white/10">
                  {isSignedIn ? (
                    <div className="space-y-3">
                      <div className="text-sm font-bold truncate">
                        {user?.fullName || "Pilgrim"}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          closeMenus();
                          await signOut();
                          router.push("/?marketing=1");
                        }}
                        className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-black/5 dark:bg-white/10 text-rose-600 dark:text-rose-400 cursor-pointer"
                      >
                        {isFr ? "Se déconnecter" : "Sign out"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/sign-in"
                        onClick={closeMenus}
                        className="block w-full py-2.5 text-center text-xs font-bold rounded-xl border border-black/15 dark:border-white/15"
                      >
                        {isFr ? "Se connecter" : "Sign In"}
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={closeMenus}
                        className="block w-full py-2.5 text-center text-xs font-bold rounded-xl bg-[#2A2146] text-white dark:bg-[#1FB6B0] dark:text-[#0E0C18]"
                      >
                        {isFr ? "Commencer" : "Get Started"}
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================ */}
      {/* Interactive Modal: Church & Ministry Partnership             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {partnerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="partner-backdrop"
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setPartnerModalOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              key="partner-card"
              variants={modalCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg bg-white dark:bg-[#171326] border border-[#1E1931]/15 dark:border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 space-y-4"
            >
              <button
                type="button"
                onClick={() => setPartnerModalOpen(false)}
                className="absolute right-4 top-4 p-2 rounded-full text-[#766D87] hover:text-[#1E1931] dark:text-[#A79FB6] dark:hover:text-white cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} weight="bold" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2A2146]/10 dark:bg-white/10 text-[#2A2146] dark:text-[#4EE2D8] flex items-center justify-center shrink-0">
                  <Buildings size={22} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1E1931] dark:text-white">
                    {isFr ? "Partenariat Église & Ministère" : "Church & Ministry Partnership"}
                  </h3>
                  <p className="text-xs text-[#766D87] dark:text-[#A79FB6]">
                    {isFr
                      ? "Rejoignez LifeBook pour équiper votre communauté"
                      : "Partner with LifeBook to foster daily Scripture habits"}
                  </p>
                </div>
              </div>

              {partnerFormSubmitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle size={44} weight="fill" className="text-emerald-500 mx-auto" />
                  <h4 className="text-base font-bold text-[#1E1931] dark:text-white">
                    {isFr ? "Demande transmise avec succès !" : "Inquiry Received!"}
                  </h4>
                  <p className="text-xs text-[#766D87] dark:text-[#A79FB6] max-w-xs mx-auto">
                    {isFr
                      ? "Notre équipe pastorale examinera votre demande et vous répondra sous 48h."
                      : "Our pastoral leadership team will connect with your ministry within 48 hours."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePartnerSubmit} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                        {isFr ? "Votre Nom" : "Your Name"}
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                        placeholder={isFr ? "Pasteur Marc..." : "Pastor David..."}
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none focus:border-[#2A2146]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                        {isFr ? "Église ou Organisation" : "Church or Ministry"}
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerForm.organization}
                        onChange={(e) =>
                          setPartnerForm({ ...partnerForm, organization: e.target.value })
                        }
                        placeholder={isFr ? "Église de la Grâce..." : "Grace Community..."}
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none focus:border-[#2A2146]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                      {isFr ? "Adresse E-mail" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      required
                      value={partnerForm.email}
                      onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                      placeholder="leader@ministry.org"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none focus:border-[#2A2146]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                      {isFr ? "Type de Partenariat Souhaité" : "Partnership Interest"}
                    </label>
                    <select
                      value={partnerForm.partnershipType}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, partnershipType: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none cursor-pointer"
                    >
                      <option value="church">
                        {isFr
                          ? "Rituels 5-Min pour petits groupes & paroisse"
                          : "5-Min Devotional for small groups & parish"}
                      </option>
                      <option value="content">
                        {isFr
                          ? "Publication d'enseignements audio (LivingWord)"
                          : "Content partner: Expository audio teachings"}
                      </option>
                      <option value="vision">
                        {isFr
                          ? "Soutien visionnaire et missionnaire"
                          : "Vision partner & missionary support"}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                      {isFr ? "Message ou Note Particulière" : "Notes / Vision"}
                    </label>
                    <textarea
                      rows={2}
                      value={partnerForm.notes}
                      onChange={(e) => setPartnerForm({ ...partnerForm, notes: e.target.value })}
                      placeholder={
                        isFr
                          ? "Partagez brièvement la vision de votre communauté..."
                          : "Tell us a bit about your church or fellowship..."
                      }
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2A2146] text-white hover:bg-[#1E1733] dark:bg-[#1FB6B0] dark:text-[#0E0C18] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <PaperPlaneTilt size={16} weight="bold" />
                    <span>{isFr ? "Envoyer la Demande" : "Submit Partnership Inquiry"}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* Interactive Modal: Volunteer & Localization                  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {volunteerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="volunteer-backdrop"
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setVolunteerModalOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              key="volunteer-card"
              variants={modalCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg bg-white dark:bg-[#171326] border border-[#1E1931]/15 dark:border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 space-y-4"
            >
              <button
                type="button"
                onClick={() => setVolunteerModalOpen(false)}
                className="absolute right-4 top-4 p-2 rounded-full text-[#766D87] hover:text-[#1E1931] dark:text-[#A79FB6] dark:hover:text-white cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} weight="bold" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#9677DF]/15 text-[#633DB3] dark:text-[#9677DF] flex items-center justify-center shrink-0">
                  <Heart size={22} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1E1931] dark:text-white">
                    {isFr ? "S'Engager comme Bénévole" : "Serve with LifeBook"}
                  </h3>
                  <p className="text-xs text-[#766D87] dark:text-[#A79FB6]">
                    {isFr
                      ? "Mettez vos dons au service de la Parole et de la communauté"
                      : "Use your gifts to support Scripture access and prayer"}
                  </p>
                </div>
              </div>

              {volunteerFormSubmitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle size={44} weight="fill" className="text-emerald-500 mx-auto" />
                  <h4 className="text-base font-bold text-[#1E1931] dark:text-white">
                    {isFr ? "Merci pour votre cœur serviteur !" : "Thank You for Serving!"}
                  </h4>
                  <p className="text-xs text-[#766D87] dark:text-[#A79FB6] max-w-xs mx-auto">
                    {isFr
                      ? "Nous vous contacterons rapidement avec les prochaines étapes de l'équipe."
                      : "Our volunteer coordinator will reach out shortly with onboarding details."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVolunteerSubmit} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                        {isFr ? "Nom & Prénom" : "Full Name"}
                      </label>
                      <input
                        type="text"
                        required
                        value={volunteerForm.name}
                        onChange={(e) =>
                          setVolunteerForm({ ...volunteerForm, name: e.target.value })
                        }
                        placeholder={isFr ? "Marie Dupont..." : "Sarah Jenkins..."}
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none focus:border-[#9677DF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                        {isFr ? "Adresse E-mail" : "Email Address"}
                      </label>
                      <input
                        type="email"
                        required
                        value={volunteerForm.email}
                        onChange={(e) =>
                          setVolunteerForm({ ...volunteerForm, email: e.target.value })
                        }
                        placeholder="volunteer@sanctuary.org"
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none focus:border-[#9677DF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                      {isFr ? "Équipe Souhaitée" : "Team Interest"}
                    </label>
                    <select
                      value={volunteerForm.team}
                      onChange={(e) =>
                        setVolunteerForm({ ...volunteerForm, team: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none cursor-pointer"
                    >
                      <option value="localization">
                        {isFr
                          ? "Équipe de Traduction & Relecture (EN / FR)"
                          : "Localization Team (English / French review)"}
                      </option>
                      <option value="prayer">
                        {isFr
                          ? "Équipe de Soutien Spirituel & Intercession"
                          : "Spiritual Support & Prayer Team"}
                      </option>
                      <option value="tech">
                        {isFr
                          ? "Support Technique & Tests PWA"
                          : "Technical Support & PWA Testing"}
                      </option>
                      <option value="pastoral">
                        {isFr
                          ? "Recherche Biblique & Sources Théologiques"
                          : "Scripture Research & Theological Review"}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4E455E] dark:text-[#D1C9DE] mb-1">
                      {isFr ? "Expérience ou Disponibilité" : "Experience or Availability"}
                    </label>
                    <textarea
                      rows={2}
                      value={volunteerForm.notes}
                      onChange={(e) =>
                        setVolunteerForm({ ...volunteerForm, notes: e.target.value })
                      }
                      placeholder={
                        isFr
                          ? "Ex: Bilingue, disponible 2h par semaine..."
                          : "Ex: Bilingual EN/FR, available 2 hrs/week..."
                      }
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2A2146] text-white hover:bg-[#1E1733] dark:bg-[#1FB6B0] dark:text-[#0E0C18] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Translate size={16} weight="bold" />
                    <span>{isFr ? "Rejoindre l'Équipe" : "Submit Volunteer Application"}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default YouVersionNavbar;
