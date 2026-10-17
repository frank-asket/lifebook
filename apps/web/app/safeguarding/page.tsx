'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { AlertTriangle, Flag, ShieldCheck, Users } from 'lucide-react';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { reportCategoryLabel, topicLabel, type CareTopic } from '../../lib/care-api';
import { languageLabel } from '../../lib/pastors-api';
import { safeguardingApi, type Overview, type ReportDetail, type ReportSummary } from '../../lib/safeguarding-api';

export default function Safeguarding() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { getToken } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null); const [reports, setReports] = useState<ReportSummary[]>([]);
  const [denied, setDenied] = useState(false); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
  const [openReport, setOpenReport] = useState<ReportDetail | null>(null); const [resolution, setResolution] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const token = async () => { const value = await getToken(); if (!value) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); return value; };
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try { const t = await token(); const [o, r] = await Promise.all([safeguardingApi.overview(t, controller.signal), safeguardingApi.reports(t, controller.signal)]); if (!controller.signal.aborted) { setOverview(o); setReports(r); } }
      catch (e) { if (controller.signal.aborted) return; if ((e as { status?: number }).status === 403) setDenied(true); else setError(e instanceof Error ? e.message : 'Unavailable'); }
    })();
    return () => controller.abort();
  }, [getToken, reload]);
  const act = async (fn: (t: string) => Promise<unknown>, done: string) => {
    setBusy(true); setError(''); setMessage('');
    try { await fn(await token()); setMessage(done); setReload(n => n + 1); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); } finally { setBusy(false); }
  };
  const view = (id: string) => act(async t => { setOpenReport(await safeguardingApi.report(t, id)); setResolution(''); }, '');
  const time = (value: string) => new Date(value).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const statusText = (s: ReportSummary['status']) => ({ OPEN: tr('Waiting', 'En attente'), ACKNOWLEDGED: tr('Acknowledged', 'Pris en compte'), RESOLVED: tr('Resolved', 'Résolu') })[s];

  return <Shell title={tr('Safeguarding', 'Protection')}>
    <span className="eyebrow">{tr('SAFEGUARDING LEAD', 'RÉFÉRENT PROTECTION')}</span>
    <h1 className="page-heading" style={{ marginTop: 9 }}>{tr('Safeguarding', 'Protection')}</h1>
    {denied ? <div className="card status-card" style={{ marginTop: 20 }}><ShieldCheck size={30} aria-hidden="true"/><h2>{tr('This page is for LifeBook’s safeguarding lead', 'Cette page est réservée au référent protection de LifeBook')}</h2></div>
      : error && !overview ? <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setReload(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>
      : !overview ? <p role="status">{tr('Loading…', 'Chargement…')}</p>
      : <div className="stack" style={{ marginTop: 20 }}>
        <p className="notice">{tr('You see a conversation only when the person reporting chose to share a copy. Every report you open, and every action, is logged.', 'Vous ne voyez une conversation que si l’auteur du signalement a choisi d’en partager une copie. Chaque signalement ouvert et chaque action sont enregistrés.')}</p>
        {message && <p className="notice" role="status">{message}</p>}{error && <p className="alert" role="alert">{error}</p>}
        <div className="grid cols-3">
          <div className="card sg-stat"><span className="muted">{tr('Reports waiting', 'Signalements en attente')}</span><strong>{overview.openReports}</strong></div>
          <div className={`card sg-stat${overview.overdueReports ? ' warn' : ''}`}><span className="muted">{tr('Waiting over 24 h', 'En attente depuis plus de 24 h')}</span><strong>{overview.overdueReports}</strong></div>
          <div className={`card sg-stat${overview.waitingTooLong.length ? ' warn' : ''}`}><span className="muted">{tr('Requests no pastor has taken (24 h+)', 'Demandes non prises (24 h et plus)')}</span><strong>{overview.waitingTooLong.length}</strong></div>
        </div>

        <section className="card" aria-labelledby="sg-reports">
          <h2 id="sg-reports" className="icon-line" style={{ fontSize: 19 }}><Flag size={18} aria-hidden="true"/> {tr('Reports', 'Signalements')}</h2>
          {!reports.length ? <p className="muted">{tr('No reports.', 'Aucun signalement.')}</p> : <ul className="prayer-list">{reports.map(r => <li key={r.id}>
            <button type="button" className={`prayer-item${openReport?.id === r.id ? ' active' : ''}`} disabled={busy} onClick={() => void view(r.id)}>
              <span className="prayer-item-head"><strong>{reportCategoryLabel(r.category, language)}</strong><span className="muted">{time(r.createdAt)}</span></span>
              <span className="prayer-item-preview">{statusText(r.status)} · {r.reporterRole === 'member' ? tr('from a member', 'd’un membre') : tr('from a pastor', 'd’un pasteur')}{r.aboutPastor ? ` · ${tr('about', 'concernant')} ${r.aboutPastor.displayName}` : ''}{r.sharedConversation ? ` · ${tr('conversation shared', 'conversation partagée')}` : ''}</span>
              {r.overdue && <span className="pill sg-overdue">{tr('Over 24 h', 'Plus de 24 h')}</span>}
            </button></li>)}</ul>}
          {openReport && <div className="sg-report">
            <h3>{reportCategoryLabel(openReport.category, language)} · {statusText(openReport.status)}</h3>
            <p className="saved-note">{openReport.details}</p>
            {openReport.transcript ? <ol className="care-messages">{openReport.transcript.map((m, i) => <li key={i} className={`care-message from-${m.from}`}><span className="care-author">{m.from === 'member' ? tr('Member', 'Membre') : tr('Pastor', 'Pasteur')} · {time(m.at)}</span><p>{m.text}</p></li>)}</ol>
              : <p className="muted">{tr('The conversation was not shared with this report.', 'La conversation n’a pas été partagée avec ce signalement.')}</p>}
            {openReport.resolution && <p className="notice"><strong>{tr('Resolution:', 'Résolution :')}</strong> {openReport.resolution}</p>}
            {openReport.status === 'OPEN' && <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => void act(async t => setOpenReport(await safeguardingApi.acknowledge(t, openReport.id)), tr('Report acknowledged.', 'Signalement pris en compte.'))}>{tr('Acknowledge', 'Prendre en compte')}</button>}
            {openReport.status !== 'RESOLVED' && <form className="stack" style={{ gap: 8, marginTop: 12 }} onSubmit={e => { e.preventDefault(); void act(async t => setOpenReport(await safeguardingApi.resolve(t, openReport.id, resolution)), tr('Report resolved.', 'Signalement résolu.')); }}>
              <label className="form-field"><span className="field-label">{tr('How was it resolved?', 'Comment a-t-il été résolu ?')}</span><textarea id="sg-resolution" className="textarea" style={{ minHeight: 80 }} maxLength={2000} value={resolution} onChange={e => setResolution(e.target.value)}/></label>
              <button className="btn btn-primary btn-sm" disabled={busy || !resolution.trim()}>{tr('Mark resolved', 'Marquer comme résolu')}</button>
            </form>}
          </div>}
        </section>

        {overview.waitingTooLong.length > 0 && <section className="card" aria-labelledby="sg-waiting">
          <h2 id="sg-waiting" className="icon-line" style={{ fontSize: 19 }}><AlertTriangle size={18} aria-hidden="true"/> {tr('Requests waiting too long', 'Demandes en attente trop longue')}</h2>
          <p className="muted" style={{ fontSize: 13 }}>{tr('Content stays private. Ask a pastor who speaks the language to take these.', 'Le contenu reste privé. Demandez à un pasteur qui parle la langue de les prendre.')}</p>
          <ul className="prayer-list">{overview.waitingTooLong.map((w, i) => <li key={i} className="care-queue-item"><span className="prayer-item-head"><strong>{topicLabel(w.topic as CareTopic, language)}</strong><span className="muted">{w.waitingHours} h</span></span><span className="prayer-item-preview">{languageLabel(w.language, language)}</span></li>)}</ul>
        </section>}

        <section className="card" aria-labelledby="sg-pastors">
          <h2 id="sg-pastors" className="icon-line" style={{ fontSize: 19 }}><Users size={18} aria-hidden="true"/> {tr('Pastors', 'Pasteurs')}</h2>
          <div className="sg-table-wrap"><table className="sg-table"><thead><tr><th>{tr('Pastor', 'Pasteur')}</th><th>{tr('Status', 'Statut')}</th><th>{tr('Open', 'Ouvertes')}</th><th>{tr('Action', 'Action')}</th></tr></thead>
            <tbody>{overview.pastors.map(p => <tr key={p.slug}>
              <td><strong>{p.displayName}</strong><br/><span className="muted">{p.languages.map(l => languageLabel(l, language)).join(', ')}</span></td>
              <td>{p.suspended ? tr('Suspended', 'Suspendu') : p.active ? (p.acceptingRequests ? tr('Active, accepting', 'Actif, disponible') : tr('Active, not accepting', 'Actif, indisponible')) : p.status}</td>
              <td>{p.openCases}</td>
              <td>{p.suspended ? <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => window.confirm(tr(`Reinstate ${p.displayName}?`, `Rétablir ${p.displayName} ?`)) && void act(t => safeguardingApi.reinstate(t, p.slug), tr('Pastor reinstated.', 'Pasteur rétabli.'))}>{tr('Reinstate', 'Rétablir')}</button>
                : p.active && <form className="sg-suspend" onSubmit={e => { e.preventDefault(); if (window.confirm(tr(`Suspend ${p.displayName} now? Their profile is hidden and their conversations return to the queue.`, `Suspendre ${p.displayName} maintenant ? Son profil est masqué et ses conversations retournent dans la file.`))) void act(t => safeguardingApi.suspend(t, p.slug, reasons[p.slug] ?? ''), tr('Pastor suspended.', 'Pasteur suspendu.')); }}>
                  <input id={`reason-${p.slug}`} className="input" placeholder={tr('Reason (required)', 'Motif (obligatoire)')} value={reasons[p.slug] ?? ''} onChange={e => setReasons(r => ({ ...r, [p.slug]: e.target.value }))}/>
                  <button className="btn btn-outline btn-sm" disabled={busy || !(reasons[p.slug] ?? '').trim()}>{tr('Suspend', 'Suspendre')}</button></form>}</td>
            </tr>)}</tbody></table></div>
        </section>
      </div>}
  </Shell>;
}
