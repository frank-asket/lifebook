// Read-only provider preflight. Keys and Scripture text are never logged.
const ids = { en: process.env.API_BIBLE_EN_BIBLE_ID, fr: process.env.API_BIBLE_FR_BIBLE_ID };
(async () => {
  if (!process.env.API_BIBLE_KEY || Object.values(ids).some(id => !id)) throw new Error();
  let failed = false;
  async function get(locale, id, suffix, check) {
    const response = await fetch(`https://rest.api.bible/v1/bibles/${encodeURIComponent(id)}${suffix}`, { headers: { 'api-key': process.env.API_BIBLE_KEY, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    console.log(JSON.stringify({ locale, check, status: response.status }));
    if (!response.ok) { failed = true; await response.arrayBuffer(); return null; }
    return response.json();
  }
  for (const [locale, id] of Object.entries(ids)) {
    await get(locale, id, '', 'translation');
    const books = await get(locale, id, '/books', 'books');
    const book = books?.data?.find(item => item.id === 'GEN') || books?.data?.[0];
    if (!book) { failed = true; continue; }
    const chapters = await get(locale, id, `/books/${encodeURIComponent(book.id)}/chapters`, 'chapters');
    const chapter = chapters?.data?.find(item => /^[1-9][0-9]*$/.test(item.number));
    if (!chapter) { failed = true; continue; }
    const text = await get(locale, id, `/chapters/${encodeURIComponent(chapter.id)}?content-type=text&include-notes=false`, 'chapter');
    if (typeof text?.data?.content !== 'string' || !text.data.content.trim()) failed = true;
  }
  if (failed) process.exitCode = 1;
})().catch(error => { console.error(error.name === 'TimeoutError' ? 'Bible provider timed out' : 'Bible preflight failed; verify server configuration and account access'); process.exitCode = 1; });
