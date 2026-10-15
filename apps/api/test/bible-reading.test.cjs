// Run after pnpm --filter @lifebook/api build; never connects to a database.
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { AppModule } = require('../dist/app.module');
const { BibleContentModule } = require('../dist/bible-content/bible-content.module');
const { BibleContentController } = require('../dist/bible-content/bible-content.controller');
const { BibleContentService } = require('../dist/bible-content/bible-content.service');
const { BibleAnnotationsModule } = require('../dist/bible-annotations/bible-annotations.module');
const { BibleReadingModule } = require('../dist/bible-reading/bible-reading.module');
const { BibleReadingService } = require('../dist/bible-reading/bible-reading.service');

test('root registers reading, annotations and the content controller with translation support', () => {
  const modules = Reflect.getMetadata('imports', AppModule);
  for (const module of [BibleContentModule, BibleAnnotationsModule, BibleReadingModule]) {
    assert.ok(modules.includes(module));
  }
  assert.deepEqual(Reflect.getMetadata('controllers', BibleContentModule), [BibleContentController]);
  assert.equal(Reflect.getMetadata('path', BibleContentController.prototype.translation), 'translation');
});

test('reader content contract supports translation metadata and plain text chapters', async () => {
  const service = new BibleContentService();
  service.bibleId = locale => locale === 'fr' ? 'french-version' : 'english-version';
  const paths = [];
  service.request = async path => {
    paths.push(path);
    return { data: { id: 'LUK.1', content: 'Scripture', reference: 'Luc 1', copyright: 'Attribution' } };
  };
  assert.ok((await service.translation('fr')).data);
  const result = await service.chapter('fr', 'LUK.1');
  assert.equal(result.data.id, 'LUK.1');
  assert.equal(result.data.bibleId, 'french-version');
  assert.equal(result.data.content, 'Scripture');
  assert.ok(paths.every(path => path.startsWith('/bibles/french-version')));
  assert.ok(paths[1].includes('content-type=text'));
  await assert.rejects(service.chapter('en', '../secret'), /Invalid chapter/);
});

test('history revisits refresh recency; history and continue are scoped to the user', async () => {
  const service = new BibleReadingService();
  service.userId = async () => 'reader-1';
  service.db = {
    bibleReadingHistory: {
      upsert: async args => {
        assert.deepEqual(args.where.userId_locale_chapterId, { userId: 'reader-1', locale: 'fr', chapterId: 'LUK.1' });
        assert.ok(args.update.updatedAt instanceof Date);
        return args.create;
      },
      findMany: async args => {
        assert.deepEqual(args, { where: { userId: 'reader-1' }, orderBy: { updatedAt: 'desc' }, take: 30 });
        return [];
      },
      findFirst: async args => {
        assert.deepEqual(args, { where: { userId: 'reader-1' }, orderBy: { updatedAt: 'desc' } });
        return null;
      },
    },
  };
  await service.saveHistory('token', { locale: 'fr', chapterId: 'LUK.1' });
  assert.deepEqual(await service.history('token'), []);
  assert.equal(await service.continueReading('token'), null);
  await assert.rejects(service.saveHistory('token', { locale: 'en', chapterId: 'invalid' }), /Invalid chapter/);
  await assert.rejects(service.saveHistory('token', { locale: 'en', chapterId: 'GEN.1', verse: 201 }), /Invalid verse/);
});

test('plans localize; enrollment and completion use unique keys and enforce ownership and day bounds', async () => {
  const service = new BibleReadingService();
  service.userId = async () => 'reader-1';
  let owned = true;
  const days = new Set();
  service.db = {
    bibleReadingPlanEnrollment: {
      upsert: async args => {
        assert.deepEqual(args.where.userId_planId, { userId: 'reader-1', planId: 'discover-jesus' });
        assert.deepEqual(args.update, {});
        return { id: 'enrollment-1', ...args.create };
      },
      findFirst: async args => {
        assert.deepEqual(args.where, { id: 'enrollment-1', userId: 'reader-1' });
        return owned ? { planId: 'discover-jesus' } : null;
      },
      findMany: async args => {
        assert.equal(args.where.userId, 'reader-1');
        return [{ id: 'enrollment-1', planId: 'discover-jesus', completions: [...days].map(day => ({ day })) }];
      },
    },
    bibleReadingPlanDayCompletion: {
      upsert: async args => {
        assert.deepEqual(args.where.enrollmentId_day, args.create);
        assert.deepEqual(args.update, {});
        days.add(args.create.day);
        return args.create;
      },
    },
  };
  for (const plan of service.plans('en')) assert.equal(service.planDetails(plan.id).days.length, plan.duration);
  assert.equal(service.planDetails('discover-jesus', 'fr').title, 'Découvrir Jésus');
  await service.enroll('token', 'discover-jesus');
  await service.completeDay('token', 'enrollment-1', 1);
  await service.completeDay('token', 'enrollment-1', 1);
  assert.equal((await service.myPlans('token', 'fr'))[0].completedDays, 1);
  await assert.rejects(service.completeDay('token', 'enrollment-1', 22), /Invalid plan day/);
  await assert.rejects(service.completeDay('token', 'enrollment-1', 0), /Invalid plan day/);
  owned = false;
  await assert.rejects(service.completeDay('token', 'enrollment-1', 1), /enrollment not found/);
  await assert.rejects(service.enroll('token', 'unknown'), /plan not found/);
});
