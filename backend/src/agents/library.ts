import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db';
import { LibraryBook } from '../types';

let catalogCache: LibraryBook[] | null = null;
function getCatalog(): LibraryBook[] {
  if (!catalogCache) {
    catalogCache = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'data', 'library.json'), 'utf-8')
    ).books;
  }
  return catalogCache;
}

export function listLibrary(deviceId: string, tier: 'free' | 'premium') {
  const database = db.read();
  const progress = database.libraryProgress[deviceId] || [];

  return getCatalog().map(book => {
    const entry = progress.find(p => p.bookId === book.id);
    return {
      ...book,
      locked: book.isPremium && tier !== 'premium',
      progressPercent: entry?.progressPercent ?? 0,
      bookmarked: entry?.bookmarked ?? false,
    };
  });
}

export function toggleBookmark(deviceId: string, bookId: string) {
  const database = db.read();
  if (!database.libraryProgress[deviceId]) database.libraryProgress[deviceId] = [];
  const list = database.libraryProgress[deviceId];

  let entry = list.find(p => p.bookId === bookId);
  if (!entry) {
    entry = { bookId, progressPercent: 0, bookmarked: true };
    list.push(entry);
  } else {
    entry.bookmarked = !entry.bookmarked;
  }
  db.write(database);
  return entry;
}
