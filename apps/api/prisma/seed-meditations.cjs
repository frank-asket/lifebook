/** Curated starter meditations. No copyrighted Bible text is reproduced.
 * Run with: pnpm --filter @lifebook/api exec node prisma/seed-meditations.cjs
 * Publish only after editorial approval: LIFEBOOK_PUBLISH_STARTER=true ...
 */
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const entries = require('../content/starter-meditations.json');

(async()=>{
 const start = process.env.LIFEBOOK_START_DATE ? new Date(`${process.env.LIFEBOOK_START_DATE}T00:00:00.000Z`) : new Date();
 if(Number.isNaN(start.getTime())) throw new Error('Invalid LIFEBOOK_START_DATE; use YYYY-MM-DD');
 start.setUTCHours(0,0,0,0);
 const publish=process.env.LIFEBOOK_PUBLISH_STARTER==='true';
 for(let i=0;i<entries.length;i++){
  const entry=entries[i]; const date=new Date(start);date.setUTCDate(start.getUTCDate()+i);
  for(const locale of ['en','fr']){
   const [title,scriptureReference,explanation,questions,guidedPrayer]=entry[locale];
   const slug=`starter-${entry.key}-${locale}`;
   await db.meditation.upsert({where:{slug},create:{slug,title,scriptureReference,explanation,questions,guidedPrayer,locale,publishDate:date,isPublished:publish},update:{title,scriptureReference,explanation,questions,guidedPrayer,publishDate:date}});
   console.log(`${slug}: ${date.toISOString().slice(0,10)} ${publish?'new records published':'draft / existing status preserved'}`);
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
