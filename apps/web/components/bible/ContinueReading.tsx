'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { readingApi, type ReadingHistory } from '../../lib/bible-reading-api';
import { passageLabel } from '../../lib/scripture';

/** "compact" is the home-page row: it also offers a way into the Bible when nothing has been read yet. */
export function ContinueReading({ locale, compact = false }: { locale: 'en' | 'fr'; compact?: boolean }) {
  const { getToken, isSignedIn, userId } = useAuth();
  const [item, setItem] = useState<ReadingHistory | null>(null);
  const [loadedFor, setLoadedFor] = useState<string>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const tr = (en: string, fr: string) => locale === 'fr' ? fr : en;
  useEffect(() => {
    let active = true; setItem(null); setError(false); setLoadedFor(undefined);
    if (!isSignedIn) return;
    getToken().then(token => { if (!token) throw new Error('Session unavailable'); return readingApi.latest(token); }).then(value => { if (active) { setItem(value); setLoadedFor(userId ?? undefined); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [getToken, isSignedIn, userId, retry]);
  if (!isSignedIn && !compact) return null;
  if (error) return <div className="notice reader-error" role="status"><span>{tr('Your recent reading could not be loaded.', 'Impossible de charger votre lecture récente.')}</span><button className="btn btn-soft btn-sm" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>;
  const ready = loadedFor === userId;
  if (compact) {
    const href = item ? `/bible/read?locale=${item.locale}&chapter=${encodeURIComponent(item.chapterId)}` : `/bible/read?locale=${locale}`;
    return <Link className="card home-link" href={href} aria-busy={isSignedIn && !ready}>
      <span className="home-link-icon"><BookOpen size={20} aria-hidden="true" /></span>
      <span><strong>{item ? tr('Continue reading', 'Reprendre la lecture') : tr('Read the Bible', 'Lire la Bible')}</strong>
        <small>{item ? passageLabel(item.chapterId, item.locale, item.verse) : tr('Open any book, one chapter at a time.', 'Ouvrez un livre, un chapitre à la fois.')}</small></span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>;
  }
  if (!item || !ready) return null;
  return <section className="card continue-reading"><div><span className="eyebrow">{tr('RIGHT WHERE YOU LEFT OFF', 'LÀ OÙ VOUS EN ÉTIEZ')}</span><h2>{tr('Continue reading', 'Reprendre la lecture')}</h2><p>{passageLabel(item.chapterId, item.locale, item.verse)}</p></div><Link className="btn btn-primary" href={`/bible/read?locale=${item.locale}&chapter=${encodeURIComponent(item.chapterId)}`}>{tr('Resume reading', 'Continuer')} →</Link></section>;
}
