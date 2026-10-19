import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Switch, Text, TextInput, View } from 'react-native';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { HIGHLIGHTS, validVerseRange, type Annotation } from '../lib/annotations';
import { errorMessage } from '../../web/lib/errors';
import { passageLabel } from '../../web/lib/scripture';
import { Button, Card, ErrorLine, Screen, Segmented } from './ui';

export function AnnotationEditor({ chapterId, locale, verse, onClose, onChanged }: { chapterId: string; locale: 'en' | 'fr'; verse: string; onClose: () => void; onChanged: () => void }) {
  const { c, lang, t, reduceMotion } = useApp();
  const session = useSession();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const passageId = `${chapterId}.${verse}`;
  const [current, setCurrent] = useState<Annotation | null>(null);
  const [ready, setReady] = useState(false);
  const [bookmark, setBookmark] = useState(false);
  const [highlight, setHighlight] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const dirty = ready && (bookmark !== (current?.bookmarked ?? false) || highlight !== (current?.highlight ?? '') || note !== (current?.note ?? ''));
  useEffect(() => {
    const controller = new AbortController();
    setReady(false); setError('');
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const { annotation: item } = await api<{ annotation: Annotation | null }>(`/bible-annotations/passage?locale=${locale}&passageId=${encodeURIComponent(passageId)}`, token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setCurrent(item); setBookmark(item?.bookmarked ?? false); setHighlight(item?.highlight ?? ''); setNote(item?.note ?? ''); setReady(true);
      } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [passageId, locale, chapterId, session.getToken, retry]);
  const close = () => {
    if (busy) return;
    if (!dirty) { onClose(); return; }
    Alert.alert(t.prayer.discardTitle, t.prayer.discardMessage, [{ text: t.prayer.keepEditing, style: 'cancel' }, { text: t.prayer.discard, style: 'destructive', onPress: onClose }]);
  };
  async function save(remove = false) {
    if (!ready || busy) return;
    if (!validVerseRange(verse)) { setError(tr('Choose a verse or range from 1 to 200, up to 51 verses.', 'Choisissez un verset ou une plage de 1 à 200, jusqu’à 51 versets.')); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      if (remove && current) {
        await api(`/bible-annotations/${encodeURIComponent(current.id)}`, token, { method: 'DELETE' });
        if (!mounted.current) return;
        setCurrent(null); setBookmark(false); setHighlight(''); setNote('');
      } else {
        const value = await api<Annotation>('/bible-annotations', token, { method: 'PUT', body: JSON.stringify({ passageId, locale, bookmark, highlight: highlight || null, note: note || null }) });
        if (!mounted.current) return;
        setCurrent(value); setBookmark(value.bookmarked); setHighlight(value.highlight ?? ''); setNote(value.note ?? '');
      }
      setMessage(tr('Saved privately.', 'Enregistré en privé.')); onChanged();
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { if (mounted.current) setBusy(false); }
  }
  const names = lang === 'fr' ? ['Jaune', 'Vert', 'Bleu', 'Rose'] : ['Yellow', 'Green', 'Blue', 'Pink'];
  return <Modal visible animationType={reduceMotion ? 'fade' : 'slide'} presentationStyle="fullScreen" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen keyboardInsets={false} title={tr('Your saved verse', 'Votre verset enregistré')}>
        <Button kind="quiet" title={tr('Close', 'Fermer')} disabled={busy} onPress={close} />
        <Text accessibilityRole="header" style={{ color: c.deep, fontSize: 21, fontWeight: '700' }}>{passageLabel(passageId, locale)} · {locale.toUpperCase()}</Text>
        {!ready ? error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : <ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} /> : <Card style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Text style={{ flex: 1, color: c.ink, fontSize: 17 }}>{tr('Bookmark this passage', 'Marquer ce passage')}</Text><Switch accessibilityLabel={tr('Bookmark', 'Marque-page')} disabled={busy} value={bookmark} onValueChange={setBookmark} /></View>
          <Text style={{ color: c.ink, fontWeight: '600' }}>{tr('Highlight', 'Surlignage')}</Text>
          <Segmented label={tr('Highlight colour', 'Couleur de surlignage')} value={highlight} onChange={setHighlight} disabled={busy} options={HIGHLIGHTS.map((value, i) => ({ value, label: names[i] }))} />
          {highlight ? <Button kind="quiet" title={tr('Remove highlight', 'Retirer le surlignage')} disabled={busy} onPress={() => setHighlight('')} /> : null}
          <Text style={{ color: c.ink, fontWeight: '600' }}>{tr('Private note', 'Note privée')}</Text>
          <TextInput accessibilityLabel={tr('Private note', 'Note privée')} multiline maxLength={4000} editable={!busy} value={note} onChangeText={setNote} placeholder={tr('What stands out in this verse?', 'Que retenez-vous de ce verset ?')} placeholderTextColor={c.muted} style={{ minHeight: 170, borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, color: c.ink, backgroundColor: c.bg, fontSize: 17, lineHeight: 26, textAlignVertical: 'top' }} />
          <Text style={{ color: c.muted, lineHeight: 21 }}>{tr('Notes are encrypted in your account. Changing the Bible language keeps that translation’s notes separate.', 'Les notes sont chiffrées dans votre compte. Chaque traduction conserve ses propres notes.')}</Text>
          <Button title={busy ? t.prayer.saving : tr('Save verse', 'Enregistrer le verset')} disabled={busy || !dirty} onPress={() => void save()} />
          {message ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{message}</Text> : null}
          {error ? <ErrorLine message={error} /> : null}
          {current ? <Button kind="danger" title={tr('Delete saved verse', 'Supprimer le verset enregistré')} disabled={busy} onPress={() => Alert.alert(tr('Delete this saved verse?', 'Supprimer ce verset enregistré ?'), tr('This removes its bookmark, highlight and private note. Scripture is unchanged.', 'Cela retire le marque-page, le surlignage et la note privée. Les Écritures restent intactes.'), [{ text: t.prayer.cancel, style: 'cancel' }, { text: tr('Delete', 'Supprimer'), style: 'destructive', onPress: () => void save(true) }])} /> : null}
        </Card>}
      </Screen>
    </KeyboardAvoidingView>
  </Modal>;
}
