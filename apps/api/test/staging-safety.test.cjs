const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
test('staging/migration tools refuse unsafe targets without logging credentials',()=>{
  const script=path.resolve(__dirname,'../../../scripts/staging-smoke.cjs');
  const secret='synthetic-credential-not-for-logs';
  for(const target of ['https://lifebook-yhbx.onrender.com','https://user:'+secret+'@staging.invalid','https://staging.invalid']){
    const result=spawnSync(process.execPath,[script],{env:{...process.env,LIFEBOOK_STAGING_API_URL:target,LIFEBOOK_STAGING_ACK_SEPARATE_DATABASE:'',LIFEBOOK_STAGING_TOKEN_A:secret},encoding:'utf8'});
    assert.equal(result.status,1);assert.ok(!(result.stdout+result.stderr).includes(secret));
  }
  const migration=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/migration-safety.cjs')],{encoding:'utf8'});
  assert.equal(migration.status,1);assert.match(migration.stderr,/disabled/);
  const backfill=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/reflection-backfill.cjs')],{env:{...process.env,DIRECT_URL:'invalid-url-'+secret},encoding:'utf8'});
  assert.equal(backfill.status,1);assert.ok(!(backfill.stdout+backfill.stderr).includes(secret));
});
