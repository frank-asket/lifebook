// Pacing for the Daily Word prayer time: how long the quiet Meditate pause lasts for each session length.

export const PRAYER_LENGTHS = [2, 5, 10] as const;
export type PrayerLength = typeof PRAYER_LENGTHS[number];

/** Seconds of guided stillness in the Meditate step. The rest of the time is the person's own reading and writing. */
export function stillnessSeconds(minutes: PrayerLength): number {
  return minutes === 2 ? 30 : minutes === 5 ? 90 : 240;
}

/** One breath: 4 s in, 6 s out. A longer out-breath is the usual calming pattern; it stays well under one cycle per 5 s. */
export const BREATH = { inhale: 4, exhale: 6 } as const;

export function breathPhase(elapsedSeconds: number): 'in' | 'out' {
  const cycle = BREATH.inhale + BREATH.exhale;
  return elapsedSeconds % cycle < BREATH.inhale ? 'in' : 'out';
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function parseLength(value: string | null): PrayerLength {
  const n = Number(value);
  return (PRAYER_LENGTHS as readonly number[]).includes(n) ? n as PrayerLength : 5;
}

/** 30 → "30 seconds", 90 → "a minute and a half", 240 → "4 minutes". */
export function spokenDuration(seconds: number, locale: 'en' | 'fr'): string {
  if (seconds < 60) return locale === 'fr' ? `${seconds} secondes` : `${seconds} seconds`;
  if (seconds === 90) return locale === 'fr' ? 'une minute et demie' : 'a minute and a half';
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
