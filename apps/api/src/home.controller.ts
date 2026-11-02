import { Controller, Get, Header, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { database } from '../common/database';
import { verifiedSubject } from '../common/identity';

@ApiTags('home')
@ApiBearerAuth()
@Controller('me/home')
export class HomeController {
  private readonly db = database;

  /** Member-owned summary only. Never infer a faith score or return prayer text. */
  @Get()
  @Header('Cache-Control', 'no-store')
  async summary(@Headers('authorization') authorization?: string) {
    const subject = await verifiedSubject(authorization);
    const user = await this.db.user.upsert({
      where: { oidcSubject: subject },
      create: { oidcSubject: subject },
      update: {},
    });
    const userId = user.id;
    const [prayers, awaitingPrayers, studies, paths, reading] = await Promise.all([
      this.db.prayerEntry.count({ where: { userId } }),
      this.db.prayerEntry.count({ where: { userId, answeredAt: null } }),
      this.db.studyEnrollment.findMany({
        where: { userId, series: { status: 'PUBLISHED' } },
        take: 3, orderBy: { startedAt: 'desc' },
        select: { seriesId: true, series: { select: { title: true, locale: true } } },
      }),
      this.db.enrollment.findMany({
        where: { userId, path: { isPublished: true } },
        take: 3, orderBy: { startedAt: 'desc' },
        select: { pathId: true, path: { select: { title: true } } },
      }),
      this.db.bibleReadingHistory.findFirst({
        where: { userId }, orderBy: { updatedAt: 'desc' },
        select: { chapterId: true, locale: true },
      }),
    ]);
    return {
      prayer: { total: prayers, awaiting: awaitingPrayers, answered: prayers - awaitingPrayers },
      studies: studies.map(s => ({ id: s.seriesId, title: s.series.title, locale: s.series.locale })),
      paths: paths.map(p => ({ id: p.pathId, title: p.path.title })),
      reading,
    };
  }
}
