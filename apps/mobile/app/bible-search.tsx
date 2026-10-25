import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useApp } from '../lib/app';
import { api } from '../lib/api';
import { Button, Card, ErrorLine, Row, Screen } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';
import type { ScriptureSearch } from '../../web/lib/scripture-search';
import { SECTION_TITLES, resultCount, type SearchItem, type SearchResult } from '../../web/lib/search-api';
import { versionFor } from '../../web/lib/bible-versions';

/** Where a web result path opens in the app. Studies have no mobile screen yet, so they are not shown here. */
function route(href: string): { kind: 'passage'; chapterId: string; verse: number | null } | { kind: 'screen'; to: Href } | null {
  const read = /^\/bible\/read\?(.*)$/.exec(href);
  if (read) {
    const p = new URLSearchParams(read[1]); const chapterId = p.get('chapter') ?? ''; const verse = Number((p.get('verse') ?? '').split('-')[0]);
    return /^[A-Z0-9]{3}\.[1-9][0-9]{0,2}$/.test(chapterId) ? { kind: 'passage', chapterId, verse: Number.isInteger(verse) && verse > 0 ? verse : null } : null;
  }
  const m = /^\/(bible\/plans|discipleship|livingword|meditation)\/([A-Za-z0-9_-]{1,64})$/.exec(href);
  if (!m) return null;
  const to = { 'bible/plans': `/reading-plans?plan=${m[2]}`, discipleship: `/discipleship?id=${m[2]}`, livingword: `/livingword?id=${m[2]}`, meditation: `/meditations?id=${m[2]}` }[m[1]];
  return to ? { kind: 'screen', to: to as Href } : null;
}

/** One search for Scripture, plans, pathways, teachings and meditations, with "All Scripture results" for paging. */
export default function Search() {
  const { c, lang, bibleLocale, prefs, setPrefs } = useApp(); const version = versionFor(bibleLocale, prefs?.bibleVersions).id; const router = useRouter(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [query, setQuery] = useState(''); const [search, setSearch] = useState(''); const [retry, setRetry] = useState(0); const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [scriptureOnly, setScriptureOnly] = useState(false); const [offset, setOffset] = useState(0); const [data, setData] = useState<ScriptureSearch | null>(null);
  useFocusEffect(useCallback(() => {
    if (search.length < 2) return;
    const controller = new AbortController(); setError('');
    if (scriptureOnly) {
      setData(null);
      api<ScriptureSearch>(`/bible-content/search?locale=${bibleLocale}&version=${version}&q=${encodeURIComponent(search)}&offset=${offset}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setData(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    } else {
      setResult(null);
      api<SearchResult>(`/search?q=${encodeURIComponent(search)}&locale=${bibleLocale}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    }
    return () => controller.abort();
  }, [bibleLocale, version, search, offset, retry, lang, scriptureOnly]));
  const run = () => { setSearch(query.trim()); setOffset(0); setScriptureOnly(false); };
  const open = (href: string) => {
    const target = route(href); if (!target) return;
    if (target.kind === 'passage') { setPrefs({ bibleLocale, chapterId: target.chapterId, verse: target.verse }); router.navigate('/bible'); }
    else router.push(target.to);
  };
  const sections = result ? result.sections.filter(s => s.kind !== 'studies' && (s.items.length || s.status === 'unavailable')) : [];
  const item = (i: SearchItem, icon: 'book-outline' | 'albums-outline') => route(i.href) ? <Row key={i.id} icon={icon} title={i.title} subtitle={i.subtitle ?? undefined} onPress={() => open(i.href)} /> : null;
  return <Screen title={tr('Search', 'Rechercher')}><Button kind="quiet" title={tr('Back to Bible', 'Retour à la Bible')} onPress={() => router.navigate('/bible')} />
    <Text style={{ color: c.muted, lineHeight: 22 }}>{tr('A passage like “John 3:16”, a word or a theme. Never searches your private writing.', 'Un passage comme « Jean 3:16 », un mot ou un thème. Ne recherche jamais dans vos écrits privés.')}</Text>
    <TextInput accessibilityLabel={tr('Search LifeBook', 'Rechercher dans LifeBook')} placeholder={tr('John 3:16, peace, prayer…', 'Jean 3:16, paix, prière…')} placeholderTextColor={c.muted} value={query} onChangeText={setQuery} maxLength={120} returnKeyType="search" onSubmitEditing={run} style={{ minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, color: c.ink, backgroundColor: c.paper, fontSize: 17 }} />
    <Button title={tr('Search', 'Rechercher')} disabled={query.trim().length < 2} onPress={run} />
    {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} />
      : search.length < 2 ? null
      : scriptureOnly ? (!data ? <ActivityIndicator accessibilityLabel={tr('Searching Scripture', 'Recherche dans les Écritures')} color={c.accent} /> : <>
        <Button kind="quiet" title={tr('All results', 'Tous les résultats')} onPress={() => setScriptureOnly(false)} />
        {!data.items.length ? <Card><Text style={{ color: c.muted }}>{tr('No matching passages. Try another word or reference.', 'Aucun passage correspondant. Essayez un autre mot ou une autre référence.')}</Text></Card> : data.items.map(v => <Row key={v.id} icon="book-outline" title={v.reference} onPress={() => { setPrefs({ bibleLocale, chapterId: v.chapterId, verse: v.verse }); router.navigate('/bible'); }} />)}
        <Text style={{ color: c.muted }}>{data.total} {tr('results', 'résultats')}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}><Button kind="quiet" title={tr('Previous', 'Précédent')} disabled={offset === 0} onPress={() => setOffset(n => Math.max(0, n - data.limit))} style={{ flex: 1 }} /><Button kind="quiet" title={tr('Next', 'Suivant')} disabled={offset + data.limit >= data.total} onPress={() => setOffset(n => n + data.limit)} style={{ flex: 1 }} /></View>
      </>)
      : !result ? <ActivityIndicator accessibilityLabel={tr('Searching', 'Recherche…')} color={c.accent} />
      : <>
        {result.go ? <Row icon="arrow-forward-circle-outline" title={result.go.label} subtitle={tr('Go to passage', 'Aller au passage')} onPress={() => open(result.go!.href)} /> : null}
        {sections.map(s => <View key={s.kind} style={{ gap: 6 }}>
          <Text accessibilityRole="header" style={{ color: c.muted, fontSize: 13, fontWeight: '700', marginTop: 6 }}>{tr(...SECTION_TITLES[s.kind])}</Text>
          {s.status === 'unavailable' ? <Text style={{ color: c.muted }}>{tr('This part of search is unavailable right now.', 'Cette partie de la recherche est indisponible pour le moment.')}</Text>
            : s.items.map(i => item(i, s.kind === 'scripture' ? 'book-outline' : 'albums-outline'))}
          {s.kind === 'scripture' && s.items.length ? <Button kind="quiet" title={tr('All Scripture results', 'Tous les résultats dans les Écritures')} onPress={() => { setOffset(0); setScriptureOnly(true); }} /> : null}
        </View>)}
        {resultCount(result) === 0 ? <Card><Text style={{ color: c.muted, lineHeight: 22 }}>{tr('Nothing matches yet. Try another word, or a reference like “Psalm 23”.', 'Rien ne correspond pour le moment. Essayez un autre mot, ou une référence comme « Psaume 23 ».')}</Text></Card> : null}
      </>}
  </Screen>;
}
