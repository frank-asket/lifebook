"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  X,
  List,
  Sun,
  Moon,
  SignOut,
  Sparkle,
  BookmarkSimple,
  HandsPraying,
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

export function YouVersionNavbar({
  activeTab,
}: YouVersionNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, isFr } = useLanguage();
  const { user, isSignedIn, signOut } = useChristianAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Subtle blur on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
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

  const navLinks = [
    {
      label: isFr ? "Sanctuaire" : "Sanctuary",
      href: "/dashboard",
      active: isCurrentActive("/dashboard"),
    },
    {
      label: "LivingWord",
      href: "/living-word",
      active: isCurrentActive("/living-word"),
    },
    {
      label: isFr ? "Communauté" : "Fellowship",
      href: "/fellowship",
      active: isCurrentActive("/fellowship"),
    },
    {
      label: isFr ? "Enseignants" : "Teachers",
      href: "/teachers",
      active: isCurrentActive("/teachers"),
    },
    {
      label: isFr ? "Voix" : "Voice",
      href: "/voice",
      active: isCurrentActive("/voice"),
    },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 dark:bg-[#12101C]/95 backdrop-blur-md border-b border-[#2A2146]/10 dark:border-white/10 shadow-xs"
          : "bg-[#FAF7F2] dark:bg-[#0E0C18] border-b border-[#2A2146]/8 dark:border-white/8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px] gap-4">
          {/* Brand */}
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

          {/* Simple Clean Nav Links */}
          <nav
            className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#4E455E] dark:text-[#D1C9DE]"
            aria-label="Primary Navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors whitespace-nowrap hover:text-[#1E1931] dark:hover:text-white ${
                  link.active
                    ? "text-[#1E1931] dark:text-white font-semibold border-b-2 border-[#2A2146] dark:border-[#4EE2D8] pb-0.5"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Utilities & Actions */}
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

            {/* Account / Primary CTA */}
            {isSignedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-expanded={userDropdownOpen}
                  aria-label="User account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2A2146] dark:bg-[#1FB6B0] text-white dark:text-[#0E0C18] flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.firstName?.charAt(0) || user?.avatarInitial || "P"}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#171326] border border-[#1E1931]/12 dark:border-white/12 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
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
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1E1931] dark:hover:text-white transition-colors"
                    >
                      <Sparkle size={15} weight="duotone" className="text-[#1FB6B0]" />
                      <span>{isFr ? "Sanctuaire Quotidien" : "Sanctuary Dashboard"}</span>
                    </Link>

                    <Link
                      href="/dashboard?tab=journal"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1E1931] dark:hover:text-white transition-colors"
                    >
                      <BookmarkSimple size={15} weight="duotone" className="text-[#9677DF]" />
                      <span>{isFr ? "Journal & Notes" : "Saved Verses & Notes"}</span>
                    </Link>

                    <Link
                      href="/fellowship"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1E1931] dark:hover:text-white transition-colors"
                    >
                      <HandsPraying size={15} weight="duotone" className="text-[#E8BA6A]" />
                      <span>{isFr ? "Communauté de Prière" : "Fellowship Circle"}</span>
                    </Link>

                    <div className="my-1 border-t border-black/5 dark:border-white/5" />

                    <button
                      type="button"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                        router.push("/?marketing=1");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                    >
                      <SignOut size={15} weight="bold" />
                      <span>{isFr ? "Se déconnecter" : "Sign out"}</span>
                    </button>
                  </div>
                )}
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
              className="md:hidden p-2 rounded-xl text-[#1E1931] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#FAF7F2] dark:bg-[#120F1D] text-[#1E1931] dark:text-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1E1931]/10 dark:border-white/10">
                <LifeBookLogo size={30} showWordmark />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                      link.active
                        ? "bg-[#2A2146] text-white dark:bg-white/15"
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-[#3D354E] dark:text-[#D1C9DE]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
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
                      setMobileMenuOpen(false);
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
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-2.5 text-center text-xs font-bold rounded-xl border border-black/15 dark:border-white/15"
                  >
                    {isFr ? "Se connecter" : "Sign In"}
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-2.5 text-center text-xs font-bold rounded-xl bg-[#2A2146] text-white dark:bg-[#1FB6B0] dark:text-[#0E0C18]"
                  >
                    {isFr ? "Commencer" : "Get Started"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default YouVersionNavbar;
