import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { colors, radius } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  }
  return TabIcon;
}

function practiceIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.practice, focused && styles.practiceFocused]}>
      <Ionicons name="leaf" color={colors.background} size={22} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('book-outline') }} />
      <Tabs.Screen
        name="practice"
        options={{ title: 'Practice', tabBarIcon: practiceIcon, tabBarLabelStyle: styles.practiceLabel }}
      />
      <Tabs.Screen name="community" options={{ title: 'Community', tabBarIcon: icon('people-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 68,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabLabel: { fontSize: 11 },
  practiceLabel: { fontSize: 11, color: colors.accent },
  practice: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  practiceFocused: { backgroundColor: colors.lilac },
});
