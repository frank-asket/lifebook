'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Inbox, MessagesSquare } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { careApi, statusLabel, topicLabel, waited, type CareSummary, type PastorStatus, type QueueItem } from '../../../lib/care-api';
import { languageLabel } from '../../../lib/pastors-api';

export default function PastorSpace() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { getToken } = useAuth(); const router = useRouter();
  const [status, setStatus] = useState<PastorStatus | null>(null); const [queue, setQueue] = useState<QueueItem[]>([]); const [cases, setCases] = useState<CareSummary[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
  const token = async () => { const value = await getToken(); if (!value) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); return value; };
  useEffect(() => {
    const controller = new AbortController(); setError('');
    (async () => {
      try {
        const t = await token(); const s = await careApi.pastorStatus(t, controller.signal);
        if (controller.signal.aborted) return; setStatus(s);
        if (s.active) { const [q, c] = await Promise.all([careApi.queue(t, controller.signal), careApi.cases(t, controller.signal)]); if (!controller.signal.aborted) { setQueue(q); setCases(c); } }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unavailable'); }
    })();
    return () => controller.abort();
  }, [getToken, reload]);
  const run = async (fn: (t: string) => Promise<unknown>) => { setBusy(true); setError(''); try { await fn(await token()); setReload(n => n + 1); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); } finally { setBusy(false); } };
  const claim = (id: string) => run(async t => { await careApi.claim(t, id); router.push(`/care/pastor/${id}`); });

  return <Shell title={tr('Pastor space', 'Espace pasteur')}>
    <span className="eyebrow">{tr('PASTORAL CARE', 'ACCOMPAGNEMENT PASTORAL')}</span>
    <h1 className="page-heading" style={{ marginTop: 9 }}>{tr('Pastor space', 'Espace pasteur')}</h1>
    {error && <div className="alert reader-error" role="alert" style={{ marginTop: 16 }}><span>{error}</span><button className="btn btn-soft" onClick={() => setReload(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>}
    {!status ? <p role="status">{tr('Loading…', 'Chargement…')}</p> : !status.active
      ? <div className="card status-card" style={{ marginTop: 20 }}><h2>{tr('This space is for verified pastors', 'Cet espace est réservé aux pasteurs vérifiés')}</h2><p>{tr('If you are a pastor in the pilot, LifeBook will activate your account after your verification, training and signed code of conduct.', 'Si vous participez au pilote, LifeBook activera votre compte après votre vérification, votre formation et la signature du code de conduite.')}</p><Link className="btn btn-primary" href="/care">{tr('Go to Ask a pastor', 'Aller à Demander un pasteur')}</Link></div>
      : <>
        <div className="card care-availability" style={{ marginTop: 20 }}>
          <div><h2 style={{ fontSize: 19, margin: 0 }}>{status.displayName}</h2><p className="muted" style={{ margin: '4px 0 0' }}>{status.languages.map(l => languageLabel(l, language)).join(', ')} · {tr(`${status.openCases} of ${status.maxOpenRequests} conversations open`, `${status.openCases} sur ${status.maxOpenRequests} conversations ouvertes`)}</p></div>
          <label className="check-row"><input id="accepting" type="checkbox" checked={status.acceptingRequests} disabled={busy} onChange={e => { const accepting = e.target.checked; void run(t => careApi.setAvailability(t, accepting)); }}/><span>{status.acceptingRequests ? tr('Accepting new requests', 'J’accepte de nouvelles demandes') : tr('Not accepting new requests', 'Je n’accepte pas de nouvelles demandes')}</span></label>
        </div>
        <p className="notice" style={{ marginTop: 14 }}>{tr('If someone may be in immediate danger, tell them to call 112 and alert LifeBook’s safeguarding lead. Refer medical, legal, psychological or abuse concerns to professionals.', 'Si une personne est peut-être en danger immédiat, invitez-la à appeler le 112 et alertez le référent protection de LifeBook. Orientez les questions médicales, juridiques, psychologiques ou d’abus vers des professionnels.')}</p>
        <div className="two-up" style={{ marginTop: 20 }}>
          <section className="card" aria-labelledby="queue-title">
            <h2 id="queue-title" className="icon-line" style={{ fontSize: 19 }}><Inbox size={18} aria-hidden="true"/> {tr('Waiting requests', 'Demandes en attente')}</h2>
            <p className="muted" style={{ fontSize: 13 }}>{tr('You see the message only after you take a request. Take one only if you can reply within 24 hours.', 'Vous voyez le message seulement après avoir pris la demande. Prenez-en une seulement si vous pouvez répondre sous 24 heures.')}</p>
            {!queue.length ? <p className="muted">{tr('No one is waiting right now.', 'Personne n’attend pour le moment.')}</p>
              : <ul className="prayer-list">{queue.map(q => <li key={q.id} className="care-queue-item">
                  <span className="prayer-item-head"><strong>{topicLabel(q.topic, language)}</strong><span className="muted">{waited(q.createdAt, language)}</span></span>
                  <span className="prayer-item-preview">{languageLabel(q.language, language)} · {q.contactPreference === 'callback' ? tr('Asked for a call', 'Souhaite un appel') : tr('Messages', 'Messages')}</span>
                  <button className="btn btn-soft btn-sm" disabled={busy || !status.acceptingRequests || status.openCases >= status.maxOpenRequests} onClick={() => void claim(q.id)}>{tr('Take this request', 'Prendre cette demande')}</button>
                </li>)}</ul>}
          </section>
          <section className="card" aria-labelledby="cases-title">
            <h2 id="cases-title" className="icon-line" style={{ fontSize: 19 }}><MessagesSquare size={18} aria-hidden="true"/> {tr('Your conversations', 'Vos conversations')}</h2>
            {!cases.length ? <p className="muted">{tr('Requests you take will appear here.', 'Les demandes que vous prenez apparaîtront ici.')}</p>
              : <ul className="prayer-list">{cases.map(c => <li key={c.id}><Link className="prayer-item" href={`/care/pastor/${c.id}`}>
                  <span className="prayer-item-head"><strong>{topicLabel(c.topic, language)}</strong><span className="muted">{waited(c.claimedAt ?? c.createdAt, language)}</span></span>
                  <span className="prayer-item-preview">{statusLabel(c.status, language)}</span>
                  {c.unread && <span className="pill prayer-answered">{tr('New message', 'Nouveau message')}</span>}
                </Link></li>)}</ul>}
          </section>
        </div>
      </>}
  </Shell>;
}
