export type BibleLocale = 'en' | 'fr';
export type BibleBook = { id: string; name: string; abbreviation?: string };
export type BibleChapter = { id: string; number: string; reference?: string };
export type BibleChapterContent = { id: string; reference: string; content: string; copyright?: string; bibleId?: string };
export type BibleTranslation = { id: string; name: string; abbreviation?: string; language?: { id?: string; name?: string }; copyright?: string; info?: string };
export type BiblePassage = { reference: string; text: string; translation: string; copyright: string | null; provider: string };
type Wrapped<T> = { data: T };

const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '').replace(/\/api\/v1$/, '');
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${base}/api/v1/bible-content${path}`, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Scripture request failed (HTTP ${res.status})`);
  return res.json() as Promise<T>;
}
export const bibleApi = {
  books: async (locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleBook[]>>(`/books?locale=${locale}`, signal)).data,
  chapters: async (bookId: string, locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleChapter[]>>(`/books/${encodeURIComponent(bookId)}/chapters?locale=${locale}`, signal)).data,
  chapter: async (chapterId: string, locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleChapterContent>>(`/chapters/${encodeURIComponent(chapterId)}?locale=${locale}`, signal)).data,
  translation: async (locale: BibleLocale, signal?: AbortSignal) => (await get<Wrapped<BibleTranslation>>(`/translation?locale=${locale}`, signal)).data,
  passage: (id: string, locale: BibleLocale, signal?: AbortSignal) => get<BiblePassage>(`/passages/${encodeURIComponent(id)}?locale=${locale}`, signal),
};
