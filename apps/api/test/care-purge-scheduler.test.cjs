const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CarePurgeScheduler } = require('../dist/care/care-purge.scheduler');

function fakeDb({ locked = true, fail = false } = {}) {
  const calls = [];
  const tx = {
    $queryRaw: async () => [{ locked }],
    careRequest: { count: async () => 2, updateMany: async () => calls.push('close'), deleteMany: async () => calls.push('delete') },
    careMessage: { count: async () => 5 },
    careReport: { count: async () => 1, deleteMany: async () => calls.push('reports') },
  };
  return { calls, $transaction: async fn => { if (fail) throw Object.assign(new Error('value "secret" broke'), { name: 'PrismaClientKnownRequestError' }); return fn(tx); } };
}

test('care purge schedule is off unless CARE_PURGE_SCHEDULE=on', () => {
  assert.equal(CarePurgeScheduler.enabled({}), false);
  assert.equal(CarePurgeScheduler.enabled({ CARE_PURGE_SCHEDULE: 'true' }), false);
  assert.equal(CarePurgeScheduler.enabled({ CARE_PURGE_SCHEDULE: 'on' }), true);
});

test('a scheduled pass applies retention under the lock and returns counts', async () => {
  const db = fakeDb();
  const result = await new CarePurgeScheduler(db).run();
  assert.deepEqual(result, { applied: true, unclaimedClosed: 2, requestsDeleted: 2, messagesDeleted: 5, reportsDeleted: 1 });
  assert.deepEqual(db.calls, ['close', 'delete', 'reports']);
});

test('a pass skips when another instance holds the lock, and failures are contained', async () => {
  const busy = fakeDb({ locked: false });
  assert.equal(await new CarePurgeScheduler(busy).run(), null);
  assert.deepEqual(busy.calls, []);
  assert.equal(await new CarePurgeScheduler(fakeDb({ fail: true })).run(), null);
});
