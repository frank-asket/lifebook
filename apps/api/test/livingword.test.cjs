const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LivingWordService, mediaUrl } = require('../dist/livingword/livingword.service');
const { PrismaClient } = require('@prisma/client');

test('media URLs require an approved public HTTPS host with no embedded credentials or query secrets', () => {
  const previous = process.env.LIVINGWORD_MEDIA_HOSTS;
  process.env.LIVINGWORD_MEDIA_HOSTS = 'media.example.invalid,localhost,127.0.0.1,private.internal';
  try {
    assert.equal(mediaUrl('https://media.example.invalid/audio.mp3'), 'https://media.example.invalid/audio.mp3');
    for (const url of ['not-a-url', 'http://media.example.invalid/audio.mp3', 'https://other.example.invalid/audio.mp3', 'https://member:secret@media.example.invalid/a', 'https://media.example.invalid/a?token=synthetic', 'https://media.example.invalid/a#fragment', 'https://media.example.invalid:8443/a', 'https://127.0.0.1/a', 'https://localhost/a', 'https://private.internal/a']) assert.throws(() => mediaUrl(url));
  } finally { if (previous === undefined) delete process.env.LIVINGWORD_MEDIA_HOSTS; else process.env.LIVINGWORD_MEDIA_HOSTS = previous; }
});
const url = process.env.LIFEBOOK_LEARNING_TEST_DATABASE_URL;
test('LivingWord publication enforces editorial roles, rights, transcript, language and public field boundaries', { skip: !url }, async () => {
  const target = new URL(url); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  const db = new PrismaClient({ datasources: { db: { url } } }); const prefix = `library-${Date.now()}`;
  const previous = process.env.LIVINGWORD_MEDIA_HOSTS; process.env.LIVINGWORD_MEDIA_HOSTS = 'media.example.invalid';
  const users = {};
  const library = new LivingWordService({ userId: async auth => { if (!auth) throw new Error('Unauthorized'); return users[auth].id; } }); library.db = db;
  try {
    users.member = await db.user.create({ data: { oidcSubject: `${prefix}-member` } });
    users.editor = await db.user.create({ data: { oidcSubject: `${prefix}-editor`, role: 'MODERATOR' } });
    const input = { title: prefix, speaker: 'Synthetic teacher', mediaUrl: 'https://media.example.invalid/teaching.mp3', locale: 'fr', kind: 'audio', attribution: 'Synthetic approved credit', transcript: 'Synthetic accessible transcript', rightsReference: 'private-license-reference', publish: false };
    await assert.rejects(library.save(undefined, undefined, input), /Unauthorized/);
    await assert.rejects(library.save('member', undefined, input), /Only LifeBook editors/);
    await assert.rejects(library.save('editor', undefined, { ...input, transcript: ' ' }), /transcript/);
    const draft = await library.save('editor', undefined, input);
    assert.equal((await library.list('fr', prefix)).total, 0);
    await assert.rejects(library.details(draft.id), /not found/);
    await library.save('editor', draft.id, { ...input, publish: true });
    const list = await library.list('fr', prefix.toUpperCase()); assert.equal(list.total, 1);
    assert.equal(list.items[0].transcript, input.transcript);
    assert.equal(list.items[0].mediaUrl, input.mediaUrl);
    assert.equal((await library.list('en', prefix)).total, 0);
    assert.ok(!JSON.stringify(list).includes(input.rightsReference));
    assert.equal(list.items[0].approvedById, undefined); assert.equal(list.items[0].creatorId, undefined);
    assert.equal((await library.details(draft.id)).title, prefix);
    await db.sermon.update({ where: { id: draft.id }, data: { publishedAt: new Date(Date.now() + 86400000) } });
    assert.equal((await library.list('fr', prefix)).total, 0);
    await assert.rejects(library.details(draft.id), /not found/);
    await library.save('editor', draft.id, { ...input, publish: true });
    process.env.LIVINGWORD_MEDIA_HOSTS = '';
    assert.equal((await library.list('fr', prefix)).total, 0);
    process.env.LIVINGWORD_MEDIA_HOSTS = 'media.example.invalid';
    await assert.rejects(library.unpublish('member', draft.id), /Only LifeBook editors/);
    await library.unpublish('editor', draft.id); assert.equal((await library.list('fr', prefix)).total, 0);
    for (const page of ['0', '-1', '1.5', '10000']) await assert.rejects(library.list('fr', '', page), /Invalid library/);
    await assert.rejects(library.list('fr', 'x'.repeat(81)), /Invalid library/);
    await assert.rejects(library.list('de'), /Invalid library/);
  } finally {
    await db.sermon.deleteMany({ where: { title: { startsWith: prefix } } });
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } }); await db.$disconnect();
    if (previous === undefined) delete process.env.LIVINGWORD_MEDIA_HOSTS; else process.env.LIVINGWORD_MEDIA_HOSTS = previous;
  }
});
