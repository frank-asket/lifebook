import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useSession } from '../../lib/app';
import { Button, Card, ErrorLine, Row, Screen, SectionLabel, Segmented } from '../../components/ui';
import { api, requireToken } from '../../lib/api';
import { errorMessage } from '../../../web/lib/errors';
import type { ProfileResponse } from '../../../web/lib/api';
import { PRAYER_LENGTHS } from '../../../web/lib/prayer-time';

export default function You() {
  const { c, t, prefs, setPrefs, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const [signInError, setSignInError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [languageError, setLanguageError] = useState('');
  const [languageReady, setLanguageReady] = useState(false);
  const [languageBusy, setLanguageBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    if (!session.isSignedIn) return;
    const controller = new AbortController();
    setLanguageReady(false); setLanguageError('');
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const result = await api<ProfileResponse>('/me/profile', token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const language = result.profile?.language;
        if (language === 'en' || language === 'fr') setPrefs({ lang: language });
        setLanguageReady(true);
      } catch (e) { if (!controller.signal.aborted) setLanguageError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [session.isSignedIn, session.getToken, setPrefs, attempt]));

  async function changeLanguage(language: 'en' | 'fr') {
    if (!session.isSignedIn) { setPrefs({ lang: language }); return; }
    if (!languageReady || languageBusy) return;
    setLanguageBusy(true); setLanguageError('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      await api('/me/profile', token, { method: 'PUT', body: JSON.stringify({ language }) });
      if (mounted.current) setPrefs({ lang: language });
    } catch (e) { if (mounted.current) setLanguageError(errorMessage(e, lang)); }
    finally { if (mounted.current) setLanguageBusy(false); }
  }
  async function authenticate(signOut = false) {
    if (authBusy) return;
    setAuthBusy(true); setSignInError('');
    try { await (signOut ? session.signOut() : session.signIn()); }
    catch { if (mounted.current) setSignInError(signOut ? (lang === 'fr' ? 'La déconnexion a échoué. Veuillez réessayer.' : 'Sign-out failed. Please try again.') : t.you.signInFailed); }
    finally { if (mounted.current) setAuthBusy(false); }
  }
  const name = session.firstName || (session.isSignedIn ? t.you.member : t.you.signedOut);
  return <Screen title={t.you.title}>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View accessibilityElementsHidden style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>{session.firstName ? <Text style={{ color: c.deep, fontSize: 20, fontWeight: '800' }}>{session.firstName.slice(0, 1).toUpperCase()}</Text> : <Ionicons name="person" size={24} color={c.accent} />}</View>
      <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 17, fontWeight: '600' }}>{name}</Text>{session.isSignedIn ? <Text style={{ color: c.muted, fontSize: 14 }}>{t.you.member}</Text> : null}</View>
    </Card>
    {!session.isSignedIn ? <Button title={t.you.signIn} disabled={authBusy} onPress={() => void authenticate()} /> : null}
    {signInError ? <Text accessibilityRole="alert" style={{ color: c.danger }}>{signInError}</Text> : null}

    <SectionLabel>{t.you.appearance}</SectionLabel>
    <Card style={{ gap: 14 }}>
      <Segmented label={t.you.appearance} value={prefs.appearance} onChange={v => setPrefs({ appearance: v })} options={[{ label: t.you.system, value: 'system' }, { label: t.you.light, value: 'light' }, { label: t.you.dark, value: 'dark' }]} />
      <View style={{ gap: 8 }}><Text style={{ color: c.ink, fontSize: 14, fontWeight: '600' }}>{t.you.language}</Text><Segmented label={t.you.language} value={lang} disabled={session.isSignedIn && (!languageReady || languageBusy)} onChange={v => void changeLanguage(v)} options={[{ label: 'English', value: 'en' }, { label: 'Français', value: 'fr' }]} /></View>
      {languageBusy ? <Text accessibilityLiveRegion="polite" style={{ color: c.muted }}>{t.prayer.saving}</Text> : null}
      {languageError ? <ErrorLine message={languageError} onRetry={() => setAttempt(n => n + 1)} /> : null}
    </Card>

    <SectionLabel>{t.you.prayerTime}</SectionLabel>
    <Card style={{ gap: 8 }}>
      <Text style={{ color: c.ink, fontSize: 14, fontWeight: '600' }}>{t.you.length}</Text>
      <Segmented label={t.you.length} value={prefs.length} onChange={v => setPrefs({ length: v })} options={PRAYER_LENGTHS.map(n => ({ label: `${n} min`, value: n }))} />
    </Card>

    <SectionLabel>{t.you.reading}</SectionLabel>
    <Row icon="text-outline" title={t.you.readingRow} onPress={() => router.push('/reader-settings')} />
    {session.isSignedIn ? <Row icon="compass-outline" title={t.you.profile} onPress={() => router.push('/onboarding')} /> : null}

    <Row icon="book-outline" title={lang === 'fr' ? 'Mes méditations' : 'My meditations'} onPress={() => router.push('/meditations')} />
    <Row icon="time-outline" title={lang === 'fr' ? 'Historique de la Parole du jour' : 'Daily Word history'} onPress={() => router.push('/daily-word-history')} />

    <SectionLabel>{t.you.privacy}</SectionLabel>
    <Card><Text style={{ color: c.muted, fontSize: 14, lineHeight: 21 }}>{t.you.privacyNote}</Text></Card>
    {session.isSignedIn ? <Button kind="quiet" title={t.you.signOut} disabled={authBusy} onPress={() => void authenticate(true)} style={{ marginTop: 10 }} /> : null}
  </Screen>;
}
