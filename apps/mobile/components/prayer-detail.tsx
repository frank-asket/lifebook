import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Text, TextInput } from 'react-native';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { PRAYER_LIMITS, type Prayer } from '../../web/lib/prayer-api';
import { errorMessage } from '../../web/lib/errors';
import { GuidedPrayer } from './guided-prayer';
import { Button, Card, ErrorLine, Screen } from './ui';

export function PrayerDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { c, t, lang, reduceMotion } = useApp();
  const session = useSession();
  const [entry, setEntry] = useState<Prayer | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [guidanceBusy, setGuidanceBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const path = `/prayers/${encodeURIComponent(id)}`;
  const edited = !!entry && (title !== (entry.title ?? '') || body !== entry.body);
  const dirty = edited || (!!entry && note !== (entry.answerNote ?? ''));

  useEffect(() => {
    const controller = new AbortController();
    setError(''); setEntry(null);
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const value = await api<Prayer>(path, token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setEntry(value); setTitle(value.title ?? ''); setBody(value.body); setNote(value.answerNote ?? '');
      } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [path, session.getToken, attempt]);

  const close = () => {
    if (busy || guidanceBusy) return;
    if (!dirty) { onClose(); return; }
    Alert.alert(t.prayer.discardTitle, t.prayer.discardMessage, [
      { text: t.prayer.keepEditing, style: 'cancel' },
      { text: t.prayer.discard, style: 'destructive', onPress: onClose },
    ]);
  };

  async function change(action: 'save' | 'answer' | 'unanswer' | 'delete') {
    if (busy || guidanceBusy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      if (action === 'delete') {
        await api(path, token, { method: 'DELETE' });
        if (mounted.current) { onChanged(); onClose(); }
        return;
      }
      const updated = await api<Prayer>(action === 'save' ? path : `${path}/answer`, token, {
        method: 'PUT', body: JSON.stringify(action === 'save' ? { title, body } : action === 'answer' ? { answered: true, note } : { answered: false }),
      });
      if (!mounted.current) return;
      setEntry(updated);
      if (action === 'save') { setTitle(updated.title ?? ''); setBody(updated.body); }
      else setNote(updated.answerNote ?? '');
      setMessage(t.prayer.updated); onChanged();
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { if (mounted.current) setBusy(false); }
  }

  const input = { color: c.ink, backgroundColor: c.bg, borderColor: c.line, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 17 };
  return <Modal visible animationType={reduceMotion ? 'fade' : 'slide'} presentationStyle="fullScreen" onRequestClose={close}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen keyboardInsets={false} title={t.prayer.detail}>
        <Button kind="quiet" title={t.prayer.close} onPress={close} disabled={busy || guidanceBusy} />
        {!entry ? error ? <ErrorLine message={error} onRetry={() => setAttempt(n => n + 1)} /> : <ActivityIndicator accessibilityLabel={t.prayer.detail} color={c.accent} /> : <>
          <Card style={{ gap: 12 }}>
            <Text style={{ color: c.deep, fontWeight: '600' }}>{t.prayer.lock}</Text>
            <Text style={{ color: c.ink, fontWeight: '600' }}>{t.prayer.titleLabel}</Text>
            <TextInput accessibilityLabel={t.prayer.titleLabel} value={title} onChangeText={setTitle} editable={!busy && !guidanceBusy} maxLength={PRAYER_LIMITS.title} style={input} />
            <Text style={{ color: c.ink, fontWeight: '600' }}>{t.prayer.bodyLabel}</Text>
            <TextInput accessibilityLabel={t.prayer.bodyLabel} value={body} onChangeText={setBody} editable={!busy && !guidanceBusy} maxLength={PRAYER_LIMITS.body} multiline style={[input, { minHeight: 180, lineHeight: 26, textAlignVertical: 'top' }]} />
            <Button title={busy ? t.prayer.saving : t.prayer.saveChanges} disabled={busy || guidanceBusy || !edited || !body.trim()} onPress={() => void change('save')} />
          </Card>
          <Card style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 18, fontWeight: '700' }}>{t.prayer.answered}</Text>
            <TextInput accessibilityLabel={t.prayer.answerNote} placeholder={t.prayer.answerNote} placeholderTextColor={c.muted} value={note} onChangeText={setNote} editable={!busy && !guidanceBusy} multiline maxLength={PRAYER_LIMITS.answerNote} style={[input, { minHeight: 90, textAlignVertical: 'top' }]} />
            <Button kind="soft" title={entry.answeredAt ? t.prayer.saveAnswer : t.prayer.markAnswered} disabled={busy || guidanceBusy || edited || (!!entry.answeredAt && note === (entry.answerNote ?? ''))} onPress={() => void change('answer')} />
            {entry.answeredAt ? <Button kind="quiet" title={t.prayer.markUnanswered} disabled={busy || guidanceBusy || edited} onPress={() => void change('unanswer')} /> : null}
          </Card>
          <GuidedPrayer id={id} existing={entry.meditation} disabled={busy || dirty} onBusyChange={setGuidanceBusy} onChange={() => { setAttempt(n => n + 1); onChanged(); }} />
          {message ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{message}</Text> : null}
          {error ? <ErrorLine message={error} /> : null}
          <Button kind="danger" title={t.prayer.delete} disabled={busy || guidanceBusy} onPress={() => Alert.alert(t.prayer.deleteTitle, t.prayer.deleteMessage, [
            { text: t.prayer.cancel, style: 'cancel' }, { text: t.prayer.delete, style: 'destructive', onPress: () => void change('delete') },
          ])} />
        </>}
      </Screen>
    </KeyboardAvoidingView>
  </Modal>;
}
