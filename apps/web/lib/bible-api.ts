import { api } from './api';
export type BibleLocale = 'en' | 'fr';
export type BibleBook = { id: string; name: string; abbreviation?: string };
export type BibleChapter = { id: string; number: string; reference?: string };
export type BibleChapterContent = { id: string; reference: string; content: string; copyright?: string; bibleId?: string; fumsToken?: string | null };
export type BibleTranslation = { id: string; name: string; abbreviation?: string; language?: { id?: string; name?: string }; copyright?: string; info?: string };
export type BiblePassage = { reference: string; text: string; translation: string; copyright: string | null; provider: string; fumsToken?: string | null };
type Wrapped<T> = { data: T };

const get = <T>(path: string, signal?: AbortSignal) => api<T>(`/bible-content${path}`, null, { signal });
// `version` is one of lib/bible-versions.ts; it decides the translation, `locale` its language.
const q = (locale: BibleLocale, version: string) => `locale=${locale}&version=${encodeURIComponent(version)}`;
export const bibleApi = {
  books: async (locale: BibleLocale, version: string, signal?: AbortSignal) => (await get<Wrapped<BibleBook[]>>(`/books?${q(locale, version)}`, signal)).data,
  chapters: async (bookId: string, locale: BibleLocale, version: string, signal?: AbortSignal) => (await get<Wrapped<BibleChapter[]>>(`/books/${encodeURIComponent(bookId)}/chapters?${q(locale, version)}`, signal)).data,
  chapter: async (chapterId: string, locale: BibleLocale, version: string, signal?: AbortSignal) => (await get<Wrapped<BibleChapterContent>>(`/chapters/${encodeURIComponent(chapterId)}?${q(locale, version)}`, signal)).data,
  translation: async (locale: BibleLocale, version: string, signal?: AbortSignal) => (await get<Wrapped<BibleTranslation>>(`/translation?${q(locale, version)}`, signal)).data,
  passage: (id: string, locale: BibleLocale, version: string, signal?: AbortSignal) => get<BiblePassage>(`/passages/${encodeURIComponent(id)}?${q(locale, version)}`, signal),
};
