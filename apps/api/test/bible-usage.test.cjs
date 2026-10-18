const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { BibleContentService, validUsage, usageUrl } = require('../dist/bible-content/bible-content.service');
const { BibleContentController } = require('../dist/bible-content/bible-content.controller');

const token = 'abcDEF123_-.~+/=xyz';
const ok = { tokens: [token], deviceId: 'b8a1c2d3-1111-4222-8333-944455556666', sessionId: 's1234567-aaaa' };

test('only well-formed usage reports are accepted', () => {
  assert.deepEqual(validUsage(ok), ok);
  assert.deepEqual(validUsage({ ...ok, tokens: [token, token] }).tokens, [token]);
  for (const bad of [null, 'x', {}, { ...ok, tokens: [] }, { ...ok, tokens: Array(21).fill(token) }, { ...ok, tokens: ['short'] }, { ...ok, tokens: ['<script>alert(1)</script>xx'] },
    { ...ok, deviceId: 'a@b.com-user' }, { ...ok, sessionId: '' }, { ...ok, deviceId: 'x'.repeat(65) }]) {
    assert.equal(validUsage(bad), null, JSON.stringify(bad).slice(0, 60));
  }
});

test('the FUMS v3 URL carries every token, the device and session, and no user', () => {
  const url = new URL(usageUrl(['t1aaaaaaaa', 't2bbbbbbbb'], ok.deviceId, ok.sessionId));
  assert.equal(url.origin + url.pathname, 'https://fums.api.bible/f3');
  assert.deepEqual(url.searchParams.getAll('t'), ['t1aaaaaaaa', 't2bbbbbbbb']);
  assert.equal(url.searchParams.get('dId'), ok.deviceId);
  assert.equal(url.searchParams.get('sId'), ok.sessionId);
  assert.equal(url.searchParams.has('uId'), false);
});

test('Scripture requests ask for a usage token and return it with the text', async () => {
  const calls = [];
  const realFetch = global.fetch;
  process.env.API_BIBLE_KEY = 'test'; process.env.API_BIBLE_EN_BIBLE_ID = 'en-bible';
  global.fetch = async (url) => { calls.push(String(url)); return { ok: true, json: async () => ({ data: { id: 'JHN.1', reference: 'John 1', content: '[1] In the beginning was the Word.' }, meta: { fumsToken: 'tok-12345678' } }) }; };
  try {
    const service = new BibleContentService();
    const passage = await service.passage('en', 'JHN.1.1');
    const chapter = await service.chapter('en', 'JHN.1');
    assert.equal(passage.fumsToken, 'tok-12345678');
    assert.equal(chapter.data.fumsToken, 'tok-12345678');
    assert.ok(calls.every(u => u.includes('fums-version=3')), calls.join('\n'));
  } finally { global.fetch = realFetch; }
});

test('the usage endpoint forwards valid reports and rejects bad ones, and FUMS can be switched off', async () => {
  const sent = [];
  const realFetch = global.fetch;
  global.fetch = async (url) => { sent.push(String(url)); return { ok: true }; };
  try {
    const controller = new BibleContentController(new BibleContentService());
    controller.usage(ok);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(sent.length, 1);
    assert.match(sent[0], /^https:\/\/fums\.api\.bible\/f3\?t=/);
    assert.throws(() => controller.usage({ tokens: [] }), /Invalid usage report/);
    process.env.API_BIBLE_FUMS = 'off';
    controller.usage(ok);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(sent.length, 1);
  } finally { global.fetch = realFetch; delete process.env.API_BIBLE_FUMS; }
});
