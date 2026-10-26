const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { TeachingDiscoveryService } = require('../dist/editorial/teaching-discovery.service');
const { TeachingDiscoveryController } = require('../dist/editorial/teaching-discovery.controller');
const channel = 'UC' + 'a'.repeat(22); const other = 'UC' + 'b'.repeat(22);
const id = index => 'vid' + String(index).padStart(8, '0');
const video = (index, extra = {}) => ({ id: id(index), snippet: { title: '<b>Synthetic title</b>', channelId: channel, channelTitle: 'Synthetic ministry', publishedAt: '2026-10-26T00:00:00Z', defaultAudioLanguage: 'en' }, contentDetails: { duration: 'PT10M', caption: 'true' }, status: { privacyStatus: 'public', embeddable: true, uploadStatus: 'processed' }, ...extra });

test('discovery is restricted, opt-in, bounded and read-only; errors never leak the key', async () => {
  const saved = { key: process.env.YOUTUBE_API_KEY, channels: process.env.YOUTUBE_APPROVED_CHANNEL_IDS, fetch: global.fetch };
  const service = new TeachingDiscoveryService({ requireEditor: async auth => { if (auth !== 'editor') throw new Error('Forbidden'); } });
  let calls = [];
  try {
    process.env.YOUTUBE_API_KEY = ''; process.env.YOUTUBE_APPROVED_CHANNEL_IDS = '';
    global.fetch = async () => { throw new Error('must not fetch'); };
    await assert.rejects(service.sources('member'), /Forbidden/);
    await assert.rejects(service.videos('member', channel), /Forbidden/);
    assert.deepEqual(await service.sources('editor'), { enabled: false, sources: [] });
    process.env.YOUTUBE_APPROVED_CHANNEL_IDS = `${channel},${channel}`;
    assert.equal((await service.sources('editor')).sources.length, 1);
    await assert.rejects(service.videos('editor', channel), /not configured/);
    process.env.YOUTUBE_APPROVED_CHANNEL_IDS = 'https://malicious.invalid/';
    await assert.rejects(service.sources('editor'), /not configured correctly/);
    process.env.YOUTUBE_APPROVED_CHANNEL_IDS = channel; process.env.YOUTUBE_API_KEY = 'PRIVATE_TEST_KEY';
    assert.equal((await service.sources('editor')).enabled, true);
    assert.ok(!JSON.stringify(await service.sources('editor')).includes('PRIVATE_TEST_KEY'));
    await assert.rejects(service.videos('editor', other), /approved channel/);
    await assert.rejects(service.videos('editor', channel, 'https://evil.invalid'), /Invalid discovery page/);
    await assert.rejects(service.videos('editor', [channel]), /approved channel/);
    global.fetch = async (raw, options) => {
      const url = new URL(raw); calls.push(url);
      assert.equal(url.origin, 'https://www.googleapis.com'); assert.equal(url.searchParams.get('key'), 'PRIVATE_TEST_KEY');
      assert.equal(options.redirect, 'error'); assert.ok(options.signal); assert.equal(options.headers, undefined, 'participant tokens never reach Google');
      const resource = url.pathname.split('/').at(-1);
      if (resource === 'channels') return { ok: true, json: async () => ({ items: [{ id: channel, contentDetails: { relatedPlaylists: { uploads: 'UU_test_uploads' } } }] }) };
      if (resource === 'playlistItems') { assert.equal(url.searchParams.get('maxResults'), '12'); return { ok: true, json: async () => ({ items: Array.from({ length: 8 }, (_, index) => ({ contentDetails: { videoId: id(index) } })).concat([{ contentDetails: { videoId: id(0) } }, { contentDetails: { videoId: 'javascript:bad' } }]), nextPageToken: 'next_page=' }) }; }
      assert.equal(resource, 'videos'); assert.equal(url.searchParams.get('id').split(',').length, 8);
      return { ok: true, json: async () => ({ items: [video(0), video(0), video(1, { status: { privacyStatus: 'private', embeddable: true, uploadStatus: 'processed' } }), video(2, { status: { privacyStatus: 'public', embeddable: false, uploadStatus: 'processed' } }), video(3, { snippet: { channelId: other, title: 'wrong source', channelTitle: 'other' } }), video(4, { contentDetails: { contentRating: { ytRating: 'ytAgeRestricted' } } }), video(5, { contentDetails: { regionRestriction: { blocked: ['GH'] } } }), video(6, { snippet: { channelId: channel, title: null } }), video(7, { status: { privacyStatus: 'public', embeddable: true, uploadStatus: 'uploaded' } }), video(90)] }) };
    };
    const result = await service.videos('editor', channel);
    assert.equal(calls.length, 3); assert.deepEqual(result.items.map(item => item.id), [id(0), id(5)]);
    assert.equal(result.items[0].sourceUrl, `https://www.youtube.com/watch?v=${id(0)}`);
    assert.equal(result.items[0].publisher, 'Synthetic ministry'); assert.equal(result.items[0].captionsAvailable, true);
    assert.equal(result.items[1].regionRestricted, true); assert.equal(result.nextPageToken, 'next_page='); assert.equal(result.reviewRequired, true);
    assert.equal(result.items[0].description, undefined); assert.equal(result.items[0].transcript, undefined);
    assert.ok(!JSON.stringify(result).includes('PRIVATE_TEST_KEY'));
    global.fetch = async () => { throw new Error('PRIVATE_TEST_KEY network detail'); };
    await assert.rejects(service.videos('editor', channel), error => error.getStatus() === 503 && !error.message.includes('PRIVATE_TEST_KEY'));
    global.fetch = async () => ({ ok: false, json: async () => ({ error: 'PRIVATE_TEST_KEY' }) });
    await assert.rejects(service.videos('editor', channel), /discovery is unavailable/);
    global.fetch = async () => ({ ok: true, json: async () => ({ items: [null] }) });
    await assert.rejects(service.videos('editor', channel), /discovery is unavailable/);
    global.fetch = async () => ({ ok: true, json: async () => ({ items: [{ id: channel, contentDetails: { relatedPlaylists: { uploads: 'https://evil.invalid' } } }] }) });
    await assert.rejects(service.videos('editor', channel), /uploads are unavailable/);
    for (const method of ['sources', 'videos']) assert.deepEqual(Reflect.getMetadata('__headers__', TeachingDiscoveryController.prototype[method]), [{ name: 'Cache-Control', value: 'no-store' }]);
  } finally {
    global.fetch = saved.fetch;
    for (const [key, value] of [['YOUTUBE_API_KEY', saved.key], ['YOUTUBE_APPROVED_CHANNEL_IDS', saved.channels]]) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
