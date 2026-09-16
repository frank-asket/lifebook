"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = "" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 border border-[#2d2542]/15 bg-[#fbfaf7] dark:border-white/20 transition-all ${className}`}
      role="group"
      aria-label="Language selector / Sélecteur de langue"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
          language === "en"
            ? "bg-[#2d2542] text-white shadow-xs"
            : "text-[#6b6279] hover:text-[#1e1931]"
        }`}
        aria-pressed={language === "en"}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
          language === "fr"
            ? "bg-[#2d2542] text-white shadow-xs"
            : "text-[#6b6279] hover:text-[#1e1931]"
        }`}
        aria-pressed={language === "fr"}
        title="Français"
      >
        FR
      </button>
    </div>
  );
}

export default LanguageToggle;
