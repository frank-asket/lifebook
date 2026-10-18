'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { BookOpen, LockKeyhole, Timer, X } from 'lucide-react';
import { useLanguage } from './language-provider';
import { api, faithJourneyLabel, learningGoalLabel } from '../lib/api';
import { dismissedKey, parseHidden, visible, type SuggestionView, type SuggestionsResponse } from '../lib/suggestions';

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* not remembered on this device */ } };

/** "Suggested for you" on Home. Shows nothing at all unless the person switched on personalized suggestions. */
export function Suggestions() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { getToken, isSignedIn, userId } = useAuth();
  const [items, setItems] = useState<SuggestionView[] | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (!isSignedIn || !userId) return;
    let active = true;
    setHidden(parseHidden(read(dismissedKey(userId))));
    getToken().then(token => api<SuggestionsResponse>(`/me/suggestions?locale=${language}`, token))
      .then(r => { if (active) setItems(r.consent ? r.suggestions : []); })
      .catch(() => { if (active) setItems([]); }); // Suggestions are optional: on error, simply show none.
    return () => { active = false; };
  }, [isSignedIn, userId, getToken, language]);

  const shown = items ? visible(items, hidden) : [];
  if (!shown.length) return null;
  const hide = (id: string) => {
    const next = Array.from(new Set([...hidden, id]));
    setHidden(next); if (userId) write(dismissedKey(userId), JSON.stringify(next));
  };
  const why = (s: SuggestionView) => {
    const label = s.reason.type === 'goal' ? learningGoalLabel(s.reason.goal, language) : faithJourneyLabel(s.reason.journey, language) ?? s.reason.journey;
    return tr(`Because you chose “${label}” in your preferences.`, `Parce que vous avez choisi « ${label} » dans vos préférences.`);
  };
  const copy = (s: SuggestionView) => s.kind === 'plan'
    ? { icon: BookOpen, title: s.title ?? '', text: `${s.description ?? ''} ${s.duration ? tr(`${s.duration} days.`, `${s.duration} jours.`) : ''}`.trim() }
    : s.kind === 'journal'
      ? { icon: LockKeyhole, title: tr('Start your prayer journal', 'Commencez votre journal de prière'), text: tr('Write a first prayer. It stays private and encrypted.', 'Écrivez une première prière. Elle reste privée et chiffrée.') }
      : { icon: Timer, title: tr('Try a 2-minute prayer time', 'Essayez un temps de prière de 2 minutes'), text: tr('A short pause each day is enough to begin.', 'Une courte pause chaque jour suffit pour commencer.') };

  return <section className="suggest" aria-labelledby="suggest-title">
    <div className="section-title"><h2 id="suggest-title">{tr('Suggested for you', 'Suggéré pour vous')}</h2><Link className="text-link" href="/settings">{tr('Change', 'Modifier')}</Link></div>
    <ul className="suggest-list">{shown.map(s => {
      const c = copy(s); const Icon = c.icon;
      return <li key={s.id} className="card suggest-item">
        <Link className="suggest-main" href={s.href} onClick={() => { if (s.kind === 'prayer-time') write('lifebook.prayerLength', '2'); }}>
          <span className={`home-link-icon${s.kind === 'journal' ? ' rose' : ''}`}><Icon size={20} aria-hidden="true" /></span>
          <span><strong>{c.title}</strong><small>{c.text}</small></span>
        </Link>
        <div className="suggest-foot">
          <button type="button" className="suggest-why" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>{tr('Why this?', 'Pourquoi ?')}</button>
          <button type="button" className="suggest-hide" onClick={() => hide(s.id)} aria-label={tr(`Hide “${c.title}”`, `Masquer « ${c.title} »`)}><X size={16} aria-hidden="true" /></button>
        </div>
        {open === s.id && <p className="suggest-reason" role="status">{why(s)}</p>}
      </li>;
    })}</ul>
  </section>;
}
