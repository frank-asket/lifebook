export type ModerationResult =
  | { verdict: 'approved' }
  | { verdict: 'approved'; flagged: true; supportNote: string }
  | { verdict: 'rejected'; reason: string };

const spamSignals = [
  /https?:\/\//i,
  /\bbuy now\b/i,
  /\bcrypto\b/i,
  /\bfree money\b/i,
  /\bdm me\b/i,
  /\bfollow my\b/i,
];

const distressSignals = [
  /kill myself/i,
  /end it all/i,
  /suicide/i,
  /want to die/i,
  /hurt myself/i,
  /no reason to live/i,
];

export const SUPPORT_NOTE =
  'Someone will see this. If you need a person right now: call or text 988 (US), or text HOME to 741741.';

/** First-pass screening: spam is rejected, distress is published and flagged with support. */
export function moderate(text: string): ModerationResult {
  const trimmed = text.trim();

  if (trimmed.length < 4) {
    return { verdict: 'rejected', reason: 'Too short to post — say a little more.' };
  }
  if (spamSignals.some((pattern) => pattern.test(trimmed))) {
    return { verdict: 'rejected', reason: 'This looks like promotion or a link, which this space does not carry.' };
  }
  if (distressSignals.some((pattern) => pattern.test(trimmed))) {
    return { verdict: 'approved', flagged: true, supportNote: SUPPORT_NOTE };
  }
  return { verdict: 'approved' };
}
