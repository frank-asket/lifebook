import { api } from './api';
export type ReadingHistory = { id: string; locale: 'en' | 'fr'; chapterId: string; verse: number | null; updatedAt: string };
export type Plan = { id: string; title: string; description: string; duration: number };
export type PlanDetails = Plan & { days: { day: number; chapterId: string }[] };
export type Enrollment = { id: string; planId: string; completedDays: number; completions: { day: number; completedAt: string }[]; plan: PlanDetails };
export const readingApi = {
  history: (token: string | null) => api<ReadingHistory[]>('/bible-reading/history', token),
  latest: (token: string | null) => api<ReadingHistory | null>('/bible-reading/continue', token),
  save: (token: string | null, locale: 'en' | 'fr', chapterId: string, verse?: number) => api<ReadingHistory>('/bible-reading/history', token, { method: 'PUT', body: JSON.stringify({ locale, chapterId, ...(verse ? { verse } : {}) }) }),
  plans: (locale: 'en' | 'fr') => api<Plan[]>(`/bible-reading/plans?locale=${locale}`),
  plan: (id: string, locale: 'en' | 'fr') => api<PlanDetails>(`/bible-reading/plans/${encodeURIComponent(id)}?locale=${locale}`),
  mine: (token: string | null, locale: 'en' | 'fr') => api<Enrollment[]>(`/bible-reading/my-plans?locale=${locale}`, token),
  enroll: (token: string | null, id: string) => api<Enrollment>(`/bible-reading/plans/${encodeURIComponent(id)}/enroll`, token, { method: 'POST' }),
  complete: (token: string | null, enrollmentId: string, day: number) => api<{ id: string }>(`/bible-reading/enrollments/${encodeURIComponent(enrollmentId)}/complete-day`, token, { method: 'POST', body: JSON.stringify({ day }) }),
};
