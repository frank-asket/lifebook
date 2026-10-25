// Opt in only against a disposable loopback database. Fixtures always roll back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('node:crypto');
const { PrayerService } = require('../dist/prayer/prayer.service');
const { MeditationService } = require('../dist/meditation/meditation.service');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('prayer journal encrypts every field, binds ciphertext to its record and enforces ownership', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_PRAYER_TEST');
  const previousRing = process.env.REFLECTION_ENCRYPTION_KEYS;
  const previousActive = process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY;
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  try {
    await assert.rejects(db.$transaction(async tx => {
      const prefix = `prayer-test-${Date.now()}`;
      const first = await tx.user.create({ data: { oidcSubject: `${prefix}-first` } });
      const second = await tx.user.create({ data: { oidcSubject: `${prefix}-second` } });
      const meditation = new MeditationService();
      const prayers = new PrayerService(meditation, { choose: async () => null, present: verse => verse });
      for (const service of [meditation, prayers]) await service.onModuleDestroy();
      prayers.db = tx; prayers.userId = async auth => auth === 'first' ? first.id : second.id;

      const body = 'Synthetic prayer: please guide my family through this week.';
      const created = await prayers.create('first', { title: '  Family  ', body: `  ${body}  ` });
      assert.equal(created.title, 'Family');
      assert.equal(created.body, body);
      const stored = await tx.prayerEntry.findUnique({ where: { id: created.id } });
      for (const value of [stored.ciphertext, stored.titleCiphertext]) {
        assert.ok(value.startsWith('lbenc:v1:test:'));
        assert.ok(!value.includes('Synthetic') && !value.includes('Family'));
      }

      const listed = await prayers.list('first');
      assert.equal(listed.length, 1);
      assert.equal(listed[0].preview, body);
      assert.equal('body' in listed[0], false, 'lists carry a preview, not the full prayer');
      assert.deepEqual(await prayers.list('second'), []);

      // Another account gets the same answer as for a prayer that does not exist.
      await assert.rejects(prayers.get('second', created.id), /not found/);
      await assert.rejects(prayers.update('second', created.id, { body: 'overwrite' }), /not found/);
      await assert.rejects(prayers.answer('second', created.id, { answered: true }), /not found/);
      await assert.rejects(prayers.remove('second', created.id), /not found/);
      assert.equal((await prayers.removeAll('second', 'DELETE_ALL_PRAYERS')).deleted, 0);
      assert.equal((await prayers.get('first', created.id)).body, body);

      const edited = await prayers.update('first', created.id, { title: '', body: 'Edited synthetic prayer' });
      assert.equal(edited.title, null);
      assert.equal(edited.body, 'Edited synthetic prayer');
      const answered = await prayers.answer('first', created.id, { answered: true, note: 'Synthetic answer note' });
      assert.ok(answered.answeredAt);
      assert.equal(answered.answerNote, 'Synthetic answer note');
      const again = await prayers.answer('first', created.id, { answered: true, note: 'Second note' });
      assert.equal(again.answeredAt.getTime(), answered.answeredAt.getTime(), 'answering again keeps the original date');
      const cleared = await prayers.answer('first', created.id, { answered: false });
      assert.equal(cleared.answeredAt, null);
      assert.equal(cleared.answerNote, null);

      await assert.rejects(prayers.create('first', { body: '   ' }), /required/);
      await assert.rejects(prayers.create('first', { body: 'x'.repeat(5001) }), /too long/);
      await assert.rejects(prayers.create('first', { body: 'ok', title: 'x'.repeat(121) }), /too long/);
      await assert.rejects(prayers.create('first', { body: 42 }), /Invalid/);
      await assert.rejects(prayers.update('first', created.id, {}), /No changes/);
      await assert.rejects(prayers.answer('first', created.id, { answered: 'yes' }), /Invalid/);
      await assert.rejects(prayers.get('first', '../other'), /not found/);

      // Ciphertext moved to another record, or plaintext written directly, must not open.
      const other = await prayers.create('first', { body: 'Second synthetic prayer' });
      const moved = await tx.prayerEntry.findUnique({ where: { id: created.id } });
      await tx.prayerEntry.update({ where: { id: other.id }, data: { ciphertext: moved.ciphertext } });
      await assert.rejects(prayers.get('first', other.id), /cannot be opened/);
      await tx.prayerEntry.update({ where: { id: other.id }, data: { ciphertext: 'plain text prayer' } });
      await assert.rejects(prayers.get('first', other.id), /cannot be opened/);

      await assert.rejects(prayers.removeAll('first', 'yes'), /Confirmation required/);
      await prayers.create('second', { body: 'Second account synthetic prayer' });
      assert.equal((await prayers.removeAll('first', 'DELETE_ALL_PRAYERS')).deleted, 2);
      assert.deepEqual(await prayers.list('first'), []);
      assert.equal((await prayers.list('second')).length, 1, 'deleting one journal leaves other accounts untouched');
      throw rollback;
    }), error => error === rollback);
  } finally {
    if (previousRing === undefined) delete process.env.REFLECTION_ENCRYPTION_KEYS; else process.env.REFLECTION_ENCRYPTION_KEYS = previousRing;
    if (previousActive === undefined) delete process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY; else process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = previousActive;
    await db.$disconnect();
  }
});
