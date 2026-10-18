import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useSession } from '../../lib/app';
import { Button, Card, Row, Screen, SectionLabel, Segmented } from '../../components/ui';
import { PRAYER_LENGTHS } from '../../../web/lib/prayer-time';

export default function You() {
  const { c, t, prefs, setPrefs, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const [signInError, setSignInError] = useState('');
  const name = session.firstName || (session.isSignedIn ? t.you.member : t.you.signedOut);
  return <Screen title={t.you.title}>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View accessibilityElementsHidden style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>{session.firstName ? <Text style={{ color: c.deep, fontSize: 20, fontWeight: '800' }}>{session.firstName.slice(0, 1).toUpperCase()}</Text> : <Ionicons name="person" size={24} color={c.accent} />}</View>
      <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 17, fontWeight: '600' }}>{name}</Text>{session.isSignedIn ? <Text style={{ color: c.muted, fontSize: 14 }}>{t.you.member}</Text> : null}</View>
    </Card>
    {!session.isSignedIn ? <Button title={t.you.signIn} onPress={() => { setSignInError(''); session.signIn().catch(() => setSignInError(t.you.signInFailed)); }} /> : null}
    {signInError ? <Text accessibilityRole="alert" style={{ color: c.danger }}>{signInError}</Text> : null}

    <SectionLabel>{t.you.appearance}</SectionLabel>
    <Card style={{ gap: 14 }}>
      <Segmented label={t.you.appearance} value={prefs.appearance} onChange={v => setPrefs({ appearance: v })} options={[{ label: t.you.system, value: 'system' }, { label: t.you.light, value: 'light' }, { label: t.you.dark, value: 'dark' }]} />
      <View style={{ gap: 8 }}><Text style={{ color: c.ink, fontSize: 14, fontWeight: '600' }}>{t.you.language}</Text><Segmented label={t.you.language} value={lang} onChange={v => setPrefs({ lang: v })} options={[{ label: 'English', value: 'en' }, { label: 'Français', value: 'fr' }]} /></View>
    </Card>

    <SectionLabel>{t.you.prayerTime}</SectionLabel>
    <Card style={{ gap: 8 }}>
      <Text style={{ color: c.ink, fontSize: 14, fontWeight: '600' }}>{t.you.length}</Text>
      <Segmented label={t.you.length} value={prefs.length} onChange={v => setPrefs({ length: v })} options={PRAYER_LENGTHS.map(n => ({ label: `${n} min`, value: n }))} />
    </Card>

    <SectionLabel>{t.you.reading}</SectionLabel>
    <Row icon="text-outline" title={t.you.readingRow} onPress={() => router.push('/reader-settings')} />
    {session.isSignedIn ? <Row icon="compass-outline" title={t.you.profile} onPress={() => router.push('/onboarding')} /> : null}

    <SectionLabel>{t.you.privacy}</SectionLabel>
    <Card><Text style={{ color: c.muted, fontSize: 14, lineHeight: 21 }}>{t.you.privacyNote}</Text></Card>
    {session.isSignedIn ? <Button kind="quiet" title={t.you.signOut} onPress={() => void session.signOut()} style={{ marginTop: 10 }} /> : null}
  </Screen>;
}
