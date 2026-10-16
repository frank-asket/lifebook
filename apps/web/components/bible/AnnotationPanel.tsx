'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Highlighter, NotebookPen, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
type Annotation = { id: string; passageId: string; locale: string; bookmarked: boolean; highlight: string | null; note: string | null };
const colors = ['yellow', 'green', 'blue', 'pink'] as const;
export function AnnotationPanel({ chapterId, locale, initialVerse, onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void; initialVerse?: string; chapterId: string; locale: 'en' | 'fr' }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const tr = (en: string, fr: string) => locale === 'fr' ? fr : en;
  if (!isLoaded) return <p role="status">{tr('Loading your annotations…', 'Chargement de vos annotations…')}</p>;
  if (!isSignedIn || !userId) return <section className="card annotation-panel"><h2>{tr('Make the passage your own', 'Approfondissez ce passage')}</h2><p>{tr('Sign in to bookmark verses, add highlights and save private notes.', 'Connectez-vous pour marquer des versets, les surligner et garder des notes privées.')}</p><Link className="btn btn-soft" href="/sign-in">{tr('Sign in', 'Se connecter')}</Link></section>;
  return <AnnotationEditor key={`${userId}:${chapterId}:${locale}:${initialVerse||''}`} chapterId={chapterId} locale={locale} initialVerse={initialVerse} onDirtyChange={onDirtyChange}/>;
}
function AnnotationEditor({ chapterId, locale, initialVerse, onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void; initialVerse?: string; chapterId: string; locale: 'en' | 'fr' }) {
  const { getToken } = useAuth();
  const tr = (en: string, fr: string) => locale === 'fr' ? fr : en;
  const [items, setItems] = useState<Annotation[]>([]);
  const [verse, setVerse] = useState(initialVerse || '1');
  const [bookmark, setBookmark] = useState(false);
  const [highlight, setHighlight] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  const mounted = useRef(false);
  const passageId = `${chapterId}.${verse}`;
  const current = items.find(item => item.passageId === passageId);
  const dirty = bookmark !== (current?.bookmarked ?? false) || highlight !== (current?.highlight ?? '') || note !== (current?.note ?? '');
  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false); }, [dirty, onDirtyChange]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setLoadFailed(false);
    (async () => {
      try {
        const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
        const data = await api<Annotation[]>(`/bible-annotations?locale=${locale}&chapterId=${encodeURIComponent(chapterId)}`, token, { signal: controller.signal });
        if (!controller.signal.aborted) { setItems(data); const selected = data.find(item => item.passageId === passageId); setBookmark(selected?.bookmarked ?? false); setHighlight(selected?.highlight ?? ''); setNote(selected?.note ?? ''); }
      } catch (e) { if (!controller.signal.aborted) { setLoadFailed(true); setError(e instanceof Error ? e.message : tr('Unable to load annotations.', 'Impossible de charger les annotations.')); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [chapterId, locale, getToken, retry]);
  useEffect(() => {
    setBookmark(current?.bookmarked ?? false); setHighlight(current?.highlight ?? ''); setNote(current?.note ?? '');
  }, [verse, current]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.('a[href]');
      if (link && !link.getAttribute('href')?.startsWith('#') && !window.confirm(tr('Leave without saving your note?', 'Quitter sans enregistrer votre note ?'))) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [dirty, locale]);
  function selectVerse(value: string) {
    if (dirty && !window.confirm(tr('Discard unsaved changes?', 'Abandonner les modifications ?'))) return;
    setVerse(value); setError(''); setMessage('');
  }
  async function save(remove = false) {
    if (busy) return;
    const [start, end = start] = verse.split('-').map(Number);
    if (!/^[1-9][0-9]{0,2}(?:-[1-9][0-9]{0,2})?$/.test(verse) || start > 200 || end > 200 || end < start || end - start > 50) { setError(tr('Enter a verse or range from 1 to 200 (up to 51 verses).', 'Saisissez un verset ou une plage de 1 à 200 (51 versets au maximum).')); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      if (remove && current) {
        await api(`/bible-annotations/${encodeURIComponent(current.id)}`, token, { method: 'DELETE' });
        if (mounted.current) { setItems(rows => rows.filter(row => row.id !== current.id)); setBookmark(false); setHighlight(''); setNote(''); }
      } else {
        const row = await api<Annotation>('/bible-annotations', token, { method: 'PUT', body: JSON.stringify({ passageId, locale, bookmark, highlight: highlight || null, note: note || null }) });
        if (mounted.current) { setItems(rows => [...rows.filter(item => item.passageId !== passageId), row]); }
      }
      if (mounted.current) setMessage(remove ? tr('Annotation deleted.', 'Annotation supprimée.') : tr('Annotation saved privately.', 'Annotation privée enregistrée.'));
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : tr('Unable to save. Your draft is still here.', 'Échec de l’enregistrement. Votre brouillon est conservé.')); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <section className="card annotation-panel" aria-labelledby="annotation-title">
    <div className="split-title"><div><span className="eyebrow">{tr('YOUR READING COMPANION', 'VOTRE CARNET DE LECTURE')}</span><h2 id="annotation-title"><NotebookPen size={22} aria-hidden="true"/> {tr('Notes & verse marks', 'Notes et versets marqués')}</h2></div><span className="pill">{tr('Private to you', 'Privé')}</span></div>
    <p className="muted">{tr('Choose a verse in this chapter. Save a bookmark, a colored verse mark, or a private note.', 'Choisissez un verset de ce chapitre. Ajoutez un favori, une marque colorée ou une note privée.')}</p>
    {loading && <p role="status">{tr('Loading…', 'Chargement…')}</p>}
    {error && <div className="alert reader-error" role="alert"><span>{error}</span>{!dirty && <button className="btn btn-soft" disabled={busy} onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button>}</div>}
    {!loading && !loadFailed && <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset disabled={busy}><legend className="sr-only">{tr('Verse annotation', 'Annotation du verset')}</legend>
        <div className="annotation-toolbar"><label className="form-field" htmlFor="annotation-verse">{tr('Verse or range', 'Verset ou plage')}<input className="input" id="annotation-verse" type="text" inputMode="numeric" placeholder={tr("1 or 1-3","1 ou 1-3")} value={verse} onChange={event => selectVerse(event.target.value)}/></label>
        <label className="check-row"><input type="checkbox" checked={bookmark} onChange={event => setBookmark(event.target.checked)}/><Bookmark size={18} aria-hidden="true"/>{tr('Bookmark verse', 'Marquer ce verset')}</label>
        <label className="form-field" htmlFor="annotation-highlight"><span className="icon-line"><Highlighter size={17} aria-hidden="true"/>{tr('Verse color', 'Couleur du verset')}</span><select className="select" id="annotation-highlight" value={highlight} onChange={event => setHighlight(event.target.value)}><option value="">{tr('None', 'Aucune')}</option>{colors.map(color => <option key={color} value={color}>{locale === 'fr' ? ({yellow:'Jaune',green:'Vert',blue:'Bleu',pink:'Rose'})[color] : color[0].toUpperCase()+color.slice(1)}</option>)}</select></label></div>
        <label className="form-field" htmlFor="annotation-note">{tr('Private note', 'Note privée')}<textarea id="annotation-note" className="textarea" maxLength={4000} rows={5} value={note} onChange={event => setNote(event.target.value)} placeholder={tr('What stands out in this verse?', 'Que retenez-vous de ce verset ?')}/></label>
        <div className="annotation-actions"><span className="muted">{note.length}/4000 {dirty && `· ${tr('Unsaved changes', 'Modifications non enregistrées')}`}</span><button type="submit" className="btn btn-primary" disabled={!dirty || !verse || (!bookmark && !highlight && !note.trim() && !current)}>{busy ? tr('Saving…', 'Enregistrement…') : tr('Save annotation', 'Enregistrer')}</button>{current && <button type="button" className="btn btn-outline" onClick={() => void save(true)}><Trash2 size={16} aria-hidden="true"/>{tr('Delete', 'Supprimer')}</button>}</div>
      </fieldset>
    </form>}
    {message && <p className="notice" role="status">{message}</p>}
    {items.length > 0 && <div className="annotation-saved"><h3>{tr('Saved in this chapter', 'Enregistré dans ce chapitre')}</h3><div className="tag-list">{[...items].sort((a,b)=>parseInt(a.passageId.split('.')[2],10)-parseInt(b.passageId.split('.')[2],10)).map(item => <button key={item.id} className={`annotation-mark mark-${item.highlight || 'none'}`} type="button" disabled={busy} aria-pressed={item.passageId === passageId} onClick={() => selectVerse(item.passageId.split('.')[2])}>{item.bookmarked && <Bookmark size={15} aria-label={tr('Bookmarked', 'Favori')}/>} {tr('Verse', 'Verset')} {item.passageId.split('.')[2]} {item.note && <NotebookPen size={15} aria-label={tr('Has a note', 'Note enregistrée')}/>}</button>)}</div></div>}
  </section>;
}
