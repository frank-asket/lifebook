import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, timezone, useApp, useDailyWord, useSession, type TodaySession } from '../lib/app';
import { fonts } from '../lib/theme';
import { Button } from '../components/ui';
import { DAILY_WORD_STEPS as STEPS, initialDailyWordStep } from '../../web/lib/daily-word-navigation';
import { BREATH, breathPhase, clock, spokenDuration, stillnessSeconds } from '../../web/lib/prayer-time';

/** Full-screen prayer time: one step per screen, a clear way out, nothing else competing for attention. */
export default function PrayerTime() {
  const { c, t, lang, prefs } = useApp();
  const { word } = useDailyWord();
  const session = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [today, setToday] = useState<TodaySession | null>(null);
  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const enter = useRef(new Animated.Value(1)).current;
  const direction = useRef(1);

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined); }, []);
  useEffect(() => {
    if (!session.isSignedIn) return;
    let active = true;
    session.getToken().then(token => token ? api<TodaySession>('/daily-word/sessions/today', token, { method: 'POST', body: JSON.stringify({ timezone: timezone() }) }) : null)
      .then(s => { if (!active || !s) return; setToday(s); setReflection(s.reflection?.content ?? ''); setStep(s.status === 'COMPLETED' ? 0 : initialDailyWordStep(null, s.steps.map(x => x.step))); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [session.isSignedIn, session.getToken]);

  // Each step slides in from the side it came from; with Reduce Motion it only fades.
  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 320, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
  }, [step, enter]);

  const done = STEPS.map(s => Boolean(today?.steps.some(x => x.step === s)));
  const saved = today?.reflection?.content ?? '';
  const go = (n: number) => { direction.current = n < step ? -1 : 1; setError(''); setStep(n); };

  async function next() {
    const current = step;
    setError('');
    if (!today) { go(Math.min(5, current + 1)); return; }
    if (current === 2 && reflection.trim() && reflection !== saved) {
      setBusy(true);
      try {
        await api(`/daily-word/sessions/${today.id}/reflection`, await session.getToken(), { method: 'PUT', body: JSON.stringify({ content: reflection }) });
        setToday(s => s && { ...s, reflection: { content: reflection } });
      } catch { setError(t.pt.reflectionFailed); setBusy(false); return; }
      setBusy(false);
    }
    go(current + 1);
    if (done[current]) return;
    try {
      const updated = await api<TodaySession>(`/daily-word/sessions/${today.id}/steps/${STEPS[current]}`, await session.getToken(), { method: 'PUT' });
      setToday(s => s && { ...updated, reflection: s.reflection, steps: [...s.steps, ...updated.steps.filter(x => !s.steps.some(y => y.step === x.step))] });
    } catch { setError(t.pt.saveFailed); }
  }

  if (!word) return null;
  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : 22 * direction.current, 0] });
  const label = step === 3 ? t.pt.amen : step === 4 ? t.pt.finish : busy ? t.pt.saving : t.pt.next;

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
    <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t.pt.close} onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: pressed ? c.soft : 'transparent' })}>
        <Ionicons name="close" size={24} color={c.muted} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }} accessibilityLabel={step < 5 ? t.pt.stepOf(step + 1) : undefined}>
        {step < 5 ? t.steps.map((name, i) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${i + 1}. ${name}${done[i] ? t.pt.done : ''}`} accessibilityState={{ selected: i === step }} onPress={() => go(i)} style={{ width: 30, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ height: 7, width: i === step ? 22 : 7, borderRadius: 4, backgroundColor: i === step ? c.accent : done[i] ? c.accent : c.line, opacity: i !== step && done[i] ? 0.5 : 1 }} />
        </Pressable>) : null}
      </View>
      <View style={{ width: 44 }} />
    </View>

    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
      <Animated.View style={{ opacity: enter, transform: [{ translateX }] }}>
        {step < 5 ? <Text style={{ color: c.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 18 }}>{t.steps[step]}</Text> : null}
        {step === 0 && <>
          <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 31, lineHeight: 44 }}>{word.verse.text}</Text>
          <Text style={{ color: c.muted, fontSize: 14, marginTop: 16 }}><Text style={{ color: c.deep, fontWeight: '700' }}>{word.verse.reference}</Text> · {word.verse.translation}</Text>
          <Text style={{ color: c.ink, fontSize: 17, lineHeight: 29, marginTop: 26 }}>{word.explanation}</Text>
        </>}
        {step === 1 && <>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 27, fontWeight: '700', letterSpacing: -0.5 }}>{t.pt.stillTitle}</Text>
          <Text style={{ color: c.ink, fontSize: 17, lineHeight: 29, marginTop: 14 }}>{word.meditation}</Text>
          <Stillness key={prefs.length} seconds={stillnessSeconds(prefs.length)} reduceMotion={reduceMotion} />
        </>}
        {step === 2 && <>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 27, fontWeight: '700', letterSpacing: -0.5, lineHeight: 34 }}>{word.reflectionQuestion}</Text>
          <TextInput accessibilityLabel={t.pt.reflectLabel} value={reflection} onChangeText={setReflection} editable={!busy} multiline maxLength={10000} placeholder={t.pt.reflectPh} placeholderTextColor={c.muted}
            style={{ marginTop: 22, minHeight: 170, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, color: c.ink, fontSize: 17, lineHeight: 26, textAlignVertical: 'top' }} />
          <Text style={{ color: c.muted, fontSize: 13, marginTop: 10 }}>{session.isSignedIn ? t.pt.reflectHint : t.pt.reflectSignedOut}</Text>
        </>}
        {step === 3 && <>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 27, fontWeight: '700', letterSpacing: -0.5, lineHeight: 34 }}>{t.pt.prayTitle}</Text>
          <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22, lineHeight: 37, marginTop: 24 }}>{word.prayer}</Text>
        </>}
        {step === 4 && <>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 27, fontWeight: '700', letterSpacing: -0.5 }}>{t.pt.liveTitle}</Text>
          <Text style={{ color: c.ink, fontSize: 18, lineHeight: 30, marginTop: 22 }}>{word.application}</Text>
        </>}
        {step === 5 && <View style={{ alignItems: 'center', gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft }}><Ionicons name="checkmark" size={30} color={c.accent} /></View>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 26, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5 }}>{t.pt.closingTitle}</Text>
          {error ? <Text accessibilityRole="alert" style={{ color: c.danger, textAlign: 'center' }}>{error}</Text>
            : <Text style={{ color: c.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' }}>{session.isSignedIn ? t.pt.closingText : t.pt.closingSignedOut}</Text>}
          <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 10 }}>
            <Button title={t.pt.home} onPress={() => router.back()} />
            {session.isSignedIn && !reflection.trim() ? <Button kind="quiet" title={t.pt.writeReflection} onPress={() => go(2)} /> : null}
            <Button kind="quiet" title={t.pt.journal} onPress={() => { router.back(); router.navigate('/prayer'); }} />
          </View>
        </View>}
      </Animated.View>
    </ScrollView>

    {step < 5 ? <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: c.line, gap: 10 }}>
      {error ? <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 14 }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button kind="quiet" title={t.pt.back} onPress={() => go(Math.max(0, step - 1))} disabled={busy || step === 0} style={{ flex: 1 }} />
        <Button title={label} onPress={() => void next()} disabled={busy} style={{ flex: 1 }} />
      </View>
    </View> : null}
  </KeyboardAvoidingView>;
}

/** A breathing pace: the circle grows for the in-breath and settles for the out-breath. Reduce Motion swaps scale for opacity. */
function Stillness({ seconds, reduceMotion }: { seconds: number; reduceMotion: boolean }) {
  const { c, t, lang } = useApp();
  const [elapsed, setElapsed] = useState<number | null>(null);
  const breath = useRef(new Animated.Value(0)).current;
  const phase = elapsed === null || elapsed >= seconds ? null : breathPhase(elapsed);
  useEffect(() => {
    if (elapsed === null || elapsed >= seconds) return;
    const start = Date.now() - elapsed * 1000;
    const timer = setInterval(() => { const e = (Date.now() - start) / 1000; setElapsed(e >= seconds ? seconds : e); if (e >= seconds) clearInterval(timer); }, 250);
    return () => clearInterval(timer);
  }, [elapsed === null, seconds]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!phase) { Animated.timing(breath, { toValue: 0, duration: 1200, useNativeDriver: true }).start(); return; }
    Animated.timing(breath, { toValue: phase === 'in' ? 1 : 0, duration: (phase === 'in' ? BREATH.inhale : BREATH.exhale) * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
  }, [phase, breath]);
  const running = phase !== null;
  const over = elapsed !== null && elapsed >= seconds;
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return <View style={{ alignItems: 'center', gap: 12, marginTop: 32 }}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: c.accent, opacity: reduceMotion ? Animated.multiply(opacity, 0.3) : 0.22, transform: reduceMotion ? [] : [{ scale }] }} />
    </View>
    <Text accessibilityLiveRegion="polite" style={{ color: c.ink, fontSize: 16, fontWeight: '600', textAlign: 'center', minHeight: 22 }}>{running ? (phase === 'in' ? t.pt.inhale : t.pt.exhale) : over ? t.pt.over : t.pt.hint}</Text>
    <View style={{ minHeight: 48, justifyContent: 'center' }}>
      {running ? <Text style={{ color: c.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{clock(seconds - (elapsed ?? 0))}</Text>
        : !over ? <Button kind="soft" title={t.pt.beginStill(spokenDuration(seconds, lang))} onPress={() => setElapsed(0)} style={{ minHeight: 44 }} /> : null}
    </View>
  </View>;
}
