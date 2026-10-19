import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { copy, type Copy } from './copy';
import { palettes, type Palette } from './theme';
import { DEFAULT_READER, parseReaderSettings, type ReaderSettings } from '../../web/lib/reader-settings';
import { parseLength, type PrayerLength } from '../../web/lib/prayer-time';
import { dailyWordDate, type DailyWord } from '../../web/lib/daily-word';

export type Lang = 'en' | 'fr';
import { api } from './api';
export { api } from './api';

// ---- Preferences (this device only) ----
type Appearance = 'system' | 'light' | 'dark';
type Prefs = { appearance: Appearance; lang: Lang | null; length: PrayerLength; reader: ReaderSettings; bibleLocale: Lang | null; chapterId: string | null };
const PREFS_KEY = 'lifebook.prefs';
const DEFAULT_PREFS: Prefs = { appearance: 'system', lang: null, length: 5, reader: DEFAULT_READER, bibleLocale: null, chapterId: null };
const deviceLang = (): Lang => (Intl.DateTimeFormat().resolvedOptions().locale || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';

type AppValue = {
  prefs: Prefs; setPrefs: (patch: Partial<Prefs>) => void;
  lang: Lang; t: Copy; c: Palette; dark: boolean; bibleLocale: Lang;
};
const AppContext = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [prefs, setState] = useState<Prefs>(DEFAULT_PREFS);
  useEffect(() => {
    SecureStore.getItemAsync(PREFS_KEY).then(raw => {
      if (!raw) return;
      try {
        const v = JSON.parse(raw) as Partial<Prefs>;
        setState({
          appearance: v.appearance === 'light' || v.appearance === 'dark' ? v.appearance : 'system',
          lang: v.lang === 'en' || v.lang === 'fr' ? v.lang : null,
          length: parseLength(String(v.length ?? '')),
          reader: parseReaderSettings(JSON.stringify(v.reader ?? null)),
          bibleLocale: v.bibleLocale === 'en' || v.bibleLocale === 'fr' ? v.bibleLocale : null,
          chapterId: typeof v.chapterId === 'string' && /^[1-3]?[A-Z]{2,3}\.\d{1,3}$/.test(v.chapterId) ? v.chapterId : null,
        });
      } catch { /* defaults */ }
    }).catch(() => undefined);
  }, []);
  const setPrefs = useCallback((patch: Partial<Prefs>) => setState(prev => {
    const next = { ...prev, ...patch };
    SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next)).catch(() => undefined);
    return next;
  }), []);
  const value = useMemo(() => {
    const lang = prefs.lang ?? deviceLang();
    const dark = prefs.appearance === 'system' ? scheme === 'dark' : prefs.appearance === 'dark';
    return { prefs, setPrefs, lang, t: copy[lang], c: dark ? palettes.dark : palettes.light, dark, bibleLocale: prefs.bibleLocale ?? lang };
  }, [prefs, setPrefs, scheme]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const v = useContext(AppContext);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

// ---- Sign-in: Clerk when configured, otherwise a signed-out stand-in ----
export type Session = { ready: boolean; isSignedIn: boolean; userId: string | null; firstName: string | null; getToken: () => Promise<string | null>; signIn: () => Promise<void>; signOut: () => Promise<void> };
export const SessionContext = createContext<Session>({ ready: true, isSignedIn: false, userId: null, firstName: null, getToken: async () => null, signIn: async () => { throw new Error('Sign-in is not configured'); }, signOut: async () => undefined });
export const useSession = () => useContext(SessionContext);

// ---- Today's Word, shared by Today and the prayer time ----
type WordState = { word: DailyWord | null; loading: boolean; error: string; date: string; retry: () => void };
const WordContext = createContext<WordState>({ word: null, loading: true, error: '', date: '', retry: () => undefined });
export function DailyWordProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useApp();
  const [date, setDate] = useState(dailyWordDate());
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; word: DailyWord | null; error: string }>({ key: '', word: null, error: '' });
  const key = `${lang}:${date}:${attempt}`;
  useEffect(() => { const timer = setInterval(() => setDate(dailyWordDate()), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let active = true;
    api<DailyWord>(`/meditations/daily-word/today?locale=${lang}&date=${date}`)
      .then(word => { if (active) setState({ key, word, error: '' }); })
      .catch(e => { if (active) setState({ key, word: null, error: e instanceof Error ? e.message : 'Unavailable' }); });
    return () => { active = false; };
  }, [key, lang, date]);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  const value = useMemo(() => state.key === key ? { word: state.word, loading: false, error: state.error, date, retry } : { word: null, loading: true, error: '', date, retry }, [state, key, date, retry]);
  return <WordContext.Provider value={value}>{children}</WordContext.Provider>;
}
export const useDailyWord = () => useContext(WordContext);

export type TodaySession = { id: string; journeyDate: string; status: 'IN_PROGRESS' | 'COMPLETED'; steps: { step: string }[]; reflection: { content: string } | null };
export const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
