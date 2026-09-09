// --------------------------------------------------------------------------
// Community moderation agent
//
// Same pattern as safetyReview.ts: a fast, dependency-free heuristic here so
// the pipeline works with zero setup. In production, replace this with a
// real model call (same shape as contentGeneration.ts) that checks for
// spam, hostility, and doctrinal red flags before content goes public —
// see the TRD, "Community moderation agent" row.
// --------------------------------------------------------------------------

const BLOCK_SIGNALS = ['http://', 'https://', 'buy now', 'click here'];
const ESCALATE_SIGNALS = ['suicide', 'kill myself', 'want to die', 'self harm', 'self-harm'];

export type ModerationStatus = 'approved' | 'pending' | 'rejected';

export function moderate(text: string): { status: ModerationStatus; needsSupportNote: boolean } {
  const lower = text.toLowerCase();

  if (BLOCK_SIGNALS.some(s => lower.includes(s))) {
    return { status: 'rejected', needsSupportNote: false };
  }
  if (ESCALATE_SIGNALS.some(s => lower.includes(s))) {
    return { status: 'pending', needsSupportNote: true };
  }
  return { status: 'approved', needsSupportNote: false };
}
