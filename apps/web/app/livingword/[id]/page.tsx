'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
import type { Teaching } from '../../../lib/livingword';
export default function TeachingPage() {
  const { id } = useParams<{ id: string }>(); const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [item, setItem] = useState<Teaching | null>(null); const [error, setError] = useState(''); const [mediaError, setMediaError] = useState(false); const [waiting, setWaiting] = useState(false); const [retry, setRetry] = useState(0);
  useEffect(() => { const controller = new AbortController(); setItem(null); setError(''); setMediaError(false); api<Teaching>(`/livingword/${encodeURIComponent(id)}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setItem(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, language)); }); return () => controller.abort(); }, [id, language, retry]);
  const media = { src: item?.mediaUrl, controls: true, preload: 'none', onError: () => { setMediaError(true); setWaiting(false); }, onWaiting: () => setWaiting(true), onCanPlay: () => setWaiting(false), onPlaying: () => setWaiting(false), 'aria-label': item?.title } as const;
  return <Shell title="LivingWord"><Link className="text-link" href="/livingword">← {tr('All teachings', 'Tous les enseignements')}</Link>
    {error ? <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div> : !item ? <p role="status" className="notice">{tr('Loading teaching…', 'Chargement de l’enseignement…')}</p> : <article className="card learning-progress"><h1 className="page-heading">{item.title}</h1><p>{item.speaker} · {item.locale.toUpperCase()}</p><p className="subheading">{item.description}</p>
      {item.kind === 'video' ? <video key={`${id}:${retry}`} {...media} className="livingword-player" playsInline /> : <audio key={`${id}:${retry}`} {...media} className="livingword-player" />}
      {waiting ? <p role="status">{tr('Buffering…', 'Chargement du média…')}</p> : null}
      {mediaError ? <div role="alert" className="alert reader-error"><span>{tr('Playback failed. Check your connection and try again.', 'La lecture a échoué. Vérifiez votre connexion et réessayez.')}</span><button className="btn btn-soft" onClick={() => { setMediaError(false); setRetry(n => n + 1); }}>{tr('Retry playback', 'Réessayer la lecture')}</button></div> : null}
      <p className="notice">{item.attribution}</p>
      <h2>{tr('Transcript', 'Transcription')}</h2><div className="learning-content">{item.transcript}</div>
      {item.kind === 'video' ? <p className="muted">{tr('Use the player’s subtitle control when captions are provided by the publisher.', 'Utilisez les sous-titres du lecteur lorsqu’ils sont fournis par l’éditeur.')}</p> : null}
    </article>}
  </Shell>;
}
