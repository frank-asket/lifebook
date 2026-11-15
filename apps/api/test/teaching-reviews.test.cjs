const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('reflect-metadata');
const { TeachingReviewsService, reviewInput } = require('../dist/editorial/teaching-reviews.service');
const { TeachingReviewsController } = require('../dist/editorial/teaching-reviews.controller');
const { TeachingDiscoveryService } = require('../dist/editorial/teaching-discovery.service');
const fields = { revision: 1, title: '', speaker: '', attribution: '', rightsReference: '', reviewNotes: 'Original notes', locale: 'en' };
const channel = 'UC' + 'a'.repeat(22), videoId = 'AbCdEf12345';

test('review boundaries reject publication, metadata injection and invalid revisions before writes', async () => {
  assert.equal(reviewInput(fields).reviewNotes, fields.reviewNotes);
  for (const body of [null, [], { ...fields, publish: true }, { ...fields, sourceUrl: 'https://evil.invalid' }, { ...fields, revision: 0 }, { ...fields, revision: 1.2 }, { ...fields, locale: 'es' }, { ...fields, title: 'a'.repeat(201) }, { ...fields, reviewNotes: false }]) assert.throws(() => reviewInput(body));
  const reviews = new TeachingReviewsService({ requireEditor: async () => { throw new Error('Forbidden'); } }, { verifyVideo: async () => { throw new Error('must not fetch'); } });
  await assert.rejects(reviews.list('member'), /Forbidden/);
  await assert.rejects(reviews.create('member', {}), /Forbidden/);
  await assert.rejects(reviews.update('member', 'id', fields), /Forbidden/);
  for (const method of ['list', 'create', 'update']) assert.deepEqual(Reflect.getMetadata('__headers__', TeachingReviewsController.prototype[method]), [{ name: 'Cache-Control', value: 'no-store' }]);
});

test('saving a discovered source rechecks the current configured channel and video eligibility', async () => {
  const saved = { key: process.env.YOUTUBE_API_KEY, channels: process.env.YOUTUBE_APPROVED_CHANNEL_IDS, fetch: global.fetch };
  const discovery = new TeachingDiscoveryService({ requireEditor: async auth => { if (auth !== 'editor') throw new Error('Forbidden'); } });
  try {
    process.env.YOUTUBE_API_KEY = 'SYNTHETIC_KEY'; process.env.YOUTUBE_APPROVED_CHANNEL_IDS = channel;
    let calls = 0;
    const eligible = { id: videoId, snippet: { channelId: channel }, status: { privacyStatus: 'public', embeddable: true, uploadStatus: 'processed' } };
    global.fetch = async raw => { calls++; assert.equal(new URL(raw).searchParams.get('id'), videoId); return { ok: true, json: async () => ({ items: [eligible] }) }; };
    await assert.rejects(discovery.verifyVideo('member', channel, videoId), /Forbidden/);
    await assert.rejects(discovery.verifyVideo('editor', 'UC' + 'b'.repeat(22), videoId), /configured channel/);
    await assert.rejects(discovery.verifyVideo('editor', channel, 'bad'), /configured channel/);
    assert.equal(calls, 0);
    assert.equal(await discovery.verifyVideo('editor', channel, videoId), `https://www.youtube.com/watch?v=${videoId}`);
    for (const invalid of [{ ...eligible, snippet: { channelId: 'UC' + 'b'.repeat(22) } }, { ...eligible, status: { ...eligible.status, privacyStatus: 'private' } }, { ...eligible, status: { ...eligible.status, embeddable: false } }, { ...eligible, contentDetails: { contentRating: { ytRating: 'ytAgeRestricted' } } }]) {
      global.fetch = async () => ({ ok: true, json: async () => ({ items: [invalid] }) });
      await assert.rejects(discovery.verifyVideo('editor', channel, videoId), /no longer eligible/);
    }
  } finally {
    global.fetch = saved.fetch;
    for (const [name, value] of [['YOUTUBE_API_KEY', saved.key], ['YOUTUBE_APPROVED_CHANNEL_IDS', saved.channels]]) if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});

const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('private review persistence deduplicates concurrent saves and rejects stale edits without publishing', { skip: !url, timeout: 30000 }, async () => {
  const target = new URL(url); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client'); const db = new PrismaClient({ datasources: { db: { url } } });
  const prefix = randomUUID(); const sourceUrl = `https://www.youtube.com/watch?v=${prefix.slice(0, 11)}`;
  const user = await db.user.create({ data: { oidcSubject: `review-${prefix}`, role: 'MODERATOR' } });
  const reviews = new TeachingReviewsService({ requireEditor: async auth => { if (auth !== 'editor') throw new Error('Forbidden'); return user.id; } }, { verifyVideo: async () => sourceUrl }); reviews.db = db;
  try {
    const protections = await db.$queryRawUnsafe(`SELECT relrowsecurity FROM pg_class WHERE oid = '"TeachingReviewDraft"'::regclass`);
    assert.equal(protections[0].relrowsecurity, true, 'Supabase public API roles have no row access policies');
    await assert.rejects(reviews.create('editor', { videoId, channelId: channel, title: 'Injected metadata' }), /Invalid review fields/);
    const records = await Promise.all(Array.from({ length: 6 }, () => reviews.create('editor', { videoId, channelId: channel })));
    assert.equal(new Set(records.map(row => row.id)).size, 1);
    const draft = records[0]; assert.equal(draft.title, ''); assert.equal(draft.creatorId, user.id); assert.equal(draft.approvedAt, undefined);
    const edited = await reviews.update('editor', draft.id, { ...fields, title: 'My original review', rightsReference: 'Permission not established', reviewNotes: 'Human review remains pending.' });
    assert.equal(edited.revision, 2);
    assert.equal((await reviews.create('editor', { videoId, channelId: channel })).reviewNotes, edited.reviewNotes, 'duplicate discovery cannot overwrite editor notes');
    await assert.rejects(reviews.update('editor', draft.id, fields), error => error.getStatus() === 409);
    const race = await Promise.allSettled(['one', 'two'].map(reviewNotes => reviews.update('editor', draft.id, { ...fields, revision: 2, reviewNotes })));
    assert.equal(race.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(race.find(result => result.status === 'rejected').reason.getStatus(), 409);
    assert.ok((await reviews.list('editor')).some(row => row.id === draft.id));
    assert.equal(await db.sermon.count({ where: { creatorId: user.id } }), 0, 'private candidates never enter the member library');
    await assert.rejects(reviews.update('editor', 'missing', fields), error => error.getStatus() === 404);
  } finally { await db.teachingReviewDraft.deleteMany({ where: { creatorId: user.id } }); await db.user.delete({ where: { id: user.id } }); await db.$disconnect(); }
});
