const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');

test('exact annotation HTTP response preserves missing and existing records as JSON', async () => {
  const { Module } = require('@nestjs/common');
  const { NestFactory } = require('@nestjs/core');
  const { BibleAnnotationsController } = require('../dist/bible-annotations/bible-annotations.controller');
  const { BibleAnnotationsService } = require('../dist/bible-annotations/bible-annotations.service');
  let annotation = null;
  class FixtureModule {}
  Module({ controllers: [BibleAnnotationsController], providers: [{ provide: BibleAnnotationsService, useValue: {
    one: async (auth, locale, passageId) => {
      assert.equal(auth, 'Bearer synthetic-token');
      assert.equal(locale, 'fr');
      assert.equal(passageId, 'JHN.1.1');
      return annotation;
    },
  } }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  try {
    for (const value of [null, { id: 'synthetic-note', note: 'Synthetic private note' }]) {
      annotation = value;
      const response = await fetch(`${await app.getUrl()}/bible-annotations/passage?locale=fr&passageId=JHN.1.1`, { headers: { Authorization: 'Bearer synthetic-token' } });
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /json/);
      assert.deepEqual(await response.json(), { annotation: value });
    }
  } finally { await app.close(); }
});
