import { Badge, StreakRecord } from '../types';

// --------------------------------------------------------------------------
// Badges are computed from the real streak record — never hand-set — so
// they can't drift out of sync with actual behavior. Add new milestones
// here; nothing else needs to change.
// --------------------------------------------------------------------------

const MILESTONES: { id: string; title: string; description: string; threshold: number }[] = [
  { id: 'badge-3-day', title: 'First Steps', description: 'Checked in 3 days in a row', threshold: 3 },
  { id: 'badge-7-day', title: '7-Day Streak', description: 'A full week of daily check-ins', threshold: 7 },
  { id: 'badge-30-day', title: '30-Day Streak', description: 'A full month of daily check-ins', threshold: 30 },
  { id: 'badge-100-day', title: 'Faithful Century', description: '100 days of showing up', threshold: 100 },
];

export function computeBadges(streak: StreakRecord | null): Badge[] {
  const longest = streak?.longest ?? 0;
  return MILESTONES.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    earned: longest >= m.threshold,
  }));
}
