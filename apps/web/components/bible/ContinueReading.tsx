'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readingApi, type ReadingHistory } from '../../lib/bible-reading-api';
export function ContinueReading({ locale }: { locale: 'en' | 'fr' }) {
  const { getToken, isSignedIn } = useAuth();
  const [item, setItem] = useState<ReadingHistory | null>(null);
  useEffect(() => { let active = true; if (!isSignedIn) return; getToken().then(t => readingApi.latest(t)).then(x => { if (active) setItem(x); }).catch(() => {}); return () => { active = false; }; }, [getToken, isSignedIn]);
  if (!isSignedIn || !item) return null;
  return <section className="card" style={{ padding: 20, marginBottom: 18 }}><h2>{locale === 'fr' ? 'Reprendre la lecture' : 'Continue Reading'}</h2><p>{item.chapterId}{item.verse ? `:${item.verse}` : ''}</p><Link href={`/bible/read?locale=${item.locale}&chapter=${encodeURIComponent(item.chapterId)}`}>{locale === 'fr' ? 'Continuer →' : 'Resume →'}</Link></section>;
}
