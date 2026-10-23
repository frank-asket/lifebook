// Cross-member access matrix: member A creates real data over HTTP, then member B calls every registered route
// using A's record IDs. B must never succeed on A's records, never see A's data, and nothing A owns may change.
// Clerk is replaced by a test double (token "member-a" signs in as A); every request still goes through the real
// controllers, guards, validation and services. Runs only against the loopback lifebook_restore test database.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { randomBytes } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;

const TOKENS = { 'member-a': 'xm-member-a', 'member-b': 'xm-member-b' };
function installClerkDouble() {
  const load = Module._load;
  Module._load = function (request, ...rest) {
    const real = load.call(this, request, ...rest);
    if (request !== '@clerk/backend') return real;
    return {
      ...real,
      verifyToken: async token => { if (!TOKENS[token]) throw new Error('invalid token'); return { sub: TOKENS[token] }; },
      createClerkClient: () => ({ users: { deleteUser: async () => ({}) } }),
    };
  };
}

// Every registered route, classified. A new route fails this test until it is classified here.
// public: no sign-in. own: acts on B's own data (allowed; invariants still checked). a: names a record A owns,
// so B must get 403 or 404. role: pastor/editor/moderator only, so a member gets 403.
const ROUTES = {
  'GET /bible-annotations': 'own', 'PUT /bible-annotations': 'own', 'DELETE /bible-annotations/:id': 'a', 'GET /bible-annotations/page': 'own', 'GET /bible-annotations/passage': 'own',
  'GET /bible-content/books': 'public', 'GET /bible-content/books/:bookId/chapters': 'public', 'GET /bible-content/chapters/:chapterId': 'public', 'GET /bible-content/passages/:passageId': 'public', 'GET /bible-content/search': 'public', 'GET /bible-content/translation': 'public', 'POST /bible-content/usage': 'public',
  'GET /bible-reading/continue': 'own', 'POST /bible-reading/enrollments/:id/complete-day': 'a', 'GET /bible-reading/history': 'own', 'PUT /bible-reading/history': 'own', 'GET /bible-reading/my-plans': 'own', 'GET /bible-reading/plans': 'public', 'GET /bible-reading/plans/:id': 'public', 'POST /bible-reading/plans/:id/enroll': 'own',
  'GET /bible-studies': 'public', 'GET /bible-studies/:id': 'public', 'POST /bible-studies/:id/enroll': 'own', 'GET /bible-studies/lessons/:id': 'public', 'POST /bible-studies/lessons/:id/complete': 'own', 'GET /bible-studies/my-studies': 'own',
  'PUT /care/pastor/availability': 'role', 'GET /care/pastor/cases': 'role', 'GET /care/pastor/cases/:id': 'role', 'POST /care/pastor/cases/:id/close': 'role', 'POST /care/pastor/cases/:id/messages': 'role', 'POST /care/pastor/cases/:id/report': 'role', 'GET /care/pastor/queue': 'role', 'POST /care/pastor/queue/:id/claim': 'role', 'GET /care/pastor/status': 'own',
  'POST /care/requests': 'own', 'GET /care/requests': 'own', 'GET /care/requests/page': 'own', 'GET /care/requests/:id': 'a', 'DELETE /care/requests/:id': 'a', 'POST /care/requests/:id/close': 'a', 'POST /care/requests/:id/messages': 'a', 'POST /care/requests/:id/report': 'a',
  'GET /daily-word/sessions': 'own', 'GET /daily-word/sessions/page': 'own', 'GET /daily-word/sessions/:id': 'a', 'PUT /daily-word/sessions/:id/reflection': 'a', 'DELETE /daily-word/sessions/:id/reflection': 'a', 'PUT /daily-word/sessions/:id/steps/:step': 'a', 'POST /daily-word/sessions/today': 'own', 'GET /daily-word/sessions/today': 'own', 'GET /daily-word/stats': 'own',
  'GET /devotionals/latest': 'public', 'GET /health': 'public',
  'GET /livingword': 'public', 'GET /livingword/:id': 'public', 'GET /livingword/editor': 'role', 'POST /livingword/editor': 'role', 'PUT /livingword/editor/:id': 'role', 'POST /livingword/editor/:id/unpublish': 'role',
  'POST /me/account/delete': 'own', 'GET /me/account/export': 'own', 'GET /me/profile': 'own', 'PUT /me/profile': 'own', 'GET /me/suggestions': 'own', 'POST /me/suggestions/:id/dismiss': 'own',
  'GET /meditations/:id': 'public', 'PUT /meditations/:id/bookmark': 'own', 'POST /meditations/:id/complete': 'own', 'PUT /meditations/:id/reflection': 'own', 'DELETE /meditations/:id/reflection': 'own', 'GET /meditations/:id/state': 'own', 'GET /meditations/daily-word/today': 'public', 'GET /meditations/history': 'own', 'GET /meditations/history/page': 'own', 'GET /meditations/saved': 'own', 'GET /meditations/today': 'public',
  'GET /pastors': 'public', 'GET /pastors/:slug': 'public',
  'GET /paths': 'public', 'GET /paths/:id': 'public', 'POST /paths/:id/enroll': 'own', 'PUT /paths/:id/lessons/:lessonId/complete': 'own', 'GET /paths/:id/state': 'own',
  'GET /prayer-companion/topics': 'public', 'GET /prayer-companion/topics/:id': 'public',
  'GET /prayers': 'own', 'GET /prayers/page': 'own', 'POST /prayers': 'own', 'GET /prayers/:id': 'a', 'PUT /prayers/:id': 'a', 'DELETE /prayers/:id': 'a', 'PUT /prayers/:id/answer': 'a', 'POST /prayers/:id/meditation': 'a', 'DELETE /prayers/:id/meditation': 'a', 'POST /prayers/delete-all': 'own',
  'GET /safeguarding/overview': 'role', 'POST /safeguarding/pastors/:slug/reinstate': 'role', 'POST /safeguarding/pastors/:slug/suspend': 'role', 'GET /safeguarding/reports': 'role', 'GET /safeguarding/reports/:id': 'role', 'POST /safeguarding/reports/:id/acknowledge': 'role', 'POST /safeguarding/reports/:id/resolve': 'role',
};

test('member B can never read, change or delete member A\'s data, on any route', { skip: !url, timeout: 120000 }, async () => {
  for (const raw of [url, process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const target = new URL(raw); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  }
  Object.assign(process.env, {
    API_RATE_LIMIT: '10000', CLERK_SECRET_KEY: 'sk_test_cross_member', OPENAI_API_KEY: '',
    REFLECTION_ENCRYPTION_KEYS: JSON.stringify({ xm: randomBytes(32).toString('hex') }), REFLECTION_ENCRYPTION_ACTIVE_KEY: 'xm',
    BIBLE_NOTES_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
  });
  installClerkDouble();
  const { PrismaClient } = require('@prisma/client');
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../dist/app.module');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const run = randomBytes(4).toString('hex');
  const MARK = `A-SECRET-${run}`;

  // Shared published content both members can use.
  const meditation = await db.meditation.create({ data: { slug: `xm-${run}`, title: 'Fixture', scriptureReference: 'JHN.1', explanation: 'Fixture', questions: [], guidedPrayer: 'Fixture', isPublished: true, publishDate: new Date('2026-01-01') } });
  const path = await db.learningPath.create({ data: { slug: `xm-${run}`, title: 'Fixture', description: 'Fixture', isPublished: true, lessons: { create: [{ title: 'One', position: 1, content: 'x' }, { title: 'Two', position: 2, content: 'x' }] } }, include: { lessons: true } });
  const series = await db.studySeries.create({ data: { slug: `xm-${run}`, locale: 'en', title: 'Fixture', description: 'Fixture', method: 'THEMATIC', status: 'PUBLISHED', lessons: { create: [{ position: 1, title: 'One', scriptureReference: 'JHN.1', introduction: 'x', exegesis: 'x', reflectionQuestions: [] }] } }, include: { lessons: true } });

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  const base = (await app.getUrl()) + '/api/v1';
  const call = async (who, method, route, body) => {
    const res = await fetch(base + route, { method, headers: { ...(who ? { Authorization: `Bearer ${who}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
    return { status: res.status, text, json };
  };
  const ok = async (who, method, route, body) => { const r = await call(who, method, route, body); assert.ok(r.status < 300, `${who} ${method} ${route} -> ${r.status} ${r.text.slice(0, 160)}`); return r.json; };

  try {
    // Every registered route is classified.
    const stack = (app.getHttpAdapter().getInstance()._router || app.getHttpAdapter().getInstance().router).stack;
    const registered = stack.filter(l => l.route).flatMap(l => Object.keys(l.route.methods).map(m => `${m.toUpperCase()} ${l.route.path.replace(/^\/api\/v1/, '')}`));
    assert.deepEqual(registered.filter(r => !ROUTES[r]).sort(), [], 'unclassified routes: add them to ROUTES');
    assert.deepEqual(Object.keys(ROUTES).filter(r => !registered.includes(r)).sort(), [], 'ROUTES lists routes that no longer exist');

    // Member A creates private data through the API.
    await ok('member-a', 'GET', '/me/profile');
    await ok('member-b', 'GET', '/me/profile');
    const prayer = await ok('member-a', 'POST', '/prayers', { title: `${MARK} title`, body: `${MARK} prayer body` });
    await ok('member-a', 'PUT', `/prayers/${prayer.id}/answer`, { answered: true, note: `${MARK} answer` });
    await ok('member-a', 'PUT', '/bible-annotations', { passageId: 'JHN.1.1', locale: 'en', bookmark: true, highlight: 'yellow', note: `${MARK} note` });
    const annotation = (await ok('member-a', 'GET', '/bible-annotations/passage?locale=en&passageId=JHN.1.1')).annotation;
    await ok('member-a', 'PUT', '/bible-reading/history', { locale: 'en', chapterId: 'JHN.1', verse: 3 });
    const plans = await ok(null, 'GET', '/bible-reading/plans');
    const enrollment = await ok('member-a', 'POST', `/bible-reading/plans/${plans[0].id}/enroll`);
    await ok('member-a', 'POST', `/bible-reading/enrollments/${enrollment.id}/complete-day`, { day: 1 });
    const session = await ok('member-a', 'POST', '/daily-word/sessions/today', { timezone: 'UTC' });
    await ok('member-a', 'PUT', `/daily-word/sessions/${session.id}/steps/UNDERSTAND`);
    await ok('member-a', 'PUT', `/daily-word/sessions/${session.id}/reflection`, { content: `${MARK} daily reflection` });
    await ok('member-a', 'PUT', `/meditations/${meditation.id}/reflection`, { text: `${MARK} meditation reflection` });
    await ok('member-a', 'PUT', `/meditations/${meditation.id}/bookmark`, { saved: true });
    await ok('member-a', 'POST', `/paths/${path.id}/enroll`);
    await ok('member-a', 'PUT', `/paths/${path.id}/lessons/${path.lessons[0].id}/complete`);
    await ok('member-a', 'POST', `/bible-studies/${series.id}/enroll`);
    await ok('member-a', 'POST', `/bible-studies/lessons/${series.lessons[0].id}/complete`);
    const care = await ok('member-a', 'POST', '/care/requests', { topic: 'family', language: 'en', contactPreference: 'messages', name: `${MARK} name`, message: `${MARK} care message`, consent: true });

    const A_IDS = [prayer.id, annotation.id, enrollment.id, session.id, care.id];
    const ids = { prayer: prayer.id, annotation: annotation.id, enrollment: enrollment.id, session: session.id, care: care.id, meditation: meditation.id, path: path.id, lesson: path.lessons[0].id, series: series.id, studyLesson: series.lessons[0].id, plan: plans[0].id };

    // Snapshot every row A owns: rows naming A's user ID, and rows naming those rows (reflections, messages,
    // completions). Nothing in it may change while B acts. Scoped to A so other test files can share the database.
    const userA = await db.user.findUnique({ where: { oidcSubject: TOKENS['member-a'] } });
    const tables = (await db.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`)).map(r => r.tablename);
    const snapshot = async () => {
      const all = [];
      for (const t of tables) for (const r of await db.$queryRawUnsafe(`SELECT row_to_json(x)::text AS j FROM "${t}" x`)) all.push(`${t} ${r.j}`);
      const owned = all.filter(row => row.includes(userA.id));
      const ownedIds = owned.map(row => JSON.parse(row.slice(row.indexOf(' ') + 1)).id).filter(Boolean);
      return new Set(all.filter(row => row.includes(userA.id) || ownedIds.some(id => row.includes(id))));
    };
    const before = await snapshot();
    assert.ok(before.size >= 12, `expected A's rows to be captured, found ${before.size}`);

    // Concrete requests for every route: A's IDs where a route names a record; valid bodies so a 400 cannot hide a missing check.
    const fill = route => route.replace(':id/lessons/:lessonId', `${ids.path}/lessons/${ids.lesson}`).replace(':lessonId', ids.lesson).replace(':step', 'MEDITATE').replace(':slug', 'xm-none').replace(':passageId', 'JHN.1.1').replace(':chapterId', 'JHN.1').replace(':bookId', 'JHN')
      .replace(/^(\/prayers)\/:id/, `$1/${ids.prayer}`).replace(/^(\/bible-annotations)\/:id/, `$1/${ids.annotation}`).replace(/^(\/bible-reading\/enrollments)\/:id/, `$1/${ids.enrollment}`).replace(/^(\/bible-reading\/plans)\/:id/, `$1/${ids.plan}`)
      .replace(/^(\/daily-word\/sessions)\/:id/, `$1/${ids.session}`).replace(/^(\/care\/(requests|pastor\/cases|pastor\/queue))\/:id/, `$1/${ids.care}`).replace(/^(\/meditations)\/:id/, `$1/${ids.meditation}`).replace(/^(\/paths)\/:id/, `$1/${ids.path}`)
      .replace(/^(\/bible-studies\/lessons)\/:id/, `$1/${ids.studyLesson}`).replace(/^(\/bible-studies)\/:id/, `$1/${ids.series}`).replace(/^(\/(safeguarding\/reports|livingword\/editor|livingword))\/:id/, `$1/${ids.care}`);
    const BODIES = {
      'PUT /prayers/:id': { body: 'B overwrites' }, 'PUT /prayers/:id/answer': { answered: false }, 'POST /prayers/:id/meditation': { consent: true }, 'POST /prayers': { body: 'B prayer' }, 'POST /prayers/delete-all': { confirm: 'DELETE_ALL_PRAYERS' },
      'PUT /bible-annotations': { passageId: 'JHN.1.1', locale: 'en', note: 'B note' }, 'PUT /bible-reading/history': { locale: 'en', chapterId: 'JHN.2' }, 'POST /bible-reading/enrollments/:id/complete-day': { day: 2 },
      'PUT /daily-word/sessions/:id/reflection': { content: 'B overwrites' }, 'POST /daily-word/sessions/today': { timezone: 'UTC' },
      'PUT /meditations/:id/reflection': { text: 'B reflection' }, 'PUT /meditations/:id/bookmark': { saved: true },
      'POST /care/requests': { topic: 'prayer', language: 'en', contactPreference: 'messages', message: 'B request', consent: true }, 'POST /care/requests/:id/messages': { text: 'B writes into A' }, 'POST /care/requests/:id/report': { category: 'other', details: 'B report', shareConversation: true },
      'POST /care/pastor/cases/:id/messages': { text: 'B as pastor' }, 'POST /care/pastor/cases/:id/report': { category: 'other', details: 'x' }, 'PUT /care/pastor/availability': { accepting: true },
      'POST /livingword/editor': { title: 'x', mediaUrl: 'https://media.example.org/x.mp3', locale: 'en', kind: 'audio', speaker: 'x', attribution: 'x', transcript: 'x', rightsReference: 'x', publish: true }, 'PUT /livingword/editor/:id': { title: 'x', mediaUrl: 'https://media.example.org/x.mp3', locale: 'en', kind: 'audio', speaker: 'x', attribution: 'x', transcript: 'x', rightsReference: 'x', publish: true }, 'POST /safeguarding/reports/:id/resolve': { resolution: 'x' }, 'POST /safeguarding/pastors/:slug/suspend': { reason: 'x' },
      'PUT /me/profile': { preferredLanguage: 'fr' }, 'POST /me/account/delete': { confirm: 'DELETE_MY_ACCOUNT' }, 'POST /bible-content/usage': {},
    };
    const failures = [];
    const order = Object.keys(ROUTES).sort((x, y) => (x === 'POST /me/account/delete') - (y === 'POST /me/account/delete'));
    for (const key of order) {
      const [method, route] = key.split(' '); const kind = ROUTES[key];
      if (kind === 'public') continue;
      const concrete = fill(route);
      const anon = await call(null, method, concrete, BODIES[key]);
      if (anon.status < 400 || anon.text.includes(MARK)) failures.push(`anonymous ${key} -> ${anon.status}`);
      const b = await call('member-b', method, concrete, BODIES[key]);
      if (b.text.includes(MARK) || A_IDS.some(id => b.text.includes(id) && !(kind === 'a' && b.status === 404))) failures.push(`B saw A's data on ${key} (${b.status})`);
      if (kind === 'a' && ![403, 404].includes(b.status)) failures.push(`B on A's record ${key} -> ${b.status} ${b.text.slice(0, 120)} (expected 403 or 404)`);
      if (kind === 'role' && b.status !== 403) failures.push(`member on role route ${key} -> ${b.status} ${b.text.slice(0, 120)} (expected 403)`);
    }

    // Nothing A owned changed, and A still reads exactly their own data.
    const after = await snapshot();
    const changed = [...before].filter(row => !after.has(row)).map(row => row.slice(0, 140));
    assert.deepEqual(failures, []);
    assert.deepEqual(changed, [], 'rows that existed before B acted were changed or deleted');
    assert.match((await call('member-a', 'GET', `/prayers/${prayer.id}`)).text, new RegExp(MARK));
    assert.match((await call('member-a', 'GET', `/daily-word/sessions/${session.id}`)).text, new RegExp(MARK));
    assert.match((await call('member-a', 'GET', `/care/requests/${care.id}`)).text, new RegExp(MARK));
    assert.equal(await db.user.count({ where: { oidcSubject: TOKENS['member-b'] } }), 0, 'B deleted only their own account');
  } finally {
    await app.close();
    await db.user.deleteMany({ where: { oidcSubject: { in: Object.values(TOKENS) } } });
    await db.meditation.deleteMany({ where: { slug: `xm-${run}` } });
    await db.learningPath.deleteMany({ where: { slug: `xm-${run}` } });
    await db.studySeries.deleteMany({ where: { slug: `xm-${run}` } });
    await db.$disconnect();
  }
});
