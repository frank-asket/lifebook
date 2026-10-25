import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MeditationService } from '../meditation/meditation.service';
import { decryptReflection } from '../security/reflection-crypto';
import { PastorAdmin, PASTOR_LIMITS, isActivePastor } from './pastor-admin';

const FIELDS = ['displayName', 'slug', 'bio', 'languages', 'churchName', 'ministryRole', 'country', 'referenceName', 'referenceContact', 'trainingCourse', 'trainingCompletedOn', 'codeOfConduct'];
// Slugs that would collide with the web app's own pages under /pastors.
const RESERVED = new Set(['apply', 'application', 'new', 'admin']);

/**
 * A signed-in member applies to serve as a pastor in the care pilot. Applying never activates anyone: a safeguarding
 * lead approves (SafeguardingService.approveApplication), using the same rules as the operator tool.
 */
@Injectable()
export class PastorApplicationService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly meditation: MeditationService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }

  /** The applicant's own view. The reference contact is never sent back, only whether one is on file. */
  async get(auth?: string) {
    const userId = await this.meditation.userId(auth);
    const [v, p] = await Promise.all([this.db.ministryVerification.findUnique({ where: { userId } }), this.db.pastorProfile.findUnique({ where: { userId } })]);
    if (!v || v.status === 'NOT_REQUESTED') return { status: 'NOT_REQUESTED' as const };
    return {
      status: v.status, active: isActivePastor(v), suspended: !!v.suspendedAt,
      displayName: p?.displayName ?? '', slug: p?.slug ?? '', bio: p?.bio ?? '', languages: p?.languages ?? [],
      churchName: v.churchName ?? '', ministryRole: v.ministryRole ?? '', country: v.country ?? '',
      referenceName: v.referenceName ?? '', hasReferenceContact: !!v.referenceContactCiphertext,
      trainingCourse: v.trainingCourse ?? '', trainingCompletedOn: v.trainingCompletedAt?.toISOString().slice(0, 10) ?? '',
      codeOfConductSignedOn: v.codeOfConductSignedAt?.toISOString().slice(0, 10) ?? null,
      reviewerNotes: v.status === 'REJECTED' ? v.reviewerNotes : null,
      submittedAt: v.createdAt, updatedAt: v.updatedAt,
    };
  }

  async submit(auth: string | undefined, body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !FIELDS.includes(k))) throw new BadRequestException('Invalid application');
    const input = body as Record<string, unknown>;
    const userId = await this.meditation.userId(auth);
    if (input.codeOfConduct !== true) throw new BadRequestException('Please read and accept the code of conduct');
    if (typeof input.slug === 'string' && RESERVED.has(input.slug.trim().toLowerCase())) throw new BadRequestException('Choose another web address');
    if (!Array.isArray(input.languages) || !input.languages.every(l => typeof l === 'string')) throw new BadRequestException('Languages must be a list');
    // Checked before anything is saved, so a bad date never leaves a half-saved application.
    const course = typeof input.trainingCourse === 'string' ? input.trainingCourse.trim() : '';
    const completed = typeof input.trainingCompletedOn === 'string' ? input.trainingCompletedOn : '';
    if (!course || course.length > PASTOR_LIMITS.course) throw new BadRequestException(`Training course is required (max ${PASTOR_LIMITS.course} characters)`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(completed) || Number.isNaN(Date.parse(`${completed}T00:00:00Z`)) || Date.parse(`${completed}T00:00:00Z`) > Date.now()) throw new BadRequestException('Training completion date must be a past date (YYYY-MM-DD)');
    const existing = await this.db.ministryVerification.findUnique({ where: { userId } });
    // Editing an application may leave the reference contact blank: the one on file is kept, still encrypted.
    let referenceContact = input.referenceContact;
    if ((referenceContact === undefined || referenceContact === '') && existing?.referenceContactCiphertext) {
      referenceContact = decryptReflection(existing.referenceContactCiphertext, `pastor-reference:${userId}`);
    }
    const admin = new PastorAdmin(this.db);
    try {
      await admin.register(userId, {
        displayName: input.displayName as string, slug: input.slug as string, bio: input.bio as string, languages: input.languages as string[],
        churchName: input.churchName as string, ministryRole: input.ministryRole as string, country: input.country as string,
        referenceName: input.referenceName as string, referenceContact: referenceContact as string,
      });
      await admin.recordTraining(userId, course, completed);
      if (!existing?.codeOfConductSignedAt) await admin.recordConduct(userId, new Date().toISOString().slice(0, 10));
    } catch (error) {
      // PastorAdmin reports validation problems as plain Errors meant for the person filling the form; anything else is ours.
      if (error instanceof Error && error.constructor === Error) throw new BadRequestException(error.message);
      throw error;
    }
    return this.get(auth);
  }
}
