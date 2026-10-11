import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class MeditationService {
  private readonly db = new PrismaClient();
  async userId(auth?: string) {
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
    if (!process.env.CLERK_SECRET_KEY) throw new UnauthorizedException('Clerk not configured');
    try {
      const parties = (process.env.CLERK_AUTHORIZED_PARTIES || '').split(',').map(x => x.trim()).filter(Boolean);
      const token = await verifyToken(auth.slice(7), { secretKey: process.env.CLERK_SECRET_KEY, ...(parties.length ? { authorizedParties: parties } : {}) });
      if (!token.sub) throw new Error('No subject');
      const user = await this.db.user.upsert({ where: { oidcSubject: token.sub }, create: { oidcSubject: token.sub }, update: {} });
      return user.id;
    } catch { throw new UnauthorizedException('Invalid token'); }
  }
  async today(locale = 'en') {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    return this.db.meditation.findFirst({ where: { isPublished: true, locale, publishDate: { lte: today } }, orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }] });
  }
  async one(id: string) {
    const item = await this.db.meditation.findFirst({ where: { id, isPublished: true } });
    if (!item) throw new NotFoundException('Meditation not found');
    return item;
  }
  async history(auth?: string) {
    const userId = await this.userId(auth);
    return this.db.meditationCompletion.findMany({ where: { userId }, include: { meditation: true }, orderBy: { completedAt: 'desc' }, take: 100 });
  }
  async saved(auth?: string) {
    const userId = await this.userId(auth);
    return this.db.meditationBookmark.findMany({ where: { userId }, include: { meditation: true }, orderBy: { createdAt: 'desc' } });
  }
  async myState(id: string, auth?: string) {
    const userId = await this.userId(auth); await this.one(id);
    const [reflection, completion, bookmark] = await Promise.all([
      this.db.meditationReflection.findUnique({ where: { userId_meditationId: { userId, meditationId: id } } }),
      this.db.meditationCompletion.findUnique({ where: { userId_meditationId: { userId, meditationId: id } } }),
      this.db.meditationBookmark.findUnique({ where: { userId_meditationId: { userId, meditationId: id } } }),
    ]);
    return { reflection: reflection?.text ?? '', completedAt: completion?.completedAt ?? null, bookmarked: !!bookmark };
  }
  async reflect(id: string, text: string, auth?: string) {
    const userId = await this.userId(auth); await this.one(id);
    return this.db.meditationReflection.upsert({ where: { userId_meditationId: { userId, meditationId: id } }, create: { userId, meditationId: id, text }, update: { text }, select: { updatedAt: true } });
  }
  async complete(id: string, auth?: string) {
    const userId = await this.userId(auth); await this.one(id);
    return this.db.meditationCompletion.upsert({ where: { userId_meditationId: { userId, meditationId: id } }, create: { userId, meditationId: id }, update: {}, select: { completedAt: true } });
  }
  async bookmark(id: string, saved: boolean, auth?: string) {
    const userId = await this.userId(auth); await this.one(id);
    const where = { userId_meditationId: { userId, meditationId: id } };
    if (!saved) { await this.db.meditationBookmark.deleteMany({ where: { userId, meditationId: id } }); return { bookmarked: false }; }
    await this.db.meditationBookmark.upsert({ where, create: { userId, meditationId: id }, update: {} });
    return { bookmarked: true };
  }
}
