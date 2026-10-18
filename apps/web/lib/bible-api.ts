import { api } from './api';
export type BibleLocale = 'en' | 'fr';
export type BibleBook = { id: string; name: string; abbreviation?: string };
export type BibleChapter = { id: string; number: string; reference?: string };
export type BibleChapterContent = { id: string; reference: string; content: string; copyright?: string; bibleId?: string; fumsToken?: string | null };
export type BibleTranslation = { id: string; name: string; abbreviation?: string; language?: { id?: string; name?: string }; copyright?: string; info?: string };
export type BiblePassage = { reference: string; text: string; translation: string; copyright: string | null; provider: string };
type Wrapped<T> = { data: T };

const get = <T>(path: string, signal?: AbortSignal) => api<T>(`/bible-content${path}`, null, { signal });
export const bibleApi = {
  books: async (locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleBook[]>>(`/books?locale=${locale}`, signal)).data,
  chapters: async (bookId: string, locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleChapter[]>>(`/books/${encodeURIComponent(bookId)}/chapters?locale=${locale}`, signal)).data,
  chapter: async (chapterId: string, locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleChapterContent>>(`/chapters/${encodeURIComponent(chapterId)}?locale=${locale}`, signal)).data,
  translation: async (locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleTranslation>>(`/translation?locale=${locale}`, signal)).data,
  passage: (id: string, locale: BibleLocale, signal?: AbortSignal) => get<BiblePassage>(`/passages/${encodeURIComponent(id)}?locale=${locale}`, signal),
};
