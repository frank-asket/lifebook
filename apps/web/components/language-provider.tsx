'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, type ProfileResponse } from '../lib/api';
export type Language = 'en' | 'fr';
const LanguageContext = createContext<{ language: Language; setLanguage: (value: Language) => void }>({ language: 'en', setLanguage: () => {} });
function remember(language: Language) {
  try { window.localStorage.setItem('lifebook-language', language); }
  catch { /* Language still changes when device storage is unavailable. */ }
}
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const { isLoaded, userId, getToken } = useAuth();
  const revision = useRef(0);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem('lifebook-language'); } catch { /* Fall back to the device language. */ }
    const detected = navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    setLanguage(saved === 'fr' || saved === 'en' ? saved : detected);
  }, []);
  useEffect(() => {
    if (!isLoaded || !userId) return;
    let active = true;
    const version = revision.current;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const result = await api<ProfileResponse>('/me/profile', token);
        const saved = result.profile?.language;
        // A slow profile read must not undo a newer preference saved in Settings.
        if (active && version === revision.current && (saved === 'en' || saved === 'fr')) {
          setLanguage(saved); remember(saved);
        }
      } catch { /* Keep the device preference when the profile is unavailable. */ }
    })();
    return () => { active = false; };
  }, [isLoaded, userId, getToken]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
  }, [language]);
  const change = (value: Language) => {
    revision.current += 1;
    setLanguage(value); remember(value);
  };
  return <LanguageContext.Provider value={{ language, setLanguage: change }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }
export function L({ en, fr }: { en: string; fr: string }) {
  const { language } = useLanguage();
  return <>{language === 'fr' ? fr : en}</>;
}
