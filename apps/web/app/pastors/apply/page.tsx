'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { CareError, CareLoading, useCareToken } from '../../../components/care/states';
import { CODE_OF_CONDUCT, languageLabel, pastorsApi, type ApplicationForm, type MyApplication } from '../../../lib/pastors-api';

const LANGUAGES = ['en', 'fr', 'tw', 'ak', 'fat', 'ga', 'ee', 'ha', 'dag'];
const COUNTRIES: [string, string, string][] = [['GH', 'Ghana', 'Ghana'], ['FR', 'France', 'France'], ['CI', 'Côte d’Ivoire', 'Côte d’Ivoire'], ['TG', 'Togo', 'Togo'], ['BJ', 'Benin', 'Bénin'], ['BF', 'Burkina Faso', 'Burkina Faso'], ['NG', 'Nigeria', 'Nigeria'], ['GB', 'United Kingdom', 'Royaume-Uni'], ['BE', 'Belgium', 'Belgique'], ['CH', 'Switzerland', 'Suisse'], ['CA', 'Canada', 'Canada'], ['US', 'United States', 'États-Unis']];
const LIMITS = { displayName: 80, bio: 1200, churchName: 120, ministryRole: 80, referenceName: 120, referenceContact: 200, course: 120 };
const EMPTY: ApplicationForm = { displayName: '', slug: '', bio: '', languages: [], churchName: '', ministryRole: '', country: '', referenceName: '', referenceContact: '', trainingCourse: '', trainingCompletedOn: '', codeOfConduct: false };
/** "Rev. Kwame Mensah" → "kwame-mensah": the address of the public profile once approved. */
const slugify = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(rev|pastor|pst|dr|apostle|bishop|ev)\.?\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-').slice(0, 60);

export default function ApplyAsPastor() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const token = useCareToken();
  const [mine, setMine] = useState<MyApplication | null>(null); const [loadError, setLoadError] = useState<unknown>(null); const [reload, setReload] = useState(0);
  const [form, setForm] = useState<ApplicationForm>(EMPTY); const [slugTouched, setSlugTouched] = useState(false); const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController(); setLoadError(null);
    (async () => {
      try {
        const value = await pastorsApi.myApplication(await token(), controller.signal);
        if (controller.signal.aborted) return;
        setMine(value);
        if (value.status !== 'NOT_REQUESTED') { const { displayName, slug, bio, languages, churchName, ministryRole, country, referenceName, trainingCourse, trainingCompletedOn } = value; setForm({ ...EMPTY, displayName, slug, bio, languages, churchName, ministryRole, country, referenceName, trainingCourse, trainingCompletedOn, codeOfConduct: true }); setSlugTouched(true); }
      } catch (e) { if (!controller.signal.aborted) setLoadError(e); }
    })();
    return () => controller.abort();
  }, [token, reload]);

  const set = <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) => { setSaved(false); setForm(f => ({ ...f, [key]: value, ...(key === 'displayName' && !slugTouched ? { slug: slugify(value as string) } : {}) })); };
  const toggleLanguage = (code: string) => set('languages', form.languages.includes(code) ? form.languages.filter(l => l !== code) : [...form.languages, code]);
  const submit = async () => {
    setBusy(true); setError(null); setSaved(false);
    try { setMine(await pastorsApi.apply(await token(), form)); setEditing(false); setSaved(true); setForm(f => ({ ...f, referenceContact: '' })); window.scrollTo({ top: 0 }); }
    catch (e) { setError(e); } finally { setBusy(false); }
  };
  const today = new Date().toISOString().slice(0, 10);
  const applied = mine && mine.status !== 'NOT_REQUESTED';
  const showForm = mine && (!applied || editing);

  return <Shell title={tr('Serve as a pastor', 'Servir comme pasteur')}>
    <div className="page-intro">
      <span className="eyebrow">{tr('PASTORAL CARE PILOT', 'PILOTE D’ACCOMPAGNEMENT PASTORAL')}</span>
      <h1 className="page-heading">{tr('Serve as a pastor on LifeBook', 'Servir comme pasteur sur LifeBook')}</h1>
      <p className="subheading">{tr('Members can ask a verified pastor to listen and pray with them. Tell us about your ministry; LifeBook’s safeguarding lead reviews every application and contacts your reference before anyone can reach you.', 'Les membres peuvent demander à un pasteur vérifié de les écouter et de prier avec eux. Présentez votre ministère : le référent protection de LifeBook examine chaque candidature et contacte votre référence avant que quiconque puisse vous joindre.')}</p>
    </div>
    {loadError && !mine ? <CareError error={loadError} language={language} onRetry={() => setReload(n => n + 1)}/>
      : !mine ? <CareLoading label={tr('Loading your application…', 'Chargement de votre candidature…')} lines={4}/>
      : <div className="stack">
        {saved && <p className="notice" role="status">{tr('Application saved. The safeguarding lead will review it.', 'Candidature enregistrée. Le référent protection va l’examiner.')}</p>}
        {applied && <StatusCard mine={mine} language={language} onEdit={() => { setEditing(true); setSaved(false); }} editing={editing}/>}
        {showForm && <form className="card stack pastor-apply" onSubmit={e => { e.preventDefault(); void submit(); }}>
          <fieldset className="stack"><legend><h2>{tr('Your public profile', 'Votre profil public')}</h2></legend>
            <p className="muted">{tr('Shown to members only after approval.', 'Visible par les membres seulement après validation.')}</p>
            <label className="form-field" htmlFor="pa-name"><span className="field-label">{tr('Name as members will see it', 'Nom tel que les membres le verront')}</span><input id="pa-name" className="input" required maxLength={LIMITS.displayName} value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="Rev. Kwame Mensah"/></label>
            <label className="form-field" htmlFor="pa-slug"><span className="field-label">{tr('Profile address', 'Adresse du profil')}</span><span className="input-prefix"><span aria-hidden="true">lifebook…/pastors/</span><input id="pa-slug" className="input" required pattern="[a-z0-9]+(-[a-z0-9]+){0,5}" maxLength={60} value={form.slug} onChange={e => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()); }}/></span><span className="muted field-hint">{tr('Lowercase words joined by hyphens.', 'Mots en minuscules reliés par des tirets.')}</span></label>
            <label className="form-field" htmlFor="pa-bio"><span className="field-label">{tr('About you and your ministry', 'Vous et votre ministère')}</span><textarea id="pa-bio" className="textarea" required maxLength={LIMITS.bio} value={form.bio} onChange={e => set('bio', e.target.value)}/><span className="muted field-hint">{form.bio.length}/{LIMITS.bio}</span></label>
            <div className="form-field" role="group" aria-labelledby="pa-langs"><span className="field-label" id="pa-langs">{tr('Languages you can pray and listen in', 'Langues dans lesquelles vous pouvez écouter et prier')}</span>
              <div className="chip-row">{LANGUAGES.map(code => <label key={code} className={`chip-check${form.languages.includes(code) ? ' on' : ''}`}><input type="checkbox" checked={form.languages.includes(code)} onChange={() => toggleLanguage(code)}/>{languageLabel(code, language)}</label>)}</div></div>
          </fieldset>
          <fieldset className="stack"><legend><h2>{tr('Your church', 'Votre Église')}</h2></legend>
            <div className="grid cols-2">
              <label className="form-field" htmlFor="pa-church"><span className="field-label">{tr('Church or ministry', 'Église ou ministère')}</span><input id="pa-church" className="input" required maxLength={LIMITS.churchName} value={form.churchName} onChange={e => set('churchName', e.target.value)}/></label>
              <label className="form-field" htmlFor="pa-role"><span className="field-label">{tr('Your role', 'Votre rôle')}</span><input id="pa-role" className="input" required maxLength={LIMITS.ministryRole} value={form.ministryRole} onChange={e => set('ministryRole', e.target.value)} placeholder={tr('Senior Pastor', 'Pasteur principal')}/></label>
            </div>
            <label className="form-field" htmlFor="pa-country"><span className="field-label">{tr('Country where you serve', 'Pays où vous servez')}</span><select id="pa-country" className="input" required value={form.country} onChange={e => set('country', e.target.value)}><option value="">{tr('Choose…', 'Choisir…')}</option>{COUNTRIES.map(([code, en, fr]) => <option key={code} value={code}>{language === 'fr' ? fr : en}</option>)}</select></label>
          </fieldset>
          <fieldset className="stack"><legend><h2>{tr('Someone who can vouch for you', 'Une personne qui peut se porter garante')}</h2></legend>
            <p className="muted">{tr('A senior pastor, bishop or elder who knows your ministry. We contact them before approval. Their contact details are encrypted and seen only by the safeguarding lead.', 'Un pasteur principal, un évêque ou un ancien qui connaît votre ministère. Nous le contactons avant la validation. Ses coordonnées sont chiffrées et vues uniquement par le référent protection.')}</p>
            <div className="grid cols-2">
              <label className="form-field" htmlFor="pa-ref"><span className="field-label">{tr('Their name and role', 'Son nom et son rôle')}</span><input id="pa-ref" className="input" required maxLength={LIMITS.referenceName} value={form.referenceName} onChange={e => set('referenceName', e.target.value)}/></label>
              <label className="form-field" htmlFor="pa-ref-contact"><span className="field-label">{tr('Their phone or email', 'Son téléphone ou e-mail')}</span><input id="pa-ref-contact" className="input" required={!applied || !('hasReferenceContact' in mine && mine.hasReferenceContact)} maxLength={LIMITS.referenceContact} value={form.referenceContact} onChange={e => set('referenceContact', e.target.value)} placeholder={applied ? tr('On file; leave blank to keep it', 'Enregistré ; laissez vide pour le garder') : ''}/></label>
            </div>
          </fieldset>
          <fieldset className="stack"><legend><h2>{tr('Training', 'Formation')}</h2></legend>
            <p className="muted">{tr('A suicide-awareness course, for example Mental Health First Aid or LivingWorks safeTALK. The safeguarding lead may ask for your certificate.', 'Une formation à la prévention du suicide, par exemple Premiers secours en santé mentale ou LivingWorks safeTALK. Le référent protection peut demander votre attestation.')}</p>
            <div className="grid cols-2">
              <label className="form-field" htmlFor="pa-course"><span className="field-label">{tr('Course', 'Formation')}</span><input id="pa-course" className="input" required maxLength={LIMITS.course} value={form.trainingCourse} onChange={e => set('trainingCourse', e.target.value)}/></label>
              <label className="form-field" htmlFor="pa-course-date"><span className="field-label">{tr('Completed on', 'Terminée le')}</span><input id="pa-course-date" type="date" className="input" required max={today} value={form.trainingCompletedOn} onChange={e => set('trainingCompletedOn', e.target.value)}/></label>
            </div>
          </fieldset>
          <fieldset className="stack"><legend><h2>{tr('Code of conduct', 'Code de conduite')}</h2></legend>
            <ul className="conduct-list">{CODE_OF_CONDUCT.map(([en, fr], i) => <li key={i}>{language === 'fr' ? fr : en}</li>)}</ul>
            <label className="check-row" htmlFor="pa-conduct"><input id="pa-conduct" type="checkbox" required checked={form.codeOfConduct} onChange={e => set('codeOfConduct', e.target.checked)}/><span><strong className="check-row-title">{tr('I have read and will keep this code of conduct', 'J’ai lu ce code de conduite et je m’engage à le respecter')}</strong>{tr('Your agreement is recorded with today’s date.', 'Votre engagement est enregistré à la date d’aujourd’hui.')}</span></label>
          </fieldset>
          {error ? <CareError error={error} language={language}/> : null}
          <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={busy || !form.languages.length}>{busy ? tr('Sending…', 'Envoi…') : applied ? tr('Save changes', 'Enregistrer les modifications') : tr('Send application', 'Envoyer la candidature')}</button>
            {applied && <button type="button" className="btn btn-outline" disabled={busy} onClick={() => { setEditing(false); setError(null); }}>{tr('Cancel', 'Annuler')}</button>}
          </div>
          {applied && mine.status === 'APPROVED' && <p className="muted">{tr('Changing your church or reference sends your application back for review.', 'Modifier votre Église ou votre référence renvoie votre candidature en examen.')}</p>}
        </form>}
        <p className="notice">{tr('Questions about serving? Write to the LifeBook team before applying.', 'Des questions sur ce service ? Écrivez à l’équipe LifeBook avant de postuler.')} <Link className="text-link" href="/pastors">{tr('See our pastors', 'Voir nos pasteurs')}</Link></p>
      </div>}
  </Shell>;
}

function StatusCard({ mine, language, onEdit, editing }: { mine: Exclude<MyApplication, { status: 'NOT_REQUESTED' }>; language: 'en' | 'fr'; onEdit: () => void; editing: boolean }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [Icon, title, text] = mine.suspended ? [ShieldCheck, tr('Your profile is paused', 'Votre profil est suspendu'), tr('The safeguarding lead has paused your profile. They will contact you.', 'Le référent protection a suspendu votre profil. Il vous contactera.')]
    : mine.status === 'APPROVED' ? [BadgeCheck, tr('You are a verified pastor', 'Vous êtes un pasteur vérifié'), tr('Members can find your profile. Turn requests on or off from Ask a pastor.', 'Les membres peuvent trouver votre profil. Activez ou désactivez les demandes depuis Demander un pasteur.')]
    : mine.status === 'REJECTED' ? [XCircle, tr('Your application needs changes', 'Votre candidature doit être modifiée'), mine.reviewerNotes ?? '']
    : [Clock, tr('Application received', 'Candidature reçue'), tr('The safeguarding lead will contact your reference, then review your application. This usually takes a few days.', 'Le référent protection va contacter votre référence, puis examiner votre candidature. Cela prend généralement quelques jours.')];
  return <section className={`card status-card apply-status ${mine.status.toLowerCase()}`} aria-live="polite">
    <Icon size={30} aria-hidden="true"/><h2>{title}</h2>{text && <p>{text}</p>}
    <p className="muted">{tr('Submitted', 'Envoyée le')} {new Date(mine.submittedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <div className="icon-line" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      {mine.status === 'APPROVED' && !mine.suspended && <Link className="btn btn-primary" href="/care/pastor">{tr('Open my pastor space', 'Ouvrir mon espace pasteur')}</Link>}
      {!editing && !mine.suspended && <button type="button" className="btn btn-outline" onClick={onEdit}>{mine.status === 'REJECTED' ? tr('Update and resend', 'Modifier et renvoyer') : tr('Edit my application', 'Modifier ma candidature')}</button>}
    </div>
  </section>;
}
