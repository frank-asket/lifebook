import { api } from './api';
import type { ReportCategory } from './care-api';

export type Overview = {
  openReports: number; overdueReports: number;
  waitingTooLong: { topic: string; language: string; waitingHours: number }[];
  pastors: { slug: string; displayName: string; languages: string[]; acceptingRequests: boolean; active: boolean; suspended: boolean; status: string; openCases: number }[];
  recentActions: { action: string; createdAt: string; reportId: string | null }[];
};
export type ReportSummary = { id: string; category: ReportCategory; reporterRole: 'member' | 'pastor'; status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'; createdAt: string; acknowledgedAt: string | null; resolvedAt: string | null; sharedConversation: boolean; aboutPastor: { displayName: string; slug: string } | null; overdue: boolean };
export type ReportDetail = Omit<ReportSummary, 'sharedConversation' | 'overdue'> & { details: string; transcript: { from: string; at: string; text: string }[] | null; resolution: string | null };

const post = (body?: unknown) => ({ method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) });
export const safeguardingApi = {
  overview: (token: string, signal?: AbortSignal) => api<Overview>('/safeguarding/overview', token, { signal }),
  reports: (token: string, signal?: AbortSignal) => api<ReportSummary[]>('/safeguarding/reports', token, { signal }),
  report: (token: string, id: string) => api<ReportDetail>(`/safeguarding/reports/${encodeURIComponent(id)}`, token),
  acknowledge: (token: string, id: string) => api<ReportDetail>(`/safeguarding/reports/${encodeURIComponent(id)}/acknowledge`, token, post()),
  resolve: (token: string, id: string, resolution: string) => api<ReportDetail>(`/safeguarding/reports/${encodeURIComponent(id)}/resolve`, token, post({ resolution })),
  suspend: (token: string, slug: string, reason: string) => api<{ releasedConversations: number }>(`/safeguarding/pastors/${encodeURIComponent(slug)}/suspend`, token, post({ reason })),
  reinstate: (token: string, slug: string) => api<unknown>(`/safeguarding/pastors/${encodeURIComponent(slug)}/reinstate`, token, post()),
};
