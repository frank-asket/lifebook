'use client';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { prayerApi } from '../../lib/prayer-api';
import { errorMessage } from '../../lib/errors';

/** Permanently erases the signed-in user's prayer journal after a typed confirmation. */
export function DeleteAllPrayers({ language }: { language: 'en' | 'fr' }) {
  const { getToken } = useAuth(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const word = tr('DELETE', 'SUPPRIMER');
  const [typed, setTyped] = useState(''); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const erase = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      const { deleted } = await prayerApi.removeAll(token);
      setTyped(''); setMessage(tr(`${deleted} prayer(s) permanently deleted.`, `${deleted} prière(s) supprimée(s) définitivement.`));
    } catch (e) { setError(errorMessage(e, language)); } finally { setBusy(false); }
  };
  return <section className="card settings-card"><div className="settings-card-heading"><span className="feature-icon rose"><Trash2 aria-hidden="true"/></span><h2>{tr('Prayer journal', 'Journal de prière')}</h2></div>
    <p className="muted">{tr('Permanently delete every prayer and answered note you have saved. This cannot be undone.', 'Supprimer définitivement toutes vos prières et notes enregistrées. Cette action est irréversible.')}</p>
    <form onSubmit={e => { e.preventDefault(); if (typed === word) void erase(); }}>
      <label className="form-field"><span style={{ fontSize: 12, fontWeight: 800 }}>{tr(`Type ${word} to confirm`, `Saisissez ${word} pour confirmer`)}</span>
        <input className="input" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off"/></label>
      <button className="btn btn-outline" disabled={busy || typed !== word}>{busy ? tr('Deleting…', 'Suppression…') : tr('Delete all prayers', 'Supprimer toutes les prières')}</button>
    </form>
    {error && <p className="alert" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
  </section>;
}
