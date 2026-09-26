export interface Teacher {
  id: string;
  slug: string;
  name: string;
  title: string;
  titleFr: string;
  role: string;
  roleFr: string;
  theologicalSpecialty: string;
  theologicalSpecialtyFr: string;
  specialties: string[];
  specialtiesFr: string[];
  bio: string;
  bioFr: string;
  ministryAffiliation: string;
  education: string;
  educationFr: string;
  portrait: string;
  featuredScripture: string;
  featuredScriptureFr: string;
}

export type Teaching = {
  slug: string;
  title: string;
  titleFr: string;
  teacher: string;
  teacherSlug: string;
  teacherRole: string;
  teacherRoleFr: string;
  theologicalSpecialty: string;
  theologicalSpecialtyFr: string;
  category: string;
  categoryFr: string;
  duration: string;
  durationFr: string;
  scripture: string;
  scriptureFr: string;
  excerpt: string;
  excerptFr: string;
  teaching: string;
  teachingFr: string;
  color: string;
  portrait: string;
  audioUrl?: string;
  videoUrl?: string;
};

export const teachers: Teacher[] = [
  {
    id: "teacher-asket",
    slug: "pastor-asket",
    name: "Pastor Asket",
    title: "Reverend Pastor",
    titleFr: "Pasteur Révérend",
    role: "LifeBook Pastoral Director & Contributor",
    roleFr: "Directeur pastoral & Contributeur LifeBook",
    theologicalSpecialty: "Christocentric Hermeneutics & Contemplative Spiritual Disciplines",
    theologicalSpecialtyFr: "Herméneutique christocentrique & Disciplines spirituelles contemplatives",
    specialties: [
      "Christocentric Hermeneutics",
      "Contemplative Prayer",
      "Sabbath Rest",
      "Early Church Disciplines",
      "Spiritual Warfare & Grace"
    ],
    specialtiesFr: [
      "Herméneutique christocentrique",
      "Prière contemplative",
      "Repos du Sabbat",
      "Disciplines de l'Église primitive",
      "Combat spirituel & Grâce"
    ],
    bio: "Pastor Asket serves as a pastoral voice and teacher within the LifeBook fellowship, with over fifteen years of ministry dedicated to intentional discipleship, expository reflection, and restoring quiet, holy habits of prayer. His ministry focuses on leading hurried Christians out of performative religion into unhurried, resting communion with Christ through Scripture, stillness, and daily surrendered obedience.",
    bioFr: "Le Pasteur Asket est une voix pastorale au sein de la communion LifeBook, avec plus de quinze années de ministère consacrées à la formation de disciples, à la méditation biblique textuelle et au rétablissement de saintes habitudes de prière. Son engagement est de délivrer les croyants pressés de la religion superficielle pour les ancrer dans une communion paisible avec le Christ par la Parole, le silence et l'obéissance du cœur.",
    ministryAffiliation: "Grace & Truth Pastoral Fellowship",
    education: "M.Div. in Pastoral Theology & Biblical Hermeneutics",
    educationFr: "Master en Théologie Pastorale & Herméneutique Biblique",
    portrait: "/AsketOfficialPic (1).png",
    featuredScripture: "Mark 9:24",
    featuredScriptureFr: "Marc 9:24",
  },
  {
    id: "teacher-esther",
    slug: "dr-esther-laurent",
    name: "Dr. Esther Laurent",
    title: "Senior Lecturer & Counselor",
    titleFr: "Enseignante-chercheuse & Conseillère",
    role: "Biblical Counselor & Old Testament Scholar",
    roleFr: "Conseillère biblique & Spécialiste de l'Ancien Testament",
    theologicalSpecialty: "Biblical Lament, Trauma Recovery & Covenant Grace",
    theologicalSpecialtyFr: "Lamentation biblique, guérison intérieure & Grâce de l'Alliance",
    specialties: [
      "Biblical Lament",
      "Covenant Grace",
      "Emotional Healing in Christ",
      "Psalms & Wisdom Literature",
      "Grief & Hope"
    ],
    specialtiesFr: [
      "Lamentation biblique",
      "Grâce de l'Alliance",
      "Guérison émotionnelle en Christ",
      "Psaumes & Littérature sapientiale",
      "Espérance dans le deuil"
    ],
    bio: "Dr. Esther Laurent is a biblical counselor, theological researcher, and author. Having walked with hundreds of believers through periods of grief, medical crises, and spiritual darkness, she teaches that biblical lament is not the antithesis of faith, but rather faith's most vulnerable and honest prayer before a sovereign God.",
    bioFr: "Le Dr Esther Laurent est conseillère biblique, théologienne et auteure. Ayant accompagné des centaines de croyants dans les épreuves de la souffrance, du deuil et du doute, elle démontre que la lamentation biblique n'est pas le refus de la foi, mais son cri le plus authentique devant la souveraineté de Dieu.",
    ministryAffiliation: "Living Hope Biblical Counseling Institute",
    education: "Ph.D. in Old Testament Hermeneutics, Trinity Evangelical Divinity School",
    educationFr: "Doctorat en Herméneutique de l'Ancien Testament",
    portrait: "/myself.jpeg",
    featuredScripture: "Psalm 34:18",
    featuredScriptureFr: "Psaume 34:18",
  },
  {
    id: "teacher-samuel",
    slug: "pastor-samuel-ndlovu",
    name: "Pastor Samuel Ndlovu",
    title: "Pastor & Church Planter",
    titleFr: "Pasteur & Implantateur",
    role: "Church Planter & Expository Preacher",
    roleFr: "Implantateur d'églises & Prédicateur textuel",
    theologicalSpecialty: "Expository Preaching, Radical Discipleship & Missional Theology",
    theologicalSpecialtyFr: "Prédication textuelle, vie de disciple radicale & Théologie missionnaire",
    specialties: [
      "Expository Preaching",
      "Gospel in Urban Mission",
      "Kingdom Ethics",
      "Pauline Epistles",
      "Sacrificial Living"
    ],
    specialtiesFr: [
      "Prédication textuelle",
      "Évangile en milieu urbain",
      "Éthique du Royaume",
      "Épîtres pauliniennes",
      "Vie sacrificielle"
    ],
    bio: "Pastor Samuel Ndlovu has planted vibrant gospel-centered churches across diverse urban neighborhoods. He brings an infectious passion for verse-by-verse expository teaching that bridges deep doctrinal foundations with urgent practical obedience, urging believers to embody the radical grace and kingdom justice of Jesus.",
    bioFr: "Le Pasteur Samuel Ndlovu a implanté des assemblées vivantes et centrées sur l'Évangile au cœur de grands centres urbains. Il communique un amour profond pour la prédication verset par verset qui relie l'orthodoxie doctrinale à l'amour concret du prochain, appelant à refléter la justice et la grâce du Royaume.",
    ministryAffiliation: "All Nations Gospel Movement",
    education: "Th.M. in Expository Preaching & Missiology, Reformed Theological Seminary",
    educationFr: "Master en Prédication Textuelle & Missiologie",
    portrait: "/AsketOfficialPic (1).png",
    featuredScripture: "Romans 12:1-2",
    featuredScriptureFr: "Romains 12:1-2",
  },
  {
    id: "teacher-sarah",
    slug: "minister-sarah-jenkins",
    name: "Minister Sarah Jenkins",
    title: "Spiritual Formation Director",
    titleFr: "Directrice de formation spirituelle",
    role: "Liturgical Director & Spiritual Companion",
    roleFr: "Directrice liturgique & Accompagnatrice spirituelle",
    theologicalSpecialty: "Historical Liturgies, Christian Solitude & Scripture Meditation",
    theologicalSpecialtyFr: "Liturgies historiques, silence chrétien & Méditation des Écritures",
    specialties: [
      "Lectio Divina",
      "Ancient Christian Collects",
      "Contemplative Silence",
      "Gospel of John",
      "Spiritual Direction"
    ],
    specialtiesFr: [
      "Lectio Divina",
      "Prières et collectes anciennes",
      "Silence contemplatif",
      "Évangile de Jean",
      "Accompagnement spirituel"
    ],
    bio: "Minister Sarah Jenkins is a seasoned teacher of historical Christian spiritual formation. She helps modern Christians discover ancient, time-tested practices such as Lectio Divina, liturgical prayers, and sacred silence, equipping them to resist distraction and remain deeply rooted in the Vine.",
    bioFr: "La ministre Sarah Jenkins enseigne la formation spirituelle chrétienne ancrée dans les Pères de l'Église. Elle aide les chrétiens contemporains à redécouvrir les disciplines millénaires comme la Lectio Divina, la prière liturgique et le silence sacré, pour demeurer profondément attachés au vrai Cep face aux bruits du monde.",
    ministryAffiliation: "Anchored Soul Contemplative Network",
    education: "M.A. in Christian Formation & Soul Care, Wheaton College",
    educationFr: "Master en Formation Chrétienne & Cure d'Âme",
    portrait: "/myself.jpeg",
    featuredScripture: "Psalm 46:10",
    featuredScriptureFr: "Psaume 46:10",
  }
];

export const teachings: Teaching[] = [
  {
    slug: "when-faith-feels-small",
    title: "When faith feels small",
    titleFr: "Quand la foi semble petite",
    teacher: "Pastor Asket",
    teacherSlug: "pastor-asket",
    teacherRole: "LifeBook Pastoral Director",
    teacherRoleFr: "Directeur pastoral LifeBook",
    theologicalSpecialty: "Christocentric Hermeneutics & Contemplative Spiritual Disciplines",
    theologicalSpecialtyFr: "Herméneutique christocentrique & Disciplines spirituelles contemplatives",
    category: "Faith",
    categoryFr: "Foi",
    duration: "12 min",
    durationFr: "12 min",
    scripture: "Mark 9:24",
    scriptureFr: "Marc 9:24",
    excerpt: "Lord, I believe; help my unbelief. Faith does not begin with pretending to be strong. It begins by bringing the truth into the presence of Jesus.",
    excerptFr: "« Je crois ! Viens au secours de mon incrédulité ! » La foi ne commence pas en feignant d'être fort. Elle commence en déposant notre vérité aux pieds de Jésus.",
    teaching: "Faith is not the absence of questions. It is the decision to bring our questions to Jesus. The father in Mark 9 did not hide his unbelief; he placed it honestly before the Lord. We can do the same. A small faith, offered to Christ, is still faith held by a great Savior.",
    teachingFr: "La foi n'est pas l'absence de questions. C'est la décision d'apporter nos doutes et nos interrogations à Jésus. Le père dans Marc 9 n'a pas caché son combat intérieur ; il l'a présenté en toute sincérité au Seigneur. Une petite foi remise au Christ demeure une foi soutenue par un grand Sauveur.",
    color: "word-card-rose",
    portrait: "/AsketOfficialPic (1).png",
  },
  {
    slug: "learning-to-be-still",
    title: "Learning to be still",
    titleFr: "Apprendre à faire silence",
    teacher: "Minister Sarah Jenkins",
    teacherSlug: "minister-sarah-jenkins",
    teacherRole: "Director of Spiritual Formation",
    teacherRoleFr: "Directrice de formation spirituelle",
    theologicalSpecialty: "Historical Liturgies, Christian Solitude & Scripture Meditation",
    theologicalSpecialtyFr: "Liturgies historiques, silence chrétien & Méditation des Écritures",
    category: "Prayer",
    categoryFr: "Prière",
    duration: "9 min",
    durationFr: "9 min",
    scripture: "Psalm 46:10",
    scriptureFr: "Psaume 46:10",
    excerpt: "Be still, and know that I am God. Stillness is not an empty space. It is a way of remembering who God is when the noise has become too loud.",
    excerptFr: "« Arrêtez, et sachez que je suis Dieu. » Le silence n'est pas un vide. C'est une manière de se souvenir de qui est Dieu lorsque le bruit du monde devient assourdissant.",
    teaching: "Stillness is not something we master so we can impress God. It is a posture of receiving. We release our grip, remember that the Lord is God, and allow his presence to become more real to us than the urgency around us.",
    teachingFr: "Le silence n'est pas une compétence à maîtriser pour impressionner Dieu. C'est une attitude d'accueil. Nous relâchons notre emprise, nous nous rappelons que l'Éternel est Dieu, et nous laissons Sa présence devenir plus tangible que toutes les urgences qui nous entourent.",
    color: "word-card-sage",
    portrait: "/myself.jpeg",
  },
  {
    slug: "mercy-of-a-new-morning",
    title: "The mercy of a new morning",
    titleFr: "La grâce d'un nouveau matin",
    teacher: "Pastor Asket",
    teacherSlug: "pastor-asket",
    teacherRole: "LifeBook Pastoral Director",
    teacherRoleFr: "Directeur pastoral LifeBook",
    theologicalSpecialty: "Christocentric Hermeneutics & Contemplative Spiritual Disciplines",
    theologicalSpecialtyFr: "Herméneutique christocentrique & Disciplines spirituelles contemplatives",
    category: "Hope",
    categoryFr: "Espérance",
    duration: "15 min",
    durationFr: "15 min",
    scripture: "Lamentations 3:22-23",
    scriptureFr: "Lamentations 3:22-23",
    excerpt: "The steadfast love of the Lord never ceases; his mercies never come to an end. Every morning is an invitation to receive grace again.",
    excerptFr: "Les bontés de l'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme ; elles se renouvellent chaque matin. Chaque aube est une invitation à recevoir Sa grâce.",
    teaching: "The mercy of God is not exhausted by yesterday. His compassion meets us again this morning, not because we have earned a fresh start, but because he is faithful. Receive today as a gift, and let gratitude become the beginning of hope.",
    teachingFr: "La miséricorde de Dieu n'a pas été consumée par les erreurs d'hier. Sa compassion vient à notre rencontre ce matin, non pas parce que nous aurions mérité un nouveau départ, mais parce qu'Il est fidèle. Accueillez aujourd'hui comme une grâce vivante.",
    color: "word-card-blue",
    portrait: "/AsketOfficialPic (1).png",
  },
  {
    slug: "a-life-shaped-by-love",
    title: "A life shaped by love",
    titleFr: "Une vie façonnée par l'amour",
    teacher: "Pastor Samuel Ndlovu",
    teacherSlug: "pastor-samuel-ndlovu",
    teacherRole: "Church Planter & Expository Preacher",
    teacherRoleFr: "Implantateur d'églises & Prédicateur textuel",
    theologicalSpecialty: "Expository Preaching, Radical Discipleship & Missional Theology",
    theologicalSpecialtyFr: "Prédication textuelle, vie de disciple radicale & Théologie missionnaire",
    category: "Discipleship",
    categoryFr: "Vie chrétienne",
    duration: "18 min",
    durationFr: "18 min",
    scripture: "John 13:34-35",
    scriptureFr: "Jean 13:34-35",
    excerpt: "By this all people will know that you are my disciples, if you have love for one another. Following Jesus is learned in the way we love.",
    excerptFr: "« À ceci tous connaîtront que vous êtes mes disciples, si vous avez de l'amour les uns pour les autres. » Suivre Jésus s'incarne dans notre façon d'aimer.",
    teaching: "Jesus does not describe discipleship only as what we know. He gives us a visible way to belong to him: love one another. This love is patient, costly, and practical. It becomes visible in the way we listen, forgive, serve, and remain present.",
    teachingFr: "Jésus ne définit pas la marche chrétienne par un simple savoir intellectuel. Il nous donne un signe distinctif et visible : l'amour fraternel. Un amour patient, exigeant et concret qui se manifeste dans notre capacité à écouter, pardonner, servir et persévérer ensemble.",
    color: "word-card-gold",
    portrait: "/AsketOfficialPic (1).png",
  },
  {
    slug: "honest-lament-in-the-dark",
    title: "Honest lament in the dark",
    titleFr: "La sainte lamentation dans la nuit",
    teacher: "Dr. Esther Laurent",
    teacherSlug: "dr-esther-laurent",
    teacherRole: "Biblical Counselor & Old Testament Scholar",
    teacherRoleFr: "Conseillère biblique & Spécialiste de l'Ancien Testament",
    theologicalSpecialty: "Biblical Lament, Trauma Recovery & Covenant Grace",
    theologicalSpecialtyFr: "Lamentation biblique, guérison intérieure & Grâce de l'Alliance",
    category: "Hope",
    categoryFr: "Espérance",
    duration: "14 min",
    durationFr: "14 min",
    scripture: "Psalm 13:1-2",
    scriptureFr: "Psaume 13:1-2",
    excerpt: "How long, O Lord? Will you forget me forever? Scripture gives us permission to bring our sorrow to God without pious masks.",
    excerptFr: "« Jusqu'à quand, Éternel ! M'oublieras-tu sans cesse ? » Les Écritures nous autorisent à crier notre chagrin à Dieu sans masque de piété feinte.",
    teaching: "Over a third of the Psalms are songs of lament. God never asks us to suppress our tears or offer forced praises when our hearts are crushed. True biblical lament is not despair; it is the courage to address God even when he seems silent, trusting that his steadfast covenant outlasts our darkest night.",
    teachingFr: "Plus d'un tiers des Psaumes sont des chants de lamentation. Dieu ne nous demande jamais d'étouffer nos sanglots ou de lui offrir des louanges feintes quand nos cœurs sont brisés. La sainte lamentation est l'acte de foi ultime : continuer à parler à Dieu dans le noir, confiant que son alliance d'amour est plus profonde que notre nuit.",
    color: "word-card-rose",
    portrait: "/myself.jpeg",
  },
  {
    slug: "the-cost-of-discipleship",
    title: "The cost and joy of the cross",
    titleFr: "Le coût et la joie de la croix",
    teacher: "Pastor Samuel Ndlovu",
    teacherSlug: "pastor-samuel-ndlovu",
    teacherRole: "Church Planter & Expository Preacher",
    teacherRoleFr: "Implantateur d'églises & Prédicateur textuel",
    theologicalSpecialty: "Expository Preaching, Radical Discipleship & Missional Theology",
    theologicalSpecialtyFr: "Prédication textuelle, vie de disciple radicale & Théologie missionnaire",
    category: "Discipleship",
    categoryFr: "Vie chrétienne",
    duration: "16 min",
    durationFr: "16 min",
    scripture: "Luke 9:23",
    scriptureFr: "Luc 9:23",
    excerpt: "If anyone would come after me, let him deny himself and take up his cross daily and follow me. The cross is not an obstacle to life; it is the doorway to it.",
    excerptFr: "« Si quelqu'un veut venir après moi, qu'il renonce à lui-même, qu'il se charge chaque jour de sa croix, et qu'il me suive. » La croix n'est pas un fardeau stérile ; elle est la porte de la vraie vie.",
    teaching: "Dietrich Bonhoeffer famously wrote that when Christ calls a person, he bids them come and die. Yet dying to self is the only way resurrection joy enters our reality. Following Jesus is costly, but wandering without him costs infinitely more. In his presence, the yoke becomes easy and the burden light.",
    teachingFr: "Dietrich Bonhoeffer rappelait que lorsque le Christ appelle un homme, Il lui ordonne de venir et de mourir. Mais mourir à soi-même est la seule manière dont la joie de la résurrection inonde notre existence. Suivre Jésus a un coût, mais vivre sans Lui coûte infiniment plus cher. Avec Lui, le fardeau devient léger.",
    color: "word-card-blue",
    portrait: "/AsketOfficialPic (1).png",
  }
];

export const CUSTOM_TEACHERS_KEY = "lifebook.leadership.teachers.v1";
export const CUSTOM_TEACHINGS_KEY = "lifebook.leadership.teachings.v1";
export const CATALOG_CHANGE_EVENT = "lifebook-catalog-updated";

export function getCustomTeachers(): Teacher[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEACHERS_KEY);
    return raw ? (JSON.parse(raw) as Teacher[]) : [];
  } catch {
    return [];
  }
}

export function getCustomTeachings(): Teaching[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEACHINGS_KEY);
    return raw ? (JSON.parse(raw) as Teaching[]) : [];
  } catch {
    return [];
  }
}

export function getAllTeachers(): Teacher[] {
  const custom = getCustomTeachers();
  const existingSlugs = new Set(teachers.map((t) => t.slug));
  const uniqueCustom = custom.filter((t) => !existingSlugs.has(t.slug));
  return [...teachers, ...uniqueCustom];
}

export function getAllTeachings(): Teaching[] {
  const custom = getCustomTeachings();
  const existingSlugs = new Set(teachings.map((t) => t.slug));
  const uniqueCustom = custom.filter((t) => !existingSlugs.has(t.slug));
  return [...uniqueCustom, ...teachings];
}

export function getTeacherBySlug(slug: string): Teacher | undefined {
  return getAllTeachers().find((t) => t.slug === slug);
}

export function getTeachingsByTeacher(teacherSlug: string): Teaching[] {
  return getAllTeachings().filter((item) => item.teacherSlug === teacherSlug);
}

export function appointPastoralContributor(newTeacher: Teacher): Teacher {
  if (typeof window !== "undefined") {
    try {
      const current = getCustomTeachers().filter((t) => t.slug !== newTeacher.slug);
      const updated = [...current, newTeacher];
      localStorage.setItem(CUSTOM_TEACHERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT));
    } catch {
      // ignore storage errors
    }
  }
  return newTeacher;
}

export function addTeachingToContributor(newTeaching: Teaching): Teaching {
  if (typeof window !== "undefined") {
    try {
      const current = getCustomTeachings().filter((t) => t.slug !== newTeaching.slug);
      const updated = [newTeaching, ...current];
      localStorage.setItem(CUSTOM_TEACHINGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT));
    } catch {
      // ignore storage errors
    }
  }
  return newTeaching;
}

export function removeCustomTeaching(slug: string): void {
  if (typeof window !== "undefined") {
    try {
      const current = getCustomTeachings().filter((t) => t.slug !== slug);
      localStorage.setItem(CUSTOM_TEACHINGS_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }
}

export interface TeachingPerformanceMetrics {
  slug: string;
  listenCount: number;
  completedCount: number;
  completionRate: number;
  avgListenMinutes: number;
}

export interface TeacherPerformanceSummary {
  teacherSlug: string;
  teacherName: string;
  publishedCount: number;
  totalListens: number;
  totalCompletions: number;
  avgCompletionRate: number;
  topTeachingTitle: string;
  topTeachingTitleFr: string;
  topTeachingListens: number;
  teachingsBreakdown: Array<{
    teaching: Teaching;
    metrics: TeachingPerformanceMetrics;
  }>;
}

export const TEACHING_ANALYTICS_KEY = "lifebook.teaching.analytics.v1";

const DEFAULT_TEACHING_METRICS: Record<
  string,
  { listenCount: number; completedCount: number; avgListenMinutes: number }
> = {
  "when-faith-feels-small": {
    listenCount: 1840,
    completedCount: 1619,
    avgListenMinutes: 10.8,
  },
  "mercy-of-a-new-morning": {
    listenCount: 1520,
    completedCount: 1307,
    avgListenMinutes: 13.2,
  },
  "learning-to-be-still": {
    listenCount: 2190,
    completedCount: 2015,
    avgListenMinutes: 8.4,
  },
  "a-life-shaped-by-love": {
    listenCount: 1385,
    completedCount: 1136,
    avgListenMinutes: 15.1,
  },
  "the-cost-of-discipleship": {
    listenCount: 1265,
    completedCount: 1063,
    avgListenMinutes: 13.9,
  },
  "honest-lament-in-the-dark": {
    listenCount: 1675,
    completedCount: 1491,
    avgListenMinutes: 12.6,
  },
};

function getStoredAnalyticsOverrides(): Record<
  string,
  { listenCount: number; completedCount: number; avgListenMinutes?: number }
> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TEACHING_ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getTeachingMetrics(slug: string, durationStr = "12 min"): TeachingPerformanceMetrics {
  const overrides = getStoredAnalyticsOverrides();
  const base = DEFAULT_TEACHING_METRICS[slug] || {
    listenCount: 142,
    completedCount: 124,
    avgListenMinutes: parseInt(durationStr, 10) ? Math.round(parseInt(durationStr, 10) * 0.88 * 10) / 10 : 10.5,
  };
  const custom = overrides[slug];
  const listenCount = custom ? custom.listenCount : base.listenCount;
  const completedCount = custom ? custom.completedCount : base.completedCount;
  const completionRate =
    listenCount > 0 ? Math.min(100, Math.round((completedCount / listenCount) * 100)) : 0;

  return {
    slug,
    listenCount,
    completedCount,
    completionRate,
    avgListenMinutes: custom?.avgListenMinutes ?? base.avgListenMinutes,
  };
}

export function recordTeachingListen(slug: string, completed = false): void {
  if (typeof window === "undefined") return;
  try {
    const overrides = getStoredAnalyticsOverrides();
    const current = getTeachingMetrics(slug);
    const nextListens = completed ? current.listenCount : current.listenCount + 1;
    const nextCompleted = completed
      ? Math.min(nextListens, current.completedCount + 1)
      : current.completedCount + 1; // Optimistic engaged session completion

    overrides[slug] = {
      listenCount: nextListens,
      completedCount: Math.min(nextListens, nextCompleted),
      avgListenMinutes: current.avgListenMinutes,
    };
    localStorage.setItem(TEACHING_ANALYTICS_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function getTeacherPerformanceSummary(teacherSlug: string): TeacherPerformanceSummary {
  const teacher = getTeacherBySlug(teacherSlug);
  const teacherTeachings = getTeachingsByTeacher(teacherSlug);
  const breakdown = teacherTeachings.map((t) => ({
    teaching: t,
    metrics: getTeachingMetrics(t.slug, t.duration),
  }));

  const totalListens = breakdown.reduce((sum, item) => sum + item.metrics.listenCount, 0);
  const totalCompletions = breakdown.reduce((sum, item) => sum + item.metrics.completedCount, 0);
  const avgCompletionRate =
    totalListens > 0 ? Math.min(100, Math.round((totalCompletions / totalListens) * 100)) : 0;

  const sortedByListens = [...breakdown].sort(
    (a, b) => b.metrics.listenCount - a.metrics.listenCount
  );
  const top = sortedByListens[0];

  return {
    teacherSlug,
    teacherName: teacher?.name || teacherSlug,
    publishedCount: teacherTeachings.length,
    totalListens,
    totalCompletions,
    avgCompletionRate,
    topTeachingTitle: top?.teaching.title || "—",
    topTeachingTitleFr: top?.teaching.titleFr || "—",
    topTeachingListens: top?.metrics.listenCount || 0,
    teachingsBreakdown: breakdown,
  };
}


