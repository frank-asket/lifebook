export const MOOD_IDS = [
  'grateful',
  'peaceful',
  'seeking',
  'doubting',
  'distant',
  'convicted',
] as const;

export type MoodId = (typeof MOOD_IDS)[number];

export type Mood = {
  id: MoodId;
  label: string;
  blurb: string;
};

export const moods: Mood[] = [
  { id: 'grateful', label: 'Grateful', blurb: 'Something good landed' },
  { id: 'peaceful', label: 'Peaceful', blurb: 'Steady today' },
  { id: 'seeking', label: 'Seeking', blurb: 'Looking for direction' },
  { id: 'doubting', label: 'Doubting', blurb: 'Honest questions' },
  { id: 'distant', label: 'Distant', blurb: "It's been a while" },
  { id: 'convicted', label: 'Convicted', blurb: 'Something to name' },
];

export type Verse = {
  id: string;
  text: string;
  reference: string;
  moods: MoodId[];
};

/** Fixed, vetted corpus. The model writes around these — never writes scripture itself. */
export const verseCorpus: Verse[] = [
  {
    id: 'ps100-4',
    text: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.',
    reference: 'Psalm 100:4',
    moods: ['grateful'],
  },
  {
    id: '1thess5-18',
    text: 'Give thanks in all circumstances; for this is God’s will for you in Christ Jesus.',
    reference: '1 Thessalonians 5:18',
    moods: ['grateful', 'convicted'],
  },
  {
    id: 'ps23-2',
    text: 'He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
    reference: 'Psalm 23:2–3',
    moods: ['peaceful'],
  },
  {
    id: 'phil4-6',
    text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
    reference: 'Philippians 4:6',
    moods: ['peaceful', 'seeking'],
  },
  {
    id: 'jer29-13',
    text: 'You will seek me and find me when you seek me with all your heart.',
    reference: 'Jeremiah 29:13',
    moods: ['seeking', 'distant'],
  },
  {
    id: 'prov3-5',
    text: 'Trust in the Lord with all your heart and lean not on your own understanding.',
    reference: 'Proverbs 3:5',
    moods: ['seeking', 'doubting'],
  },
  {
    id: 'mark9-24',
    text: 'I do believe; help me overcome my unbelief!',
    reference: 'Mark 9:24',
    moods: ['doubting'],
  },
  {
    id: 'ps13-1',
    text: 'How long, Lord? Will you forget me forever? How long will you hide your face from me?',
    reference: 'Psalm 13:1',
    moods: ['doubting', 'distant'],
  },
  {
    id: 'james4-8',
    text: 'Come near to God and he will come near to you.',
    reference: 'James 4:8',
    moods: ['distant'],
  },
  {
    id: 'luke15-20',
    text: 'But while he was still a long way off, his father saw him and was filled with compassion for him; he ran to his son, threw his arms around him and kissed him.',
    reference: 'Luke 15:20',
    moods: ['distant', 'convicted'],
  },
  {
    id: 'ps51-10',
    text: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.',
    reference: 'Psalm 51:10',
    moods: ['convicted'],
  },
  {
    id: '1john1-9',
    text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
    reference: '1 John 1:9',
    moods: ['convicted', 'grateful'],
  },
];

export type JourneyDay = {
  day: number;
  title: string;
  verseId: string;
  focus: string;
};

export type Journey = {
  id: string;
  title: string;
  subtitle: string;
  recommendedMoods: MoodId[];
  days: JourneyDay[];
};

export const journeys: Journey[] = [
  {
    id: 'returning',
    title: 'Returning',
    subtitle: 'Five days for coming back after a gap, with no apology required.',
    recommendedMoods: ['distant', 'convicted'],
    days: [
      { day: 1, title: 'Still a long way off', verseId: 'luke15-20', focus: 'Being seen before you have explained yourself.' },
      { day: 2, title: 'One step', verseId: 'james4-8', focus: 'Nearness as a direction, not a distance already covered.' },
      { day: 3, title: 'Saying the true thing', verseId: 'ps13-1', focus: 'Absence spoken out loud is still prayer.' },
      { day: 4, title: 'Looked for, found', verseId: 'jer29-13', focus: 'Wholehearted does not mean flawless.' },
      { day: 5, title: 'A steady heart', verseId: 'ps51-10', focus: 'Asking for renewal rather than performing it.' },
    ],
  },
  {
    id: 'questions',
    title: 'Room for Questions',
    subtitle: 'Five days that treat doubt as part of faith, not a failure of it.',
    recommendedMoods: ['doubting', 'seeking'],
    days: [
      { day: 1, title: 'Help my unbelief', verseId: 'mark9-24', focus: 'Belief and doubt in the same sentence.' },
      { day: 2, title: 'How long', verseId: 'ps13-1', focus: 'Scripture asks the question you were afraid to.' },
      { day: 3, title: 'Not on your own understanding', verseId: 'prov3-5', focus: 'Trust when the reasoning runs out.' },
      { day: 4, title: 'Ask anyway', verseId: 'phil4-6', focus: 'Praying without first resolving the question.' },
      { day: 5, title: 'Seeking, wholeheartedly', verseId: 'jer29-13', focus: 'The search itself as faithfulness.' },
    ],
  },
  {
    id: 'stillness',
    title: 'Stillness',
    subtitle: 'Shorter readings, longer silences, for a season worth staying in.',
    recommendedMoods: ['peaceful', 'grateful'],
    days: [
      { day: 1, title: 'Quiet waters', verseId: 'ps23-2', focus: 'Rest as something you are led into.' },
      { day: 2, title: 'Unanxious', verseId: 'phil4-6', focus: 'Handing over what is not yours to carry.' },
      { day: 3, title: 'Thanksgiving', verseId: 'ps100-4', focus: 'Gratitude as a way in, not a reward.' },
      { day: 4, title: 'In all circumstances', verseId: '1thess5-18', focus: 'Thanks that does not require pretending.' },
      { day: 5, title: 'Kept', verseId: '1john1-9', focus: 'Ending clean, ending light.' },
    ],
  },
];

export type Book = {
  id: string;
  title: string;
  author: string;
  minutes: number;
  summary: string;
  excerpt: string | null;
};

export const books: Book[] = [
  {
    id: 'quiet-hours',
    title: 'The Quiet Hours',
    author: 'LifeBook Editorial',
    minutes: 12,
    summary: 'A short reader on making room for silence in a day that has none.',
    excerpt:
      'Silence is not the absence of a day’s noise. It is a decision made inside the noise — a small, deliberate handing over of the next ten minutes.\n\nMost people do not fail at stillness because they lack discipline. They fail because they wait for a quiet hour to arrive on its own. It does not arrive. It is taken.',
  },
  {
    id: 'psalms-companion',
    title: 'A Companion to the Psalms',
    author: 'LifeBook Editorial',
    minutes: 18,
    summary: 'Why the Psalms complain, and what that permits you to say.',
    excerpt:
      'Roughly a third of the Psalms are complaints. Not polite ones — accusations, unanswered questions, long stretches of silence given a voice.\n\nThat proportion is itself a teaching. A tradition that keeps its complaints in its songbook is not asking you to arrive composed.',
  },
  { id: 'praying-plainly', title: 'Praying Plainly', author: 'Licensed title', minutes: 22, summary: 'Prayer stripped of performance.', excerpt: null },
  { id: 'the-examen', title: 'The Daily Examen', author: 'Licensed title', minutes: 15, summary: 'A five-hundred-year-old review of the day.', excerpt: null },
  { id: 'sabbath-small', title: 'Sabbath, in Small Pieces', author: 'Licensed title', minutes: 20, summary: 'Rest for people who cannot take a whole day.', excerpt: null },
  { id: 'doubt-and-faith', title: 'Doubt and Faith', author: 'Licensed title', minutes: 25, summary: 'On holding both at once.', excerpt: null },
];

export function verseById(id: string): Verse {
  const found = verseCorpus.find((verse) => verse.id === id);
  if (!found) throw new Error(`Unknown verse: ${id}`);
  return found;
}

export function moodLabel(id: MoodId): string {
  return moods.find((mood) => mood.id === id)?.label ?? id;
}
