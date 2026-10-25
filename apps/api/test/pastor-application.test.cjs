// Applying to serve as a pastor, and the safeguarding lead's review. Opts in against a disposable loopback database; always rolls back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;

test('members apply, only a safeguarding lead approves, and private details stay private', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const { PastorApplicationService } = require('../dist/pastors/pastor-application.service');
  const { SafeguardingService } = require('../dist/safeguarding/safeguarding.service');
  const { PastorDirectoryService } = require('../dist/pastors/pastor-directory.service');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_PASTOR_APPLICATION_TEST');
  const previous = [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY];
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  try {
    await assert.rejects(db.$transaction(async tx => {
      const prefix = `application-test-${Date.now()}`;
      const [applicant, lead, member] = await Promise.all(['applicant', 'lead', 'member'].map(n => tx.user.create({ data: { oidcSubject: `${prefix}-${n}` } })));
      await tx.user.update({ where: { id: lead.id }, data: { role: 'MODERATOR' } });
      const users = { applicant: applicant.id, lead: lead.id, member: member.id };
      const as = service => { service.db = tx; return service; };
      const meditation = { userId: async auth => users[auth] };
      const applications = as(new PastorApplicationService(meditation)); const safeguarding = as(new SafeguardingService(meditation)); const directory = as(new PastorDirectoryService());
      const form = { displayName: 'Rev. Ama Owusu', slug: 'test-ama-owusu', bio: 'Pastor in Kumasi.', languages: ['en', 'tw'], churchName: 'Synthetic Chapel', ministryRole: 'Associate Pastor', country: 'GH', referenceName: 'Synthetic Bishop', referenceContact: '+233 20 000 0000', trainingCourse: 'Mental Health First Aid', trainingCompletedOn: '2026-09-30', codeOfConduct: true };

      assert.equal((await applications.get('applicant')).status, 'NOT_REQUESTED');
      await assert.rejects(applications.submit('applicant', { ...form, codeOfConduct: false }), /code of conduct/);
      await assert.rejects(applications.submit('applicant', { ...form, slug: 'apply' }), /another web address/);
      await assert.rejects(applications.submit('applicant', { ...form, trainingCompletedOn: '2999-01-01' }), /past date/);
      await assert.rejects(applications.submit('applicant', { ...form, role: 'ADMIN' }), /Invalid application/);
      assert.equal(await tx.ministryVerification.count({ where: { userId: applicant.id } }), 0, 'a rejected form saves nothing');
      await assert.rejects(applications.submit('applicant', { ...form, country: 'Ghana' }), /Country/);

      const mine = await applications.submit('applicant', form);
      assert.equal(mine.status, 'PENDING');
      assert.equal(mine.active, false);
      assert.equal(mine.hasReferenceContact, true);
      assert.ok(mine.codeOfConductSignedOn);
      assert.equal(JSON.stringify(mine).includes('+233'), false, 'the applicant view never echoes the reference contact');
      // Editing without retyping the contact keeps the one on file.
      const edited = await applications.submit('applicant', { ...form, bio: 'Pastor in Kumasi for ten years.', referenceContact: '' });
      assert.equal(edited.bio, 'Pastor in Kumasi for ten years.');
      assert.deepEqual(await directory.list().then(l => l.filter(p => p.slug.startsWith('test-'))), [], 'pending applicants are not listed');

      await assert.rejects(safeguarding.applications('member'), /safeguarding lead/);
      await assert.rejects(safeguarding.approveApplication('member', form.slug), /safeguarding lead/);
      await assert.rejects(safeguarding.approveApplication('applicant', form.slug), /safeguarding lead/);
      const queue = await safeguarding.applications('lead');
      const row = queue.find(a => a.slug === form.slug);
      assert.equal(row.referenceContact, '+233 20 000 0000', 'the lead can check the reference');
      assert.equal(row.status, 'PENDING');
      assert.equal(await tx.safeguardingAction.count({ where: { actorId: lead.id, action: 'viewed-applications' } }), 1, 'opening the list is logged');

      await assert.rejects(safeguarding.rejectApplication('lead', form.slug, ' '), /Say why/);
      await safeguarding.rejectApplication('lead', form.slug, 'Please add a reference from your senior pastor.');
      const rejected = await applications.get('applicant');
      assert.equal(rejected.status, 'REJECTED');
      assert.match(rejected.reviewerNotes, /senior pastor/);
      // Resubmitting sends it back for review.
      assert.equal((await applications.submit('applicant', { ...form, referenceName: 'Synthetic Senior Pastor', referenceContact: '' })).status, 'PENDING');
      await safeguarding.approveApplication('lead', form.slug);
      assert.equal((await applications.get('applicant')).active, true);
      assert.equal((await directory.get(form.slug)).displayName, form.displayName);
      await assert.rejects(safeguarding.approveApplication('lead', form.slug), /Only pending/);
      await assert.rejects(safeguarding.approveApplication('lead', 'test-nobody'), /not found/);
      throw rollback;
    }), error => error === rollback);
  } finally {
    [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY] = previous;
    if (previous[0] === undefined) delete process.env.REFLECTION_ENCRYPTION_KEYS;
    if (previous[1] === undefined) delete process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY;
    await db.$disconnect();
  }
});
