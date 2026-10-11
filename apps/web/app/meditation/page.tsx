'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../components/shell';
import { api } from '../../lib/api';
import { MeditationView, type Meditation } from '../../components/meditation/meditation-view';
export default function DailyMeditationPage() {
    const [item, setItem] = useState<Meditation | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    useEffect(() => { api<Meditation | null>('/meditations/today').then(setItem).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
    return <Shell title="Daily Bible Meditation">{loading ? <p>Loading today’s meditation…</p> : error ? <p role="alert">{error}</p> : item ? <MeditationView meditation={item} /> : <div style={{ padding: 32 }}><h1>Today’s meditation is being prepared</h1><p>Come back soon for a new Scripture reflection.</p><Link href="/dashboard">Return to dashboard</Link></div>}</Shell>;
}
