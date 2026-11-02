const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
test('prayer filtering remains owner scoped and cursor scoped',()=>{
 const service=fs.readFileSync(path.resolve(__dirname,'../src/prayer/prayer.service.ts'),'utf8');
 assert.match(service,/\['answered', 'awaiting'\]\.includes\(status\)/);
 assert.match(service,/const where = \{ userId,/);
 assert.match(service,/findFirst\(\{ where: \{ id, \.\.\.where \}/);
 assert.match(service,/findMany\(\{ where, orderBy:/);
});
test('Expo filter persists across pagination requests',()=>{
 const page=fs.readFileSync(path.resolve(__dirname,'../../mobile/app/(tabs)/prayer.tsx'),'utf8');
 assert.match(page,/setFilter/);assert.match(page,/&status=\$\{filter\}/);
});
