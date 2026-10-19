const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { PrismaClient } = require('@prisma/client');
const { PathsService } = require('../dist/paths/paths.service');
const { PathsModule } = require('../dist/paths/paths.module');
const { PathsController } = require('../dist/paths/paths.controller');
const { AppModule } = require('../dist/app.module');

test('learning routes register and private progress is authenticated and never cached', async () => {
  assert.ok(Reflect.getMetadata('imports', AppModule).includes(PathsModule));
  assert.equal(Reflect.getMetadata('path', PathsController.prototype.complete), ':id/lessons/:lessonId/complete');
  assert.deepEqual(Reflect.getMetadata('__headers__', PathsController.prototype.state), [{ name: 'Cache-Control', value: 'no-store' }]);
  const service = new PathsService({ userId: async () => { throw new Error('Unauthorized'); } });
  service.db = { learningPath: { findMany: async args => { assert.deepEqual(args.where, { isPublished: true }); assert.equal(args.take, 100); return []; }, findFirst: async () => null } };
  await assert.rejects(service.state(undefined, 'synthetic'), /Unauthorized/);
  await assert.rejects(service.enroll(undefined, 'synthetic'), /Unauthorized/);
  await assert.rejects(service.complete(undefined, 'synthetic', 'lesson'), /Unauthorized/);
  await assert.rejects(service.details('unpublished'), /not found/);
  assert.deepEqual(await service.list(), []);
});

const url = process.env.LIFEBOOK_LEARNING_TEST_DATABASE_URL;
test('learning progress persists, is idempotent, isolates owners and cascades with account deletion', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const prefix = `learning-${Date.now()}`;
  let user;
  const service = new PathsService({ userId: async auth => auth === 'other' ? `${prefix}-b` : `${prefix}-a` });
  service.db = db;
  try {
    user = await db.user.create({ data: { id: `${prefix}-a`, oidcSubject: `${prefix}-a` } });
    await db.user.create({ data: { id: `${prefix}-b`, oidcSubject: `${prefix}-b` } });
    const path = await db.learningPath.create({ data: { slug: prefix, title: 'Synthetic published pathway', description: 'Synthetic content', isPublished: true, lessons: { create: [{ title: 'Second', position: 2, content: 'Second lesson' }, { title: 'First', position: 1, content: '<b>Plain text is not HTML</b>' }] } } });
    const hidden = await db.learningPath.create({ data: { slug: `${prefix}-hidden`, title: 'Hidden', description: 'Hidden', lessons: { create: [{ title: 'Private', position: 1, content: 'Unpublished' }] } }, include: { lessons: true } });
    const empty = await db.learningPath.create({ data: { slug: `${prefix}-empty`, title: 'Empty', description: 'Empty', isPublished: true } });
    const detail = await service.details(path.id);
    assert.deepEqual(detail.lessons.map(l => l.title), ['First', 'Second']);
    assert.ok(!(await service.list()).some(p => p.id === hidden.id));
    await assert.rejects(service.details(hidden.id), /not found/);
    await assert.rejects(service.enroll('member', empty.id), /no lessons/);
    await assert.rejects(service.complete('member', path.id, detail.lessons[0].id), /not found/);
    const states = await Promise.all([service.enroll('member', path.id), service.enroll('member', path.id)]);
    assert.equal(states[0].enrollment.id, states[1].enrollment.id);
    assert.equal(await db.enrollment.count({ where: { userId: user.id, pathId: path.id } }), 1);
    assert.deepEqual(states[0].enrollment.completions, []);
    await assert.rejects(service.complete('member', path.id, hidden.lessons[0].id), /not found/);
    await assert.rejects(service.complete('other', path.id, detail.lessons[0].id), /not found/);
    await Promise.all([service.complete('member', path.id, detail.lessons[0].id), service.complete('member', path.id, detail.lessons[0].id)]);
    const state = await service.state('member', path.id);
    assert.equal(state.enrollment.completions.length, 1);
    assert.equal((await service.state('other', path.id)).enrollment, null);
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).role, 'MEMBER');
    await db.learningPath.update({ where: { id: path.id }, data: { isPublished: false } });
    await assert.rejects(service.state('member', path.id), /not found/);
    await assert.rejects(service.complete('member', path.id, detail.lessons[1].id), /not found/);
    await db.user.delete({ where: { id: user.id } });
    assert.equal(await db.learningLessonCompletion.count({ where: { enrollmentId: state.enrollment.id } }), 0);
    assert.equal(await db.enrollment.count({ where: { userId: user.id } }), 0);
  } finally {
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } });
    await db.learningPath.deleteMany({ where: { slug: { startsWith: prefix } } });
    await db.$disconnect();
  }
});
