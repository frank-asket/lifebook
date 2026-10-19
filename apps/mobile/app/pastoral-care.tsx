import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api, useApp, useSession } from '../lib/app';
import { requireToken } from '../lib/api';
import { care, CARE_TOPICS, REPORT_CATEGORIES, topicLabel, statusLabel, reportCategoryLabel, type CareTopic, type CareSummary, type CareThread, type QueueItem, type PastorStatus, type ReportCategory } from '../lib/care';
import { Button, Card, ErrorLine, Row, Screen, Segmented, SectionLabel } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';

type Pastor = { slug: string; displayName: string; bio: string; languages: string[]; church: string | null };
export default function PastoralCare() {
  const { c, lang } = useApp(); const session = useSession(); const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [mode, setMode] = useState<'member' | 'pastor'>('member');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<CareSummary[] | null>(null);
  const [pastors, setPastors] = useState<Pastor[] | null>(null);
  const [status, setStatus] = useState<PastorStatus | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState(''); const [directoryError, setDirectoryError] = useState('');
  const [retry, setRetry] = useState(0); const [busy, setBusy] = useState(false);
  const mounted = useRef(true); const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController(); setError(''); setItems(null); setStatus(null); setQueue([]);
    setDirectoryError('');
    api<Pastor[]>('/pastors', null, { signal: controller.signal }).then(rows => { if (!controller.signal.aborted) setPastors(rows); }).catch(e => { if (!controller.signal.aborted) setDirectoryError(errorMessage(e, lang)); });
    if (session.isSignedIn) (async () => {
      try {
        const token = await requireToken(session.getToken); if (controller.signal.aborted) return;
        const current = await care.pastorStatus(token, controller.signal); if (controller.signal.aborted) return;
        setStatus(current);
        if (mode === 'pastor' && !current.active) return;
        const [rows, waiting] = await Promise.all([mode === 'pastor' ? care.cases(token, controller.signal) : care.mine(token, controller.signal), mode === 'pastor' ? care.queue(token, controller.signal) : Promise.resolve([])]);
        if (!controller.signal.aborted) { setItems(rows); setQueue(waiting); }
      } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [session.isSignedIn, session.getToken, mode, retry, lang]));
  async function pastorAction(id?: string, accepting?: boolean) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      const token = await requireToken(session.getToken); if (!mounted.current) return;
      if (id) { await care.claim(token, id); if (mounted.current) setSelected(id); }
      else { const value = await care.setAvailability(token, !!accepting); if (mounted.current) setStatus(value); }
      if (mounted.current) setRetry(n => n + 1);
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  if (selected) return <Conversation key={`${mode}:${selected}`} id={selected} viewer={mode} onClose={() => { setSelected(null); setRetry(n => n + 1); }} />;
  if (creating) return <NewRequest onClose={() => setCreating(false)} onCreated={id => { setCreating(false); setSelected(id); }} />;
  return <Screen title={tr('Pastoral care', 'Accompagnement pastoral')}>
    <Button kind="quiet" title={tr('Back to Prayer', 'Retour à la prière')} onPress={() => router.navigate('/prayer')} />
    <Card><Text style={{ color: c.ink, fontSize: 16, lineHeight: 25 }}>{tr('This pilot offers pastoral conversation, not emergency support or professional medical care. Responses are not immediate. If someone is in immediate danger, contact local emergency services.', 'Ce pilote propose un échange pastoral, pas un service d’urgence ou des soins médicaux professionnels. Les réponses ne sont pas immédiates. En cas de danger immédiat, contactez les services d’urgence locaux.')}</Text></Card>
    {!session.isSignedIn ? <Button title={tr('Sign in from You to ask for care', 'Connectez-vous depuis Vous pour demander un accompagnement')} onPress={() => router.navigate('/you')} /> : <>
      {status?.active ? <Segmented label={tr('Care workspace', 'Espace d’accompagnement')} value={mode} onChange={setMode} disabled={busy} options={[{ label: tr('My requests', 'Mes demandes'), value: 'member' }, { label: tr('Pastor workspace', 'Espace pasteur'), value: 'pastor' }]} /> : null}
      {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : mode === 'pastor' && status && !status.active ? <Text style={{ color: c.muted }}>{tr('Only active, verified pastors can use this workspace.', 'Cet espace est réservé aux pasteurs vérifiés et actifs.')}</Text> : <>
        {mode === 'member' ? <Button title={tr('Ask for pastoral care', 'Demander un accompagnement')} onPress={() => setCreating(true)} /> : status?.active ? <Card style={{ gap: 12 }}>
          <Text style={{ color: c.ink }}>{status.displayName} · {status.openCases}/{status.maxOpenRequests} {tr('open conversations', 'échanges ouverts')}</Text>
          <Switch accessibilityLabel={tr('Accept new requests', 'Accepter de nouvelles demandes')} value={status.acceptingRequests} disabled={busy} onValueChange={value => void pastorAction(undefined, value)} />
          <Text style={{ color: c.muted }}>{tr('Queue previews show no private writing. Claiming assigns a request to you.', 'La file ne montre aucun texte privé. Prendre une demande vous l’attribue.')}</Text>
          {queue.length === 0 ? <Text style={{ color: c.muted }}>{tr('No waiting requests in your languages.', 'Aucune demande en attente dans vos langues.')}</Text> : queue.map(item => <Button key={item.id} kind="soft" disabled={busy || !status.acceptingRequests || status.openCases >= status.maxOpenRequests} title={`${tr('Claim', 'Prendre')} · ${topicLabel(item.topic, lang)} · ${item.language.toUpperCase()}`} onPress={() => void pastorAction(item.id)} />)}
        </Card> : null}
        <SectionLabel>{tr('Conversations', 'Échanges')}</SectionLabel>
        {items === null ? <ActivityIndicator accessibilityLabel={tr('Loading requests', 'Chargement des demandes')} color={c.accent} /> : items.length === 0 ? <Text style={{ color: c.muted }}>{tr('No conversations yet.', 'Aucun échange pour le moment.')}</Text> : items.map(item => <Row key={item.id} icon="chatbubble-outline" title={topicLabel(item.topic, lang)} subtitle={`${statusLabel(item.status, lang)}${item.unread ? ` · ${tr('Unread reply', 'Réponse non lue')}` : ''}`} onPress={() => setSelected(item.id)} />)}
        {items && items.length >= 50 ? <Text style={{ color: c.muted }}>{tr('Showing the 50 most recent conversations.', 'Les 50 échanges les plus récents sont affichés.')}</Text> : null}
      </>}
    </>}
    <Button kind="quiet" title={tr('Refresh', 'Actualiser')} disabled={busy} onPress={() => setRetry(n => n + 1)} />
    <SectionLabel>{tr('Verified pastor directory', 'Annuaire des pasteurs vérifiés')}</SectionLabel>
    {directoryError ? <ErrorLine message={directoryError} onRetry={() => setRetry(n => n + 1)} /> : pastors === null ? <ActivityIndicator accessibilityLabel={tr('Loading directory', 'Chargement de l’annuaire')} color={c.accent} /> : pastors.length === 0 ? <Text style={{ color: c.muted }}>{tr('No active pastor profiles are published yet.', 'Aucun profil de pasteur actif n’est publié pour le moment.')}</Text> : pastors.map(p => <Card key={p.slug} style={{ gap: 8 }}><Text accessibilityRole="header" style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{p.displayName}</Text><Text style={{ color: c.deep }}>{p.church} · {p.languages.join(', ')}</Text><Text style={{ color: c.ink, lineHeight: 24 }}>{p.bio}</Text></Card>)}
  </Screen>;
}

function useExit(dirty: boolean, busy: boolean, onClose: () => void) {
  const { t } = useApp();
  const leave = useCallback(() => { if (busy) return; if (!dirty) { onClose(); return; } Alert.alert(t.prayer.discardTitle, t.prayer.discardMessage, [{ text: t.prayer.keepEditing, style: 'cancel' }, { text: t.prayer.discard, style: 'destructive', onPress: onClose }]); }, [dirty, busy, onClose, t]);
  useFocusEffect(useCallback(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { leave(); return true; }); return () => sub.remove(); }, [leave]));
  return leave;
}
function NewRequest({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { c, lang } = useApp(); const session = useSession(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [topic, setTopic] = useState<CareTopic>('prayer'); const [contact, setContact] = useState<'messages' | 'callback'>('messages');
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [message, setMessage] = useState(''); const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const mounted = useRef(true); const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const leave = useExit(!!message || !!name || !!phone, busy, onClose);
  const input = { color: c.ink, backgroundColor: c.paper, borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, fontSize: 17, minHeight: 48 };
  async function send() {
    if (!consent || !message.trim() || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try { const token = await requireToken(session.getToken); if (!mounted.current) return; const value = await care.create(token, { topic, language: lang, contactPreference: contact, name, ...(contact === 'callback' ? { phone } : {}), message, consent: true }); if (mounted.current) onCreated(value.id); }
    catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <Screen title={tr('Ask for care', 'Demander un accompagnement')}>
    <Button kind="quiet" title={tr('Cancel', 'Annuler')} disabled={busy} onPress={leave} />
    <Text style={{ color: c.muted }}>{tr('Requests go to the verified-pastor queue for your language, not directly to a directory profile. No immediate response is promised.', 'Les demandes rejoignent la file des pasteurs vérifiés de votre langue, sans être adressées à un profil précis. Aucune réponse immédiate n’est promise.')}</Text>
    <Segmented label={tr('Topic', 'Sujet')} value={topic} onChange={setTopic} disabled={busy} options={CARE_TOPICS.map(value => ({ value, label: topicLabel(value, lang) }))} />
    <Segmented label={tr('Contact preference', 'Mode de contact')} value={contact} onChange={setContact} disabled={busy} options={[{ value: 'messages', label: tr('Messages', 'Messages') }, { value: 'callback', label: tr('Callback', 'Rappel') }]} />
    <TextInput accessibilityLabel={tr('Name, optional', 'Nom, facultatif')} placeholder={tr('Name, optional', 'Nom, facultatif')} placeholderTextColor={c.muted} value={name} onChangeText={setName} editable={!busy} maxLength={60} style={input} />
    {contact === 'callback' ? <TextInput accessibilityLabel={tr('Phone with country code', 'Téléphone avec indicatif du pays')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!busy} maxLength={24} style={input} /> : null}
    <TextInput accessibilityLabel={tr('Your request', 'Votre demande')} placeholder={tr('What would you like to share?', 'Que souhaitez-vous partager ?')} placeholderTextColor={c.muted} value={message} onChangeText={setMessage} multiline editable={!busy} maxLength={2000} style={[input, { minHeight: 160, lineHeight: 26, textAlignVertical: 'top' }]} />
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Text style={{ flex: 1, color: c.ink }}>{tr('I agree to share this request and any callback details with the verified pastor who claims it.', 'J’accepte de partager cette demande et mes coordonnées de rappel avec le pasteur vérifié qui la prendra.')}</Text><Switch accessibilityLabel={tr('Consent to share request', 'Consentement au partage de la demande')} value={consent} disabled={busy} onValueChange={setConsent} /></View>
    <Button title={busy ? tr('Sending…', 'Envoi…') : tr('Send request', 'Envoyer la demande')} disabled={busy || !consent || !message.trim() || (contact === 'callback' && !phone.trim())} onPress={() => void send()} />
    {error ? <ErrorLine message={error} /> : null}
  </Screen>;
}

function Conversation({ id, viewer, onClose }: { id: string; viewer: 'member' | 'pastor'; onClose: () => void }) {
  const { c, lang } = useApp(); const session = useSession(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [thread, setThread] = useState<CareThread | null>(null); const [draft, setDraft] = useState(''); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false); const [retry, setRetry] = useState(0); const [reporting, setReporting] = useState(false); const [reported, setReported] = useState(false);
  const mounted = useRef(true); const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const leave = useExit(!!draft, busy, onClose);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController(); setError(''); setThread(null);
    (async () => { try { const token = await requireToken(session.getToken); if (controller.signal.aborted) return; const value = await (viewer === 'member' ? care.get : care.case)(token, id, controller.signal); if (!controller.signal.aborted) setThread(value); } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, lang)); } })();
    return () => controller.abort();
  }, [viewer, id, session.getToken, retry, lang]));
  async function write(action: 'reply' | 'close' | 'delete') {
    if (saving.current || !thread) return;
    saving.current = true; setBusy(true); setError('');
    try {
      const token = await requireToken(session.getToken); if (!mounted.current) return;
      if (action === 'delete') { await care.remove(token, id); if (mounted.current) onClose(); return; }
      const value = action === 'reply' ? await (viewer === 'member' ? care.reply : care.pastorReply)(token, id, draft) : await (viewer === 'member' ? care.close : care.pastorClose)(token, id);
      if (mounted.current) { setThread(value); if (action === 'reply') setDraft(''); }
    } catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  if (reporting) return <Concern id={id} viewer={viewer} onClose={() => setReporting(false)} onSent={() => { setReporting(false); setReported(true); }} />;
  return <Screen title={tr('Pastoral conversation', 'Échange pastoral')}>
    <Button kind="quiet" title={tr('Back to conversations', 'Retour aux échanges')} disabled={busy} onPress={leave} />
    {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : null}
    {!thread ? !error ? <ActivityIndicator accessibilityLabel={tr('Loading conversation', 'Chargement de l’échange')} color={c.accent} /> : null : <>
      <Text style={{ color: c.deep }}>{topicLabel(thread.topic, lang)} · {statusLabel(thread.status, lang)}</Text>
      {thread.pastor ? <Text style={{ color: c.ink }}>{thread.pastor.displayName}</Text> : null}
      {viewer === 'pastor' && thread.phone ? <Text selectable style={{ color: c.ink }}>{tr('Callback', 'Rappel')}: {thread.phone}</Text> : null}
      <Card><Text style={{ color: c.ink, fontSize: 17, lineHeight: 27 }}>{thread.message}</Text></Card>
      {thread.messages.map(item => <Card key={item.id} style={{ gap: 8 }}><Text style={{ color: c.deep, fontWeight: '600' }}>{item.from === 'member' ? tr('Member', 'Membre') : tr('Pastor', 'Pasteur')} · {new Date(item.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</Text><Text style={{ color: c.ink, fontSize: 17, lineHeight: 27 }}>{item.text}</Text></Card>)}
      {thread.messages.length >= 500 ? <Text style={{ color: c.muted }}>{tr('Showing the first 500 messages.', 'Les 500 premiers messages sont affichés.')}</Text> : null}
      {thread.status !== 'CLOSED' ? <>
        <TextInput accessibilityLabel={tr('Your reply', 'Votre réponse')} value={draft} onChangeText={setDraft} editable={!busy} multiline maxLength={2000} style={{ minHeight: 140, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.paper, color: c.ink, fontSize: 17, lineHeight: 26, textAlignVertical: 'top' }} />
        <Button title={tr('Send reply', 'Envoyer la réponse')} disabled={busy || !draft.trim()} onPress={() => void write('reply')} />
        <Button kind="quiet" title={tr('Close conversation', 'Terminer l’échange')} disabled={busy || !!draft} onPress={() => Alert.alert(tr('Close this conversation?', 'Terminer cet échange ?'), tr('No more replies can be sent after closing.', 'Aucune réponse ne pourra être envoyée après la clôture.'), [{ text: tr('Cancel', 'Annuler'), style: 'cancel' }, { text: tr('Close', 'Terminer'), onPress: () => void write('close') }])} />
      </> : null}
      <Button kind="soft" title={tr('Report a concern', 'Signaler une préoccupation')} disabled={busy} onPress={() => setReporting(true)} />
      {reported ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{tr('Report sent to the safeguarding team. Replies to concerns are not immediate.', 'Signalement transmis à l’équipe de protection. Les réponses ne sont pas immédiates.')}</Text> : null}
      {viewer === 'member' ? <Button kind="danger" title={tr('Delete conversation', 'Supprimer l’échange')} disabled={busy} onPress={() => Alert.alert(tr('Permanently delete this conversation?', 'Supprimer définitivement cet échange ?'), tr('The request and its messages will be removed. Existing safety reports follow their own retention rules. Any reply draft here is discarded.', 'La demande et ses messages seront supprimés. Les signalements existants suivent leurs propres règles de conservation. Tout brouillon sera abandonné.'), [{ text: tr('Cancel', 'Annuler'), style: 'cancel' }, { text: tr('Delete', 'Supprimer'), style: 'destructive', onPress: () => void write('delete') }])} /> : null}
    </>}
    <Button kind="quiet" title={tr('Refresh', 'Actualiser')} disabled={busy} onPress={() => setRetry(n => n + 1)} />
  </Screen>;
}

function Concern({ id, viewer, onClose, onSent }: { id: string; viewer: 'member' | 'pastor'; onClose: () => void; onSent: () => void }) {
  const { c, lang } = useApp(); const session = useSession(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [category, setCategory] = useState<ReportCategory>('safety'); const [details, setDetails] = useState(''); const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const mounted = useRef(true); const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const leave = useExit(!!details, busy, onClose);
  async function send() {
    if (saving.current || !details.trim()) return;
    saving.current = true; setBusy(true); setError('');
    try { const token = await requireToken(session.getToken); if (!mounted.current) return; await (viewer === 'member' ? care.report : care.pastorReport)(token, id, { category, details, shareConversation: share }); if (mounted.current) onSent(); }
    catch (e) { if (mounted.current) setError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <Screen title={tr('Report a concern', 'Signaler une préoccupation')}>
    <Button kind="quiet" title={tr('Cancel', 'Annuler')} disabled={busy} onPress={leave} />
    <Text style={{ color: c.muted }}>{tr('The safeguarding team receives this report. This is not an emergency service. Conversation content is included only if you choose it below.', 'L’équipe de protection reçoit ce signalement. Ce n’est pas un service d’urgence. Le contenu de l’échange est inclus uniquement si vous le choisissez ci-dessous.')}</Text>
    <Segmented label={tr('Concern category', 'Catégorie du signalement')} value={category} onChange={setCategory} disabled={busy} options={REPORT_CATEGORIES.map(value => ({ value, label: reportCategoryLabel(value, lang) }))} />
    <TextInput accessibilityLabel={tr('Concern details', 'Détails du signalement')} value={details} onChangeText={setDetails} multiline editable={!busy} maxLength={2000} style={{ minHeight: 160, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, color: c.ink, backgroundColor: c.paper, fontSize: 17, lineHeight: 26, textAlignVertical: 'top' }} />
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Text style={{ flex: 1, color: c.ink }}>{tr('Include this conversation with my report', 'Joindre cet échange à mon signalement')}</Text><Switch accessibilityLabel={tr('Share conversation with safeguarding', 'Partager l’échange avec l’équipe de protection')} value={share} disabled={busy} onValueChange={setShare} /></View>
    <Button title={tr('Send report', 'Envoyer le signalement')} disabled={busy || !details.trim()} onPress={() => void send()} />
    {error ? <ErrorLine message={error} /> : null}
  </Screen>;
}
