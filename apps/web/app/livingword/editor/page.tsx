'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api, ApiError } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
import type { TeachingDraft } from '../../../lib/livingword';
const empty = { title: '', description: '', speaker: '', locale: 'en', kind: 'audio', mediaUrl: '', attribution: '', rightsReference: '', transcript: '', publish: false };
export default function EditorialPage() { const { userId } = useAuth(); return <Editor key={userId ?? 'signed-out'} />; }
function Editor() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [rows, setRows] = useState<TeachingDraft[] | null>(null); const [form, setForm] = useState(empty); const [id, setId] = useState<string | null>(null);
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [retry, setRetry] = useState(0); const [dirty, setDirty] = useState(false); const [rights, setRights] = useState(false);
  // A member without editorial rights gets a plain explanation; retrying cannot change the answer.
  const [forbidden, setForbidden] = useState(false);
  const mounted = useRef(true); const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (!dirty) return; const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty]);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const controller = new AbortController(); setRows(null); setError(''); setForbidden(false);
    (async () => { try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); const value = await api<TeachingDraft[]>('/livingword/editor', token, { signal: controller.signal }); if (!controller.signal.aborted) setRows(value); } catch (e) { if (controller.signal.aborted) return; if (e instanceof ApiError && e.status === 403) setForbidden(true); else setError(errorMessage(e, language)); } })();
    return () => controller.abort();
  }, [isLoaded, isSignedIn, getToken, retry, language]);
  function choose(row?: TeachingDraft) {
    if (busy || (dirty && !window.confirm(tr('Discard your unsaved editorial changes?', 'Abandonner vos modifications éditoriales ?')))) return;
    setId(row?.id ?? null); setRights(false); setDirty(false); setMessage('');
    setForm(row ? { title: row.title, description: row.description ?? '', speaker: row.speaker ?? '', locale: row.locale, kind: row.kind, mediaUrl: row.mediaKey, attribution: row.attribution ?? '', rightsReference: row.rightsReference ?? '', transcript: row.transcript ?? '', publish: !!row.approvedAt } : empty);
  }
  async function write(unpublish?: string) {
    if (saving.current) return;
    if (!unpublish && form.publish && !rights) return;
    if (unpublish && !window.confirm(tr('Remove this teaching from the public library?', 'Retirer cet enseignement de la bibliothèque publique ?'))) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      const endpoint = unpublish ? `/livingword/editor/${encodeURIComponent(unpublish)}/unpublish` : id ? `/livingword/editor/${encodeURIComponent(id)}` : '/livingword/editor';
      await api(endpoint, token, { method: unpublish || !id ? 'POST' : 'PUT', ...(!unpublish ? { body: JSON.stringify(form) } : {}) });
      if (mounted.current) { setDirty(false); setRights(false); setForm(empty); setId(null); setMessage(tr('Editorial change saved.', 'Modification éditoriale enregistrée.')); setRetry(n => n + 1); }
    } catch (e) { if (mounted.current) setError(errorMessage(e, language)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <Shell title={tr('LivingWord editorial', 'Édition LivingWord')}><Link className="text-link" href="/livingword" onClick={e => { if (dirty && !window.confirm(tr('Discard unsaved changes?', 'Abandonner les modifications ?'))) e.preventDefault(); }}>← LivingWord</Link><Link className="text-link" href="/editorial" onClick={e => { if (dirty && !window.confirm(tr('Discard unsaved changes?', 'Abandonner les modifications ?'))) e.preventDefault(); }}>{tr('Content workspace', 'Atelier de contenus')}</Link><h1 className="page-heading">{tr('Editorial review', 'Révision éditoriale')}</h1>
    {!isLoaded ? <p role="status">{tr('Loading…', 'Chargement…')}</p> : !isSignedIn ? <p className="notice"><Link href="/sign-in">{tr('Sign in', 'Se connecter')}</Link></p> : <>
      {forbidden ? <p className="notice" role="status">{tr('Editorial review is for LifeBook moderators and administrators. Approved teachings are in the LivingWord library.', 'La révision éditoriale est réservée aux modérateurs et administrateurs LifeBook. Les enseignements approuvés se trouvent dans la bibliothèque LivingWord.')}</p> : null}
      {error ? <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" disabled={busy} onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div> : null}
      {message ? <p role="status" className="notice">{message}</p> : null}
      {!rows ? !error && !forbidden ? <p role="status">{tr('Checking editorial access…', 'Vérification de l’accès éditorial…')}</p> : null : <>
        <p className="notice">{tr('Only LifeBook moderators and administrators can publish. Verify rights, credit and transcript before publishing. Media must use a configured approved HTTPS host, with no embedded credentials or query tokens.', 'Seuls les modérateurs et administrateurs LifeBook peuvent publier. Vérifiez les droits, les crédits et la transcription. Le média doit utiliser un hôte HTTPS approuvé, sans identifiants ni jetons dans l’URL.')}</p>
        <button className="btn btn-outline" disabled={busy} onClick={() => choose()}>{tr('New teaching', 'Nouvel enseignement')}</button>
        <form className="card learning-progress" onSubmit={e => { e.preventDefault(); void write(); }}>
          <h2>{id ? tr('Edit teaching', 'Modifier l’enseignement') : tr('Prepare teaching', 'Préparer un enseignement')}</h2>
          {(['title', 'speaker', 'mediaUrl', 'attribution', 'rightsReference'] as const).map(key => <label className="form-field" key={key}><span className="field-label">{({ title: tr('Title', 'Titre'), speaker: tr('Speaker', 'Intervenant'), mediaUrl: tr('Approved media URL', 'URL du média approuvé'), attribution: tr('Public credit', 'Crédit public'), rightsReference: tr('Private rights reference', 'Référence privée des droits') })[key]}</span><input className="input" required disabled={busy} type={key === 'mediaUrl' ? 'url' : 'text'} maxLength={key === 'mediaUrl' ? 2048 : key === 'rightsReference' || key === 'attribution' ? 1000 : 200} value={form[key]} onChange={e => { setDirty(true); setRights(false); setForm(value => ({ ...value, [key]: e.target.value })); }} /></label>)}
          <label className="form-field"><span className="field-label">{tr('Language', 'Langue')}</span><select className="select" disabled={busy} value={form.locale} onChange={e => { setDirty(true); setRights(false); setForm(value => ({ ...value, locale: e.target.value })); }}><option value="en">English</option><option value="fr">Français</option></select></label>
          <label className="form-field"><span className="field-label">{tr('Media type', 'Type de média')}</span><select className="select" disabled={busy} value={form.kind} onChange={e => { setDirty(true); setRights(false); setForm(value => ({ ...value, kind: e.target.value })); }}><option value="audio">Audio</option><option value="video">{tr('Video', 'Vidéo')}</option></select></label>
          <label className="form-field"><span className="field-label">{tr('Description', 'Description')}</span><textarea className="textarea" disabled={busy} maxLength={10000} value={form.description} onChange={e => { setDirty(true); setRights(false); setForm(value => ({ ...value, description: e.target.value })); }} /></label>
          <label className="form-field"><span className="field-label">{tr('Accessible transcript', 'Transcription accessible')}</span><textarea className="textarea" required disabled={busy} maxLength={100000} value={form.transcript} onChange={e => { setDirty(true); setRights(false); setForm(value => ({ ...value, transcript: e.target.value })); }} /></label>
          <label className="check-row"><input type="checkbox" disabled={busy} checked={form.publish} onChange={e => { setDirty(true); setRights(false); setForm(value => ({ ...value, publish: e.target.checked })); }} />{tr('Publish after saving', 'Publier après l’enregistrement')}</label>
          {form.publish ? <label className="check-row"><input type="checkbox" disabled={busy} checked={rights} onChange={e => setRights(e.target.checked)} />{tr('I verified publication rights, attribution and the transcript for this teaching.', 'J’ai vérifié les droits de publication, les crédits et la transcription de cet enseignement.')}</label> : null}
          <button className="btn btn-primary" disabled={busy || (form.publish && !rights)}>{busy ? tr('Saving…', 'Enregistrement…') : form.publish ? tr('Save and publish', 'Enregistrer et publier') : tr('Save draft', 'Enregistrer le brouillon')}</button>
        </form>
        <h2>{tr('Recent editorial records', 'Derniers contenus éditoriaux')}</h2>{rows.map(row => <section className="card learning-progress" key={row.id}><h3>{row.title}</h3><p>{row.locale.toUpperCase()} · {row.approvedAt ? tr('Published', 'Publié') : tr('Draft', 'Brouillon')}</p><div className="learning-toolbar"><button className="btn btn-outline" disabled={busy} onClick={() => choose(row)}>{tr('Edit', 'Modifier')}</button>{row.approvedAt ? <button className="btn btn-outline" disabled={busy || dirty} onClick={() => void write(row.id)}>{tr('Unpublish', 'Dépublier')}</button> : null}</div></section>)}
        {rows.length >= 100 ? <p className="notice">{tr('Showing the 100 most recent records.', 'Les 100 contenus les plus récents sont affichés.')}</p> : null}
      </>}
    </>}
  </Shell>;
}
