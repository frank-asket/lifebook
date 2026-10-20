import { useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { useApp } from '../lib/app';
import { errorMessage } from '../../web/lib/errors';
import { Button } from './ui';

export type Page<T> = { items: T[]; nextCursor: string | null };

/** "Load more" for a cursor-paged list. Hidden when there is no next page; announces how many were added. */
export function LoadMore<T>({ cursor, fetchPage, onLoaded }: { cursor: string | null; fetchPage: (cursor: string) => Promise<Page<T>>; onLoaded: (page: Page<T>) => void }) {
  const { c, lang } = useApp();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!cursor) return null;
  async function more() {
    if (!cursor || busy) return;
    setBusy(true); setError('');
    try {
      const page = await fetchPage(cursor);
      onLoaded(page);
      AccessibilityInfo.announceForAccessibility(page.nextCursor ? tr(`${page.items.length} more shown.`, `${page.items.length} de plus affichés.`) : tr(`${page.items.length} more shown. That is everything.`, `${page.items.length} de plus affichés. C’est tout.`));
    } catch (e) { setError(errorMessage(e, lang)); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 8 }}>
    <Button kind="soft" title={busy ? tr('Loading…', 'Chargement…') : tr('Load more', 'Afficher plus')} disabled={busy} onPress={() => void more()} />
    {error ? <Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text> : null}
  </View>;
}
