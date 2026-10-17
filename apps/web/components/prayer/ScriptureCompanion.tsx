'use client';
import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { api } from '../../lib/api';

type TopicSummary = { id: string; title: string; description: string };
type Topic = { id: string; title: string; description: string; prompt: string; reviewed: boolean; unavailable: number; passages: { id: string; reference: string; text: string; copyright: string | null }[] };

/** Scripture by topic from the reviewed library. Falls back to a single verse when the companion is unavailable. */
export function ScriptureCompanion({ language }: { language: 'en' | 'fr' }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [topics, setTopics] = useState<TopicSummary[] | null>(null);
  const [reviewed, setReviewed] = useState(true);
  const [selected, setSelected] = useState('');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController(); setTopics(null); setSelected(''); setTopic(null);
    api<{ reviewed: boolean; topics: TopicSummary[] }>(`/prayer-companion/topics?locale=${language}`, null, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setTopics(result.topics); setReviewed(result.reviewed); } })
      .catch(() => { if (!controller.signal.aborted) setTopics([]); });
    return () => controller.abort();
  }, [language]);
  useEffect(() => {
    if (!selected) { setTopic(null); return; }
    const controller = new AbortController(); setLoading(true); setError('');
    api<Topic>(`/prayer-companion/topics/${encodeURIComponent(selected)}?locale=${language}`, null, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setTopic(result); })
      .catch(e => { if (!controller.signal.aborted) { setTopic(null); setError(e instanceof Error ? e.message : 'Unavailable'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selected, language]);

  const translation = tr('KING JAMES VERSION', 'BIBLE J.N. DARBY');
  if (!topics?.length) return <div className="card"><span className="feature-icon lilac"><BookOpen size={24}/></span><h3>{tr('Pray with scripture', 'Prier avec les Écritures')}</h3><p className="verse-quote" style={{ fontSize: 17 }}>{tr('“Casting all your care upon him; for he careth for you.”', '« rejetant sur lui tout votre souci, car il a soin de vous. »')}</p><span className="verse-ref">{tr('1 PETER 5:7', '1 PIERRE 5:7')} · {translation}</span><p className="muted" style={{ fontSize: 11, marginTop: 14 }}>{tr('A passage to reflect on as you pray.', 'Un passage à méditer pendant votre prière.')}</p></div>;
  return <div className="card scripture-companion">
    <span className="feature-icon lilac"><BookOpen size={24}/></span>
    <h3>{tr('Pray with scripture', 'Prier avec les Écritures')}</h3>
    <label className="form-field"><span style={{ fontSize: 12, fontWeight: 800 }}>{tr('What would you like to bring to God?', 'Que souhaitez-vous confier à Dieu ?')}</span>
      <select className="select" value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">{tr('Choose a theme…', 'Choisissez un thème…')}</option>
        {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select></label>
    {!selected && <p className="muted" style={{ fontSize: 12 }}>{tr('Your choice stays on this screen. It is not saved or added to your profile.', 'Votre choix reste sur cet écran. Il n’est ni enregistré ni ajouté à votre profil.')}</p>}
    {loading && <p role="status">{tr('Opening Scripture…', 'Ouverture des Écritures…')}</p>}
    {error && <p className="alert" role="alert">{error}</p>}
    {topic && !loading && <div aria-live="polite">
      <p className="subheading" style={{ marginTop: 6 }}>{topic.prompt}</p>
      {topic.passages.map(p => <figure key={p.id} className="companion-passage"><blockquote className="verse-quote">{p.text.replace(/\[\d+\]\s*/g, '').replace(/¶\s*/g, '').trim()}</blockquote><figcaption className="verse-ref">{p.reference.toUpperCase()} · {translation}</figcaption></figure>)}
      {topic.unavailable > 0 && <p className="muted" style={{ fontSize: 11 }}>{tr('Some passages could not be loaded right now.', 'Certains passages n’ont pas pu être chargés.')}</p>}
      <p className="muted" style={{ fontSize: 11, marginTop: 12 }}>{tr('Scripture provided by API.Bible.', 'Texte biblique fourni par API.Bible.')}</p>
    </div>}
    {!reviewed && <p className="notice" style={{ fontSize: 11, marginTop: 12 }}>{tr('Staging preview: this selection is awaiting pastoral review.', 'Aperçu de test : cette sélection attend une relecture pastorale.')}</p>}
  </div>;
}
