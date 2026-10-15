'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { readingApi } from '../../lib/bible-reading-api';
/** Record successfully opened chapters without blocking Scripture when tracking fails. */
export function ReadingTracker({ locale, chapterId }: { locale: 'en' | 'fr'; chapterId: string }) {
  const { getToken, isSignedIn, userId } = useAuth();
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setFailed(false);
    if (!isSignedIn || !/^[A-Z0-9]{3}\.[1-9][0-9]{0,2}$/.test(chapterId)) return;
    let cancelled = false;
    getToken().then(token => {
      if (cancelled) return;
      if (!token) throw new Error('Session unavailable');
      return readingApi.save(token, locale, chapterId);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [locale, chapterId, isSignedIn, userId, getToken, retry]);
  if (!failed || !isSignedIn) return null;
  return <div className="notice reader-error" role="status"><span>{locale === 'fr' ? 'Votre position n’a pas été enregistrée. Vous pouvez continuer à lire.' : 'Your place could not be saved. You can keep reading.'}</span><button className="btn btn-soft btn-sm" type="button" onClick={() => setRetry(n => n + 1)}>{locale === 'fr' ? 'Réessayer' : 'Try again'}</button></div>;
}
