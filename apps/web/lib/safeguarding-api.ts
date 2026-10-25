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

export type Application = {
  slug: string | null; displayName: string | null; bio: string | null; languages: string[]; status: 'PENDING' | 'APPROVED' | 'REJECTED';
  active: boolean; suspended: boolean; self: boolean; churchName: string | null; ministryRole: string | null; country: string | null;
  referenceName: string | null; referenceContact: string | null; trainingCourse: string | null; trainingCompletedOn: string | null;
  codeOfConductSignedOn: string | null; reviewerNotes: string | null; submittedAt: string; updatedAt: string; reviewedAt: string | null;
};

const post = (body?: unknown) => ({ method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) });
export const safeguardingApi = {
  overview: (token: string, signal?: AbortSignal) => api<Overview>('/safeguarding/overview', token, { signal }),
  reports: (token: string, signal?: AbortSignal) => api<ReportSummary[]>('/safeguarding/reports', token, { signal }),
  report: (token: string, id: string) => api<ReportDetail>(`/safeguarding/reports/${encodeURIComponent(id)}`, token),
  acknowledge: (token: string, id: string) => api<ReportDetail>(`/safeguarding/reports/${encodeURIComponent(id)}/acknowledge`, token, post()),
  resolve: (token: string, id: string, resolution: string) => api<ReportDetail>(`/safeguarding/reports/${encodeURIComponent(id)}/resolve`, token, post({ resolution })),
  suspend: (token: string, slug: string, reason: string) => api<{ releasedConversations: number }>(`/safeguarding/pastors/${encodeURIComponent(slug)}/suspend`, token, post({ reason })),
  applications: (token: string, signal?: AbortSignal) => api<Application[]>('/safeguarding/applications', token, { signal }),
  approve: (token: string, slug: string) => api<unknown>(`/safeguarding/applications/${encodeURIComponent(slug)}/approve`, token, post()),
  reject: (token: string, slug: string, notes: string) => api<unknown>(`/safeguarding/applications/${encodeURIComponent(slug)}/reject`, token, post({ notes })),
  reinstate: (token: string, slug: string) => api<unknown>(`/safeguarding/pastors/${encodeURIComponent(slug)}/reinstate`, token, post()),
};
