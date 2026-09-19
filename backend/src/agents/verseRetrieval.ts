import fs from 'node:fs';
import path from 'node:path';
import { Mood, Verse } from '../types';

// --------------------------------------------------------------------------
// Verse retrieval agent
//
// Deliberately does NOT ask the language model to produce a verse from
// memory — that is exactly where hallucinated citations creep in (see the
// Technical Requirements Document, section 2). Instead it selects from a
// fixed, vetted corpus (verses.json). Swap this file's data source for a
// larger licensed scripture index later; the interface stays the same.
// --------------------------------------------------------------------------

const CORPUS_PATH = path.join(__dirname, 'verses.json');
let corpusCache: { translation: string; verses: Verse[] } | null = null;

function getCorpus(): { translation: string; verses: Verse[] } {
  if (!corpusCache) {
    corpusCache = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
  }
  return corpusCache!;
}

const recentlyServed: Record<string, string[]> = {};

export function retrieveVerse(deviceId: string, mood: Mood): Verse {
  const corpus = getCorpus();
  const candidates = corpus.verses.filter(v => v.mood === mood);
  const recent = recentlyServed[deviceId] || [];
  const fresh = candidates.filter(v => !recent.includes(v.reference));
  const pool = fresh.length > 0 ? fresh : candidates;

  const chosen = pool[Math.floor(Math.random() * pool.length)];

  recentlyServed[deviceId] = [chosen.reference, ...recent].slice(0, 2);
  return chosen;
}
