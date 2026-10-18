import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, timezone, useApp, useDailyWord, useSession, type TodaySession } from '../../lib/app';
import { fonts } from '../../lib/theme';
import { Button, Card, ErrorLine, Row, Screen } from '../../components/ui';
import { calendarDay, lastSevenDays, passageLabel } from '../../../web/lib/scripture';
import { DAILY_WORD_STEPS } from '../../../web/lib/daily-word-navigation';

type Reading = { locale: 'en' | 'fr'; chapterId: string; verse: number | null };

export default function Today() {
  const { c, t, lang, prefs, setPrefs } = useApp();
  const { word, error, date, retry } = useDailyWord();
  const session = useSession();
  const router = useRouter();
  const [today, setToday] = useState<TodaySession | null>(null);
  const [recent, setRecent] = useState<TodaySession[] | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);

  // Refresh whenever the tab comes back into view, e.g. after finishing a prayer time.
  useFocusEffect(useCallback(() => {
    if (!session.isSignedIn) { setToday(null); setRecent(null); setReading(null); return; }
    let active = true;
    (async () => {
      const token = await session.getToken();
      if (!token || !active) return;
      const [s, h, r] = await Promise.allSettled([
        api<TodaySession>(`/daily-word/sessions/today?timezone=${encodeURIComponent(timezone())}`, token),
        api<TodaySession[]>('/daily-word/sessions?limit=7', token),
        api<Reading | null>('/bible-reading/continue', token),
      ]);
      if (!active) return;
      if (s.status === 'fulfilled') setToday(s.value);
      if (h.status === 'fulfilled') setRecent(h.value);
      if (r.status === 'fulfilled') setReading(r.value);
    })();
    return () => { active = false; };
  }, [session.isSignedIn, session.getToken, date]));

  const done = DAILY_WORD_STEPS.map(step => Boolean(today?.steps.some(s => s.step === step)));
  const doneCount = done.filter(Boolean).length;
  const completed = today?.status === 'COMPLETED';
  const hour = new Date().getHours();
  const greet = hour < 4 || hour >= 18 ? t.greet.evening : hour < 12 ? t.greet.morning : t.greet.afternoon;
  const days = recent ? lastSevenDays(date, lang, recent.map(s => s.journeyDate.slice(0, 10) === date && today ? today : s)) : null;
  const count = days?.filter(d => d.state !== 'none').length ?? 0;
  const openReading = () => { if (reading) setPrefs({ bibleLocale: reading.locale, chapterId: reading.chapterId }); router.navigate('/bible'); };

  return <Screen eyebrow={calendarDay(date, lang)} title={`${greet}${session.firstName ? `, ${session.firstName}` : ''}`}>
    <Card style={{ padding: 22, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text accessibilityRole="header" style={{ color: c.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' }}>{t.today.word}</Text>
        <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{completed ? t.today.done : t.today.about(prefs.length)}</Text>
      </View>
      {word ? <>
        <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 24, lineHeight: 36 }}>{word.verse.text}</Text>
        <Text style={{ color: c.muted, fontSize: 14 }}><Text style={{ color: c.deep, fontWeight: '700' }}>{word.verse.reference}</Text> · {word.verse.translation}</Text>
      </> : error ? <ErrorLine message={t.today.error} onRetry={retry} /> : <View accessible accessibilityLabel={t.today.loading} style={{ paddingVertical: 24 }}><ActivityIndicator color={c.accent} /></View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 }}>
        <Button title={completed ? t.today.again : doneCount ? t.today.cont : t.today.begin} onPress={() => router.push('/prayer-time')} disabled={!word} style={{ flex: 1 }} />
        {today ? <View accessible accessibilityLabel={t.today.stepsDone(doneCount)} style={{ flexDirection: 'row', gap: 5 }}>
          {done.map((d, i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: d ? c.accent : c.line }} />)}
        </View> : null}
      </View>
    </Card>

    {days ? <Card style={{ paddingVertical: 18 }}>
      <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>{t.today.week}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map(d => <View key={d.date} accessible accessibilityLabel={d.name} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
          <View style={[{ width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
            d.state === 'done' && { backgroundColor: c.accent, borderColor: c.accent }, d.state === 'started' && { backgroundColor: c.soft, borderColor: c.accent },
            d.today && { shadowColor: c.accent, shadowOpacity: 0.9, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, borderColor: c.accent }]}>
            {d.state === 'done' ? <Ionicons name="checkmark" size={15} color={c.accentInk} /> : null}
          </View>
          <Text style={{ color: d.today ? c.ink : c.muted, fontSize: 11, fontWeight: '700' }}>{d.label}</Text>
        </View>)}
      </View>
      <Text style={{ color: c.muted, fontSize: 13, marginTop: 12 }}>{count === 0 ? t.today.fresh : count === 1 ? t.today.oneDay : t.today.days(count)}</Text>
    </Card> : null}

    <Row icon="book-outline" title={reading ? t.today.continueReading : t.today.readBible} subtitle={reading ? passageLabel(reading.chapterId, reading.locale, reading.verse) : t.today.readBibleSub} onPress={openReading} />
    <Row icon="lock-closed-outline" tone="rose" title={t.today.journal} subtitle={t.today.journalSub} onPress={() => router.navigate('/prayer')} />
  </Screen>;
}
