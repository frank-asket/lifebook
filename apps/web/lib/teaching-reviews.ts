export type TeachingReviewDraft = {
  id: string; sourceUrl: string; channelId: string; title: string; speaker: string;
  attribution: string; rightsReference: string; reviewNotes: string; locale: string;
  revision: number; creatorId: string; updatedById: string; createdAt: string; updatedAt: string;
};
export function reviewPayload(row: TeachingReviewDraft) {
  const { revision, title, speaker, attribution, rightsReference, reviewNotes, locale } = row;
  return { revision, title, speaker, attribution, rightsReference, reviewNotes, locale };
}
