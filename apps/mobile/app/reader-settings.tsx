import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../lib/app';
import { fonts } from '../lib/theme';
import { Segmented } from '../components/ui';
import { TEXT_SIZES, stepSize } from '../../web/lib/reader-settings';
import { READER_PREVIEW, readerText } from '../lib/reader-style';

/** The "Aa" sheet: Bible language, text size, spacing and typeface. Changes apply to the reader behind it at once. */
export default function ReaderSettings() {
  const { c, t, prefs, setPrefs, bibleLocale } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = prefs.reader;
  const level = TEXT_SIZES.indexOf(r.size);
  const preview = READER_PREVIEW[bibleLocale];
  const style = readerText(r);
  const label = (text: string) => <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{text}</Text>;
  const sizeButton = (by: 1 | -1, a11y: string, glyph: number) => <Pressable accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ disabled: by < 0 ? level === 0 : level === TEXT_SIZES.length - 1 }} disabled={by < 0 ? level === 0 : level === TEXT_SIZES.length - 1}
    onPress={() => setPrefs({ reader: { ...r, size: stepSize(r.size, by) } })} style={({ pressed }) => ({ width: 48, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', opacity: (by < 0 ? level === 0 : level === TEXT_SIZES.length - 1) ? 0.35 : 1, backgroundColor: pressed ? c.soft : c.paper })}>
    <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: glyph }}>A</Text>
  </Pressable>;
  return <ScrollView style={{ flex: 1, backgroundColor: c.paper }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: insets.bottom + 24, gap: 18 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
      <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 18, fontWeight: '700' }}>{t.reader.title}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 48, minWidth: 48, justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>{t.reader.done}</Text></Pressable>
    </View>
    <View accessible accessibilityLabel={`${t.reader.preview}: ${preview.text} ${preview.reference}`} style={{ backgroundColor: c.soft, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}>
      <Text style={{ color: c.ink, fontSize: style.size, lineHeight: Math.round(style.size * style.leading), fontFamily: style.family }}>{preview.text}</Text>
      <Text style={{ color: c.muted, fontSize: 12 }}>{preview.reference} · {preview.translation}</Text>
    </View>
    <View style={{ gap: 8 }}>{label(t.reader.language)}<Segmented label={t.reader.language} value={bibleLocale} onChange={v => setPrefs({ bibleLocale: v })} options={[{ label: 'English', value: 'en' }, { label: 'Français', value: 'fr' }]} /></View>
    <View style={{ gap: 8 }}>{label(t.reader.size)}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        {sizeButton(-1, t.reader.smaller, 14)}
        <View accessible accessibilityLabel={t.reader.sizeOf(level + 1)} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          {TEXT_SIZES.map((s, i) => <View key={s} style={{ width: 6, height: 8 + i * 4, borderRadius: 3, backgroundColor: i <= level ? c.accent : c.line }} />)}
        </View>
        {sizeButton(1, t.reader.larger, 22)}
      </View>
    </View>
    <View style={{ gap: 8 }}>{label(t.reader.spacing)}<Segmented label={t.reader.spacing} value={r.spacing} onChange={v => setPrefs({ reader: { ...r, spacing: v } })} options={[{ label: t.reader.standard, value: 'normal' }, { label: t.reader.airy, value: 'relaxed' }]} /></View>
    <View style={{ gap: 8 }}>{label(t.reader.typeface)}<Segmented label={t.reader.typeface} value={r.font} onChange={v => setPrefs({ reader: { ...r, font: v } })} options={[{ label: t.reader.serif, value: 'serif', textStyle: { fontFamily: fonts.serif } }, { label: t.reader.sans, value: 'sans', textStyle: { fontFamily: undefined } }]} /></View>
  </ScrollView>;
}
