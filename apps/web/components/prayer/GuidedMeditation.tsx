'use client';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { prayerApi, type Meditation, type MeditationResult } from '../../lib/prayer-api';

/** Guided meditation for one saved prayer. Nothing is sent until the person ticks consent and asks. */
export function GuidedMeditation({ prayerId, existing, language, onChange }: { prayerId: string; existing: Meditation | null; language: 'en' | 'fr'; onChange: () => void }) {
  const { getToken } = useAuth(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [result, setResult] = useState<MeditationResult | null>(null); const [needsSetting, setNeedsSetting] = useState(false);
  const meditation = result?.status === 'ok' ? result.meditation : existing;
  const translation = (m: Meditation) => m.locale === 'fr' ? 'BIBLE J.N. DARBY' : 'KING JAMES VERSION';
  const run = async (fn: (t: string) => Promise<void>) => {
    setBusy(true); setError(''); setNeedsSetting(false);
    try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); await fn(token); }
    catch (e) { if ((e as { status?: number }).status === 403) setNeedsSetting(true); else setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setBusy(false); }
  };
  const ask = () => run(async t => { const r = await prayerApi.meditate(t, prayerId, language); setResult(r); setConsent(false); if (r.status === 'ok') onChange(); });
  const remove = () => run(async t => { await prayerApi.clearMeditation(t, prayerId); setResult(null); onChange(); });

  return <section className="guided-meditation" aria-labelledby={`gm-${prayerId}`}>
    <h3 id={`gm-${prayerId}`} className="icon-line"><Sparkles size={17} aria-hidden="true"/> {tr('Guided meditation', 'Méditation guidée')}</h3>

    {result?.status === 'crisis' ? <div className="gm-crisis" role="alert">
      <p>{result.message}</p>
      <ul>{result.contacts.map(c => <li key={c.number}><strong className="care-phone">{c.number}</strong> · {c.label}</li>)}</ul>
      <p>{tr('You can also ask a pastor to reach out to you.', 'Vous pouvez aussi demander à un pasteur de vous contacter.')} <Link className="text-link" href="/care">{tr('Ask a pastor', 'Demander un pasteur')} →</Link></p>
    </div>

    : meditation ? <div className="gm-result">
      {meditation.passages.map(p => <figure key={p.id} className="companion-passage"><blockquote className="verse-quote">{p.text.replace(/\[\d+\]\s*/g, '').replace(/¶\s*/g, '').trim()}</blockquote><figcaption className="verse-ref">{p.reference.toUpperCase()} · {translation(meditation)}</figcaption></figure>)}
      <p className="gm-reflection">{meditation.reflection}</p>
      <h4>{tr('To reflect on', 'Pour méditer')}</h4>
      <ul className="gm-questions">{meditation.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
      <h4>{tr('A prayer', 'Une prière')}</h4>
      <p className="gm-prayer">{meditation.prayer}</p>
      {meditation.concern && <p className="notice">{tr('If this is weighing heavily on you, a pastor or someone you trust can walk with you.', 'Si cela vous pèse lourdement, un pasteur ou une personne de confiance peut vous accompagner.')} <Link className="text-link" href="/care">{tr('Ask a pastor', 'Demander un pasteur')}</Link></p>}
      <p className="muted" style={{ fontSize: 12 }}>{tr('Written with AI to support your prayer, using Scripture chosen from LifeBook’s reviewed passages. It is not a word from God, nor medical or professional advice.', 'Rédigée avec l’IA pour accompagner votre prière, à partir de passages relus par LifeBook. Ce n’est ni une parole de Dieu, ni un avis médical ou professionnel.')} {tr('Scripture provided by API.Bible.', 'Texte biblique fourni par API.Bible.')}</p>
      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void remove()}>{tr('Remove this meditation', 'Supprimer cette méditation')}</button>
    </div>

    : <div className="stack" style={{ gap: 10 }}>
      <p className="subheading">{tr('Receive Scripture, a short reflection and a prayer for this concern.', 'Recevez des passages bibliques, une courte réflexion et une prière pour ce sujet.')}</p>
      <div className="gm-disclosure">
        <p><strong>{tr('Before you ask:', 'Avant de demander :')}</strong></p>
        <ul>
          <li>{tr('Only the text of this prayer and your language are sent to OpenAI, LifeBook’s AI provider. Not your name, email or account.', 'Seuls le texte de cette prière et votre langue sont envoyés à OpenAI, le fournisseur d’IA de LifeBook. Ni votre nom, ni votre e-mail, ni votre compte.')}</li>
          <li>{tr('LifeBook asks OpenAI not to store it. Under OpenAI’s API terms it is not used to train models, though it may be kept up to 30 days for abuse monitoring.', 'LifeBook demande à OpenAI de ne pas l’enregistrer. Selon les conditions de l’API d’OpenAI, il ne sert pas à entraîner des modèles, mais peut être conservé jusqu’à 30 jours pour la surveillance des abus.')}</li>
          <li>{tr('If your prayer suggests you may be in danger, you will see people to contact instead of a meditation.', 'Si votre prière laisse penser que vous êtes en danger, vous verrez des personnes à contacter au lieu d’une méditation.')}</li>
        </ul>
      </div>
      <label className="check-row"><input id={`gm-consent-${prayerId}`} type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/><span>{tr('Send this prayer to write a guided meditation', 'Envoyer cette prière pour rédiger une méditation guidée')}</span></label>
      <button type="button" className="btn btn-primary" disabled={busy || !consent} onClick={() => void ask()}>{busy ? tr('Preparing…', 'Préparation…') : tr('Write a guided meditation', 'Rédiger une méditation guidée')}</button>
      <p className="muted" style={{ fontSize: 12 }}>{tr('Up to 5 a day.', 'Jusqu’à 5 par jour.')}</p>
    </div>}

    {needsSetting && <p className="notice">{tr('Optional AI processing is turned off in your preferences.', 'Le traitement IA facultatif est désactivé dans vos préférences.')} <Link className="text-link" href="/onboarding?step=privacy">{tr('Review your choices', 'Revoir vos choix')}</Link></p>}
    {error && <p className="alert" role="alert">{error}</p>}
  </section>;
}
