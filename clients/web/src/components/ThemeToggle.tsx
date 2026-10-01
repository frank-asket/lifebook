"use client";

import React from "react";
import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme";

export interface ThemeToggleProps {
  className?: string;
  variant?: "segmented" | "compact" | "icon";
  showLabel?: boolean;
  showIndicator?: boolean;
}

export function ThemeToggle({ className = "", variant = "icon", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 p-2 rounded-xl text-[#4E455E] dark:text-[#D1C9DE] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${className}`}
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark/light theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun size={18} weight="duotone" className="text-[#E8BA6A]" />
      ) : (
        <Moon size={18} weight="duotone" className="text-[#49368C]" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold">
          {resolvedTheme === "dark" ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
