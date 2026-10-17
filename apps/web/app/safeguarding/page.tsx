'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Flag, ShieldCheck, Users } from 'lucide-react';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { CARE_MESSAGE_MAX } from '../../components/care/limits';
import { CareEmpty, CareError, CareLoading, useCareToken } from '../../components/care/states';
import { reportCategoryLabel, topicLabel, type CareTopic } from '../../lib/care-api';
import { languageLabel } from '../../lib/pastors-api';
import { safeguardingApi, type Overview, type ReportDetail, type ReportSummary } from '../../lib/safeguarding-api';

type Ui = 'en' | 'fr';
type Bilingual = [en: string, fr: string];
type Act = (fn: (t: string) => Promise<unknown>, done: Bilingual | null) => Promise<void>;

const statusText = (s: ReportSummary['status'], ui: Ui) => ({ OPEN: ['Waiting', 'En attente'], ACKNOWLEDGED: ['Acknowledged', 'Pris en compte'], RESOLVED: ['Resolved', 'Résolu'] } as const)[s][ui === 'fr' ? 1 : 0];
const timeText = (value: string, ui: Ui) => new Date(value).toLocaleString(ui === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Safeguarding() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const token = useCareToken();
  const [overview, setOverview] = useState<Overview | null>(null); const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [denied, setDenied] = useState(false); const [loadError, setLoadError] = useState<unknown>(null); const [reload, setReload] = useState(0);
  const [openReport, setOpenReport] = useState<ReportDetail | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [message, setMessage] = useState<Bilingual | null>(null);
  const retry = useCallback(() => setReload(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController(); setLoadError(null);
    (async () => {
      try { const t = await token(); const [o, r] = await Promise.all([safeguardingApi.overview(t, controller.signal), safeguardingApi.reports(t, controller.signal)]); if (!controller.signal.aborted) { setOverview(o); setReports(r); } }
      catch (e) { if (controller.signal.aborted) return; if ((e as { status?: number }).status === 403) setDenied(true); else setLoadError(e); }
    })();
    return () => controller.abort();
  }, [token, reload]);
  // Stable across renders, so the child forms that hold their own drafts are not handed a new callback each time.
  const act = useCallback<Act>(async (fn, done) => {
    setBusy(true); setError(null); setMessage(null);
    try { await fn(await token()); setMessage(done); setReload(n => n + 1); } catch (e) { setError(e); } finally { setBusy(false); }
  }, [token]);
  const view = (id: string) => act(async t => setOpenReport(await safeguardingApi.report(t, id)), null);

  return <Shell title={tr('Safeguarding', 'Protection')}>
    <span className="eyebrow">{tr('SAFEGUARDING LEAD', 'RÉFÉRENT PROTECTION')}</span>
    <h1 className="page-heading" style={{ marginTop: 9 }}>{tr('Safeguarding', 'Protection')}</h1>
    {denied ? <div className="card status-card" style={{ marginTop: 20 }}><ShieldCheck size={30} aria-hidden="true"/><h2>{tr('This page is for LifeBook’s safeguarding lead', 'Cette page est réservée au référent protection de LifeBook')}</h2><p>{tr('To report a concern about a conversation, use “Report a concern” inside that conversation.', 'Pour signaler un problème dans une conversation, utilisez « Signaler un problème » dans cette conversation.')}</p><Link className="btn btn-primary" href="/care">{tr('Go to Ask a pastor', 'Aller à Demander un pasteur')}</Link></div>
      : loadError && !overview ? <div style={{ marginTop: 20 }}><CareError error={loadError} language={language} onRetry={retry}/></div>
      : !overview || !reports ? <div style={{ marginTop: 20 }}><CareLoading label={tr('Loading safeguarding overview…', 'Chargement du tableau de protection…')} lines={4}/></div>
      : <div className="stack" style={{ marginTop: 20 }}>
        <p className="notice">{tr('You see a conversation only when the person reporting chose to share a copy. Every report you open, and every action, is logged.', 'Vous ne voyez une conversation que si l’auteur du signalement a choisi d’en partager une copie. Chaque signalement ouvert et chaque action sont enregistrés.')}</p>
        {message && <p className="notice" role="status">{message[language === 'fr' ? 1 : 0]}</p>}
        {error ? <CareError error={error} language={language}/> : loadError ? <CareError error={loadError} language={language} onRetry={retry}/> : null}
        <div className="grid cols-3">
          <div className="card sg-stat"><span className="muted">{tr('Reports waiting', 'Signalements en attente')}</span><strong>{overview.openReports}</strong></div>
          <div className={`card sg-stat${overview.overdueReports ? ' warn' : ''}`}><span className="muted">{tr('Waiting over 24 h', 'En attente depuis plus de 24 h')}</span><strong>{overview.overdueReports}</strong>{overview.overdueReports > 0 && <span className="pill sg-overdue">{tr('Needs attention', 'À traiter')}</span>}</div>
          <div className={`card sg-stat${overview.waitingTooLong.length ? ' warn' : ''}`}><span className="muted">{tr('Requests no pastor has taken (24 h+)', 'Demandes non prises (24 h et plus)')}</span><strong>{overview.waitingTooLong.length}</strong>{overview.waitingTooLong.length > 0 && <span className="pill sg-overdue">{tr('Needs attention', 'À traiter')}</span>}</div>
        </div>

        <section className="card" aria-labelledby="sg-reports">
          <h2 id="sg-reports" className="icon-line" style={{ fontSize: 19 }}><Flag size={18} aria-hidden="true"/> {tr('Reports', 'Signalements')}</h2>
          {!reports.length ? <CareEmpty icon={Flag}>{tr('No reports.', 'Aucun signalement.')}</CareEmpty> : <ul className="prayer-list care-list">{reports.map(r => <li key={r.id}>
            <button type="button" className={`prayer-item${openReport?.id === r.id ? ' active' : ''}`} aria-current={openReport?.id === r.id ? 'true' : undefined} disabled={busy} onClick={() => void view(r.id)}>
              <span className="prayer-item-head"><strong>{reportCategoryLabel(r.category, language)}</strong><span className="muted">{timeText(r.createdAt, language)}</span></span>
              <span className="prayer-item-preview">{statusText(r.status, language)} · {r.reporterRole === 'member' ? tr('from a member', 'd’un membre') : tr('from a pastor', 'd’un pasteur')}{r.aboutPastor ? ` · ${tr('about', 'concernant')} ${r.aboutPastor.displayName}` : ''}{r.sharedConversation ? ` · ${tr('conversation shared', 'conversation partagée')}` : ''}</span>
              {r.overdue && <span className="pill sg-overdue">{tr('Over 24 h', 'Plus de 24 h')}</span>}
            </button></li>)}</ul>}
          {openReport && <ReportPanel report={openReport} language={language} busy={busy} act={act} onUpdate={setOpenReport}/>}
        </section>

        {overview.waitingTooLong.length > 0 && <section className="card" aria-labelledby="sg-waiting">
          <h2 id="sg-waiting" className="icon-line" style={{ fontSize: 19 }}><AlertTriangle size={18} aria-hidden="true"/> {tr('Requests waiting too long', 'Demandes en attente trop longue')}</h2>
          <p className="muted" style={{ fontSize: 13 }}>{tr('Content stays private. Ask a pastor who speaks the language to take these.', 'Le contenu reste privé. Demandez à un pasteur qui parle la langue de les prendre.')}</p>
          <ul className="prayer-list care-list">{overview.waitingTooLong.map((w, i) => <li key={i} className="care-queue-item"><span className="prayer-item-head"><strong>{topicLabel(w.topic as CareTopic, language)}</strong><span className="muted">{w.waitingHours} h</span></span><span className="prayer-item-preview">{languageLabel(w.language, language)}</span></li>)}</ul>
        </section>}

        <section className="card" aria-labelledby="sg-pastors">
          <h2 id="sg-pastors" className="icon-line" style={{ fontSize: 19 }}><Users size={18} aria-hidden="true"/> {tr('Pastors', 'Pasteurs')}</h2>
          {!overview.pastors.length ? <CareEmpty icon={Users}>{tr('No pastors yet.', 'Aucun pasteur pour le moment.')}</CareEmpty>
            : <div className="sg-table-wrap" role="region" aria-labelledby="sg-pastors" tabIndex={0}><table className="sg-table"><thead><tr><th scope="col">{tr('Pastor', 'Pasteur')}</th><th scope="col">{tr('Status', 'Statut')}</th><th scope="col">{tr('Open', 'Ouvertes')}</th><th scope="col">{tr('Action', 'Action')}</th></tr></thead>
            <tbody>{overview.pastors.map(p => <tr key={p.slug}>
              <th scope="row"><strong>{p.displayName}</strong><br/><span className="muted">{p.languages.map(l => languageLabel(l, language)).join(', ')}</span></th>
              <td>{p.suspended ? tr('Suspended', 'Suspendu') : p.active ? (p.acceptingRequests ? tr('Active, accepting', 'Actif, disponible') : tr('Active, not accepting', 'Actif, indisponible')) : tr('Not active', 'Inactif')}</td>
              <td>{p.openCases}</td>
              <td>{p.suspended ? <button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={() => { if (window.confirm(tr(`Reinstate ${p.displayName}?`, `Rétablir ${p.displayName} ?`))) void act(t => safeguardingApi.reinstate(t, p.slug), ['Pastor reinstated.', 'Pasteur rétabli.']); }}>{tr('Reinstate', 'Rétablir')}</button>
                : p.active ? <SuspendForm slug={p.slug} name={p.displayName} language={language} busy={busy} act={act}/> : null}</td>
            </tr>)}</tbody></table></div>}
        </section>
      </div>}
  </Shell>;
}

/** The opened report. Owns the resolution draft so typing does not re-render the lists. */
function ReportPanel({ report, language, busy, act, onUpdate }: { report: ReportDetail; language: Ui; busy: boolean; act: Act; onUpdate: (r: ReportDetail) => void }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [resolution, setResolution] = useState(''); const heading = useRef<HTMLHeadingElement>(null);
  // Opening a report moves focus to it, so keyboard and screen-reader users land on what they chose.
  useEffect(() => { setResolution(''); heading.current?.focus(); }, [report.id]);
  return <div className="sg-report">
    <h3 ref={heading} tabIndex={-1}>{reportCategoryLabel(report.category, language)} · {statusText(report.status, language)}</h3>
    <p className="saved-note">{report.details}</p>
    {report.transcript ? <ol className="care-messages" aria-label={tr('Shared conversation', 'Conversation partagée')}>{report.transcript.map((m, i) => <li key={i} className={`care-message from-${m.from}`}><span className="care-author">{m.from === 'member' ? tr('Member', 'Membre') : tr('Pastor', 'Pasteur')} · <time dateTime={m.at}>{timeText(m.at, language)}</time></span><p>{m.text}</p></li>)}</ol>
      : <p className="muted">{tr('The conversation was not shared with this report.', 'La conversation n’a pas été partagée avec ce signalement.')}</p>}
    {report.resolution && <p className="notice"><strong>{tr('Resolution:', 'Résolution :')}</strong> {report.resolution}</p>}
    {report.status === 'OPEN' && <button type="button" className="btn btn-soft btn-sm" style={{ justifySelf: 'start' }} disabled={busy} onClick={() => void act(async t => onUpdate(await safeguardingApi.acknowledge(t, report.id)), ['Report acknowledged.', 'Signalement pris en compte.'])}>{tr('Acknowledge', 'Prendre en compte')}</button>}
    {report.status !== 'RESOLVED' && <form className="stack" style={{ gap: 8, marginTop: 12 }} onSubmit={e => { e.preventDefault(); void act(async t => onUpdate(await safeguardingApi.resolve(t, report.id, resolution)), ['Report resolved.', 'Signalement résolu.']); }}>
      <label className="form-field"><span className="field-label">{tr('How was it resolved?', 'Comment a-t-il été résolu ?')}</span><textarea id="sg-resolution" className="textarea" style={{ minHeight: 80 }} maxLength={CARE_MESSAGE_MAX} required value={resolution} onChange={e => setResolution(e.target.value)}/></label>
      <button className="btn btn-primary btn-sm" style={{ justifySelf: 'start' }} disabled={busy || !resolution.trim()}>{tr('Mark resolved', 'Marquer comme résolu')}</button>
    </form>}
  </div>;
}

/** One pastor's suspend control, with its own reason draft and an accessible label. */
function SuspendForm({ slug, name, language, busy, act }: { slug: string; name: string; language: Ui; busy: boolean; act: Act }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [reason, setReason] = useState('');
  return <form className="sg-suspend" onSubmit={e => { e.preventDefault(); if (window.confirm(tr(`Suspend ${name} now? Their profile is hidden and their conversations return to the queue.`, `Suspendre ${name} maintenant ? Son profil est masqué et ses conversations retournent dans la file.`))) void act(t => safeguardingApi.suspend(t, slug, reason), ['Pastor suspended.', 'Pasteur suspendu.']); }}>
    <input id={`reason-${slug}`} className="input" aria-label={tr(`Reason for suspending ${name}`, `Motif de la suspension de ${name}`)} placeholder={tr('Reason (required)', 'Motif (obligatoire)')} required value={reason} onChange={e => setReason(e.target.value)}/>
    <button className="btn btn-outline btn-sm" disabled={busy || !reason.trim()}>{tr('Suspend', 'Suspendre')}</button></form>;
}
