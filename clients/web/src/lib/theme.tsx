"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const THEME_STORAGE_KEY = "lifebook_theme";
export const THEME_CHANGE_EVENT = "lifebook_theme_change";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function applyThemeToDocument(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }
}

function getDeviceThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // Fallback to light
  }
  return "light";
}

function getThemeServerSnapshot(): Theme {
  return "light";
}

function subscribeToDeviceTheme(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    const nextTheme: Theme = mediaQuery.matches ? "dark" : "light";
    applyThemeToDocument(nextTheme);
    callback();
  };

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToDeviceTheme,
    getDeviceThemeSnapshot,
    getThemeServerSnapshot
  );

  useEffect(() => {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {}
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    applyThemeToDocument(newTheme);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: newTheme }));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = getDeviceThemeSnapshot();
    applyThemeToDocument(nextTheme);
  }, []);

  const value: ThemeContextType = {
    theme,
    resolvedTheme: theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light",
      resolvedTheme: "light",
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

export default useTheme;
