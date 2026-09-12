import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { colors, MOODS } from '../theme/colors';
import {
  fetchStreak, fetchBadges, fetchMoodHistory, fetchJournal, addJournalEntry, fetchFavorites,
  StreakRecord, Badge, FavoriteVerse,
} from '../api/client';

const MOOD_COLOR: Record<string, string> = Object.fromEntries(MOODS.map(m => [m.id, m.color]));

const MOOD_LEVELS: Record<string, { value: number; label: string; emoji: string; color: string }> = {
  grateful: { value: 6, label: 'Grateful', emoji: '🙏', color: '#E3B15E' },
  peaceful: { value: 5, label: 'Peaceful', emoji: '🕊', color: '#37C6C2' },
  seeking: { value: 4, label: 'Seeking', emoji: '🔍', color: '#7B62B8' },
  convicted: { value: 3, label: 'Convicted', emoji: '🕯', color: '#B8746B' },
  doubting: { value: 2, label: 'Doubting', emoji: '🤔', color: '#6B8CAE' },
  distant: { value: 1, label: 'Distant', emoji: '🌫', color: '#5B5580' },
};

function CustomChartTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: '#241E3B',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#FFFFFF',
          fontSize: 12,
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: '#B6ABCF', fontSize: 11 }}>
          {data.dayLabel} ({data.date})
        </p>
        <p style={{ margin: '4px 0 0 0', color: data.color || '#1FB6B0', fontWeight: 700, fontSize: 13 }}>
          {data.emoji ? `${data.emoji} ` : ''}{data.moodLabel}
        </p>
      </div>
    );
  }
  return null;
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload || payload.moodScore == null || cx == null || cy == null) return null;
  return (
    <circle
      key={payload.date}
      cx={cx}
      cy={cy}
      r={4.5}
      fill={payload.color || colors.teal}
      stroke="#1E1B2E"
      strokeWidth={2}
    />
  );
}

const STREAK_MILESTONES = [
  { days: 3, title: 'First Spark', icon: '🌱' },
  { days: 7, title: '7-Day Rhythm', icon: '🌿' },
  { days: 14, title: '14-Day Walk', icon: '🔥' },
  { days: 30, title: '30-Day Pillar', icon: '🏛️' },
  { days: 60, title: '60-Day Deep Roots', icon: '🌳' },
  { days: 100, title: '100-Day Centered Heart', icon: '💎' },
  { days: 365, title: '365-Day Perpetual Flame', icon: '👑' },
];

export function ProgressScreen({ deviceId }: { deviceId: string }) {
  const [tab, setTab] = useState<'overview' | 'journal'>('overview');
  const [streak, setStreak] = useState<StreakRecord | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [history, setHistory] = useState<{ date: string; mood: string | null }[]>([]);
  const [entries, setEntries] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedHistoryDay = history.find(h => h.date === selectedDay) || (history.length > 0 ? history[history.length - 1] : null);

  function load() {
    setLoading(true);
    Promise.all([fetchStreak(deviceId), fetchBadges(deviceId), fetchMoodHistory(deviceId), fetchJournal(deviceId), fetchFavorites(deviceId)])
      .then(([s, b, h, j, f]) => {
        setStreak(s.streak);
        setBadges(b.badges);
        setHistory(h.history);
        setEntries(j.entries);
        setFavorites(f.favorites);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [deviceId]);

  async function handleAddEntry() {
    if (!newEntry.trim()) return;
    setSaving(true);
    try {
      await addJournalEntry(deviceId, newEntry.trim());
      setNewEntry('');
      load();
    } finally {
      setSaving(false);
    }
  }

  const chartData = history.map(h => {
    const info = h.mood ? MOOD_LEVELS[h.mood] : null;
    const d = new Date(h.date);
    const dayLabel = !isNaN(d.getTime())
      ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : h.date.slice(5);
    return {
      date: h.date,
      dayLabel,
      mood: h.mood,
      moodScore: info ? info.value : null,
      moodLabel: info ? info.label : 'No check-in',
      emoji: info ? info.emoji : '',
      color: info ? info.color : '#8A7DAD',
    };
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your progress</Text>

      <View style={styles.tabBar}>
        <Pressable onPress={() => setTab('overview')} style={[styles.tabBtn, tab === 'overview' && styles.tabBtnActive]}>
          <Text style={[styles.tabText, tab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </Pressable>
        <Pressable onPress={() => setTab('journal')} style={[styles.tabBtn, tab === 'journal' && styles.tabBtnActive]}>
          <Text style={[styles.tabText, tab === 'journal' && styles.tabTextActive]}>Journal</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 30 }} />
      ) : tab === 'overview' ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{streak?.current ?? 0}</Text>
              <Text style={styles.statLabel}>Current streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{streak?.longest ?? 0}</Text>
              <Text style={styles.statLabel}>Longest streak</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>MOOD TRENDS (PAST 30 DAYS)</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fill: '#8A7DAD', fontSize: 9 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    interval={4}
                  />
                  <YAxis
                    domain={[0.5, 6.5]}
                    ticks={[1, 2, 3, 4, 5, 6]}
                    tickFormatter={(val: number) => {
                      const icons: Record<number, string> = {
                        6: '🙏',
                        5: '🕊',
                        4: '🔍',
                        3: '🕯',
                        2: '🤔',
                        1: '🌫',
                      };
                      return icons[val] || '';
                    }}
                    tick={{ fill: '#B6ABCF', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="moodScore"
                    stroke={colors.teal}
                    strokeWidth={2.5}
                    dot={<CustomDot />}
                    activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2, fill: colors.teal }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </View>

            <View style={styles.legendRow}>
              {MOODS.map(m => (
                <View key={m.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                  <Text style={styles.legendText}>{m.emoji} {m.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>STREAK CALENDAR & INTENSITY</Text>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonth}>Daily Rhythm & Streaks</Text>
              <View style={styles.streakPill}>
                <Text style={styles.streakPillText}>🔥 {streak?.current ?? 0}d streak</Text>
              </View>
            </View>

            <View style={styles.calGrid}>
              {history.map((h, idx) => {
                const info = h.mood ? MOOD_LEVELS[h.mood] : null;
                const intensity = !h.mood ? 0 : info && info.value >= 5 ? 4 : info && info.value >= 4 ? 3 : info && info.value >= 3 ? 2 : 1;
                const isSelected = selectedDay === h.date;
                const isStreakDay = idx >= Math.max(0, history.length - (streak?.current || 0));

                let tileBg = 'rgba(255,255,255,0.06)';
                let tileBorder = 'rgba(255,255,255,0.1)';
                if (intensity === 1) {
                  tileBg = 'rgba(55, 198, 194, 0.25)';
                  tileBorder = 'rgba(55, 198, 194, 0.5)';
                } else if (intensity === 2) {
                  tileBg = 'rgba(55, 198, 194, 0.5)';
                  tileBorder = 'rgba(55, 198, 194, 0.8)';
                } else if (intensity === 3) {
                  tileBg = '#1FB6B0';
                  tileBorder = '#169B96';
                } else if (intensity === 4) {
                  tileBg = '#E3B15E';
                  tileBorder = '#F28C38';
                }

                return (
                  <Pressable
                    key={h.date}
                    onPress={() => setSelectedDay(h.date)}
                    style={[
                      styles.calCell,
                      { backgroundColor: tileBg, borderColor: tileBorder },
                      isSelected && styles.calCellSelected,
                    ]}
                  >
                    <Text style={[styles.calDayNum, intensity >= 3 && { color: '#17132B' }]}>
                      {h.date.slice(8)}
                    </Text>
                    {isStreakDay && intensity > 0 ? (
                      <Text style={styles.calFlame}>🔥</Text>
                    ) : info ? (
                      <Text style={styles.calEmoji}>{info.emoji}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Intensity Legend */}
            <View style={styles.legendBar}>
              <Text style={styles.legendLabel}>Less</Text>
              <View style={[styles.legendBox, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
              <View style={[styles.legendBox, { backgroundColor: 'rgba(55, 198, 194, 0.25)' }]} />
              <View style={[styles.legendBox, { backgroundColor: 'rgba(55, 198, 194, 0.5)' }]} />
              <View style={[styles.legendBox, { backgroundColor: '#1FB6B0' }]} />
              <View style={[styles.legendBox, { backgroundColor: '#E3B15E' }]} />
              <Text style={styles.legendLabel}>More (🔥)</Text>
            </View>

            {/* Selected day inspect */}
            {selectedHistoryDay && (
              <View style={styles.dayInspectBox}>
                <Text style={styles.inspectDate}>{selectedHistoryDay.date}</Text>
                <Text style={styles.inspectMood}>
                  {selectedHistoryDay.mood
                    ? `${MOOD_LEVELS[selectedHistoryDay.mood]?.emoji || ''} ${MOOD_LEVELS[selectedHistoryDay.mood]?.label || selectedHistoryDay.mood}`
                    : 'No check-in recorded on this day'}
                </Text>
              </View>
            )}
          </View>

          {/* CONSECUTIVE STREAK MILESTONES */}
          <Text style={styles.sectionTitle}>CONSECUTIVE STREAK MILESTONES</Text>
          <View style={styles.milestonesCard}>
            <View style={styles.milestonesHeader}>
              <View>
                <Text style={styles.milestonesTitle}>Streak Trophy Badges</Text>
                <Text style={styles.milestonesSubtitle}>Earn badges for 7, 30, and 100 consecutive days</Text>
              </View>
              <Text style={styles.milestonesCount}>
                {STREAK_MILESTONES.filter(m => (streak?.current || 0) >= m.days).length} of {STREAK_MILESTONES.length}
              </Text>
            </View>

            <View style={styles.milestonesGrid}>
              {STREAK_MILESTONES.map(m => {
                const current = streak?.current || 0;
                const isUnlocked = current >= m.days;
                const progress = Math.min(100, Math.round((current / m.days) * 100));

                return (
                  <View key={m.days} style={[styles.milestoneItem, isUnlocked && styles.milestoneItemUnlocked]}>
                    <View style={[styles.milestoneIconWrap, isUnlocked && styles.milestoneIconWrapUnlocked]}>
                      <Text style={styles.milestoneIcon}>{m.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.milestoneDays}>{m.days} Days Streak</Text>
                        <Text style={[styles.milestoneStatus, isUnlocked ? styles.milestoneStatusUnlocked : styles.milestoneStatusLocked]}>
                          {isUnlocked ? '✓ Unlocked' : `${Math.max(0, m.days - current)}d left`}
                        </Text>
                      </View>
                      <Text style={styles.milestoneItemTitle}>{m.title}</Text>
                      <View style={styles.milestoneProgressTrack}>
                        <View
                          style={[
                            styles.milestoneProgressBar,
                            {
                              width: `${progress}%`,
                              backgroundColor: isUnlocked ? '#1FB6B0' : '#E3B15E',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionTitle}>FAITH BADGES</Text>
          {badges.map(b => (
            <View key={b.id} style={[styles.badgeRow, !b.earned && styles.badgeRowUnearned]}>
              <View style={[styles.badgeDot, b.earned && styles.badgeDotEarned]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.badgeTitle, !b.earned && styles.badgeTitleUnearned]}>{b.title}</Text>
                <Text style={styles.badgeDesc}>{b.description}</Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <>
          <View style={styles.submitBox}>
            <TextInput
              placeholder="Write a quick journal entry…"
              placeholderTextColor="#8A7DAD"
              value={newEntry}
              onChangeText={setNewEntry}
              multiline
              style={styles.input}
            />
            <Pressable onPress={handleAddEntry} disabled={saving} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>{saving ? 'Saving…' : 'Save entry'}</Text>
            </Pressable>
          </View>

          {entries.map(e => (
            <View key={e.id} style={styles.card}>
              <Text style={styles.entryDate}>{new Date(e.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.cardBody}>{e.text}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>FAVORITE VERSES</Text>
          {favorites.length === 0 && (
            <Text style={styles.empty}>Tap the star on any devotional card to save a verse here.</Text>
          )}
          {favorites.map(f => (
            <View key={f.id} style={styles.card}>
              <Text style={styles.verseText}>"{f.verseText}"</Text>
              <Text style={styles.verseRef}>— {f.verseReference}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  tabBar: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  tabBtnActive: { backgroundColor: 'rgba(31,182,176,0.2)' },
  tabText: { color: '#B6ABCF', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.teal },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, alignItems: 'center' },
  statNumber: { color: colors.teal, fontSize: 30, fontWeight: '800' },
  statLabel: { color: '#B6ABCF', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#9C8FBB', fontSize: 11, letterSpacing: 1.2, marginBottom: 12, marginTop: 6 },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 20 },
  chartWrap: { width: '100%', height: 210 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#B6ABCF', fontSize: 10.5 },
  calendarCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calendarMonth: { color: colors.white, fontSize: 14, fontWeight: '700' },
  streakPill: { backgroundColor: 'rgba(242, 140, 56, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#F28C38' },
  streakPillText: { color: '#E3B15E', fontSize: 11, fontWeight: '700' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calCell: { width: '12%', aspectRatio: 1, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calCellSelected: { borderColor: '#FFFFFF', borderWidth: 2 },
  calDayNum: { color: '#EAE5F3', fontSize: 10, fontWeight: '600' },
  calFlame: { fontSize: 8 },
  calEmoji: { fontSize: 8 },
  legendBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  legendLabel: { color: '#8A7DAD', fontSize: 10 },
  legendBox: { width: 14, height: 14, borderRadius: 3 },
  dayInspectBox: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)' },
  inspectDate: { color: '#A89EC0', fontSize: 11, fontWeight: '600' },
  inspectMood: { color: colors.white, fontSize: 13, fontWeight: '700', marginTop: 2 },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 24 },
  heatCell: { width: 18, height: 18, borderRadius: 4 },
  milestonesCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 20 },
  milestonesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  milestonesTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  milestonesSubtitle: { color: '#8A7DAD', fontSize: 11, marginTop: 2 },
  milestonesCount: { color: '#E3B15E', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(227, 177, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  milestonesGrid: { gap: 10 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  milestoneItemUnlocked: { backgroundColor: 'rgba(31, 182, 176, 0.08)', borderColor: 'rgba(31, 182, 176, 0.3)' },
  milestoneIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  milestoneIconWrapUnlocked: { backgroundColor: 'rgba(227, 177, 94, 0.2)' },
  milestoneIcon: { fontSize: 20 },
  milestoneDays: { color: '#A89EC0', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' },
  milestoneStatus: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  milestoneStatusUnlocked: { color: '#1FB6B0', backgroundColor: 'rgba(31, 182, 176, 0.2)' },
  milestoneStatusLocked: { color: '#8A7DAD', backgroundColor: 'rgba(255,255,255,0.08)' },
  milestoneItemTitle: { color: colors.white, fontSize: 13, fontWeight: '700', marginTop: 1 },
  milestoneProgressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  milestoneProgressBar: { height: '100%', borderRadius: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 },
  badgeRowUnearned: { opacity: 0.5 },
  badgeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
  badgeDotEarned: { backgroundColor: '#E3B15E' },
  badgeTitle: { color: colors.white, fontWeight: '700', fontSize: 14 },
  badgeTitleUnearned: { color: '#B6ABCF' },
  badgeDesc: { color: '#8A7DAD', fontSize: 11.5, marginTop: 2 },
  submitBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 16 },
  input: { color: colors.white, fontSize: 13.5, minHeight: 60, textAlignVertical: 'top' },
  submitBtn: { alignSelf: 'flex-end', backgroundColor: colors.teal, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginTop: 8 },
  submitBtnText: { color: colors.bgDeep, fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 },
  entryDate: { color: '#8A7DAD', fontSize: 11, marginBottom: 6 },
  cardBody: { color: '#D8CFEC', fontSize: 13.5, lineHeight: 19 },
  verseText: { color: colors.white, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  verseRef: { color: '#B6ABCF', fontSize: 12, fontWeight: '600', marginTop: 6 },
  empty: { color: '#8A7DAD', fontSize: 12.5, marginBottom: 10 },
});
