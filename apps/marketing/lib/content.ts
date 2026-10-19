// Every claim here describes what LifeBook does today, or is labelled as a pilot or as coming.
// Scripture is quoted exactly from the translations the app uses, with attribution.
// In section titles, *words* are set in the italic Scripture serif (see components/accent.tsx).

export type Locale = 'en' | 'fr';

const en = {
  meta: { title: 'LifeBook — A quiet daily time with God', description: 'One Bible passage a day and five quiet steps to take it in: understand, be still, reflect, pray and live it. In English and French, with a private prayer journal and no streaks.' },
  nav: { how: 'How it works', inside: 'What’s inside', ease: 'Easy to use', promises: 'Our promises', faq: 'Questions', signIn: 'Sign in', start: 'Get started', menu: 'Menu', close: 'Close menu', other: 'Français', otherHref: '/fr', otherLang: 'fr' },
  hero: {
    eyebrow: 'Daily Scripture and prayer',
    title: 'A quiet *daily time* with God.',
    lead: 'Each day LifeBook gives you one passage and walks you through it, one screen at a time: understand it, be still with it, write what it stirs, pray, and carry it into your day.',
    primary: 'Begin today', secondary: 'See how it works',
    note: 'English and French · Works in any browser',
  },
  preview: {
    label: 'The LifeBook prayer time screen',
    step: 'Understand', verse: 'Thy word is a lamp unto my feet, and a light unto my path.', reference: 'Psalm 119:105', translation: 'King James Version',
    back: 'Back', next: 'Continue',
    stillStep: 'Meditate', stillTitle: 'Be still for a moment.', breathe: 'Breathe out', time: '1:12',
  },
  how: {
    eyebrow: 'How it works', title: 'One passage. *Five quiet steps.*',
    lead: 'Choose two, five or ten minutes. LifeBook shows one step at a time so nothing else competes for your attention.',
    steps: [
      ['Understand', 'Read the passage in large, unhurried type with a short note on what it means.'],
      ['Be still', 'A breathing pace for a minute or a few. An optional soft chime tells you when it ends.'],
      ['Reflect', 'One honest question, and a private place to write your answer.'],
      ['Pray', 'Pray in your own words, or with a short prayer to start you off.'],
      ['Live it', 'One small, practical way to carry the passage into your day.'],
    ] as [string, string][],
  },
  screens: {
    note: 'Screens from LifeBook on a phone. It works in your phone’s browser today; the iPhone and Android apps are in development.',
    date: 'Sunday 18 October', greet: 'Good morning', todayWord: 'Today’s Word', about: 'About 5 min', begin: 'Begin prayer time', week: 'Your week in the Word', days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], weekLine: '3 days with the Word this week.',
    tabs: ['Today', 'Bible', 'Prayer', 'You'], steps: ['Understand', 'Meditate', 'Reflect', 'Pray', 'Live the Word'],
    verse: 'But be ye doers of the word, and not hearers only, deceiving your own selves.', ref: 'James 1:22', translation: 'King James Version',
    explanation: 'James challenges believers to connect hearing with obedience. Genuine listening produces a response in daily life.',
    stillTitle: 'Be still for a moment.', breathe: 'Breathe in', clock: '1:12',
    question: 'What have I heard in Scripture that I still need to practice?', reflection: 'To listen to my brother before I answer him.', reflectHint: 'Saved privately when you continue.',
    prayTitle: 'Pray, in your own words or with these.', prayer: 'Lord, help me respond to your Word with action. Amen.',
    liveTitle: 'Carry it into today.', application: 'Put one biblical teaching into practice today.',
    back: 'Back', next: 'Continue', amen: 'Amen', finish: 'Finish',
    bookTitle: 'John 1', book: 'John', bibleVerses: [['1', 'In the beginning was the Word, and the Word was with God, and the Word was God.'], ['2', 'The same was in the beginning with God.'], ['3', 'All things were made by him; and without him was not any thing made that was made.']] as [string, string][],
    journal: { title: 'Prayer', write: 'Write a prayer', lock: 'Encrypted', placeholder: 'Heavenly Father, today I want to bring before You…', save: 'Save prayer', heading: 'YOUR JOURNAL', answered: 'Answered',
      items: [['For Mum’s recovery', 'Lord, thank you for the doctors caring for her. Give her rest tonight.', '16 Oct', ''], ['Peace before the exam', 'Help me to study well, and to trust you with the result.', '14 Oct', ''], ['A new job for Kofi', 'You opened a door this week. Thank you.', '2 Oct', 'answered']] as [string, string, string, string][] },
    pastor: { title: 'Ask a pastor', pilot: 'Pilot', who: 'One verified pastor will read your request: the first available pastor who speaks your language.', when: 'Pastors usually reply within 24 hours. They are volunteers, not counsellors.', message: 'Your message', sample: 'I lost my father last month and I find it hard to pray. Could someone pray with me?', reach: 'How should the pastor reach you?', messages: 'Private messages', call: 'And a phone call', send: 'Ask a pastor' },
    aa: 'Reading settings', done: 'Done', bibleLanguage: 'Bible language', textSize: 'Text size', spacing: 'Line spacing', standard: 'Standard', airy: 'Airy',
    dark: { date: 'dimanche 18 octobre', greet: 'Bonjour', todayWord: 'Parole du jour', about: 'Environ 5 min', begin: 'Commencer le temps de prière', verse: 'Mais mettez la parole en pratique, et ne l’écoutez pas seulement, vous séduisant vous-mêmes.', ref: 'Jacques 1:22', translation: 'Bible J.N. Darby', tabs: ['Aujourd’hui', 'Bible', 'Prière', 'Vous'] },
  },
  ease: {
    eyebrow: 'Made to be easy', title: 'Easy on the eyes. *Easy to come back to.*',
    lead: 'LifeBook is built for a few honest minutes, not for keeping you scrolling.',
    points: [
      ['One thing per screen', 'No feed, no badges, nothing competing for your attention while you pray.'],
      ['Text you can read', 'Four text sizes, airy spacing, serif or sans. Scripture always gets room to breathe.'],
      ['Your language, your light', 'English or French, light or dark. It follows your phone, or your choice.'],
      ['Pick up where you left off', 'The Bible opens at your last chapter, and today’s prayer time resumes at the step you reached.'],
      ['Gentle on purpose', 'No streaks to protect. A missed day is simply an empty circle.'],
      ['Made for everyone', 'Large tap targets, screen-reader labels, and calmer motion when your phone asks for it.'],
    ] as [string, string][],
    captions: ['Reading settings, one tap away.', 'Dark mode, in French.'],
  },
  inside: {
    eyebrow: 'What’s inside', title: 'Everything here serves the *time you spend with God.*',
    cards: {
      daily: { title: 'Daily Word', text: 'A new passage every day, and a gentle look back at your week. A missed day is simply an empty circle.' },
      bible: { title: 'The Bible, in English and French', text: 'Read any book at your own pace, pick up where you left off, follow a reading plan, and keep private notes. Set the text size and spacing that suit your eyes.' },
      prayer: { title: 'A private prayer journal', text: 'Write what is on your heart. Prayers are saved encrypted to your account, and you can mark answered prayers or delete them at any time.' },
      pastor: { title: 'Ask a pastor', badge: 'Pilot', text: 'When you would like someone to pray with you, a verified pastor can listen and reply privately. We are starting with a small group of pastors.' },
    },
  },
  promises: {
    eyebrow: 'Our promises', title: 'Built to be *gentle.*',
    items: [
      ['No streaks, no scores.', 'Faith is not a performance. LifeBook never counts days against you or rates your spiritual life.'],
      ['Scripture, untouched.', 'Every verse is quoted from a named translation and never paraphrased, shortened or written by AI.'],
      ['Your prayers stay yours.', 'They are encrypted, never used to build a picture of your faith, and you can delete them whenever you like.'],
      ['Not a replacement for people.', 'LifeBook points you to your church and to trusted care, and to local helplines if you or someone you pray for may be in danger.'],
    ] as [string, string][],
  },
  verse: { text: 'Thy word is a lamp unto my feet, and a light unto my path.', reference: 'Psalm 119:105', translation: 'King James Version' },
  faq: {
    eyebrow: 'Questions', title: 'Good to know.',
    items: [
      ['Is LifeBook for someone new to faith?', 'Yes. Each step is explained as you go, and you choose what you want to learn. LifeBook is for people exploring faith as much as for those who have followed Jesus for years.'],
      ['How much time does it take?', 'You choose two, five or ten minutes for the daily prayer time. You can also read the five steps on one page at your own pace.'],
      ['Who can read my prayers and reflections?', 'They are stored encrypted and linked to your account only. They are not shared, sold or used to profile you, and you can delete them one by one or all at once.'],
      ['Does LifeBook use AI?', 'Not for Scripture. A guided meditation on one of your prayers will be offered only when you ask for it, after pastoral review. It chooses passages from a reviewed list, and if a prayer suggests someone may be in danger, it shows helplines instead.'],
      ['Which languages and devices?', 'English and French. LifeBook works in the browser on any phone or computer. iPhone and Android apps are in development.'],
      ['Does it replace my church?', 'No. LifeBook is a companion for personal time with God, not a substitute for a church community, pastoral care or professional help.'],
    ] as [string, string][],
  },
  cta: { title: 'Make room for *the Word* today.', text: 'One passage, a few quiet minutes, and space to respond.', button: 'Begin today', open: 'Open LifeBook' },
  footer: { tagline: 'A quiet daily time with God, in Scripture and prayer.', explore: 'Explore', about: 'LifeBook', privacy: 'Privacy', terms: 'Terms', contact: 'Contact', rights: 'All rights reserved.', scripture: 'Scripture quotations: King James Version and J.N. Darby (public domain).' },
  skip: 'Skip to content',
};

export type Content = typeof en;

const fr: Content = {
  meta: { title: 'LifeBook — Un temps calme avec Dieu, chaque jour', description: 'Un passage biblique par jour et cinq étapes paisibles pour l’accueillir : comprendre, faire silence, réfléchir, prier et le vivre. En français et en anglais, avec un journal de prière privé et sans séries à tenir.' },
  nav: { how: 'Comment ça marche', inside: 'Ce qu’on y trouve', ease: 'Simple', promises: 'Nos engagements', faq: 'Questions', signIn: 'Se connecter', start: 'Commencer', menu: 'Menu', close: 'Fermer le menu', other: 'English', otherHref: '/', otherLang: 'en' },
  hero: {
    eyebrow: 'La Parole et la prière au quotidien',
    title: 'Un temps *calme* avec Dieu, chaque jour.',
    lead: 'Chaque jour, LifeBook vous propose un passage et vous accompagne, un écran à la fois : le comprendre, faire silence, écrire ce qu’il éveille en vous, prier, puis l’emporter dans votre journée.',
    primary: 'Commencer aujourd’hui', secondary: 'Voir comment ça marche',
    note: 'Français et anglais · Dans tout navigateur',
  },
  preview: {
    label: 'L’écran du temps de prière LifeBook',
    step: 'Comprendre', verse: 'Ta parole est une lampe à mon pied, et une lumière à mon sentier.', reference: 'Psaume 119:105', translation: 'Bible J.N. Darby',
    back: 'Retour', next: 'Continuer',
    stillStep: 'Méditer', stillTitle: 'Faites silence un instant.', breathe: 'Expirez', time: '1:12',
  },
  how: {
    eyebrow: 'Comment ça marche', title: 'Un passage. *Cinq étapes paisibles.*',
    lead: 'Choisissez deux, cinq ou dix minutes. LifeBook affiche une étape à la fois, pour que rien d’autre ne vous distraie.',
    steps: [
      ['Comprendre', 'Lisez le passage en grands caractères, avec une courte note sur son sens.'],
      ['Faire silence', 'Un rythme de respiration, le temps d’une minute ou plus. Un carillon discret, si vous le souhaitez, en marque la fin.'],
      ['Réfléchir', 'Une question sincère, et un espace privé pour y répondre.'],
      ['Prier', 'Priez avec vos mots, ou avec une courte prière pour commencer.'],
      ['Le vivre', 'Un geste simple et concret pour emporter le passage dans votre journée.'],
    ],
  },
  screens: {
    note: 'Écrans de LifeBook sur téléphone. Il fonctionne dès aujourd’hui dans le navigateur de votre téléphone ; les applications iPhone et Android sont en préparation.',
    date: 'dimanche 18 octobre', greet: 'Bonjour', todayWord: 'Parole du jour', about: 'Environ 5 min', begin: 'Commencer le temps de prière', week: 'Votre semaine dans la Parole', days: ['L', 'M', 'M', 'J', 'V', 'S', 'D'], weekLine: '3 jours avec la Parole cette semaine.',
    tabs: ['Aujourd’hui', 'Bible', 'Prière', 'Vous'], steps: ['Comprendre', 'Méditer', 'Réfléchir', 'Prier', 'Vivre la Parole'],
    verse: 'Mais mettez la parole en pratique, et ne l’écoutez pas seulement, vous séduisant vous-mêmes.', ref: 'Jacques 1:22', translation: 'Bible J.N. Darby',
    explanation: 'Jacques invite les croyants à unir écoute et obéissance. Une écoute sincère se traduit par des actes au quotidien.',
    stillTitle: 'Faites silence un instant.', breathe: 'Inspirez', clock: '1:12',
    question: 'Quelle parole entendue dois-je encore mettre en pratique ?', reflection: 'Écouter mon frère avant de lui répondre.', reflectHint: 'Enregistrée en privé quand vous continuez.',
    prayTitle: 'Priez avec vos mots, ou avec ceux-ci.', prayer: 'Seigneur, aide-moi à répondre à ta Parole par des actes. Amen.',
    liveTitle: 'Emportez-la dans votre journée.', application: 'Mettez un enseignement biblique en pratique aujourd’hui.',
    back: 'Retour', next: 'Continuer', amen: 'Amen', finish: 'Terminer',
    bookTitle: 'Jean 1', book: 'Jean', bibleVerses: [['1', 'Au commencement était la Parole\u202f; et la Parole était auprès de Dieu\u202f; et la Parole était Dieu.'], ['2', 'Elle était au commencement auprès de Dieu.'], ['3', 'Toutes choses furent faites par elle, et sans elle pas une seule chose ne fut faite de ce qui a été fait.']],
    journal: { title: 'Prière', write: 'Écrire une prière', lock: 'Chiffré', placeholder: 'Père céleste, aujourd’hui je souhaite te confier…', save: 'Enregistrer la prière', heading: 'VOTRE JOURNAL', answered: 'Exaucée',
      items: [['Pour la guérison de maman', 'Seigneur, merci pour les médecins qui prennent soin d’elle. Donne-lui du repos cette nuit.', '16 oct.', ''], ['La paix avant l’examen', 'Aide-moi à bien étudier, et à te confier le résultat.', '14 oct.', ''], ['Un nouveau travail pour Kofi', 'Tu as ouvert une porte cette semaine. Merci.', '2 oct.', 'answered']] },
    pastor: { title: 'Demander un pasteur', pilot: 'Pilote', who: 'Un seul pasteur vérifié lira votre demande : le premier disponible qui parle votre langue.', when: 'Les pasteurs répondent en général sous 24 heures. Ce sont des bénévoles, pas des thérapeutes.', message: 'Votre message', sample: 'J’ai perdu mon père le mois dernier et j’ai du mal à prier. Quelqu’un pourrait-il prier avec moi ?', reach: 'Comment le pasteur peut-il vous joindre ?', messages: 'Messages privés', call: 'Et un appel', send: 'Demander un pasteur' },
    aa: 'Réglages de lecture', done: 'OK', bibleLanguage: 'Langue de la Bible', textSize: 'Taille du texte', spacing: 'Interligne', standard: 'Standard', airy: 'Aéré',
    dark: { date: 'Sunday 18 October', greet: 'Good evening', todayWord: 'Today’s Word', about: 'About 5 min', begin: 'Begin prayer time', verse: 'But be ye doers of the word, and not hearers only, deceiving your own selves.', ref: 'James 1:22', translation: 'King James Version', tabs: ['Today', 'Bible', 'Prayer', 'You'] },
  },
  ease: {
    eyebrow: 'Pensé pour être simple', title: 'Doux pour les yeux. *Facile à retrouver.*',
    lead: 'LifeBook est fait pour quelques minutes sincères, pas pour vous faire défiler sans fin.',
    points: [
      ['Une chose par écran', 'Ni fil d’actualité, ni pastilles, rien ne vous distrait pendant que vous priez.'],
      ['Un texte lisible', 'Quatre tailles, un interligne aéré, avec ou sans empattement. La Parole a toujours de la place.'],
      ['Votre langue, votre lumière', 'Français ou anglais, clair ou sombre. Comme votre téléphone, ou selon votre choix.'],
      ['Reprenez où vous en étiez', 'La Bible s’ouvre à votre dernier chapitre, et le temps de prière reprend à l’étape atteinte.'],
      ['Doux à dessein', 'Aucune série à préserver. Un jour manqué n’est qu’un cercle vide.'],
      ['Pour tout le monde', 'De grandes zones à toucher, des libellés pour lecteurs d’écran, et des animations apaisées quand votre téléphone le demande.'],
    ],
    captions: ['Les réglages de lecture, à portée de doigt.', 'Le mode sombre, en anglais.'],
  },
  inside: {
    eyebrow: 'Ce qu’on y trouve', title: 'Tout ici sert le *temps que vous passez avec Dieu.*',
    cards: {
      daily: { title: 'La Parole du jour', text: 'Un nouveau passage chaque jour, et un regard doux sur votre semaine. Un jour manqué n’est qu’un cercle vide.' },
      bible: { title: 'La Bible, en français et en anglais', text: 'Lisez à votre rythme, reprenez là où vous en étiez, suivez un plan de lecture et gardez des notes privées. Choisissez la taille du texte et l’interligne qui vous conviennent.' },
      prayer: { title: 'Un journal de prière privé', text: 'Écrivez ce qui vous tient à cœur. Vos prières sont enregistrées chiffrées sur votre compte ; vous pouvez noter celles qui sont exaucées ou les supprimer à tout moment.' },
      pastor: { title: 'Demander un pasteur', badge: 'Pilote', text: 'Quand vous souhaitez que quelqu’un prie avec vous, un pasteur vérifié peut vous écouter et vous répondre en privé. Nous commençons avec un petit groupe de pasteurs.' },
    },
  },
  promises: {
    eyebrow: 'Nos engagements', title: 'Pensé pour être *doux.*',
    items: [
      ['Ni séries, ni scores.', 'La foi n’est pas une performance. LifeBook ne compte jamais vos jours contre vous et n’évalue pas votre vie spirituelle.'],
      ['La Parole, intacte.', 'Chaque verset est cité d’une traduction nommée, jamais paraphrasé, raccourci ou écrit par une IA.'],
      ['Vos prières vous appartiennent.', 'Elles sont chiffrées, ne servent jamais à dresser un portrait de votre foi, et vous pouvez les supprimer quand vous le voulez.'],
      ['Pas un substitut aux personnes.', 'LifeBook vous renvoie vers votre Église, vers un accompagnement de confiance, et vers les lignes d’écoute locales si vous, ou quelqu’un pour qui vous priez, êtes en danger.'],
    ],
  },
  verse: { text: 'Ta parole est une lampe à mon pied, et une lumière à mon sentier.', reference: 'Psaume 119:105', translation: 'Bible J.N. Darby' },
  faq: {
    eyebrow: 'Questions', title: 'Bon à savoir.',
    items: [
      ['LifeBook convient-il à quelqu’un qui découvre la foi ?', 'Oui. Chaque étape est expliquée au fil du parcours, et vous choisissez ce que vous souhaitez apprendre. LifeBook s’adresse autant à ceux qui découvrent la foi qu’à ceux qui suivent Jésus depuis des années.'],
      ['Combien de temps cela prend-il ?', 'Vous choisissez deux, cinq ou dix minutes pour le temps de prière quotidien. Vous pouvez aussi lire les cinq étapes sur une seule page, à votre rythme.'],
      ['Qui peut lire mes prières et mes réflexions ?', 'Elles sont stockées chiffrées et liées à votre seul compte. Elles ne sont ni partagées, ni vendues, ni utilisées pour vous profiler, et vous pouvez les supprimer une par une ou toutes à la fois.'],
      ['LifeBook utilise-t-il l’IA ?', 'Pas pour la Parole. Une méditation guidée sur l’une de vos prières sera proposée seulement si vous la demandez, après relecture pastorale. Elle choisit des passages dans une liste relue, et si une prière laisse penser que quelqu’un est en danger, elle affiche des lignes d’écoute.'],
      ['Quelles langues et quels appareils ?', 'Le français et l’anglais. LifeBook fonctionne dans le navigateur de tout téléphone ou ordinateur. Les applications iPhone et Android sont en préparation.'],
      ['Est-ce que cela remplace mon Église ?', 'Non. LifeBook accompagne votre temps personnel avec Dieu ; il ne remplace ni une communauté d’Église, ni un accompagnement pastoral, ni une aide professionnelle.'],
    ],
  },
  cta: { title: 'Faites de la place à *la Parole* aujourd’hui.', text: 'Un passage, quelques minutes de calme, et un espace pour répondre.', button: 'Commencer aujourd’hui', open: 'Ouvrir LifeBook' },
  footer: { tagline: 'Un temps calme avec Dieu, chaque jour, dans la Parole et la prière.', explore: 'Découvrir', about: 'LifeBook', privacy: 'Confidentialité', terms: 'Conditions', contact: 'Contact', rights: 'Tous droits réservés.', scripture: 'Citations bibliques : King James Version et Bible J.N. Darby (domaine public).' },
  skip: 'Aller au contenu',
};

export const content: Record<Locale, Content> = { en, fr };
