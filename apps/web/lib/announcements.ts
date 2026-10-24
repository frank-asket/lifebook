// Welcome tour for new accounts and "What's new" for returning ones. Content and the rule for what to show;
// the sheet itself lives in components/Announcement.tsx. Seen state is kept on this device only.

type Text = { en: string; fr: string };
export type Slide = { id: string; icon: 'sun' | 'book' | 'lock' | 'calendar' | 'settings' | 'type' | 'sparkles' | 'search'; title: Text; body: Text; cta?: { label: Text; href: string } };
export type Announcement = { id: string; kind: 'welcome' | 'release'; date: string; label: Text; slides: Slide[] };

export const WELCOME: Announcement = {
  id: 'welcome', kind: 'welcome', date: '2026-10-18',
  label: { en: 'Welcome to LifeBook', fr: 'Bienvenue sur LifeBook' },
  slides: [
    { id: 'today', icon: 'sun',
      title: { en: 'One passage a day', fr: 'Un passage par jour' },
      body: { en: 'Each day starts with today’s Word. Begin prayer time and LifeBook takes you through it one quiet screen at a time: understand, be still, reflect, pray, live it.', fr: 'Chaque journée commence par la Parole du jour. Lancez le temps de prière et LifeBook vous accompagne, un écran paisible à la fois : comprendre, faire silence, réfléchir, prier, la vivre.' } },
    { id: 'bible', icon: 'book',
      title: { en: 'The Bible, your way', fr: 'La Bible, à votre façon' },
      body: { en: 'Read any book in English or French. Tap Aa to change the text size, spacing and typeface, and LifeBook opens where you left off.', fr: 'Lisez n’importe quel livre en français ou en anglais. Touchez Aa pour changer la taille du texte, l’interligne et la police ; LifeBook s’ouvre là où vous en étiez.' } },
    { id: 'journal', icon: 'lock',
      title: { en: 'A private place to pray', fr: 'Un lieu privé pour prier' },
      body: { en: 'Write prayers in your journal. They are encrypted, never used to profile you, and you can delete them at any time.', fr: 'Écrivez vos prières dans votre journal. Elles sont chiffrées, ne servent jamais à vous profiler, et vous pouvez les supprimer à tout moment.' } },
    { id: 'week', icon: 'calendar',
      title: { en: 'No streaks to keep', fr: 'Aucune série à tenir' },
      body: { en: 'Your week in the Word shows the days you prayed. A missed day is simply an empty circle. Come back whenever you can.', fr: 'Votre semaine dans la Parole montre les jours où vous avez prié. Un jour manqué n’est qu’un cercle vide. Revenez quand vous le pouvez.' } },
    { id: 'settings', icon: 'settings',
      title: { en: 'Make it yours', fr: 'À votre image' },
      body: { en: 'Choose your language, light or dark, and your learning journey in Settings. You can see this tour again there too.', fr: 'Choisissez votre langue, le mode clair ou sombre et votre parcours dans les Paramètres. Vous pourrez y revoir cette présentation.' },
      cta: { label: { en: 'Begin today’s prayer time', fr: 'Commencer le temps de prière' }, href: '/daily-word' } },
  ],
};

/** Newest first. Add a release here when something worth telling returning users ships. */
export const RELEASES: Announcement[] = [
  { id: '2026-10-search', kind: 'release', date: '2026-10-24',
    label: { en: 'What’s new', fr: 'Nouveautés' },
    slides: [
      { id: 'search', icon: 'search',
        title: { en: 'One search for everything', fr: 'Une seule recherche pour tout' },
        body: { en: 'Type a passage like “John 3:16” to go straight there, or a word like “peace” to find verses, reading plans and more. Press ⌘K, or tap the search button. It never searches your private writing.', fr: 'Tapez un passage comme « Jean 3:16 » pour y aller directement, ou un mot comme « paix » pour trouver des versets, des plans de lecture et plus encore. Appuyez sur ⌘K ou touchez le bouton de recherche. Elle ne parcourt jamais vos écrits privés.' },
        cta: { label: { en: 'Try search', fr: 'Essayer la recherche' }, href: '/search' } },
      { id: 'reader-preview', icon: 'type',
        title: { en: 'See your reading settings', fr: 'Voyez vos réglages de lecture' },
        body: { en: 'Tap Aa in the Bible reader: a verse at the top now shows your text size, spacing and typeface as you change them.', fr: 'Touchez Aa dans le lecteur biblique : un verset en haut montre désormais la taille, l’interligne et la police à mesure que vous les changez.' },
        cta: { label: { en: 'Open the Bible', fr: 'Ouvrir la Bible' }, href: '/bible/read' } },
    ] },
  { id: '2026-10-prayer-time', kind: 'release', date: '2026-10-18',
    label: { en: 'What’s new', fr: 'Nouveautés' },
    slides: [
      { id: 'prayer-time', icon: 'sparkles',
        title: { en: 'Prayer time, one step at a time', fr: 'Le temps de prière, une étape à la fois' },
        body: { en: 'Today’s Word now opens full screen: the verse in large type, a breathing pause you can set to 2, 5 or 10 minutes, and a private place to reflect.', fr: 'La Parole du jour s’ouvre désormais en plein écran : le verset en grands caractères, une pause de respiration de 2, 5 ou 10 minutes, et un espace privé pour réfléchir.' },
        cta: { label: { en: 'Try it now', fr: 'Essayer maintenant' }, href: '/daily-word' } },
      { id: 'reader', icon: 'type',
        title: { en: 'Reading settings', fr: 'Réglages de lecture' },
        body: { en: 'Tap Aa in the Bible reader for four text sizes, airy spacing and serif or sans. Chapters open straight onto the text.', fr: 'Touchez Aa dans le lecteur biblique : quatre tailles de texte, un interligne aéré, avec ou sans empattement. Les chapitres s’ouvrent directement sur le texte.' } },
      { id: 'week', icon: 'calendar',
        title: { en: 'Your week in the Word', fr: 'Votre semaine dans la Parole' },
        body: { en: 'Home shows the last seven days as quiet circles. No streaks, nothing to lose.', fr: 'L’accueil montre les sept derniers jours en cercles discrets. Pas de séries, rien à perdre.' } },
    ] },
];

export const NEW_ACCOUNT_DAYS = 14;

/**
 * What to show on Home, if anything. New accounts get the welcome tour once; everyone else gets the newest
 * release they have not seen, but only if it shipped after they joined (a new user already sees it in the app).
 */
export function pickAnnouncement(input: { createdAt: Date | null; now: Date; seen: readonly string[]; releases?: Announcement[] }): Announcement | null {
  const releases = input.releases ?? RELEASES;
  const created = input.createdAt?.getTime();
  const isNew = created !== undefined && input.now.getTime() - created < NEW_ACCOUNT_DAYS * 86400000;
  if (isNew) return input.seen.includes(WELCOME.id) ? null : WELCOME;
  const next = releases.find(r => !input.seen.includes(r.id) && (created === undefined || Date.parse(`${r.date}T23:59:59Z`) >= created));
  return next ?? null;
}

/** After the welcome tour, current releases count as seen: the tour already covered them. */
export function markSeen(seen: readonly string[], shown: Announcement, releases: Announcement[] = RELEASES): string[] {
  const ids = shown.kind === 'welcome' ? [shown.id, ...releases.map(r => r.id)] : [shown.id];
  return Array.from(new Set([...seen, ...ids]));
}

export function parseSeen(raw: string | null): string[] {
  try { const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 100) : []; }
  catch { return []; }
}

export const seenKey = (userId: string) => `lifebook.announcements.${userId}`;
export const byId = (id: string | null): Announcement | null => id === WELCOME.id ? WELCOME : RELEASES.find(r => r.id === id) ?? null;
