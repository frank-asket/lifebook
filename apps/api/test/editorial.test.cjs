const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('reflect-metadata');
const { editorialInput } = require('../dist/editorial/editorial-input');
const { EditorialService } = require('../dist/editorial/editorial.service');
const { EditorialController } = require('../dist/editorial/editorial.module');
const meditation = { slug: 'synthetic-meditation', title: 'Synthetic meditation', locale: 'en', publishDate: '2026-10-26', scriptureReference: 'Luke 10:25–37', explanation: 'Synthetic explanation', questions: ['What does the passage say?'], guidedPrayer: 'Synthetic prayer', publish: false, reviewConfirmed: false };
const lesson = { title: 'Synthetic lesson', scriptureReference: 'Luke 10:25–37', introduction: 'Synthetic introduction', historicalContext: '', exegesis: 'Synthetic explanation', theology: '', reflectionQuestions: [], guidedPrayer: '', application: '' };
const study = { slug: 'synthetic-study', title: 'Synthetic study', description: 'Synthetic description', locale: 'fr', method: 'BOOK', difficulty: 'BEGINNER', lessons: [lesson], publish: false, reviewConfirmed: false };
const path = { slug: 'synthetic-path', title: 'Synthetic path', description: 'Synthetic description', lessons: [{ title: 'Synthetic lesson', content: 'Synthetic content' }], publish: false, reviewConfirmed: false };

test('editorial input rejects publication without review, malformed data and hidden fields', () => {
  for (const [kind, input] of [['meditations', meditation], ['studies', study], ['paths', path]]) {
    assert.equal(editorialInput(kind, input).publish, false);
    assert.throws(() => editorialInput(kind, { ...input, publish: true }), /Confirm pastoral/);
    assert.equal(editorialInput(kind, { ...input, publish: true, reviewConfirmed: true }).publish, true);
    assert.throws(() => editorialInput(kind, { ...input, isPublished: true }), /Invalid editorial fields/);
    assert.throws(() => editorialInput(kind, { ...input, title: ' ' }), /title/);
  }
  for (const input of [null, [], {}, { ...meditation, locale: 'es' }, { ...meditation, publishDate: '2026-02-31' }, { ...meditation, questions: ['x'.repeat(501)] }]) assert.throws(() => editorialInput('meditations', input));
  assert.throws(() => editorialInput('studies', { ...study, lessons: [{ ...lesson, id: 'x' }, { ...lesson, id: 'x' }] }), /Duplicate/);
  assert.throws(() => editorialInput('paths', { ...path, lessons: [], publish: true, reviewConfirmed: true }), /at least one/);
  assert.throws(() => editorialInput('paths', { ...path, lessons: [{ ...path.lessons[0], creatorId: 'admin' }] }), /Invalid editorial fields/);
  for (const method of ['list', 'details', 'create', 'update']) assert.deepEqual(Reflect.getMetadata('__headers__', EditorialController.prototype[method]), [{ name: 'Cache-Control', value: 'no-store' }]);
});

const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('editorial persistence: restricted roles, draft/publication, stale edits, atomic lessons and preserved progress', { skip: !url, timeout: 30000 }, async () => {
  const target = new URL(url); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const prefix = `editorial-${randomUUID()}`; const users = {};
  const service = new EditorialService({ userId: async auth => { if (!users[auth]) throw new Error('Unauthorized'); return users[auth].id; } }); service.db = db;
  try {
    for (const [name, role] of [['member', 'MEMBER'], ['editor', 'MODERATOR'], ['admin', 'ADMIN']]) users[name] = await db.user.create({ data: { oidcSubject: `${prefix}-${name}`, role } });
    await assert.rejects(service.list(undefined, 'meditations'), /Unauthorized/);
    for (const kind of ['meditations', 'studies', 'paths']) {
      await assert.rejects(service.list('member', kind), /Only LifeBook/);
      await assert.rejects(service.details('member', kind, 'anything'), /Only LifeBook/);
      await assert.rejects(service.save('member', kind, undefined, {}), /Only LifeBook/);
    }
    await assert.rejects(service.list('editor', 'invalid'), /Unknown content/);
    for (const [kind, input] of [['meditations', meditation], ['studies', study], ['paths', path]]) {
      const body = { ...input, slug: `${prefix}-${kind}` };
      const draft = await service.save('editor', kind, undefined, body);
      assert.equal(draft.isPublished ?? (draft.status === 'PUBLISHED'), false);
      assert.equal(draft.revision.length, 64);
      assert.ok((await service.list('admin', kind)).some(row => row.id === draft.id));
      assert.equal((await service.details('editor', kind, draft.id)).revision, draft.revision);
      const saved = await service.save('admin', kind, draft.id, { ...body, ...(draft.lessons ? { lessons: body.lessons.map((value, i) => ({ ...value, id: draft.lessons[i].id })) } : {}), revision: draft.revision, publish: true, reviewConfirmed: true });
      assert.equal(saved.isPublished ?? (saved.status === 'PUBLISHED'), true);
      await assert.rejects(service.save('editor', kind, draft.id, { ...body, revision: draft.revision }), /Content changed/);
      if (kind === 'meditations') {
        await db.meditationReflection.create({ data: { userId: users.member.id, meditationId: draft.id, text: 'Synthetic fixture' } });
        await db.meditationBookmark.create({ data: { userId: users.member.id, meditationId: draft.id } });
        await db.meditationCompletion.create({ data: { userId: users.member.id, meditationId: draft.id } });
        const { MeditationService } = require('../dist/meditation/meditation.service');
        const publicMeditations = new MeditationService(); publicMeditations.db = db; publicMeditations.userId = async () => users.member.id;
        assert.equal((await publicMeditations.saved()).length, 1);
        const scheduled = await service.save('editor', kind, draft.id, { ...body, publishDate: '2099-01-01', publish: true, reviewConfirmed: true, revision: saved.revision });
        await assert.rejects(publicMeditations.one(draft.id), /not found/);
        assert.deepEqual(await publicMeditations.saved(), []);
        assert.deepEqual(await publicMeditations.history(), []);
        assert.equal((await publicMeditations.historyPage()).items.length, 0);
        await service.save('editor', kind, draft.id, { ...body, title: 'Edited draft', revision: scheduled.revision });
        assert.deepEqual(await publicMeditations.saved(), [], 'unpublished edits are not leaked through earlier bookmarks');
        assert.equal(await db.meditationCompletion.count({ where: { meditationId: draft.id } }), 1);
        assert.equal(await db.meditationReflection.count({ where: { meditationId: draft.id } }), 1);
        assert.equal((await db.meditation.findUnique({ where: { id: draft.id } })).isPublished, false);
      } else {
        if (kind === 'studies') {
          await db.studyEnrollment.create({ data: { userId: users.member.id, seriesId: draft.id } });
          await db.studyLessonCompletion.create({ data: { userId: users.member.id, lessonId: draft.lessons[0].id } });
        } else {
          const enrollment = await db.enrollment.create({ data: { userId: users.member.id, pathId: draft.id } });
          await db.learningLessonCompletion.create({ data: { enrollmentId: enrollment.id, lessonId: draft.lessons[0].id } });
        }
        const existing = body.lessons.map((value, i) => ({ ...value, id: saved.lessons[i].id }));
        await assert.rejects(service.save('editor', kind, draft.id, { ...body, lessons: [], revision: saved.revision }), /Existing lessons/);
        await assert.rejects(service.save('editor', kind, draft.id, { ...body, lessons: [{ ...existing[0], id: 'foreign-lesson' }], revision: saved.revision }), /Existing lessons/);
        assert.equal((await service.details('editor', kind, draft.id)).revision, saved.revision, 'failed writes roll back');
        const updated = await service.save('editor', kind, draft.id, { ...body, lessons: [{ ...existing[0], title: 'Edited lesson' }, body.lessons[0]], revision: saved.revision });
        assert.equal(updated.lessons.length, 2); assert.equal(updated.lessons[0].id, saved.lessons[0].id);
        assert.equal(await (kind === 'studies' ? db.studyLessonCompletion : db.learningLessonCompletion).count({ where: { lessonId: draft.lessons[0].id } }), 1);
        const payload = { ...body, lessons: updated.lessons.map((value, index) => ({ ...body.lessons[0], id: value.id, title: `Concurrent ${index}` })), revision: updated.revision };
        const writes = await Promise.allSettled([service.save('editor', kind, draft.id, { ...payload, title: 'Concurrent A' }), service.save('admin', kind, draft.id, { ...payload, title: 'Concurrent B' })]);
        assert.equal(writes.filter(result => result.status === 'fulfilled').length, 1, 'only one stale-snapshot editor wins');
        assert.ok(writes.find(result => result.status === 'rejected').reason.getStatus() === 409);
      }
    }
    await assert.rejects(service.save('editor', 'paths', undefined, { ...path, lessons: [{ ...path.lessons[0], id: 'foreign-lesson' }] }), /Existing lessons/);
  } finally {
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } });
    await db.meditation.deleteMany({ where: { slug: { startsWith: prefix } } });
    await db.studySeries.deleteMany({ where: { slug: { startsWith: prefix } } });
    await db.learningPath.deleteMany({ where: { slug: { startsWith: prefix } } });
    await db.$disconnect();
  }
});
