import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fetchActiveJourney, fetchJourneys, startJourney, fetchRecommendedJourney, ActiveJourney, Journey, JourneyRecommendation } from '../api/client';

interface Props {
  deviceId: string;
  onContinue: (active: ActiveJourney) => void;
  refreshKey: number; // bump this after completing a day to force a re-fetch
}

export function JourneySection({ deviceId, onContinue, refreshKey }: Props) {
  const [active, setActive] = useState<ActiveJourney | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [recommendation, setRecommendation] = useState<JourneyRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchActiveJourney(deviceId), fetchJourneys(), fetchRecommendedJourney(deviceId)])
      .then(([a, j, r]) => { setActive(a.active); setJourneys(j.journeys); setRecommendation(r.recommendation); })
      .finally(() => setLoading(false));
  }, [deviceId, refreshKey]);

  async function handleStart(journeyId: string) {
    setStarting(journeyId);
    try {
      await startJourney(deviceId, journeyId);
      const a = await fetchActiveJourney(deviceId);
      setActive(a.active);
    } finally {
      setStarting(null);
    }
  }

  if (loading) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.eyebrow}>{active ? 'CONTINUE YOUR JOURNEY' : 'START A NEW JOURNEY'}</Text>

      {active ? (
        <Pressable onPress={() => onContinue(active)} style={styles.card}>
          <Text style={styles.title}>{active.journey.title}</Text>
          <Text style={styles.dayLabel}>Day {active.progress.currentDay} of {active.journey.totalDays}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(active.progress.completedDays.length / active.journey.totalDays) * 100}%` }]} />
          </View>
          <Text style={styles.continueLink}>Continue →</Text>
        </Pressable>
      ) : (
        [...journeys]
          .sort((a, b) => (a.id === recommendation?.journey.id ? -1 : b.id === recommendation?.journey.id ? 1 : 0))
          .map(j => {
            const isRecommended = recommendation?.journey.id === j.id;
            return (
              <View key={j.id} style={[styles.browseCard, isRecommended && styles.browseCardRecommended]}>
                {isRecommended && (
                  <Text style={styles.recommendedBadge}>
                    {recommendation!.personalized ? '\u2728 RECOMMENDED FOR YOU' : '\u2728 SUGGESTED'} \u00b7 {recommendation!.reason}
                  </Text>
                )}
                <Text style={styles.title}>{j.title}</Text>
                <Text style={styles.desc}>{j.description}</Text>
                <Pressable onPress={() => handleStart(j.id)} disabled={starting === j.id} style={styles.startBtn}>
                  <Text style={styles.startBtnText}>{starting === j.id ? 'Starting…' : `Start · ${j.totalDays} days`}</Text>
                </Pressable>
              </View>
            );
          })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: '#9C8FBB', fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 12 },
  title: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  dayLabel: { color: '#B6ABCF', fontSize: 12, marginBottom: 10 },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  fill: { height: 6, backgroundColor: colors.teal },
  continueLink: { color: colors.teal, fontSize: 13, fontWeight: '700' },
  browseCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10 },
  browseCardRecommended: { borderWidth: 1, borderColor: 'rgba(227,177,94,0.4)', backgroundColor: 'rgba(227,177,94,0.08)' },
  recommendedBadge: { color: '#E3B15E', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  desc: { color: '#B6ABCF', fontSize: 12.5, lineHeight: 17, marginBottom: 10 },
  startBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(31,182,176,0.16)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  startBtnText: { color: colors.teal, fontWeight: '600', fontSize: 12 },
});
