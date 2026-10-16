'use client';
import {useLanguage} from '../../components/language-provider';

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

export default function DailyMeditationPage() { const {language}=useLanguage(); const tr=(en:string,fr:string)=>language==='fr'?fr:en;
  const [state, setState] = useState<PageState>({ item: null, loading: true, error: '' });
  const locale = language;
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
    <Shell title={tr('Daily Bible Meditation','Méditation biblique quotidienne')}>
      <div className="meditation-page">
        <header className="meditation-page-header">
          <div>
            <span className="meditation-kicker"><BookOpen size={15} /> {tr('YOUR DAILY MOMENT','VOTRE MOMENT QUOTIDIEN')}</span>
            <h1>{tr('Make room for the Word.','Faites place à la Parole.')}</h1>
            <p>{tr('Read Scripture, reflect at your own pace, and respond in prayer.','Lisez les Écritures, méditez à votre rythme et répondez par la prière.')}</p>
          </div>

        </header>

        <div className="meditation-steps" aria-label={tr('Meditation steps','Étapes de méditation')}>
          <span><BookOpen size={17} /> {tr('Read','Lire')}</span><span><Heart size={17} /> {tr('Reflect','Méditer')}</span><span><CalendarDays size={17} /> {tr('Pray','Prier')}</span>
        </div>

        {state.loading && (
          <section className="meditation-status-card" role="status" aria-live="polite">
            <div className="meditation-loading-mark" aria-hidden="true" />
            <h2>{tr('Preparing your meditation…','Préparation de votre méditation…')}</h2>
            <p>{tr("Finding today's Scripture reflection.",'Recherche de la réflexion biblique du jour.')}</p>
          </section>
        )}
        {!state.loading && state.error && (
          <section className="meditation-status-card" role="alert">
            <AlertCircle size={30} aria-hidden="true" />
            <h2>{tr("We couldn't load your meditation",'Impossible de charger votre méditation')}</h2>
            <p>{state.error}</p>
            <button className="btn-primary" type="button" onClick={refresh}><RefreshCw size={17} /> {tr('Try again','Réessayer')}</button>
          </section>
        )}
        {!state.loading && !state.error && state.item && (
          <>
            <MeditationView headingLevel="h2" key={state.item.id} meditation={state.item} />
            <div className="meditation-bottom-actions">
              <button className="btn-outline" type="button" onClick={refresh}><RefreshCw size={16} /> {tr('Refresh','Actualiser')}</button>
              <Link href="/meditation/history">{tr('Meditation history','Historique des méditations')} <ArrowRight size={16} /></Link>
            </div>
          </>
        )}
        {!state.loading && !state.error && !state.item && (
          <section className="meditation-status-card">
            <BookOpen size={32} aria-hidden="true" />
            <h2>{tr('Today’s meditation is being prepared','La méditation du jour se prépare')}</h2>
            <p>{tr('There is not a published meditation in this language yet. Please check back soon.','Aucune méditation n’est encore publiée dans cette langue. Revenez bientôt.')}</p>
            <div className="meditation-bottom-actions"><button className="btn-primary" onClick={refresh}>{tr('Check again','Actualiser')}</button><Link href="/dashboard">{tr('Return home','Retour à l’accueil')} <ArrowRight size={16} /></Link></div>
          </section>
        )}
      </div>
    </Shell>
  );
}
