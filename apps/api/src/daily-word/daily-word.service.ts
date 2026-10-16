import { encryptReflection, decryptReflection } from '../security/reflection-crypto';
import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { DailyWordStep, DailyWordSessionStatus, PrismaClient } from '@prisma/client';
import { MeditationService } from '../meditation/meditation.service';
const STEPS = Object.values(DailyWordStep);
@Injectable()
export class DailyWordService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly meditation: MeditationService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }
  private date(timezone = 'UTC'): string {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const part = (type: string) => parts.find(p => p.type === type)?.value;
      return `${part('year')}-${part('month')}-${part('day')}`;
    } catch { throw new BadRequestException('Invalid IANA timezone'); }
  }
  private async owner(auth: string, id: string) {
    const userId = await this.meditation.userId(auth);
    const session = await this.db.dailyWordSession.findFirst({ where: { id, userId } });
    if (!session) throw new NotFoundException('Daily Word session not found');
    return session;
  }
  private include = { steps: true, reflection: true } as const;
  private view<T extends { id: string; userId: string; reflection?: { content: string } | null }>(session: T): T {
    return { ...session, reflection: session.reflection ? { ...session.reflection, content: decryptReflection(session.reflection.content, `daily-word:${session.userId}:${session.id}`) } : session.reflection };
  }
  async today(auth: string, timezone?: string) {
    const userId = await this.meditation.userId(auth);
    const day = this.date(timezone || 'UTC');
    const journeyDate = new Date(day + 'T00:00:00.000Z');
    const passageKey = this.meditation.dailyWord('en', day).passageKey;
    const session = await this.db.dailyWordSession.upsert({
      where: { userId_journeyDate: { userId, journeyDate } },
      create: { userId, journeyDate, passageKey },
      update: {}, include: this.include,
    });
    return this.view(session);
  }
  async completeStep(auth: string, id: string, rawStep: string) {
    const session = await this.owner(auth, id);
    if (!STEPS.includes(rawStep as DailyWordStep)) throw new BadRequestException('Unknown Daily Word step');
    const step = rawStep as DailyWordStep;
    const updated = await this.db.$transaction(async tx => {
      await tx.dailyWordStepProgress.upsert({ where: { sessionId_step: { sessionId: session.id, step } }, create: { sessionId: session.id, step }, update: {} });
      const count = await tx.dailyWordStepProgress.count({ where: { sessionId: session.id } });
      return tx.dailyWordSession.update({ where: { id: session.id }, data: count === STEPS.length ? { status: DailyWordSessionStatus.COMPLETED, completedAt: session.completedAt ?? new Date() } : {}, include: this.include });
    });
    return this.view(updated);
  }
  async saveReflection(auth: string, id: string, content: string) {
    const session = await this.owner(auth, id);
    const encrypted = encryptReflection(content, `daily-word:${session.userId}:${session.id}`);
    const row = await this.db.dailyWordReflection.upsert({ where: { sessionId: session.id }, create: { sessionId: session.id, content: encrypted }, update: { content: encrypted } });
    return { ...row, content };
  }
  async history(auth: string, rawLimit?: string) {
    const userId = await this.meditation.userId(auth);
    const limit = rawLimit === undefined ? 20 : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('limit must be an integer from 1 to 100');
    const sessions = await this.db.dailyWordSession.findMany({ where: { userId }, orderBy: { journeyDate: 'desc' }, take: limit, include: this.include });
    return sessions.map(session => this.view(session));
  }
  async stats(auth: string) {
    const userId = await this.meditation.userId(auth);
    const [totalSessions, completedSessions] = await Promise.all([
      this.db.dailyWordSession.count({ where: { userId } }),
      this.db.dailyWordSession.count({ where: { userId, status: DailyWordSessionStatus.COMPLETED } }),
    ]);
    return { totalSessions, completedSessions, inProgressSessions: totalSessions - completedSessions };
  }
}
