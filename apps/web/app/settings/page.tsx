'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowRight, Globe2, LogOut, Settings2, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Shell } from '../../components/shell';
import { ThemeToggle } from '../../components/theme-toggle';
import { useLanguage, type Language } from '../../components/language-provider';
import { DeleteAllPrayers } from '../../components/prayer/DeleteAllPrayers';
import { api, type FaithProfile, type ProfileResponse, faithJourneyLabel, learningGoalLabel } from '../../lib/api';
import { errorMessage } from '../../lib/errors';

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { user } = useUser();
  const { getToken, signOut, userId, isLoaded } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<Language>(language);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSelected(language); }, [language]);
  useEffect(() => {
    if (!isLoaded) return;
    let active = true;
    setData(null); setError(''); setSaveError(''); setSaved(false);
    (async () => {
      try { const token = await getToken(); const result = await api<ProfileResponse>('/me/profile', token); if (active) setData(result); }
      catch (error) { if (active) setError(errorMessage(error, language)); }
    })();
    return () => { active = false; };
  }, [getToken, userId, isLoaded, retry]);
  async function saveLanguage() {
    setSaving(true); setSaveError(''); setSaved(false);
    try {
      const token = await getToken();
      if (!token) throw new Error(tr('Please sign in again to save your preferences.', 'Reconnectez-vous pour enregistrer vos préférences.'));
      // The profile endpoint accepts partial updates; do not overwrite consent or goals.
      const profile = await api<FaithProfile>('/me/profile', token, { method: 'PUT', body: JSON.stringify({ language: selected }) });
      setData(current => current ? { ...current, profile } : current);
      setLanguage(selected); setSaved(true);
    } catch (error) { setSaveError(errorMessage(error, language)); }
    finally { setSaving(false); }
  }
  const p = data?.profile;
  const unavailable = error ? tr('Unavailable', 'Indisponible') : tr('Loading…', 'Chargement…');
  return <Shell title={tr('Account & Settings', 'Compte et paramètres')}>
    <div className="page-intro"><span className="eyebrow">{tr('YOUR LIFEBOOK', 'VOTRE LIFEBOOK')}</span><h1 className="page-heading">{tr('Settings', 'Paramètres')}</h1><p className="subheading">{tr('Make this space feel like yours. Manage your preferences, account and privacy.', 'Personnalisez votre espace. Gérez vos préférences, votre compte et votre confidentialité.')}</p></div>
    {error && <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>}
    <div className="settings-grid">
      <div className="stack">
        <section className="card settings-card"><div className="settings-card-heading"><span className="feature-icon lilac"><Globe2 aria-hidden="true"/></span><div><h2>{tr('Language & appearance', 'Langue et apparence')}</h2><p className="muted">{tr('Your daily space, in the language you prefer.', 'Votre espace quotidien, dans la langue de votre choix.')}</p></div></div>
          <form onSubmit={e => { e.preventDefault(); void saveLanguage(); }} className="settings-language">
            <label htmlFor="settings-language">{tr('Application language', 'Langue de l’application')}</label>
            <p id="language-help" className="muted">{tr('Applies to navigation and daily Scripture. Bible translations can still be selected in the reader.', 'S’applique à la navigation et à la Parole du jour. Les traductions bibliques restent disponibles dans le lecteur.')}</p>
            <div className="settings-language-actions"><select id="settings-language" value={selected} disabled={saving || !data} aria-describedby="language-help" onChange={e => { setSelected(e.target.value as Language); setSaved(false); setSaveError(''); }}><option value="en">English</option><option value="fr">Français</option></select><button className="btn btn-primary" disabled={saving || !data || selected === language}>{saving ? tr('Saving…', 'Enregistrement…') : tr('Save language', 'Enregistrer la langue')}</button></div>
            {saveError && <p className="alert" role="alert">{saveError}</p>}{saved && <p className="notice" role="status">{tr('Language saved.', 'Langue enregistrée.')}</p>}
          </form><div className="divider"/><h3>{tr('Appearance', 'Apparence')}</h3><p className="muted">{tr('Choose how LifeBook looks on this device.', 'Choisissez l’apparence de LifeBook sur cet appareil.')}</p><ThemeToggle/>
        </section>
        <section className="card settings-card"><div className="split-title"><h2>{tr('Learning preferences', 'Préférences d’apprentissage')}</h2><Link className="btn btn-soft btn-sm" href="/onboarding?step=journey">{tr('Edit', 'Modifier')} <ArrowRight size={14}/></Link></div><div className="list-row"><div><h3>{tr('Faith journey', 'Parcours de foi')}</h3><p>{data ? faithJourneyLabel(p?.journey, language) || tr('Not selected', 'Non défini') : unavailable}</p></div></div><div className="list-row"><div><h3>{tr('Goals', 'Objectifs')}</h3><p>{data ? p?.learningGoals?.map(goal => learningGoalLabel(goal, language)).join(', ') || tr('Not selected', 'Non définis') : unavailable}</p></div></div></section>
      </div>
      <div className="stack">
        <section className="card settings-card"><div className="settings-card-heading"><span className="feature-icon lilac"><UserRound aria-hidden="true"/></span><div><h2>{tr('Your account', 'Votre compte')}</h2><p className="muted">{user?.primaryEmailAddress?.emailAddress || tr('Signed-in member', 'Membre connecté')}</p></div></div><div className="list-row"><div><h3>{tr('Display name', 'Nom affiché')}</h3><p>{user?.fullName || tr('Not provided', 'Non renseigné')}</p></div></div><div className="list-row"><div><h3>{tr('Account role','Rôle du compte')}</h3><p>{data?.role || unavailable}</p></div></div><p className="muted">{tr('Use your account menu to manage your email, password and account security.', 'Utilisez le menu du compte pour gérer votre e-mail, votre mot de passe et la sécurité.')}</p></section>
        <section className="card settings-card"><div className="settings-card-heading"><span className="feature-icon mint"><ShieldCheck aria-hidden="true"/></span><h2>{tr('Privacy & consent', 'Confidentialité et consentement')}</h2></div><div className="list-row"><div><h3>{tr('Personalized suggestions', 'Suggestions personnalisées')} <span className="pill">{tr('Coming soon', 'Bientôt')}</span></h3><p>{data ? p?.personalizationConsent ? tr('You have agreed to suggestions based on your journey and goals once they are available.', 'Vous avez accepté des suggestions basées sur votre parcours et vos objectifs dès qu’elles seront disponibles.') : tr('Not allowed', 'Non autorisé') : unavailable}</p></div></div><div className="list-row"><div><h3>{tr('Optional AI processing', 'Traitement IA facultatif')}</h3><p>{data ? p?.aiProcessingConsent ? tr('Allowed for opted-in features', 'Autorisé pour les fonctions choisies') : tr('Not allowed', 'Non autorisé') : unavailable}</p></div></div><Link className="text-link icon-line" href="/onboarding?step=privacy">{tr('Update choices', 'Modifier les choix')} <ArrowRight size={14}/></Link><p className="notice">{tr('Prayer content is not used for automatic spiritual profiling. Future prayer processing requires separate consent.', 'Les prières ne servent pas à établir un profil spirituel automatique. Tout traitement futur nécessitera un consentement distinct.')}</p></section>
        <DeleteAllPrayers language={language}/>
        <section className="card settings-card"><div className="settings-card-heading"><span className="feature-icon lilac"><Sparkles aria-hidden="true"/></span><h2>{tr('Getting started', 'Pour commencer')}</h2></div><div className="settings-links"><Link className="text-link icon-line" href="/dashboard?tour=welcome">{tr('See the welcome tour again', 'Revoir la présentation')} <ArrowRight size={14}/></Link><Link className="text-link icon-line" href="/dashboard?tour=whats-new">{tr('What’s new in LifeBook', 'Les nouveautés de LifeBook')} <ArrowRight size={14}/></Link></div></section>
        <section className="card settings-card"><div className="settings-card-heading"><Settings2 size={20} aria-hidden="true"/><h2>{tr('Session', 'Session')}</h2></div><button className="btn btn-outline" onClick={() => signOut({ redirectUrl: '/' })}><LogOut size={16}/> {tr('Sign out', 'Se déconnecter')}</button></section>
      </div>
    </div>
  </Shell>;
}
