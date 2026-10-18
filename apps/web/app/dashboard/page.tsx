'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { ArrowRight, Check, GraduationCap, HeartHandshake } from 'lucide-react';
import { ContinueReading } from '../../components/bible/ContinueReading';
import { useDailyWord } from '../../components/daily-word-provider';
import { useLanguage } from '../../components/language-provider';
import { Shell } from '../../components/shell';
import { api, type ProfileResponse, type LearningPath } from '../../lib/api';
import { DAILY_WORD_STEPS } from '../../lib/daily-word-navigation';
import { parseLength } from '../../lib/prayer-time';
import { calendarDay, greeting } from '../../lib/scripture';

type TodaySession = { status: 'IN_PROGRESS' | 'COMPLETED'; steps: { step: string }[] };

export default function Dashboard() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { word, loading: wordLoading, error: wordError, date, retry: retryWord } = useDailyWord();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [today, setToday] = useState<TodaySession | null>(null);
  const [minutes, setMinutes] = useState(5);
  const [hour, setHour] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { setHour(new Date().getHours()); try { setMinutes(parseLength(localStorage.getItem('lifebook.prayerLength'))); } catch { /* storage unavailable */ } }, []);
  useEffect(() => {
    let active = true; setError(''); setProfile(null); setPaths([]);
    (async () => {
      const token = await getToken();
      const [p, published] = await Promise.allSettled([api<ProfileResponse>('/me/profile', token), api<LearningPath[]>('/paths')]);
      if (!active) return;
      if (p.status === 'fulfilled') setProfile(p.value); else setError(tr('We could not load your preferences. Please try again.', 'Impossible de charger vos préférences. Réessayez.'));
      if (published.status === 'fulfilled') setPaths(published.value);
    })();
    return () => { active = false; };
  }, [getToken, language, retry]);
  useEffect(() => {
    if (!isSignedIn || !date) return;
    let active = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    getToken().then(token => token ? api<TodaySession>(`/daily-word/sessions/today?timezone=${encodeURIComponent(timezone)}`, token) : null)
      .then(session => { if (active) setToday(session); }).catch(() => undefined);
    return () => { active = false; };
  }, [getToken, isSignedIn, date]);

  const done = DAILY_WORD_STEPS.map(step => Boolean(today?.steps.some(s => s.step === step)));
  const doneCount = done.filter(Boolean).length;
  const completed = today?.status === 'COMPLETED';
  const name = user?.firstName ? `, ${user.firstName}` : '';
  return <Shell title={tr('Home', 'Accueil')}>
    <header className="home-head">
      <span className="eyebrow">{date ? calendarDay(date, language) : ' '}</span>
      <h1 className="page-heading">{hour === null ? tr('Welcome back', 'Bon retour') : greeting(hour, language)}{name}</h1>
    </header>
    {error && <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>}
    {profile && !profile.profile && <p className="notice home-notice">{tr('Your journey is yours to shape.', 'Votre parcours vous appartient.')} <Link className="text-link" href="/onboarding">{tr('Personalize LifeBook', 'Personnaliser LifeBook')} →</Link></p>}

    <div className="home-grid">
      <section className="card home-today" aria-labelledby="home-today-title">
        <div className="home-today-meta">
          <h2 id="home-today-title" className="eyebrow">{tr('Today’s Word', 'Parole du jour')}</h2>
          <span className="home-minutes">{completed ? <><Check size={14} aria-hidden="true" /> {tr('Done today', 'Fait aujourd’hui')}</> : tr(`About ${minutes} min`, `Environ ${minutes} min`)}</span>
        </div>
        {word ? <>
          <blockquote className="home-verse">{word.verse.text}</blockquote>
          <p className="home-reference">{word.verse.reference}<span> · {word.verse.translation}</span></p>
        </> : wordError ? <div className="home-verse-missing"><p>{tr('Today’s Word could not be loaded.', 'Impossible de charger la Parole du jour.')}</p><button className="btn btn-soft btn-sm" onClick={retryWord}>{tr('Try again', 'Réessayer')}</button></div>
          : <div aria-busy={wordLoading}><span className="skeleton home-skeleton" /><span className="skeleton home-skeleton short" /></div>}
        <div className="home-today-foot">
          <Link className="btn btn-primary" href="/daily-word">{completed ? tr('Pray again', 'Prier à nouveau') : doneCount ? tr('Continue prayer time', 'Reprendre le temps de prière') : tr('Begin prayer time', 'Commencer le temps de prière')} <ArrowRight size={16} aria-hidden="true" /></Link>
          {today && <span className="home-steps" role="img" aria-label={tr(`${doneCount} of 5 steps done`, `${doneCount} étapes sur 5 terminées`)}>{done.map((d, i) => <span key={i} className={d ? 'done' : ''} />)}</span>}
        </div>
      </section>

      <div className="home-side">
        <ContinueReading locale={language} compact />
        <Link className="card home-link" href="/prayer">
          <span className="home-link-icon rose"><HeartHandshake size={20} aria-hidden="true" /></span>
          <span><strong>{tr('Prayer journal', 'Journal de prière')}</strong><small>{tr('Bring what is on your heart. Private and encrypted.', 'Confiez ce qui vous tient à cœur. Privé et chiffré.')}</small></span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>

    {paths.length > 0 && <section className="home-paths" aria-labelledby="home-paths-title">
      <div className="section-title"><h2 id="home-paths-title">{tr('Discipleship pathways', 'Parcours de disciple')}</h2><Link className="text-link" href="/discipleship">{tr('View all', 'Tout voir')} →</Link></div>
      <div className="home-path-list">{paths.slice(0, 3).map(p => <Link className="card home-link" key={p.id} href="/discipleship"><span className="home-link-icon"><GraduationCap size={20} aria-hidden="true" /></span><span><strong>{p.title}</strong><small>{p.description || tr('Explore this pathway', 'Découvrir ce parcours')}</small></span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div>
    </section>}
  </Shell>;
}
