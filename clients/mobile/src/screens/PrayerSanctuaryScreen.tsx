import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import {
  createPrayerSanctuary,
  deletePrayerSanctuaryEntry,
  fetchPrayerSanctuaryHistory,
  PrayerSanctuaryResult,
} from '../api/client';
import { trackEvent } from '../analytics/telemetry';

interface Props {
  userId: string;
  onBack: () => void;
}

export function PrayerSanctuaryScreen({ userId, onBack }: Props) {
  const [prayerText, setPrayerText] = useState('');
  const [saveToHistory, setSaveToHistory] = useState(false);
  const [result, setResult] = useState<PrayerSanctuaryResult | null>(null);
  const [history, setHistory] = useState<PrayerSanctuaryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshHistory() {
    try {
      const response = await fetchPrayerSanctuaryHistory();
      setHistory(response.entries);
    } catch {
      setError('Private history could not be loaded. You can still continue without saving.');
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    trackEvent('prayer_sanctuary_started', {}, userId);
    let mounted = true;
    fetchPrayerSanctuaryHistory()
      .then(response => {
        if (mounted) setHistory(response.entries);
      })
      .catch(() => {
        if (mounted) setError('Private history could not be loaded. You can still continue without saving.');
      })
      .finally(() => {
        if (mounted) setHistoryLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function handleSubmit() {
    const cleanText = prayerText.trim();
    if (cleanText.length < 10) {
      setError('Write at least a sentence so we can find a helpful place to begin.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await createPrayerSanctuary(cleanText, saveToHistory);
      setResult(response);
      setPrayerText('');
      if (response.saved) await refreshHistory();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your prayer could not be processed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(recordId: string) {
    setDeletingId(recordId);
    setError(null);
    try {
      await deletePrayerSanctuaryEntry(recordId);
      setHistory(items => items.filter(item => item.id !== recordId));
      if (result?.id === recordId) setResult(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'This entry could not be deleted. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
        <Text style={styles.backText}>{'‹'} Practice</Text>
      </Pressable>

      <Text style={styles.eyebrow}>PRIVATE PRAYER</Text>
      <Text style={styles.title}>Bring what&apos;s on your heart.</Text>
      <Text style={styles.intro}>Write freely. We&apos;ll look for a theme, choose a passage from the approved Scripture collection, and shape a short reflection around it.</Text>

      {!result && (
        <View style={styles.composer}>
          <Text style={styles.privacyLabel}>YOUR WORDS STAY OUT OF THE AI PROMPT</Text>
          <Text style={styles.privacyCopy}>LifeBook processes your prayer to find a theme. The reflection request receives only the theme and selected Scripture, not your original words.</Text>
          <TextInput
            value={prayerText}
            onChangeText={setPrayerText}
            placeholder="What would you like to bring to God today?"
            placeholderTextColor="#A9A1B6"
            multiline
            maxLength={4000}
            textAlignVertical="top"
            style={styles.textInput}
            accessibilityLabel="Write a private prayer"
          />
          <Text style={styles.characterCount}>{prayerText.length}/4000</Text>
          <Pressable
            onPress={() => setSaveToHistory(value => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: saveToHistory }}
            style={styles.saveChoice}
          >
            <View style={[styles.checkbox, saveToHistory && styles.checkboxChecked]}>
              {saveToHistory && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.saveChoiceText}>
              <Text style={styles.saveChoiceTitle}>Save this prayer privately</Text>
              <Text style={styles.saveChoiceHint}>Only you can view or delete saved entries.</Text>
            </View>
          </Pressable>
          <Pressable onPress={handleSubmit} disabled={loading} style={[styles.submitButton, loading && styles.disabledButton]}>
            {loading ? <ActivityIndicator color="#102726" /> : <Text style={styles.submitText}>Find a Scripture to sit with</Text>}
          </Pressable>
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </View>
      )}

      {result?.safetyStatus === 'crisis_escalation' && (
        <View style={styles.crisisCard}>
          <Text style={styles.crisisTitle}>Please reach a person now.</Text>
          <Text style={styles.crisisCopy}>{result.supportMessage}</Text>
          {result.saved && <Text style={styles.savedNotice}>Saved to your private history. You can delete it below.</Text>}
        </View>
      )}

      {result?.passage && (
        <View style={styles.resultContent}>
          <View style={styles.passageCard}>
            <Text style={styles.resultEyebrow}>A PASSAGE TO BEGIN WITH</Text>
            <Text style={styles.passageText}>“{result.passage.text}”</Text>
            <Text style={styles.passageReference}>{result.passage.reference} · {result.passage.translation}</Text>
          </View>
          <View style={styles.reflectionSection}>
            <Text style={styles.resultEyebrow}>MEDITATION</Text>
            <Text style={styles.resultBody}>{result.meditation}</Text>
            <Text style={styles.resultEyebrow}>REFLECT</Text>
            <Text style={styles.reflectionPrompt}>{result.reflectionQuestion}</Text>
            <Text style={styles.resultEyebrow}>PRAY</Text>
            <Text style={styles.resultBody}>{result.guidedPrayer}</Text>
          </View>
          <Text style={styles.generationNote}>The Scripture is quoted from the approved corpus. The reflection and prayer are generated guidance, not Scripture.</Text>
          {result.saved ? (
            <Text style={styles.savedNotice}>Saved to your private history. You can delete it below.</Text>
          ) : (
            <Text style={styles.savedNotice}>This session was not saved to your history.</Text>
          )}
          <Pressable onPress={() => { setResult(null); setError(null); }} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Start another reflection</Text>
          </Pressable>
        </View>
      )}

      {result?.safetyStatus === 'distress_detected' && (
        <Text style={styles.supportNote}>You deserve support beyond an app. Consider reaching out to someone you trust or a qualified professional.</Text>
      )}

      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Private history</Text>
          <Text style={styles.historyCount}>{history.length}</Text>
        </View>
        {historyLoading ? <ActivityIndicator color={colors.teal} /> : history.length === 0 ? (
          <Text style={styles.emptyHistory}>Saved prayers will appear here.</Text>
        ) : history.map(entry => (
          <View key={entry.id} style={styles.historyItem}>
            <Text style={styles.historyDate}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
            <Text numberOfLines={3} style={styles.historyText}>{entry.text}</Text>
            {entry.passage?.reference && <Text style={styles.historyReference}>{entry.passage.reference}</Text>}
            <Pressable onPress={() => handleDelete(entry.id)} disabled={deletingId === entry.id} style={styles.deleteButton}>
              <Text style={styles.deleteText}>{deletingId === entry.id ? 'Deleting…' : 'Delete entry'}</Text>
            </Pressable>
          </View>
        ))}
        {error && result && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 44 },
  backButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 16 },
  backText: { color: '#9FE3D3', fontSize: 14, fontWeight: '700' },
  eyebrow: { color: colors.teal, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 16, marginBottom: 8 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800', lineHeight: 34, marginBottom: 8 },
  intro: { color: '#D0C8DD', fontSize: 14, lineHeight: 21, marginBottom: 20 },
  composer: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 22 },
  privacyLabel: { color: '#9FE3D3', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  privacyCopy: { color: '#BFB6CE', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  textInput: { minHeight: 145, color: colors.white, fontSize: 15, lineHeight: 22, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.12)' },
  characterCount: { color: '#8A7DAD', fontSize: 10, textAlign: 'right', marginTop: 6 },
  saveChoice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, minHeight: 44 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 1, borderColor: '#A9A1B6', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.teal, borderColor: colors.teal },
  checkmark: { color: '#102726', fontWeight: '900', fontSize: 14 },
  saveChoiceText: { flex: 1 },
  saveChoiceTitle: { color: colors.white, fontSize: 13, fontWeight: '700' },
  saveChoiceHint: { color: '#A9A1B6', fontSize: 11, marginTop: 2 },
  submitButton: { backgroundColor: colors.teal, borderRadius: 11, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 16 },
  disabledButton: { opacity: 0.65 },
  submitText: { color: '#102726', fontWeight: '800', fontSize: 14 },
  error: { color: '#FFC3C3', fontSize: 12, lineHeight: 18, marginTop: 12 },
  resultContent: { gap: 16, marginBottom: 26 },
  passageCard: { backgroundColor: '#F0EADD', borderRadius: 14, padding: 17 },
  resultEyebrow: { color: '#62567A', fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginBottom: 8, marginTop: 6 },
  passageText: { color: '#2B2540', fontSize: 18, lineHeight: 27, fontWeight: '600' },
  passageReference: { color: '#62567A', fontSize: 12, fontWeight: '700', marginTop: 12 },
  reflectionSection: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 17, gap: 8 },
  resultBody: { color: '#E2DCEC', fontSize: 14, lineHeight: 22, marginBottom: 10 },
  reflectionPrompt: { color: colors.white, fontSize: 16, lineHeight: 23, fontWeight: '700', marginBottom: 10 },
  generationNote: { color: '#9D93B0', fontSize: 11, lineHeight: 16 },
  savedNotice: { color: '#9FE3D3', fontSize: 12, lineHeight: 18, marginTop: 8 },
  crisisCard: { backgroundColor: '#3A2028', borderWidth: 1, borderColor: '#A86371', borderRadius: 14, padding: 18, marginBottom: 16 },
  crisisTitle: { color: '#FFE2E4', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  crisisCopy: { color: '#FFE2E4', fontSize: 14, lineHeight: 22 },
  supportNote: { color: '#F6D8A8', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  secondaryButton: { minHeight: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  historySection: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 18, gap: 12 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  historyCount: { color: '#AFA6C2', fontSize: 12, fontVariant: ['tabular-nums'] },
  emptyHistory: { color: '#AFA6C2', fontSize: 12 },
  historyItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: 13 },
  historyDate: { color: '#9FE3D3', fontSize: 10, fontWeight: '700', marginBottom: 5 },
  historyText: { color: '#E2DCEC', fontSize: 13, lineHeight: 19 },
  historyReference: { color: '#AFA6C2', fontSize: 11, marginTop: 7 },
  deleteButton: { minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center', paddingRight: 14, marginTop: 4 },
  deleteText: { color: '#F0A5AD', fontSize: 12, fontWeight: '700' },
});