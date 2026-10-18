'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { UserX } from 'lucide-react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

/**
 * Settings → Delete my account. Explains exactly what goes and what stays, asks for a typed word,
 * then deletes and signs out. Irreversible, so this is one of the few places with a confirmation step.
 */
export function DeleteAccount({ language }: { language: 'en' | 'fr' }) {
  const { getToken, signOut } = useAuth();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const word = tr('DELETE', 'SUPPRIMER');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { signInRemoved: boolean }>(null);

  const erase = async () => {
    setBusy(true); setError('');
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      const result = await api<{ deleted: boolean; signInRemoved: boolean }>('/me/account/delete', token, { method: 'POST', body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' }) });
      setDone({ signInRemoved: result.signInRemoved });
      if (result.signInRemoved) window.setTimeout(() => { void signOut({ redirectUrl: '/' }); }, 2500);
    } catch (e) { setError(errorMessage(e, language)); } finally { setBusy(false); }
  };

  if (done) return <section className="card settings-card danger-card" aria-live="polite">
    <div className="settings-card-heading"><span className="feature-icon rose"><UserX aria-hidden="true" /></span><h2>{tr('Your account has been deleted', 'Votre compte a été supprimé')}</h2></div>
    <p className="muted">{done.signInRemoved
      ? tr('All your LifeBook data and your sign-in have been removed. You will be signed out now.', 'Toutes vos données LifeBook et votre identifiant de connexion ont été supprimés. Vous allez être déconnecté.')
      : tr('All your LifeBook data has been removed. Your sign-in could not be removed automatically: open your account menu, choose Manage account, then delete it there, or write to hello@lifebook.app.', 'Toutes vos données LifeBook ont été supprimées. Votre identifiant de connexion n’a pas pu être supprimé automatiquement : ouvrez le menu de votre compte, choisissez Gérer le compte et supprimez-le, ou écrivez à hello@lifebook.app.')}</p>
    {!done.signInRemoved && <button type="button" className="btn btn-outline" onClick={() => void signOut({ redirectUrl: '/' })}>{tr('Sign out', 'Se déconnecter')}</button>}
  </section>;

  return <section className="card settings-card danger-card" aria-labelledby="delete-account-title">
    <div className="settings-card-heading"><span className="feature-icon rose"><UserX aria-hidden="true" /></span><h2 id="delete-account-title">{tr('Delete my account', 'Supprimer mon compte')}</h2></div>
    <p className="muted">{tr('This permanently deletes your LifeBook account and everything in it. It cannot be undone.', 'Cela supprime définitivement votre compte LifeBook et tout son contenu. Cette action est irréversible.')}</p>
    <ul className="danger-list">
      <li>{tr('Deleted: your profile and choices, prayers, reflections, Bible notes and highlights, reading history and plans, prayer-time progress, conversations with pastors, and your sign-in.', 'Supprimés : votre profil et vos choix, vos prières, réflexions, notes et surlignages bibliques, votre historique et vos plans de lecture, votre progression, vos échanges avec des pasteurs et votre identifiant de connexion.')}</li>
      <li>{tr('Kept for safeguarding: any safety report already made about a conversation, until its own deletion date. It holds no link to your account details.', 'Conservé pour la protection des personnes : tout signalement déjà fait au sujet d’un échange, jusqu’à sa date de suppression. Il ne contient aucun lien vers les informations de votre compte.')}</li>
    </ul>
    <form onSubmit={e => { e.preventDefault(); if (typed === word) void erase(); }}>
      <label className="form-field"><span className="field-label">{tr(`Type ${word} to confirm`, `Saisissez ${word} pour confirmer`)}</span>
        <input className="input" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} /></label>
      <button className="btn btn-danger" disabled={busy || typed !== word}>{busy ? tr('Deleting…', 'Suppression…') : tr('Delete my account permanently', 'Supprimer définitivement mon compte')}</button>
    </form>
    {error && <p className="alert" role="alert">{error}</p>}
  </section>;
}
