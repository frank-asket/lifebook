import { useEffect, useRef, useState } from 'react';
import { Alert, Text, TextInput } from 'react-native';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine } from './ui';
import { errorMessage } from '../../web/lib/errors';
export function DeletePrayers() {
  const { c, lang } = useApp(); const session = useSession(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const word = lang === 'fr' ? 'SUPPRIMER PRIÈRES' : 'DELETE PRAYERS';
  const [typed, setTyped] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const mounted = useRef(true); const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function erase() {
    if (typed !== word || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    try { const token = await requireToken(session.getToken); if (!mounted.current) return; const result = await api<{ deleted: number }>('/prayers/delete-all', token, { method: 'POST', body: JSON.stringify({ confirm: 'DELETE_ALL_PRAYERS' }) }); if (mounted.current) { setTyped(''); setMessage(tr(`${result.deleted} saved prayers deleted.`, `${result.deleted} prières enregistrées supprimées.`)); } }
    catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <Card style={{ gap: 14 }}><Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{tr('Delete prayer journal', 'Supprimer le journal de prière')}</Text>
    <Text style={{ color: c.muted, lineHeight: 23 }}>{tr('Permanently deletes every saved prayer, answered note and generated meditation. Your account, Bible notes and Daily Word history remain. This cannot be undone.', 'Supprime définitivement toutes les prières enregistrées, notes de réponse et méditations générées. Votre compte, vos notes bibliques et votre historique de la Parole du jour restent conservés. Cette action est irréversible.')}</Text>
    <TextInput accessibilityLabel={tr(`Type ${word} to confirm prayer journal deletion`, `Saisissez ${word} pour confirmer la suppression du journal`)} value={typed} onChangeText={setTyped} editable={!busy} autoCorrect={false} autoCapitalize="characters" style={{ minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, color: c.ink, backgroundColor: c.bg, fontSize: 17 }} />
    <Button kind="danger" title={tr('Delete all saved prayers', 'Supprimer toutes les prières enregistrées')} disabled={busy || typed !== word} onPress={() => Alert.alert(tr('Permanently delete this prayer journal?', 'Supprimer définitivement ce journal ?'), tr('Every saved prayer and its generated meditation will be removed.', 'Toutes les prières enregistrées et leurs méditations générées seront supprimées.'), [{ text: tr('Cancel', 'Annuler'), style: 'cancel' }, { text: tr('Delete prayers', 'Supprimer les prières'), style: 'destructive', onPress: () => void erase() }])} />
    {error ? <ErrorLine message={error} /> : null}{message ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{message}</Text> : null}
  </Card>;
}
