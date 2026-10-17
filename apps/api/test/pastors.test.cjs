// The database test opts in against a disposable loopback database and always rolls back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;

test('pastor verification gates the public directory and never exposes private details', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const { PastorAdmin, isActivePastor } = require('../dist/pastors/pastor-admin');
  const { PastorDirectoryService } = require('../dist/pastors/pastor-directory.service');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_PASTOR_TEST');
  const previous = [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY];
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  try {
    await assert.rejects(db.$transaction(async tx => {
      const prefix = `pastor-test-${Date.now()}`;
      const [pastor, moderator, member, other] = await Promise.all(['pastor', 'moderator', 'member', 'other'].map(n => tx.user.create({ data: { oidcSubject: `${prefix}-${n}` } })));
      const admin = new PastorAdmin(tx);
      const directory = new PastorDirectoryService();
      await directory.onModuleDestroy();
      directory.db = tx;
      const visible = async () => (await directory.list()).filter(p => p.slug.startsWith('test-'));
      const details = { slug: 'test-kwame-mensah', displayName: 'Rev. Kwame Mensah', bio: 'Pastor in Accra for twelve years.', languages: ['en', 'TW'], churchName: 'Synthetic Chapel', ministryRole: 'Senior Pastor', country: 'gh', referenceName: 'Synthetic Bishop', referenceContact: 'bishop-synthetic@example.invalid' };

      await assert.rejects(admin.register(pastor.id, { ...details, slug: 'Bad Slug' }), /Slug/);
      await assert.rejects(admin.register(pastor.id, { ...details, languages: ['english'] }), /Languages/);
      await assert.rejects(admin.register(pastor.id, { ...details, country: 'Ghana' }), /Country/);
      await assert.rejects(admin.register(pastor.id, { ...details, referenceContact: ' ' }), /required/);
      const registered = await admin.register(pastor.id, details);
      assert.equal(registered.status, 'PENDING');
      assert.deepEqual(registered.languages, ['en', 'tw']);
      assert.equal(registered.country, 'GH');
      const stored = await tx.ministryVerification.findUnique({ where: { userId: pastor.id } });
      assert.ok(stored.referenceContactCiphertext.startsWith('lbenc:v1:test:'));
      assert.ok(!stored.referenceContactCiphertext.includes('bishop'));
      assert.equal(JSON.stringify(registered).includes('bishop-synthetic'), false, 'operator summaries never show the reference contact');
      await assert.rejects(admin.register(other.id, details), /already used/);

      assert.deepEqual(await visible(), [], 'pending pastors are not listed');
      await assert.rejects(directory.get(details.slug), /not found/);
      await assert.rejects(admin.approve(pastor.id, moderator.id), /MODERATOR or ADMIN/);
      await admin.setRole(moderator.id, 'MODERATOR');
      await assert.rejects(admin.approve(pastor.id, moderator.id), /missing: training, signed code of conduct/);
      await assert.rejects(admin.recordTraining(pastor.id, 'Mental Health First Aid', '2999-01-01'), /future/);
      await admin.recordTraining(pastor.id, 'Mental Health First Aid', '2026-10-01');
      await assert.rejects(admin.approve(pastor.id, moderator.id), /signed code of conduct/);
      await admin.recordConduct(pastor.id, '2026-10-02');
      await admin.setRole(pastor.id, 'MODERATOR');
      await assert.rejects(admin.approve(pastor.id, pastor.id), /cannot approve themselves/);
      await admin.setRole(pastor.id, 'MEMBER');
      const approved = await admin.approve(pastor.id, moderator.id);
      assert.equal(approved.active, true);
      await assert.rejects(admin.approve(pastor.id, moderator.id), /Only pending/);

      const listed = await visible();
      assert.equal(listed.length, 1);
      assert.deepEqual(Object.keys(listed[0]).sort(), ['bio', 'church', 'country', 'displayName', 'languages', 'ministryRole', 'slug']);
      const page = await directory.get(details.slug);
      assert.equal(page.church, 'Synthetic Chapel');
      for (const secret of [pastor.id, 'Synthetic Bishop', 'bishop-synthetic', stored.referenceContactCiphertext]) assert.equal(JSON.stringify([listed, page]).includes(secret), false);

      await admin.suspend(pastor.id, 'Synthetic concern under review');
      assert.deepEqual(await visible(), [], 'suspension hides the pastor immediately');
      await assert.rejects(directory.get(details.slug), /not found/);
      await assert.rejects(admin.approve(pastor.id, moderator.id), /Only pending|suspended/);
      await assert.rejects(admin.reinstate(pastor.id, member.id), /MODERATOR or ADMIN/);
      await admin.reinstate(pastor.id, moderator.id);
      assert.equal((await visible()).length, 1);
      await assert.rejects(admin.reinstate(pastor.id, moderator.id), /not suspended/);

      // A different reference or church needs a fresh review.
      await admin.register(pastor.id, { ...details, bio: 'Updated bio.' });
      assert.equal((await admin.summary(pastor.id)).active, true, 'editing the bio keeps the approval');
      await admin.register(pastor.id, { ...details, churchName: 'Another Synthetic Church' });
      assert.equal((await admin.summary(pastor.id)).status, 'PENDING');
      assert.deepEqual(await visible(), []);

      await admin.approve(pastor.id, moderator.id);
      await admin.reject(pastor.id, 'Synthetic rejection');
      assert.deepEqual(await visible(), []);
      assert.equal(isActivePastor(null), false);
      throw rollback;
    }), error => error === rollback);
  } finally {
    [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY] = previous;
    if (previous[0] === undefined) delete process.env.REFLECTION_ENCRYPTION_KEYS;
    if (previous[1] === undefined) delete process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY;
    await db.$disconnect();
  }
});

test('the pastor admin script refuses an unnamed, remote or unconfirmed target', () => {
  const script = path.resolve(__dirname, '../scripts/pastor-admin.cjs');
  const run = (args, env = {}) => spawnSync(process.execPath, [script, ...args], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
  assert.match(run(['delete-everything']).stderr, /Usage/);
  assert.match(run(['list']).stderr, /Choose --target/);
  assert.match(run(['list', '--target', 'local'], { DATABASE_URL: 'postgresql://user:secret-pass@db.example.com/x' }).stderr, /127\.0\.0\.1/);
  const production = run(['suspend', '--target', 'production', '--email', 'someone@example.invalid', '--reason', 'x']);
  assert.match(production.stderr, /--confirm-production|not found/);
  assert.equal(production.status, 1);
  for (const result of [production]) assert.equal(/secret-pass|postgresql:\/\//.test(result.stdout + result.stderr), false, 'no credentials in output');
  assert.match(run(['list', '--target']).stderr, /Expected a value/);
});
