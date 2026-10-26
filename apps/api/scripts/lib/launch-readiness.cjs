// Read-only launch checks. Exported separately so network failures and approval gates can be tested offline.
const DAY = 86400000;
const json = text => { try { return JSON.parse(text); } catch { return null; } };
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

async function get(url, fetcher = fetch, timeoutMs = 30000) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' });
      const body = await response.text();
      if (attempt === 1 && [502, 503, 504].includes(response.status)) continue;
      return { status: response.status, body, attempts: attempt };
    } catch {
      if (attempt === 2) return { status: 0, body: '', attempts: attempt };
    }
  }
}

function validDailyWord(response, locale) {
  const verse = json(response.body)?.verse;
  const translation = locale === 'fr' ? /Darby/ : /King James/;
  return response.status === 200 && translation.test(verse?.translation || '') && typeof verse.text === 'string' && !!verse.text.trim() && typeof verse.reference === 'string' && !!verse.reference.trim();
}

function approvedLegalPage(response) {
  if (response.status !== 200 || /pre-launch (?:privacy )?overview|pre-launch placeholder|not (?:a )?final (?:privacy|legal)|aperçu avant lancement|texte complet doit être validé/i.test(response.body)) return false;
  return (response.body.match(/<meta\b[^>]*>/gi) || []).some(tag =>
    /\bname=["']lifebook-legal-status["']/i.test(tag) && /\bcontent=["']approved["']/i.test(tag));
}

function verifiedContacts(document, today) {
  const name = document.match(/^\*\*Verified by:\*\*\s*(.+)$/m)?.[1]?.trim();
  const date = document.match(/^\*\*Verified on:\*\*\s*(\S+)\s*$/m)?.[1];
  return /^\*\*Status:\*\*\s*VERIFIED\b/m.test(document) && !!name && !/^(pending|tbd|\[.*\])$/i.test(name) && validDate(date) && date <= today;
}

function reviewedDays(library, start, count = 30, asOf = new Date().toISOString().slice(0, 10)) {
  if (!validDate(start)) throw new Error('Launch date must be a real YYYY-MM-DD calendar date');
  if (!validDate(asOf)) throw new Error('Review cutoff must be a real YYYY-MM-DD calendar date');
  const cutoff = start < asOf ? start : asOf;
  const missing = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.parse(start) + i * DAY).toISOString().slice(0, 10);
    const entry = library.entries.find(entry => entry.date === date.slice(5));
    const review = entry?.review;
    if (!review || review.status !== 'reviewed' || !review.reviewedBy?.trim() || !validDate(review.reviewedOn) || review.reviewedOn > cutoff) missing.push(date);
  }
  return { reviewed: count - missing.length, total: count, missing };
}

function contentState(response, kind) {
  if (kind === 'meditation' && response.status === 404) return { state: 'empty', count: 0 };
  if (response.status !== 200) return { state: 'unavailable', count: null };
  const body = json(response.body);
  if (kind === 'meditation') return body && typeof body.id === 'string' && !!body.id && typeof body.title === 'string' && !!body.title.trim()
    ? { state: 'available', count: 1 } : { state: 'invalid', count: null };
  const items = kind === 'teachings' ? body?.items : body;
  if (!Array.isArray(items) || items.some(item => !item || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' || !item.title.trim())) return { state: 'invalid', count: null };
  if (kind === 'teachings' && (!Number.isSafeInteger(body.total) || body.total < items.length || (body.total > 0 && !items.length))) return { state: 'invalid', count: null };
  const count = kind === 'teachings' ? body.total : items.length;
  return { state: count ? 'available' : 'empty', count };
}

module.exports = { get, json, validDate, validDailyWord, approvedLegalPage, verifiedContacts, reviewedDays, contentState };
