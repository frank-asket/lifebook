const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('reflection backfill defaults to dry-run, preserves data and is idempotent on an isolated restore', { skip: !url }, async () => {
  const target=new URL(url);assert.equal(target.hostname,'127.0.0.1');assert.equal(target.pathname,'/lifebook_restore');
  const script=path.resolve(__dirname,'../scripts/reflection-backfill.cjs');
  const env={...process.env,DATABASE_URL:url,DIRECT_URL:url,REFLECTION_ENCRYPTION_KEYS:JSON.stringify({test:randomBytes(32).toString('hex')}),REFLECTION_ENCRYPTION_ACTIVE_KEY:'test'};
  assert.throws(()=>execFileSync(process.execPath,[script,'--apply'],{env:{...env,DIRECT_URL:'postgresql://placeholder@remote.invalid/postgres'},stdio:'pipe'}),/Command failed/);
  const db=new PrismaClient({datasources:{db:{url}}});let user,meditation;
  try {
    user=await db.user.create({data:{oidcSubject:`backfill-test-${Date.now()}`}});
    meditation=await db.meditation.create({data:{slug:user.id,title:'Fixture',scriptureReference:'LUK.1',explanation:'Fixture',questions:[],guidedPrayer:'Fixture'}});
    const reflection=await db.meditationReflection.create({data:{userId:user.id,meditationId:meditation.id,text:'Legacy synthetic meditation'}});
    const session=await db.dailyWordSession.create({data:{userId:user.id,journeyDate:new Date('2026-01-01'),passageKey:'LUK.1'}});
    const daily=await db.dailyWordReflection.create({data:{sessionId:session.id,content:'Legacy synthetic Daily Word'}});
    const run=(...args)=>JSON.parse(execFileSync(process.execPath,[script,...args],{env,encoding:'utf8'}));
    assert.equal(run().mode,'dry-run');
    assert.equal((await db.meditationReflection.findUnique({where:{id:reflection.id}})).text,'Legacy synthetic meditation');
    const applied=run('--apply');assert.ok(applied.meditations.updated>=1);assert.ok(applied.dailyWord.updated>=1);
    assert.ok((await db.meditationReflection.findUnique({where:{id:reflection.id}})).text.startsWith('lbenc:v1:test:'));
    assert.ok((await db.dailyWordReflection.findUnique({where:{id:daily.id}})).content.startsWith('lbenc:v1:test:'));
    const again=run('--apply');assert.equal(again.meditations.updated,0);assert.equal(again.dailyWord.updated,0);
  } finally {
    if(user)await db.user.deleteMany({where:{id:user.id}});
    if(meditation)await db.meditation.deleteMany({where:{id:meditation.id}});
    await db.$disconnect();
  }
});
