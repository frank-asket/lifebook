'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { readingApi } from '../../lib/bible-reading-api';
/** Mount in the existing BibleReader after a chapter is successfully loaded.
 * Uses authenticated user only; reading remains available without sign-in.
 */
export function ReadingTracker({ locale, chapterId }: { locale: 'en' | 'fr'; chapterId: string }) {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    if (!isSignedIn || !/^[A-Z0-9]{3}\.[1-9][0-9]{0,2}$/.test(chapterId)) return;
    let cancelled = false;
    getToken().then(token => { if (!cancelled && token) return readingApi.save(token, locale, chapterId); }).catch(() => { /* reading must remain functional when tracking is unavailable */ });
    return () => { cancelled = true; };
  }, [locale, chapterId, isSignedIn, getToken]);
  return null;
}
