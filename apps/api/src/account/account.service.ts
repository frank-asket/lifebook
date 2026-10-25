import { verifiedSubject } from '../common/identity';
import { database } from '../common/database';
import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
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
  private readonly db = database;
  async onModuleDestroy() { /* The root Database provider owns the shared pool lifecycle. */ }

  private subject(auth?: string) { return verifiedSubject(auth); }

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
