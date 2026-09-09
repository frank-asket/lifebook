import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, MOODS } from '../theme/colors';
import {
  fetchStreak, fetchBadges, fetchMoodHistory, fetchJournal, addJournalEntry, fetchFavorites,
  StreakRecord, Badge, FavoriteVerse,
} from '../api/client';

const MOOD_COLOR: Record<string, string> = Object.fromEntries(MOODS.map(m => [m.id, m.color]));

export function ProgressScreen({ deviceId }: { deviceId: string }) {
  const [tab, setTab] = useState<'overview' | 'journal'>('overview');
  const [streak, setStreak] = useState<StreakRecord | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [history, setHistory] = useState<{ date: string; mood: string | null }[]>([]);
  const [entries, setEntries] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

          <Text style={styles.sectionTitle}>MOOD HISTORY (30 DAYS)</Text>
          <View style={styles.heatmap}>
            {history.map(h => (
              <View
                key={h.date}
                style={[styles.heatCell, { backgroundColor: h.mood ? MOOD_COLOR[h.mood] : 'rgba(255,255,255,0.06)' }]}
              />
            ))}
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
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 24 },
  heatCell: { width: 18, height: 18, borderRadius: 4 },
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
