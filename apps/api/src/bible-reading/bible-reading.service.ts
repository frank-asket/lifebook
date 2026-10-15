import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@clerk/backend';

export type ReadingLocale = 'en' | 'fr';
export const READING_PLANS = [
  { id: 'discover-jesus', duration: 21, title: { en: 'Discover Jesus', fr: 'Découvrir Jésus' }, description: { en: 'Meet Jesus through the Gospels.', fr: 'Rencontrez Jésus dans les Évangiles.' }, readings: ['LUK.1','LUK.2','LUK.3','LUK.4','LUK.5','LUK.6','LUK.7','LUK.8','LUK.9','LUK.10','LUK.11','LUK.12','LUK.13','LUK.14','LUK.15','LUK.16','LUK.17','LUK.18','LUK.19','LUK.20','LUK.21'] },
  { id: 'foundations-of-faith', duration: 14, title: { en: 'Foundations of Faith', fr: 'Fondements de la foi' }, description: { en: 'Explore grace, prayer, and life in Christ.', fr: 'Explorez la grâce, la prière et la vie en Christ.' }, readings: ['JHN.1','JHN.3','JHN.4','JHN.6','JHN.10','JHN.14','JHN.15','ROM.3','ROM.5','ROM.8','EPH.2','EPH.4','PHP.4','JAS.1'] },
  { id: 'walking-with-god', duration: 30, title: { en: 'Walking with God', fr: 'Marcher avec Dieu' }, description: { en: 'Build a steady rhythm in Scripture.', fr: 'Développez une lecture régulière des Écritures.' }, readings: Array.from({ length: 30 }, (_, i) => `PSA.${i + 1}`) },
] as const;

@Injectable()
export class BibleReadingService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  async onModuleDestroy() { await this.db.$disconnect(); }

  async userId(auth?: string): Promise<string> {
    if (!auth?.startsWith('Bearer ')) throw new BadRequestException('Authorization bearer token required');
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new BadRequestException('Authentication is not configured');
    const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || '').split(',').map(s => s.trim()).filter(Boolean);
    let subject: string;
    try {
      const claims = await verifyToken(auth.slice(7).trim(), { secretKey, ...(authorizedParties.length ? { authorizedParties } : {}) });
      if (!claims.sub) throw new Error('No subject');
      subject = claims.sub;
    } catch { throw new BadRequestException('Invalid session token'); }
    const user = await this.db.user.upsert({ where: { oidcSubject: subject }, create: { oidcSubject: subject }, update: {} });
    return user.id;
  }
  private locale(value?: string): ReadingLocale { return value === 'fr' ? 'fr' : 'en'; }
  private chapter(value: string) {
    if (!/^[A-Z0-9]{3}\.(?:[1-9][0-9]{0,2})$/.test(value)) throw new BadRequestException('Invalid chapter identifier');
    return value;
  }
  private plan(id: string) {
    const found = READING_PLANS.find(p => p.id === id);
    if (!found) throw new NotFoundException('Reading plan not found');
    return found;
  }
  plans(locale?: string) {
    const lang = this.locale(locale);
    return READING_PLANS.map(p => ({ id: p.id, title: p.title[lang], description: p.description[lang], duration: p.duration }));
  }
  planDetails(id: string, locale?: string) {
    const p = this.plan(id); const lang = this.locale(locale);
    return { id: p.id, title: p.title[lang], description: p.description[lang], duration: p.duration, days: p.readings.map((chapterId, index) => ({ day: index + 1, chapterId })) };
  }
  async history(auth?: string) {
    const userId = await this.userId(auth);
    return this.db.bibleReadingHistory.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 30 });
  }
  async saveHistory(auth: string | undefined, input: { locale: string; chapterId: string; verse?: number }) {
    const userId = await this.userId(auth);
    const locale = this.locale(input.locale);
    const chapterId = this.chapter(input.chapterId);
    const verse = input.verse === undefined ? null : input.verse;
    if (verse !== null && (!Number.isInteger(verse) || verse < 1 || verse > 200)) throw new BadRequestException('Invalid verse');
    return this.db.bibleReadingHistory.upsert({ where: { userId_locale_chapterId: { userId, locale, chapterId } }, create: { userId, locale, chapterId, verse }, update: { verse, updatedAt: new Date() } });
  }
  async continueReading(auth?: string) {
    const userId = await this.userId(auth);
    return this.db.bibleReadingHistory.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  }
  async enroll(auth: string | undefined, id: string) {
    const userId = await this.userId(auth); this.plan(id);
    return this.db.bibleReadingPlanEnrollment.upsert({ where: { userId_planId: { userId, planId: id } }, create: { userId, planId: id }, update: {} });
  }
  async myPlans(auth: string | undefined, locale?: string) {
    const userId = await this.userId(auth);
    const rows = await this.db.bibleReadingPlanEnrollment.findMany({ where: { userId }, include: { completions: { select: { day: true, completedAt: true } } }, orderBy: { startedAt: 'desc' } });
    return rows.map(row => ({ ...row, plan: this.planDetails(row.planId, locale), completedDays: row.completions.length }));
  }
  async completeDay(auth: string | undefined, enrollmentId: string, day: number) {
    const userId = await this.userId(auth);
    const enrollment = await this.db.bibleReadingPlanEnrollment.findFirst({ where: { id: enrollmentId, userId } });
    if (!enrollment) throw new NotFoundException('Reading plan enrollment not found');
    const plan = this.plan(enrollment.planId);
    if (!Number.isInteger(day) || day < 1 || day > plan.duration) throw new BadRequestException('Invalid plan day');
    return this.db.bibleReadingPlanDayCompletion.upsert({ where: { enrollmentId_day: { enrollmentId, day } }, create: { enrollmentId, day }, update: {} });
  }
}
