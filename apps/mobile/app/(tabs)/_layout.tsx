import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { useApp } from '../../lib/app';

export default function TabsLayout() {
  const { c, t } = useApp();
  const icon = (name: keyof typeof Ionicons.glyphMap, filled: keyof typeof Ionicons.glyphMap) => ({ color, focused }: { color: ColorValue; focused: boolean }) => <Ionicons name={focused ? filled : name} size={24} color={color} />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.muted, tabBarStyle: { backgroundColor: c.paper, borderTopColor: c.line }, sceneStyle: { backgroundColor: c.bg } }}>
    <Tabs.Screen name="index" options={{ title: t.tabs.today, tabBarIcon: icon('sunny-outline', 'sunny') }} />
    <Tabs.Screen name="bible" options={{ title: t.tabs.bible, tabBarIcon: icon('book-outline', 'book') }} />
    <Tabs.Screen name="prayer" options={{ title: t.tabs.prayer, tabBarIcon: icon('heart-outline', 'heart') }} />
    <Tabs.Screen name="you" options={{ title: t.tabs.you, tabBarIcon: icon('person-circle-outline', 'person-circle') }} />
  </Tabs>;
}
