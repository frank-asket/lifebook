import type { Prisma } from '@prisma/client';
/** Legacy undated publications stay readable; drafts and future schedules never enter member libraries. */
export function publishedMeditations(): Prisma.MeditationWhereInput {
  return { isPublished: true, OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] };
}
