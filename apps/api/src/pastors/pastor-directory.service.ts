import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { isActivePastor } from './pastor-admin';

// Only these fields ever leave the API: no user id, email, reference or review notes.
const publicSelect = { slug: true, displayName: true, bio: true, languages: true, user: { select: { verification: { select: { status: true, trainingCompletedAt: true, codeOfConductSignedAt: true, suspendedAt: true, churchName: true, ministryRole: true, country: true } } } } } as const;
type Row = { slug: string; displayName: string; bio: string; languages: string[]; user: { verification: { status: string; trainingCompletedAt: Date | null; codeOfConductSignedAt: Date | null; suspendedAt: Date | null; churchName: string | null; ministryRole: string | null; country: string | null } | null } };

@Injectable()
export class PastorDirectoryService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  async onModuleDestroy() { await this.db.$disconnect(); }

  private present(row: Row) {
    const v = row.user.verification!;
    return { slug: row.slug, displayName: row.displayName, bio: row.bio, languages: row.languages, church: v.churchName, ministryRole: v.ministryRole, country: v.country };
  }

  async list() {
    const rows = await this.db.pastorProfile.findMany({
      where: { user: { verification: { status: 'APPROVED', trainingCompletedAt: { not: null }, codeOfConductSignedAt: { not: null }, suspendedAt: null } } },
      orderBy: { displayName: 'asc' }, select: publicSelect, take: 200,
    });
    // The query and isActivePastor must agree; filter again so one rule decides.
    return (rows as Row[]).filter(r => isActivePastor(r.user.verification)).map(r => this.present(r));
  }

  async get(slug: string) {
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) throw new NotFoundException('Pastor not found');
    const row = await this.db.pastorProfile.findUnique({ where: { slug }, select: publicSelect }) as Row | null;
    if (!row || !isActivePastor(row.user.verification)) throw new NotFoundException('Pastor not found');
    return this.present(row);
  }
}
