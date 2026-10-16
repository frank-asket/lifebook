// Opt-in staged account tests. Does not create or sign into Clerk accounts.
const assert = require('node:assert/strict');
const base = process.env.LIFEBOOK_STAGING_API_URL?.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
const tokens = [process.env.LIFEBOOK_STAGING_TOKEN_A, process.env.LIFEBOOK_STAGING_TOKEN_B];
const writes = process.env.LIFEBOOK_STAGING_ALLOW_WRITES === 'yes';
async function main() {
  assert.ok(base, 'Set LIFEBOOK_STAGING_API_URL');
  const target = new URL(base);
  assert.equal(target.protocol, 'https:');
  assert.ok(!target.username && !target.password, 'Do not include credentials in staging URLs');
  assert.ok(target.hostname.includes('staging'), 'Use a separate staging hostname');
  assert.notEqual(target.hostname, 'lifebook-yhbx.onrender.com');
  assert.equal(process.env.LIFEBOOK_STAGING_ACK_SEPARATE_DATABASE, 'yes', 'Verify the staging service has a separate database first');
  async function request(path, token, options = {}, expected = 200) {
    const response = await fetch(`${base}/api/v1${path}`, { ...options, redirect: 'error', signal: AbortSignal.timeout(20000), headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
    assert.equal(response.status, expected, `${options.method || 'GET'} ${path}`);
    return response.status === 204 ? null : response.json();
  }
  for (const path of ['/health','/bible-reading/plans?locale=en','/bible-reading/plans?locale=fr']) await request(path);
  for (const path of ['/me/profile','/bible-reading/history','/bible-annotations','/daily-word/sessions']) await request(path, null, {}, 401);
  for (const locale of ['en','fr']) {
    const books = await request(`/bible-content/books?locale=${locale}`);
    assert.ok(books.data.length);
    const book = books.data.find(item => item.id === 'GEN') || books.data[0];
    const chapters = await request(`/bible-content/books/${encodeURIComponent(book.id)}/chapters?locale=${locale}`);
    const chapter = chapters.data.find(item => /^[1-9][0-9]*$/.test(item.number)); assert.ok(chapter);
    const text = await request(`/bible-content/chapters/${encodeURIComponent(chapter.id)}?locale=${locale}`);
    assert.ok(text.data.content.trim());
  }
  console.log('Staging public/provider/unauthenticated checks passed.');
  if (!writes) { console.log('Authenticated writes not run: set both dedicated-account tokens and LIFEBOOK_STAGING_ALLOW_WRITES=yes.'); return; }
  assert.ok(tokens.every(Boolean), 'Supply two dedicated staging-account tokens through the environment');
  const [a,b] = await Promise.all(tokens.map(token => request('/me/profile',token)));
  assert.notEqual(a.userId,b.userId,'Two different staging accounts are required');
  const token = tokens[0];
  const enrollment = await request('/bible-reading/plans/discover-jesus/enroll',token,{method:'POST'},201);
  const before = (await request('/bible-reading/my-plans',token)).find(row=>row.id===enrollment.id);
  await request('/bible-reading/history',token,{method:'PUT',body:JSON.stringify({locale:'en',chapterId:'LUK.1'})});
  assert.equal((await request('/bible-reading/continue',token)).chapterId,'LUK.1');
  const opened = (await request('/bible-reading/my-plans',token)).find(row=>row.id===enrollment.id);
  assert.equal(opened.completedDays,before.completedDays,'A visit must not complete a day');
  await request(`/bible-reading/enrollments/${enrollment.id}/complete-day`,tokens[1],{method:'POST',body:JSON.stringify({day:1})},404);
  for(let i=0;i<2;i++) await request(`/bible-reading/enrollments/${enrollment.id}/complete-day`,token,{method:'POST',body:JSON.stringify({day:1})},201);
  const after=(await request('/bible-reading/my-plans',token)).find(row=>row.id===enrollment.id);
  assert.equal(after.completedDays,before.completedDays+(before.completions.some(row=>row.day===1)?0:1));
  console.log('Two-account staging history/progress/ownership checks passed. Dedicated test records remain in staging.');
}
main().catch(error=>{console.error('Staging smoke check failed:',error.message.replace(/Bearer\s+\S+/g,'Bearer [redacted]'));process.exitCode=1});
