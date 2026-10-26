'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { api, ApiError } from '../../lib/api';
import { errorMessage } from '../../lib/errors';
import { starterDraft, meditationStarterCount } from '../../lib/editorial-starters';
import { draftFrom, editorialPayload, newDraft, newLesson, type ContentDraft, type ContentKind, type EditorialRecord, type LessonDraft } from '../../lib/editorial';

export default function EditorialPage() { const { userId } = useAuth(); return <Editor key={userId ?? 'signed-out'} />; }
function Editor() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [starterIndex, setStarterIndex] = useState(0);
  const [kind, setKind] = useState<ContentKind>('meditations');
  const [rows, setRows] = useState<EditorialRecord[] | null>(null);
  const [record, setRecord] = useState<EditorialRecord | null>(null); const [draft, setDraft] = useState(newDraft);
  const [dirty, setDirty] = useState(false); const [reviewed, setReviewed] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [forbidden, setForbidden] = useState(false); const [retry, setRetry] = useState(0);
  const mounted = useRef(true); const pending = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (!dirty) return; const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty]);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const controller = new AbortController(); setRows(null); setError(''); setForbidden(false);
    (async () => { try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); const result = await api<EditorialRecord[]>(`/editorial/${kind}`, token, { signal: controller.signal }); if (!controller.signal.aborted) setRows(result); } catch (e) { if (!controller.signal.aborted) { if (e instanceof ApiError && e.status === 403) setForbidden(true); else setError(errorMessage(e, language)); } } })();
    return () => controller.abort();
  }, [isLoaded, isSignedIn, getToken, kind, retry]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.origin === window.location.origin) return;
      if (!window.confirm(tr('Discard your unsaved content changes?', 'Abandonner vos modifications non enregistrées ?'))) { event.preventDefault(); event.stopPropagation(); }
    };
    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [dirty, language]);
  const canDiscard = () => !dirty || window.confirm(tr('Discard your unsaved content changes?', 'Abandonner vos modifications non enregistrées ?'));
  function changeKind(value: ContentKind) { if (pending.current || !canDiscard()) return; setKind(value); setRecord(null); setDraft(newDraft()); setDirty(false); setReviewed(false); setMessage(''); }
  async function choose(row?: EditorialRecord) {
    if (pending.current || !canDiscard()) return;
    if (!row) { setRecord(null); setDraft(newDraft()); setDirty(false); setReviewed(false); setMessage(''); return; }
    pending.current = true; setBusy(true); setError('');
    try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); const value = await api<EditorialRecord>(`/editorial/${kind}/${encodeURIComponent(row.id)}`, token); if (mounted.current) { setRecord(value); setDraft(draftFrom(value)); setDirty(false); setReviewed(false); setMessage(''); } }
    catch (e) { if (mounted.current) setError(errorMessage(e, language)); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  function edit<K extends keyof ContentDraft>(key: K, value: ContentDraft[K]) { setDraft(previous => ({ ...previous, [key]: value })); setDirty(true); setReviewed(false); }
  function editLesson<K extends keyof LessonDraft>(index: number, key: K, value: LessonDraft[K]) { edit('lessons', draft.lessons.map((lesson, i) => i === index ? { ...lesson, [key]: value } : lesson)); }
  async function save(publish: boolean) {
    if (pending.current || (publish && !reviewed)) return;
    if (!publish && (record?.isPublished || record?.status === 'PUBLISHED') && !window.confirm(tr('Saving as draft removes this content from the public library. Continue?', 'Enregistrer comme brouillon retire ce contenu de la bibliothèque publique. Continuer ?'))) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      const payload = editorialPayload(kind, draft, publish, reviewed, record?.revision);
      const result = await api<EditorialRecord>(`/editorial/${kind}${record ? `/${encodeURIComponent(record.id)}` : ''}`, token, { method: record ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (mounted.current) { setRecord(result); setDraft(draftFrom(result)); setDirty(false); setReviewed(false); setMessage(publish ? tr('Publication saved. Future-dated meditations appear on their scheduled UTC day.', 'Publication enregistrée. Les méditations à venir apparaîtront à la date UTC prévue.') : tr('Draft saved. It is not in the public library.', 'Brouillon enregistré. Il ne figure pas dans la bibliothèque publique.')); setRetry(n => n + 1); }
    } catch (e) { if (mounted.current) setError(errorMessage(e, language)); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  const names = { meditations: tr('Meditations', 'Méditations'), studies: tr('Bible Studies', 'Études bibliques'), paths: tr('Learning paths', 'Parcours') };
  const field = (key: keyof Omit<ContentDraft, 'lessons'>, en: string, fr: string, multiline = false, max = 10000) => <label className="form-field" key={key}><span className="field-label">{tr(en, fr)}</span>{multiline ? <textarea className="textarea" disabled={busy} maxLength={max} rows={5} value={draft[key]} onChange={e => edit(key, e.target.value)} /> : <input className="input" disabled={busy} maxLength={max} type={key === 'publishDate' ? 'date' : 'text'} value={draft[key]} onChange={e => edit(key, e.target.value)} />}</label>;
  const lessonField = (index: number, key: keyof Omit<LessonDraft, 'id'>, en: string, fr: string, max = 10000) => <label className="form-field" key={key}><span className="field-label">{tr(en, fr)}</span><textarea className="textarea" disabled={busy} rows={key === 'title' || key === 'scriptureReference' ? 2 : 5} maxLength={max} value={draft.lessons[index][key]} onChange={e => editLesson(index, key, e.target.value)} /></label>;
  return <Shell title={tr('Content workspace', 'Atelier de contenus')}><span className="eyebrow">{tr('PREPARE · REVIEW · PUBLISH', 'PRÉPARER · RELIRE · PUBLIER')}</span><h1 className="page-heading">{tr('Content workspace', 'Atelier de contenus')}</h1><p className="subheading">{tr('Build thoughtful Scripture-centered experiences. Drafts stay private until you explicitly publish.', 'Préparez des expériences centrées sur les Écritures. Les brouillons restent privés jusqu’à leur publication explicite.')}</p>
    <nav className="learning-toolbar editorial-tabs" aria-label={tr('Editorial libraries', 'Bibliothèques éditoriales')}>{(Object.keys(names) as ContentKind[]).map(value => <button type="button" className="btn btn-outline" aria-pressed={kind === value} disabled={busy} key={value} onClick={() => changeKind(value)}>{names[value]}</button>)}<Link className="btn btn-outline" href="/livingword/editor" onClick={e => { if (busy) e.preventDefault(); }}>LivingWord</Link><Link className="btn btn-outline" href="/editorial/discover" onClick={e => { if (busy) e.preventDefault(); }}>{tr('Discover resources', 'Découvrir des ressources')}</Link></nav>
    {!isLoaded ? <p role="status">{tr('Loading…', 'Chargement…')}</p> : !isSignedIn ? <p className="notice"><Link href="/sign-in">{tr('Sign in', 'Se connecter')}</Link></p> : <>
      {forbidden ? <p className="notice">{tr('This workspace is for LifeBook moderators and administrators.', 'Cet atelier est réservé aux modérateurs et administrateurs LifeBook.')}</p> : null}
      {error ? <div className="alert reader-error" role="alert"><span>{error}</span><button type="button" className="btn btn-soft" disabled={busy} onClick={() => setRetry(n => n + 1)}>{tr('Retry list', 'Recharger la liste')}</button></div> : null}
      {message ? <p className="notice" role="status">{message}</p> : null}
      {!rows ? !forbidden && !error ? <p role="status">{tr('Checking editorial access…', 'Vérification de l’accès éditorial…')}</p> : null : <>
        <section className="card learning-progress"><h2>{names[kind]}</h2><button type="button" className="btn btn-outline" disabled={busy} onClick={() => void choose()}>{tr('New draft', 'Nouveau brouillon')}</button>{!rows.length ? <p>{tr('No content yet. Prepare the first draft below.', 'Aucun contenu pour le moment. Préparez le premier brouillon ci-dessous.')}</p> : rows.map(row => <div className="learning-toolbar" key={row.id}><span>{row.title} · {row.locale?.toUpperCase()} {row.isPublished || row.status === 'PUBLISHED' ? tr('Published / scheduled', 'Publié / programmé') : tr('Draft', 'Brouillon')}</span><button type="button" className="btn btn-outline" disabled={busy} aria-label={`${tr('Edit', 'Modifier')}: ${row.title}`} onClick={() => void choose(row)}>{tr('Edit', 'Modifier')}</button></div>)}{rows.length >= 100 ? <p className="notice">{tr('Showing up to 100 records.', 'Jusqu’à 100 contenus affichés.')}</p> : null}</section>
        <section className="card learning-progress"><h2>{tr('Starter copy for review', 'Textes de départ à relire')}</h2><p>{tr('Loads a local draft into this form only. Nothing is saved or approved. Review and adapt the wording before publishing; LivingWord requires your own permitted recordings.', 'Charge seulement un brouillon local dans ce formulaire. Rien n’est enregistré ni approuvé. Relisez et adaptez le texte avant publication ; LivingWord nécessite vos enregistrements autorisés.')}</p>{kind === 'meditations' ? <label className="form-field"><span className="field-label">{tr('Starter meditation', 'Méditation de départ')}</span><select className="select" disabled={busy} value={starterIndex} onChange={e => setStarterIndex(Number(e.target.value))}>{Array.from({ length: meditationStarterCount }, (_, index) => <option value={index} key={index}>{index + 1}</option>)}</select></label> : null}<div className="learning-toolbar">{(['en', 'fr'] as const).map(locale => <button key={locale} type="button" className="btn btn-outline" disabled={busy} onClick={() => { if (pending.current || !canDiscard()) return; setRecord(null); setDraft(starterDraft(kind, locale, starterIndex)); setDirty(true); setReviewed(false); setMessage(''); }}>{locale === 'fr' ? 'Charger le brouillon français' : 'Load English draft'}</button>)}</div></section>
        <form className="card learning-progress editorial-form" onSubmit={e => { e.preventDefault(); void save(false); }}><h2>{record ? tr('Edit content', 'Modifier le contenu') : tr('Prepare a draft', 'Préparer un brouillon')}</h2>
          <p className="notice">{tr('Saving a published item as a draft unpublishes it. Existing lessons and member progress stay intact. Edit or append lessons; removing or reordering saved lessons is not supported here.', 'Enregistrer un contenu publié comme brouillon le dépublie. Les leçons et les progressions sont conservées. Vous pouvez modifier ou ajouter des leçons ; supprimer ou réordonner les leçons enregistrées n’est pas possible ici.')}</p>
          {field('title', 'Title', 'Titre', false, 200)}{field('slug', 'Stable URL slug (lowercase, hyphens)', 'Identifiant stable (minuscules, tirets)', false, 100)}
          {kind !== 'paths' ? <label className="form-field"><span className="field-label">{tr('Content language', 'Langue du contenu')}</span><select className="select" disabled={busy} value={draft.locale} onChange={e => edit('locale', e.target.value)}><option value="en">English</option><option value="fr">Français</option></select></label> : <p className="notice">{tr('Paths currently share one catalog. Use distinct titles and slugs for translated courses.', 'Les parcours partagent actuellement un catalogue. Utilisez des titres et identifiants distincts pour les traductions.')}</p>}
          {kind === 'meditations' ? <>{field('publishDate', 'Publication date (UTC)', 'Date de publication (UTC)')}{field('scriptureReference', 'Scripture reference — no unlicensed verse text', 'Référence biblique — sans citation non autorisée', false, 200)}{field('explanation', 'Context and reflection', 'Contexte et méditation', true, 20000)}{field('questions', 'Reflection questions (one per line, up to ten)', 'Questions (une par ligne, dix maximum)', true, 5000)}{field('guidedPrayer', 'Guided prayer', 'Prière guidée', true)}</> : <>
            {field('description', 'Course description', 'Description du parcours', true)}
            {kind === 'studies' ? <><label className="form-field"><span className="field-label">{tr('Study method', 'Méthode d’étude')}</span><select className="select" disabled={busy} value={draft.method} onChange={e => edit('method', e.target.value)}>{[['THEMATIC', tr('Topic', 'Thème')], ['CHARACTER', tr('Character', 'Personnage')], ['BOOK', tr('Bible book', 'Livre biblique')], ['SYSTEMATIC', tr('Doctrine', 'Doctrine')]].map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>{field('difficulty', 'Difficulty', 'Niveau', false, 80)}</> : null}
            {draft.lessons.map((lesson, index) => <fieldset className="card learning-progress" key={lesson.id ?? `new-${index}`} disabled={busy}><legend>{tr('Lesson', 'Leçon')} {index + 1}</legend>{lessonField(index, 'title', 'Lesson title', 'Titre de la leçon', 200)}{kind === 'paths' ? lessonField(index, 'content', 'Lesson content and activities', 'Contenu et activités', 20000) : <>{lessonField(index, 'scriptureReference', 'Scripture reference', 'Référence biblique', 200)}{lessonField(index, 'introduction', 'Introduction', 'Introduction')}{lessonField(index, 'historicalContext', 'Historical context', 'Contexte historique')}{lessonField(index, 'exegesis', 'Understanding the passage', 'Comprendre le passage', 20000)}{lessonField(index, 'theology', 'Theological understanding', 'Compréhension théologique')}{lessonField(index, 'questions', 'Reflection questions (one per line)', 'Questions (une par ligne)', 5000)}{lessonField(index, 'guidedPrayer', 'Prayer', 'Prière')}{lessonField(index, 'application', 'Practical response', 'Mise en pratique')}</>}{!lesson.id && index === draft.lessons.length - 1 ? <button type="button" className="btn btn-outline" onClick={() => edit('lessons', draft.lessons.slice(0, -1))}>{tr('Remove unsaved lesson', 'Retirer cette leçon non enregistrée')}</button> : null}</fieldset>)}
            <button type="button" className="btn btn-outline" disabled={busy || draft.lessons.length >= 30} onClick={() => edit('lessons', [...draft.lessons, newLesson()])}>{tr('Add lesson', 'Ajouter une leçon')}</button>
          </>}
          <label className="check-row"><input type="checkbox" disabled={busy} checked={reviewed} onChange={e => setReviewed(e.target.checked)} />{tr('I reviewed the Scripture context, pastoral wording and publication rights for this version.', 'J’ai vérifié le contexte biblique, la formulation pastorale et les droits pour cette version.')}</label>
          <div className="learning-toolbar"><button type="submit" className="btn btn-outline" disabled={busy}>{busy ? tr('Saving…', 'Enregistrement…') : tr('Save draft / unpublish', 'Enregistrer le brouillon / dépublier')}</button><button type="button" className="btn btn-primary" disabled={busy || !reviewed} onClick={() => void save(true)}>{tr('Save and publish', 'Enregistrer et publier')}</button></div>
        </form>
      </>}
    </>}
  </Shell>;
}
