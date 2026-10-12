'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, RefreshCw, CalendarDays, Heart, ArrowRight, AlertCircle } from 'lucide-react';
import { Shell } from '../../components/shell';
import { api } from '../../lib/api';
import { MeditationView, type Meditation } from '../../components/meditation-view';

type PageState = { item: Meditation | null; loading: boolean; error: string };

function isMeditation(value: unknown): value is Meditation {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return typeof m.id === 'string' && typeof m.title === 'string'
    && typeof m.scriptureReference === 'string' && typeof m.explanation === 'string'
    && typeof m.guidedPrayer === 'string' && Array.isArray(m.questions);
}

export default function DailyMeditationPage() {
  const [state, setState] = useState<PageState>({ item: null, loading: true, error: '' });
  const [locale, setLocale] = useState<'en' | 'fr'>('en');
  const [retry, setRetry] = useState(0);

  const loadMeditation = useCallback(async (signal: AbortSignal) => {
    setState({ item: null, loading: true, error: '' });
    try {
      const result = await api<unknown>(`/meditations/today?locale=${locale}`, null, { signal });
      if (signal.aborted) return;
      // NestJS returns a single meditation or null. Don't silently accept an unrelated response.
      if (result !== null && !isMeditation(result)) {
        throw new Error('The meditation data is incomplete. Please contact LifeBook support.');
      }
      setState({ item: result as Meditation | null, loading: false, error: '' });
    } catch (error) {
      if (signal.aborted) return;
      setState({ item: null, loading: false, error: error instanceof Error ? error.message : 'Unable to load today’s meditation.' });
    }
  }, [locale]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMeditation(controller.signal);
    return () => controller.abort();
  }, [loadMeditation, retry]);

  const refresh = () => setRetry(value => value + 1);

  return (
    <Shell title="Daily Bible Meditation">
      <div className="meditation-page">
        <header className="meditation-page-header">
          <div>
            <span className="meditation-kicker"><BookOpen size={15} /> YOUR DAILY MOMENT</span>
            <h1>Make room for the Word.</h1>
            <p>Read Scripture, reflect at your own pace, and respond in prayer.</p>
          </div>
          <label className="meditation-language">Language
            <select aria-label="Meditation language" value={locale} onChange={e => setLocale(e.target.value as 'en' | 'fr')}>
              <option value="en">English</option><option value="fr">Français</option>
            </select>
          </label>
        </header>

        <div className="meditation-steps" aria-label="Meditation steps">
          <span><BookOpen size={17} /> Read</span><span><Heart size={17} /> Reflect</span><span><CalendarDays size={17} /> Pray</span>
        </div>

        {state.loading && (
          <section className="meditation-status-card" role="status" aria-live="polite">
            <div className="meditation-loading-mark" aria-hidden="true" />
            <h2>Preparing your meditation…</h2>
            <p>Finding today's Scripture reflection.</p>
          </section>
        )}
        {!state.loading && state.error && (
          <section className="meditation-status-card" role="alert">
            <AlertCircle size={30} aria-hidden="true" />
            <h2>We couldn't load your meditation</h2>
            <p>{state.error}</p>
            <button className="btn-primary" type="button" onClick={refresh}><RefreshCw size={17} /> Try again</button>
          </section>
        )}
        {!state.loading && !state.error && state.item && (
          <>
            <MeditationView key={state.item.id} meditation={state.item} />
            <div className="meditation-bottom-actions">
              <button className="btn-outline" type="button" onClick={refresh}><RefreshCw size={16} /> Refresh</button>
              <Link href="/meditation/history">Meditation history <ArrowRight size={16} /></Link>
            </div>
          </>
        )}
        {!state.loading && !state.error && !state.item && (
          <section className="meditation-status-card">
            <BookOpen size={32} aria-hidden="true" />
            <h2>Today's meditation is being prepared</h2>
            <p>There isn't a published meditation in this language yet. Please check back soon.</p>
            <div className="meditation-bottom-actions"><button className="btn-primary" onClick={refresh}>Check again</button><Link href="/dashboard">Return home <ArrowRight size={16} /></Link></div>
          </section>
        )}
      </div>
    </Shell>
  );
}
