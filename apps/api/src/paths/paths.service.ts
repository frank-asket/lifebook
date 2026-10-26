import { database } from '../common/database';
import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { BibleReadingService } from '../bible-reading/bible-reading.service';

@Injectable()
export class PathsService implements OnModuleDestroy {
  private readonly db = database;
  constructor(private readonly identity: BibleReadingService) {}
  async onModuleDestroy() { /* The root Database provider owns the shared pool lifecycle. */ }

  list() {
    return this.db.learningPath.findMany({ where: { isPublished: true }, orderBy: [{ title: 'asc' }, { id: 'asc' }], take: 100,
      select: { id: true, slug: true, title: true, description: true, _count: { select: { lessons: true } } } });
  }
  async details(id: string) {
    const path = await this.db.learningPath.findFirst({ where: { id, isPublished: true },
      select: { id: true, slug: true, title: true, description: true, lessons: { orderBy: { position: 'asc' }, select: { id: true, title: true, position: true, content: true } } } });
    if (!path) throw new NotFoundException('Learning pathway not found');
    return path;
  }
  async state(auth: string | undefined, id: string) {
    const userId = await this.identity.userId(auth);
    await this.details(id);
    return { enrollment: await this.db.enrollment.findUnique({ where: { userId_pathId: { userId, pathId: id } },
      select: { id: true, startedAt: true, completions: { orderBy: { completedAt: 'asc' }, select: { lessonId: true, completedAt: true } } } }) };
  }
  async enroll(auth: string | undefined, id: string) {
    const userId = await this.identity.userId(auth);
    const path = await this.details(id);
    if (!path.lessons.length) throw new BadRequestException('This pathway has no lessons yet');
    // Prisma's upsert can fall back to find-then-create and race; ON CONFLICT DO NOTHING keeps concurrent enrolments harmless.
    await this.db.enrollment.createMany({ data: [{ userId, pathId: id }], skipDuplicates: true });
    return this.state(auth, id);
  }
  async complete(auth: string | undefined, pathId: string, lessonId: string) {
    const userId = await this.identity.userId(auth);
    await this.db.$transaction(async tx => {
      const enrollment = await tx.enrollment.findFirst({ where: { userId, pathId, path: { isPublished: true } }, select: { id: true } });
      const lesson = await tx.lesson.findFirst({ where: { id: lessonId, pathId }, select: { id: true } });
      if (!enrollment || !lesson) throw new NotFoundException('Enrolled pathway lesson not found');
      // The composite key makes repeated/concurrent completion requests harmless.
      await tx.learningLessonCompletion.createMany({ data: [{ enrollmentId: enrollment.id, lessonId }], skipDuplicates: true });
    });
    return this.state(auth, pathId);
  }
}
