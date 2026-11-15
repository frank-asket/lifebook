'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api, ApiError } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
import { reviewPayload, type TeachingReviewDraft } from '../../../lib/teaching-reviews';

export default function ReviewsPage() { const { userId } = useAuth(); return <Reviews key={userId ?? 'signed-out'} />; }
function Reviews() {
  const { isLoaded, isSignedIn, getToken } = useAuth(); const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [rows, setRows] = useState<TeachingReviewDraft[] | null>(null); const [draft, setDraft] = useState<TeachingReviewDraft | null>(null);
  const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [forbidden, setForbidden] = useState(false); const [retry, setRetry] = useState(0);
  const saving = useRef(false); const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const discard = () => !dirty || window.confirm(tr('Discard unsaved review notes?', 'Abandonner les notes non enregistrées ?'));
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const click = (event: MouseEvent) => { const link = event.target instanceof Element ? event.target.closest('a[href]') : null; if (link && link.getAttribute('target') !== '_blank' && !window.confirm(tr('Discard unsaved review notes?', 'Abandonner les notes non enregistrées ?'))) { event.preventDefault(); event.stopPropagation(); } };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', click, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); };
  }, [dirty, language]);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const controller = new AbortController(); setError(''); setForbidden(false);
    (async () => { try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); const result = await api<TeachingReviewDraft[]>('/teaching-reviews', token, { signal: controller.signal }); if (!controller.signal.aborted) setRows(result); } catch (e) { if (!controller.signal.aborted) { if (e instanceof ApiError && e.status === 403) setForbidden(true); else setError(errorMessage(e, language)); } } })();
    return () => controller.abort();
  }, [isLoaded, isSignedIn, getToken, retry]);
  async function save() {
    if (!draft || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      const result = await api<TeachingReviewDraft>(`/teaching-reviews/${encodeURIComponent(draft.id)}`, token, { method: 'PUT', body: JSON.stringify(reviewPayload(draft)) });
      if (mounted.current) { setRows(old => old?.map(row => row.id === result.id ? result : row) ?? null); setDraft(result); setDirty(false); setMessage(tr('Private review notes saved. Nothing was published.', 'Notes privées enregistrées. Rien n’a été publié.')); }
    } catch (e) { if (mounted.current) setError(errorMessage(e, language)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <Shell title={tr('Teaching review drafts', 'Brouillons de révision')}>
    <Link className="text-link" href="/editorial/discover">← {tr('Teaching discovery', 'Découverte d’enseignements')}</Link>
    <h1 className="page-heading">{tr('Private teaching reviews', 'Révisions privées des enseignements')}</h1>
    <p className="subheading">{tr('Keep original review notes beside your selected source. Only LifeBook editors can see this queue.', 'Conservez vos notes originales avec la source choisie. Cette liste est réservée aux éditeurs LifeBook.')}</p>
    <p className="notice">{tr('A saved draft is not approval or permission to reuse a video. Watch the original, identify the speaker and rights holder, and record the permitted use. These drafts cannot be published or played inside LifeBook yet.', 'Un brouillon ne vaut ni approbation ni autorisation de réutilisation. Consultez la source, identifiez l’intervenant et le titulaire des droits, et notez l’usage autorisé. Ces brouillons ne peuvent pas encore être publiés ni lus dans LifeBook.')}</p>
    {!isLoaded ? <p role="status">{tr('Loading…', 'Chargement…')}</p> : !isSignedIn ? <Link href="/sign-in">{tr('Sign in', 'Se connecter')}</Link> : <>
      {error ? <p className="alert" role="alert">{error}</p> : null}{message ? <p className="notice" role="status">{message}</p> : null}
      {forbidden ? <p role="status">{tr('Reviews are for moderators and administrators.', 'Les révisions sont réservées aux modérateurs et administrateurs.')}</p> : <>
        <button className="btn btn-outline" disabled={busy} onClick={() => { if (discard()) { setDraft(null); setDirty(false); setRows(null); setRetry(value => value + 1); } }}>{tr('Reload reviews', 'Recharger les révisions')}</button>
        {!rows && !error ? <p role="status">{tr('Loading reviews…', 'Chargement des révisions…')}</p> : null}
        {rows?.length === 0 ? <p className="notice">{tr('No drafts yet. Save a source from Teaching discovery to start a review.', 'Aucun brouillon. Enregistrez une source depuis la découverte pour commencer.')}</p> : null}
        <div className="learning-toolbar">{rows?.map(row => <button className="btn btn-outline" key={row.id} disabled={busy} aria-pressed={draft?.id === row.id} onClick={() => { if (discard()) { setDraft(row); setDirty(false); setMessage(''); setError(''); } }}>{row.title || tr('Untitled review', 'Révision sans titre')} · {row.sourceUrl.split('v=')[1]}</button>)}</div>
        {rows && rows.length >= 100 ? <p className="notice">{tr('Showing the 100 most recently edited reviews.', 'Les 100 révisions les plus récemment modifiées sont affichées.')}</p> : null}
        {draft ? <form className="card learning-progress" onSubmit={event => { event.preventDefault(); void save(); }}>
          <h2>{tr('Review notes', 'Notes de révision')}</h2>
          <a className="text-link" href={draft.sourceUrl} target="_blank" rel="noopener noreferrer">{tr('Open the original on YouTube (new tab)', 'Ouvrir la source sur YouTube (nouvel onglet)')}</a>
          <p className="muted">{tr('Write your own notes; do not paste unlicensed sermon text or transcripts.', 'Rédigez vos propres notes ; ne copiez pas de prédication ni de transcription sans autorisation.')}</p>
          {(['title', 'speaker', 'attribution', 'rightsReference', 'reviewNotes'] as const).map(key => <label className="form-field" key={key}><span className="field-label">{({ title: tr('Your review title', 'Titre de votre révision'), speaker: tr('Verified speaker', 'Intervenant vérifié'), attribution: tr('Proposed public credit', 'Crédit public proposé'), rightsReference: tr('Permission reference and restrictions', 'Référence de l’autorisation et restrictions'), reviewNotes: tr('Pastoral review notes', 'Notes de révision pastorale') })[key]}</span><textarea className="textarea" rows={key === 'reviewNotes' ? 5 : 2} disabled={busy} maxLength={key === 'reviewNotes' ? 10000 : key === 'title' || key === 'speaker' ? 200 : 1000} value={draft[key]} onChange={event => { setDirty(true); setMessage(''); setDraft({ ...draft, [key]: event.target.value }); }} /></label>)}
          <label className="form-field"><span className="field-label">{tr('Review language', 'Langue de révision')}</span><select className="select" disabled={busy} value={draft.locale} onChange={event => { setDirty(true); setDraft({ ...draft, locale: event.target.value }); }}><option value="en">English</option><option value="fr">Français</option></select></label>
          <button className="btn btn-primary" disabled={busy || !dirty}>{busy ? tr('Saving…', 'Enregistrement…') : tr('Save private notes', 'Enregistrer les notes privées')}</button>
        </form> : null}
      </>}
    </>}
  </Shell>;
}
