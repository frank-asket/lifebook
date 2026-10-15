const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { BibleStudyService } = require('../dist/bible-study/bible-study.service');

// Opt in only against the isolated restore. All fixture writes roll back.
const url = process.env.LIFEBOOK_STUDY_TEST_DATABASE_URL;
test('Bible Study persistence, publication filters, ordering, and user progress', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_STUDY_TEST');
  try {
    await assert.rejects(db.$transaction(async tx => {
      const prefix = `study-test-${Date.now()}`;
      const first = await tx.user.create({ data: { oidcSubject: `${prefix}-first` } });
      const second = await tx.user.create({ data: { oidcSubject: `${prefix}-second` } });
      let currentUser = first.id;
      const service = new BibleStudyService({ userId: async () => currentUser });
      await service.onModuleDestroy();
      service.db = tx;
      const createSeries = (locale, status, method = 'THEMATIC') => tx.studySeries.create({
        data: { slug: `${prefix}-${status}`, locale, status, method, title: 'Test study', description: 'Local fixture' },
      });
      const en = await createSeries('en', 'PUBLISHED');
      const fr = await createSeries('fr', 'PUBLISHED');
      const draft = await createSeries('en', 'DRAFT');
      const archived = await createSeries('en', 'ARCHIVED');
      const createLesson = (seriesId, position) => tx.studyLesson.create({
        data: { seriesId, position, title: `Lesson ${position}`, scriptureReference: 'JHN.1', introduction: 'Fixture', exegesis: 'Fixture', reflectionQuestions: ['Reflect?'] },
      });
      const later = await createLesson(en.id, 2);
      const earlier = await createLesson(en.id, 1);
      const hiddenLesson = await createLesson(draft.id, 1);
      const english = await service.list('THEMATIC', 'en');
      assert.ok(english.some(s => s.id === en.id && s._count.lessons === 2));
      assert.ok(!english.some(s => [fr.id, draft.id, archived.id].includes(s.id)));
      assert.ok((await service.list(undefined, 'fr')).some(s => s.id === fr.id));
      assert.ok(!(await service.list('BOOK', 'en')).some(s => s.id === en.id));
      assert.deepEqual((await service.one(en.id)).lessons.map(l => l.id), [earlier.id, later.id]);
      assert.equal((await service.lesson(earlier.id)).series.id, en.id);
      await assert.rejects(service.one(draft.id), /not found/);
      await assert.rejects(service.one(archived.id), /not found/);
      await assert.rejects(service.lesson(hiddenLesson.id), /not found/);
      const enrollment = await service.enroll(en.id, 'test');
      assert.equal((await service.enroll(en.id, 'test')).id, enrollment.id);
      const completion = await service.completeLesson(earlier.id, 'test');
      assert.equal((await service.completeLesson(earlier.id, 'test')).id, completion.id);
      assert.deepEqual((await service.mine('test')).completedLessonIds, [earlier.id]);
      currentUser = second.id;
      assert.deepEqual(await service.mine('test'), { enrollments: [], completedLessonIds: [] });
      await service.completeLesson(later.id, 'test');
      const secondProgress = await service.mine('test');
      assert.equal(secondProgress.enrollments.length, 1);
      assert.deepEqual(secondProgress.completedLessonIds, [later.id]);
      currentUser = first.id;
      assert.deepEqual((await service.mine('test')).completedLessonIds, [earlier.id]);
      throw rollback;
    }, { timeout: 15000 }), error => error === rollback);
  } finally {
    await db.$disconnect();
  }
});
