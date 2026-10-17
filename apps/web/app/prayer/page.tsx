'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, LockKeyhole, ShieldCheck, CheckCircle2, NotebookPen, Plus } from 'lucide-react';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { ScriptureCompanion } from '../../components/prayer/ScriptureCompanion';
import { PRAYER_LIMITS, prayerApi, type Prayer as PrayerEntry, type PrayerSummary } from '../../lib/prayer-api';

export default function Prayer() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { isLoaded, isSignedIn, userId } = useAuth();
  return <Shell title={tr('Prayer Sanctuary', 'Sanctuaire de prière')}>
    <span className="eyebrow">{tr('A QUIET PLACE FOR PRAYER', 'UN ESPACE PAISIBLE POUR PRIER')}</span>
    <h1 className="page-heading" style={{ marginTop: 9 }}>{tr("Bring what's on your heart.", 'Confiez ce qui vous tient à cœur.')}</h1>
    <p className="subheading">{tr("You don't need perfect words. This is a place to pause and pray honestly.", 'Les mots parfaits ne sont pas nécessaires. Prenez le temps de prier avec sincérité.')}</p>
    <div className="two-up" style={{ marginTop: 28 }}>
      {!isLoaded ? <p role="status">{tr('Loading…', 'Chargement…')}</p> : !isSignedIn || !userId
        ? <div className="card status-card"><LockKeyhole size={28} aria-hidden="true"/><h2>{tr('Your prayers belong to you', 'Vos prières vous appartiennent')}</h2><Link className="btn btn-primary" href="/sign-in">{tr('Sign in', 'Se connecter')}</Link></div>
        : <Journal key={userId} language={language}/>}
      <div className="stack">
        <div className="card"><span className="feature-icon rose"><HeartHandshake size={24}/></span><h3>{tr('Prayer without pressure', 'Prier sans pression')}</h3><p className="subheading">{tr('Your prayer is between you and God. LifeBook is a tool for reflection, not a substitute for pastoral care or spiritual community.', 'Votre prière est entre Dieu et vous. LifeBook accompagne la réflexion sans remplacer l’accompagnement pastoral ni la communauté.')}</p></div>
        <ScriptureCompanion language={language}/>
        <div className="card" style={{ background: 'var(--pink)' }}><span className="eyebrow">{tr('YOUR PRIVACY MATTERS', 'VOTRE CONFIDENTIALITÉ COMPTE')}</span><p style={{ marginTop: 13, marginBottom: 0, lineHeight: 1.7 }}>{tr('Saved prayers are encrypted and only you can open them. They are never used to infer your faith journey, never sent for AI processing, and you can delete them at any time, one by one or all at once in Settings.', 'Vos prières enregistrées sont chiffrées et vous seul pouvez les ouvrir. Elles ne servent jamais à déduire votre parcours de foi, ne sont jamais envoyées à une IA, et vous pouvez les supprimer à tout moment, une par une ou toutes depuis les Paramètres.')}</p></div>
      </div>
    </div>
  </Shell>;
}

function Journal({ language }: { language: 'en' | 'fr' }) {
  const { getToken } = useAuth(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [items, setItems] = useState<PrayerSummary[]>([]); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(''); const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<PrayerEntry | null>(null);
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [answerNote, setAnswerNote] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const dirty = selected ? title !== (selected.title ?? '') || body !== selected.body : Boolean(title.trim() || body.trim());
  const token = async () => { const value = await getToken(); if (!value) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); return value; };
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : tr('Something went wrong.', 'Une erreur est survenue.'));

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setLoadError('');
    (async () => { try { const rows = await prayerApi.list(await token(), controller.signal); if (!controller.signal.aborted) setItems(rows); } catch (e) { if (!controller.signal.aborted) setLoadError(e instanceof Error ? e.message : 'Unable to load prayers'); } finally { if (!controller.signal.aborted) setLoading(false); } })();
    return () => controller.abort();
  }, [getToken, reload]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const canLeave = () => !dirty || window.confirm(tr('Leave without saving your prayer?', 'Quitter sans enregistrer votre prière ?'));
  const show = (prayer: PrayerEntry | null) => { setSelected(prayer); setTitle(prayer?.title ?? ''); setBody(prayer?.body ?? ''); setAnswerNote(prayer?.answerNote ?? ''); setError(''); };
  const open = async (id: string) => { if (!canLeave()) return; setBusy(true); setMessage(''); try { show(await prayerApi.get(await token(), id)); } catch (e) { fail(e); } finally { setBusy(false); } };
  const startNew = () => { if (!canLeave()) return; show(null); setMessage(''); };
  const run = async (action: () => Promise<PrayerEntry | null>, done: string) => {
    setBusy(true); setError(''); setMessage('');
    try { show(await action()); setMessage(done); setReload(n => n + 1); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const save = () => run(async () => selected
    ? prayerApi.update(await token(), selected.id, { title, body })
    : prayerApi.create(await token(), { ...(title.trim() ? { title } : {}), body }), tr('Prayer saved privately.', 'Prière enregistrée en privé.'));
  const markAnswered = (answered: boolean) => selected && run(async () => prayerApi.answer(await token(), selected.id, answered, answerNote || undefined), answered ? tr('Marked as answered.', 'Marquée comme exaucée.') : tr('Answered mark removed.', 'Marque retirée.'));
  const remove = () => selected && window.confirm(tr('Delete this prayer permanently?', 'Supprimer définitivement cette prière ?')) && run(async () => { await prayerApi.remove(await token(), selected.id); return null; }, tr('Prayer deleted.', 'Prière supprimée.'));
  const date = (value: string) => new Date(value).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return <div className="stack">
    <form className="card" onSubmit={e => { e.preventDefault(); void save(); }}>
      <div className="split-title"><span className="pill"><LockKeyhole size={13}/> {tr('Encrypted & private', 'Chiffrée et privée')}</span>{selected && <button type="button" className="btn btn-soft btn-sm" onClick={startNew}><Plus size={14}/> {tr('New prayer', 'Nouvelle prière')}</button>}</div>
      <h2 style={{ fontSize: 23, margin: '22px 0 8px' }}>{selected ? tr('Your prayer', 'Votre prière') : tr('Write a prayer', 'Écrire une prière')}</h2>
      <label className="form-field"><span style={{ fontSize: 12, fontWeight: 800 }}>{tr('Title (optional)', 'Titre (facultatif)')}</span>
        <input className="input" value={title} maxLength={PRAYER_LIMITS.title} onChange={e => setTitle(e.target.value)} placeholder={tr('For my family', 'Pour ma famille')}/></label>
      <label className="form-field"><span style={{ fontSize: 12, fontWeight: 800 }}>{tr('Your prayer', 'Votre prière')}</span>
        <textarea className="textarea" style={{ minHeight: 220 }} value={body} maxLength={PRAYER_LIMITS.body} onChange={e => setBody(e.target.value)} placeholder={tr('Heavenly Father, today I want to bring before You…', 'Père céleste, aujourd’hui je souhaite te confier…')}/></label>
      <p className="muted" style={{ fontSize: 11 }}>{body.length}/{PRAYER_LIMITS.body}</p>
      <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" disabled={busy || !body.trim() || !dirty}>{busy ? tr('Saving…', 'Enregistrement…') : tr('Save prayer', 'Enregistrer la prière')}</button>
        {selected && <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void remove()}>{tr('Delete', 'Supprimer')}</button>}
      </div>
      {error && <p className="alert" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
      {selected && <div className="divider"/>}
      {selected && <div>
        <h3 className="icon-line"><CheckCircle2 size={18} aria-hidden="true"/> {selected.answeredAt ? tr(`Answered · ${date(selected.answeredAt)}`, `Exaucée · ${date(selected.answeredAt)}`) : tr('Has this prayer been answered?', 'Cette prière a-t-elle été exaucée ?')}</h3>
        <label className="form-field"><span style={{ fontSize: 12, fontWeight: 800 }}>{tr('What happened? (optional, private)', 'Que s’est-il passé ? (facultatif, privé)')}</span>
          <textarea className="textarea" style={{ minHeight: 90 }} value={answerNote} maxLength={PRAYER_LIMITS.answerNote} onChange={e => setAnswerNote(e.target.value)}/></label>
        <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-soft" disabled={busy} onClick={() => void markAnswered(true)}>{selected.answeredAt ? tr('Update note', 'Mettre à jour la note') : tr('Mark as answered', 'Marquer comme exaucée')}</button>
          {selected.answeredAt && <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void markAnswered(false)}>{tr('Remove answered mark', 'Retirer la marque')}</button>}
        </div>
      </div>}
      <p className="notice" style={{ marginTop: 18 }}><ShieldCheck size={15} style={{ verticalAlign: 'middle', marginRight: 6 }}/>{tr('Guided meditation is not available yet. When it arrives it will always ask before sending a prayer anywhere.', 'La méditation guidée n’est pas encore disponible. Elle demandera toujours votre accord avant de transmettre une prière.')}</p>
    </form>
    <section className="card" aria-labelledby="prayer-journal-title">
      <h2 id="prayer-journal-title" className="icon-line" style={{ fontSize: 20 }}><NotebookPen size={18} aria-hidden="true"/> {tr('Your prayer journal', 'Votre journal de prière')}</h2>
      {loading ? <p role="status">{tr('Loading your prayers…', 'Chargement de vos prières…')}</p>
        : loadError ? <div className="alert reader-error" role="alert"><span>{loadError}</span><button className="btn btn-soft" onClick={() => setReload(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>
        : !items.length ? <p className="muted">{tr('Prayers you save will appear here, newest first.', 'Les prières enregistrées apparaîtront ici, les plus récentes en premier.')}</p>
        : <ul className="prayer-list">{items.map(item => <li key={item.id}>
            <button type="button" className={`prayer-item${selected?.id === item.id ? ' active' : ''}`} disabled={busy} onClick={() => void open(item.id)}>
              <span className="prayer-item-head"><strong>{item.title || tr('Untitled prayer', 'Prière sans titre')}</strong><span className="muted">{date(item.updatedAt)}</span></span>
              <span className="prayer-item-preview">{item.preview}</span>
              {item.answeredAt && <span className="pill prayer-answered"><CheckCircle2 size={12}/> {tr('Answered', 'Exaucée')}</span>}
            </button></li>)}</ul>}
    </section>
  </div>;
}
