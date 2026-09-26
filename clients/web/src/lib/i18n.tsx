"use client";

import React, { createContext, useContext, useSyncExternalStore, useEffect, ReactNode } from "react";

export type Language = "en" | "fr";

export interface Translations {
  // Navigation
  nav_daily_practice: string;
  nav_how_it_works: string;
  nav_journeys: string;
  nav_voice_search: string;
  nav_audio_teachings: string;
  nav_my_progress: string;
  nav_faq: string;
  nav_sign_in: string;
  nav_sign_out: string;
  nav_start_devotion: string;
  nav_menu: string;
  nav_close: string;
  nav_switch_lang: string;
  nav_lang_en: string;
  nav_lang_fr: string;
  theme_toggle_label: string;
  theme_light: string;
  theme_dark: string;
  theme_night_reading: string;

  // Mobile menu headers
  mobile_nav_devotion: string;
  mobile_nav_scripture_audio: string;
  mobile_nav_community_help: string;

  // Hero Section
  hero_eyebrow: string;
  hero_title_part1: string;
  hero_title_em: string;
  hero_title_part2: string;
  hero_desc: string;
  hero_cta_start: string;
  hero_cta_explore: string;
  hero_rating_note: string;
  hero_scroll: string;

  // Phone preview
  preview_greeting: string;
  preview_today_devotion: string;
  preview_tab_today: string;
  preview_tab_journeys: string;
  preview_tab_journal: string;
  preview_streak_title: string;
  preview_streak_sub: string;
  preview_streak_grace: string;
  preview_scripture_label: string;

  // Moods
  mood_peaceful: string;
  mood_peaceful_desc: string;
  mood_seeking: string;
  mood_seeking_desc: string;
  mood_grateful: string;
  mood_grateful_desc: string;
  mood_questions: string;
  mood_questions_desc: string;

  // Mood scripture verses
  mood_peace_quote: string;
  mood_peace_ref: string;
  mood_seek_quote: string;
  mood_seek_ref: string;
  mood_grateful_quote: string;
  mood_grateful_ref: string;
  mood_doubt_quote: string;
  mood_doubt_ref: string;

  // Benefits
  benefits_heading: string;
  benefits_sub: string;
  benefit_1_title: string;
  benefit_1_desc: string;
  benefit_2_title: string;
  benefit_2_desc: string;
  benefit_3_title: string;
  benefit_3_desc: string;

  // How it works
  how_eyebrow: string;
  how_heading: string;
  how_sub: string;
  step_1_title: string;
  step_1_desc: string;
  step_2_title: string;
  step_2_desc: string;
  step_3_title: string;
  step_3_desc: string;
  step_1_card_label: string;
  step_1_card_quote: string;
  step_1_card_ref: string;
  step_2_card_label: string;
  step_2_card_quote: string;
  step_2_card_ref: string;
  step_3_card_label: string;
  step_3_card_quote: string;
  step_3_card_ref: string;
  phase_read: string;
  phase_reflect: string;
  phase_pray: string;

  // Journeys
  journeys_eyebrow: string;
  journeys_heading: string;
  journeys_sub: string;
  journey_1_title: string;
  journey_1_desc: string;
  journey_2_title: string;
  journey_2_desc: string;
  journey_3_title: string;
  journey_3_desc: string;
  journey_4_title: string;
  journey_4_desc: string;
  journey_5_title: string;
  journey_5_desc: string;
  journey_card_tag: string;
  journey_start_cta: string;

  // Audio / LivingWord
  audio_eyebrow: string;
  audio_heading: string;
  audio_desc: string;
  audio_point1_bold: string;
  audio_point1_text: string;
  audio_point2_bold: string;
  audio_point2_text: string;
  audio_point3_bold: string;
  audio_point3_text: string;
  audio_cat_all: string;
  audio_cat_faith: string;
  audio_cat_prayer: string;
  audio_cat_hope: string;
  audio_cat_discipleship: string;
  audio_curated: string;
  audio_read_study: string;

  // Voice Search
  voice_eyebrow: string;
  voice_heading: string;
  voice_desc: string;
  voice_tap_prompt: string;
  voice_listening: string;
  voice_thinking: string;
  voice_save_reflection: string;
  voice_saved: string;
  voice_chip_anxiety: string;
  voice_chip_wisdom: string;
  voice_chip_gratitude: string;
  voice_chip_grief: string;

  // FAQ
  faq_eyebrow: string;
  faq_heading: string;
  faq_q1: string;
  faq_a1: string;
  faq_q2: string;
  faq_a2: string;
  faq_q3: string;
  faq_a3: string;
  faq_q4: string;
  faq_a4: string;
  faq_q5: string;
  faq_a5: string;

  // Email CTA
  cta_eyebrow: string;
  cta_heading: string;
  cta_desc: string;
  cta_placeholder: string;
  cta_button: string;
  cta_success: string;
  cta_note: string;

  // Footer
  footer_tagline: string;
  footer_copyright: string;
  footer_privacy: string;
  footer_terms: string;
  footer_back_to_top: string;
}

const translations: Record<Language, Translations> = {
  en: {
    nav_daily_practice: "Daily Practice",
    nav_how_it_works: "How It Works",
    nav_journeys: "5-Day Studies",
    nav_voice_search: "Voice Search",
    nav_audio_teachings: "Audio Teachings",
    nav_my_progress: "My Progress",
    nav_faq: "FAQ",
    nav_sign_in: "Sign in",
    nav_sign_out: "Sign out",
    nav_start_devotion: "Start 5-minute devotion",
    nav_menu: "Menu",
    nav_close: "Close",
    nav_switch_lang: "Switch language",
    nav_lang_en: "EN",
    nav_lang_fr: "FR",
    theme_toggle_label: "Theme",
    theme_light: "Light",
    theme_dark: "Night (HC)",
    theme_night_reading: "Night Reading",

    mobile_nav_devotion: "Daily Devotion",
    mobile_nav_scripture_audio: "Scripture & Audio",
    mobile_nav_community_help: "Community & Help",

    hero_eyebrow: "Daily 5-minute quiet time",
    hero_title_part1: "Start your morning anchored in ",
    hero_title_em: "Scripture",
    hero_title_part2: ", not scrolling.",
    hero_desc: "Build a life-changing daily Bible and prayer habit before your day gets noisy. Five minutes of curated Scripture, honest reflection, and private prayer — built for busy Christians.",
    hero_cta_start: "Start 5-minute devotion",
    hero_cta_explore: "Explore 5-day journeys",
    hero_rating_note: "from 1,200+ believers who replaced morning scrolling with quiet time",
    hero_scroll: "See how it works",

    preview_greeting: "Good morning",
    preview_today_devotion: "Today's 5-minute devotion",
    preview_tab_today: "Today",
    preview_tab_journeys: "Journeys",
    preview_tab_journal: "Journal",
    preview_streak_title: "Daily Streak",
    preview_streak_sub: "5 of 7 days completed this week",
    preview_streak_grace: "Grace protection active",
    preview_scripture_label: "Today's Scripture",

    mood_peaceful: "Peaceful",
    mood_peaceful_desc: "Anchor in God's rest",
    mood_seeking: "Seeking",
    mood_seeking_desc: "Wisdom for decisions",
    mood_grateful: "Grateful",
    mood_grateful_desc: "Give thanks today",
    mood_questions: "Questions",
    mood_questions_desc: "Bring honest burdens",

    mood_peace_quote: "“The Lord is my shepherd; I shall not want.”",
    mood_peace_ref: "Psalm 23:1 (ESV)",
    mood_seek_quote: "“If any of you lacks wisdom, you should ask God, who gives generously.”",
    mood_seek_ref: "James 1:5 (ESV)",
    mood_grateful_quote: "“Give thanks in all circumstances; for this is God's will in Christ.”",
    mood_grateful_ref: "1 Thessalonians 5:18 (ESV)",
    mood_doubt_quote: "“Cast all your anxiety on him because he cares for you.”",
    mood_doubt_ref: "1 Peter 5:7 (ESV)",

    benefits_heading: "A morning rhythm you can actually keep.",
    benefits_sub: "Most devotionals ask for an hour you don't have. LifeBook fits your real life with Scripture, reflection, and prayer in 5 intentional minutes.",
    benefit_1_title: "5 Minutes",
    benefit_1_desc: "Curated for depth, not length. One key passage, three reflection questions, and a 60-second guided prayer.",
    benefit_2_title: "Built for Grace",
    benefit_2_desc: "Missed a day? Your streak never shames you. Built-in Sabbath rest and grace protection keep you moving forward.",
    benefit_3_title: "Private by Design",
    benefit_3_desc: "Your prayers and journal entries stay on your device. No social feeds, no public metrics, no performance anxiety.",

    how_eyebrow: "The 5-Minute Morning Routine",
    how_heading: "Three minutes to reflect. One to read. One to pray.",
    how_sub: "Three straightforward steps designed to give you clarity and peace before your workday begins.",
    step_1_title: "Read today's Scripture",
    step_1_desc: "One carefully selected passage with zero filler. Read slowly and let God's word sink in.",
    step_2_title: "Answer 3 reflection prompts",
    step_2_desc: "Prompts grounded in Scripture that connect the passage to your real work, family, and inner thoughts.",
    step_3_title: "Record a 60-second prayer",
    step_3_desc: "Close your quiet time with an honest prayer stored privately on your device.",
    step_1_card_label: "Step 01 / 03 · Read",
    step_1_card_quote: "He restores\nmy soul.",
    step_1_card_ref: "Psalm 23:3 (ESV)",
    step_2_card_label: "Step 02 / 03 · Reflect",
    step_2_card_quote: "Where do you need\nGod's peace today?",
    step_2_card_ref: "Prompt 01 of 03",
    step_3_card_label: "Step 03 / 03 · Pray",
    step_3_card_quote: "“Lord, guide my steps\nand quiet my worry.”",
    step_3_card_ref: "Saved securely on device",
    phase_read: "Read (90s)",
    phase_reflect: "Reflect (2m)",
    phase_pray: "Pray (60s)",

    journeys_eyebrow: "5-Day Topical Journeys",
    journeys_heading: "Focus on what you need most this week.",
    journeys_sub: "Choose a 5-day topical journey designed for specific seasons of life. Each day takes just 5 minutes.",
    journey_1_title: "Anxiety & Peace",
    journey_1_desc: "Five days of anchoring in God's promises when your mind won't quiet down.",
    journey_2_title: "Walking in Wisdom",
    journey_2_desc: "Proverbs and James applied to difficult work and family decisions.",
    journey_3_title: "Cultivating Gratitude",
    journey_3_desc: "Train your heart to notice God's faithfulness even in demanding seasons.",
    journey_4_title: "Restoring Hope",
    journey_4_desc: "When you feel worn down, rediscover God's gentle, steady presence.",
    journey_5_title: "Morning Surrender",
    journey_5_desc: "Hand over your calendar, your worries, and your ambitions before 8 AM.",
    journey_card_tag: "5-Day Plan",
    journey_start_cta: "Begin study",

    audio_eyebrow: "Audio Bible Teachings",
    audio_heading: "Listen to 10-minute audio teachings on your commute.",
    audio_desc: "Stream verse-by-verse audio lessons on faith, prayer, hope, and discipleship when you don't have time to sit with a physical Bible.",
    audio_point1_bold: "Fit growth into busy days:",
    audio_point1_text: "concise 9 to 18 minute lessons without fluff",
    audio_point2_bold: "Grounded in Scripture:",
    audio_point2_text: "each lesson breaks down one passage line by line",
    audio_point3_bold: "Take action immediately:",
    audio_point3_text: "end with one practical prayer takeaway for your day",
    audio_cat_all: "All",
    audio_cat_faith: "Faith",
    audio_cat_prayer: "Prayer",
    audio_cat_hope: "Hope",
    audio_cat_discipleship: "Discipleship",
    audio_curated: "Curated Scripture teachings",
    audio_read_study: "Read and study lesson",

    voice_eyebrow: "Voice Scripture Practice",
    voice_heading: "Ask Scripture anything with your voice.",
    voice_desc: "Speak your questions or feelings out loud. LifeBook returns Scripture, reflection, and prayer.",
    voice_tap_prompt: "Tap the microphone to speak",
    voice_listening: "Listening to your voice...",
    voice_thinking: "Searching Scripture and prayers...",
    voice_save_reflection: "Save this reflection to journal",
    voice_saved: "Saved to private journal",
    voice_chip_anxiety: "When I feel anxious",
    voice_chip_wisdom: "Wisdom for tough decisions",
    voice_chip_gratitude: "Verses on gratitude",
    voice_chip_grief: "Hope during loss",

    faq_eyebrow: "Frequently Asked Questions",
    faq_heading: "Common questions before you start.",
    faq_q1: "How much time does each devotion take?",
    faq_a1: "Exactly 5 minutes. You read one key passage (90 seconds), answer three reflection prompts (2 minutes), and record a private prayer (90 seconds).",
    faq_q2: "What happens if I miss a day?",
    faq_a2: "You never get penalized. LifeBook includes built-in Sabbath rest and grace protection, so your momentum stays intact when life gets busy.",
    faq_q3: "Which Bible translations are supported?",
    faq_a3: "LifeBook supports both English and French translations including ESV, NIV, KJV in English, and Louis Segond (LSG) & Bible du Semeur in French.",
    faq_q4: "Are my prayers and journal entries private?",
    faq_a4: "100% private. Your responses and audio prayers remain stored locally on your device unless you explicitly choose to back them up securely.",
    faq_q5: "Is LifeBook free to start?",
    faq_a5: "Yes, you can access the full 5-minute morning devotion, topical journeys, voice search, and audio teachings immediately without any credit card.",

    cta_eyebrow: "Start Tomorrow Morning",
    cta_heading: "Begin your first 5-minute devotion with Psalm 23.",
    cta_desc: "Join over 1,200 believers waking up to Scripture, reflection, and prayer. Enter your email to receive tomorrow's morning devotion.",
    cta_placeholder: "Enter your email address",
    cta_button: "Start 5-minute devotion",
    cta_success: "Welcome! Check your inbox tomorrow at 6:00 AM for Day 1.",
    cta_note: "Free forever · No credit card required · Unsubscribe anytime",

    footer_tagline: "Scripture · Reflection · Prayer · Community",
    footer_copyright: "LifeBook Devotional. Built to help believers walk with God daily.",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    footer_back_to_top: "Back to top",
  },
  fr: {
    nav_daily_practice: "Pratique quotidienne",
    nav_how_it_works: "Comment ça marche",
    nav_journeys: "Parcours de 5 jours",
    nav_voice_search: "Recherche vocale",
    nav_audio_teachings: "Enseignements audio",
    nav_my_progress: "Mes progrès",
    nav_faq: "FAQ",
    nav_sign_in: "Connexion",
    nav_sign_out: "Déconnexion",
    nav_start_devotion: "Commencer la méditation (5 min)",
    nav_menu: "Menu",
    nav_close: "Fermer",
    nav_switch_lang: "Changer de langue",
    nav_lang_en: "EN",
    nav_lang_fr: "FR",
    theme_toggle_label: "Thème",
    theme_light: "Clair",
    theme_dark: "Nuit (HC)",
    theme_night_reading: "Lecture de nuit",

    mobile_nav_devotion: "Méditation quotidienne",
    mobile_nav_scripture_audio: "Écritures & Audio",
    mobile_nav_community_help: "Communauté & Aide",

    hero_eyebrow: "Temps de calme quotidien de 5 minutes",
    hero_title_part1: "Commencez votre matinée ancré dans l'",
    hero_title_em: "Écriture",
    hero_title_part2: ", loin des écrans.",
    hero_desc: "Bâtissez une habitude vivifiante de prière et de méditation biblique avant le tumulte du jour. Cinq minutes d'Écritures choisies, de réflexion sincère et de prière personnelle — conçues pour les chrétiens occupés.",
    hero_cta_start: "Commencer la méditation (5 min)",
    hero_cta_explore: "Explorer les parcours de 5 jours",
    hero_rating_note: "parmi plus de 1 200 croyants qui ont remplacé le scroll matinal par un temps de recueillement",
    hero_scroll: "Découvrir le fonctionnement",

    preview_greeting: "Bonjour",
    preview_today_devotion: "Méditation de 5 minutes du jour",
    preview_tab_today: "Aujourd'hui",
    preview_tab_journeys: "Parcours",
    preview_tab_journal: "Journal",
    preview_streak_title: "Série quotidienne",
    preview_streak_sub: "5 jours sur 7 complétés cette semaine",
    preview_streak_grace: "Protection de grâce active",
    preview_scripture_label: "Écriture du jour",

    mood_peaceful: "Paisible",
    mood_peaceful_desc: "S'ancrer dans le repos divin",
    mood_seeking: "En quête",
    mood_seeking_desc: "Sagesse pour vos choix",
    mood_grateful: "Reconnaissant",
    mood_grateful_desc: "Rendre grâce aujourd'hui",
    mood_questions: "Interrogations",
    mood_questions_desc: "Déposer ses fardeaux",

    mood_peace_quote: "« L'Éternel est mon berger : je ne manquerai de rien. »",
    mood_peace_ref: "Psaume 23:1 (Louis Segond)",
    mood_seek_quote: "« Si quelqu'un d'entre vous manque de sagesse, qu'il la demande à Dieu qui donne à tous simplement. »",
    mood_seek_ref: "Jacques 1:5 (Louis Segond)",
    mood_grateful_quote: "« Rendez grâces en toutes choses, car c'est à votre égard la volonté de Dieu en Jésus-Christ. »",
    mood_grateful_ref: "1 Thessaloniciens 5:18 (Louis Segond)",
    mood_doubt_quote: "« Déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous. »",
    mood_doubt_ref: "1 Pierre 5:7 (Louis Segond)",

    benefits_heading: "Un rythme matinal que vous pouvez vraiment tenir.",
    benefits_sub: "La plupart des guides exigent une heure que vous n'avez pas. LifeBook s'adapte à votre vie réelle avec Écriture, réflexion et prière en 5 minutes ciblées.",
    benefit_1_title: "5 Minutes",
    benefit_1_desc: "Conçu pour la profondeur, pas la longueur. Un passage clé, trois questions de méditation et une prière guidée de 60 secondes.",
    benefit_2_title: "Conçu pour la grâce",
    benefit_2_desc: "Un jour manqué ? Aucune culpabilité. Le repos du sabbat et la protection de grâce intégrés vous permettent d'avancer sereinement.",
    benefit_3_title: "Intimité préservée",
    benefit_3_desc: "Vos prières et réflexions restent privées sur votre appareil. Aucun fil public, aucune métrique de performance.",

    how_eyebrow: "La routine matinale de 5 minutes",
    how_heading: "Trois minutes pour méditer. Une pour lire. Une pour prier.",
    how_sub: "Trois étapes claires conçues pour vous apporter paix et discernement avant que votre journée de travail ne commence.",
    step_1_title: "Lire l'Écriture du jour",
    step_1_desc: "Un passage choisi avec soin, sans superflu. Lisez lentement et laissez la Parole de Dieu s'enraciner.",
    step_2_title: "Répondre à 3 questions de réflexion",
    step_2_desc: "Des questions concrètes qui relient l'Écriture à votre travail, votre famille et vos pensées intérieures.",
    step_3_title: "Enregistrer une prière de 60 secondes",
    step_3_desc: "Clôturez votre temps de recueillement par une prière sincère, stockée en toute confidentialité sur votre appareil.",
    step_1_card_label: "Étape 01 / 03 · Lire",
    step_1_card_quote: "Il restaure\nmon âme.",
    step_1_card_ref: "Psaume 23:3 (Louis Segond)",
    step_2_card_label: "Étape 02 / 03 · Méditer",
    step_2_card_quote: "Où avez-vous besoin de\nla paix de Dieu aujourd'hui ?",
    step_2_card_ref: "Question 01 sur 03",
    step_3_card_label: "Étape 03 / 03 · Prier",
    step_3_card_quote: "« Seigneur, guide mes pas\net apaise mes inquiétudes. »",
    step_3_card_ref: "Enregistré sur l'appareil",
    phase_read: "Lire (90s)",
    phase_reflect: "Méditer (2m)",
    phase_pray: "Prier (60s)",

    journeys_eyebrow: "Parcours thématiques de 5 jours",
    journeys_heading: "Concentrez-vous sur vos besoins essentiels cette semaine.",
    journeys_sub: "Choisissez un parcours de 5 jours conçu pour des saisons spécifiques de votre vie. Chaque jour ne prend que 5 minutes.",
    journey_1_title: "Anxiété & Paix",
    journey_1_desc: "Cinq jours pour s'ancrer dans les promesses de Dieu lorsque vos pensées s'agitent.",
    journey_2_title: "Marcher dans la sagesse",
    journey_2_desc: "Les Proverbes et Jacques appliqués à vos choix professionnels et familiaux.",
    journey_3_title: "Cultiver la gratitude",
    journey_3_desc: "Entraînez votre cœur à discerner la fidélité de Dieu, même dans les saisons exigeantes.",
    journey_4_title: "Restaurer l'espérance",
    journey_4_desc: "Quand la fatigue se fait sentir, redécouvrez la présence douce et constante du Seigneur.",
    journey_5_title: "Consécration matinale",
    journey_5_desc: "Remettez votre calendrier, vos soucis et vos ambitions entre les mains de Dieu avant 8h.",
    journey_card_tag: "Plan de 5 jours",
    journey_start_cta: "Commencer l'étude",

    audio_eyebrow: "Enseignements bibliques audio",
    audio_heading: "Écoutez des enseignements de 10 minutes pendant votre trajet.",
    audio_desc: "Diffusez des leçons audio verset par verset sur la foi, la prière, l'espérance et la vie chrétienne quand vous n'avez pas le temps d'ouvrir une Bible papier.",
    audio_point1_bold: "La croissance au cœur de l'action :",
    audio_point1_text: "des leçons concises de 9 à 18 minutes sans artifice",
    audio_point2_bold: "Enracinées dans l'Écriture :",
    audio_point2_text: "chaque enseignement décortique un passage verset par verset",
    audio_point3_bold: "Application concrète immédiate :",
    audio_point3_text: "terminez avec un point d'action et de prière pour la journée",
    audio_cat_all: "Tous",
    audio_cat_faith: "Foi",
    audio_cat_prayer: "Prière",
    audio_cat_hope: "Espérance",
    audio_cat_discipleship: "Vie chrétienne",
    audio_curated: "Enseignements bibliques sélectionnés",
    audio_read_study: "Lire et étudier la leçon",

    voice_eyebrow: "Recherche vocale dans l'Écriture",
    voice_heading: "Posez vos questions à la Bible avec votre voix.",
    voice_desc: "Exprimez vos interrogations ou sentiments à voix haute. LifeBook vous répond par l'Écriture, la méditation et la prière.",
    voice_tap_prompt: "Touchez le micro pour parler",
    voice_listening: "À l'écoute de votre voix...",
    voice_thinking: "Recherche dans les Écritures et prières...",
    voice_save_reflection: "Enregistrer cette réflexion dans le journal",
    voice_saved: "Enregistré dans le journal privé",
    voice_chip_anxiety: "Quand je me sens anxieux",
    voice_chip_wisdom: "Sagesse pour un choix difficile",
    voice_chip_gratitude: "Versets sur la gratitude",
    voice_chip_grief: "Espérance dans le deuil",

    faq_eyebrow: "Questions fréquentes",
    faq_heading: "Questions courantes avant de commencer.",
    faq_q1: "Combien de temps prend chaque méditation ?",
    faq_a1: "Exactement 5 minutes. Vous lisez un passage clé (90 secondes), répondez à trois questions de méditation (2 minutes) et enregistrez une prière privée (90 secondes).",
    faq_q2: "Que se passe-t-il si je manque un jour ?",
    faq_a2: "Aucune pénalité. LifeBook intègre le repos du sabbat et la protection de grâce, garantissant que votre élan spirituel reste préservé en cas d'imprévu.",
    faq_q3: "Quelles versions de la Bible sont disponibles ?",
    faq_a3: "LifeBook prend en charge l'anglais et le français, incluant la version Louis Segond (LSG) et la Bible du Semeur en français, ainsi que ESV, NIV et KJV en anglais.",
    faq_q4: "Mes prières et notes de journal sont-elles privées ?",
    faq_a4: "100 % privées. Vos réponses et prières audio restent stockées localement sur votre appareil sans aucune transmission publique.",
    faq_q5: "L'accès à LifeBook est-il gratuit ?",
    faq_a5: "Oui, vous pouvez accéder immédiatement à la méditation matinale de 5 minutes, aux parcours thématiques, à la recherche vocale et aux enseignements audio sans aucune carte bancaire.",

    cta_eyebrow: "Commencez dès demain matin",
    cta_heading: "Démarrez votre première méditation de 5 minutes avec le Psaume 23.",
    cta_desc: "Rejoignez plus de 1 200 chrétiens qui débutent leur journée par la Parole, la réflexion et la prière. Entrez votre e-mail pour recevoir la méditation de demain.",
    cta_placeholder: "Entrez votre adresse e-mail",
    cta_button: "Commencer la méditation (5 min)",
    cta_success: "Bienvenue ! Consultez votre boîte de réception demain à 6h00 pour le Jour 1.",
    cta_note: "Gratuit pour toujours · Aucune carte bancaire requise · Désabonnement en un clic",

    footer_tagline: "Écritures · Méditation · Prière · Communauté",
    footer_copyright: "LifeBook Méditations. Conçu pour accompagner les chrétiens dans leur marche quotidienne avec Dieu.",
    footer_privacy: "Politique de confidentialité",
    footer_terms: "Conditions d'utilisation",
    footer_back_to_top: "Haut de page",
  },
};

const DOT_KEY_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    "theme.toggle": "Toggle theme",
    "nav.signIn": "Sign In",
    "nav.signUp": "Create Account",
    "nav.signOut": "Sign Out",
    "auth.demoLogin": "Instant Sanctuary Demo",
    "landing.openDashboard": "Open Sanctuary",
    "landing.heroTitle": "A Quiet Sanctuary for",
    "landing.heroTitleHighlight": "Scripture, Prayer & Pastoral Communion",
    "landing.heroSubtitle":
      "Immerse yourself in the 66 books of the Bible with authentic Nigerian, Ivorian, and American pastoral voices, harmonic Christian melodies, and 1-on-1 WebRTC pastoral audio sessions.",
    "landing.enterSanctuary": "Enter the Sanctuary",
    "landing.dailyVerseLabel": "Daily Canonical Reading",
    "landing.feature1Title": "The Living Word & Regional Voices",
    "landing.feature1Desc":
      "Read and listen to all 66 books of Scripture in English and French with warm Nigerian, Ivorian, and American voice cadences.",
    "landing.feature2Title": "Spoken Scripture Affirmation",
    "landing.feature2Desc":
      "Proclaim verses aloud with word-by-word visual tracking and real-time pronunciation accuracy.",
    "landing.feature3Title": "Contemplative Prayer Ledger",
    "landing.feature3Desc":
      "Archive written reflections and spoken prayer memos with automatic Sanctuary Cloud synchronization.",
    "footer.tagline": "Bilingual Christian Scripture & Pastoral Sanctuary",
    "dashboard.welcome": "Grace & Peace",
    "dashboard.subtitle": "Your Contemplative Sanctuary & Daily Rhythm",
    "dashboard.dailyMeditation": "Today's Canonical Meditation",
    "dashboard.openBible": "Open in Bible Reader",
    "dashboard.practiceVoice": "Speak Verse Aloud",
    "dashboard.writeReflection": "Write Reflection",
    "dashboard.recentReflections": "Recent Prayer Ledger Entries",
    "dashboard.tabs.overview": "I. Sanctuary",
    "dashboard.tabs.bible": "II. Living Word",
    "dashboard.tabs.voice": "III. Voice Room",
    "dashboard.tabs.journal": "IV. Journal",
    "dashboard.tabs.teachers": "V. Teachers",
    "dashboard.stats.streak": "Consecutive Days",
    "dashboard.stats.days": "days in the Word",
    "dashboard.stats.chaptersRead": "Chapters Completed",
    "dashboard.stats.voiceSessions": "Spoken Affirmations",
    "dashboard.stats.reflections": "Prayer Archive",
    "a11y.progressSummary": "Sanctuary spiritual rhythm metrics",
    "scripture.title": "The Living Word & Pastoral Library",
    "scripture.searchPlaceholder": "Search books or verses...",
    "scripture.allBooks": "All (66)",
    "scripture.oldTestament": "Old (39)",
    "scripture.newTestament": "New (27)",
    "scripture.meditationNote": "Pastoral Reflection Note",
    "scripture.listenAloud": "Listen Aloud",
    "scripture.stopReading": "Stop Audio",
    "scripture.speakVerse": "Practice Speaking",
    "scripture.completed": "Completed",
    "scripture.markCompleted": "Mark Chapter Read",
    "voice.title": "Spoken Scripture & Prayer Room",
    "voice.subtitle":
      "Recite Scripture aloud with word-by-word verification and harmonic worship accompaniment.",
    "voice.selectVerse": "Select Passage to Proclaim",
    "voice.startSpeaking": "Start Speaking Verse",
    "voice.stopSpeaking": "Stop Microphone",
    "voice.accuracy": "Recitation Match",
    "voice.recognizedText": "Live Spoken Transcript",
    "voice.noSpeechYet": "Press 'Start Speaking Verse' and read the passage aloud...",
    "journal.title": "Contemplative Prayer & Reflection Ledger",
    "journal.savedSuccess": "Reflection sealed in your Sanctuary Ledger.",
    "journal.entryTitlePlaceholder": "Reflection or Prayer Title",
    "journal.scriptureRefPlaceholder": "Scripture Anchor (e.g. Psalm 23:1)",
    "journal.moodLabel": "Spiritual Disposition",
    "journal.contentPlaceholder":
      "Write your prayer, gratitude, or meditation before the Lord...",
    "journal.saveEntry": "Seal Reflection in Archive",
    "journal.emptyState": "No reflections match your current filter.",
    "journal.moods.peaceful": "Peaceful",
    "journal.moods.grateful": "Grateful",
    "journal.moods.hopeful": "Hopeful",
    "journal.moods.seeking": "Seeking",
    "journal.moods.rejoicing": "Rejoicing",
  },
  fr: {
    "theme.toggle": "Changer le thème",
    "nav.signIn": "Connexion",
    "nav.signUp": "Créer un Compte",
    "nav.signOut": "Déconnexion",
    "auth.demoLogin": "Accès Démo Immédiat",
    "landing.openDashboard": "Ouvrir le Sanctuaire",
    "landing.heroTitle": "Un Sanctuaire Paisible pour",
    "landing.heroTitleHighlight": "l'Écriture, la Prière et la Communion Pastorale",
    "landing.heroSubtitle":
      "Plongez dans les 66 livres de la Bible avec d'authentiques voix pastorales nigérianes, ivoiriennes et américaines, des mélodies chrétiennes harmonieuses et des appels audio WebRTC 1-à-1.",
    "landing.enterSanctuary": "Entrer dans le Sanctuaire",
    "landing.dailyVerseLabel": "Lecture Canonique du Jour",
    "landing.feature1Title": "La Parole Vivante & Voix Régionales",
    "landing.feature1Desc":
      "Lisez et écoutez les 66 livres bibliques en français et en anglais avec des voix chaleureuses de Côte d'Ivoire, du Nigéria et des États-Unis.",
    "landing.feature2Title": "Proclamation Vocale de l'Écriture",
    "landing.feature2Desc":
      "Récitez les versets à haute voix avec suivi visuel mot à mot et mesure de précision en temps réel.",
    "landing.feature3Title": "Registre de Prière Contemplative",
    "landing.feature3Desc":
      "Archivez vos réflexions écrites et mémos vocaux de prière avec synchronisation cloud automatique.",
    "footer.tagline": "Sanctuaire Biblique et Pastoral Bilingue",
    "dashboard.welcome": "Grâce & Paix",
    "dashboard.subtitle": "Votre Sanctuaire Contemplatif & Rythme Quotidien",
    "dashboard.dailyMeditation": "Méditation Canonique du Jour",
    "dashboard.openBible": "Ouvrir dans la Bible",
    "dashboard.practiceVoice": "Proclamer à Haute Voix",
    "dashboard.writeReflection": "Écrire une Réflexion",
    "dashboard.recentReflections": "Entrées Récentes du Registre",
    "dashboard.tabs.overview": "I. Sanctuaire",
    "dashboard.tabs.bible": "II. Parole Vivante",
    "dashboard.tabs.voice": "III. Salle Vocale",
    "dashboard.tabs.journal": "IV. Journal",
    "dashboard.tabs.teachers": "V. Enseignants",
    "dashboard.stats.streak": "Jours Consécutifs",
    "dashboard.stats.days": "jours dans la Parole",
    "dashboard.stats.chaptersRead": "Chapitres Lus",
    "dashboard.stats.voiceSessions": "Versets Proclamés",
    "dashboard.stats.reflections": "Archive de Prière",
    "a11y.progressSummary": "Indicateurs du rythme spirituel",
    "scripture.title": "La Parole Vivante & Bibliothèque Pastorale",
    "scripture.searchPlaceholder": "Rechercher un livre ou un verset...",
    "scripture.allBooks": "Tous (66)",
    "scripture.oldTestament": "Ancien (39)",
    "scripture.newTestament": "Nouveau (27)",
    "scripture.meditationNote": "Note de Méditation Pastorale",
    "scripture.listenAloud": "Écouter",
    "scripture.stopReading": "Arrêter l'Audio",
    "scripture.speakVerse": "Pratiquer la Voix",
    "scripture.completed": "Chapitre Lu",
    "scripture.markCompleted": "Marquer comme Lu",
    "voice.title": "Chambre de Proclamation Vocale",
    "voice.subtitle":
      "Récitez l'Écriture à haute voix avec suivi mot à mot et accompagnement instrumental sacré.",
    "voice.selectVerse": "Choisir le Passage à Proclamer",
    "voice.startSpeaking": "Commencer la Récitation",
    "voice.stopSpeaking": "Arrêter le Microphone",
    "voice.accuracy": "Précision Vocale",
    "voice.recognizedText": "Transcription Vocale en Direct",
    "voice.noSpeechYet": "Cliquez sur « Commencer la Récitation » et lisez le verset à haute voix...",
    "journal.title": "Registre de Prière & Réflexion",
    "journal.savedSuccess": "Réflexion scellée dans votre registre.",
    "journal.entryTitlePlaceholder": "Titre de la prière ou réflexion",
    "journal.scriptureRefPlaceholder": "Référence biblique (ex. Psaume 23:1)",
    "journal.moodLabel": "Disposition Spirituelle",
    "journal.contentPlaceholder":
      "Écrivez votre prière, gratitude ou méditation devant le Seigneur...",
    "journal.saveEntry": "Sceller dans l'Archive",
    "journal.emptyState": "Aucune réflexion ne correspond à ce filtre.",
    "journal.moods.peaceful": "Paisible",
    "journal.moods.grateful": "Reconnaissant",
    "journal.moods.hopeful": "Espérant",
    "journal.moods.seeking": "En quête",
    "journal.moods.rejoicing": "Dans la joie",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations | string) => string;
  isFr: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "lifebook_user_language";
const LANGUAGE_CHANGE_EVENT = "lifebook_language_change";

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (saved === "en" || saved === "fr") return saved;
    if (navigator.language?.toLowerCase().startsWith("fr")) return "fr";
  } catch {
    // Storage unavailable fallback
  }
  return "en";
}

function getLanguageServerSnapshot(): Language {
  return "en";
}

function subscribeToLanguage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, getLanguageServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (newLang: Language) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: newLang }));
    } catch {
      // Storage unavailable fallback
    }
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === "en" ? "fr" : "en";
    setLanguage(nextLang);
  };

  const t = (key: keyof Translations | string): string => {
    const dotDict = DOT_KEY_TRANSLATIONS[language] || DOT_KEY_TRANSLATIONS.en;
    if (key in dotDict) {
      return dotDict[key];
    }
    const dict = translations[language] || translations.en;
    return (
      (dict as Record<string, string>)[key] ||
      (translations.en as Record<string, string>)[key] ||
      key
    );
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isFr: language === "fr",
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a default fallback if used outside provider during SSR/initial render
    return {
      language: "en",
      setLanguage: () => {},
      t: (key: keyof Translations | string) =>
        DOT_KEY_TRANSLATIONS.en[key] ||
        (translations.en as Record<string, string>)[key] ||
        key,
      isFr: false,
      toggleLanguage: () => {},
    };
  }
  return context;
}

export { translations };
