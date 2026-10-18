import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { exportAccount } from './account-export';

export const DELETE_CONFIRMATION = 'DELETE_MY_ACCOUNT';

/** Who may delete their own account in the app. Staff and approved pastors hold responsibilities for others. */
export function deletionBlocked(user: { role: string }, verificationStatus: string | null): 'role' | 'pastor' | null {
  if (user.role !== 'MEMBER') return 'role';
  if (verificationStatus === 'APPROVED') return 'pastor';
  return null;
}

/**
 * "Delete my account": removes every LifeBook record about the member, then their Clerk sign-in.
 * Kept on purpose: safety reports and safeguarding audit entries, which have their own retention and hold no
 * account link beyond an id. Never logs content.
 */
@Injectable()
export class AccountService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  async onModuleDestroy() { await this.db.$disconnect(); }

  private async subject(auth?: string): Promise<string> {
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Authorization bearer token required');
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new UnauthorizedException('Authentication is not configured');
    const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || '').split(',').map(s => s.trim()).filter(Boolean);
    try {
      const claims = await verifyToken(auth.slice(7).trim(), { secretKey, ...(authorizedParties.length ? { authorizedParties } : {}) });
      if (!claims.sub) throw new Error('No subject');
      return claims.sub;
    } catch { throw new UnauthorizedException('Invalid session token'); }
  }

  /** "Download my data": everything about the signed-in member, decrypted for them. */
  async exportData(auth: string | undefined) {
    const subject = await this.subject(auth);
    const user = await this.db.user.findUnique({ where: { oidcSubject: subject }, select: { id: true } });
    if (!user) throw new NotFoundException('No LifeBook data for this account');
    return exportAccount(this.db, user.id);
  }

  async deleteAccount(auth: string | undefined, confirm: unknown) {
    const subject = await this.subject(auth);
    if (confirm !== DELETE_CONFIRMATION) throw new BadRequestException('Confirmation required');
    const user = await this.db.user.findUnique({ where: { oidcSubject: subject }, include: { verification: { select: { status: true } } } });
    if (user) {
      const blocked = deletionBlocked(user, user.verification?.status ?? null);
      if (blocked) throw new ConflictException(blocked === 'pastor' ? 'Approved pastors need their pastor role closed by the LifeBook team before deleting their account' : 'Staff accounts are deleted by the LifeBook team');
      await this.db.$transaction([
        // No database link to User, so these are removed explicitly.
        this.db.studyLessonCompletion.deleteMany({ where: { userId: user.id } }),
        this.db.studyEnrollment.deleteMany({ where: { userId: user.id } }),
        this.db.aiUsage.deleteMany({ where: { userId: user.id } }),
        // Everything else cascades from User: profile, prayers, reflections, sessions, notes, reading, plans, care requests.
        this.db.user.delete({ where: { id: user.id } }),
      ]);
    }
    let signInRemoved = false;
    try {
      const secretKey = process.env.CLERK_SECRET_KEY as string;
      await createClerkClient({ secretKey }).users.deleteUser(subject);
      signInRemoved = true;
    } catch { /* the data is already gone; the person can delete the Clerk login from their account menu */ }
    return { deleted: true, signInRemoved };
  }
}
