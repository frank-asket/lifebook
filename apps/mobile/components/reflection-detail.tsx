import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Text, TextInput } from 'react-native';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { errorMessage } from '../../web/lib/errors';
import { Button, Card, ErrorLine, Screen, SectionLabel } from './ui';

export type Meditation = { id: string; title: string; locale: string; scriptureReference: string; scriptureText: string | null; translation: string | null; explanation: string; questions: string[]; guidedPrayer: string };
export type DailySession = { id: string; journeyDate: string; passageKey: string; status: string; steps: { step: string }[]; reflection: { content: string } | null };
export const dailySteps = ['UNDERSTAND', 'MEDITATE', 'REFLECT', 'PRAY', 'LIVE'] as const;
export function dayLabel(value: string, lang: 'en' | 'fr') {
  return new Date(value).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
}
type Personal = { reflection: string; bookmarked: boolean; completedAt: string | null };

export function ReflectionDetail({ kind, id, onClose, onChanged }: { kind: 'daily' | 'meditation'; id: string; onClose: () => void; onChanged: () => void }) {
  const { c, lang, t } = useApp();
  const session = useSession();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [daily, setDaily] = useState<DailySession | null>(null);
  const [personal, setPersonal] = useState<Personal | null>(null);
  const [draft, setDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setReady(false); setLoadError(''); setPersonal(null); setDraft(''); setMeditation(null); setDaily(null);
    (async () => {
      try {
        if (kind === 'daily') {
          const token = await requireToken(session.getToken);
          if (controller.signal.aborted) return;
          const value = await api<DailySession>(`/daily-word/sessions/${encodeURIComponent(id)}`, token, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setDaily(value); setDraft(value.reflection?.content ?? '');
          setPersonal({ reflection: value.reflection?.content ?? '', bookmarked: false, completedAt: null });
        } else {
          const item = await api<Meditation>(`/meditations/${encodeURIComponent(id)}`, undefined, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setMeditation(item);
          if (session.isSignedIn) {
            const token = await requireToken(session.getToken);
            if (controller.signal.aborted) return;
            const value = await api<Personal>(`/meditations/${encodeURIComponent(id)}/state`, token, { signal: controller.signal });
            if (controller.signal.aborted) return;
            setPersonal(value); setDraft(value.reflection);
          }
        }
        setReady(true);
      } catch (e) { if (!controller.signal.aborted) setLoadError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [kind, id, session.isSignedIn, session.getToken, retry]);
  const dirty = personal !== null && draft !== personal.reflection;
  const close = () => {
    if (saving.current) return;
    if (!dirty) { onClose(); return; }
    Alert.alert(t.prayer.discardTitle, t.prayer.discardMessage, [{ text: t.prayer.keepEditing, style: 'cancel' }, { text: t.prayer.discard, style: 'destructive', onPress: onClose }]);
  };
  async function write(action: 'reflection' | 'delete' | 'bookmark' | 'complete') {
    if (!ready || !personal || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      const path = kind === 'daily' ? `/daily-word/sessions/${encodeURIComponent(id)}` : `/meditations/${encodeURIComponent(id)}`;
      if (action === 'reflection') {
        if (!draft.trim()) return;
        await api(`${path}/reflection`, token, { method: 'PUT', body: JSON.stringify(kind === 'daily' ? { content: draft } : { text: draft }) });
        if (mounted.current) {
          const saved = kind === 'daily' ? draft : draft.trim();
          setPersonal(value => value && { ...value, reflection: saved }); setDraft(saved);
        }
      } else if (action === 'delete') {
        await api(`${path}/reflection`, token, { method: 'DELETE' });
        if (mounted.current) { setPersonal(value => value && { ...value, reflection: '' }); setDraft(''); }
      } else if (action === 'bookmark') {
        const result = await api<{ bookmarked: boolean }>(`${path}/bookmark`, token, { method: 'PUT', body: JSON.stringify({ saved: !personal.bookmarked }) });
        if (mounted.current) setPersonal(value => value && { ...value, bookmarked: result.bookmarked });
      } else {
        const result = await api<{ completedAt: string }>(`${path}/complete`, token, { method: 'POST' });
        if (mounted.current) setPersonal(value => value && { ...value, completedAt: result.completedAt });
      }
      if (mounted.current) { setMessage(action === 'delete' ? tr('Reflection deleted. Your progress is unchanged.', 'Réflexion supprimée. Votre progression est conservée.') : tr('Saved to your account.', 'Enregistré dans votre compte.')); onChanged(); }
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  function confirmDelete() {
    Alert.alert(tr('Delete this reflection?', 'Supprimer cette réflexion ?'), tr('This permanently removes the saved reflection and discards any draft here. Your completed steps and bookmarks remain.', 'Cela supprime définitivement la réflexion enregistrée et abandonne le brouillon de cet écran. Vos étapes terminées et vos favoris sont conservés.'), [
      { text: t.prayer.cancel, style: 'cancel' }, { text: tr('Delete reflection', 'Supprimer la réflexion'), style: 'destructive', onPress: () => { if (mounted.current) void write('delete'); } },
    ]);
  }
  const names = lang === 'fr' ? ['Comprendre', 'Méditer', 'Réfléchir', 'Prier', 'Vivre'] : ['Understand', 'Meditate', 'Reflect', 'Pray', 'Live'];
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen title={kind === 'daily' ? tr('Daily Word reflection', 'Réflexion sur la Parole du jour') : tr('A quiet moment', 'Un moment de calme')}>
        <Button kind="quiet" title={tr('Close', 'Fermer')} onPress={close} disabled={busy} />
        {meditation ? <>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 27, lineHeight: 35, fontWeight: '700' }}>{meditation.title}</Text>
          <Text style={{ color: c.deep }}>{meditation.locale === 'fr' ? 'Français' : 'English'} · {meditation.scriptureReference}</Text>
          {meditation.scriptureText ? <Card style={{ gap: 12 }}><Text style={{ color: c.ink, fontSize: 20, lineHeight: 31 }}>{meditation.scriptureText}</Text>{meditation.translation ? <Text style={{ color: c.muted }}>{meditation.translation}</Text> : null}</Card> : null}
          <Text style={{ color: c.ink, fontSize: 17, lineHeight: 28 }}>{meditation.explanation}</Text>
          {Array.isArray(meditation.questions) ? meditation.questions.filter(q => typeof q === 'string').map((q, i) => <Text key={i} style={{ color: c.ink, fontSize: 17, lineHeight: 27 }}>{q}</Text>) : null}
          <Card><Text style={{ color: c.ink, fontSize: 17, lineHeight: 28 }}>{meditation.guidedPrayer}</Text></Card>
        </> : null}
        {daily ? <Card style={{ gap: 10 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 22, fontWeight: '700' }}>{dayLabel(daily.journeyDate, lang)}</Text>
          <Text style={{ color: c.deep }}>{daily.status === 'COMPLETED' ? tr('Completed', 'Terminée') : tr('In progress', 'En cours')}</Text>
          {dailySteps.map((step, i) => <Text key={step} style={{ color: c.ink }}>{daily.steps.some(value => value.step === step) ? '✓' : '○'} {names[i]} · {daily.steps.some(value => value.step === step) ? tr('Complete', 'Terminée') : tr('Not completed', 'Non terminée')}</Text>)}
        </Card> : null}
        {loadError ? <ErrorLine message={loadError} onRetry={() => setRetry(n => n + 1)} /> : !ready ? <ActivityIndicator color={c.accent} /> : personal ? <Card style={{ gap: 14 }}>
          <SectionLabel>{tr('Your private reflection', 'Votre réflexion privée')}</SectionLabel>
          <TextInput accessibilityLabel={tr('Private reflection', 'Réflexion privée')} value={draft} onChangeText={setDraft} multiline maxLength={10000} editable={!busy} placeholder={tr('What will you carry into your day?', 'Que garderez-vous pour votre journée ?')} placeholderTextColor={c.muted} style={{ minHeight: 160, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.line, color: c.ink, backgroundColor: c.bg, fontSize: 17, lineHeight: 27, textAlignVertical: 'top' }} />
          <Text style={{ color: c.muted, lineHeight: 22 }}>{tr('Reflections are encrypted in your account. Unsent drafts are lost if you leave this screen or the app closes.', 'Les réflexions sont chiffrées dans votre compte. Les brouillons sont perdus si vous quittez cet écran ou si l’application se ferme.')}</Text>
          <Button title={tr('Save reflection', 'Enregistrer la réflexion')} disabled={busy || !dirty || !draft.trim()} onPress={() => void write('reflection')} />
          {personal.reflection ? <Button kind="danger" title={tr('Delete reflection', 'Supprimer la réflexion')} disabled={busy} onPress={confirmDelete} /> : null}
          {kind === 'meditation' ? <>
            <Button kind="soft" title={personal.bookmarked ? tr('Remove from saved', 'Retirer des enregistrements') : tr('Save meditation', 'Garder cette méditation')} disabled={busy} onPress={() => void write('bookmark')} />
            <Button kind="quiet" title={personal.completedAt ? tr('Completed', 'Terminée') : tr('Mark complete', 'Marquer comme terminée')} disabled={busy || !!personal.completedAt} onPress={() => void write('complete')} />
          </> : null}
          {dirty ? <Text style={{ color: c.muted }}>{tr('Your reflection has unsaved changes.', 'Votre réflexion contient des modifications non enregistrées.')}</Text> : null}
        </Card> : <Text style={{ color: c.muted }}>{tr('Sign in from You to save a private reflection and track completion.', 'Connectez-vous depuis Vous pour enregistrer une réflexion privée et suivre votre progression.')}</Text>}
        {error ? <ErrorLine message={error} /> : null}
        {message ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{message}</Text> : null}
      </Screen>
    </KeyboardAvoidingView>
  </Modal>;
}
