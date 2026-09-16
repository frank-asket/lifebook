export type Teaching = {
  slug: string;
  title: string;
  titleFr: string;
  teacher: string;
  teacherRole: string;
  teacherRoleFr: string;
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

export const teachings: Teaching[] = [
  {
    slug: "when-faith-feels-small",
    title: "When faith feels small",
    titleFr: "Quand la foi semble petite",
    teacher: "Pastor Asket",
    teacherRole: "LifeBook teaching contributor",
    teacherRoleFr: "Contributeur d'enseignement LifeBook",
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
    teacher: "Pastor Asket",
    teacherRole: "LifeBook teaching contributor",
    teacherRoleFr: "Contributeur d'enseignement LifeBook",
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
    teacherRole: "LifeBook teaching contributor",
    teacherRoleFr: "Contributeur d'enseignement LifeBook",
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
    teacher: "Pastor Asket",
    teacherRole: "LifeBook teaching contributor",
    teacherRoleFr: "Contributeur d'enseignement LifeBook",
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
    portrait: "/myself.jpeg",
  },
];
