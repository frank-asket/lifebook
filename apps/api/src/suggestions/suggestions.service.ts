import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BibleReadingService, READING_PLANS } from '../bible-reading/bible-reading.service';
import { suggest, type Suggestion } from './suggestion-rules';

/** Gathers only what the rules need: the saved profile, which plans are started, and two counts. */
@Injectable()
export class SuggestionsService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly reading: BibleReadingService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }

  async forUser(auth: string | undefined, localeInput?: string) {
    const userId = await this.reading.userId(auth);
    const locale = localeInput === 'fr' ? 'fr' : 'en';
    const profile = await this.db.faithProfile.findUnique({ where: { userId } });
    if (!profile?.personalizationConsent) return { consent: false, suggestions: [] as ReturnType<SuggestionsService['present']>[] };
    const since = new Date(Date.now() - 7 * 86400000);
    const [enrollments, prayerCount, completedDaysLast7] = await Promise.all([
      this.db.bibleReadingPlanEnrollment.findMany({ where: { userId }, select: { planId: true } }),
      this.db.prayerEntry.count({ where: { userId } }),
      this.db.dailyWordSession.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: since } } }),
    ]);
    const suggestions = suggest({ consent: true, journey: profile.journey ?? null, goals: profile.learningGoals, enrolledPlanIds: enrollments.map(e => e.planId), prayerCount, completedDaysLast7 });
    return { consent: true, suggestions: suggestions.map(s => this.present(s, locale)) };
  }

  /** Adds what the card shows; plan titles come from the reading plans, in the reader's language. */
  present(s: Suggestion, locale: 'en' | 'fr') {
    if (s.kind === 'plan') {
      const plan = READING_PLANS.find(p => p.id === s.planId)!;
      return { ...s, title: plan.title[locale], description: plan.description[locale], duration: plan.duration, href: `/bible/plans/${plan.id}` };
    }
    return { ...s, href: s.kind === 'journal' ? '/prayer' : '/daily-word' };
  }
}
