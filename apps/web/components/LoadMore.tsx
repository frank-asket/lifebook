'use client';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './language-provider';
import { errorMessage } from '../lib/errors';

export type Page<T> = { items: T[]; nextCursor: string | null };

/**
 * "Load more" for a cursor-paged list. Shows nothing when there is no next page, keeps focus on the button,
 * and announces how many items were added.
 */
export function LoadMore<T>({ cursor, fetchPage, onLoaded }: { cursor: string | null; fetchPage: (cursor: string) => Promise<Page<T>>; onLoaded: (page: Page<T>) => void }) {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState<number | null>(null);
  const end = useRef<HTMLParagraphElement>(null);
  // When the last page arrives the button goes away; keep keyboard focus on the visible "That's everything" line.
  useEffect(() => { if (!cursor && added !== null) end.current?.focus(); }, [cursor, added]);
  if (!cursor && added === null) return null;
  async function more() {
    if (!cursor || busy) return;
    setBusy(true); setError('');
    try { const page = await fetchPage(cursor); onLoaded(page); setAdded(page.items.length); }
    catch (e) { setError(errorMessage(e, language)); }
    finally { setBusy(false); }
  }
  return <div className="load-more">
    {cursor ? <button type="button" className="btn btn-soft" disabled={busy} aria-busy={busy} onClick={() => void more()}>{busy ? tr('Loading…', 'Chargement…') : tr('Load more', 'Afficher plus')}</button> : null}
    <p className="sr-only" role="status">{added === null || !cursor ? '' : tr(`${added} more shown.`, `${added} de plus affichés.`)}</p>
    {!cursor && added !== null ? <p ref={end} tabIndex={-1} className="muted load-more-end">{tr(`${added} more shown. That’s everything.`, `${added} de plus affichés. C’est tout.`)}</p> : null}
    {error ? <p className="alert" role="alert">{error}</p> : null}
  </div>;
}
