import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, StudyMethod } from '@prisma/client';
import { MeditationService } from '../meditation/meditation.service';

@Injectable()
export class BibleStudyService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly meditation: MeditationService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }
  async list(method?: StudyMethod, locale = 'en') {
    return this.db.studySeries.findMany({
      where: { status: 'PUBLISHED', locale: locale === 'fr' ? 'fr' : 'en', ...(method ? { method } : {}) },
      include: { _count: { select: { lessons: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async one(id: string) {
    const series = await this.db.studySeries.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: { lessons: { orderBy: { position: 'asc' } } },
    });
    if (!series) throw new NotFoundException('Bible study not found');
    return series;
  }
  async lesson(id: string) {
    const lesson = await this.db.studyLesson.findFirst({
      where: { id, series: { status: 'PUBLISHED' } },
      include: { series: { select: { id: true, title: true, locale: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
  async enroll(id: string, auth?: string) {
    await this.one(id);
    const userId = await this.meditation.userId(auth);
    return this.db.studyEnrollment.upsert({
      where: { userId_seriesId: { userId, seriesId: id } },
      create: { userId, seriesId: id }, update: {},
    });
  }
  async completeLesson(id: string, auth?: string) {
    const lesson = await this.lesson(id);
    const userId = await this.meditation.userId(auth);
    await this.db.studyEnrollment.upsert({
      where: { userId_seriesId: { userId, seriesId: lesson.series.id } },
      create: { userId, seriesId: lesson.series.id }, update: {},
    });
    return this.db.studyLessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId: id } },
      create: { userId, lessonId: id }, update: {},
    });
  }
  async mine(auth?: string) {
    const userId = await this.meditation.userId(auth);
    const [enrollments, completions] = await Promise.all([
      this.db.studyEnrollment.findMany({ where: { userId, series: { status: 'PUBLISHED' } }, include: { series: { include: { _count: { select: { lessons: true } } } } }, orderBy: { startedAt: 'desc' } }),
      this.db.studyLessonCompletion.findMany({ where: { userId }, select: { lessonId: true, lesson: { select: { seriesId: true } } } }),
    ]);
    return { enrollments, completedLessonIds: completions.map(c => c.lessonId) };
  }
}
