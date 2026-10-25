'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Users } from 'lucide-react';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { CareError, CareLoading } from '../../components/care/states';
import { countryLabel, languageLabel, pastorsApi, type Pastor } from '../../lib/pastors-api';

export default function Pastors() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [items, setItems] = useState<Pastor[] | null>(null); const [error, setError] = useState<unknown>(null); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setItems(null); setError(null);
    pastorsApi.list(controller.signal).then(rows => { if (!controller.signal.aborted) setItems(rows); })
      .catch(e => { if (!controller.signal.aborted) setError(e); });
    return () => controller.abort();
  }, [retry]);
  return <Shell title={tr('Our pastors', 'Nos pasteurs')}>
    <div className="page-intro">
      <span className="eyebrow">{tr('VERIFIED BY LIFEBOOK', 'VÉRIFIÉS PAR LIFEBOOK')}</span>
      <h1 className="page-heading">{tr('Our pastors', 'Nos pasteurs')}</h1>
      <p className="subheading">{tr('Every pastor here is endorsed by their church, has completed suicide-awareness training and has signed LifeBook’s code of conduct.', 'Chaque pasteur ici est recommandé par son Église, a suivi une formation à la prévention du suicide et a signé le code de conduite de LifeBook.')}</p>
    </div>
    <p className="pastor-apply-link">{tr('Are you a pastor?', 'Vous êtes pasteur ?')} <Link className="text-link" href="/pastors/apply">{tr('Apply to serve on LifeBook', 'Postulez pour servir sur LifeBook')}</Link></p>
    <p className="notice">{tr('Pastors are not an emergency service. If you or someone else is in danger, call your local emergency number now.', 'Les pasteurs ne sont pas un service d’urgence. Si vous ou quelqu’un d’autre êtes en danger, appelez immédiatement le numéro d’urgence local.')}</p>
    {error ? <div style={{ marginTop: 20 }}><CareError error={error} language={language} onRetry={() => setRetry(n => n + 1)}/></div>
      : items === null ? <div style={{ marginTop: 20 }}><CareLoading label={tr('Loading pastors…', 'Chargement des pasteurs…')} lines={4}/></div>
      : !items.length ? <div className="card status-card"><Users size={32} aria-hidden="true"/><h2>{tr('Pastors are joining soon', 'Des pasteurs nous rejoignent bientôt')}</h2><p>{tr('Verified pastors will appear here once their review is complete.', 'Les pasteurs vérifiés apparaîtront ici après leur validation.')}</p></div>
      : <div className="grid cols-2 pastor-grid">{items.map(p => <article className="card pastor-card" key={p.slug}>
          <div className="pastor-card-head"><span className="pastor-initials" aria-hidden="true">{p.displayName.replace(/^(rev\.?|pastor|pst\.?|dr\.?)\s+/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span>
            <div><h2>{p.displayName}</h2><p className="muted">{[p.ministryRole, p.church].filter(Boolean).join(' · ')}</p></div></div>
          <p className="pastor-bio">{p.bio}</p>
          <p className="muted pastor-meta"><BadgeCheck size={14} aria-hidden="true"/> {[countryLabel(p.country, language), p.languages.map(l => languageLabel(l, language)).join(', ')].filter(Boolean).join(' · ')}</p>
          <Link className="text-link icon-line care-link" href={`/pastors/${encodeURIComponent(p.slug)}`}>{tr('View profile', 'Voir le profil')}<span className="sr-only">: {p.displayName}</span> <ArrowRight size={14} aria-hidden="true"/></Link>
        </article>)}</div>}
  </Shell>;
}
