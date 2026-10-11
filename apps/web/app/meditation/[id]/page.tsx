'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '../../../components/shell';
import { api } from '../../../lib/api';
import { MeditationView, type Meditation } from '../../../components/meditation-view';
export default function MeditationDetailPage() {
    const { id } = useParams<{ id: string }>(); const [item, setItem] = useState<Meditation | null>(null); const [error, setError] = useState('');
    useEffect(() => { if (id) api<Meditation>(`/meditations/${encodeURIComponent(id)}`).then(setItem).catch(e => setError(e.message)); }, [id]);
    return <Shell title="Meditation">{error ? <p role="alert">{error}</p> : item ? <MeditationView meditation={item} /> : <p>Loading meditation…</p>}</Shell>;
}
