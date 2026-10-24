import { api } from './api';

export type SearchKind = 'scripture' | 'plans' | 'studies' | 'pathways' | 'teachings' | 'meditations';
export type SearchItem = { id: string; title: string; subtitle: string | null; href: string };
export type SearchSection = { kind: SearchKind; status: 'ok' | 'unavailable'; items: SearchItem[] };
export type SearchResult = { query: string; locale: 'en' | 'fr'; go: { label: string; href: string } | null; sections: SearchSection[] };

/** One search across published content: a passage reference, Scripture, plans, studies, pathways, teachings, meditations. */
export const searchApi = {
  search: (q: string, locale: 'en' | 'fr', signal?: AbortSignal) => api<SearchResult>(`/search?q=${encodeURIComponent(q)}&locale=${locale}`, null, { signal }),
};

export const SECTION_TITLES: Record<SearchKind, [string, string]> = {
  scripture: ['Scripture', 'Écritures'],
  plans: ['Reading plans', 'Plans de lecture'],
  studies: ['Bible studies', 'Études bibliques'],
  pathways: ['My Journey pathways', 'Parcours « Mon parcours »'],
  teachings: ['LivingWord teachings', 'Enseignements LivingWord'],
  meditations: ['Meditations', 'Méditations'],
};

/** Total visible results, counting the "Go to" passage. */
export function resultCount(result: SearchResult): number {
  return (result.go ? 1 : 0) + result.sections.reduce((n, s) => n + s.items.length, 0);
}
