const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const studies = [
 { slug: 'understanding-faith', title: 'Understanding Faith', description: 'Seven Scripture-centered lessons on faith and perseverance.', method: 'THEMATIC', lessons: [
 ['Faith and Trust','Hebrews 11:1-6'], ['Hearing the Word','Romans 10:14-17'], ['Faith and Action','James 2:14-26'], ['Faith in Difficulty','1 Peter 1:3-9'], ['Jesus, Our Example','Hebrews 12:1-3'], ['Prayer and Trust','Mark 9:14-29'], ['Persevering in Faith','Hebrews 10:32-39'] ] },
 { slug: 'learning-to-pray', title: 'Learning to Pray', description: 'A guided introduction to biblical prayer.', method: 'THEMATIC', lessons: [
 ['Jesus Teaches Prayer','Matthew 6:5-13'], ['Pray with Confidence','Hebrews 4:14-16'], ['Prayer and Thanksgiving','Philippians 4:4-7'], ['Persistent Prayer','Luke 11:5-13'], ['Praying for Others','1 Timothy 2:1-6'], ['Prayer and Forgiveness','Mark 11:22-25'], ['Prayer in Community','Acts 4:23-31'] ] },
 { slug: 'growing-in-christ', title: 'Growing in Christ', description: 'Discover practices of Christian growth rooted in Scripture.', method: 'THEMATIC', lessons: [
 ['Abiding in Christ','John 15:1-8'], ['Renewing the Mind','Romans 12:1-2'], ['Walking in Love','Ephesians 5:1-2'], ['The Fruit of the Spirit','Galatians 5:16-26'], ['Serving One Another','1 Peter 4:7-11'], ['Unity in Christ','Ephesians 4:1-16'], ['Growing in Grace','2 Peter 3:14-18'] ] }
];
(async () => {
 for (const s of studies) {
  const series = await db.studySeries.upsert({ where: { slug_locale: { slug: s.slug, locale: 'en' } }, create: { slug:s.slug, locale:'en', title:s.title, description:s.description, method:s.method, status:'DRAFT' }, update: { title:s.title, description:s.description } });
  for (let i=0;i<s.lessons.length;i++) {
   const [title,scriptureReference]=s.lessons[i];
   await db.studyLesson.upsert({ where: { seriesId_position: { seriesId:series.id, position:i+1 } }, create: { seriesId:series.id, position:i+1, title, scriptureReference, introduction:`Read ${scriptureReference} carefully. Observe the context before drawing conclusions.`, exegesis:'Editorial review required: add passage-specific exegesis before publication.', reflectionQuestions:['What does this passage teach in its context?','How might you respond faithfully?'] }, update: { title, scriptureReference } });
  }
  console.log('Draft study prepared:',s.title);
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
