import { api } from './api';

export type Pastor = { slug: string; displayName: string; bio: string; languages: string[]; church: string | null; ministryRole: string | null; country: string | null };

export const pastorsApi = {
  list: (signal?: AbortSignal) => api<Pastor[]>('/pastors', null, { signal }),
  get: (slug: string, signal?: AbortSignal) => api<Pastor>(`/pastors/${encodeURIComponent(slug)}`, null, { signal }),
};

const languageNames: Record<string, [string, string]> = {
  en: ['English', 'Anglais'], fr: ['French', 'Français'], tw: ['Twi', 'Twi'], ak: ['Akan', 'Akan'], ga: ['Ga', 'Ga'],
  ee: ['Ewe', 'Ewe'], ha: ['Hausa', 'Haoussa'], dag: ['Dagbani', 'Dagbani'], fat: ['Fante', 'Fante'],
};
const countryNames: Record<string, [string, string]> = { GH: ['Ghana', 'Ghana'], FR: ['France', 'France'] };

export function languageLabel(code: string, ui: 'en' | 'fr') { return languageNames[code]?.[ui === 'fr' ? 1 : 0] ?? code.toUpperCase(); }
export function countryLabel(code: string | null, ui: 'en' | 'fr') { return code ? countryNames[code]?.[ui === 'fr' ? 1 : 0] ?? code : null; }
