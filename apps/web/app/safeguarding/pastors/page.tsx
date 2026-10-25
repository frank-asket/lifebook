'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { CareEmpty, CareError, CareLoading, useCareToken } from '../../../components/care/states';
import { countryLabel, languageLabel } from '../../../lib/pastors-api';
import { safeguardingApi, type Application } from '../../../lib/safeguarding-api';

type Ui = 'en' | 'fr';
type Filter = 'PENDING' | 'APPROVED' | 'REJECTED';
const FILTERS: [Filter, string, string][] = [['PENDING', 'To review', 'À examiner'], ['APPROVED', 'Approved', 'Validées'], ['REJECTED', 'Sent back', 'Renvoyées']];
const day = (value: string | null, ui: Ui) => value ? new Date(value).toLocaleDateString(ui === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** The safeguarding lead reviews pastor applications: check the reference and training, then approve or send back. */
export default function PastorApplications() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const token = useCareToken();
  const [items, setItems] = useState<Application[] | null>(null); const [denied, setDenied] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null); const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setLoadError(null);
    (async () => {
      try { const rows = await safeguardingApi.applications(await token(), controller.signal); if (!controller.signal.aborted) setItems(rows); }
      catch (e) { if (controller.signal.aborted) return; if ((e as { status?: number }).status === 403) setDenied(true); else setLoadError(e); }
    })();
    return () => controller.abort();
  }, [token, reload]);
  const act = useCallback(async (fn: (t: string) => Promise<unknown>, done: string) => {
    setBusy(true); setError(null); setMessage('');
    try { await fn(await token()); setMessage(done); setReload(n => n + 1); } catch (e) { setError(e); } finally { setBusy(false); }
  }, [token]);
  const counts = (s: Filter) => items?.filter(a => a.status === s).length ?? 0;
  const shown = items?.filter(a => a.status === filter) ?? [];

  return <Shell title={tr('Pastor applications', 'Candidatures de pasteurs')}>
    <Link className="text-link icon-line" href="/safeguarding"><ArrowLeft size={14} aria-hidden="true"/> {tr('Safeguarding', 'Protection')}</Link>
    <h1 className="page-heading" style={{ marginTop: 9 }}>{tr('Pastor applications', 'Candidatures de pasteurs')}</h1>
    {denied ? <div className="card status-card" style={{ marginTop: 20 }}><ShieldCheck size={30} aria-hidden="true"/><h2>{tr('This page is for LifeBook’s safeguarding lead', 'Cette page est réservée au référent protection de LifeBook')}</h2><p>{tr('To apply as a pastor, use the application form.', 'Pour postuler comme pasteur, utilisez le formulaire de candidature.')}</p><Link className="btn btn-primary" href="/pastors/apply">{tr('Apply as a pastor', 'Postuler comme pasteur')}</Link></div>
      : loadError && !items ? <div style={{ marginTop: 20 }}><CareError error={loadError} language={language} onRetry={() => setReload(n => n + 1)}/></div>
      : !items ? <div style={{ marginTop: 20 }}><CareLoading label={tr('Loading applications…', 'Chargement des candidatures…')} lines={4}/></div>
      : <div className="stack" style={{ marginTop: 16 }}>
        <p className="notice">{tr('Before approving: call or write to the reference, check the training (ask for the certificate if unsure), and confirm the code of conduct is signed. Opening this page and every decision are logged.', 'Avant de valider : appelez ou écrivez à la référence, vérifiez la formation (demandez l’attestation en cas de doute) et confirmez que le code de conduite est signé. L’ouverture de cette page et chaque décision sont enregistrées.')}</p>
        {message && <p className="notice" role="status">{message}</p>}
        {error ? <CareError error={error} language={language}/> : null}
        <div className="mini-segmented apps-filter" role="tablist" aria-label={tr('Show applications', 'Afficher les candidatures')}>
          {FILTERS.map(([key, en, fr]) => <button key={key} type="button" role="tab" aria-selected={filter === key} aria-checked={filter === key} onClick={() => setFilter(key)}>{language === 'fr' ? fr : en} <span className="count">{counts(key)}</span></button>)}
        </div>
        {!shown.length ? <div className="card"><CareEmpty icon={ClipboardCheck}>{filter === 'PENDING' ? tr('No applications waiting.', 'Aucune candidature en attente.') : tr('None yet.', 'Aucune pour le moment.')}</CareEmpty></div>
          : shown.map(a => <ApplicationCard key={a.slug ?? a.submittedAt} app={a} language={language} busy={busy} onApprove={() => { if (a.slug && window.confirm(tr(`Approve ${a.displayName}? Their profile becomes visible to members.`, `Valider ${a.displayName} ? Son profil devient visible par les membres.`))) void act(t => safeguardingApi.approve(t, a.slug!), tr(`${a.displayName} is approved.`, `${a.displayName} est validé.`)); }}
              onReject={notes => a.slug ? act(t => safeguardingApi.reject(t, a.slug!, notes), tr('Application sent back with your note.', 'Candidature renvoyée avec votre note.')) : undefined}/>)}
      </div>}
  </Shell>;
}

function ApplicationCard({ app, language, busy, onApprove, onReject }: { app: Application; language: Ui; busy: boolean; onApprove: () => void; onReject: (notes: string) => Promise<unknown> | undefined }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [notes, setNotes] = useState(''); const [rejecting, setRejecting] = useState(false);
  const missing = [!app.referenceName && tr('reference', 'référence'), !app.trainingCompletedOn && tr('training', 'formation'), !app.codeOfConductSignedOn && tr('code of conduct', 'code de conduite')].filter(Boolean);
  const row = (label: string, value: React.ReactNode) => <div className="app-row"><dt>{label}</dt><dd>{value || '—'}</dd></div>;
  return <article className="card application-card" aria-labelledby={`app-${app.slug}`}>
    <header className="application-head">
      <div><h2 id={`app-${app.slug}`}>{app.displayName}</h2><p className="muted">{[app.ministryRole, app.churchName, countryLabel(app.country, language)].filter(Boolean).join(' · ')}</p></div>
      <span className={`pill app-status ${app.status.toLowerCase()}`}>{app.suspended ? tr('Suspended', 'Suspendu') : app.status === 'APPROVED' ? tr('Approved', 'Validé') : app.status === 'REJECTED' ? tr('Sent back', 'Renvoyée') : tr('To review', 'À examiner')}</span>
    </header>
    <p className="pastor-bio">{app.bio}</p>
    <dl className="app-details">
      {row(tr('Languages', 'Langues'), app.languages.map(l => languageLabel(l, language)).join(', '))}
      {row(tr('Profile address', 'Adresse du profil'), app.slug && `/pastors/${app.slug}`)}
      {row(tr('Reference', 'Référence'), app.referenceName)}
      {row(tr('Reference contact', 'Contact de la référence'), app.referenceContact && <span className="selectable">{app.referenceContact}</span>)}
      {row(tr('Training', 'Formation'), app.trainingCourse && `${app.trainingCourse} · ${day(app.trainingCompletedOn, language)}`)}
      {row(tr('Code of conduct signed', 'Code de conduite signé'), day(app.codeOfConductSignedOn, language))}
      {row(tr('Submitted · last change', 'Envoyée · dernière modification'), `${day(app.submittedAt, language)} · ${day(app.updatedAt, language)}`)}
      {app.reviewedAt && row(tr('Last reviewed', 'Dernier examen'), day(app.reviewedAt, language))}
    </dl>
    {app.reviewerNotes && app.status === 'REJECTED' && <p className="notice"><strong>{tr('Note sent to the applicant:', 'Note envoyée au candidat :')}</strong> {app.reviewerNotes}</p>}
    {app.status === 'PENDING' && (app.self
      ? <p className="muted">{tr('This is your own application; another lead must review it.', 'C’est votre propre candidature : un autre référent doit l’examiner.')}</p>
      : <div className="stack" style={{ gap: 10 }}>
        {missing.length > 0 && <p className="muted">{tr('Cannot approve yet; missing:', 'Validation impossible ; il manque :')} {missing.join(', ')}</p>}
        <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || missing.length > 0} onClick={onApprove}><BadgeCheck size={14} aria-hidden="true"/> {tr('Approve', 'Valider')}</button>
          {!rejecting && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setRejecting(true)}>{tr('Send back with a note', 'Renvoyer avec une note')}</button>}
        </div>
        {rejecting && <form className="stack" style={{ gap: 8 }} onSubmit={e => { e.preventDefault(); void onReject(notes)?.then(() => { setRejecting(false); setNotes(''); }); }}>
          <label className="form-field" htmlFor={`notes-${app.slug}`}><span className="field-label">{tr('What should the applicant change? They will see this.', 'Que doit modifier le candidat ? Il verra ce message.')}</span><textarea id={`notes-${app.slug}`} className="textarea" style={{ minHeight: 80 }} maxLength={500} required value={notes} onChange={e => setNotes(e.target.value)}/></label>
          <div className="icon-line" style={{ gap: 10 }}><button className="btn btn-outline btn-sm" disabled={busy || !notes.trim()}>{tr('Send back', 'Renvoyer')}</button><button type="button" className="btn btn-sm" disabled={busy} onClick={() => setRejecting(false)}>{tr('Cancel', 'Annuler')}</button></div>
        </form>}
      </div>)}
  </article>;
}
