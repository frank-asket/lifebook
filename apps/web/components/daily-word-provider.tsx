'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { dailyWordDate, type DailyWord } from '../lib/daily-word';
import { useLanguage } from './language-provider';
import { errorMessage } from '../lib/errors';

const DailyWordContext = createContext<{ word: DailyWord | null; loading: boolean; error: string; date: string; retry: () => void }>({ word: null, loading: true, error: '', date: '', retry: () => {} });
export function DailyWordProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [date, setDate] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; word: DailyWord | null; loading: boolean; error: string }>({ key: '', word: null, loading: true, error: '' });
  const key = `${language}:${date}`;
  useEffect(() => {
    const update = () => setDate(dailyWordDate());
    update();
    const timer = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    setState({ key, word: null, loading: true, error: '' });
    api<DailyWord>(`/meditations/daily-word/today?locale=${language}&date=${date}`, null, { signal: controller.signal })
      .then(word => { if (!controller.signal.aborted) setState({ key, word, loading: false, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setState({ key, word: null, loading: false, error: errorMessage(error, language) }); });
    return () => controller.abort();
  }, [key, date, language, attempt]);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  const value = useMemo(() => {
    const current = state.key === key ? state : { word: null, loading: true, error: '' };
    return { word: current.word, loading: current.loading, error: current.error, date, retry };
  }, [state, key, date, retry]);
  return <DailyWordContext.Provider value={value}>{children}</DailyWordContext.Provider>;
}
export const useDailyWord = () => useContext(DailyWordContext);
