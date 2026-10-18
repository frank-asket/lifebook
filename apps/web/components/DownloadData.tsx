'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Download } from 'lucide-react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

/** Settings → Download my data: everything LifeBook holds about you, as a JSON file, decrypted for you. */
export function DownloadData({ language }: { language: 'en' | 'fr' }) {
  const { getToken } = useAuth();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const download = async () => {
    setBusy(true); setError(''); setDone(false);
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      const data = await api<unknown>('/me/account/export', token, { cache: 'no-store' });
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = `lifebook-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDone(true);
    } catch (e) { setError(errorMessage(e, language)); } finally { setBusy(false); }
  };
  return <section className="card settings-card" aria-labelledby="download-data-title">
    <div className="settings-card-heading"><span className="feature-icon lilac"><Download aria-hidden="true" /></span><h2 id="download-data-title">{tr('Download my data', 'Télécharger mes données')}</h2></div>
    <p className="muted">{tr('A file with everything LifeBook holds about you: your choices, prayers, reflections, Bible notes, reading, and conversations with pastors. It is decrypted for you, so keep it somewhere safe.', 'Un fichier avec tout ce que LifeBook conserve à votre sujet : vos choix, prières, réflexions, notes bibliques, lectures et échanges avec des pasteurs. Il est déchiffré pour vous : conservez-le en lieu sûr.')}</p>
    <button type="button" className="btn btn-soft" onClick={() => void download()} disabled={busy}>{busy ? tr('Preparing your file…', 'Préparation du fichier…') : tr('Download my data', 'Télécharger mes données')}</button>
    {done && <p className="notice" role="status">{tr('Your file has been downloaded.', 'Votre fichier a été téléchargé.')}</p>}
    {error && <p className="alert" role="alert">{error}</p>}
  </section>;
}
