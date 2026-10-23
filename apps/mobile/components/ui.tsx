import { Platform, useWindowDimensions, Pressable, ScrollView, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/app';

/** A tab screen: large title, comfortable gutters, content scrolls under the status bar area. */
export function Screen({ title, eyebrow, children, keyboardInsets = true }: { title: string; eyebrow?: string; keyboardInsets?: boolean; children: React.ReactNode }) {
  const { c } = useApp();
  const insets = useSafeAreaInsets();
  return <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingLeft: Math.max(20, insets.left), paddingRight: Math.max(20, insets.right), paddingBottom: insets.bottom + 32, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' }} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} automaticallyAdjustKeyboardInsets={keyboardInsets}>
    <View style={{ gap: 4, paddingHorizontal: 2, paddingBottom: 4 }}>
      {eyebrow ? <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 34, fontWeight: '800', letterSpacing: -0.6 }}>{title}</Text>
    </View>
    {children}
  </ScrollView>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useApp();
  return <View style={[{ backgroundColor: c.paper, borderRadius: 20, borderWidth: 1, borderColor: c.line, padding: 18 }, style]}>{children}</View>;
}

/** Immediate tonal feedback stays still for people sensitive to motion. */
export function Press({ style, children, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <Pressable {...rest} accessibilityState={{ ...rest.accessibilityState, ...(rest.disabled !== undefined ? { disabled: !!rest.disabled } : {}) }} style={({ pressed }) => [{ minHeight: 48, minWidth: 48 }, style, pressed && !rest.disabled && { opacity: 0.72 }]}>{children}</Pressable>;
}

export function Button({ title, onPress, kind = 'primary', disabled, style, accessibilityHint }: { title: string; onPress: () => void; kind?: 'primary' | 'quiet' | 'soft' | 'danger'; disabled?: boolean; style?: StyleProp<ViewStyle>; accessibilityHint?: string }) {
  const { c } = useApp();
  const bg = kind === 'primary' ? c.accent : kind === 'soft' ? c.soft : kind === 'danger' ? c.danger : c.paper;
  const fg = kind === 'primary' || kind === 'danger' ? c.accentInk : kind === 'soft' ? c.deep : c.ink;
  return <Press accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} accessibilityHint={accessibilityHint} disabled={disabled} onPress={onPress}
    style={[{ minHeight: 50, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, kind === 'quiet' && { borderWidth: 1, borderColor: c.line }, style]}>
    <Text style={{ color: fg, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
  </Press>;
}

/** A tappable list row with an icon, title, subtitle and chevron. */
export function Row({ icon, tone = 'soft', title, subtitle, onPress, badge }: { icon: keyof typeof Ionicons.glyphMap; tone?: 'soft' | 'rose'; title: string; subtitle?: string; onPress?: () => void; badge?: string }) {
  const { c } = useApp();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.3;
  return <Press accessibilityLabel={[title, subtitle, badge].filter(Boolean).join(', ')} accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: c.paper, borderRadius: 20, borderWidth: 1, borderColor: c.line }}>
    {!largeText ? <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: tone === 'rose' ? c.rose : c.soft }}><Ionicons accessible={false} importantForAccessibility="no" name={icon} size={20} color={c.accent} /></View> : null}
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '600', flexShrink: 1 }}>{title}</Text>
        {badge ? <Text style={{ color: c.deep, backgroundColor: c.soft, fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, overflow: 'hidden' }}>{badge}</Text> : null}
      </View>
      {subtitle ? <Text style={{ color: c.muted, fontSize: 14 }}>{subtitle}</Text> : null}
    </View>
    {onPress && !largeText ? <Ionicons accessible={false} importantForAccessibility="no" name="chevron-forward" size={16} color={c.muted} /> : null}
  </Press>;
}

export function Segmented<T extends string | number>({ label, options, value, onChange, disabled = false }: { label: string; options: { label: string; value: T; textStyle?: TextStyle }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  const { c } = useApp();
  const { width, fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.3 || options.length > 4 || (options.length > 3 && width < 380);
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: stacked ? 'column' : 'row', gap: 3, padding: 3, borderRadius: 12, backgroundColor: c.soft }}>
    {options.map(o => {
      const on = o.value === value;
      return <Pressable key={String(o.value)} accessibilityRole="radio" accessibilityLabel={o.label} accessibilityState={{ checked: on, disabled }} disabled={disabled} onPress={() => onChange(o.value)}
        style={{ flex: stacked ? undefined : 1, minWidth: 0, minHeight: 48, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.chip : 'transparent', shadowColor: '#140e24', shadowOpacity: on ? 0.12 : 0, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
        <Text style={[{ color: on ? c.ink : c.deep, fontSize: 15, fontWeight: '600', textAlign: 'center', flexShrink: 1 }, o.textStyle]}>{o.label}</Text>
      </Pressable>;
    })}
  </View>;
}

export function SectionLabel({ children }: { children: string }) {
  const { c } = useApp();
  return <Text accessibilityRole="header" style={{ color: c.muted, fontSize: 13, fontWeight: '600', paddingHorizontal: 4, paddingTop: 14 }}>{children}</Text>;
}

export function ErrorLine({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { c, t } = useApp();
  return <View accessibilityRole="alert" style={{ gap: 10, alignItems: 'flex-start' }}>
    <Text style={{ color: c.muted, fontSize: 15 }}>{message}</Text>
    {onRetry ? <Button kind="soft" title={t.retry} onPress={onRetry} style={{ minHeight: 48 }} /> : null}
  </View>;
}
