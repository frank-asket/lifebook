import { api } from './api';

export type Pastor = { slug: string; displayName: string; bio: string; languages: string[]; church: string | null; ministryRole: string | null; country: string | null };

export type ApplicationForm = {
  displayName: string; slug: string; bio: string; languages: string[]; churchName: string; ministryRole: string; country: string;
  referenceName: string; referenceContact: string; trainingCourse: string; trainingCompletedOn: string; codeOfConduct: boolean;
};
export type ApplicationStatus = 'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
/** The applicant's own view. The reference contact is never returned, only whether one is on file. */
export type MyApplication = { status: 'NOT_REQUESTED' } | (Omit<ApplicationForm, 'referenceContact' | 'codeOfConduct'> & {
  status: Exclude<ApplicationStatus, 'NOT_REQUESTED'>; active: boolean; suspended: boolean; hasReferenceContact: boolean;
  codeOfConductSignedOn: string | null; reviewerNotes: string | null; submittedAt: string; updatedAt: string;
});

export const pastorsApi = {
  list: (signal?: AbortSignal) => api<Pastor[]>('/pastors', null, { signal }),
  get: (slug: string, signal?: AbortSignal) => api<Pastor>(`/pastors/${encodeURIComponent(slug)}`, null, { signal }),
  myApplication: (token: string, signal?: AbortSignal) => api<MyApplication>('/pastor-application', token, { signal }),
  apply: (token: string, form: ApplicationForm) => api<MyApplication>('/pastor-application', token, { method: 'PUT', body: JSON.stringify(form) }),
};

/** Shown to applicants before they apply, and summarised on the review page. From docs/PASTORAL_CARE_DESIGN.md. */
export const CODE_OF_CONDUCT: [string, string][] = [
  ['Never ask members for money, gifts or donations.', 'Ne jamais demander d’argent, de cadeaux ou de dons aux membres.'],
  ['No romantic or sexual contact with members.', 'Aucun contact amoureux ou sexuel avec les membres.'],
  ['No pressure to join a church or change denomination.', 'Aucune pression pour rejoindre une Église ou changer de dénomination.'],
  ['Keep what members share confidential.', 'Garder confidentiel ce que les membres partagent.'],
  ['Respect a member’s choice to end contact.', 'Respecter le choix d’un membre de mettre fin au contact.'],
  ['Refer to professionals for medical, legal, psychological or abuse concerns, and report safety concerns to LifeBook.', 'Orienter vers des professionnels pour les questions médicales, juridiques, psychologiques ou d’abus, et signaler les inquiétudes de sécurité à LifeBook.'],
];

const languageNames: Record<string, [string, string]> = {
  en: ['English', 'Anglais'], fr: ['French', 'Français'], tw: ['Twi', 'Twi'], ak: ['Akan', 'Akan'], ga: ['Ga', 'Ga'],
  ee: ['Ewe', 'Ewe'], ha: ['Hausa', 'Haoussa'], dag: ['Dagbani', 'Dagbani'], fat: ['Fante', 'Fante'],
};
const countryNames: Record<string, [string, string]> = { GH: ['Ghana', 'Ghana'], FR: ['France', 'France'] };

export function languageLabel(code: string, ui: 'en' | 'fr') { return languageNames[code]?.[ui === 'fr' ? 1 : 0] ?? code.toUpperCase(); }
export function countryLabel(code: string | null, ui: 'en' | 'fr') { return code ? countryNames[code]?.[ui === 'fr' ? 1 : 0] ?? code : null; }
