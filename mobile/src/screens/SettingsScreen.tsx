import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fetchSubscription, upgradeSubscription, sendTestNotification, Subscription } from '../api/client';
import { useClerk } from '@clerk/clerk-expo';
import { registerForPushNotifications } from '../notifications/push';
import {
  getDailyReminderConfig,
  scheduleDailyMorningReminder,
  cancelDailyMorningReminder,
  triggerTestMorningReminder,
  formatReminderTime,
  MORNING_TIME_PRESETS,
} from '../notifications/localScheduler';

export function SettingsScreen({ deviceId }: { deviceId: string }) {
  const { signOut } = useClerk();
  const [sub, setSub] = useState<Subscription | null>(null);

  // Local Daily 5-Minute Morning Reminder state
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderHour, setReminderHour] = useState(7);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [schedulingStatus, setSchedulingStatus] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Remote Push / Community updates state
  const [communityUpdates, setCommunityUpdates] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'requesting' | 'on' | 'failed'>('idle');
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription(deviceId).then(r => setSub(r.subscription));

    // Load persisted local reminder configuration
    getDailyReminderConfig().then(config => {
      setDailyReminder(config.enabled);
      setReminderHour(config.hour);
      setReminderMinute(config.minute);
      if (config.enabled) {
        setSchedulingStatus(`Scheduled daily at ${formatReminderTime(config.hour, config.minute)}`);
      }
    });
  }, [deviceId]);

  async function handleToggleDailyReminder(value: boolean) {
    setDailyReminder(value);
    setSchedulingStatus(null);
    setTestStatus(null);

    if (value) {
      setSchedulingStatus('Scheduling daily reminder…');
      const res = await scheduleDailyMorningReminder(reminderHour, reminderMinute);
      if (res.ok) {
        setSchedulingStatus(`Active: 5-minute morning reminder set for ${formatReminderTime(reminderHour, reminderMinute)}`);
      } else {
        setDailyReminder(false);
        setSchedulingStatus(res.error || 'Could not schedule reminder.');
      }
    } else {
      await cancelDailyMorningReminder();
      setSchedulingStatus('Daily reminder turned off.');
    }
  }

  async function handleSelectPreset(hour: number, minute: number) {
    setReminderHour(hour);
    setReminderMinute(minute);
    if (dailyReminder) {
      setSchedulingStatus(`Updating schedule to ${formatReminderTime(hour, minute)}…`);
      const res = await scheduleDailyMorningReminder(hour, minute);
      if (res.ok) {
        setSchedulingStatus(`Updated: 5-minute morning reminder set for ${formatReminderTime(hour, minute)}`);
      } else {
        setSchedulingStatus(res.error || 'Could not update reminder time.');
      }
    }
  }

  async function handleAdjustMinute(delta: number) {
    let totalMinutes = reminderHour * 60 + reminderMinute + delta;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    totalMinutes = totalMinutes % (24 * 60);

    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;

    await handleSelectPreset(newHour, newMinute);
  }

  async function handleTestLocalReminder() {
    setIsTesting(true);
    setTestStatus('Notification scheduled! Will appear in 3 seconds…');
    const res = await triggerTestMorningReminder(3);
    if (!res.ok) {
      setTestStatus(res.error || 'Failed to trigger test notification.');
    }
    setTimeout(() => {
      setIsTesting(false);
    }, 4000);
  }

  async function handleToggleCommunityPush(value: boolean) {
    setCommunityUpdates(value);
    if (!value) return;
    setPushStatus('requesting');
    setPushMessage(null);
    const result = await registerForPushNotifications(deviceId);
    if (result.ok) {
      setPushStatus('on');
    } else {
      setPushStatus('failed');
      setPushMessage(result.reason || 'Could not enable remote push.');
      setCommunityUpdates(false);
    }
  }

  async function handleSendRemoteTest() {
    setTestStatus('Sending remote push…');
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

      <Text style={styles.sectionTitle}>NOTIFICATIONS & REMINDERS</Text>
      <View style={styles.card}>
        {/* Daily 5-Minute Morning Reminder */}
        <View style={styles.row}>
          <View style={styles.reminderInfo}>
            <Text style={styles.rowLabel}>Daily 5-minute morning reminder</Text>
            <Text style={styles.rowSubLabel}>A quiet pause with Scripture to start your day</Text>
          </View>
          <Switch
            value={dailyReminder}
            onValueChange={handleToggleDailyReminder}
            trackColor={{ true: colors.teal, false: 'rgba(255,255,255,0.18)' }}
          />
        </View>

        {dailyReminder && (
          <View style={styles.timeConfigArea}>
            <View style={styles.timeDisplayRow}>
              <Text style={styles.timePrefix}>Preferred morning time:</Text>
              <Text style={styles.timeValue}>{formatReminderTime(reminderHour, reminderMinute)}</Text>
            </View>

            {/* Morning Presets */}
            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <View style={styles.presetsRow}>
              {MORNING_TIME_PRESETS.map(preset => {
                const isSelected = reminderHour === preset.hour && reminderMinute === preset.minute;
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => handleSelectPreset(preset.hour, preset.minute)}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  >
                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom adjustment steppers */}
            <View style={styles.adjustRow}>
              <Text style={styles.adjustLabel}>Fine Tune:</Text>
              <View style={styles.stepperGroup}>
                <Pressable onPress={() => handleAdjustMinute(-15)} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>-15m</Text>
                </Pressable>
                <Pressable onPress={() => handleAdjustMinute(-5)} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>-5m</Text>
                </Pressable>
                <Pressable onPress={() => handleAdjustMinute(5)} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>+5m</Text>
                </Pressable>
                <Pressable onPress={() => handleAdjustMinute(15)} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>+15m</Text>
                </Pressable>
              </View>
            </View>

            {/* Test Reminder Button */}
            <Pressable
              onPress={handleTestLocalReminder}
              disabled={isTesting}
              style={[styles.testBtn, isTesting && { opacity: 0.6 }]}
            >
              <Text style={styles.testBtnText}>
                {isTesting ? '⏳ Firing test notification…' : '🔔 Test 5-min reminder now (in 3s)'}
              </Text>
            </Pressable>
          </View>
        )}

        {schedulingStatus && (
          <Text style={[styles.statusText, dailyReminder && styles.statusTextActive]}>
            {schedulingStatus}
          </Text>
        )}

        <View style={styles.divider} />

        {/* Remote Community Updates */}
        <View style={styles.row}>
          <View style={styles.reminderInfo}>
            <Text style={styles.rowLabel}>Community updates</Text>
            <Text style={styles.rowSubLabel}>Encouragements and prayer notifications</Text>
          </View>
          <Switch
            value={communityUpdates}
            onValueChange={handleToggleCommunityPush}
            trackColor={{ true: colors.teal, false: 'rgba(255,255,255,0.18)' }}
          />
        </View>

        {pushStatus === 'requesting' && <Text style={styles.note}>Requesting device permission…</Text>}
        {pushStatus === 'failed' && pushMessage && <Text style={styles.pushError}>{pushMessage}</Text>}
        {pushStatus === 'on' && (
          <Pressable onPress={handleSendRemoteTest} style={styles.testBtnAlt}>
            <Text style={styles.testBtnTextAlt}>Send remote server test push</Text>
          </Pressable>
        )}
        {testStatus && <Text style={styles.statusText}>{testStatus}</Text>}

        <Text style={styles.note}>
          💡 Local reminders trigger directly from your device clock without internet. Remote push
          requires registered device tokens.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>LifeBook v0.1.0 (with Local Reminders)</Text>
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
  sectionTitle: { color: '#9C8FBB', fontSize: 11, letterSpacing: 1.2, marginBottom: 8, marginTop: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10 },
  tier: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 10 },
  upgradeRow: { gap: 8 },
  upgradeBtn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  upgradeBtnAlt: { backgroundColor: colors.purple },
  upgradeBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reminderInfo: { flex: 1, paddingRight: 12 },
  rowLabel: { color: colors.white, fontSize: 14, fontWeight: '600' },
  rowSubLabel: { color: '#8A7DAD', fontSize: 11, marginTop: 2 },
  timeConfigArea: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timePrefix: { color: '#C9BEE0', fontSize: 12.5 },
  timeValue: { color: colors.teal, fontSize: 16, fontWeight: '700' },
  presetLabel: { color: '#8A7DAD', fontSize: 11, marginBottom: 6 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  presetChipActive: {
    backgroundColor: colors.teal,
  },
  presetChipText: { color: '#D8CFEC', fontSize: 11.5, fontWeight: '500' },
  presetChipTextActive: { color: colors.bgDeep, fontWeight: '700' },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  adjustLabel: { color: '#8A7DAD', fontSize: 11 },
  stepperGroup: { flexDirection: 'row', gap: 6 },
  stepBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stepBtnText: { color: '#D8CFEC', fontSize: 11, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  statusText: { color: '#B6ABCF', fontSize: 11.5, marginTop: 6, lineHeight: 16 },
  statusTextActive: { color: '#5DE4DF', fontWeight: '500' },
  note: { color: '#8A7DAD', fontSize: 11, marginTop: 10, lineHeight: 15 },
  pushError: { color: '#F6B0C5', fontSize: 11.5, marginTop: 8, lineHeight: 15 },
  testBtn: {
    backgroundColor: 'rgba(31,182,176,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(31,182,176,0.3)',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 6,
  },
  testBtnText: { color: colors.teal, fontWeight: '700', fontSize: 12.5 },
  testBtnAlt: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  testBtnTextAlt: { color: '#C9BEE0', fontWeight: '600', fontSize: 12 },
  signOut: { color: '#F6B0C5', fontSize: 14, fontWeight: '600' },
});

