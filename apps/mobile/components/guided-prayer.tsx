import { useEffect, useRef, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine } from './ui';
import { errorMessage } from '../../web/lib/errors';
import type { Meditation, MeditationResult } from '../../web/lib/prayer-api';
export function GuidedPrayer({ id, existing, disabled, onChange, onBusyChange }: { id: string; existing: Meditation | null; disabled: boolean; onChange: () => void; onBusyChange: (busy: boolean) => void }) {
  const { c, lang } = useApp(); const session = useSession(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [needsSetting, setNeedsSetting] = useState(false); const [result, setResult] = useState<MeditationResult | null>(null);
  const mounted = useRef(true); const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; onBusyChange(false); }; }, [onBusyChange]);
  const meditation = result?.status === 'ok' ? result.meditation : existing;
  async function run(remove = false) {
    if (saving.current || disabled || (!remove && !consent)) return;
    saving.current = true; setBusy(true); onBusyChange(true); setError(''); setNeedsSetting(false);
    try {
      const token = await requireToken(session.getToken); if (!mounted.current) return;
      const endpoint = `/prayers/${encodeURIComponent(id)}/meditation`;
      if (remove) { await api(endpoint, token, { method: 'DELETE' }); if (mounted.current) { setResult(null); onChange(); } }
      else {
        const value = await api<MeditationResult>(endpoint, token, { method: 'POST', body: JSON.stringify({ consent: true, locale: lang }) });
        if (mounted.current) { setResult(value); setConsent(false); if (value.status === 'ok') onChange(); }
      }
    } catch (e) { if (mounted.current) { if ((e as { status?: number }).status === 403) setNeedsSetting(true); else setError(errorMessage(e, lang)); } }
    finally { saving.current = false; if (mounted.current) { setBusy(false); onBusyChange(false); } }
  }
  return <Card style={{ gap: 14 }}><Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{tr('Guided meditation', 'Méditation guidée')}</Text>
    {disabled ? <Text style={{ color: c.muted }}>{tr('Save your prayer and answer-note changes first.', 'Enregistrez d’abord vos modifications de prière et de réponse.')}</Text> : null}
    {result?.status === 'crisis' ? <View accessibilityRole="alert" style={{ gap: 10 }}><Text style={{ color: c.ink, fontSize: 17, lineHeight: 26 }}>{result.message}</Text>{result.contacts.map(contact => <Text key={contact.number} selectable style={{ color: c.ink }}>{contact.label} · {contact.number}</Text>)}</View> : meditation ? <>
      {meditation.passages.map(passage => <View key={passage.id} style={{ gap: 8 }}><Text style={{ color: c.ink, fontSize: 19, lineHeight: 30 }}>{passage.text}</Text><Text style={{ color: c.deep }}>{passage.reference}</Text>{passage.copyright ? <Text style={{ color: c.muted, fontSize: 12 }}>{passage.copyright}</Text> : null}</View>)}
      <Text style={{ color: c.ink, fontSize: 17, lineHeight: 27 }}>{meditation.reflection}</Text>{meditation.questions.map((question, index) => <Text key={index} style={{ color: c.ink, fontSize: 17, lineHeight: 27 }}>{question}</Text>)}<Text style={{ color: c.ink, fontSize: 17, lineHeight: 27 }}>{meditation.prayer}</Text>
      <Text style={{ color: c.muted, lineHeight: 23 }}>{tr('AI-assisted reflection, not a word from God or professional advice. Scripture is supplied by API.Bible.', 'Réflexion assistée par IA, pas une parole de Dieu ni un avis professionnel. Les Écritures sont fournies par API.Bible.')}</Text>
      <Button kind="danger" title={tr('Remove this meditation', 'Supprimer cette méditation')} disabled={disabled || busy} onPress={() => Alert.alert(tr('Remove this meditation?', 'Supprimer cette méditation ?'), tr('Your saved prayer stays unchanged.', 'Votre prière enregistrée reste inchangée.'), [{ text: tr('Cancel', 'Annuler'), style: 'cancel' }, { text: tr('Remove', 'Supprimer'), style: 'destructive', onPress: () => void run(true) }])} />
    </> : <>
      <Text style={{ color: c.muted, lineHeight: 24 }}>{tr('Only this saved prayer’s text and your language are sent to OpenAI to prepare an optional reflection. They may contain sensitive information. Your name and account are not included. Nothing is sent until you choose to continue.', 'Seuls le texte de cette prière enregistrée et votre langue sont envoyés à OpenAI pour préparer une réflexion facultative. Ils peuvent contenir des informations sensibles. Votre nom et votre compte ne sont pas inclus. Rien n’est envoyé avant votre accord.')}</Text>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Text style={{ flex: 1, color: c.ink }}>{tr('Send this saved prayer for guided meditation', 'Envoyer cette prière pour une méditation guidée')}</Text><Switch accessibilityLabel={tr('Consent to send this prayer to OpenAI', 'Consentement à envoyer cette prière à OpenAI')} value={consent} disabled={disabled || busy} onValueChange={setConsent} /></View>
      <Button title={busy ? tr('Preparing…', 'Préparation…') : tr('Prepare guided meditation', 'Préparer une méditation guidée')} disabled={disabled || busy || !consent} onPress={() => void run()} />
    </>}
    {needsSetting ? <Text accessibilityRole="alert" style={{ color: c.muted }}>{tr('Optional AI processing is off. Close this prayer and review Account and privacy from You before trying again.', 'Le traitement IA facultatif est désactivé. Fermez cette prière et consultez Compte et confidentialité depuis Vous avant de réessayer.')}</Text> : null}
    {error ? <ErrorLine message={error} /> : null}
  </Card>;
}
