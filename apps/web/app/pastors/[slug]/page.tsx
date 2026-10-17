'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, Clock } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { ApiError } from '../../../lib/api';
import { countryLabel, languageLabel, pastorsApi, type Pastor } from '../../../lib/pastors-api';

export default function PastorProfile() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { slug } = useParams<{ slug: string }>();
  const [pastor, setPastor] = useState<Pastor | null>(null); const [missing, setMissing] = useState(false); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setPastor(null); setMissing(false); setError('');
    pastorsApi.get(slug, controller.signal).then(row => { if (!controller.signal.aborted) setPastor(row); })
      .catch(e => { if (controller.signal.aborted) return; if (e instanceof ApiError && e.status === 404) setMissing(true); else setError(e instanceof Error ? e.message : 'Unavailable'); });
    return () => controller.abort();
  }, [slug, retry]);
  return <Shell title={tr('Our pastors', 'Nos pasteurs')}>
    <Link href="/pastors" className="text-link">← {tr('All pastors', 'Tous les pasteurs')}</Link>
    {error ? <div className="alert reader-error" role="alert" style={{ marginTop: 20 }}><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>
      : missing ? <div className="card status-card" style={{ marginTop: 20 }}><h1 style={{ fontSize: 24 }}>{tr('This profile is not available', 'Ce profil n’est pas disponible')}</h1><p>{tr('The pastor may no longer be listed.', 'Ce pasteur n’est peut-être plus référencé.')}</p></div>
      : !pastor ? <p role="status" style={{ marginTop: 20 }}>{tr('Loading…', 'Chargement…')}</p>
      : <div className="two-up" style={{ marginTop: 20 }}>
          <article className="card pastor-profile">
            <span className="pill"><BadgeCheck size={13}/> {tr('Verified pastor', 'Pasteur vérifié')}</span>
            <h1 className="page-heading" style={{ marginTop: 16 }}>{pastor.displayName}</h1>
            <p className="subheading">{[pastor.ministryRole, pastor.church].filter(Boolean).join(' · ')}</p>
            <p className="pastor-bio">{pastor.bio}</p>
            <dl className="pastor-facts">
              {pastor.country && <><dt>{tr('Country', 'Pays')}</dt><dd>{countryLabel(pastor.country, language)}</dd></>}
              <dt>{tr('Languages', 'Langues')}</dt><dd>{pastor.languages.map(l => languageLabel(l, language)).join(', ')}</dd>
            </dl>
          </article>
          <div className="stack">
            <div className="card"><h3 className="icon-line"><Clock size={18} aria-hidden="true"/> {tr('Asking for a pastor', 'Demander un pasteur')}</h3><p className="subheading">{tr('Ask a verified pastor to pray with you or reach out privately. The first available pastor who speaks your language will reply, usually within 24 hours.', 'Demandez à un pasteur vérifié de prier avec vous ou de vous contacter en privé. Le premier pasteur disponible qui parle votre langue répondra, en général sous 24 heures.')}</p><Link className="btn btn-primary" href="/care">{tr('Ask a pastor', 'Demander un pasteur')}</Link></div>
            <div className="card" style={{ background: 'var(--pink)' }}><span className="eyebrow">{tr('IN AN EMERGENCY', 'EN CAS D’URGENCE')}</span><p style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.7 }}>{tr('Pastors are not an emergency service. If you or someone else is in danger, call 112 now.', 'Les pasteurs ne sont pas un service d’urgence. Si vous ou quelqu’un d’autre êtes en danger, appelez le 112.')}</p></div>
          </div>
        </div>}
  </Shell>;
}
