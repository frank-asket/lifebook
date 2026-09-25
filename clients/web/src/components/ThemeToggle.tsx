"use client";

import React, { useState, useEffect } from "react";
import { Sun, MoonStars, CheckCircle } from "@phosphor-icons/react";
import {
  useTheme,
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  type Theme,
} from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";

export interface ThemeToggleProps {
  className?: string;
  variant?: "segmented" | "compact" | "icon";
  showLabel?: boolean;
  showIndicator?: boolean;
}

export function ThemeToggle({
  className = "",
  variant = "segmented",
  showLabel = false,
  showIndicator = true,
}: ThemeToggleProps) {
  const { isDark, setTheme, toggleTheme } = useTheme();
  const { isFr } = useLanguage();
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Direct subscription to localStorage storage events across browser tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (event: StorageEvent) => {
      // StorageEvent fires in all other tabs when localStorage is updated
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        try {
          const raw = localStorage.getItem(THEME_STORAGE_KEY);
          const nextTheme: Theme = raw === "dark" ? "dark" : "light";
          setTheme(nextTheme);
          applyThemeToDocument(nextTheme);
        } catch {
          // Fallback if storage access is restricted
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [setTheme]);

  // Localized texts
  const currentModeText = isDark
    ? isFr
      ? "Mode sombre"
      : "Dark Mode"
    : isFr
    ? "Mode clair"
    : "Light Mode";

  const lightButtonLabel = isFr ? "Clair" : "Light";
  const darkButtonLabel = isFr ? "Nuit HD" : "Night HC";

  const tooltipHeadline = isDark
    ? isFr
      ? "Thème actif : Mode sombre (Contraste élevé)"
      : "Active Theme: High-Contrast Dark Mode"
    : isFr
    ? "Thème actif : Mode clair par défaut"
    : "Active Theme: Default Light Mode";

  const tooltipDescription = isDark
    ? isFr
      ? "Optimisé pour la lecture de nuit et une haute lisibilité."
      : "High-contrast palette tuned for night reading & accessibility."
    : isFr
    ? "Cliquez sur la lune pour activer la lecture de nuit à contraste élevé."
    : "Switch to high-contrast dark theme for night reading.";

  if (variant === "icon") {
    return (
      <div
        className={`relative inline-flex items-center gap-2 ${className}`}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <button
          type="button"
          onClick={toggleTheme}
          onFocus={() => setTooltipVisible(true)}
          onBlur={() => setTooltipVisible(false)}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#37C6C2] focus-visible:outline-offset-2 ${
            isDark
              ? "bg-[#1C172E] text-[#F7CB7A] border-white/20 hover:bg-[#272040] hover:text-[#FFE39E] shadow-sm"
              : "bg-[#FBFAF7] text-[#2D2542] border-[#2D2542]/15 hover:bg-[#F2ECE1] shadow-2xs"
          }`}
          aria-label={
            isDark
              ? isFr
                ? "Passer au thème clair"
                : "Switch to light theme"
              : isFr
              ? "Passer au thème sombre à contraste élevé"
              : "Switch to high-contrast dark theme"
          }
        >
          {isDark ? (
            <MoonStars weight="fill" className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Sun weight="bold" className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {showIndicator && (
          <span
            data-testid="theme-active-indicator"
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all select-none border ${
              isDark
                ? "bg-[#231A38] text-[#F7CB7A] border-[#F7CB7A]/30 shadow-xs"
                : "bg-[#FAF7F2] text-[#423956] border-[#2D2542]/12 shadow-2xs"
            }`}
            aria-live="polite"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDark
                  ? "bg-[#F7CB7A] shadow-[0_0_6px_#F7CB7A]"
                  : "bg-amber-500 ring-2 ring-amber-400/25"
              }`}
              aria-hidden="true"
            />
            <span>{currentModeText}</span>
          </span>
        )}

        {/* Hover / Focus Tooltip */}
        {tooltipVisible && (
          <div
            role="tooltip"
            data-testid="theme-tooltip"
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 min-w-[210px] p-2.5 rounded-lg bg-[#141022] text-white text-xs border border-white/20 shadow-xl pointer-events-none animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-[#F7CB7A] mb-0.5">
              <CheckCircle weight="fill" className="w-3.5 h-3.5" />
              <span>{tooltipHeadline}</span>
            </div>
            <p className="text-[11px] text-[#D8D2E4] leading-tight">
              {tooltipDescription}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center gap-2 ${className}`}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      {/* Segmented Theme Switch */}
      <div
        className={`inline-flex items-center rounded-full p-0.5 border transition-all ${
          isDark
            ? "bg-[#141024] border-white/20 shadow-xs"
            : "bg-[#FBFAF7] border-[#2D2542]/15 shadow-2xs"
        }`}
        role="group"
        aria-label={
          isFr
            ? "Sélecteur de thème : clair ou sombre haute lisibilité"
            : "Theme selector: default light or high-contrast dark for night reading"
        }
      >
        {/* Light Theme Button */}
        <button
          type="button"
          onClick={() => setTheme("light")}
          onFocus={() => setTooltipVisible(true)}
          onBlur={() => setTooltipVisible(false)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#37C6C2] ${
            !isDark
              ? "bg-[#2D2542] text-white shadow-xs"
              : "text-[#B6AFC6] hover:text-white"
          }`}
          aria-pressed={!isDark}
          title={isFr ? "Activer le thème clair" : "Activate light theme"}
        >
          <Sun
            weight={!isDark ? "bold" : "regular"}
            className="w-3.5 h-3.5"
            aria-hidden="true"
          />
          {(showLabel || variant === "segmented") && (
            <span className="text-[11px] leading-none">{lightButtonLabel}</span>
          )}
        </button>

        {/* High-Contrast Dark Theme Button */}
        <button
          type="button"
          onClick={() => setTheme("dark")}
          onFocus={() => setTooltipVisible(true)}
          onBlur={() => setTooltipVisible(false)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#37C6C2] ${
            isDark
              ? "bg-[#352957] text-[#F7CB7A] border border-[#F7CB7A]/30 shadow-xs font-extrabold"
              : "text-[#6B6279] hover:text-[#1E1931]"
          }`}
          aria-pressed={isDark}
          title={
            isFr
              ? "Activer le thème sombre à contraste élevé"
              : "Activate high-contrast dark theme"
          }
        >
          <MoonStars
            weight={isDark ? "fill" : "regular"}
            className={`w-3.5 h-3.5 ${isDark ? "text-[#F7CB7A]" : ""}`}
            aria-hidden="true"
          />
          {(showLabel || variant === "segmented") && (
            <span className="text-[11px] leading-none">{darkButtonLabel}</span>
          )}
        </button>
      </div>

      {/* Visual Indicator Pill showing currently active theme */}
      {showIndicator && (
        <span
          data-testid="theme-active-indicator"
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all select-none border cursor-default ${
            isDark
              ? "bg-[#221B3A] text-[#F7CB7A] border-[#F7CB7A]/30 shadow-xs"
              : "bg-[#F2ECE1] text-[#483F5E] border-[#2D2542]/12 shadow-2xs"
          }`}
          aria-live="polite"
          title={tooltipHeadline}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isDark
                ? "bg-[#F7CB7A] shadow-[0_0_6px_#F7CB7A]"
                : "bg-amber-500 ring-2 ring-amber-400/30"
            }`}
            aria-hidden="true"
          />
          <span className="truncate max-w-[85px]">{currentModeText}</span>
        </span>
      )}

      {/* Floating Animated Tooltip on Hover/Focus */}
      {tooltipVisible && (
        <div
          role="tooltip"
          data-testid="theme-tooltip"
          className="absolute top-full right-0 mt-2 z-50 min-w-[220px] max-w-[280px] p-2.5 rounded-lg bg-[#141022]/95 backdrop-blur-md text-white border border-white/20 shadow-xl pointer-events-none transition-opacity duration-150"
        >
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-[#F7CB7A] mb-1">
            <CheckCircle weight="fill" className="w-3.5 h-3.5 shrink-0" />
            <span>{tooltipHeadline}</span>
          </div>
          <p className="text-[11px] text-[#D8D2E4] leading-relaxed">
            {tooltipDescription}
          </p>
          <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[9px] text-[#A098B2]">
            <span>LifeBook Cross-Tab Sync</span>
            <span className="font-semibold text-emerald-400">● Live</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
