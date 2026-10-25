import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { PrayerVerse as Verse } from '../../lib/prayer-api';

/** The passage chosen when the prayer was saved, or helplines when the prayer may signal danger. */
export function PrayerVerse({ verse, language }: { verse: Verse; language: 'en' | 'fr' }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  if (verse.status === 'crisis') return <section className="prayer-verse gm-crisis" role="alert">
    <p>{tr('What you are carrying sounds very heavy, and you are not alone. If you, or someone you are praying for, may be in danger, please contact someone who can help right now.', 'Ce que vous portez semble très lourd, et vous n’êtes pas seul. Si vous, ou la personne pour qui vous priez, êtes peut-être en danger, contactez dès maintenant quelqu’un qui peut aider.')}</p>
    <ul>{verse.contacts.map(c => <li key={c.number}><strong className="care-phone">{c.number}</strong> · {c.label}</li>)}</ul>
    <p>{tr('You can also ask a pastor to reach out to you.', 'Vous pouvez aussi demander à un pasteur de vous contacter.')} <Link className="text-link" href="/care">{tr('Ask a pastor', 'Demander un pasteur')} →</Link></p>
  </section>;
  const translation = verse.locale === 'fr' ? 'BIBLE J.N. DARBY' : 'KING JAMES VERSION';
  return <section className="prayer-verse" aria-label={tr('A verse for your prayer', 'Un verset pour votre prière')}>
    <h3 className="icon-line"><BookOpen size={17} aria-hidden="true"/> {tr('A verse for your prayer', 'Un verset pour votre prière')}</h3>
    <figure className="companion-passage"><blockquote className="verse-quote" lang={verse.locale}>{verse.passage.text.replace(/\[\d+\]\s*/g, '').replace(/¶\s*/g, '').trim()}</blockquote><figcaption className="verse-ref">{verse.passage.reference.toUpperCase()} · {translation}</figcaption></figure>
    <p className="muted prayer-verse-note">{verse.source === 'ai'
      ? tr(`Chosen with AI from LifeBook’s prayer topics${verse.topic ? ` (${verse.topic})` : ''}, as you asked for this prayer.`, `Choisi avec l’IA parmi les thèmes de prière de LifeBook${verse.topic ? ` (${verse.topic})` : ''}, comme vous l’avez demandé pour cette prière.`)
      : tr(`Chosen from LifeBook’s prayer topics${verse.topic ? ` (${verse.topic})` : ''} by the words of your prayer. Your prayer never leaves LifeBook for this.`, `Choisi parmi les thèmes de prière de LifeBook${verse.topic ? ` (${verse.topic})` : ''} d’après les mots de votre prière. Votre prière ne quitte pas LifeBook pour cela.`)}</p>
  </section>;
}
