// Personalized suggestions: plain, explainable rules from the journey and goals a person chose.
// Never from prayers, reflections or reading content. Pure functions, so they can be tested exhaustively.

/** The onboarding goals are saved as these exact labels; the codes keep the rules stable if wording changes. */
export const GOAL_CODES: Record<string, GoalCode> = {
  'Build a daily prayer habit': 'PRAYER_HABIT',
  'Understand the Bible': 'UNDERSTAND_BIBLE',
  'Grow in faith': 'GROW_FAITH',
  'Learn about Jesus': 'LEARN_JESUS',
  'Explore discipleship': 'DISCIPLESHIP',
  'Prepare to serve': 'SERVE',
  'Find encouragement': 'ENCOURAGEMENT',
  'Develop consistency': 'CONSISTENCY',
};
export type GoalCode = 'PRAYER_HABIT' | 'UNDERSTAND_BIBLE' | 'GROW_FAITH' | 'LEARN_JESUS' | 'DISCIPLESHIP' | 'SERVE' | 'ENCOURAGEMENT' | 'CONSISTENCY';

export type SuggestionInput = {
  consent: boolean;
  journey: string | null;
  goals: string[];                 // as saved: the English labels (custom goals are ignored)
  enrolledPlanIds: string[];       // any reading plan started or finished
  prayerCount: number;
  completedDaysLast7: number;      // Daily Word prayer times finished in the last 7 days
};
/** Why a suggestion appears: the goal label as the person chose it, or their journey. Translated by the client. */
export type Reason = { type: 'goal'; goal: string } | { type: 'journey'; journey: string };
export type Suggestion =
  | { id: string; kind: 'plan'; planId: string; reason: Reason }
  | { id: 'prayer-journal'; kind: 'journal'; reason: Reason }
  | { id: 'short-prayer-time'; kind: 'prayer-time'; reason: Reason };

const EARLY_JOURNEYS = new Set(['EXPLORING', 'NEW_BELIEVER']);
export const MAX_SUGGESTIONS = 4; // the client shows at most two, after removing any the person dismissed

export function suggest(input: SuggestionInput): Suggestion[] {
  if (!input.consent) return [];
  const chosen = new Map<GoalCode, string>();
  for (const label of input.goals) { const code = GOAL_CODES[label]; if (code && !chosen.has(code)) chosen.set(code, label); }
  const goal = (...codes: GoalCode[]): Reason | null => { for (const c of codes) { const label = chosen.get(c); if (label) return { type: 'goal', goal: label }; } return null; };
  const journey = (): Reason | null => input.journey && EARLY_JOURNEYS.has(input.journey) ? { type: 'journey', journey: input.journey } : null;
  const enrolled = new Set(input.enrolledPlanIds);
  const out: Suggestion[] = [];
  const plan = (planId: string, reason: Reason | null) => { if (reason && !enrolled.has(planId)) out.push({ id: `plan:${planId}`, kind: 'plan', planId, reason }); };

  // In priority order: the clearest match first.
  plan('discover-jesus', goal('LEARN_JESUS') ?? journey());
  plan('foundations-of-faith', goal('UNDERSTAND_BIBLE', 'GROW_FAITH'));
  plan('walking-with-god', goal('CONSISTENCY'));
  const prayer = goal('PRAYER_HABIT');
  if (prayer && input.prayerCount === 0) out.push({ id: 'prayer-journal', kind: 'journal', reason: prayer });
  const rhythm = goal('PRAYER_HABIT', 'CONSISTENCY');
  if (rhythm && input.completedDaysLast7 < 2) out.push({ id: 'short-prayer-time', kind: 'prayer-time', reason: rhythm });
  return out.slice(0, MAX_SUGGESTIONS);
}
