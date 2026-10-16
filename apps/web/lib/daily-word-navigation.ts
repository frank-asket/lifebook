export const DAILY_WORD_STEPS = ['UNDERSTAND', 'MEDITATE', 'REFLECT', 'PRAY', 'LIVE'] as const;

export function initialDailyWordStep(requested: string | null, completed: readonly string[] = []): number {
  if (requested !== null && /^[0-4]$/.test(requested)) return Number(requested);
  const next = DAILY_WORD_STEPS.findIndex(step => !completed.includes(step));
  return next < 0 ? 4 : next;
}
