const { test } = require('node:test');
const assert = require('node:assert/strict');
const { get, validDailyWord, approvedLegalPage, verifiedContacts, reviewedDays, validDate } = require('../scripts/lib/launch-readiness.cjs');

test('read-only network checks retry transient failures once, but preserve failed readiness', async () => {
  let attempts = 0;
  const response = await get('https://example.invalid', async () => {
    if (++attempts === 1) throw new Error('cold start');
    return { status: 200, text: async () => 'ok' };
  });
  assert.equal(response.status, 200); assert.equal(response.attempts, 2);
  const unavailable = await get('https://example.invalid', async () => ({ status: 503, text: async () => 'not ready' }));
  assert.equal(unavailable.status, 503); assert.equal(unavailable.attempts, 2);
  let denied = 0;
  assert.equal((await get('https://example.invalid', async () => { denied++; return { status: 403, text: async () => '' }; })).status, 403);
  assert.equal(denied, 1, 'a permanent authorization failure is not retried');
  const failure = await get('https://example.invalid', async () => { throw new Error('not reachable'); });
  assert.equal(failure.status, 0); assert.equal(failure.attempts, 2);
});

test('a generic successful page or a draft legal notice cannot pass legal publication', () => {
  for (const body of ['', '<h1>Welcome</h1>', '<meta name="lifebook-legal-status" content="draft">', '<p>approved</p>', '<meta name="lifebook-legal-status" content="approved"><p>This pre-launch overview is not final.</p>']) assert.equal(approvedLegalPage({ status: 200, body }), false);
  assert.equal(approvedLegalPage({ status: 404, body: '<meta name="lifebook-legal-status" content="approved">' }), false);
  assert.equal(approvedLegalPage({ status: 200, body: '<meta content="approved" name="lifebook-legal-status"/>' }), true);
});

test('removing DRAFT does not verify crisis contacts; named, dated confirmation is required', () => {
  const today = '2026-10-26';
  assert.equal(verifiedContacts('', today), false);
  assert.equal(verifiedContacts('**Status:** VERIFIED', today), false);
  assert.equal(verifiedContacts('**Status:** VERIFIED\n**Verified by:** TBD\n**Verified on:** 2026-10-25', today), false);
  assert.equal(verifiedContacts('**Status:** VERIFIED\n**Verified by:** Local reviewer\n**Verified on:** 2026-02-31', today), false);
  assert.equal(verifiedContacts('**Status:** VERIFIED\n**Verified by:** Local reviewer\n**Verified on:** 2026-10-27', today), false);
  assert.equal(verifiedContacts('**Status:** VERIFIED\n**Verified by:** Local reviewer\n**Verified on:** 2026-10-25', today), true);
});

test('Daily Word launch coverage requires upcoming days, not 30 unrelated past approvals', () => {
  const library = { entries: Array.from({ length: 30 }, (_, index) => ({ date: `01-${String(index + 1).padStart(2, '0')}`, review: { status: 'reviewed', reviewedBy: 'Reviewer', reviewedOn: '2026-01-01' } })) };
  assert.equal(reviewedDays(library, '2026-11-01').reviewed, 0);
  library.entries = Array.from({ length: 30 }, (_, index) => ({ date: `11-${String(index + 1).padStart(2, '0')}`, review: { status: 'reviewed', reviewedBy: 'Reviewer', reviewedOn: '2026-10-26' } }));
  assert.equal(reviewedDays(library, '2026-11-01', 30, '2026-10-26').reviewed, 30);
  library.entries[0].review.reviewedOn = '2026-10-30';
  assert.equal(reviewedDays(library, '2026-11-01', 30, '2026-10-26').reviewed, 29, 'future approval dates do not pass a scheduled launch check');
  library.entries[0].review.reviewedOn = '2026-10-26';
  library.entries[0].review.reviewedBy = '';
  assert.equal(reviewedDays(library, '2026-11-01').reviewed, 29);
  library.entries[0].review = { status: 'reviewed', reviewedBy: 'Reviewer', reviewedOn: '2026-11-02' };
  assert.equal(reviewedDays(library, '2026-11-01').reviewed, 29);
  assert.equal(reviewedDays({ entries: [] }, '2026-12-25').missing[7], '2027-01-01', 'the launch window crosses years');
  assert.throws(() => reviewedDays(library, '2026-02-31'), /real/);
  assert.equal(validDate('2026-02-31'), false); assert.equal(validDate('2028-02-29'), true);
});

test('Scripture readiness needs a successful response with real text/reference, not a translation label alone', () => {
  const verse = { translation: 'King James Version', text: 'Synthetic passage', reference: 'Fixture 1:1' };
  const response = (status, value) => ({ status, body: JSON.stringify({ verse: value }) });
  assert.equal(validDailyWord(response(200, verse), 'en'), true);
  assert.equal(validDailyWord(response(503, verse), 'en'), false);
  assert.equal(validDailyWord(response(200, { ...verse, text: '' }), 'en'), false);
  assert.equal(validDailyWord(response(200, { ...verse, reference: '' }), 'en'), false);
  assert.equal(validDailyWord(response(200, verse), 'fr'), false);
  assert.equal(validDailyWord(response(200, { ...verse, translation: 'Bible J.N. Darby' }), 'fr'), true);
});
