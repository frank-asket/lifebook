'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Phone } from 'lucide-react';
import { careApi, statusLabel, topicLabel, type CareThread } from '../../lib/care-api';
import { CARE_MESSAGE_MAX } from './limits';

/** One private conversation, seen by the member or by the pastor who claimed it. */
export function CareConversation({ id, viewer, language }: { id: string; viewer: 'member' | 'pastor'; language: 'en' | 'fr' }) {
  const { getToken } = useAuth(); const router = useRouter(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [thread, setThread] = useState<CareThread | null>(null); const [missing, setMissing] = useState(false);
  const [reply, setReply] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
  const token = async () => { const value = await getToken(); if (!value) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); return value; };
  useEffect(() => {
    const controller = new AbortController(); setError('');
    (async () => { try { const t = await token(); const row = viewer === 'member' ? await careApi.get(t, id, controller.signal) : await careApi.case(t, id, controller.signal); if (!controller.signal.aborted) setThread(row); }
      catch (e) { if (controller.signal.aborted) return; const status = (e as { status?: number }).status; if (status === 404 || status === 403) setMissing(true); else setError(e instanceof Error ? e.message : 'Unavailable'); } })();
    return () => controller.abort();
  }, [id, viewer, reload, getToken]);
  useEffect(() => {
    if (!reply.trim()) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [reply]);
  const act = async (fn: (t: string) => Promise<CareThread | null>) => {
    setBusy(true); setError('');
    try { const row = await fn(await token()); if (row) setThread(row); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); } finally { setBusy(false); }
  };
  const send = () => act(async t => { const row = viewer === 'member' ? await careApi.reply(t, id, reply) : await careApi.pastorReply(t, id, reply); setReply(''); return row; });
  const close = () => window.confirm(tr('Close this conversation? You can still read it afterwards.', 'Terminer cette conversation ? Vous pourrez toujours la relire.')) && act(t => viewer === 'member' ? careApi.close(t, id) : careApi.pastorClose(t, id));
  const remove = () => window.confirm(tr('Permanently delete this request and every message? This cannot be undone.', 'Supprimer définitivement cette demande et tous les messages ? Action irréversible.')) && act(async t => { await careApi.remove(t, id); router.push('/care'); return null; });
  const time = (value: string) => new Date(value).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (missing) return <div className="card status-card"><h2>{tr('This conversation is not available', 'Cette conversation n’est pas disponible')}</h2><Link className="btn btn-primary" href={viewer === 'member' ? '/care' : '/care/pastor'}>{tr('Back', 'Retour')}</Link></div>;
  if (error && !thread) return <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setReload(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>;
  if (!thread) return <p role="status">{tr('Opening conversation…', 'Ouverture de la conversation…')}</p>;
  const other = viewer === 'member' ? (thread.pastor?.displayName ?? tr('Pastor', 'Pasteur')) : (thread.name || tr('Member', 'Membre'));
  return <div className="care-thread stack">
    <div className="card">
      <div className="split-title" style={{ flexWrap: 'wrap', gap: 10 }}><span className="pill"><LockKeyhole size={13}/> {tr('Private conversation', 'Conversation privée')}</span><span className="muted">{topicLabel(thread.topic, language)} · {statusLabel(thread.status, language)}</span></div>
      {viewer === 'member' && thread.status === 'OPEN' && <p className="notice" style={{ marginTop: 14 }}>{tr('A pastor who speaks your language will reply, usually within 24 hours. This is not an emergency service: if you are in danger, call 112.', 'Un pasteur qui parle votre langue vous répondra, en général sous 24 heures. Ce n’est pas un service d’urgence : en cas de danger, appelez le 112.')}</p>}
      {viewer === 'pastor' && thread.contactPreference === 'callback' && thread.phone && <p className="notice icon-line" style={{ marginTop: 14 }}><Phone size={15} aria-hidden="true"/> {tr('Asked for a callback:', 'Souhaite être rappelé(e) :')} <strong className="care-phone">{thread.phone}</strong></p>}
      <ol className="care-messages">
        <li className={`care-message from-member${viewer === 'member' ? ' mine' : ''}`}><span className="care-author">{viewer === 'member' ? tr('You', 'Vous') : other} · {time(thread.createdAt)}</span><p>{thread.message}</p></li>
        {thread.messages.map(m => <li key={m.id} className={`care-message from-${m.from}${m.from === viewer ? ' mine' : ''}`}><span className="care-author">{m.from === viewer ? tr('You', 'Vous') : other} · {time(m.createdAt)}</span><p>{m.text}</p></li>)}
      </ol>
      {thread.status === 'CLOSED' ? <p className="muted">{tr('This conversation is closed.', 'Cette conversation est terminée.')}</p>
        : <form onSubmit={e => { e.preventDefault(); if (reply.trim()) void send(); }} className="stack" style={{ gap: 10 }}>
          <label className="form-field"><span style={{ fontSize: 12, fontWeight: 800 }}>{tr('Your reply', 'Votre réponse')}</span>
            <textarea className="textarea" style={{ minHeight: 110 }} value={reply} maxLength={CARE_MESSAGE_MAX} onChange={e => setReply(e.target.value)}/></label>
          <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap' }}><button className="btn btn-primary" disabled={busy || !reply.trim()}>{busy ? tr('Sending…', 'Envoi…') : tr('Send', 'Envoyer')}</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => void close()}>{tr('Close conversation', 'Terminer la conversation')}</button></div>
        </form>}
      {error && <p className="alert" role="alert">{error}</p>}
    </div>
    {viewer === 'member' && <div className="card"><h3>{tr('Your data', 'Vos données')}</h3><p className="subheading">{tr('Only you and the pastor who takes your request can read this. Closed conversations are deleted after 90 days, or you can delete it now.', 'Seuls vous et le pasteur qui prend votre demande pouvez la lire. Les conversations terminées sont supprimées après 90 jours, ou vous pouvez la supprimer maintenant.')}</p><button className="btn btn-outline" disabled={busy} onClick={() => void remove()}>{tr('Delete permanently', 'Supprimer définitivement')}</button></div>}
  </div>;
}
