export type Mood = {
  id: string;
  label: string;
  blurb: string;
  verse: string;
  reference: string;
};

export const moods: Mood[] = [
  {
    id: "grateful",
    label: "Grateful",
    blurb: "Something good landed and you want to say thank you.",
    verse: "Give thanks in all circumstances; for this is God's will for you.",
    reference: "1 Thessalonians 5:18",
  },
  {
    id: "peaceful",
    label: "Peaceful",
    blurb: "Steady today. A quiet moment to stay there a while.",
    verse: "He makes me lie down in green pastures, he leads me beside quiet waters.",
    reference: "Psalm 23:2",
  },
  {
    id: "seeking",
    label: "Seeking",
    blurb: "Looking for direction on something specific.",
    verse: "You will seek me and find me when you seek me with all your heart.",
    reference: "Jeremiah 29:13",
  },
  {
    id: "doubting",
    label: "Doubting",
    blurb: "Honest questions you would rather not say out loud.",
    verse: "I do believe; help me overcome my unbelief!",
    reference: "Mark 9:24",
  },
  {
    id: "distant",
    label: "Distant",
    blurb: "It has been a while, and it feels like it.",
    verse: "Come near to God and he will come near to you.",
    reference: "James 4:8",
  },
  {
    id: "convicted",
    label: "Convicted",
    blurb: "Something needs naming, without shame attached.",
    verse: "Create in me a pure heart, O God, and renew a steadfast spirit within me.",
    reference: "Psalm 51:10",
  },
];

export type FlowStep = {
  step: number;
  title: string;
  detail: string;
};

export const flowSteps: FlowStep[] = [
  {
    step: 1,
    title: "Scripture",
    detail:
      "A verse chosen from a fixed, vetted corpus tagged to how you arrived — plus why this one, in plain words.",
  },
  {
    step: 2,
    title: "Reflect",
    detail:
      "One question. Optional. Anything you write saves privately to your journal, never to a feed.",
  },
  {
    step: 3,
    title: "Meditate",
    detail: "Two, five, or ten minutes of stillness with the verse. No streak penalty for two.",
  },
  {
    step: 4,
    title: "Pray",
    detail: "Pray the guided prayer as written, or write your own. Both count the same.",
  },
  {
    step: 5,
    title: "Complete",
    detail: "Your streak and badges update. The day closes. Nothing else asks for your attention.",
  },
];

export type Journey = {
  id: string;
  title: string;
  days: number;
  summary: string;
  forMoods: string[];
};

export const journeys: Journey[] = [
  {
    id: "returning",
    title: "Returning",
    days: 5,
    summary:
      "Five days for coming back after a gap, written without a single sentence that makes you apologise for the gap.",
    forMoods: ["Distant", "Convicted"],
  },
  {
    id: "questions",
    title: "Room for Questions",
    days: 5,
    summary:
      "Five days that treat doubt as part of faith rather than a failure of it, sitting with the passages that do the same.",
    forMoods: ["Doubting", "Seeking"],
  },
  {
    id: "stillness",
    title: "Stillness",
    days: 5,
    summary:
      "Five days of shorter readings and longer silences, for a season that is steady and worth staying in.",
    forMoods: ["Peaceful", "Grateful"],
  },
];

export type Pillar = {
  title: string;
  detail: string;
};

export const pillars: Pillar[] = [
  {
    title: "Community that is moderated before it is public",
    detail:
      "Groups, prayer requests and discussions all pass a moderation pass first. Spam is rejected. Language that suggests real distress is let through and quietly flagged with support resources attached — never silently deleted.",
  },
  {
    title: "A library you can actually finish",
    detail:
      "Short readings with saved progress and bookmarks, so picking it up on day nine does not mean starting over.",
  },
  {
    title: "Progress you can see without being scored",
    detail:
      "Streaks and badges are computed from what you actually did. There is no leaderboard, and nobody else sees them.",
  },
];

export const crisisResources = [
  { label: "988 Suicide & Crisis Lifeline (US)", href: "tel:988" },
  { label: "Crisis Text Line — text HOME to 741741", href: "sms:741741" },
  { label: "findahelpline.com (international)", href: "https://findahelpline.com" },
];
