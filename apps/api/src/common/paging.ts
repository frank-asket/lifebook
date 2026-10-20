import { NotFoundException } from '@nestjs/common';

/** Rows per "load more" page. */
export const PAGE_SIZE = 50;

/**
 * Cursor paging for a member's own lists. A cursor is the id of the last row of the previous page; it is accepted
 * only if it names a row the caller owns, so a cursor can never be used to probe another member's records.
 */
export async function pageOf<T extends { id: string }>(
  cursor: string | undefined,
  owns: (id: string) => Promise<boolean>,
  fetch: (window: { take: number; cursor?: { id: string }; skip?: number }) => Promise<T[]>,
): Promise<{ rows: T[]; nextCursor: string | null }> {
  if (cursor !== undefined && (typeof cursor !== 'string' || !cursor || cursor.length > 100 || !await owns(cursor))) throw new NotFoundException('Page not found');
  const rows = await fetch({ take: PAGE_SIZE + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
  return { rows: rows.slice(0, PAGE_SIZE), nextCursor: rows.length > PAGE_SIZE ? rows[PAGE_SIZE - 1].id : null };
}
