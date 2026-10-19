import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, useApp, useSession } from '../../lib/app';
import { Button, Card, ErrorLine, Row, Screen, SectionLabel } from '../../components/ui';
import { PrayerDetail } from '../../components/prayer-detail';
import { Press } from '../../components/ui';
import { requireToken } from '../../lib/api';
import { errorMessage } from '../../../web/lib/errors';
import { PRAYER_LIMITS, type PrayerSummary } from '../../../web/lib/prayer-api';

export default function Prayer() {
  const { c, t, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const [items, setItems] = useState<PrayerSummary[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [signInError, setSignInError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const date = (v: string) => new Date(v).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });

  useFocusEffect(useCallback(() => {
    async function signIn() {
    if (authBusy) return;
    setAuthBusy(true); setSignInError('');
    try { await session.signIn(); }
    catch { if (mounted.current) setSignInError(t.you.signInFailed); }
    finally { if (mounted.current) setAuthBusy(false); }
  }
  if (!session.isSignedIn) return;
    let active = true; setLoadError('');
    requireToken(session.getToken).then(token => active ? api<PrayerSummary[]>('/prayers', token) : null).then(rows => { if (active && rows) setItems(rows); }).catch(() => { if (active) setLoadError(t.prayer.error); });
    return () => { active = false; };
  }, [session.isSignedIn, session.getToken, reload, t.prayer.error]));

  async function save() {
    if (!draft.trim()) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      await api('/prayers', token, { method: 'POST', body: JSON.stringify({ body: draft }) });
      if (!mounted.current) return;
      setDraft(''); setMessage(t.prayer.saved); setReload(n => n + 1);
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { if (mounted.current) setBusy(false); }
  }

  async function signIn() {
    if (authBusy) return;
    setAuthBusy(true); setSignInError('');
    try { await session.signIn(); }
    catch { if (mounted.current) setSignInError(t.you.signInFailed); }
    finally { if (mounted.current) setAuthBusy(false); }
  }
  if (!session.isSignedIn) return <Screen title={t.prayer.title}>
    <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
      <Ionicons name="lock-closed-outline" size={28} color={c.accent} />
      <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>{t.prayer.signedOutTitle}</Text>
      <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' }}>{t.prayer.signedOutText}</Text>
      <Button title={t.you.signIn} disabled={authBusy} onPress={() => void signIn()} style={{ alignSelf: 'stretch', marginTop: 6 }} />
      {signInError ? <Text accessibilityRole="alert" style={{ color: c.danger, textAlign: 'center' }}>{signInError}</Text> : null}
    </Card>
    <Row icon="chatbubble-ellipses-outline" title={t.prayer.pastor} badge={t.prayer.pilot} subtitle={t.prayer.pastorSub} />
  </Screen>;

  return <Screen title={t.prayer.title}>
    <Row icon="book-outline" title={lang === 'fr' ? 'Méditations' : 'Meditations'} subtitle={lang === 'fr' ? 'Vos enregistrements et votre historique' : 'Your saved meditations and history'} onPress={() => router.push('/meditations')} />
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 17, fontWeight: '700' }}>{t.prayer.write}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.soft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}><Ionicons name="lock-closed" size={11} color={c.deep} /><Text style={{ color: c.deep, fontSize: 12, fontWeight: '600' }}>{t.prayer.lock}</Text></View>
      </View>
      <TextInput accessibilityLabel={t.prayer.write} value={draft} onChangeText={v => { setDraft(v); setMessage(''); }} multiline maxLength={PRAYER_LIMITS.body} placeholder={t.prayer.placeholder} placeholderTextColor={c.muted}
        style={{ minHeight: 130, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, color: c.ink, fontSize: 17, lineHeight: 26, textAlignVertical: 'top' }} />
      {draft.length > PRAYER_LIMITS.body * 0.9 ? <Text style={{ color: c.muted, fontSize: 12 }}>{PRAYER_LIMITS.body - draft.length}</Text> : null}
      <Button title={busy ? t.prayer.saving : t.prayer.save} onPress={() => void save()} disabled={busy || !draft.trim()} />
      {message ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep, textAlign: 'center' }}>{message}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text> : null}
    </Card>
    <SectionLabel>{t.prayer.journal}</SectionLabel>
    {loadError ? <ErrorLine message={loadError} onRetry={() => setReload(n => n + 1)} />
      : !items ? <ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} />
      : !items.length ? <Text style={{ color: c.muted, fontSize: 15, paddingHorizontal: 4 }}>{t.prayer.empty}</Text>
      : <Card style={{ padding: 0, overflow: 'hidden' }}>{items.map((p, i) => <Press key={p.id} accessibilityRole="button" accessibilityLabel={`${t.prayer.open}: ${p.title || t.prayer.untitled}`} onPress={() => setSelected(p.id)} style={{ padding: 16, gap: 4, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '600', flex: 1 }} numberOfLines={1}>{p.title || t.prayer.untitled}</Text><Text style={{ color: c.muted, fontSize: 13 }}>{date(p.updatedAt)}</Text></View>
          <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>{p.preview}</Text>
          {p.answeredAt ? <Text style={{ alignSelf: 'flex-start', marginTop: 4, color: c.deep, backgroundColor: c.soft, fontSize: 12, fontWeight: '600', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden' }}>{t.prayer.answered}</Text> : null}
        </Press>)}</Card>}
    {selected ? <PrayerDetail key={selected} id={selected} onClose={() => setSelected(null)} onChanged={() => setReload(n => n + 1)} /> : null}
    <Row icon="chatbubble-ellipses-outline" title={t.prayer.pastor} badge={t.prayer.pilot} subtitle={t.prayer.pastorSub} />
  </Screen>;
}
