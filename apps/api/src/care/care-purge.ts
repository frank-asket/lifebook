import type { Prisma } from '@prisma/client';

export const UNCLAIMED_CLOSE_DAYS = 30;
const RETENTION_DAYS = 90;
const DAY = 86400000;

/**
 * Applies the pastoral care retention rules. Dry run unless apply is true; returns counts only.
 * - Requests no pastor took within 30 days are closed (the member sees why) and get the normal 90-day date.
 * - Closed requests past their deletion date are deleted with every message.
 * - Resolved reports past their deletion date are deleted.
 */
export async function purgeCare(db: Prisma.TransactionClient, { apply = false, now = new Date() } = {}) {
  const unclaimedBefore = new Date(now.getTime() - UNCLAIMED_CLOSE_DAYS * DAY);
  const expired = { status: 'CLOSED' as const, deleteAfter: { lt: now } };
  const oldReports = { status: 'RESOLVED' as const, deleteAfter: { lt: now } };
  const unclaimed = { status: 'OPEN' as const, createdAt: { lt: unclaimedBefore } };
  const counts = {
    unclaimedClosed: await db.careRequest.count({ where: unclaimed }),
    requestsDeleted: await db.careRequest.count({ where: expired }),
    messagesDeleted: await db.careMessage.count({ where: { request: expired } }),
    reportsDeleted: await db.careReport.count({ where: oldReports }),
  };
  if (!apply) return { applied: false, ...counts };
  await db.careRequest.updateMany({ where: unclaimed, data: { status: 'CLOSED', closedAt: now, closedBy: 'system', deleteAfter: new Date(now.getTime() + RETENTION_DAYS * DAY) } });
  await db.careRequest.deleteMany({ where: expired });
  await db.careReport.deleteMany({ where: oldReports });
  return { applied: true, ...counts };
}
