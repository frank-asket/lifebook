import { api } from './api';

export const PRAYER_LIMITS = { body: 5000, title: 120, answerNote: 1000 };
export type PrayerSummary = { id: string; title: string | null; preview: string; answeredAt: string | null; createdAt: string; updatedAt: string };
export type Meditation = { locale: 'en' | 'fr'; passages: { id: string; reference: string; text: string; copyright: string | null }[]; reflection: string; questions: string[]; prayer: string; concern: boolean };
export type MeditationResult = { status: 'ok'; meditation: Meditation } | { status: 'crisis'; message: string; contacts: { label: string; number: string }[] };
/** Chosen when the prayer is saved: a passage from the prayer topic library, or helplines when the prayer may signal danger. */
export type PrayerVerse =
  | { status: 'ok'; locale: 'en' | 'fr'; source: 'keywords' | 'ai'; topicId: string; topic: string | null; passage: { id: string; reference: string; text: string; copyright: string | null } }
  | { status: 'crisis'; locale: 'en' | 'fr'; contacts: { label: string; number: string }[] };
export type Prayer = { id: string; title: string | null; body: string; answeredAt: string | null; answerNote: string | null; meditation: Meditation | null; meditationAt: string | null; verse?: PrayerVerse | null; createdAt: string; updatedAt: string };

export const prayerApi = {
  list: (token: string, signal?: AbortSignal) => api<PrayerSummary[]>('/prayers', token, { signal }),
  page: (token: string, cursor?: string, signal?: AbortSignal) => api<{ items: PrayerSummary[]; nextCursor: string | null }>(`/prayers/page${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, token, { signal }),
  get: (token: string, id: string, signal?: AbortSignal) => api<Prayer>(`/prayers/${encodeURIComponent(id)}`, token, { signal }),
  create: (token: string, input: { title?: string; body: string; locale?: 'en' | 'fr'; aiVerse?: boolean }) => api<Prayer>('/prayers', token, { method: 'POST', body: JSON.stringify(input) }),
  update: (token: string, id: string, input: { title?: string; body?: string; locale?: 'en' | 'fr'; aiVerse?: boolean }) => api<Prayer>(`/prayers/${encodeURIComponent(id)}`, token, { method: 'PUT', body: JSON.stringify(input) }),
  answer: (token: string, id: string, answered: boolean, note?: string) => api<Prayer>(`/prayers/${encodeURIComponent(id)}/answer`, token, { method: 'PUT', body: JSON.stringify(answered ? { answered, note } : { answered }) }),
  remove: (token: string, id: string) => api<{ deleted: boolean }>(`/prayers/${encodeURIComponent(id)}`, token, { method: 'DELETE' }),
  meditate: (token: string, id: string, locale: 'en' | 'fr') => api<MeditationResult>(`/prayers/${encodeURIComponent(id)}/meditation`, token, { method: 'POST', body: JSON.stringify({ consent: true, locale }) }),
  clearMeditation: (token: string, id: string) => api<Prayer>(`/prayers/${encodeURIComponent(id)}/meditation`, token, { method: 'DELETE' }),
  removeAll: (token: string) => api<{ deleted: number }>('/prayers/delete-all', token, { method: 'POST', body: JSON.stringify({ confirm: 'DELETE_ALL_PRAYERS' }) }),
};
