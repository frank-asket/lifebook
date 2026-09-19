import fs from 'node:fs';
import path from 'node:path';
import { LibraryBook } from '../types';
import { LibraryRepository } from '../repositories';

let catalogCache: LibraryBook[] | null = null;
function getCatalog(): LibraryBook[] {
  if (!catalogCache) {
    catalogCache = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'data', 'library.json'), 'utf-8')
    ).books;
  }
  return catalogCache!;
}

export async function listLibrary(deviceId: string, tier: 'free' | 'premium') {
  const progress = await LibraryRepository.listProgress(deviceId);

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

export async function toggleBookmark(deviceId: string, bookId: string) {
  return LibraryRepository.toggleBookmark(deviceId, bookId);
}
