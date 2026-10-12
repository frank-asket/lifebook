'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { api } from '../../../lib/api';
import { MeditationView, type Meditation } from '../../../components/meditation-view';
export default function MeditationDetailPage() {
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
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load meditation.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  return <Shell title="Meditation"><div className="meditation-page">
    {loading ? <section className="meditation-status-card" role="status"><div className="meditation-loading-mark" />Loading meditation…</section>
      : error ? <section className="meditation-status-card" role="alert"><h2>Unable to open meditation</h2><p>{error}</p><Link href="/meditation">Return to Daily Meditation</Link></section>
      : item ? <MeditationView meditation={item} /> : null}
  </div></Shell>;
}
