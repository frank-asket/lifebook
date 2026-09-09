import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { colors, MOODS, MoodId } from '../theme/colors';
import { MoodChip } from '../components/MoodChip';
import { StreakBadge } from '../components/StreakBadge';
import { checkIn, fetchStreak, fetchPreferences, CheckinResponse, StreakRecord, ActiveJourney } from '../api/client';
import { JourneySection } from '../components/JourneySection';

interface Props {
  deviceId: string;
  onContentReady: (result: CheckinResponse) => void;
  onOpenCommunity: () => void;
  onOpenSaved: () => void;
  onOpenProfile: () => void;
  onOpenJourneyDay: (active: ActiveJourney) => void;
  journeyRefreshKey: number;
}

const LOADING_MESSAGES = ['Choosing a verse for you…', 'Writing today\u2019s reflection…', 'Preparing a short prayer…'];

function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen({ deviceId, onContentReady, onOpenCommunity, onOpenSaved, onOpenProfile, onOpenJourneyDay, journeyRefreshKey }: Props) {
  const [streak, setStreak] = useState<StreakRecord | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pendingMood, setPendingMood] = useState<MoodId | null>(null);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStreak(deviceId).then(r => setStreak(r.streak)).catch(() => {});
    fetchPreferences(deviceId).then(r => setDisplayName(r.preferences?.displayName || null)).catch(() => {});
  }, [deviceId]);

  useEffect(() => {
    if (!pendingMood) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingText(LOADING_MESSAGES[i]);
    }, 1400);
    return () => clearInterval(interval);
  }, [pendingMood]);

  const greeting = greetingForHour(new Date().getHours());
  const namePart = displayName ? `, ${displayName}` : '';

  async function handleSelect(moodId: MoodId) {
    setError(null);
    setPendingMood(moodId);
    setLoadingText(LOADING_MESSAGES[0]);
    try {
      const result = await checkIn(deviceId, moodId);
      setStreak(result.streak);
      onContentReady(result);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setPendingMood(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/lifebook-logo.png')} style={styles.logo} />
          <Text style={styles.brandName}>LifeBook</Text>
        </View>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Notifications">
            <Text style={styles.iconText}>🔔</Text>
          </Pressable>
          <Pressable style={styles.avatarBtn} accessibilityLabel="Profile" onPress={onOpenProfile}>
            <Text style={styles.avatarText}>{(displayName || 'F')[0].toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.greeting}>{greeting}{namePart} 👋</Text>
      <Text style={styles.greetingSub}>Take a moment to reflect, grow, and reconnect today.</Text>

      <StreakBadge streak={streak} />

      {/* Mood check-in */}
      <Text style={styles.eyebrow}>HOW ARE YOU FEELING TODAY?</Text>
      <View style={styles.grid}>
        {MOODS.map(m => (
          <MoodChip
            key={m.id}
            label={m.label}
            emoji={m.emoji}
            desc={m.desc}
            accentColor={m.color}
            selected={pendingMood === m.id}
            disabled={pendingMood !== null}
            onPress={() => handleSelect(m.id)}
          />
        ))}
      </View>

      {pendingMood && (
        <View style={styles.statusRow}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.statusText}>{loadingText}</Text>
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      <JourneySection deviceId={deviceId} onContinue={onOpenJourneyDay} refreshKey={journeyRefreshKey} />

      {/* Explore / quick actions */}
      <Text style={[styles.eyebrow, { marginTop: 8 }]}>EXPLORE</Text>
      <View style={styles.quickRow}>
        <QuickAction icon="⚡" label="Quick Session" onPress={() => handleSelect('peaceful')} disabled={pendingMood !== null} />
        <QuickAction icon="👥" label="Community" onPress={onOpenCommunity} />
        <QuickAction icon="🔖" label="Saved" onPress={onOpenSaved} />
      </View>

      <Text style={styles.safety}>
        Not okay right now? Please reach out to a crisis line or someone you trust — this app isn't a substitute for that.
      </Text>
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress, disabled }: { icon: string; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.quickCard, disabled && { opacity: 0.4 }]}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 28, height: 28, resizeMode: 'contain' },
  brandName: { color: colors.white, fontSize: 17, fontWeight: '700' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 16 },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  greeting: { color: colors.white, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  greetingSub: { color: '#B6ABCF', fontSize: 13, marginBottom: 18 },
  eyebrow: { color: '#9C8FBB', fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 10 },
  statusText: { color: '#D8CFEC', fontSize: 13 },
  error: { color: '#F6B0C5', fontSize: 13, marginBottom: 10 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickCard: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 14, marginHorizontal: 4 },
  quickIcon: { fontSize: 18, marginBottom: 6 },
  quickLabel: { color: '#D8CFEC', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  safety: { color: '#8A7DAD', fontSize: 11, textAlign: 'center', marginTop: 10 },
});
