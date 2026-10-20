import { api } from './api';

export const CARE_TOPICS = ['prayer', 'grief', 'family', 'faith', 'relationships', 'work', 'health', 'loneliness', 'other'] as const;
export type CareTopic = typeof CARE_TOPICS[number];
export type CareSummary = { id: string; topic: CareTopic; language: string; status: 'OPEN' | 'CLAIMED' | 'CLOSED'; createdAt: string; claimedAt: string | null; closedAt: string | null; pastor: string | null; unread: boolean };
export type CareThread = {
  id: string; topic: CareTopic; language: string; status: 'OPEN' | 'CLAIMED' | 'CLOSED'; contactPreference: 'messages' | 'callback';
  createdAt: string; claimedAt: string | null; closedAt: string | null; closedBy: 'member' | 'pastor' | 'system' | null;
  name: string | null; phone: string | null; message: string; pastor: { displayName: string; slug: string } | null;
  messages: { id: string; from: 'member' | 'pastor'; text: string; createdAt: string }[];
};
export type QueueItem = { id: string; topic: CareTopic; language: string; contactPreference: 'messages' | 'callback'; createdAt: string };
export type PastorStatus = { active: false } | { active: true; displayName: string; languages: string[]; acceptingRequests: boolean; openCases: number; maxOpenRequests: number };

export const REPORT_CATEGORIES = ['safety', 'conduct', 'money', 'pressure', 'other'] as const;
export type ReportCategory = typeof REPORT_CATEGORIES[number];
export type ReportInput = { category: ReportCategory; details: string; shareConversation: boolean };
const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });
export function createCareApi(request: typeof api) { return {
  create: (token: string, input: { topic: CareTopic; language: string; contactPreference: 'messages' | 'callback'; name?: string; phone?: string; message: string; consent: true }) => request<CareThread>('/care/requests', token, json(input)),
  mine: (token: string, signal?: AbortSignal) => request<CareSummary[]>('/care/requests', token, { signal }),
  minePage: (token: string, cursor?: string, signal?: AbortSignal) => request<{ items: CareSummary[]; nextCursor: string | null }>(`/care/requests/page${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, token, { signal }),
  get: (token: string, id: string, signal?: AbortSignal) => request<CareThread>(`/care/requests/${encodeURIComponent(id)}`, token, { signal }),
  reply: (token: string, id: string, text: string) => request<CareThread>(`/care/requests/${encodeURIComponent(id)}/messages`, token, json({ text })),
  close: (token: string, id: string) => request<CareThread>(`/care/requests/${encodeURIComponent(id)}/close`, token, { method: 'POST' }),
  remove: (token: string, id: string) => request<{ deleted: boolean }>(`/care/requests/${encodeURIComponent(id)}`, token, { method: 'DELETE' }),
  pastorStatus: (token: string, signal?: AbortSignal) => request<PastorStatus>('/care/pastor/status', token, { signal }),
  setAvailability: (token: string, accepting: boolean) => request<PastorStatus>('/care/pastor/availability', token, { method: 'PUT', body: JSON.stringify({ accepting }) }),
  queue: (token: string, signal?: AbortSignal) => request<QueueItem[]>('/care/pastor/queue', token, { signal }),
  claim: (token: string, id: string) => request<CareThread>(`/care/pastor/queue/${encodeURIComponent(id)}/claim`, token, { method: 'POST' }),
  cases: (token: string, signal?: AbortSignal) => request<CareSummary[]>('/care/pastor/cases', token, { signal }),
  case: (token: string, id: string, signal?: AbortSignal) => request<CareThread>(`/care/pastor/cases/${encodeURIComponent(id)}`, token, { signal }),
  pastorReply: (token: string, id: string, text: string) => request<CareThread>(`/care/pastor/cases/${encodeURIComponent(id)}/messages`, token, json({ text })),
  report: (token: string, id: string, input: ReportInput) => request<{ reported: boolean; sharedConversation: boolean }>(`/care/requests/${encodeURIComponent(id)}/report`, token, json(input)),
  pastorReport: (token: string, id: string, input: ReportInput) => request<{ reported: boolean; sharedConversation: boolean }>(`/care/pastor/cases/${encodeURIComponent(id)}/report`, token, json(input)),
  pastorClose: (token: string, id: string) => request<CareThread>(`/care/pastor/cases/${encodeURIComponent(id)}/close`, token, { method: 'POST' }),
}; }
export const careApi = createCareApi(api);

const topicNames: Record<CareTopic, [string, string]> = {
  prayer: ['Prayer', 'Prière'], grief: ['Grief & loss', 'Deuil et perte'], family: ['Family', 'Famille'], faith: ['Faith questions', 'Questions de foi'],
  relationships: ['Relationships', 'Relations'], work: ['Work & money', 'Travail et finances'], health: ['Health', 'Santé'], loneliness: ['Loneliness', 'Solitude'], other: ['Something else', 'Autre chose'],
};
export function topicLabel(topic: CareTopic, ui: 'en' | 'fr') { return topicNames[topic]?.[ui === 'fr' ? 1 : 0] ?? topic; }
export function statusLabel(status: CareSummary['status'], ui: 'en' | 'fr') {
  const labels = { OPEN: ['Waiting for a pastor', 'En attente d’un pasteur'], CLAIMED: ['In conversation', 'En conversation'], CLOSED: ['Closed', 'Terminée'] } as const;
  return labels[status][ui === 'fr' ? 1 : 0];
}
export function waited(since: string, ui: 'en' | 'fr') {
  const hours = Math.floor((Date.now() - Date.parse(since)) / 3600000);
  if (hours < 1) return ui === 'fr' ? 'il y a moins d’une heure' : 'less than an hour ago';
  if (hours < 48) return ui === 'fr' ? `il y a ${hours} h` : `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return ui === 'fr' ? `il y a ${days} jours` : `${days} days ago`;
}
const reportNames: Record<ReportCategory, [string, string]> = {
  safety: ['Someone may be unsafe', 'Quelqu’un est peut-être en danger'], conduct: ['Inappropriate behaviour', 'Comportement inapproprié'],
  money: ['Asked for money or gifts', 'Demande d’argent ou de cadeaux'], pressure: ['Pressure to join a church or change beliefs', 'Pression pour rejoindre une Église ou changer de croyance'], other: ['Something else', 'Autre chose'],
};
export function reportCategoryLabel(category: ReportCategory, ui: 'en' | 'fr') { return reportNames[category]?.[ui === 'fr' ? 1 : 0] ?? category; }
