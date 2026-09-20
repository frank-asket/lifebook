import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  verseText: string;
  verseReference: string;
  onDone: () => void;
  totalSeconds?: number;
}

const SEGMENTS = ['Calm', 'Reflect', 'Act'] as const;

export function MeditationScreen({ verseText, verseReference, onDone, totalSeconds = 120 }: Props) {
  const segmentSeconds = Math.max(10, Math.round(totalSeconds / SEGMENTS.length));
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(segmentSeconds);
  const breath = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const breathe = () => {
      Animated.sequence([
        Animated.timing(breath, { toValue: 1.35, duration: 4000, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ]).start(breathe);
    };
    breathe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setSegmentIndex(i => Math.min(i + 1, SEGMENTS.length - 1));
          return segmentSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [segmentSeconds]);

  const isLast = segmentIndex === SEGMENTS.length - 1;

  return (
    <View style={styles.screen}>
      <Text style={styles.segmentLabel}>{SEGMENTS[segmentIndex]}</Text>

      <Animated.View style={[styles.circle, { transform: [{ scale: breath }] }]}>
        <Text style={styles.circleText}>Breathe</Text>
      </Animated.View>

      <Text style={styles.verse}>"{verseText}"</Text>
      <Text style={styles.reference}>— {verseReference}</Text>

      <View style={styles.dotsRow}>
        {SEGMENTS.map((s, i) => (
          <View key={s} style={[styles.dot, i <= segmentIndex && styles.dotActive]} />
        ))}
      </View>

      <Pressable onPress={onDone} style={styles.doneBtn}>
        <Text style={styles.doneBtnText}>{isLast ? 'Finish session' : 'End early'}</Text>
      </Pressable>

      <Text style={styles.note}>
        This uses a breathing animation only — no audio yet. Real guided-voice recordings need to be
        produced and hosted before this becomes a full audio meditation player (see TRD, "Audio & media").
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center', padding: 24 },
  segmentLabel: { color: colors.teal, fontSize: 13, letterSpacing: 2, fontWeight: '700', marginBottom: 30, textTransform: 'uppercase' },
  circle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(31,182,176,0.14)',
    borderWidth: 2, borderColor: 'rgba(31,182,176,0.4)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  circleText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  verse: { color: colors.white, fontSize: 16, fontStyle: 'italic', textAlign: 'center', lineHeight: 23, paddingHorizontal: 10 },
  reference: { color: '#C9BEE0', fontSize: 12.5, fontWeight: '600', marginTop: 8, marginBottom: 30 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: colors.teal },
  doneBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  doneBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  note: { color: '#6A6180', fontSize: 10.5, textAlign: 'center', marginTop: 30, lineHeight: 14, paddingHorizontal: 10 },
});
