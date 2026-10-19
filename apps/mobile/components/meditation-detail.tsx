import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Text, TextInput } from 'react-native';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { errorMessage } from '../../web/lib/errors';
import { Button, Card, ErrorLine, Screen, SectionLabel } from './ui';

export type Meditation = {
  id: string; title: string; locale: string; scriptureReference: string; scriptureText: string | null;
  translation: string | null; explanation: string; questions: string[]; guidedPrayer: string;
};
type PersonalState = { reflection: string; bookmarked: boolean; completedAt: string | null };

export function MeditationDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { c, lang, t } = useApp();
  const session = useSession();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [item, setItem] = useState<Meditation | null>(null);
  const [personal, setPersonal] = useState<PersonalState | null>(null);
  const [draft, setDraft] = useState('');
  const [loadError, setLoadError] = useState('');
  const [stateError, setStateError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setItem(null); setPersonal(null); setLoadError(''); setStateError('');
    (async () => {
      try {
        const value = await api<Meditation>(`/meditations/${encodeURIComponent(id)}`, undefined, { signal: controller.signal });
        if (!controller.signal.aborted) setItem(value);
      } catch (e) { if (!controller.signal.aborted) setLoadError(errorMessage(e, lang)); }
    })();
    if (session.isSignedIn) (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const value = await api<PersonalState>(`/meditations/${encodeURIComponent(id)}/state`, token, { signal: controller.signal });
        if (!controller.signal.aborted) { setPersonal(value); setDraft(value.reflection); }
      } catch (e) { if (!controller.signal.aborted) setStateError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [id, session.isSignedIn, session.getToken, retry]);
  const dirty = personal !== null && draft.trim() !== personal.reflection.trim();
  const close = () => {
    if (saving.current) return;
    if (!dirty) { onClose(); return; }
    Alert.alert(t.prayer.discardTitle, t.prayer.discardMessage, [{ text: t.prayer.keepEditing, style: 'cancel' }, { text: t.prayer.discard, style: 'destructive', onPress: onClose }]);
  };
  async function save(action: 'reflection' | 'bookmark' | 'complete') {
    if (!personal || !item || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      const path = `/meditations/${encodeURIComponent(id)}`;
      if (action === 'reflection') {
        const text = draft.trim();
        if (!text) throw new Error(tr('Write a reflection before saving. Clearing an existing reflection is not supported here yet.', 'Écrivez une réflexion avant d’enregistrer. La suppression d’une réflexion existante n’est pas encore disponible ici.'));
        await api(`${path}/reflection`, token, { method: 'PUT', body: JSON.stringify({ text }) });
        if (mounted.current) { setPersonal(value => value && { ...value, reflection: text }); setDraft(text); }
      } else if (action === 'bookmark') {
        const result = await api<{ bookmarked: boolean }>(`${path}/bookmark`, token, { method: 'PUT', body: JSON.stringify({ saved: !personal.bookmarked }) });
        if (mounted.current) setPersonal(value => value && { ...value, bookmarked: result.bookmarked });
      } else {
        const result = await api<{ completedAt: string }>(`${path}/complete`, token, { method: 'POST' });
        if (mounted.current) setPersonal(value => value && { ...value, completedAt: result.completedAt });
      }
      if (mounted.current) { setMessage(tr('Saved to your account.', 'Enregistré dans votre compte.')); onChanged(); }
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen title={tr('A quiet moment', 'Un moment de calme')}>
        <Button kind="quiet" title={tr('Close', 'Fermer')} onPress={close} disabled={busy} />
        {loadError ? <ErrorLine message={loadError} onRetry={() => setRetry(n => n + 1)} /> : !item ? <ActivityIndicator color={c.accent} /> : <>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 27, lineHeight: 35, fontWeight: '700' }}>{item.title}</Text>
          <Text style={{ color: c.deep }}>{item.locale === 'fr' ? 'Français' : 'English'} · {item.scriptureReference}</Text>
          {item.scriptureText ? <Card style={{ gap: 12 }}><Text style={{ color: c.ink, fontSize: 20, lineHeight: 31 }}>{item.scriptureText}</Text>{item.translation ? <Text style={{ color: c.muted }}>{item.translation}</Text> : null}</Card> : null}
          <Text style={{ color: c.ink, fontSize: 17, lineHeight: 28 }}>{item.explanation}</Text>
          <SectionLabel>{tr('Reflect', 'Réfléchir')}</SectionLabel>
          {Array.isArray(item.questions) ? item.questions.filter(question => typeof question === 'string').map((question, i) => <Text key={i} style={{ color: c.ink, fontSize: 17, lineHeight: 27 }}>{question}</Text>) : null}
          <Card><Text style={{ color: c.ink, fontSize: 17, lineHeight: 28 }}>{item.guidedPrayer}</Text></Card>
          {!session.isSignedIn ? <Text style={{ color: c.muted }}>{tr('Sign in from You to save a private reflection and track completion.', 'Connectez-vous depuis Vous pour enregistrer une réflexion privée et suivre votre progression.')}</Text>
            : stateError ? <ErrorLine message={stateError} onRetry={() => setRetry(n => n + 1)} />
            : !personal ? <ActivityIndicator color={c.accent} /> : <Card style={{ gap: 14 }}>
              <SectionLabel>{tr('Your private reflection', 'Votre réflexion privée')}</SectionLabel>
              <TextInput accessibilityLabel={tr('Private reflection', 'Réflexion privée')} value={draft} onChangeText={setDraft} multiline maxLength={10000} editable={!busy} placeholder={tr('What will you carry into your day?', 'Que garderez-vous pour votre journée ?')} placeholderTextColor={c.muted} style={{ minHeight: 160, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.line, color: c.ink, backgroundColor: c.bg, fontSize: 17, lineHeight: 27, textAlignVertical: 'top' }} />
              <Text style={{ color: c.muted, lineHeight: 22 }}>{tr('Reflections are encrypted in your account. Unsent drafts are lost if you leave this screen or the app closes.', 'Les réflexions sont chiffrées dans votre compte. Les brouillons non envoyés sont perdus si vous quittez cet écran ou si l’application se ferme.')}</Text>
              <Button title={tr('Save reflection', 'Enregistrer la réflexion')} disabled={busy || !dirty || !draft.trim()} onPress={() => void save('reflection')} />
              <Button kind="soft" title={personal.bookmarked ? tr('Remove from saved', 'Retirer des enregistrements') : tr('Save meditation', 'Garder cette méditation')} disabled={busy} onPress={() => void save('bookmark')} />
              <Button kind="quiet" title={personal.completedAt ? tr('Completed', 'Terminée') : tr('Mark complete', 'Marquer comme terminée')} disabled={busy || !!personal.completedAt} onPress={() => void save('complete')} />
              {dirty ? <Text style={{ color: c.muted }}>{tr('Your reflection has unsaved changes.', 'Votre réflexion contient des modifications non enregistrées.')}</Text> : null}
            </Card>}
          {error ? <ErrorLine message={error} /> : null}
          {message ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{message}</Text> : null}
        </>}
      </Screen>
    </KeyboardAvoidingView>
  </Modal>;
}
