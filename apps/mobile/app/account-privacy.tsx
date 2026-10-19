import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Share, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { DeletePrayers } from '../components/delete-prayers';
import { Button, Card, ErrorLine, Screen } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';
import type { ProfileResponse } from '../../web/lib/api';

type Consents = { personalizationConsent: boolean; aiProcessingConsent: boolean };
export default function AccountPrivacy() {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [consents, setConsents] = useState<Consents | null>(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState<{ signInRemoved: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => saving.current || !!deleted);
    return () => handler.remove();
  }, [deleted]));
  useEffect(() => {
    if (!session.isSignedIn || deleted) return;
    const controller = new AbortController();
    setConsents(null); setLoadError('');
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const value = await api<ProfileResponse>('/me/profile', token, { signal: controller.signal });
        if (!controller.signal.aborted) setConsents({ personalizationConsent: value.profile?.personalizationConsent ?? false, aiProcessingConsent: value.profile?.aiProcessingConsent ?? false });
      } catch (e) { if (!controller.signal.aborted) setLoadError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [session.isSignedIn, session.getToken, deleted, retry, lang]);
  async function changeConsent(key: keyof Consents, value: boolean) {
    if (!consents || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      await api('/me/profile', token, { method: 'PUT', body: JSON.stringify({ [key]: value }) });
      if (mounted.current) { setConsents(previous => previous && { ...previous, [key]: value }); setMessage(tr('Privacy choices saved.', 'Choix de confidentialité enregistrés.')); }
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  async function exportData() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      const value = await api<Record<string, unknown>>('/me/account/export', token);
      if (!mounted.current) return;
      const json = JSON.stringify(value, null, 2);
      // Keep Android IPC below its transaction limit; never silently truncate a private export.
      if (json.length > 100000) throw new Error(tr('This export is too large for mobile text sharing. Download the full JSON file from Settings on the LifeBook website.', 'Cet export est trop volumineux pour le partage de texte mobile. Téléchargez le fichier JSON complet depuis les paramètres du site LifeBook.'));
      await Share.share({ title: 'LifeBook data export', message: json }, { subject: 'LifeBook data export', dialogTitle: tr('Choose where to save your private export', 'Choisissez où enregistrer votre export privé') });
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  async function signOut() {
    setError('');
    try { await session.signOut(); }
    catch { if (mounted.current) setError(tr('Please try signing out again. Your LifeBook data is already deleted.', 'Réessayez de vous déconnecter. Vos données LifeBook sont déjà supprimées.')); }
  }
  async function erase() {
    if (typed !== word || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      const value = await api<{ deleted: boolean; signInRemoved: boolean }>('/me/account/delete', token, { method: 'POST', body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' }) });
      if (!mounted.current) return;
      if (!value.deleted) throw new Error(tr('Deletion could not be confirmed. Please try again.', 'La suppression n’a pas pu être confirmée. Réessayez.'));
      setDeleted({ signInRemoved: value.signInRemoved }); setConsents(null); setTyped('');
      // Keep the partial sign-in-removal outcome visible until the member chooses to leave.
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  const word = lang === 'fr' ? 'SUPPRIMER' : 'DELETE';
  if (deleted) return <Screen title={tr('LifeBook data deleted', 'Données LifeBook supprimées')}>
    <Card><Text style={{ color: c.ink, fontSize: 17, lineHeight: 26 }}>{deleted.signInRemoved
      ? tr('Your LifeBook data and sign-in were removed. Sign out to finish.', 'Vos données LifeBook et votre connexion ont été supprimées. Déconnectez-vous pour terminer.')
      : tr('Your LifeBook data was removed. Your sign-in could not be removed automatically. Delete it through Manage account on the website, or contact the LifeBook team. Sign out here to finish.', 'Vos données LifeBook ont été supprimées. Votre connexion n’a pas pu être supprimée automatiquement. Supprimez-la via Gérer le compte sur le site, ou contactez l’équipe LifeBook. Déconnectez-vous ici pour terminer.')}</Text></Card>
    {error ? <ErrorLine message={error} /> : null}<Button title={tr('Sign out', 'Se déconnecter')} onPress={() => void signOut()} />
  </Screen>;
  return <Screen title={tr('Account and privacy', 'Compte et confidentialité')}>
    <Button kind="quiet" title={tr('Back to You', 'Retour à Vous')} disabled={busy} onPress={() => router.navigate('/you')} />
    {!session.isSignedIn ? <Card><Text style={{ color: c.muted }}>{tr('Sign in from You to manage your account and privacy.', 'Connectez-vous depuis Vous pour gérer votre compte et votre confidentialité.')}</Text></Card> : <>
      <Card style={{ gap: 14 }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{tr('Your choices', 'Vos choix')}</Text>
        {loadError ? <ErrorLine message={loadError} onRetry={() => setRetry(n => n + 1)} /> : !consents ? <ActivityIndicator accessibilityLabel={tr('Loading privacy choices', 'Chargement des choix de confidentialité')} color={c.accent} /> : <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text style={{ flex: 1, color: c.ink, fontSize: 16 }}>{tr('Personalized reading suggestions', 'Suggestions de lecture personnalisées')}</Text><Switch accessibilityLabel={tr('Personalized reading suggestions', 'Suggestions de lecture personnalisées')} value={consents.personalizationConsent} disabled={busy} onValueChange={value => void changeConsent('personalizationConsent', value)} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text style={{ flex: 1, color: c.ink, fontSize: 16 }}>{tr('Optional AI processing', 'Traitement IA facultatif')}</Text><Switch accessibilityLabel={tr('Optional AI processing', 'Traitement IA facultatif')} value={consents.aiProcessingConsent} disabled={busy} onValueChange={value => void changeConsent('aiProcessingConsent', value)} /></View>
          <Text style={{ color: c.muted, lineHeight: 23 }}>{tr('Suggestions use your selected learning choices, never your prayer text. AI processing is optional and separate; changing this choice does not send a prayer for processing.', 'Les suggestions utilisent vos choix d’apprentissage, jamais le texte de vos prières. Le traitement IA est facultatif et distinct ; modifier ce choix n’envoie aucune prière.')}</Text>
        </>}
      </Card>
      <Card style={{ gap: 14 }}><Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{tr('Export my data', 'Exporter mes données')}</Text>
        <Text style={{ color: c.muted, lineHeight: 23 }}>{tr('Your export includes decrypted private prayers and reflections. The system share sheet lets you choose the destination. Only share with an app or person you trust. Large exports can be downloaded in web Settings.', 'Votre export contient vos prières et réflexions privées déchiffrées. La feuille de partage du système vous laisse choisir la destination. Partagez uniquement avec une application ou une personne de confiance. Les exports volumineux se téléchargent dans les paramètres du site.')}</Text>
        <Button kind="soft" title={tr('Prepare private data export', 'Préparer l’export privé')} disabled={busy} onPress={() => void exportData()} />
      </Card>
      <Card style={{ gap: 14 }}><Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{tr('Delete my account', 'Supprimer mon compte')}</Text>
        <Text style={{ color: c.muted, lineHeight: 23 }}>{tr('This permanently removes your LifeBook profile, prayers, reflections, reading and lesson progress, and pastoral conversations. Safety reports remain until their own retention date. Staff and approved pastors must close their responsibilities with the team first. This cannot be undone.', 'Cela supprime définitivement votre profil LifeBook, vos prières, réflexions, progressions de lecture et de leçons et vos échanges pastoraux. Les signalements restent jusqu’à leur date de conservation. L’équipe et les pasteurs approuvés doivent d’abord clôturer leurs responsabilités. Cette action est irréversible.')}</Text>
        <TextInput accessibilityLabel={tr(`Type ${word} to confirm`, `Saisissez ${word} pour confirmer`)} value={typed} onChangeText={setTyped} editable={!busy} autoCapitalize="characters" autoCorrect={false} style={{ minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, color: c.ink, backgroundColor: c.bg, fontSize: 17 }} />
        <Button kind="danger" title={tr('Delete account permanently', 'Supprimer définitivement le compte')} disabled={busy || typed !== word} onPress={() => Alert.alert(tr('Permanently delete this account?', 'Supprimer définitivement ce compte ?'), tr('Your private LifeBook data will be removed. This cannot be undone.', 'Vos données privées LifeBook seront supprimées. Cette action est irréversible.'), [{ text: tr('Cancel', 'Annuler'), style: 'cancel' }, { text: tr('Delete', 'Supprimer'), style: 'destructive', onPress: () => void erase() }])} />
      </Card>
      <DeletePrayers />
      {message ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{message}</Text> : null}
      {error ? <ErrorLine message={error} /> : null}
    </>}
  </Screen>;
}
