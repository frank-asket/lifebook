import { Prisma, PrismaClient } from '@prisma/client';

/** Keep the preference and its transition history atomic, including simultaneous device saves. */
export function saveProfile(db: PrismaClient, userId: string, data: Omit<Prisma.FaithProfileUncheckedCreateInput, 'userId'>) {
  return db.$transaction(async tx => {
    // The User row exists even before the first profile save.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const before = await tx.faithProfile.findUnique({ where: { userId }, select: { personalizationConsent: true, aiProcessingConsent: true } });
    const changes = ([['personalization', 'personalizationConsent'], ['ai_processing', 'aiProcessingConsent']] as const)
      .filter(([, field]) => typeof data[field] === 'boolean' && data[field] !== (before?.[field] ?? false))
      .map(([kind, field]) => ({ userId, kind, granted: data[field] as boolean }));
    const profile = await tx.faithProfile.upsert({
      where: { userId }, create: { userId, learningGoals: [], preferredFormats: [], ...data }, update: data,
    });
    if (changes.length) await tx.consentEvent.createMany({ data: changes });
    return profile;
  });
}
