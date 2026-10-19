import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useApp } from '../lib/app';
import { api } from '../lib/api';
import { Button, Card, ErrorLine, Row, Screen } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';
import type { Teaching, TeachingPage } from '../../web/lib/livingword';

export default function LivingWord() {
  const { c, lang } = useApp(); const router = useRouter(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [query, setQuery] = useState(''); const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState<TeachingPage | null>(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { setPage(1); }, [lang]);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController(); setData(null); setError('');
    api<TeachingPage>(`/livingword?locale=${lang}&q=${encodeURIComponent(search)}&page=${page}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setData(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    return () => controller.abort();
  }, [lang, search, page, retry]));
  if (id) return <TeachingDetail key={id} id={id} onBack={() => setId(null)} />;
  return <Screen title="LivingWord"><Button kind="quiet" title={tr('Back to You', 'Retour à Vous')} onPress={() => router.navigate('/you')} />
    <Text style={{ color: c.muted, fontSize: 16, lineHeight: 25 }}>{tr('Approved teachings in your language. Nothing plays automatically.', 'Des enseignements approuvés dans votre langue. Rien ne se lance automatiquement.')}</Text>
    <TextInput accessibilityLabel={tr('Search teachings', 'Rechercher des enseignements')} value={query} onChangeText={setQuery} maxLength={80} returnKeyType="search" onSubmitEditing={() => { setSearch(query.trim()); setPage(1); }} style={{ minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, color: c.ink, backgroundColor: c.paper, fontSize: 17 }} />
    <Button kind="soft" title={tr('Search', 'Rechercher')} onPress={() => { setSearch(query.trim()); setPage(1); }} />
    {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : !data ? <ActivityIndicator accessibilityLabel={tr('Loading teachings', 'Chargement des enseignements')} color={c.accent} /> : <>
      {!data.items.length ? <Card><Text style={{ color: c.muted }}>{search ? tr('No results. Try another search.', 'Aucun résultat. Essayez une autre recherche.') : tr('Approved, licensed teachings will appear when ready.', 'Les enseignements approuvés et autorisés apparaîtront lorsqu’ils seront prêts.')}</Text></Card> : data.items.map(item => <Row key={item.id} icon={item.kind === 'audio' ? 'headset-outline' : 'videocam-outline'} title={item.title} subtitle={`${item.speaker} · ${item.locale.toUpperCase()}`} onPress={() => setId(item.id)} />)}
      <Text accessibilityLiveRegion="polite" style={{ color: c.muted }}>{tr('Page', 'Page')} {page} · {data.total} {tr('teachings', 'enseignements')}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}><Button kind="quiet" title={tr('Previous', 'Précédent')} disabled={page === 1} onPress={() => setPage(n => n - 1)} style={{ flex: 1 }} /><Button kind="quiet" title={tr('Next', 'Suivant')} disabled={page * data.pageSize >= data.total} onPress={() => setPage(n => n + 1)} style={{ flex: 1 }} /></View>
    </>}
  </Screen>;
}
function TeachingDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { c, lang } = useApp(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [item, setItem] = useState<Teaching | null>(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController(); setItem(null); setError('');
    api<Teaching>(`/livingword/${encodeURIComponent(id)}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setItem(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    return () => controller.abort();
  }, [id, retry, lang]));
  return <Screen title={item?.title ?? 'LivingWord'}><Button kind="quiet" title={tr('All teachings', 'Tous les enseignements')} onPress={onBack} />
    {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : !item ? <ActivityIndicator accessibilityLabel={tr('Loading teaching', 'Chargement de l’enseignement')} color={c.accent} /> : <>
      <Text style={{ color: c.deep }}>{item.speaker} · {item.locale.toUpperCase()}</Text><Text style={{ color: c.ink, fontSize: 16, lineHeight: 25 }}>{item.description}</Text>
      {item.kind === 'audio' ? <AudioTeaching key={retry} item={item} onRetry={() => setRetry(n => n + 1)} /> : <VideoTeaching key={retry} item={item} onRetry={() => setRetry(n => n + 1)} />}
      <Text style={{ color: c.muted }}>{item.attribution}</Text><Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{tr('Transcript', 'Transcription')}</Text><Text style={{ color: c.ink, fontSize: 17, lineHeight: 28 }}>{item.transcript}</Text>
    </>}
  </Screen>;
}
function AudioTeaching({ item, onRetry }: { item: Teaching; onRetry: () => void }) {
  const { c, lang } = useApp(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const player = useAudioPlayer(item.mediaUrl); const status = useAudioPlayerStatus(player); const [error, setError] = useState('');
  useFocusEffect(useCallback(() => () => { player.pause(); }, [player]));
  const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  async function seek(by: number) { try { await player.seekTo(Math.max(0, Math.min(status.duration, status.currentTime + by))); } catch { setError(tr('Playback failed. Please try again.', 'La lecture a échoué. Réessayez.')); } }
  return <Card style={{ gap: 14 }}>
    {status.error || error ? <ErrorLine message={tr('Playback failed. Check your connection and try again.', 'La lecture a échoué. Vérifiez votre connexion et réessayez.')} onRetry={onRetry} /> : <>
      {!status.isLoaded || status.isBuffering ? <ActivityIndicator accessibilityLabel={tr('Loading audio', 'Chargement de l’audio')} color={c.accent} /> : null}
      <Text accessibilityLabel={tr('Playback time', 'Temps de lecture')} style={{ color: c.muted, fontVariant: ['tabular-nums'] }}>{time(status.currentTime)} / {time(status.duration)}</Text>
      <Button title={status.playing ? tr('Pause audio', 'Mettre l’audio en pause') : tr('Play audio', 'Lire l’audio')} disabled={!status.isLoaded} onPress={() => { try { if (status.playing) player.pause(); else player.play(); } catch { setError(tr('Playback failed. Please try again.', 'La lecture a échoué. Réessayez.')); } }} />
      <Button kind="quiet" title={tr('Back 15 seconds', 'Reculer de 15 secondes')} disabled={!status.isLoaded} onPress={() => void seek(-15)} /><Button kind="quiet" title={tr('Forward 15 seconds', 'Avancer de 15 secondes')} disabled={!status.isLoaded} onPress={() => void seek(15)} />
    </>}
  </Card>;
}
function VideoTeaching({ item, onRetry }: { item: Teaching; onRetry: () => void }) {
  const { c, lang } = useApp(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const player = useVideoPlayer(item.mediaUrl); const { status } = useEvent(player, 'statusChange', { status: player.status });
  useFocusEffect(useCallback(() => () => { player.pause(); }, [player]));
  return <View style={{ gap: 12 }}>{status === 'error' ? <ErrorLine message={tr('Video playback failed. Please try again.', 'La lecture vidéo a échoué. Réessayez.')} onRetry={onRetry} /> : <>
    <VideoView player={player} nativeControls accessibilityLabel={item.title} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }} />
    {status === 'loading' ? <ActivityIndicator accessibilityLabel={tr('Loading video', 'Chargement de la vidéo')} color={c.accent} /> : null}
  </>}</View>;
}
