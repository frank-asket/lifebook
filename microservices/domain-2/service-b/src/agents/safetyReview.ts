import { GeneratedPieces } from './contentGeneration';

// --------------------------------------------------------------------------
// Theology & safety review agent
//
// This is the automated pass described in the TRD. In this scaffold it runs
// as a fast, dependency-free heuristic so the pipeline works out of the box.
// In production, replace `checkForDistressSignals` with a real model call
// (same pattern as contentGeneration.ts) that also checks doctrinal
// consistency — the interface below already returns everything the
// orchestrator and Backend Schema (`review_verdict`) expect.
// --------------------------------------------------------------------------

const CRISIS_SIGNALS = [
  'suicide', 'kill myself', 'want to die', 'end my life', 'self harm', 'self-harm', 'hurting myself',
];

export interface ReviewResult {
  verdict: 'pass' | 'uncertain';
  supportNoteNeeded: boolean;
}

export function reviewContent(note: string | undefined, _content: GeneratedPieces): ReviewResult {
  const haystack = (note || '').toLowerCase();
  const flagged = CRISIS_SIGNALS.some(signal => haystack.includes(signal));

  return {
    verdict: flagged ? 'uncertain' : 'pass',
    supportNoteNeeded: flagged,
  };
}
