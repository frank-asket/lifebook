import { api } from './api';

export const PRAYER_LIMITS = { body: 5000, title: 120, answerNote: 1000 };
export type PrayerSummary = { id: string; title: string | null; preview: string; answeredAt: string | null; createdAt: string; updatedAt: string };
export type Prayer = { id: string; title: string | null; body: string; answeredAt: string | null; answerNote: string | null; createdAt: string; updatedAt: string };

export const prayerApi = {
  list: (token: string, signal?: AbortSignal) => api<PrayerSummary[]>('/prayers', token, { signal }),
  get: (token: string, id: string, signal?: AbortSignal) => api<Prayer>(`/prayers/${encodeURIComponent(id)}`, token, { signal }),
  create: (token: string, input: { title?: string; body: string }) => api<Prayer>('/prayers', token, { method: 'POST', body: JSON.stringify(input) }),
  update: (token: string, id: string, input: { title?: string; body?: string }) => api<Prayer>(`/prayers/${encodeURIComponent(id)}`, token, { method: 'PUT', body: JSON.stringify(input) }),
  answer: (token: string, id: string, answered: boolean, note?: string) => api<Prayer>(`/prayers/${encodeURIComponent(id)}/answer`, token, { method: 'PUT', body: JSON.stringify(answered ? { answered, note } : { answered }) }),
  remove: (token: string, id: string) => api<{ deleted: boolean }>(`/prayers/${encodeURIComponent(id)}`, token, { method: 'DELETE' }),
  removeAll: (token: string) => api<{ deleted: number }>('/prayers/delete-all', token, { method: 'POST', body: JSON.stringify({ confirm: 'DELETE_ALL_PRAYERS' }) }),
};
