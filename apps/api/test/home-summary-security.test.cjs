const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
test('home summary is authenticated, owner-scoped, and never returns prayer text',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,'../src/home.controller.ts'),'utf8');
 assert.match(s,/verifiedSubject\(authorization\)/);
 assert.match(s,/@Header\('Cache-Control', 'no-store'\)/);
 assert.match(s,/prayerEntry.count\(\{ where: \{ userId \} \}/);
 assert.match(s,/answeredAt: null/);
 assert.match(s,/studyEnrollment.findMany/);
 assert.match(s,/enrollment.findMany/);
 assert.doesNotMatch(s,/ciphertext|reflectionQuestions/);
});
