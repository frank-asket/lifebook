import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StudyMethod } from '@prisma/client';
import { createHash } from 'node:crypto';
import { database } from '../common/database';
import { BibleReadingService } from '../bible-reading/bible-reading.service';
import { contentKind, ContentKind, editorialInput } from './editorial-input';
const revisionOf = (row: unknown) => createHash('sha256').update(JSON.stringify(row)).digest('hex');
@Injectable()
export class EditorialService {
  private readonly db = database;
  constructor(private readonly identity: BibleReadingService) {}
  async requireEditor(auth?: string) {
    const id = await this.identity.userId(auth);
    const user = await this.db.user.findUnique({ where: { id }, select: { role: true } });
    if (!user || !['MODERATOR', 'ADMIN'].includes(user.role)) throw new ForbiddenException('Only LifeBook moderators and administrators can edit content');
  }
  private async record(tx: Prisma.TransactionClient, kind: ContentKind, id: string) {
    const row = kind === 'meditations' ? await tx.meditation.findUnique({ where: { id } }) : kind === 'studies' ? await tx.studySeries.findUnique({ where: { id }, include: { lessons: { orderBy: { position: 'asc' } } } }) : await tx.learningPath.findUnique({ where: { id }, include: { lessons: { orderBy: { position: 'asc' } } } });
    if (!row) throw new NotFoundException('Editorial content not found');
    return { ...row, revision: revisionOf(row) };
  }
  async list(auth: string | undefined, rawKind: string) {
    await this.requireEditor(auth); const kind = contentKind(rawKind);
    const select = { id: true, title: true, slug: true };
    if (kind === 'meditations') return this.db.meditation.findMany({ take: 100, orderBy: { updatedAt: 'desc' }, select: { ...select, locale: true, isPublished: true, publishDate: true } });
    if (kind === 'studies') return this.db.studySeries.findMany({ take: 100, orderBy: { updatedAt: 'desc' }, select: { ...select, locale: true, status: true } });
    return this.db.learningPath.findMany({ take: 100, orderBy: { title: 'asc' }, select: { ...select, isPublished: true } });
  }
  async details(auth: string | undefined, rawKind: string, id: string) {
    await this.requireEditor(auth); return this.record(this.db, contentKind(rawKind), id);
  }
  async save(auth: string | undefined, rawKind: string, id: string | undefined, raw: unknown) {
    await this.requireEditor(auth); const kind = contentKind(rawKind); const input = editorialInput(kind, raw);
    if (id && !input.revision) throw new BadRequestException('Load the current revision before editing');
    try {
      return await this.db.$transaction(async tx => {
        const old = id ? await this.record(tx, kind, id) : null;
        if (old && old.revision !== input.revision) throw new ConflictException('Content changed. Reload before saving; your draft has not been applied.');
        const common = { slug: input.slug, title: input.title };
        let savedId: string;
        if ('explanation' in input) {
          const data = { ...common, locale: input.locale, publishDate: input.publishDate ? new Date(input.publishDate) : null, scriptureReference: input.scriptureReference, explanation: input.explanation, questions: input.questions, guidedPrayer: input.guidedPrayer, isPublished: input.publish };
          // Existing licensed Scripture text/translation are left untouched; this editor only writes references.
          savedId = (id ? await tx.meditation.update({ where: { id }, data }) : await tx.meditation.create({ data })).id;
        } else {
          const oldLessons = old && 'lessons' in old ? old.lessons : [];
          // Keep IDs/order stable: removing or replacing lessons would orphan the meaning of saved completions.
          if (input.lessons.length < oldLessons.length || oldLessons.some((lesson, index) => input.lessons[index].id !== lesson.id) || input.lessons.slice(oldLessons.length).some(lesson => lesson.id)) throw new BadRequestException('Existing lessons must stay in order; edit them or append new lessons');
          if ('method' in input) {
            const data = { ...common, description: input.description, locale: input.locale, method: input.method as StudyMethod, difficulty: input.difficulty, status: input.publish ? 'PUBLISHED' as const : 'DRAFT' as const };
            savedId = (id ? await tx.studySeries.update({ where: { id }, data }) : await tx.studySeries.create({ data })).id;
          } else {
            const data = { ...common, description: input.description, isPublished: input.publish };
            savedId = (id ? await tx.learningPath.update({ where: { id }, data }) : await tx.learningPath.create({ data })).id;
          }
          let position = oldLessons.at(-1)?.position ?? 0;
          for (const lesson of input.lessons) {
            if (kind === 'studies') {
              const data = { title: lesson.title, scriptureReference: lesson.scriptureReference!, introduction: lesson.introduction!, historicalContext: lesson.historicalContext, exegesis: lesson.exegesis!, theology: lesson.theology, reflectionQuestions: lesson.reflectionQuestions!, guidedPrayer: lesson.guidedPrayer, application: lesson.application };
              if (lesson.id) await tx.studyLesson.update({ where: { id: lesson.id }, data });
              else await tx.studyLesson.create({ data: { ...data, seriesId: savedId, position: ++position } });
            } else {
              const data = { title: lesson.title, content: lesson.content! };
              if (lesson.id) await tx.lesson.update({ where: { id: lesson.id }, data });
              else await tx.lesson.create({ data: { ...data, pathId: savedId, position: ++position } });
            }
          }
        }
        return this.record(tx, kind, savedId);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) throw new ConflictException('Slug already exists or content changed. Reload before trying again.');
      throw error;
    }
  }
}
