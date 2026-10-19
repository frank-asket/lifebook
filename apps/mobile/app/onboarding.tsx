import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Switch, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine, Press, Screen, Segmented } from '../components/ui';
import { FORMATS, GOALS, JOURNEYS, faithJourneyLabel, formatLabel, learningGoalLabel, type FaithProfile, type ProfileResponse } from '../../web/lib/api';
import { canSaveOnboarding, loadOnboardingProfile, type ProfileLoad } from '../../web/lib/onboarding';
import { errorMessage } from '../../web/lib/errors';

export default function Onboarding() {
  const { c, lang, setPrefs, t } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [load, setLoad] = useState<ProfileLoad>({ status: 'loading' });
  const [form, setForm] = useState<FaithProfile>({});
  const [original, setOriginal] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const dirty = load.status === 'ready' && JSON.stringify(form) !== original;

  useEffect(() => {
    if (!session.isSignedIn) return;
    const controller = new AbortController();
    setLoad({ status: 'loading' });
    loadOnboardingProfile(async () => {
      const token = await requireToken(session.getToken);
      return api<ProfileResponse>('/me/profile', token, { signal: controller.signal });
    }).then(result => {
      if (controller.signal.aborted) return;
      setLoad(result);
      if (result.status !== 'ready') return;
      const p = result.profile;
      const next: FaithProfile = {
        ...(p?.journey ? { journey: p.journey } : {}),
        language: p?.language === 'fr' || p?.language === 'en' ? p.language : lang,
        learningGoals: p?.learningGoals ?? [], preferredFormats: p?.preferredFormats ?? [],
        personalizationConsent: p?.personalizationConsent ?? false, aiProcessingConsent: p?.aiProcessingConsent ?? false,
      };
      setForm(next); setOriginal(JSON.stringify(next));
    });
    return () => controller.abort();
  }, [session.isSignedIn, session.getToken, attempt]);

  const leave = useCallback(() => {
    if (saving) return;
    const exit = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
    if (!dirty) { exit(); return; }
    Alert.alert(t.prayer.discardTitle, t.prayer.discardMessage, [
      { text: t.prayer.keepEditing, style: 'cancel' }, { text: t.prayer.discard, style: 'destructive', onPress: exit },
    ]);
  }, [dirty, saving, router, t]);
  useFocusEffect(useCallback(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => { leave(); return true; });
    return () => handler.remove();
  }, [leave]));

  async function save() {
    if (!canSaveOnboarding(load, saving)) return;
    setSaving(true); setError('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      await api('/me/profile', token, { method: 'PUT', body: JSON.stringify(form) });
      if (!mounted.current) return;
      setPrefs({ lang: form.language === 'fr' ? 'fr' : 'en' });
      router.replace('/');
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { if (mounted.current) setSaving(false); }
  }
  function toggle(key: 'learningGoals' | 'preferredFormats', value: string) {
    setForm(p => ({ ...p, [key]: p[key]?.includes(value) ? p[key]!.filter(v => v !== value) : [...(p[key] ?? []), value] }));
  }

  return <Screen title={tr('Your learning profile', 'Votre profil d’apprentissage')}>
    <Button kind="quiet" title={tr('Back', 'Retour')} onPress={leave} disabled={saving} />
    {!session.isSignedIn ? <Card><Text style={{ color: c.muted }}>{tr('Sign in from You to save your learning profile.', 'Connectez-vous depuis Vous pour enregistrer votre profil d’apprentissage.')}</Text></Card>
      : load.status === 'loading' ? <ActivityIndicator accessibilityLabel={tr('Loading your profile', 'Chargement de votre profil')} color={c.accent} />
      : load.status === 'failed' ? <ErrorLine message={errorMessage(load.error, lang)} onRetry={() => setAttempt(n => n + 1)} /> : <>
        <Text style={{ color: c.muted, fontSize: 16, lineHeight: 24 }}>{tr('Choose what supports your learning. This never ranks your faith or gives ministry authority.', 'Choisissez ce qui vous aide à apprendre. Cela ne classe jamais votre foi et ne confère aucune autorité ministérielle.')}</Text>
        <Card style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{t.you.language}</Text>
          <Segmented label={t.you.language} value={form.language ?? lang} disabled={saving} onChange={language => setForm(p => ({ ...p, language }))} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]} />
        </Card>
        <Card style={{ gap: 10 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{tr('Your journey (optional)', 'Votre parcours (facultatif)')}</Text>
          {JOURNEYS.map(j => <Press key={j.value} accessibilityRole="radio" accessibilityLabel={faithJourneyLabel(j.value, lang)} accessibilityState={{ checked: form.journey === j.value }} disabled={saving} onPress={() => setForm(p => ({ ...p, journey: p.journey === j.value ? null : j.value }))} style={{ padding: 14, borderRadius: 12, backgroundColor: form.journey === j.value ? c.soft : c.bg }}>
            <Text style={{ color: form.journey === j.value ? c.deep : c.ink, fontSize: 16 }}>{form.journey === j.value ? '✓ ' : ''}{faithJourneyLabel(j.value, lang)}</Text>
          </Press>)}
        </Card>
        <Card style={{ gap: 10 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{tr('Learning goals (optional)', 'Objectifs d’apprentissage (facultatifs)')}</Text>
          {[...new Set([...GOALS, ...(form.learningGoals ?? [])])].map(goal => <Press key={goal} accessibilityLabel={learningGoalLabel(goal, lang)} accessibilityRole="checkbox" accessibilityState={{ checked: form.learningGoals?.includes(goal) }} disabled={saving} onPress={() => toggle('learningGoals', goal)} style={{ padding: 14, borderRadius: 12, backgroundColor: form.learningGoals?.includes(goal) ? c.soft : c.bg }}>
            <Text style={{ color: form.learningGoals?.includes(goal) ? c.deep : c.ink, fontSize: 16 }}>{form.learningGoals?.includes(goal) ? '✓ ' : ''}{learningGoalLabel(goal, lang)}</Text>
          </Press>)}
        </Card>
        <Card style={{ gap: 10 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{tr('Preferred formats', 'Formats préférés')}</Text>
          {[...new Set([...FORMATS, ...(form.preferredFormats ?? [])])].map(format => <Press key={format} accessibilityLabel={formatLabel(format, lang)} accessibilityRole="checkbox" accessibilityState={{ checked: form.preferredFormats?.includes(format) }} disabled={saving} onPress={() => toggle('preferredFormats', format)} style={{ padding: 14, borderRadius: 12, backgroundColor: form.preferredFormats?.includes(format) ? c.soft : c.bg }}>
            <Text style={{ color: form.preferredFormats?.includes(format) ? c.deep : c.ink, fontSize: 16 }}>{form.preferredFormats?.includes(format) ? '✓ ' : ''}{formatLabel(format, lang)}</Text>
          </Press>)}
        </Card>
        <Card style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{tr('Your choices stay yours', 'Vous gardez le choix')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ color: c.ink, flex: 1, fontSize: 16 }}>{tr('Use my selected journey and goals for reading suggestions', 'Utiliser mon parcours et mes objectifs pour suggérer des lectures')}</Text>
            <Switch accessibilityLabel={tr('Personalized suggestions', 'Suggestions personnalisées')} disabled={saving} value={!!form.personalizationConsent} onValueChange={personalizationConsent => setForm(p => ({ ...p, personalizationConsent }))} />
          </View>
          <Text style={{ color: c.muted, lineHeight: 22 }}>{tr('Suggestions never use the contents of your prayers or reflections. AI processing consent is preserved; no prayer is sent by saving this profile.', 'Les suggestions n’utilisent jamais le contenu de vos prières ou réflexions. Votre choix concernant l’IA est conservé ; enregistrer ce profil n’envoie aucune prière.')}</Text>
        </Card>
        {error ? <ErrorLine message={error} /> : null}
        <Button title={saving ? t.prayer.saving : tr('Save and continue', 'Enregistrer et continuer')} disabled={!canSaveOnboarding(load, saving)} onPress={() => void save()} />
      </>}
  </Screen>;
}
