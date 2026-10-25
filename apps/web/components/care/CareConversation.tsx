'use client';
import { memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Phone } from 'lucide-react';
import { careApi, statusLabel, topicLabel, type CareThread } from '../../lib/care-api';
import { CARE_MESSAGE_MAX } from './limits';
import { ReportConcern } from './ReportConcern';
import { CareError, CareLoading, useCareToken } from './states';

type Ui = 'en' | 'fr';

/** One private conversation, seen by the member or by the pastor who claimed it. */
export function CareConversation({ id, viewer, language }: { id: string; viewer: 'member' | 'pastor'; language: Ui }) {
  const token = useCareToken(); const router = useRouter(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [thread, setThread] = useState<CareThread | null>(null); const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [reload, setReload] = useState(0);
  const retry = useCallback(() => setReload(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController(); setError(null);
    (async () => { try { const t = await token(); const row = viewer === 'member' ? await careApi.get(t, id, controller.signal) : await careApi.case(t, id, controller.signal); if (!controller.signal.aborted) setThread(row); }
      catch (e) { if (controller.signal.aborted) return; const status = (e as { status?: number }).status; if (status === 404 || status === 403) setMissing(true); else setError(e); } })();
    return () => controller.abort();
  }, [id, viewer, reload, token]);
  const act = useCallback(async (fn: (t: string) => Promise<CareThread | null>) => {
    setBusy(true); setError(null);
    try { const row = await fn(await token()); if (row) setThread(row); return true; } catch (e) { setError(e); return false; } finally { setBusy(false); }
  }, [token]);
  const send = useCallback((text: string) => act(t => viewer === 'member' ? careApi.reply(t, id, text) : careApi.pastorReply(t, id, text)), [act, viewer, id]);
  const close = useCallback(() => { if (window.confirm(language === 'fr' ? 'Terminer cette conversation ? Vous pourrez toujours la relire.' : 'Close this conversation? You can still read it afterwards.')) void act(t => viewer === 'member' ? careApi.close(t, id) : careApi.pastorClose(t, id)); }, [act, viewer, id, language]);
  const remove = () => { if (window.confirm(tr('Permanently delete this request and every message? This cannot be undone.', 'Supprimer définitivement cette demande et tous les messages ? Action irréversible.'))) void act(async t => { await careApi.remove(t, id); router.push('/care'); return null; }); };
  const older = async () => {
    if (!thread?.nextCursor || busy) return;
    setBusy(true); setError(null);
    try {
      const row = await (viewer === 'member' ? careApi.get : careApi.case)(await token(), id, undefined, thread.nextCursor);
      setThread(current => current && { ...current, nextCursor: row.nextCursor, messages: [...row.messages.filter(m => !current.messages.some(existing => existing.id === m.id)), ...current.messages] });
    } catch (e) { setError(e); } finally { setBusy(false); }
  };
  const heading = <h1 className="page-heading">{thread ? topicLabel(thread.topic, language) : tr('Private conversation', 'Conversation privée')}</h1>;

  if (missing) return <div className="card status-card"><h1>{tr('This conversation is not available', 'Cette conversation n’est pas disponible')}</h1><p>{tr('It may have been closed and deleted, or it belongs to someone else.', 'Elle a peut-être été terminée et supprimée, ou elle appartient à quelqu’un d’autre.')}</p><Link className="btn btn-primary" href={viewer === 'member' ? '/care' : '/care/pastor'}>{tr('Back', 'Retour')}</Link></div>;
  if (!thread) return <div className="stack">{heading}{error ? <CareError error={error} language={language} onRetry={retry}/> : <CareLoading label={tr('Opening conversation…', 'Ouverture de la conversation…')} lines={4}/>}</div>;
  const other = viewer === 'member' ? (thread.pastor?.displayName ?? tr('Pastor', 'Pasteur')) : (thread.name || tr('Member', 'Membre'));
  return <div className="care-thread stack">
    {heading}
    <div className="card">
      <div className="split-title" style={{ flexWrap: 'wrap', gap: 10 }}><span className="pill"><LockKeyhole size={13} aria-hidden="true"/> {tr('Private conversation', 'Conversation privée')}</span><span className="muted">{statusLabel(thread.status, language)}</span></div>
      {viewer === 'member' && thread.status === 'OPEN' && Date.now() - Date.parse(thread.createdAt) > 24 * 3600000 && <p className="alert" style={{ marginTop: 14 }}>{tr('No pastor has been able to take your request yet. We are sorry for the wait; LifeBook’s safeguarding lead has been alerted. If you need to talk to someone now, call 3114 in France or 0800 678 678 in Ghana; in danger, call 112.', 'Aucun pasteur n’a encore pu prendre votre demande. Nous sommes désolés de l’attente ; le référent protection de LifeBook a été alerté. Pour parler à quelqu’un maintenant, appelez le 3114 en France ou le 0800 678 678 au Ghana ; en cas de danger, le 112.')}</p>}
      {viewer === 'member' && thread.status === 'CLOSED' && thread.closedBy === 'system' && <p className="alert" style={{ marginTop: 14 }}>{tr('We are sorry: no pastor was able to take this request within 30 days, so it was closed. You are welcome to ask again.', 'Nous sommes désolés : aucun pasteur n’a pu prendre cette demande en 30 jours, elle a donc été fermée. Vous pouvez en faire une nouvelle.')}</p>}
      {viewer === 'member' && thread.status === 'OPEN' && <p className="notice" style={{ marginTop: 14 }}>{tr('A pastor who speaks your language will reply, usually within 24 hours. This is not an emergency service: if you are in danger, call 112.', 'Un pasteur qui parle votre langue vous répondra, en général sous 24 heures. Ce n’est pas un service d’urgence : en cas de danger, appelez le 112.')}</p>}
      {viewer === 'pastor' && thread.contactPreference === 'callback' && thread.phone && <p className="notice icon-line" style={{ marginTop: 14, flexWrap: 'wrap' }}><Phone size={15} aria-hidden="true"/> {tr('Asked for a callback:', 'Souhaite être rappelé(e) :')} <a className="care-phone care-link" href={`tel:${thread.phone.replace(/[^+\d]/g, '')}`}>{thread.phone}</a></p>}
      {thread.nextCursor && <button className="btn btn-outline" type="button" disabled={busy} onClick={() => void older()}>{tr('Load earlier messages', 'Afficher les messages précédents')}</button>}
      <Messages thread={thread} viewer={viewer} other={other} language={language}/>
      {thread.status === 'CLOSED' ? <p className="muted">{tr('This conversation is closed.', 'Cette conversation est terminée.')}</p>
        : <ReplyForm language={language} busy={busy} onSend={send} onClose={close}/>}
      {error ? <div style={{ marginTop: 12 }}><CareError error={error} language={language}/></div> : null}
    </div>
    {(viewer === 'pastor' || thread.status !== 'OPEN') && <ReportConcern id={id} viewer={viewer} language={language}/>}
    {viewer === 'member' && <section className="card" aria-labelledby="care-data-title"><h2 id="care-data-title" style={{ fontSize: 19 }}>{tr('Your data', 'Vos données')}</h2><p className="subheading">{tr('Only you and the pastor who takes your request can read this. Closed conversations are deleted after 90 days, or you can delete it now.', 'Seuls vous et le pasteur qui prend votre demande pouvez la lire. Les conversations terminées sont supprimées après 90 jours, ou vous pouvez la supprimer maintenant.')}</p><button type="button" className="btn btn-outline" disabled={busy} onClick={remove}>{tr('Delete permanently', 'Supprimer définitivement')}</button></section>}
  </div>;
}

const Messages = memo(function Messages({ thread, viewer, other, language }: { thread: CareThread; viewer: 'member' | 'pastor'; other: string; language: Ui }) {
  const you = language === 'fr' ? 'Vous' : 'You';
  const time = (value: string) => new Date(value).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return <ol className="care-messages" aria-label="Messages">
    <li className={`care-message from-member${viewer === 'member' ? ' mine' : ''}`}><span className="care-author">{viewer === 'member' ? you : other} · <time dateTime={thread.createdAt}>{time(thread.createdAt)}</time></span><p>{thread.message}</p></li>
    {thread.messages.map(m => <li key={m.id} className={`care-message from-${m.from}${m.from === viewer ? ' mine' : ''}`}><span className="care-author">{m.from === viewer ? you : other} · <time dateTime={m.createdAt}>{time(m.createdAt)}</time></span><p>{m.text}</p></li>)}
  </ol>;
});

/** Holds the draft, so typing re-renders only this form and not the whole thread. */
const ReplyForm = memo(function ReplyForm({ language, busy, onSend, onClose }: { language: Ui; busy: boolean; onSend: (text: string) => Promise<boolean>; onClose: () => void }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [reply, setReply] = useState('');
  const dirty = reply.trim().length > 0;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return <form onSubmit={e => { e.preventDefault(); if (dirty) void onSend(reply).then(sent => { if (sent) setReply(''); }); }} className="stack" style={{ gap: 10 }}>
    <label className="form-field"><span className="field-label">{tr('Your reply', 'Votre réponse')}</span>
      <textarea id="care-reply" className="textarea" style={{ minHeight: 110 }} value={reply} maxLength={CARE_MESSAGE_MAX} onChange={e => setReply(e.target.value)}/></label>
    <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap' }}><button className="btn btn-primary" disabled={busy || !dirty}>{busy ? tr('Sending…', 'Envoi…') : tr('Send', 'Envoyer')}</button><button type="button" className="btn btn-outline" disabled={busy} onClick={onClose}>{tr('Close conversation', 'Terminer la conversation')}</button></div>
  </form>;
});
