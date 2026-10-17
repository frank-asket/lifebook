'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, HeartHandshake, LockKeyhole } from 'lucide-react';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { CARE_MESSAGE_MAX, CARE_NAME_MAX } from '../../components/care/limits';
import { CARE_TOPICS, careApi, statusLabel, topicLabel, waited, type CareSummary, type CareTopic } from '../../lib/care-api';
import { languageLabel, pastorsApi } from '../../lib/pastors-api';

export default function Care() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { getToken } = useAuth(); const router = useRouter();
  const [mine, setMine] = useState<CareSummary[] | null>(null); const [languages, setLanguages] = useState<string[]>([]); const [isPastor, setIsPastor] = useState(false);
  const [topic, setTopic] = useState<CareTopic | ''>(''); const [requestLanguage, setRequestLanguage] = useState<string>(language);
  const [contact, setContact] = useState<'messages' | 'callback'>('messages'); const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [message, setMessage] = useState(''); const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [loadError, setLoadError] = useState('');
  const token = async () => { const value = await getToken(); if (!value) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); return value; };
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const t = await token();
        const [rows, pastors, status] = await Promise.all([careApi.mine(t, controller.signal), pastorsApi.list(controller.signal), careApi.pastorStatus(t, controller.signal)]);
        if (controller.signal.aborted) return;
        setMine(rows); setIsPastor(status.active);
        const spoken = [...new Set(pastors.flatMap(p => p.languages))];
        setLanguages(spoken); if (spoken.length && !spoken.includes(requestLanguage)) setRequestLanguage(spoken.includes(language) ? language : spoken[0]);
      } catch (e) { if (!controller.signal.aborted) setLoadError(e instanceof Error ? e.message : 'Unavailable'); }
    })();
    return () => controller.abort();
  }, [getToken]);
  const open = (mine ?? []).filter(r => r.status !== 'CLOSED').length;
  const submit = async () => {
    if (!topic) return;
    setBusy(true); setError('');
    try {
      const created = await careApi.create(await token(), { topic, language: requestLanguage, contactPreference: contact, ...(name.trim() ? { name } : {}), ...(contact === 'callback' ? { phone } : {}), message, consent: true });
      router.push(`/care/${created.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); setBusy(false); }
  };

  return <Shell title={tr('Ask a pastor', 'Demander un pasteur')}>
    <span className="eyebrow">{tr('PASTORAL CARE', 'ACCOMPAGNEMENT PASTORAL')}</span>
    <h1 className="page-heading" style={{ marginTop: 9 }}>{tr('Ask a pastor to reach out', 'Demander à un pasteur de vous contacter')}</h1>
    <p className="subheading">{tr('A verified pastor can pray with you and listen, by private message or by phone if you prefer.', 'Un pasteur vérifié peut prier avec vous et vous écouter, par message privé ou par téléphone si vous préférez.')}</p>
    {isPastor && <p className="notice" style={{ marginTop: 16 }}><Link className="text-link" href="/care/pastor">{tr('You are a verified pastor: open your pastor space', 'Vous êtes pasteur vérifié : ouvrir votre espace pasteur')} →</Link></p>}
    <div className="two-up" style={{ marginTop: 24 }}>
      <form className="card stack" style={{ gap: 14 }} onSubmit={e => { e.preventDefault(); void submit(); }}>
        <div className="care-before">
          <h2 style={{ fontSize: 20, margin: 0 }}>{tr('Before you write', 'Avant d’écrire')}</h2>
          <ul>
            <li>{tr('One verified pastor will read your request: the first available pastor who speaks your language.', 'Un seul pasteur vérifié lira votre demande : le premier disponible qui parle votre langue.')}</li>
            <li>{tr('Pastors usually reply within 24 hours. They are volunteers, not counsellors.', 'Les pasteurs répondent en général sous 24 heures. Ce sont des bénévoles, pas des thérapeutes.')}</li>
            <li><strong>{tr('This is not an emergency service. If you or someone else is in danger, call 112 now.', 'Ce n’est pas un service d’urgence. Si vous ou quelqu’un d’autre êtes en danger, appelez le 112 maintenant.')}</strong></li>
          </ul>
        </div>
        {loadError && <p className="alert" role="alert">{loadError}</p>}
        {mine && languages.length === 0 && <p className="notice">{tr('No pastors are available yet. Please check back soon.', 'Aucun pasteur n’est encore disponible. Revenez bientôt.')}</p>}
        {open >= 2 ? <p className="notice">{tr('You already have two open requests. Close one to ask again.', 'Vous avez déjà deux demandes en cours. Terminez-en une pour en faire une nouvelle.')}</p> : <>
          <label className="form-field"><span className="field-label">{tr('What would you like to talk about?', 'De quoi souhaitez-vous parler ?')}</span>
            <select id="care-topic" className="select" value={topic} onChange={e => setTopic(e.target.value as CareTopic)} required><option value="">{tr('Choose…', 'Choisir…')}</option>{CARE_TOPICS.map(t => <option key={t} value={t}>{topicLabel(t, language)}</option>)}</select></label>
          <label className="form-field"><span className="field-label">{tr('Language', 'Langue')}</span>
            <select id="care-language" className="select" value={requestLanguage} onChange={e => setRequestLanguage(e.target.value)}>{(languages.length ? languages : [language]).map(l => <option key={l} value={l}>{languageLabel(l, language)}</option>)}</select></label>
          <label className="form-field"><span className="field-label">{tr('What should the pastor call you? (optional)', 'Comment le pasteur doit-il vous appeler ? (facultatif)')}</span>
            <input id="care-name" className="input" value={name} maxLength={CARE_NAME_MAX} onChange={e => setName(e.target.value)}/></label>
          <label className="form-field"><span className="field-label">{tr('Your message', 'Votre message')}</span>
            <textarea id="care-message" className="textarea" style={{ minHeight: 150 }} value={message} maxLength={CARE_MESSAGE_MAX} onChange={e => setMessage(e.target.value)} placeholder={tr('Share as much or as little as you like.', 'Partagez autant ou aussi peu que vous le souhaitez.')}/></label>
          <fieldset className="care-contact"><legend className="field-label">{tr('How should the pastor reach you?', 'Comment le pasteur peut-il vous joindre ?')}</legend>
            <label className="check-row"><input type="radio" name="contact" checked={contact === 'messages'} onChange={() => setContact('messages')}/><span>{tr('Private messages in LifeBook', 'Messages privés dans LifeBook')}</span></label>
            <label className="check-row"><input type="radio" name="contact" checked={contact === 'callback'} onChange={() => setContact('callback')}/><span>{tr('Messages, and a phone call', 'Messages, et un appel téléphonique')}</span></label>
          </fieldset>
          {contact === 'callback' && <label className="form-field"><span className="field-label">{tr('Phone number with country code', 'Numéro avec indicatif du pays')}</span>
            <input id="care-phone" className="input" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 20 000 0000"/><span className="muted" style={{ fontSize: 12 }}>{tr('Shown only to the pastor who takes your request.', 'Visible uniquement par le pasteur qui prend votre demande.')}</span></label>}
          <label className="check-row"><input id="care-consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/><span>{tr('I agree to share this message with one verified LifeBook pastor.', 'J’accepte de partager ce message avec un pasteur vérifié de LifeBook.')}</span></label>
          <button className="btn btn-primary" disabled={busy || !topic || !message.trim() || !consent || (contact === 'callback' && !phone.trim()) || !languages.length}>{busy ? tr('Sending…', 'Envoi…') : tr('Send to a pastor', 'Envoyer à un pasteur')}</button>
          {error && <p className="alert" role="alert">{error}</p>}
        </>}
      </form>
      <div className="stack">
        <section className="card" aria-labelledby="my-care-title">
          <h2 id="my-care-title" className="icon-line" style={{ fontSize: 19 }}><HeartHandshake size={18} aria-hidden="true"/> {tr('Your requests', 'Vos demandes')}</h2>
          {mine === null ? <p role="status">{tr('Loading…', 'Chargement…')}</p> : !mine.length ? <p className="muted">{tr('Requests you send will appear here.', 'Vos demandes apparaîtront ici.')}</p>
            : <ul className="prayer-list">{mine.map(r => <li key={r.id}><Link className="prayer-item" href={`/care/${r.id}`}>
                <span className="prayer-item-head"><strong>{topicLabel(r.topic, language)}</strong><span className="muted">{waited(r.createdAt, language)}</span></span>
                <span className="prayer-item-preview">{statusLabel(r.status, language)}{r.pastor ? ` · ${r.pastor}` : ''}</span>
                {r.unread && <span className="pill prayer-answered">{tr('New reply', 'Nouvelle réponse')}</span>}
              </Link></li>)}</ul>}
        </section>
        <div className="card" style={{ background: 'var(--pink)' }}><span className="eyebrow icon-line"><LockKeyhole size={13}/> {tr('PRIVATE BY DESIGN', 'PRIVÉ PAR CONCEPTION')}</span><p style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.7 }}>{tr('Your message is encrypted. Only you and the pastor who takes your request can read it, not LifeBook staff. You can close or delete it at any time.', 'Votre message est chiffré. Seuls vous et le pasteur qui prend votre demande pouvez le lire, pas l’équipe LifeBook. Vous pouvez la terminer ou la supprimer à tout moment.')}</p></div>
        <Link className="text-link icon-line" href="/pastors">{tr('Meet our pastors', 'Rencontrer nos pasteurs')} <ArrowRight size={14}/></Link>
      </div>
    </div>
  </Shell>;
}
