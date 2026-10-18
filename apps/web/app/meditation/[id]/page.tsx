'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {useLanguage} from '../../../components/language-provider';
import { Shell } from '../../../components/shell';
import { api } from '../../../lib/api';
import { MeditationView, type Meditation } from '../../../components/meditation-view';
import { errorMessage } from '../../../lib/errors';
export default function MeditationDetailPage() {
  const {language}=useLanguage();const tr=(en:string,fr:string)=>language==='fr'?fr:en;
  const [retry,setRetry]=useState(0);
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Meditation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setItem(null); setError(''); setLoading(true);
    api<Meditation>(`/meditations/${encodeURIComponent(id)}`, null, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setItem(value); })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, language)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id,retry]);
  return <Shell title={tr("Meditation","Méditation")}><div className="meditation-page"><h1 className="page-heading">{tr("Meditation","Méditation")}</h1>
    {loading ? <section className="meditation-status-card" role="status"><div className="meditation-loading-mark" />{tr("Loading meditation…","Chargement de la méditation…")}</section>
      : error ? <section className="meditation-status-card" role="alert"><h2>{tr("Unable to open meditation","Impossible de charger la méditation")}</h2><p>{error}</p><button className="btn btn-primary" onClick={()=>setRetry(n=>n+1)}>{tr("Try again","Réessayer")}</button> <Link className="btn btn-soft" href="/meditation">{tr("Return to Daily Meditation","Retour à la méditation du jour")}</Link></section>
      : item ? <MeditationView headingLevel="h2" meditation={item} /> : null}
  </div></Shell>;
}
