import { api } from './api';

export const CARE_TOPICS = ['prayer', 'grief', 'family', 'faith', 'relationships', 'work', 'health', 'loneliness', 'other'] as const;
export type CareTopic = typeof CARE_TOPICS[number];
export type CareSummary = { id: string; topic: CareTopic; language: string; status: 'OPEN' | 'CLAIMED' | 'CLOSED'; createdAt: string; claimedAt: string | null; closedAt: string | null; pastor: string | null; unread: boolean };
export type CareThread = {
  id: string; topic: CareTopic; language: string; status: 'OPEN' | 'CLAIMED' | 'CLOSED'; contactPreference: 'messages' | 'callback';
  createdAt: string; claimedAt: string | null; closedAt: string | null; closedBy: 'member' | 'pastor' | null;
  name: string | null; phone: string | null; message: string; pastor: { displayName: string; slug: string } | null;
  messages: { id: string; from: 'member' | 'pastor'; text: string; createdAt: string }[];
};
export type QueueItem = { id: string; topic: CareTopic; language: string; contactPreference: 'messages' | 'callback'; createdAt: string };
export type PastorStatus = { active: false } | { active: true; displayName: string; languages: string[]; acceptingRequests: boolean; openCases: number; maxOpenRequests: number };

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });
export const careApi = {
  create: (token: string, input: { topic: CareTopic; language: string; contactPreference: 'messages' | 'callback'; name?: string; phone?: string; message: string; consent: true }) => api<CareThread>('/care/requests', token, json(input)),
  mine: (token: string, signal?: AbortSignal) => api<CareSummary[]>('/care/requests', token, { signal }),
  get: (token: string, id: string, signal?: AbortSignal) => api<CareThread>(`/care/requests/${encodeURIComponent(id)}`, token, { signal }),
  reply: (token: string, id: string, text: string) => api<CareThread>(`/care/requests/${encodeURIComponent(id)}/messages`, token, json({ text })),
  close: (token: string, id: string) => api<CareThread>(`/care/requests/${encodeURIComponent(id)}/close`, token, { method: 'POST' }),
  remove: (token: string, id: string) => api<{ deleted: boolean }>(`/care/requests/${encodeURIComponent(id)}`, token, { method: 'DELETE' }),
  pastorStatus: (token: string, signal?: AbortSignal) => api<PastorStatus>('/care/pastor/status', token, { signal }),
  setAvailability: (token: string, accepting: boolean) => api<PastorStatus>('/care/pastor/availability', token, { method: 'PUT', body: JSON.stringify({ accepting }) }),
  queue: (token: string, signal?: AbortSignal) => api<QueueItem[]>('/care/pastor/queue', token, { signal }),
  claim: (token: string, id: string) => api<CareThread>(`/care/pastor/queue/${encodeURIComponent(id)}/claim`, token, { method: 'POST' }),
  cases: (token: string, signal?: AbortSignal) => api<CareSummary[]>('/care/pastor/cases', token, { signal }),
  case: (token: string, id: string, signal?: AbortSignal) => api<CareThread>(`/care/pastor/cases/${encodeURIComponent(id)}`, token, { signal }),
  pastorReply: (token: string, id: string, text: string) => api<CareThread>(`/care/pastor/cases/${encodeURIComponent(id)}/messages`, token, json({ text })),
  pastorClose: (token: string, id: string) => api<CareThread>(`/care/pastor/cases/${encodeURIComponent(id)}/close`, token, { method: 'POST' }),
};

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
