import { MoodId, Verse, verseById, verseCorpus } from '@/lib/content';

export type GeneratedContent = {
  verse: Verse;
  whyThisVerse: string;
  meditation: string;
  reflectionQuestion: string;
  prayer: string;
  actionStep: string;
  reviewVerdict: 'pass' | 'uncertain';
  supportSuggested: boolean;
};

const distressTerms = [
  'kill myself',
  'end it all',
  'suicide',
  'want to die',
  'hurt myself',
  'no reason to live',
];

const whyByMood: Record<MoodId, string> = {
  grateful: 'Gratitude is easiest to feel and hardest to say. This verse gives it somewhere to go.',
  peaceful: 'You did not arrive needing rescue, so this is not a rescue. It is somewhere to stay a while.',
  seeking: 'You came with a question. This passage does not answer it — it tells you the search counts.',
  doubting: 'Scripture asks harder questions than you did today. This is one of them, left in on purpose.',
  distant: 'Distance is the thing this verse is actually about. It assumes the gap and speaks anyway.',
  convicted: 'Naming something is not the same as being condemned for it. This verse holds that line.',
};

const meditationByMood: Record<MoodId, string> = {
  grateful: 'Read it once. Then name one specific thing — not a category, one thing — and stay with it.',
  peaceful: 'Read it slowly, twice. On the second pass let the last line finish before you move.',
  seeking: 'Read it, then hold your question next to it without trying to resolve either.',
  doubting: 'Read it aloud if you can. Notice that saying it did not make the doubt worse.',
  distant: 'Read it as though it were addressed to you rather than about someone else.',
  convicted: 'Read it once for what it says, once for what it does not say. It does not shame you.',
};

const reflectionByMood: Record<MoodId, string> = {
  grateful: 'What happened today that you would not have thought to mention to anyone?',
  peaceful: 'What is making this steadiness possible right now, and what would protect it?',
  seeking: 'What are you actually asking for — underneath the practical version of the question?',
  doubting: 'What would you need to be true, and what has made that hard to hold?',
  distant: 'When did the distance start? Answer it plainly, without explaining it away.',
  convicted: 'What is the thing you already know, said in one sentence and no defence?',
};

const prayerByMood: Record<MoodId, string> = {
  grateful: 'God, thank you. Not in general — for this. Let me notice it again tomorrow. Amen.',
  peaceful: 'God, thank you for a quiet stretch. Teach me to receive it without bracing for the end of it. Amen.',
  seeking: 'God, I am asking, and I do not yet know the answer. Keep me looking. Amen.',
  doubting: 'God, I do believe. Help my unbelief. Stay with me in the part I cannot resolve. Amen.',
  distant: 'God, it has been a while. I am here now. Meet me before I have made it all the way back. Amen.',
  convicted: 'God, I am not going to argue with what I know. Make me clean, and make me steady. Amen.',
};

const actionByMood: Record<MoodId, string> = {
  grateful: 'Tell one person the specific thing you named. Today.',
  peaceful: 'Protect ten minutes tomorrow that nothing is allowed to fill.',
  seeking: 'Write your question down somewhere you will see it in a week.',
  doubting: 'Say the doubt out loud to one person who will not try to fix it.',
  distant: 'Come back tomorrow. That is the whole action step.',
  convicted: 'Do the one small repair you thought of while reading. Before the day ends.',
};

/** Selects from the fixed corpus — deterministic per mood and day, so a day is one verse. */
export function retrieveVerse(mood: MoodId, seed = new Date().toDateString()): Verse {
  const candidates = verseCorpus.filter((verse) => verse.moods.includes(mood));
  const hash = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
  return candidates[hash % candidates.length];
}

/** Keyword-based distress detection on free text, run before anything is shown back. */
export function detectDistress(text: string | undefined): boolean {
  const lowered = (text ?? '').toLowerCase();
  return distressTerms.some((term) => lowered.includes(term));
}

export function generateContent(mood: MoodId, note?: string, verseId?: string): GeneratedContent {
  const verse = verseId ? verseById(verseId) : retrieveVerse(mood);
  const supportSuggested = detectDistress(note);

  return {
    verse,
    whyThisVerse: whyByMood[mood],
    meditation: meditationByMood[mood],
    reflectionQuestion: reflectionByMood[mood],
    prayer: prayerByMood[mood],
    actionStep: actionByMood[mood],
    reviewVerdict: 'pass',
    supportSuggested,
  };
}
