import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import type { Annotation } from '../lib/annotations';
import { AnnotationEditor } from '../components/annotation-editor';
import { Button, Card, ErrorLine, Screen } from '../components/ui';
import { passageLabel } from '../../web/lib/scripture';
import { errorMessage } from '../../web/lib/errors';

export default function SavedVerses() {
  const { c, lang, setPrefs } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [items, setItems] = useState<Annotation[] | null>(null);
  const [selected, setSelected] = useState<Annotation | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreError, setMoreError] = useState('');
  const generation = useRef(0); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    if (!session.isSignedIn) return;
    const controller = new AbortController();
    generation.current++; setItems(null); setError(''); setCursor(null); setMoreError(''); setMoreBusy(false);
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const result = await api<{ items: Annotation[]; nextCursor: string | null }>('/bible-annotations/page', token, { signal: controller.signal });
        if (!controller.signal.aborted) { setItems(result.items); setCursor(result.nextCursor); }
      } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [session.isSignedIn, session.getToken, lang, retry]));
  async function more() {
    if (!cursor || moreBusy) return;
    const version = generation.current; setMoreBusy(true); setMoreError('');
    try {
      const token = await requireToken(session.getToken); if (!mounted.current || version !== generation.current) return;
      const result = await api<{ items: Annotation[]; nextCursor: string | null }>(`/bible-annotations/page?cursor=${encodeURIComponent(cursor)}`, token);
      if (mounted.current && version === generation.current) { setItems(previous => [...new Map([...(previous ?? []), ...result.items].map(item => [item.id, item])).values()]); setCursor(result.nextCursor); }
    } catch (e) { if (mounted.current && version === generation.current) setMoreError(errorMessage(e, lang)); }
    finally { if (mounted.current && version === generation.current) setMoreBusy(false); }
  }
  const visible = items?.filter(item => item.bookmarked || item.highlight || item.note);
  return <Screen title={tr('Saved verses', 'Versets enregistrés')}>
    <Button kind="quiet" title={tr('Back to the Bible', 'Retour à la Bible')} onPress={() => router.navigate('/bible')} />
    {!session.isSignedIn ? <Card><Text style={{ color: c.muted }}>{tr('Sign in from You to keep bookmarks, highlights and encrypted notes.', 'Connectez-vous depuis Vous pour garder vos marque-pages, surlignages et notes chiffrées.')}</Text></Card>
      : error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} />
      : items === null ? <ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} />
      : !visible?.length ? <Card><Text style={{ color: c.muted, lineHeight: 23 }}>{tr('Use “Save a verse” in the Bible reader to add a bookmark, highlight or private note.', 'Utilisez « Enregistrer un verset » dans la Bible pour ajouter un marque-page, un surlignage ou une note privée.')}</Text></Card>
      : visible.map(item => <Card key={item.id} style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{passageLabel(item.passageId, item.locale)}</Text>
        <Text style={{ color: c.deep }}>{item.locale === 'fr' ? 'Français' : 'English'}{item.bookmarked ? ` · ${tr('Bookmarked', 'Marqué')}` : ''}</Text>
        {item.note ? <Text style={{ color: c.ink, fontSize: 16, lineHeight: 25 }} numberOfLines={3}>{item.note}</Text> : null}
        <Button kind="quiet" title={tr('Read chapter', 'Lire le chapitre')} onPress={() => { setPrefs({ chapterId: item.passageId.split('.').slice(0, 2).join('.'), bibleLocale: item.locale, verse: Number(item.passageId.split('.')[2]?.split('-')[0]) || null }); router.navigate('/bible'); }} />
        <Button kind="soft" title={tr('Edit saved verse', 'Modifier le verset enregistré')} onPress={() => setSelected(item)} />
      </Card>)}
    {moreError ? <ErrorLine message={moreError} onRetry={() => void more()} /> : null}
    {cursor ? <Button kind="quiet" title={moreBusy ? tr('Loading…', 'Chargement…') : tr('Load more saved verses', 'Charger plus de versets')} disabled={moreBusy} onPress={() => void more()} /> : null}
    {selected ? <AnnotationEditor key={selected.id} chapterId={selected.passageId.split('.').slice(0, 2).join('.')} verse={selected.passageId.split('.')[2]} locale={selected.locale} onClose={() => setSelected(null)} onChanged={() => setRetry(n => n + 1)} /> : null}
  </Screen>;
}
