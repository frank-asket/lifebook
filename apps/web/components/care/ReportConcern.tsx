'use client';
import { useEffect, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import { careApi, REPORT_CATEGORIES, reportCategoryLabel, type ReportCategory } from '../../lib/care-api';
import { CARE_MESSAGE_MAX } from './limits';
import { CareError, useCareToken } from './states';

/** Sends a concern to LifeBook's safeguarding lead, not to the pastor or their church. */
export function ReportConcern({ id, viewer, language }: { id: string; viewer: 'member' | 'pastor'; language: 'en' | 'fr' }) {
  const token = useCareToken(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [open, setOpen] = useState(false); const [category, setCategory] = useState<ReportCategory | ''>(''); const [details, setDetails] = useState(''); const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [sent, setSent] = useState<null | boolean>(null);
  const opener = useRef<HTMLButtonElement>(null); const first = useRef<HTMLSelectElement>(null); const wasOpen = useRef(false);
  // Move focus into the form when it opens and back to the button that opened it when it closes.
  useEffect(() => { if (open) first.current?.focus(); else if (wasOpen.current) opener.current?.focus(); wasOpen.current = open; }, [open]);
  const submit = async () => {
    if (!category) return;
    setBusy(true); setError(null);
    try {
      const result = await (viewer === 'member' ? careApi.report : careApi.pastorReport)(await token(), id, { category, details, shareConversation: share });
      setSent(result.sharedConversation); setDetails(''); setCategory(''); setShare(false); setOpen(false);
    } catch (e) { setError(e); } finally { setBusy(false); }
  };
  return <section className="card" aria-labelledby={`report-title-${id}`}>
    <h2 id={`report-title-${id}`} className="icon-line" style={{ fontSize: 19 }}><Flag size={16} aria-hidden="true"/> {tr('Report a concern', 'Signaler un problème')}</h2>
    {sent !== null && <p className="notice" role="status">{sent ? tr('Your report and a copy of this conversation were sent to LifeBook’s safeguarding lead.', 'Votre signalement et une copie de cette conversation ont été envoyés au référent protection de LifeBook.') : tr('Your report was sent to LifeBook’s safeguarding lead. The conversation was not shared.', 'Votre signalement a été envoyé au référent protection de LifeBook. La conversation n’a pas été partagée.')}</p>}
    {!open ? <>
      <p className="subheading">{tr('If something here feels wrong or unsafe, tell LifeBook’s safeguarding lead. They are not part of this conversation or any church. If someone is in danger now, call 112.', 'Si quelque chose vous semble anormal ou dangereux, informez le référent protection de LifeBook. Il ne participe pas à cette conversation et ne dépend d’aucune Église. En cas de danger immédiat, appelez le 112.')}</p>
      <button ref={opener} type="button" className="btn btn-outline btn-sm" onClick={() => { setSent(null); setOpen(true); }}>{tr('Report a concern', 'Signaler un problème')}</button>
    </> : <form className="stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); void submit(); }}>
      <label className="form-field"><span className="field-label">{tr('What is it about?', 'De quoi s’agit-il ?')}</span>
        <select ref={first} id="report-category" className="select" value={category} onChange={e => setCategory(e.target.value as ReportCategory)} required><option value="">{tr('Choose…', 'Choisir…')}</option>{REPORT_CATEGORIES.map(c => <option key={c} value={c}>{reportCategoryLabel(c, language)}</option>)}</select></label>
      <label className="form-field"><span className="field-label">{tr('What happened?', 'Que s’est-il passé ?')}</span>
        <textarea id="report-details" className="textarea" style={{ minHeight: 100 }} maxLength={CARE_MESSAGE_MAX} required value={details} onChange={e => setDetails(e.target.value)}/></label>
      <label className="check-row care-check"><input id="report-share" type="checkbox" checked={share} onChange={e => setShare(e.target.checked)}/><span>{tr('Also share a copy of this conversation with the safeguarding lead. It is kept until the report is resolved, then for up to a year.', 'Partager aussi une copie de cette conversation avec le référent protection. Elle est conservée jusqu’à la résolution du signalement, puis un an au plus.')}</span></label>
      <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap' }}><button className="btn btn-primary" disabled={busy || !category || !details.trim()}>{busy ? tr('Sending…', 'Envoi…') : tr('Send report', 'Envoyer le signalement')}</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => setOpen(false)}>{tr('Cancel', 'Annuler')}</button></div>
      {error ? <CareError error={error} language={language}/> : null}
    </form>}
  </section>;
}
