export interface BilingualText {
  en: string;
  fr: string;
}

export interface BibleVerse {
  verse: number;
  en: string;
  fr: string;
  meditation: BilingualText;
}

export interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  testament: "OT" | "NT";
  name: BilingualText;
  category: BilingualText;
  totalChapters: number;
  featuredChapters: BibleChapter[];
}

export const BIBLE_CANON: BibleBook[] = [
  {
    id: "genesis",
    testament: "OT",
    name: { en: "Genesis", fr: "Genèse" },
    category: { en: "Pentateuch · Law", fr: "Pentateuque · Loi" },
    totalChapters: 50,
    featuredChapters: [
      {
        chapter: 1,
        verses: [
          {
            verse: 1,
            en: "In the beginning God created the heaven and the earth.",
            fr: "Au commencement, Dieu créa les cieux et la terre.",
            meditation: {
              en: "Every new beginning rests in the sovereign voice of the Creator who brings order out of chaos.",
              fr: "Tout nouveau départ repose dans la voix souveraine du Créateur qui fait jaillir l'ordre du chaos.",
            },
          },
          {
            verse: 3,
            en: "And God said, Let there be light: and there was light.",
            fr: "Dieu dit: Que la lumière soit! Et la lumière fut.",
            meditation: {
              en: "When God speaks into darkened seasons of life, His Word immediately imparts clarity and life.",
              fr: "Lorsque Dieu parle dans nos saisons d'ombre, Sa Parole apporte immédiatement clarté et vie.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "exodus",
    testament: "OT",
    name: { en: "Exodus", fr: "Exode" },
    category: { en: "Pentateuch · Law", fr: "Pentateuque · Loi" },
    totalChapters: 40,
    featuredChapters: [
      {
        chapter: 14,
        verses: [
          {
            verse: 14,
            en: "The Lord shall fight for you, and ye shall hold your peace.",
            fr: "L'Éternel combattra pour vous; et vous, gardez le silence.",
            meditation: {
              en: "Stillness is not passivity; it is active trust in the God who parts impossible seas.",
              fr: "Le calme n'est pas de la passivité; c'est une confiance active dans le Dieu qui ouvre la mer.",
            },
          },
        ],
      },
    ],
  },
  { id: "leviticus", testament: "OT", name: { en: "Leviticus", fr: "Lévitique" }, category: { en: "Pentateuch · Law", fr: "Pentateuque · Loi" }, totalChapters: 27, featuredChapters: [] },
  { id: "numbers", testament: "OT", name: { en: "Numbers", fr: "Nombres" }, category: { en: "Pentateuch · Law", fr: "Pentateuque · Loi" }, totalChapters: 36, featuredChapters: [] },
  { id: "deuteronomy", testament: "OT", name: { en: "Deuteronomy", fr: "Deutéronome" }, category: { en: "Pentateuch · Law", fr: "Pentateuque · Loi" }, totalChapters: 34, featuredChapters: [] },
  { id: "joshua", testament: "OT", name: { en: "Joshua", fr: "Josué" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 24, featuredChapters: [] },
  { id: "judges", testament: "OT", name: { en: "Judges", fr: "Juges" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 21, featuredChapters: [] },
  { id: "ruth", testament: "OT", name: { en: "Ruth", fr: "Ruth" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 4, featuredChapters: [] },
  { id: "1-samuel", testament: "OT", name: { en: "1 Samuel", fr: "1 Samuel" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 31, featuredChapters: [] },
  { id: "2-samuel", testament: "OT", name: { en: "2 Samuel", fr: "2 Samuel" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 24, featuredChapters: [] },
  { id: "1-kings", testament: "OT", name: { en: "1 Kings", fr: "1 Rois" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 22, featuredChapters: [] },
  { id: "2-kings", testament: "OT", name: { en: "2 Kings", fr: "2 Rois" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 25, featuredChapters: [] },
  { id: "1-chronicles", testament: "OT", name: { en: "1 Chronicles", fr: "1 Chroniques" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 29, featuredChapters: [] },
  { id: "2-chronicles", testament: "OT", name: { en: "2 Chronicles", fr: "2 Chroniques" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 36, featuredChapters: [] },
  { id: "ezra", testament: "OT", name: { en: "Ezra", fr: "Esdras" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 10, featuredChapters: [] },
  { id: "nehemiah", testament: "OT", name: { en: "Nehemiah", fr: "Néhémie" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 13, featuredChapters: [] },
  { id: "esther", testament: "OT", name: { en: "Esther", fr: "Esther" }, category: { en: "Historical Books", fr: "Livres Historiques" }, totalChapters: 10, featuredChapters: [] },
  { id: "job", testament: "OT", name: { en: "Job", fr: "Job" }, category: { en: "Wisdom & Poetry", fr: "Sagesse & Poésie" }, totalChapters: 42, featuredChapters: [] },
  {
    id: "psalms",
    testament: "OT",
    name: { en: "Psalms", fr: "Psaumes" },
    category: { en: "Wisdom & Poetry", fr: "Sagesse & Poésie" },
    totalChapters: 150,
    featuredChapters: [
      {
        chapter: 23,
        verses: [
          {
            verse: 1,
            en: "The Lord is my shepherd; I shall not want.",
            fr: "L'Éternel est mon berger: je ne manquerai de rien.",
            meditation: {
              en: "Where the Good Shepherd leads, scarcity gives way to quiet sufficiency and rest.",
              fr: "Là où le Bon Berger conduit, le manque fait place à la suffisance paisible et au repos.",
            },
          },
          {
            verse: 2,
            en: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
            fr: "Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles.",
            meditation: {
              en: "God never drives His flock in panic; He leads us beside waters of stillness.",
              fr: "Dieu ne pousse jamais Son troupeau dans la précipitation; Il nous guide près des eaux paisibles.",
            },
          },
          {
            verse: 3,
            en: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
            fr: "Il restaure mon âme, Il me conduit dans les sentiers de la justice, à cause de son nom.",
            meditation: {
              en: "Soul restoration is the daily work of grace when we pause in His presence.",
              fr: "La restauration de l'âme est l'œuvre quotidienne de la grâce lorsque nous demeurons en Sa présence.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proverbs",
    testament: "OT",
    name: { en: "Proverbs", fr: "Proverbes" },
    category: { en: "Wisdom & Poetry", fr: "Sagesse & Poésie" },
    totalChapters: 31,
    featuredChapters: [
      {
        chapter: 3,
        verses: [
          {
            verse: 5,
            en: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.",
            fr: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.",
            meditation: {
              en: "Wholehearted trust releases the burden of having to figure out every tomorrow on our own.",
              fr: "La confiance de tout cœur libère du fardeau de devoir tout comprendre par soi-même.",
            },
          },
        ],
      },
    ],
  },
  { id: "ecclesiastes", testament: "OT", name: { en: "Ecclesiastes", fr: "Ecclésiaste" }, category: { en: "Wisdom & Poetry", fr: "Sagesse & Poésie" }, totalChapters: 12, featuredChapters: [] },
  { id: "song-of-solomon", testament: "OT", name: { en: "Song of Solomon", fr: "Cantique des Cantiques" }, category: { en: "Wisdom & Poetry", fr: "Sagesse & Poésie" }, totalChapters: 8, featuredChapters: [] },
  {
    id: "isaiah",
    testament: "OT",
    name: { en: "Isaiah", fr: "Ésaïe" },
    category: { en: "Major Prophets", fr: "Grands Prophètes" },
    totalChapters: 66,
    featuredChapters: [
      {
        chapter: 40,
        verses: [
          {
            verse: 31,
            en: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.",
            fr: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.",
            meditation: {
              en: "Waiting on the Lord is the sacred exchange where human exhaustion is traded for divine endurance.",
              fr: "S'attendre à l'Éternel est le lieu d'échange où notre fatigue reçoit la force divine.",
            },
          },
        ],
      },
    ],
  },
  { id: "jeremiah", testament: "OT", name: { en: "Jeremiah", fr: "Jérémie" }, category: { en: "Major Prophets", fr: "Grands Prophètes" }, totalChapters: 52, featuredChapters: [] },
  { id: "lamentations", testament: "OT", name: { en: "Lamentations", fr: "Lamentations" }, category: { en: "Major Prophets", fr: "Grands Prophètes" }, totalChapters: 5, featuredChapters: [] },
  { id: "ezekiel", testament: "OT", name: { en: "Ezekiel", fr: "Ézéchiel" }, category: { en: "Major Prophets", fr: "Grands Prophètes" }, totalChapters: 48, featuredChapters: [] },
  { id: "daniel", testament: "OT", name: { en: "Daniel", fr: "Daniel" }, category: { en: "Major Prophets", fr: "Grands Prophètes" }, totalChapters: 12, featuredChapters: [] },
  { id: "hosea", testament: "OT", name: { en: "Hosea", fr: "Osée" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 14, featuredChapters: [] },
  { id: "joel", testament: "OT", name: { en: "Joel", fr: "Joël" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 3, featuredChapters: [] },
  { id: "amos", testament: "OT", name: { en: "Amos", fr: "Amos" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 9, featuredChapters: [] },
  { id: "obadiah", testament: "OT", name: { en: "Obadiah", fr: "Abdias" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 1, featuredChapters: [] },
  { id: "jonah", testament: "OT", name: { en: "Jonah", fr: "Jonas" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 4, featuredChapters: [] },
  { id: "micah", testament: "OT", name: { en: "Micah", fr: "Michée" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 7, featuredChapters: [] },
  { id: "nahum", testament: "OT", name: { en: "Nahum", fr: "Nahum" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 3, featuredChapters: [] },
  { id: "habakkuk", testament: "OT", name: { en: "Habakkuk", fr: "Habacuc" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 3, featuredChapters: [] },
  { id: "zephaniah", testament: "OT", name: { en: "Zephaniah", fr: "Sophonie" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 3, featuredChapters: [] },
  { id: "haggai", testament: "OT", name: { en: "Haggai", fr: "Aggée" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 2, featuredChapters: [] },
  { id: "zechariah", testament: "OT", name: { en: "Zechariah", fr: "Zacharie" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 14, featuredChapters: [] },
  { id: "malachi", testament: "OT", name: { en: "Malachi", fr: "Malachie" }, category: { en: "Minor Prophets", fr: "Petits Prophètes" }, totalChapters: 4, featuredChapters: [] },
  {
    id: "matthew",
    testament: "NT",
    name: { en: "Matthew", fr: "Matthieu" },
    category: { en: "Gospels", fr: "Évangiles" },
    totalChapters: 28,
    featuredChapters: [
      {
        chapter: 11,
        verses: [
          {
            verse: 28,
            en: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
            fr: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.",
            meditation: {
              en: "Christ invites the weary not to a heavier rulebook, but to the gentle yoke of His presence.",
              fr: "Christ invite ceux qui sont fatigués à recevoir le doux repos de Sa présence.",
            },
          },
        ],
      },
    ],
  },
  { id: "mark", testament: "NT", name: { en: "Mark", fr: "Marc" }, category: { en: "Gospels", fr: "Évangiles" }, totalChapters: 16, featuredChapters: [] },
  { id: "luke", testament: "NT", name: { en: "Luke", fr: "Luc" }, category: { en: "Gospels", fr: "Évangiles" }, totalChapters: 24, featuredChapters: [] },
  {
    id: "john",
    testament: "NT",
    name: { en: "John", fr: "Jean" },
    category: { en: "Gospels", fr: "Évangiles" },
    totalChapters: 21,
    featuredChapters: [
      {
        chapter: 14,
        verses: [
          {
            verse: 27,
            en: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.",
            fr: "Je vous laisse la paix, je vous donne ma paix. Je ne vous la donne pas comme le monde la donne.",
            meditation: {
              en: "Christ's peace is an inward anchor that holds steady regardless of outward storms.",
              fr: "La paix du Christ est une ancre intérieure qui demeure ferme au milieu des tempêtes.",
            },
          },
        ],
      },
    ],
  },
  { id: "acts", testament: "NT", name: { en: "Acts", fr: "Actes" }, category: { en: "Church History", fr: "Histoire de l'Église" }, totalChapters: 28, featuredChapters: [] },
  {
    id: "romans",
    testament: "NT",
    name: { en: "Romans", fr: "Romains" },
    category: { en: "Pauline Epistles", fr: "Épîtres de Paul" },
    totalChapters: 16,
    featuredChapters: [
      {
        chapter: 8,
        verses: [
          {
            verse: 1,
            en: "There is therefore now no condemnation to them which are in Christ Jesus.",
            fr: "Il n'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.",
            meditation: {
              en: "Stand on the verdict of grace: in Christ, shame is silenced and communion is restored.",
              fr: "Tenez-vous sur le verdict de la grâce : en Christ, la condamnation est effacée.",
            },
          },
        ],
      },
    ],
  },
  { id: "1-corinthians", testament: "NT", name: { en: "1 Corinthians", fr: "1 Corinthiens" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 16, featuredChapters: [] },
  { id: "2-corinthians", testament: "NT", name: { en: "2 Corinthians", fr: "2 Corinthiens" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 13, featuredChapters: [] },
  { id: "galatians", testament: "NT", name: { en: "Galatians", fr: "Galates" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 6, featuredChapters: [] },
  { id: "ephesians", testament: "NT", name: { en: "Ephesians", fr: "Éphésiens" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 6, featuredChapters: [] },
  { id: "philippians", testament: "NT", name: { en: "Philippians", fr: "Philippiens" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 4, featuredChapters: [] },
  { id: "colossians", testament: "NT", name: { en: "Colossians", fr: "Colossiens" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 4, featuredChapters: [] },
  { id: "1-thessalonians", testament: "NT", name: { en: "1 Thessalonians", fr: "1 Thessaloniciens" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 5, featuredChapters: [] },
  { id: "2-thessalonians", testament: "NT", name: { en: "2 Thessalonians", fr: "2 Thessaloniciens" }, category: { en: "Pauline Epistles", fr: "Épîtres de Paul" }, totalChapters: 3, featuredChapters: [] },
  { id: "1-timothy", testament: "NT", name: { en: "1 Timothy", fr: "1 Timothée" }, category: { en: "Pastoral Epistles", fr: "Épîtres Pastorales" }, totalChapters: 6, featuredChapters: [] },
  { id: "2-timothy", testament: "NT", name: { en: "2 Timothy", fr: "2 Timothée" }, category: { en: "Pastoral Epistles", fr: "Épîtres Pastorales" }, totalChapters: 4, featuredChapters: [] },
  { id: "titus", testament: "NT", name: { en: "Titus", fr: "Tite" }, category: { en: "Pastoral Epistles", fr: "Épîtres Pastorales" }, totalChapters: 3, featuredChapters: [] },
  { id: "philemon", testament: "NT", name: { en: "Philemon", fr: "Philémon" }, category: { en: "Pastoral Epistles", fr: "Épîtres Pastorales" }, totalChapters: 1, featuredChapters: [] },
  { id: "hebrews", testament: "NT", name: { en: "Hebrews", fr: "Hébreux" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 13, featuredChapters: [] },
  { id: "james", testament: "NT", name: { en: "James", fr: "Jacques" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 5, featuredChapters: [] },
  { id: "1-peter", testament: "NT", name: { en: "1 Peter", fr: "1 Pierre" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 5, featuredChapters: [] },
  { id: "2-peter", testament: "NT", name: { en: "2 Peter", fr: "2 Pierre" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 3, featuredChapters: [] },
  { id: "1-john", testament: "NT", name: { en: "1 John", fr: "1 Jean" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 5, featuredChapters: [] },
  { id: "2-john", testament: "NT", name: { en: "2 John", fr: "2 Jean" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 1, featuredChapters: [] },
  { id: "3-john", testament: "NT", name: { en: "3 John", fr: "3 Jean" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 1, featuredChapters: [] },
  { id: "jude", testament: "NT", name: { en: "Jude", fr: "Jude" }, category: { en: "General Epistles", fr: "Épîtres Générales" }, totalChapters: 1, featuredChapters: [] },
  {
    id: "revelation",
    testament: "NT",
    name: { en: "Revelation", fr: "Apocalypse" },
    category: { en: "Prophecy", fr: "Prophétie" },
    totalChapters: 22,
    featuredChapters: [
      {
        chapter: 21,
        verses: [
          {
            verse: 4,
            en: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying.",
            fr: "Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n'y aura plus ni deuil, ni cri, ni douleur.",
            meditation: {
              en: "Our ultimate horizon is the tender hand of God wiping away every tear in eternal communion.",
              fr: "Notre horizon ultime est la main compatissante de Dieu essuyant toute larme dans la communion éternelle.",
            },
          },
        ],
      },
    ],
  },
];

export function getBookById(bookId: string): BibleBook | undefined {
  return BIBLE_CANON.find((b) => b.id === bookId);
}

export function getChapterContent(
  bookId: string,
  chapterNumber: number
): BibleChapter {
  const book = getBookById(bookId) || BIBLE_CANON[18];
  const existing = book.featuredChapters.find(
    (c) => c.chapter === chapterNumber
  );
  if (existing) return existing;

  return {
    chapter: chapterNumber,
    verses: [
      {
        verse: 1,
        en: `Hear the word of the Lord in ${book.name.en} chapter ${chapterNumber}: The grass withereth, the flower fadeth: but the word of our God shall stand for ever.`,
        fr: `Écoutez la parole de l'Éternel dans ${book.name.fr}, chapitre ${chapterNumber} : L'herbe sèche, la fleur tombe; mais la parole de notre Dieu subsiste éternellement.`,
        meditation: {
          en: `As you meditate on ${book.name.en} ${chapterNumber}, let the enduring faithfulness of God anchor your thoughts in quiet trust.`,
          fr: `En méditant sur ${book.name.fr} ${chapterNumber}, laissez la fidélité éternelle de Dieu ancrer vos pensées dans la paix.`,
        },
      },
      {
        verse: 2,
        en: "Thy word is a lamp unto my feet, and a light unto my path.",
        fr: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.",
        meditation: {
          en: "God gives enough light for the next faithful step before you.",
          fr: "Dieu accorde la lumière nécessaire pour le prochain pas fidèle devant vous.",
        },
      },
    ],
  };
}

export function getDailyMeditation(dayIndex = 0): {
  book: BibleBook;
  chapter: BibleChapter;
  verse: BibleVerse;
} {
  const booksWithChapters = BIBLE_CANON.filter(
    (b) => b.featuredChapters.length > 0
  );
  const book =
    booksWithChapters[Math.abs(dayIndex) % booksWithChapters.length] ||
    BIBLE_CANON[18];
  const chapter = book.featuredChapters[0];
  const verse =
    chapter.verses[Math.abs(dayIndex) % chapter.verses.length] ||
    chapter.verses[0];
  return { book, chapter, verse };
}

export function searchScriptures(
  query: string,
  lang: "en" | "fr"
): Array<{ book: BibleBook; chapter: number; verse: BibleVerse }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: Array<{ book: BibleBook; chapter: number; verse: BibleVerse }> =
    [];

  for (const book of BIBLE_CANON) {
    const bookMatch =
      book.name.en.toLowerCase().includes(q) ||
      book.name.fr.toLowerCase().includes(q);

    for (const ch of book.featuredChapters) {
      for (const v of ch.verses) {
        const text = lang === "fr" ? v.fr : v.en;
        if (bookMatch || text.toLowerCase().includes(q)) {
          results.push({ book, chapter: ch.chapter, verse: v });
        }
      }
    }
  }
  return results;
}
