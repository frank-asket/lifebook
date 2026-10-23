// Personalized suggestions on Home: what the API sends, and which ones to show. Hidden ones are remembered
// on the account; the local helpers import choices saved by earlier releases.

export type Reason = { type: 'goal'; goal: string } | { type: 'journey'; journey: string };
export type SuggestionView = { id: string; kind: 'plan' | 'journal' | 'prayer-time'; reason: Reason; href: string; title?: string; description?: string; duration?: number };
export type SuggestionsResponse = { consent: boolean; suggestions: SuggestionView[] };

export const SHOWN = 2;
export const dismissedKey = (userId: string) => `lifebook.suggestions.hidden.${userId}`;

/** The first two the person has not hidden. */
export function visible(list: readonly SuggestionView[], hidden: readonly string[]): SuggestionView[] {
  return list.filter(s => !hidden.includes(s.id)).slice(0, SHOWN);
}

export function parseHidden(raw: string | null): string[] {
  try { const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && /^(plan:(discover-jesus|foundations-of-faith|walking-with-god)|prayer-journal|short-prayer-time)$/.test(x)).slice(0, 50) : []; }
  catch { return []; }
}
