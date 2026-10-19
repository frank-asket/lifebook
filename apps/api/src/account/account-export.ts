import { PrismaClient } from '@prisma/client';
import { decryptReflection } from '../security/reflection-crypto';
import { decryptNote } from '../bible-annotations/note-crypto';

export const EXPORT_FORMAT = 'lifebook-data-export/v1';
const UNREADABLE = '[could not be decrypted — contact hello@lifebook.app]';

/** Decrypt one value; an unreadable item is marked instead of failing the whole export. */
const open = (value: string | null | undefined, decrypt: (v: string) => string): string | null => {
  if (value === null || value === undefined) return null;
  try { return decrypt(value); } catch { return UNREADABLE; }
};

/**
 * Everything LifeBook holds about one member, decrypted for that member only (access and portability).
 * Not included: sign-in details held by Clerk, internal reviewer notes, referee details, safety-report transcripts, and other people's records.
 */
export async function exportAccount(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const [profile, prayers, sessions, medReflections, medCompletions, medBookmarks, annotations, history, plans, studies, lessons, care, reports, ai, verification, pastorProfile, learningPaths] = await Promise.all([
    db.faithProfile.findUnique({ where: { userId } }),
    db.prayerEntry.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    db.dailyWordSession.findMany({ where: { userId }, orderBy: { journeyDate: 'asc' }, include: { steps: true, reflection: true } }),
    db.meditationReflection.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    db.meditationCompletion.findMany({ where: { userId }, orderBy: { completedAt: 'asc' } }),
    db.meditationBookmark.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    db.bibleAnnotation.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    db.bibleReadingHistory.findMany({ where: { userId }, orderBy: { updatedAt: 'asc' } }),
    db.bibleReadingPlanEnrollment.findMany({ where: { userId }, orderBy: { startedAt: 'asc' }, include: { completions: true } }),
    db.studyEnrollment.findMany({ where: { userId }, orderBy: { startedAt: 'asc' } }),
    db.studyLessonCompletion.findMany({ where: { userId }, orderBy: { completedAt: 'asc' } }),
    db.careRequest.findMany({ where: { memberId: userId }, orderBy: { createdAt: 'asc' }, include: { messages: { orderBy: { createdAt: 'asc' } } } }),
    db.careReport.findMany({ where: { reporterId: userId }, orderBy: { createdAt: 'asc' } }),
    db.aiUsage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    db.ministryVerification.findUnique({ where: { userId }, select: {
      status: true, reviewedAt: true, churchName: true, ministryRole: true, country: true,
      trainingCourse: true, trainingCompletedAt: true, codeOfConductSignedAt: true,
      suspendedAt: true, createdAt: true, updatedAt: true,
    } }),
    db.pastorProfile.findUnique({ where: { userId }, select: {
      slug: true, displayName: true, bio: true, languages: true, acceptingRequests: true,
      maxOpenRequests: true, createdAt: true, updatedAt: true,
    } }),
    db.enrollment.findMany({ where: { userId }, orderBy: { startedAt: 'asc' }, select: { pathId: true, startedAt: true } }),
  ]);
  const prayerOpen = (field: string, p: { id: string }, v: string | null) => open(v, x => decryptReflection(x, `prayer:${field}:${userId}:${p.id}`));
  return {
    format: EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    notes: 'Your sign-in details (name, email) are held by Clerk and can be seen in your account menu. Safety reports list only what you wrote. Internal reviewer notes and referee details are excluded.',
    account: { id: user.id, role: user.role, createdAt: user.createdAt },
    ministryVerification: verification,
    pastorProfile,
    learningPaths,
    profile: profile && { journey: profile.journey, language: profile.language, learningGoals: profile.learningGoals, preferredFormats: profile.preferredFormats, personalizationConsent: profile.personalizationConsent, aiProcessingConsent: profile.aiProcessingConsent, updatedAt: profile.updatedAt },
    prayers: prayers.map(p => ({
      title: prayerOpen('title', p, p.titleCiphertext), body: prayerOpen('body', p, p.ciphertext),
      answeredAt: p.answeredAt, answerNote: prayerOpen('answer', p, p.answerNoteCiphertext),
      guidedMeditation: (() => { const m = prayerOpen('meditation', p, p.meditationCiphertext ?? null); if (!m || m === UNREADABLE) return m; try { return JSON.parse(m) as unknown; } catch { return m; } })(),
      createdAt: p.createdAt, updatedAt: p.updatedAt,
    })),
    dailyWord: sessions.map(s => ({
      date: s.journeyDate.toISOString().slice(0, 10), passage: s.passageKey, status: s.status, completedAt: s.completedAt,
      stepsDone: s.steps.map(x => x.step), reflection: open(s.reflection?.content, v => decryptReflection(v, `daily-word:${userId}:${s.id}`)),
    })),
    meditations: {
      reflections: medReflections.map(r => ({ meditationId: r.meditationId, text: open(r.text, v => decryptReflection(v, `meditation:${userId}:${r.meditationId}`)), updatedAt: r.updatedAt })),
      completed: medCompletions.map(c => ({ meditationId: c.meditationId, completedAt: c.completedAt })),
      bookmarked: medBookmarks.map(b => ({ meditationId: b.meditationId, createdAt: b.createdAt })),
    },
    bible: {
      notesAndHighlights: annotations.map(a => ({ passage: a.passageId, locale: a.locale, bookmarked: a.bookmarked, highlight: a.highlight, note: open(a.noteCiphertext, decryptNote), updatedAt: a.updatedAt })),
      readingHistory: history.map(h => ({ chapter: h.chapterId, locale: h.locale, verse: h.verse, lastRead: h.updatedAt })),
      readingPlans: plans.map(p => ({ plan: p.planId, startedAt: p.startedAt, daysCompleted: p.completions.map(c => c.day).sort((a, b) => a - b) })),
      studies: studies.map(s => ({ seriesId: s.seriesId, startedAt: s.startedAt })),
      lessonsCompleted: lessons.map(l => ({ lessonId: l.lessonId, completedAt: l.completedAt })),
    },
    pastoralCare: care.map(r => {
      const ctx = (field: string, messageId = '') => (v: string) => decryptReflection(v, `care:${field}:${r.memberId}:${r.id}:${messageId}`);
      return {
        topic: r.topic, language: r.language, contactPreference: r.contactPreference, status: r.status, createdAt: r.createdAt, closedAt: r.closedAt, deleteAfter: r.deleteAfter,
        name: open(r.nameCiphertext, ctx('name')), phone: open(r.phoneCiphertext, ctx('phone')), request: open(r.messageCiphertext, ctx('request')),
        messages: r.messages.map(m => ({ from: m.senderRole, text: open(m.ciphertext, ctx('message', m.id)), at: m.createdAt })),
      };
    }),
    safetyReportsYouMade: reports.map(r => ({ category: r.category, status: r.status, createdAt: r.createdAt, resolvedAt: r.resolvedAt, details: open(r.detailsCiphertext, v => decryptReflection(v, `care-report:details:${r.id}`)) })),
    aiRequests: ai.map(a => ({ feature: a.feature, outcome: a.outcome, at: a.createdAt })),
  };
}
