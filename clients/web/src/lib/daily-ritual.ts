import { recordDailyActivity, type StreakData } from "./streak";
import type { DayActivityRecord, MoodItem } from "@/components/ProgressScreen";

export type RitualSoulMood = MoodItem["id"] | "sabbath";
export type BibleTranslation = "ESV" | "NIV" | "KJV" | "LSG";

export interface RitualScriptureTrack {
  id: RitualSoulMood;
  moodLabelEn: string;
  moodLabelFr: string;
  moodEmoji: string;
  moodColor: string;
  referenceEn: string;
  referenceFr: string;
  themeEn: string;
  themeFr: string;
  contextEn: string;
  contextFr: string;
  translations: Record<BibleTranslation, string>;
  promptsEn: [string, string, string];
  promptsFr: [string, string, string];
  prayerStarterEn: string;
  prayerStarterFr: string;
}

export const RITUAL_TRACKS: Record<RitualSoulMood, RitualScriptureTrack> = {
  peaceful: {
    id: "peaceful",
    moodLabelEn: "Peaceful",
    moodLabelFr: "Paisible",
    moodEmoji: "🕊️",
    moodColor: "#37C6C2",
    referenceEn: "Psalm 23:1-3",
    referenceFr: "Psaume 23:1-3",
    themeEn: "Still Waters & Soul Restoration",
    themeFr: "Eaux Paisibles & Restauration de l'Âme",
    contextEn: "Written by David from his years shepherding in the Judean wilderness, where sheep only lie down when free from predators, friction, and hunger.",
    contextFr: "Écrit par David à partir de son expérience de berger dans le désert de Judée, où les brebis ne se reposent que lorsqu'elles se savent protégées.",
    translations: {
      ESV: "“The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.”",
      NIV: "“The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.”",
      KJV: "“The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.”",
      LSG: "« L'Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles. Il restaure mon âme. »",
    },
    promptsEn: [
      "Where is hurry or urgency tempting you to rush past God's presence this morning?",
      "What 'still water' of grace is the Shepherd inviting you to drink from today?",
      "Which responsibility can you entrust into His hands before opening your messages?",
    ],
    promptsFr: [
      "Où la précipitation tente-t-elle de vous éloigner de la présence de Dieu ce matin ?",
      "À quelle « eau paisible » de grâce le Bon Berger vous invite-t-il aujourd'hui ?",
      "Quelle responsabilité pouvez-vous remettre entre Ses mains avant de commencer votre journée ?",
    ],
    prayerStarterEn: "Lord, You are my Shepherd and I lack nothing. Quiet my hurried thoughts and lead me beside Your still waters today...",
    prayerStarterFr: "Seigneur, Tu es mon Berger et je ne manque de rien. Apaise mes pensées pressées et conduis-moi près de Tes eaux paisibles aujourd'hui...",
  },
  grateful: {
    id: "grateful",
    moodLabelEn: "Grateful",
    moodLabelFr: "Reconnaissant",
    moodEmoji: "🙏",
    moodColor: "#E3B15E",
    referenceEn: "Lamentations 3:22-23",
    referenceFr: "Lamentations 3:22-23",
    themeEn: "Morning Mercies Renewed",
    themeFr: "Compassions Renouvelées Chaque Matin",
    contextEn: "Composed in the aftermath of Jerusalem's hardest season, anchoring hope not in changing circumstances but in God's covenant faithfulness.",
    contextFr: "Écrit au cœur d'une saison d'épreuve, ancrant l'espérance non dans les circonstances mais dans la fidélité immuable de Dieu.",
    translations: {
      ESV: "“The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.”",
      NIV: "“Because of the Lord’s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.”",
      KJV: "“It is of the Lord’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.”",
      LSG: "« Les bontés de l'Éternel ne sont pas épuisées, Ses compassions ne sont pas à leur terme ; elles se renouvellent chaque matin. Que ta fidélité est grande ! »",
    },
    promptsEn: [
      "Name one specific mercy from the past 24 hours that shows God's faithfulness.",
      "How does remembering God's past provision change the way you face today's work?",
      "Who in your life can you encourage today out of the overflow of gratitude?",
    ],
    promptsFr: [
      "Nommez une grâce précise des dernières 24 heures qui témoigne de la fidélité de Dieu.",
      "Comment le souvenir de Sa provision passée transforme-t-il votre regard sur cette journée ?",
      "Qui pouvez-vous encourager aujourd'hui par reconnaissance envers Dieu ?",
    ],
    prayerStarterEn: "Father, thank You that Your mercies are brand new this morning. Open my eyes to recognize Your faithfulness in every small gift...",
    prayerStarterFr: "Père, merci parce que Tes compassions sont nouvelles ce matin. Ouvre mes yeux pour reconnaître Ta fidélité dans chaque détail...",
  },
  seeking: {
    id: "seeking",
    moodLabelEn: "Seeking",
    moodLabelFr: "En quête",
    moodEmoji: "🔍",
    moodColor: "#7B62B8",
    referenceEn: "Proverbs 3:5-6",
    referenceFr: "Proverbes 3:5-6",
    themeEn: "Wisdom & Straight Paths",
    themeFr: "Sagesse & Sentiers Aplanis",
    contextEn: "Solomon's foundational wisdom instruction: trading anxious self-reliance for whole-hearted trust in God's unseen governance.",
    contextFr: "L'instruction de sagesse de Salomon : remplacer l'inquiétude du contrôle personnel par une confiance entière dans la direction de Dieu.",
    translations: {
      ESV: "“Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.”",
      NIV: "“Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.”",
      KJV: "“Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.”",
      LSG: "« Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse ; reconnais-le dans toutes tes voies, et il aplanira tes sentiers. »",
    },
    promptsEn: [
      "What decision or uncertainty are you currently trying to solve by your own strength alone?",
      "What would it look like to acknowledge God in your very next conversation or meeting?",
      "Where is God asking you to take one faithful step today without seeing the whole staircase?",
    ],
    promptsFr: [
      "Quelle décision ou incertitude essayez-vous de résoudre par vos propres forces ?",
      "Comment pouvez-vous reconnaître Dieu concrètement dans votre prochaine réunion ou conversation ?",
      "Où Dieu vous demande-t-il de faire un pas de foi aujourd'hui sans tout maîtriser ?",
    ],
    prayerStarterEn: "Lord, I lay down my need to figure everything out on my own. Grant me clear wisdom for the next step and trust in Your timing...",
    prayerStarterFr: "Seigneur, je dépose mon besoin de tout comprendre par moi-même. Accorde-moi Ta sagesse pour le prochain pas et la paix dans Ton calendrier...",
  },
  convicted: {
    id: "convicted",
    moodLabelEn: "Convicted",
    moodLabelFr: "Repentant",
    moodEmoji: "🕯️",
    moodColor: "#B8746B",
    referenceEn: "Psalm 51:10-12",
    referenceFr: "Psaume 51:12-14",
    themeEn: "A Clean Heart & Steadfast Spirit",
    themeFr: "Un Cœur Pur & un Esprit Bien Disposé",
    contextEn: "David's prayer of honest repentance, discovering that God never despises a broken and contrite heart that turns back to Him.",
    contextFr: "La prière de repentance sincère de David, découvrant que Dieu ne rejette jamais un cœur brisé et contrit qui revient à Lui.",
    translations: {
      ESV: "“Create in me a clean heart, O God, and renew a right spirit within me. Cast me not away from your presence... Restore to me the joy of your salvation.”",
      NIV: "“Create in me a pure heart, O God, and renew a steadfast spirit within me. Do not cast me from your presence... Restore to me the joy of your salvation.”",
      KJV: "“Create in me a clean heart, O God; and renew a right spirit within me. Cast me not away from thy presence... Restore unto me the joy of thy salvation.”",
      LSG: "« Ô Dieu ! crée en moi un cœur pur, renouvelle en moi un esprit bien disposé. Rends-moi la joie de ton salut, et qu'un esprit de bonne volonté me soutienne ! »",
    },
    promptsEn: [
      "What habit, sharp word, or distraction is the Holy Spirit gently bringing into the light?",
      "How does Christ's finished forgiveness free you from hiding in guilt today?",
      "What single realignment of heart will bring restoration to your relationships today?",
    ],
    promptsFr: [
      "Quelle habitude ou parole le Saint-Esprit met-Il doucement en lumière ce matin ?",
      "Comment le pardon accompli en Christ vous libère-t-il de la culpabilité aujourd'hui ?",
      "Quel geste de réconciliation ou d'humilité pouvez-vous poser aujourd'hui ?",
    ],
    prayerStarterEn: "Merciful Father, create in me a clean heart today. Thank You that where sin abounded, Your grace abounds all the more...",
    prayerStarterFr: "Père plein de grâce, crée en moi un cœur pur aujourd'hui. Merci parce que Ta grâce surabonde et restaure la joie de Ton salut...",
  },
  doubting: {
    id: "doubting",
    moodLabelEn: "Doubting",
    moodLabelFr: "En doute",
    moodEmoji: "🤔",
    moodColor: "#6B8CAE",
    referenceEn: "Mark 9:23-24",
    referenceFr: "Marc 9:23-24",
    themeEn: "Honest Faith in Uncertainty",
    themeFr: "La Foi Sincère au Milieu du Doute",
    contextEn: "A desperate father brings his trembling, imperfect faith directly to Jesus—and Jesus meets him with compassion rather than rebuke.",
    contextFr: "Un père apporte sa foi tremblante et imparfaite directement à Jésus — et Jésus l'accueille avec compassion sans jamais le repousser.",
    translations: {
      ESV: "“And Jesus said to him, ‘All things are possible for one who believes.’ Immediately the father of the child cried out and said, ‘I believe; help my unbelief!’”",
      NIV: "“‘Everything is possible for one who believes.’ Immediately the boy’s father exclaimed, ‘I do believe; help me overcome my unbelief!’”",
      KJV: "“Jesus said unto him, If thou canst believe, all things are possible to him that believeth. And straightway the father of the child cried out, and said with tears, Lord, I believe; help thou mine unbelief.”",
      LSG: "« Jésus lui dit : Tout est possible à celui qui croit. Aussitôt le père de l'enfant s'écria : Je crois ! viens au secours de mon incrédulité ! »",
    },
    promptsEn: [
      "What honest question or unanswered prayer feels heaviest on your heart right now?",
      "How does it comfort you that Jesus welcomes 'I believe; help my unbelief'?",
      "Where can you anchor your trust in Who Christ is, even while answers are still unfolding?",
    ],
    promptsFr: [
      "Quelle question sincère ou prière sans réponse pèse le plus sur votre cœur en ce moment ?",
      "En quoi est-ce rassurant de voir que Jésus accueille la prière « Viens au secours de mon incrédulité » ?",
      "Comment vous appuyer sur la personne de Christ même quand tout n'est pas encore clair ?",
    ],
    prayerStarterEn: "Lord Jesus, I bring You my honest questions without pretending. I do believe—please help my unbelief and anchor me in Your truth...",
    prayerStarterFr: "Seigneur Jésus, je T'apporte mes questions sincères sans détour. Je crois — viens au secours de mon incrédulité et garde-moi dans Ta paix...",
  },
  distant: {
    id: "distant",
    moodLabelEn: "Distant",
    moodLabelFr: "Éloigné",
    moodEmoji: "🌫️",
    moodColor: "#8A7DAD",
    referenceEn: "Romans 8:38-39",
    referenceFr: "Romains 8:38-39",
    themeEn: "Unbreakable Covenant Love",
    themeFr: "L'Amour Inséparable en Christ",
    contextEn: "Paul's climactic assurance to believers in Rome: our closeness to God rests on Christ's grip on us, not our fluctuating emotional grip on Him.",
    contextFr: "L'assurance de Paul aux croyants de Rome : notre sécurité repose sur la main de Christ qui nous tient, et non sur nos émotions fluctuantes.",
    translations: {
      ESV: "“For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come... will be able to separate us from the love of God in Christ Jesus our Lord.”",
      NIV: "“For I am convinced that neither death nor life, nor angels nor demons, neither the present nor the future... will be able to separate us from the love of God that is in Christ Jesus our Lord.”",
      KJV: "“For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers... shall be able to separate us from the love of God, which is in Christ Jesus our Lord.”",
      LSG: "« Car j'ai l'assurance que ni la mort ni la vie, ni les anges ni les dominations, ni les choses présentes ni les choses à venir... ne pourra nous séparer de l'amour de Dieu manifesté en Jésus-Christ notre Seigneur. »",
    },
    promptsEn: [
      "When spiritual feelings feel dry or quiet, what truth about God's character remains unchanged?",
      "What exhaustion or burnout might be contributing to feeling spiritually distant today?",
      "How can you rest in the truth that nothing in creation can separate you from His love?",
    ],
    promptsFr: [
      "Quand vos émotions spirituelles semblent arides, quelle vérité sur l'amour de Dieu demeure intacte ?",
      "Quelle fatigue physique ou mentale contribue peut-être à ce sentiment de distance ?",
      "Comment vous reposer aujourd'hui dans la promesse que rien ne peut vous séparer de Son amour ?",
    ],
    prayerStarterEn: "Lord, even when my heart feels quiet or weary, I thank You that nothing can separate me from Your covenant love in Christ...",
    prayerStarterFr: "Seigneur, même lorsque mon cœur se sent fatigué ou silencieux, merci parce que rien ne peut me séparer de Ton amour en Jésus-Christ...",
  },
  sabbath: {
    id: "sabbath",
    moodLabelEn: "Sabbath Rest",
    moodLabelFr: "Repos du Sabbat",
    moodEmoji: "🌿",
    moodColor: "#1FB6B0",
    referenceEn: "Matthew 11:28-30",
    referenceFr: "Matthieu 11:28-30",
    themeEn: "The Unforced Rhythms of Grace",
    themeFr: "Le Doux Repos de la Grâce",
    contextEn: "Jesus invites weary strivers to exchange heavy religious and professional yokes for His gentle, humble companionship.",
    contextFr: "Jésus invite ceux qui sont fatigués et chargés à échanger leurs fardeaux contre Son joug doux et léger.",
    translations: {
      ESV: "“Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls.”",
      NIV: "“Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.”",
      KJV: "“Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.”",
      LSG: "« Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos. Prenez mon joug sur vous et recevez mes instructions, car je suis doux et humble de cœur ; et vous trouverez du repos pour vos âmes. »",
    },
    promptsEn: [
      "What burden or metric of productivity can you consciously lay down for Sabbath rest today?",
      "How does pausing from striving declare your trust that God sustains the world?",
      "What brings quiet delight and worship to your soul when you slow down?",
    ],
    promptsFr: [
      "Quel fardeau de productivité pouvez-vous déposer consciemment pour honorer le repos aujourd'hui ?",
      "Comment l'arrêt de vos efforts proclame-t-il que c'est Dieu qui soutient votre vie ?",
      "Qu'est-ce qui apporte une joie paisible et une louange simple à votre âme aujourd'hui ?",
    ],
    prayerStarterEn: "Jesus, I come to You weary and lay down my striving. Thank You for shielding my rhythm with Your Sabbath peace and rest...",
    prayerStarterFr: "Jésus, je viens à Toi et je dépose mes efforts. Merci de protéger ma marche spirituelle par Ton repos et Ta grâce...",
  },
};

export const LIFEBOOK_RITUAL_COMPLETED_EVENT = "lifebook.ritual.completed";
export const TODAY_RITUAL_STORAGE_KEY = "lifebook.dailyRitual.records";

export interface CompletedRitualPayload {
  dateStr: string;
  mood: RitualSoulMood;
  translation: BibleTranslation;
  scriptureRef: string;
  scriptureText: string;
  reflectionText: string;
  prayerDurationSec: number;
  isSabbathRest: boolean;
  gracePointsAwarded: number;
  totalGracePoints: number;
  updatedStreak: StreakData;
}

export function getGracePoints(): number {
  if (typeof window === "undefined") return 240;
  try {
    const raw = localStorage.getItem("lifebook.gracePoints");
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    localStorage.setItem("lifebook.gracePoints", "240");
  } catch {
    // ignore
  }
  return 240;
}

export function getTodayRitualCompletion(): CompletedRitualPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(TODAY_RITUAL_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, CompletedRitualPayload>;
    return map[todayStr] || null;
  } catch {
    return null;
  }
}

/**
 * Atomically completes the 5-Minute Daily Ritual and syncs:
 * 1. `lifebook.streak.data` (via recordDailyActivity)
 * 2. `lifebook.calendar.streakHistory` (30-day heatmap in ProgressScreen & Dashboard)
 * 3. `lifebook.gracePoints` (+50 Grace Points)
 * 4. `lifebook.journal` (ProgressScreen Soul Journal)
 * 5. `lifebook.dashboard.journal` (Dashboard Soul Journal)
 * 6. `lifebook.dailyRitual.records` (Today's completion seal)
 */
export function completeDailyRitualSession(params: {
  mood: RitualSoulMood;
  translation: BibleTranslation;
  reflectionText: string;
  prayerDurationSec: number;
  isSabbathRest: boolean;
  isFr?: boolean;
}): CompletedRitualPayload {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeFormatted = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dayLabel = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const track = RITUAL_TRACKS[params.mood] || RITUAL_TRACKS.peaceful;
  const scriptureRef = `${params.isFr ? track.referenceFr : track.referenceEn} (${params.translation})`;
  const scriptureText = track.translations[params.translation];
  const finalReflection =
    params.reflectionText.trim() ||
    (params.isFr ? track.prayerStarterFr : track.prayerStarterEn);

  // 1. Update Streak Engine
  const updatedStreak = recordDailyActivity(params.isSabbathRest);

  // 2. Update Grace Points (+50)
  const prevPoints = getGracePoints();
  const gracePointsAwarded = 50;
  const totalGracePoints = prevPoints + gracePointsAwarded;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("lifebook.gracePoints", String(totalGracePoints));
    } catch {
      // ignore
    }
  }

  // 3. Update 30-Day Calendar Heatmap (`lifebook.calendar.streakHistory`)
  if (typeof window !== "undefined") {
    try {
      const existingRaw = localStorage.getItem("lifebook.calendar.streakHistory");
      const records: Record<string, DayActivityRecord> = existingRaw ? JSON.parse(existingRaw) : {};
      const mappedMood: MoodItem["id"] =
        params.mood === "sabbath" ? "peaceful" : params.mood;

      records[dateStr] = {
        date: dateStr,
        dayLabel,
        mood: mappedMood,
        intensity: 4, // Peak Abiding Rhythm 🔥
        scriptureRead: true,
        prayerCompleted: true,
        stillnessPractice: true,
        journalWritten: true,
        isSabbathRest: params.isSabbathRest || params.mood === "sabbath",
        sabbathNote:
          params.isSabbathRest || params.mood === "sabbath"
            ? "Consecrated Sabbath rest & 5-minute daily sanctuary."
            : undefined,
        scriptureRef,
        reflectionSnippet: finalReflection.slice(0, 140),
      };
      localStorage.setItem("lifebook.calendar.streakHistory", JSON.stringify(records));
    } catch {
      // ignore
    }
  }

  // 4. Sync with ProgressScreen Journal (`lifebook.journal`)
  if (typeof window !== "undefined") {
    try {
      const journalRaw = localStorage.getItem("lifebook.journal");
      const existingJournal = journalRaw ? JSON.parse(journalRaw) : [];
      const newProgressJournalEntry = {
        id: `ritual_${Date.now()}`,
        date: `${dateStr} · ${timeFormatted}`,
        timestamp: now.getTime(),
        mood: params.mood,
        moodEmoji: track.moodEmoji,
        moodLabel: params.isFr ? track.moodLabelFr : track.moodLabelEn,
        moodColor: track.moodColor,
        text: finalReflection,
        scriptureRef,
        scriptureSnippet: scriptureText,
        tags: [
          "#DailyRitual",
          params.isSabbathRest ? "#SabbathRest" : `#${track.moodLabelEn.replace(/\s+/g, "")}`,
          `#${params.translation}`,
        ],
        isFavorite: true,
      };
      localStorage.setItem(
        "lifebook.journal",
        JSON.stringify([newProgressJournalEntry, ...existingJournal])
      );
    } catch {
      // ignore
    }
  }

  // 5. Sync with Dashboard Journal (`lifebook.dashboard.journal`)
  if (typeof window !== "undefined") {
    try {
      const dashRaw = localStorage.getItem("lifebook.dashboard.journal");
      const existingDash = dashRaw ? JSON.parse(dashRaw) : [];
      const newDashEntry = {
        id: `dj-${Date.now()}`,
        date: `${dateStr} · ${timeFormatted}`,
        isoDate: dateStr,
        time: timeFormatted,
        text: finalReflection,
        mood: params.mood,
        moodEmoji: track.moodEmoji,
        moodLabel: params.isFr ? track.moodLabelFr : track.moodLabelEn,
        moodColor: track.moodColor,
        scriptureRef,
        scriptureSnippet: scriptureText,
        tags: ["#DailyRitual", `#${params.translation}`, "#5MinSanctuary"],
        isFavorite: true,
      };
      localStorage.setItem(
        "lifebook.dashboard.journal",
        JSON.stringify([newDashEntry, ...existingDash])
      );
    } catch {
      // ignore
    }
  }

  // 6. Save Today's Ritual Seal & Dispatch Global Event
  const payload: CompletedRitualPayload = {
    dateStr,
    mood: params.mood,
    translation: params.translation,
    scriptureRef,
    scriptureText,
    reflectionText: finalReflection,
    prayerDurationSec: params.prayerDurationSec,
    isSabbathRest: params.isSabbathRest || params.mood === "sabbath",
    gracePointsAwarded,
    totalGracePoints,
    updatedStreak,
  };

  if (typeof window !== "undefined") {
    try {
      const rawMap = localStorage.getItem(TODAY_RITUAL_STORAGE_KEY);
      const map = rawMap ? JSON.parse(rawMap) : {};
      map[dateStr] = payload;
      localStorage.setItem(TODAY_RITUAL_STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent(LIFEBOOK_RITUAL_COMPLETED_EVENT, { detail: payload }));
    } catch {
      // ignore
    }
  }

  return payload;
}
