import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fetchSubscription, upgradeSubscription, sendTestNotification, Subscription } from '../api/client';
import { useClerk } from '@clerk/clerk-expo';
import { registerForPushNotifications } from '../notifications/push';

export function SettingsScreen({ deviceId }: { deviceId: string }) {
  const { signOut } = useClerk();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [communityUpdates, setCommunityUpdates] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'requesting' | 'on' | 'failed'>('idle');
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription(deviceId).then(r => setSub(r.subscription));
  }, [deviceId]);

  async function handleToggleDailyReminder(value: boolean) {
    setDailyReminder(value);
    if (!value) return;
    setPushStatus('requesting');
    setPushMessage(null);
    const result = await registerForPushNotifications(deviceId);
    if (result.ok) {
      setPushStatus('on');
    } else {
      setPushStatus('failed');
      setPushMessage(result.reason || 'Could not enable notifications.');
      setDailyReminder(false);
    }
  }

  async function handleSendTest() {
    setTestStatus('Sending…');
    const result = await sendTestNotification(deviceId);
    setTestStatus(result.sent ? 'Sent — check your device.' : `Not sent: ${result.reason}`);
  }

  async function handleUpgrade(cycle: 'monthly' | 'annual') {
    setUpgrading(true);
    try {
      const r = await upgradeSubscription(deviceId, cycle);
      setSub(r.subscription);
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
      <View style={styles.card}>
        <Text style={styles.tier}>
          Current plan: {sub?.tier === 'premium' ? 'Premium' : 'Free'}
        </Text>
        {sub?.tier !== 'premium' && (
          <View style={styles.upgradeRow}>
            <Pressable onPress={() => handleUpgrade('monthly')} disabled={upgrading} style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Go Premium — Monthly</Text>
            </Pressable>
            <Pressable onPress={() => handleUpgrade('annual')} disabled={upgrading} style={[styles.upgradeBtn, styles.upgradeBtnAlt]}>
              <Text style={styles.upgradeBtnText}>Go Premium — Annual</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.note}>
          This upgrade is a working demo toggle, not a real charge — a live payment processor (Stripe or
          App Store/Play Store in-app purchase) needs to be connected before this can take real money.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily reminder</Text>
          <Switch value={dailyReminder} onValueChange={handleToggleDailyReminder} trackColor={{ true: colors.teal }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Community updates</Text>
          <Switch value={communityUpdates} onValueChange={setCommunityUpdates} trackColor={{ true: colors.teal }} />
        </View>

        {pushStatus === 'requesting' && <Text style={styles.note}>Requesting permission…</Text>}
        {pushStatus === 'failed' && pushMessage && <Text style={styles.pushError}>{pushMessage}</Text>}
        {pushStatus === 'on' && (
          <Pressable onPress={handleSendTest} style={styles.testBtn}>
            <Text style={styles.testBtnText}>Send a test notification</Text>
          </Pressable>
        )}
        {testStatus && <Text style={styles.note}>{testStatus}</Text>}

        <Text style={styles.note}>
          Real push delivery needs a physical device (not a simulator) and, for a production build,
          Expo push credentials configured in your EAS project. See mobile/src/notifications/push.ts.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>LifeBook v0.1.0 (development build)</Text>
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={styles.card}>
        <Pressable onPress={() => signOut()}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 20 },
  sectionTitle: { color: '#9C8FBB', fontSize: 11, letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10 },
  tier: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 10 },
  upgradeRow: { gap: 8 },
  upgradeBtn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  upgradeBtnAlt: { backgroundColor: colors.purple },
  upgradeBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowLabel: { color: colors.white, fontSize: 14 },
  note: { color: '#8A7DAD', fontSize: 11, marginTop: 10, lineHeight: 15 },
  pushError: { color: '#F6B0C5', fontSize: 11.5, marginTop: 8, lineHeight: 15 },
  testBtn: { backgroundColor: 'rgba(31,182,176,0.16)', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  testBtnText: { color: colors.teal, fontWeight: '600', fontSize: 12.5 },
  signOut: { color: '#F6B0C5', fontSize: 14, fontWeight: '600' },
});
