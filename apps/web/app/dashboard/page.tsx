'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { ArrowRight, Check, GraduationCap, HeartHandshake } from 'lucide-react';
import { ContinueReading } from '../../components/bible/ContinueReading';
import { useDailyWord } from '../../components/daily-word-provider';
import { useLanguage } from '../../components/language-provider';
import { Shell } from '../../components/shell';
import { Announcements } from '../../components/Announcement';
import { Suggestions } from '../../components/Suggestions';
import { reportScripture } from '../../lib/fums';
import { api, type ProfileResponse, type LearningPath } from '../../lib/api';
import { DAILY_WORD_STEPS } from '../../lib/daily-word-navigation';
import { parseLength } from '../../lib/prayer-time';
import { calendarDay, greeting, lastSevenDays, type DayMark } from '../../lib/scripture';

type HomeSummary = { prayer: { total: number; awaiting: number; answered: number }; studies: { id: string; title: string; locale: string }[]; paths: { id: string; title: string }[]; reading: { chapterId: string; locale: string } | null };
type TodaySession = { journeyDate: string; status: 'IN_PROGRESS' | 'COMPLETED'; steps: { step: string }[] };

export default function Dashboard() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { word, loading: wordLoading, error: wordError, date, retry: retryWord } = useDailyWord();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [today, setToday] = useState<TodaySession | null>(null);
  const [recent, setRecent] = useState<TodaySession[] | null>(null);
  const [minutes, setMinutes] = useState(5);
  const [hour, setHour] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [weekFailed, setWeekFailed] = useState(false);
  const [weekRetry, setWeekRetry] = useState(0);
  useEffect(() => { setHour(new Date().getHours()); try { setMinutes(parseLength(localStorage.getItem('lifebook.prayerLength'))); } catch { /* storage unavailable */ } }, []);
  useEffect(() => {
    let active = true; setError(''); setProfile(null); setPaths([]); setSummaryError(false); setSummary(null);
    (async () => {
      const token = await getToken();
      const [p, published, home] = await Promise.allSettled([api<ProfileResponse>('/me/profile', token), api<LearningPath[]>('/paths'), token ? api<HomeSummary>('/me/home', token) : Promise.reject(new Error('Sign in required'))]);
      if (!active) return;
      if (p.status === 'fulfilled') setProfile(p.value); else setError(tr('We could not load your preferences. Please try again.', 'Impossible de charger vos préférences. Réessayez.'));
      if (published.status === 'fulfilled') setPaths(published.value);
      if (home.status === 'fulfilled') setSummary(home.value); else setSummaryError(true);
    })();
    return () => { active = false; };
  }, [getToken, language, retry]);
  useEffect(() => {
    if (!isSignedIn || !date) return;
    let active = true; setWeekFailed(false);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    getToken().then(async token => {
      if (!token) return;
      const session = await api<TodaySession>(`/daily-word/sessions/today?timezone=${encodeURIComponent(timezone)}`, token);
      if (active) setToday(session);
      const history = await api<TodaySession[]>('/daily-word/sessions?limit=7', token);
      if (active) setRecent(history);
    }).catch(() => { if (active) setWeekFailed(true); });
    return () => { active = false; };
  }, [getToken, isSignedIn, date, weekRetry]);

  useEffect(() => { if (word) reportScripture(`word:${language}:${word.date}`, word.verse.fumsToken); }, [word, language]);
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

    <div className="bento bento-home">
      <section className="card home-today bento-4 bento-tall" aria-labelledby="home-today-title">
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

      <div className="bento-cell bento-2"><ContinueReading locale={language} compact /></div>
      {recent && date ? <WeekRhythm days={lastSevenDays(date, language, recent.map(s => s.journeyDate.slice(0, 10) === date && today ? today : s))} language={language} />
        : weekFailed ? <section className="card bento-tile bento-2" aria-labelledby="home-week-title"><div className="bento-head"><h2 id="home-week-title">{tr('Your week in the Word', 'Votre semaine dans la Parole')}</h2></div><p className="bento-note">{tr('Your week could not be loaded.', 'Impossible de charger votre semaine.')}</p><div className="bento-foot"><button className="btn btn-soft btn-sm" onClick={() => setWeekRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div></section>
        : isSignedIn && <div className="card bento-tile bento-2" aria-busy="true"><span className="skeleton bento-skeleton short" /><span className="skeleton bento-skeleton" /><span className="skeleton bento-skeleton" /></div>}

      <section className="card bento-tile bento-2" aria-labelledby="home-prayer-title">
        <div className="bento-head"><h2 id="home-prayer-title">{tr('Prayer Sanctuary', 'Sanctuaire de prière')}</h2><span className="home-link-icon rose"><HeartHandshake size={18} aria-hidden="true" /></span></div>
        {summaryError ? <p className="bento-note">{tr('Your prayers could not be counted right now.', 'Impossible de compter vos prières pour le moment.')}</p>
          : !summary ? <div aria-busy="true"><span className="skeleton bento-skeleton" /><span className="skeleton bento-skeleton short" /></div>
          : summary.prayer.total === 0 ? <p className="bento-note">{tr('Bring what is on your heart. Private and encrypted.', 'Confiez ce qui vous tient à cœur. Privé et chiffré.')}</p>
          : <dl className="bento-stats">
            <div className="bento-stat"><dt>{tr('Awaiting', 'En attente')}</dt><dd>{summary.prayer.awaiting}</dd></div>
            <div className="bento-stat"><dt>{tr('Answered', 'Exaucées')}</dt><dd>{summary.prayer.answered}</dd></div>
          </dl>}
        <div className="bento-foot">
          {summaryError && <button className="btn btn-soft btn-sm" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button>}
          <Link className="btn btn-outline btn-sm" href="/prayer">{tr('Open prayer journal', 'Ouvrir le journal')} <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="card bento-tile bento-2" aria-labelledby="home-continue-title">
        <div className="bento-head"><h2 id="home-continue-title">{tr('Continue your journey', 'Poursuivre votre parcours')}</h2><span className="home-link-icon"><GraduationCap size={18} aria-hidden="true" /></span></div>
        {summaryError ? <><p className="bento-note">{tr('Your personal overview is unavailable.', 'Votre aperçu personnel est indisponible.')}</p><div className="bento-foot"><button className="btn btn-soft btn-sm" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div></>
          : !summary ? <div aria-busy="true"><span className="skeleton bento-skeleton" /><span className="skeleton bento-skeleton" /><span className="skeleton bento-skeleton short" /></div>
          : summary.studies.length + summary.paths.length === 0 ? <><p className="bento-note">{tr('One small step is enough for today. Start a Bible study when you are ready.', 'Un petit pas suffit pour aujourd’hui. Commencez une étude biblique quand vous le souhaitez.')}</p><div className="bento-foot"><Link className="btn btn-outline btn-sm" href="/bible">{tr('Browse Bible studies', 'Voir les études bibliques')}</Link></div></>
          : <ul className="bento-list">
            {summary.studies.slice(0, 3).map(study => <li key={study.id}><Link href={`/bible/${encodeURIComponent(study.id)}`}><span>{study.title}<small>{tr('Bible Study', 'Étude biblique')}</small></span><ArrowRight size={16} aria-hidden="true" /></Link></li>)}
            {summary.paths.slice(0, Math.max(0, 4 - Math.min(3, summary.studies.length))).map(path => <li key={path.id}><Link href={`/discipleship/${encodeURIComponent(path.id)}`}><span>{path.title}<small>{tr('Discipleship', 'Parcours')}</small></span><ArrowRight size={16} aria-hidden="true" /></Link></li>)}
          </ul>}
      </section>

      <section className="card bento-tile bento-2" aria-labelledby="home-paths-title">
        <div className="bento-head"><h2 id="home-paths-title">{tr('Discipleship pathways', 'Parcours de disciple')}</h2><span className="home-link-icon"><GraduationCap size={18} aria-hidden="true" /></span></div>
        {paths.length > 0 ? <ul className="bento-list">{paths.slice(0, 3).map(p => <li key={p.id}><Link href={`/discipleship/${encodeURIComponent(p.id)}`}><span>{p.title}</span><ArrowRight size={16} aria-hidden="true" /></Link></li>)}</ul>
          : <p className="bento-note">{tr('Explore the foundations of faith, one lesson at a time.', 'Explorez les fondements de la foi, une leçon après l’autre.')}</p>}
        <div className="bento-foot"><Link className="btn btn-outline btn-sm" href="/discipleship">{tr('View all pathways', 'Voir tous les parcours')} <ArrowRight size={14} aria-hidden="true" /></Link></div>
      </section>
    </div>

    <Suggestions />
    <Announcements />
  </Shell>;
}

/** A quiet look back at the last seven days. Deliberately no streak count: a missed day is just an empty circle. */
function WeekRhythm({ days, language }: { days: DayMark[]; language: 'en' | 'fr' }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const count = days.filter(d => d.state !== 'none').length;
  const status = (d: DayMark) => d.state === 'done' ? tr('prayer time finished', 'temps de prière terminé') : d.state === 'started' ? tr('prayer time started', 'temps de prière commencé') : tr('no prayer time', 'pas de temps de prière');
  return <section className="card home-week bento-tile bento-2" aria-labelledby="home-week-title">
    <h2 id="home-week-title">{tr('Your week in the Word', 'Votre semaine dans la Parole')}</h2>
    <ol className="home-week-days">{days.map(d => <li key={d.date} className={`${d.state}${d.today ? ' today' : ''}`}>
      <span className="home-week-dot" aria-hidden="true">{d.state === 'done' && <Check size={13} />}</span>
      <span aria-hidden="true">{d.label}</span>
      <span className="sr-only">{d.name}: {status(d)}</span>
    </li>)}</ol>
    <p>{count === 0 ? tr('Each day is a fresh start.', 'Chaque jour est un nouveau départ.') : count === 1 ? tr('One day with the Word this week.', 'Un jour avec la Parole cette semaine.') : tr(`${count} days with the Word this week.`, `${count} jours avec la Parole cette semaine.`)}</p>
  </section>;
}
