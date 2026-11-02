const {test}=require('node:test');
const assert=require('node:assert/strict');
const {assertStagingDatabases}=require('../../../scripts/staging-target-safety.cjs');
const direct = ref => `postgresql://postgres:synthetic@db.${ref}.supabase.co:5432/postgres`;
const pooled = ref => `postgresql://postgres.${ref}:synthetic@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`;
test('accepts two staging URLs from the same project and a separate production project', () => {
  assert.equal(assertStagingDatabases({DATABASE_URL:pooled('stagingref'),DIRECT_URL:direct('stagingref')},direct('productionref')).stagingRef,'stagingref');
});
test('rejects mismatched staging pooled/direct URLs', () => {
  assert.throws(()=>assertStagingDatabases({DATABASE_URL:pooled('stagingone'),DIRECT_URL:direct('stagingtwo')},direct('productionref')),/different Supabase projects/);
});
test('rejects production database even with staging-labelled pooler', () => {
  assert.throws(()=>assertStagingDatabases({DATABASE_URL:pooled('productionref'),DIRECT_URL:direct('productionref')},direct('productionref')),/matches production/);
});
test('rejects unidentifiable or non-PostgreSQL targets without echoing secrets', () => {
  const secret='synthetic-secret-do-not-print';
  for (const url of [`https://example.com/${secret}`,`postgresql://postgres:${secret}@localhost:5432/postgres`,`postgresql://postgres:${secret}@untrusted.invalid/postgres`]) {
    assert.throws(()=>assertStagingDatabases({DATABASE_URL:url,DIRECT_URL:direct('stagingref')},direct('productionref')),err=>!err.message.includes(secret));
  }
});
