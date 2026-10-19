export type Teaching = { id: string; title: string; description: string | null; kind: 'audio' | 'video'; locale: 'en' | 'fr'; speaker: string; attribution: string; transcript: string; mediaUrl: string; publishedAt: string };
export type TeachingPage = { items: Teaching[]; total: number; page: number; pageSize: number };
export type TeachingDraft = Teaching & { mediaKey: string; approvedAt: string | null; rightsReference: string | null };
