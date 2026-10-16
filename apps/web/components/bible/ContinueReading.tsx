'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readingApi, type ReadingHistory } from '../../lib/bible-reading-api';
export function ContinueReading({ locale }: { locale: 'en' | 'fr' }) {
  const { getToken, isSignedIn, userId } = useAuth();
  const [item, setItem] = useState<ReadingHistory | null>(null);
  const [loadedFor, setLoadedFor] = useState<string>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setItem(null); setError(false); setLoadedFor(undefined);
    if (!isSignedIn) return;
    getToken().then(token => { if (!token) throw new Error('Session unavailable'); return readingApi.latest(token); }).then(value => { if (active) { setItem(value); setLoadedFor(userId ?? undefined); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [getToken, isSignedIn, userId, retry]);
  if (!isSignedIn) return null;
  if (error) return <div className="notice reader-error" role="status"><span>{locale === 'fr' ? 'Impossible de charger votre lecture récente.' : 'Your recent reading could not be loaded.'}</span><button className="btn btn-soft btn-sm" onClick={() => setRetry(n => n + 1)}>{locale === 'fr' ? 'Réessayer' : 'Try again'}</button></div>;
  if (!item || loadedFor !== userId) return null;
  return <section className="card continue-reading"><div><span className="eyebrow">{locale === 'fr' ? 'LÀ OÙ VOUS EN ÉTIEZ' : 'RIGHT WHERE YOU LEFT OFF'}</span><h2>{locale === 'fr' ? 'Reprendre la lecture' : 'Continue reading'}</h2><p>{item.chapterId}{item.verse ? `:${item.verse}` : ''}</p></div><Link className="btn btn-primary" href={`/bible/read?locale=${item.locale}&chapter=${encodeURIComponent(item.chapterId)}`}>{locale === 'fr' ? 'Continuer' : 'Resume reading'} →</Link></section>;
}
