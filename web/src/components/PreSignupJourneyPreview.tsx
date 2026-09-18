"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { trackEvent } from "@/lib/telemetry";

export interface JourneyDay {
  day: number;
  title: string;
  reference: string;
  theme: string;
  scripture: string;
  reflectionPrompt: string;
  prayer: string;
  estimatedMinutes: number;
}

export interface PreSignupJourney {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  moodKey: "peace" | "seek" | "grateful" | "doubt";
  moodIcon: string;
  moodName: string;
  reasoning: string;
  contrastVsGeneric: string;
  days: JourneyDay[];
}

export function PreSignupJourneyPreview() {
  const { isFr } = useLanguage();
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>("peace-work");
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [isPlayingAudioSample, setIsPlayingAudioSample] = useState<boolean>(false);
  const [scratchpadNote, setScratchpadNote] = useState<string>("");
  const [isGraceProtectionDemoOpen, setIsGraceProtectionDemoOpen] = useState<boolean>(false);

  const journeys: PreSignupJourney[] = [
    {
      id: "peace-work",
      slug: "peace-in-busy-workdays",
      title: isFr ? "La paix dans le tourbillon du travail" : "Peace in Busy Workdays",
      subtitle: isFr ? "5 jours pour déposer l'urgence et s'ancrer dans le Christ" : "5 days to surrender hurried deadlines and anchor in Christ",
      category: isFr ? "Travail & Sérénité" : "Work & Stress",
      moodKey: "peace",
      moodIcon: "🌿",
      moodName: isFr ? "Sous pression / Délais urgents" : "Anxious / Busy Workdays",
      reasoning: isFr
        ? "Parce que vous portez des responsabilités lourdes et la course des e-mails, LifeBook ne vous impose pas de longs plans théoriques. Nous vous orientons vers Philippiens 4 et le Psaume 23 pour déposer mentalement vos urgences à Dieu en 5 minutes chrono avant d'entamer vos réunions."
        : "Because you've been carrying work deadlines, rush, and mental overload this week, generic apps offer 40-minute chapters that only create guilt. LifeBook routes you to Paul's prison reflections in Philippians 4 and Psalm 23 so you can practice surrendering your day to God in 5 deliberate minutes before checking work email.",
      contrastVsGeneric: isFr
        ? "Les applications génériques ouvrent au hasard sur Lévitique quand votre gorge est nouée. LifeBook sélectionne intentionnellement l'ancre spirituelle dont votre journée de travail a besoin."
        : "Generic apps serve random Leviticus genealogies when your chest is tight. LifeBook intentionally prescribes the exact scripture anchor your workday demands.",
      days: [
        {
          day: 1,
          title: isFr ? "Tout déposer devant Dieu" : "Bring It to God",
          reference: isFr ? "Philippiens 4:6-7 (Louis Segond)" : "Philippians 4:6-7 (ESV)",
          theme: isFr ? "Décharger l'esprit avant la première réunion" : "Surrendering your mental to-do list",
          scripture: isFr
            ? "« Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ. »"
            : "“Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.”",
          reflectionPrompt: isFr
            ? "La paix ne commence pas quand tous les e-mails sont traités, mais quand vous confiez le poids à Dieu. Quel fardeau professionnel précis devez-vous Lui remettre ce matin ?"
            : "Peace doesn't begin when every task is checked off. It starts when you hand the weight to someone greater. What urgent work worry do you need to transfer to God right now?",
          prayer: isFr
            ? "« Seigneur, je Te confie ce qui pèse sur mon esprit ce matin. Apaise ma hâte. Garde mes pensées dans Ta paix alors que j'entame mon travail. Amen. »"
            : "“Lord, I bring You what is pressing against my mind this morning. Quiet my hurry and steady my breathing. Guard my thoughts as I step into today's responsibilities. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 2,
          title: isFr ? "Une paix différente de celle du monde" : "A Different Kind of Peace",
          reference: isFr ? "Jean 14:27 (Louis Segond)" : "John 14:27 (ESV)",
          theme: isFr ? "Une stabilité qui ne dépend pas des circonstances" : "Peace that doesn't depend on circumstances lining up",
          scripture: isFr
            ? "« Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s'alarme point. »"
            : "“Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.”",
          reflectionPrompt: isFr
            ? "Le monde vous promet la paix seulement si tout se déroule parfaitement. Comment réagir avec calme aujourd'hui si des imprévus surviennent ?"
            : "The world promises peace only if everything goes smoothly. What would it look like to remain steady today even if unexpected disruptions hit?",
          prayer: isFr
            ? "« Jésus, donne-moi Ta paix qui ne dépend pas de l'approbation des autres ni du succès immédiat. Reste mon ancre. Amen. »"
            : "“Jesus, grant me Your peace that does not depend on circumstances lining up. Let my heart remain calm even amidst unresolved tensions. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 3,
          title: isFr ? "Fixer ses pensées sur Dieu" : "A Mind Stayed on God",
          reference: isFr ? "Ésaïe 26:3 (Louis Segond)" : "Isaiah 26:3 (ESV)",
          theme: isFr ? "Discipline de l'attention au milieu du bruit" : "Deliberate focus amidst workplace noise",
          scripture: isFr
            ? "« À celui qui est ferme dans ses sentiments Tu assures la paix, la paix, Parce qu'il se confie en toi. »"
            : "“You keep him in perfect peace whose mind is stayed on you, because he trusts in you.”",
          reflectionPrompt: isFr
            ? "Qu'est-ce qui disperse votre attention ce matin, et comment pouvez-vous recentrer votre regard sur le Seigneur ?"
            : "What is constantly pulling your attention away this morning, and what would it take to deliberately redirect it toward God?",
          prayer: isFr
            ? "« Père, garde mon esprit fixé sur Ta fidélité quand mes pensées dérivent vers l'inquiétude. Amen. »"
            : "“Father, keep my mind fixed on Your faithfulness when my thoughts drift toward worry. I trust You with what I cannot control. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 4,
          title: isFr ? "Force et paix réunies" : "Strength and Peace Together",
          reference: isFr ? "Psaume 29:11 (Louis Segond)" : "Psalm 29:11 (ESV)",
          theme: isFr ? "Recevoir l'énergie pour les défis du jour" : "Capacity to face demanding challenges with calm",
          scripture: isFr
            ? "« L'Éternel donne la force à son peuple; L'Éternel bénit son peuple et le rend heureux par la paix. »"
            : "“The Lord gives strength to his people; the Lord blesses his people with peace.”",
          reflectionPrompt: isFr
            ? "Où avez-vous besoin à la fois de courage et de douceur dans vos échanges de la journée ?"
            : "Where do you need both courage and gentleness in your conversations today?",
          prayer: isFr
            ? "« Seigneur, accorde-moi la force d'agir justement et la paix de ne pas m'épuiser. Amen. »"
            : "“Lord, give me strength for what is ahead and peace to carry it well without burning out. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 5,
          title: isFr ? "Faire régner la paix" : "Let Peace Rule",
          reference: isFr ? "Colossiens 3:15 (Louis Segond)" : "Colossians 3:15 (ESV)",
          theme: isFr ? "Choisir la paix comme arbitre de vos décisions" : "Letting peace govern your decisions going forward",
          scripture: isFr
            ? "« Et que la paix de Christ, à laquelle vous avez été appelés pour former un seul corps, règne dans vos cœurs. Et soyez reconnaissants. »"
            : "“And let the peace of Christ rule in your hearts, to which indeed you were called in one body. And be thankful.”",
          reflectionPrompt: isFr
            ? "Au terme de ces 5 jours, quelle habitude de prière souhaitez-vous préserver au quotidien ?"
            : "Looking at this 5-day rhythm, what quiet habit will you carry into next week to protect your peace?",
          prayer: isFr
            ? "« Que Ta paix règne dans mes choix et mes paroles. Merci pour cette habitude retrouvée. Amen. »"
            : "“God, thank You for meeting me this week. Help peace be the governor of my heart, not anxiety. Amen.”",
          estimatedMinutes: 5,
        },
      ],
    },
    {
      id: "clarity-seek",
      slug: "growing-faith-and-clarity",
      title: isFr ? "Grandir dans la foi et le discernement" : "Clarity in Big Decisions",
      subtitle: isFr ? "5 jours pour discerner la volonté de Dieu à la croisée des chemins" : "5 days to seek God's guidance when facing crossroads",
      category: isFr ? "Sagesse & Décision" : "Wisdom & Faith",
      moodKey: "seek",
      moodIcon: "🧭",
      moodName: isFr ? "En quête / Choix difficiles" : "Seeking Direction / Decisions",
      reasoning: isFr
        ? "Parce que vous pesez des choix professionnels ou personnels cruciaux, vous avez besoin de discernement biblique et non de slogans motivants. LifeBook ancre vos matinées dans Jacques 1:5 et Hébreux 11 pour demander la sagesse dans la foi sans être balloté par l'incertitude."
        : "Because you are weighing a career, relationship, or family crossroad, you need divine discernment rather than superficial motivational advice. LifeBook grounds your morning in James 1:5 and Hebrews 11 so you ask for wisdom in faith without being tossed like a wave of the sea.",
      contrastVsGeneric: isFr
        ? "Les applications classiques vous laissent errer dans des centaines de versets décontextualisés. LifeBook trace un cheminement pastoral progressif en 5 étapes pour éclairer votre discernement."
        : "Standard apps leave you scrolling hundreds of uncurated verses without application. LifeBook lays out a deliberate 5-day pastoral framework to bring clarity to your prayer life.",
      days: [
        {
          day: 1,
          title: isFr ? "Demander avec confiance" : "Asking for Wisdom",
          reference: isFr ? "Jacques 1:5 (Louis Segond)" : "James 1:5 (ESV)",
          theme: isFr ? "Dieu donne simplement et sans reproche" : "The God who gives wisdom generously",
          scripture: isFr
            ? "« Si quelqu'un d'entre vous manque de sagesse, qu'il la demande à Dieu, qui donne à tous simplement et sans reproche, et elle lui sera donnée. »"
            : "“If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.”",
          reflectionPrompt: isFr
            ? "Quelle décision vous préoccupe le plus ? L'avez-vous confiée à Dieu dans la prière ou tentez-vous de tout résoudre par vous-même ?"
            : "What major decision is causing friction in your mind right now? Have you brought it openly to God, or are you trying to resolve it solely in your own strength?",
          prayer: isFr
            ? "« Père céleste, éclaire mes choix. Que mes paroles et mes pas reflètent Ta justice aujourd'hui. Amen. »"
            : "“Heavenly Father, align my choices with Your purpose. Grant me wisdom where there is confusion. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 2,
          title: isFr ? "Une foi qui espère" : "Substance of What You Hope For",
          reference: isFr ? "Hébreux 11:1 (Louis Segond)" : "Hebrews 11:1 (ESV)",
          theme: isFr ? "Faire confiance avant même de voir le résultat" : "Holding onto truth before the outcome resolves",
          scripture: isFr
            ? "« Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas. »"
            : "“Now faith is the assurance of things hoped for, the conviction of things not seen.”",
          reflectionPrompt: isFr
            ? "Dans quel domaine devez-vous faire un pas d'obéissance même sans garantie visible ?"
            : "Where are you waiting for 100% certainty before you are willing to take the faithful next step?",
          prayer: isFr
            ? "« Seigneur, fais grandir en moi une foi solide qui ne faiblit pas devant l'inconnu. Amen. »"
            : "“Lord, cultivate in me a faith that trusts Your unseen hand. Help me move forward in quiet confidence. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 3,
          title: isFr ? "Marcher par la foi" : "Walking by Faith, Not by Sight",
          reference: isFr ? "2 Corinthiens 5:7 (Louis Segond)" : "2 Corinthians 5:7 (ESV)",
          theme: isFr ? "Agir fidèlement pas à pas" : "Taking the next faithful step",
          scripture: isFr
            ? "« Car nous marchons par la foi et non par la vue. »"
            : "“For we walk by faith, not by sight.”",
          reflectionPrompt: isFr
            ? "Quel est le prochain pas juste et honnête que vous pouvez poser aujourd'hui ?"
            : "What is the single right, honest step you can take today without stressing over the 10 steps after it?",
          prayer: isFr
            ? "« Éclaire le pas immédiat devant moi, Seigneur. Je Te confie la destination. Amen. »"
            : "“Guide my immediate step today, Lord. I trust You with the eventual destination. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 4,
          title: isFr ? "La patience dans l'épreuve" : "Faith Under Pressure",
          reference: isFr ? "Jacques 1:2-3 (Louis Segond)" : "James 1:2-3 (ESV)",
          theme: isFr ? "Ce que le temps d'attente produit en vous" : "What waiting produces in your character",
          scripture: isFr
            ? "« Regardez comme un sujet de joie complète les diverses épreuves auxquelles vous pouvez être exposés, sachant que l'épreuve de votre foi produit la patience. »"
            : "“Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness.”",
          reflectionPrompt: isFr
            ? "Quelle patience Dieu est-il en train de former en vous à travers cette attente ?"
            : "What steadfastness is God building in your heart through this season of waiting?",
          prayer: isFr
            ? "« Donne-moi la patience et la maturité pour traverser cette étape sans amertume. Amen. »"
            : "“Lord, grant me maturity and grace so this waiting season deepens my character. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 5,
          title: isFr ? "Prier avec assurance" : "Praying with Belief",
          reference: isFr ? "Marc 11:24 (Louis Segond)" : "Mark 11:24 (ESV)",
          theme: isFr ? "Sceller la décision dans la présence de Dieu" : "Sealing your decision in prayerful surrender",
          scripture: isFr
            ? "« C'est pourquoi je vous dis : Tout ce que vous demanderez en priant, croyez que vous l'avez reçu, et vous le verrez s'accomplir. »"
            : "“Therefore I tell you, whatever you ask in prayer, believe that you have received it, and it will be yours.”",
          reflectionPrompt: isFr
            ? "Comment cette semaine a-t-elle clarifié votre regard sur la volonté de Dieu ?"
            : "Looking back on these 5 days, how has your clarity sharpened in God's presence?",
          prayer: isFr
            ? "« Merci pour Ta sagesse fidèle. Je pose mes choix entre Tes mains souveraines. Amen. »"
            : "“Thank You for meeting me in prayer this week. I place my decisions into Your sovereign care. Amen.”",
          estimatedMinutes: 5,
        },
      ],
    },
    {
      id: "anxiety-fear",
      slug: "overcoming-fear-and-anxiety",
      title: isFr ? "Surmonter la peur et l'inquiétude" : "Overcoming Fear & Anxiety",
      subtitle: isFr ? "5 jours pour déposer l'angoisse et recevoir le courage de Christ" : "5 days facing worry with real scriptural courage",
      category: isFr ? "Courage & Réconfort" : "Courage & Comfort",
      moodKey: "doubt",
      moodIcon: "🌧️",
      moodName: isFr ? "Inquiet / Cœur alourdi" : "Heavy-Hearted / Worried",
      reasoning: isFr
        ? "Parce que vous vous réveillez avec un serrement au cœur ou des craintes pour vos proches, LifeBook ne vous accuse pas d'un manque de foi. Nous vous offrons un refuge pastoral en associant 1 Pierre 5:7 et 2 Timothée 1:7 pour vous rappeler que Dieu ne vous a pas donné un esprit de peur, mais de force, d'amour et de sagesse."
        : "Because you've been waking up with an unsettled heart or quiet dread, generic apps treat anxiety like a personal failure. LifeBook meets you with pastoral gentleness: pairing 1 Peter 5:7 with 2 Timothy 1:7 to remind you that God did not give you a spirit of fear, but of power, love, and a sound mind.",
      contrastVsGeneric: isFr
        ? "Les flux sociaux et alertes d'actualité nourrissent la panique. Ce parcours de 5 jours construit un rempart quotidien de 5 minutes contre l'angoisse."
        : "Social algorithms amplify panic and doomscrolling. This 5-day study erects a daily 5-minute sanctuary of biblical peace.",
      days: [
        {
          day: 1,
          title: isFr ? "Décharger tout souci" : "Casting Every Burden",
          reference: isFr ? "1 Pierre 5:7 (Louis Segond)" : "1 Peter 5:7 (ESV)",
          theme: isFr ? "Dieu prend soin de ce qui vous empêche de dormir" : "He genuinely cares for what keeps you awake",
          scripture: isFr
            ? "« Déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous. »"
            : "“Casting all your anxieties on him, because he cares for you.”",
          reflectionPrompt: isFr
            ? "« Décharger » est un acte délibéré de transfert. Quel souci précis pouvez-vous déposer à la croix dès cet instant ?"
            : "Notice the verb 'casting' — it requires an active release. What specific worry can you deliberately hand to Christ right now?",
          prayer: isFr
            ? "« Seigneur, je Te dépose ce fardeau lourd. Remplace mon anxiété par Ta sérénité bienveillante. Amen. »"
            : "“Lord, I release this pressure to You. You care for me deeply. Replace my panic with Your quiet presence. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 2,
          title: isFr ? "Pas un esprit de peur" : "Not a Spirit of Fear",
          reference: isFr ? "2 Timothée 1:7 (Louis Segond)" : "2 Timothy 1:7 (ESV)",
          theme: isFr ? "Recevoir force, amour et modération" : "Replacing dread with power, love, and a sound mind",
          scripture: isFr
            ? "« Car ce n'est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d'amour et de sagesse. »"
            : "“For God gave us a spirit not of fear but of power and love and self-control.”",
          reflectionPrompt: isFr
            ? "Quelle pensée de peur tente de dicter vos réactions en ce moment ?"
            : "What fearful narrative is trying to govern your reactions and sleep lately?",
          prayer: isFr
            ? "« Père, je refuse que la peur dirige mes journées. Remplis-moi de Ton Esprit de force et de clarté. Amen. »"
            : "“Father, I don't want fear steering my decisions. Grant me power, love, and a clear mind in its place. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 3,
          title: isFr ? "De qui aurais-je peur ?" : "Whom Shall I Fear?",
          reference: isFr ? "Psaume 27:1 (Louis Segond)" : "Psalm 27:1 (ESV)",
          theme: isFr ? "Mesurer l'obstacle à la grandeur de Dieu" : "Measuring fear against God's supreme scale",
          scripture: isFr
            ? "« L'Éternel est ma lumière et mon salut : De qui aurais-je crainte ? L'Éternel est le soutien de ma vie : De qui aurais-je peur ? »"
            : "“The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life; of whom shall I be afraid?”",
          reflectionPrompt: isFr
            ? "À la lumière de la puissance de Dieu, quelle est la véritable emprise de votre crainte ?"
            : "Given who God is, what power does this earthly fear truly hold over your eternal destiny?",
          prayer: isFr
            ? "« Tu es ma forteresse et ma lumière. Tiens-moi debout au milieu de l'ouragan. Amen. »"
            : "“Lord, You are my light and stronghold. Keep me standing when waves of doubt rush in. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 4,
          title: isFr ? "Je te fortifierai" : "I Will Strengthen You",
          reference: isFr ? "Ésaïe 41:10 (Louis Segond)" : "Isaiah 41:10 (ESV)",
          theme: isFr ? "La présence personnelle de Dieu dans l'épreuve" : "Personal presence when facing the unknown",
          scripture: isFr
            ? "« Ne crains rien, car je suis avec toi; Ne promène pas des regards inquiets, car je suis ton Dieu; Je te fortifie, je viens à ton secours, Je te soutiens de ma droite triomphante. »"
            : "“Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.”",
          reflectionPrompt: isFr
            ? "Comment cette promesse directe vous rassure-t-elle pour les défis de l'après-midi ?"
            : "How does hearing God say 'I am with you, I will hold your hand' change your posture today?",
          prayer: isFr
            ? "« Merci de ne pas me laisser seul. Soutiens-moi de Ta main bienveillante. Amen. »"
            : "“Thank You for never abandoning me to face hardship alone. Uphold my spirit today. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 5,
          title: isFr ? "Le parfait amour bannit la crainte" : "Perfect Love Casts Out Fear",
          reference: isFr ? "1 Jean 4:18 (Louis Segond)" : "1 John 4:18 (ESV)",
          theme: isFr ? "S'ancrer dans l'amour inconditionnel du Père" : "Resting safely in God's unconditional love",
          scripture: isFr
            ? "« La crainte n'est pas dans l'amour, mais l'amour parfait bannit la crainte; car la crainte suppose un châtiment, et celui qui craint n'est pas parfait dans l'amour. »"
            : "“There is no fear in love, but perfect love casts out fear. For fear has to do with punishment, and whoever fears has not been perfected in love.”",
          reflectionPrompt: isFr
            ? "Où l'amour de Dieu a-t-il chassé la peur dans votre cœur au cours de cette semaine ?"
            : "Where did God's steady love push fear out of your life this week, even in small ways?",
          prayer: isFr
            ? "« Merci pour cette semaine de paix retrouvée. Que Ton amour garde mon cœur jour après jour. Amen. »"
            : "“Lord, thank You for walking this week with me. Let Your love continually displace my fears. Amen.”",
          estimatedMinutes: 5,
        },
      ],
    },
    {
      id: "gratitude-joy",
      slug: "the-habit-of-thankfulness",
      title: isFr ? "La gratitude au réveil" : "The Habit of Thankfulness",
      subtitle: isFr ? "5 jours pour cultiver une louange inébranlable au quotidien" : "5 days turning daily gratitude into an unbreakable habit",
      category: isFr ? "Joie & Louange" : "Joy & Praise",
      moodKey: "grateful",
      moodIcon: "✦",
      moodName: isFr ? "Reconnaissant / En paix" : "Grateful / Hungry for Praise",
      reasoning: isFr
        ? "Parce que votre cœur est aujourd'hui dans de bonnes dispositions, c'est l'instant stratégique pour enraciner une habitude pérenne. Plutôt que d'attendre la tempête pour prier, LifeBook canalise cette joie dans 1 Thessaloniciens 5:18 et Colossiens 3 pour que la gratitude devienne votre réflexe naturel en toute saison."
        : "Because your heart feels receptive and open today, this is the prime moment to build lifelong spiritual resilience. Rather than waiting for crisis to pray, LifeBook deepens your praise with 1 Thessalonians 5:18 and Colossians 3 so thankfulness becomes your default reflex in every season.",
      contrastVsGeneric: isFr
        ? "La plupart des gens n'ouvrent la Bible qu'en cas de panique. Ce parcours transforme vos bons jours en fondations spirituelles inébranlables."
        : "Most believers only seek God when life falls apart. This 5-day track turns your good seasons into unshakable spiritual foundations.",
      days: [
        {
          day: 1,
          title: isFr ? "Rendre grâces en toutes choses" : "Gratitude in Every Circumstance",
          reference: isFr ? "1 Thessaloniciens 5:18 (Louis Segond)" : "1 Thessalonians 5:18 (ESV)",
          theme: isFr ? "La reconnaissance comme volonté de Dieu" : "Giving thanks as God's will for your life",
          scripture: isFr
            ? "« Rendez grâces en toutes choses, car c'est à votre égard la volonté de Dieu en Jésus-Christ. »"
            : "“Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.”",
          reflectionPrompt: isFr
            ? "Quelles sont les 3 grâces inattendues reçues au cours des 24 dernières heures que vous aviez presque oubliées de célébrer ?"
            : "What are 3 unexpected blessings from the past 24 hours that you almost overlooked?",
          prayer: isFr
            ? "« Merci Seigneur pour Ta bonté qui se renouvelle chaque matin. Ouvre mes yeux sur Tes bienfaits aujourd'hui. Amen. »"
            : "“Thank You Lord for Your steadfast love that is renewed every morning. Keep my heart watchful of Your goodness. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 2,
          title: isFr ? "N'oublie aucun de ses bienfaits" : "Forget Not His Benefits",
          reference: isFr ? "Psaume 103:2 (Louis Segond)" : "Psalm 103:2 (ESV)",
          theme: isFr ? "Énumérer les fidélités passées de Dieu" : "Cataloging God's tangible past mercies",
          scripture: isFr
            ? "« Mon âme, bénis l'Éternel, Et n'oublie aucun de ses bienfaits ! »"
            : "“Bless the Lord, O my soul, and forget not all his benefits.”",
          reflectionPrompt: isFr
            ? "Quel secours passé de Dieu renforce votre confiance pour les défis d'aujourd'hui ?"
            : "What past instance of God's provision brings reassurance to your heart right now?",
          prayer: isFr
            ? "« Mon âme Te bénit, Père. Merci pour Tes délivrances fidèles dans mon histoire. Amen. »"
            : "“My soul blesses You, Lord. Thank You for faithful deliverance across every chapter of my life. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 3,
          title: isFr ? "La reconnaissance au cœur" : "A Thankful Heart Governs",
          reference: isFr ? "Colossiens 3:15 (Louis Segond)" : "Colossians 3:15 (ESV)",
          theme: isFr ? "La louange comme bouclier contre l'amertume" : "Thanksgiving as a shield against cynicism",
          scripture: isFr
            ? "« Et que la paix de Christ règne dans vos cœurs... Et soyez reconnaissants. »"
            : "“And let the peace of Christ rule in your hearts... And be thankful.”",
          reflectionPrompt: isFr
            ? "Comment la gratitude peut-elle transformer une conversation difficile prévue aujourd'hui ?"
            : "How can proactive gratitude reshape a difficult conversation you might face today?",
          prayer: isFr
            ? "« Remplis mes paroles de bienveillance et de louange sincère envers chacun. Amen. »"
            : "“Fill my speech with gratitude and encouragement for everyone I meet today. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 4,
          title: isFr ? "Bontés renouvelées à l'aube" : "New Every Morning",
          reference: isFr ? "Lamentations 3:22-23 (Louis Segond)" : "Lamentations 3:22-23 (ESV)",
          theme: isFr ? "La grâce fraîche offerte chaque matin" : "Receiving fresh compassion at sunrise",
          scripture: isFr
            ? "« Les bontés de l'Éternel ne sont pas épuisées, Ses compassions ne sont pas à leur terme; Elles se renouvellent chaque matin. »"
            : "“The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.”",
          reflectionPrompt: isFr
            ? "De quelle grâce fraîche avez-vous besoin pour renouveler votre enthousiasme ce matin ?"
            : "What fresh mercy do you need to receive to sustain your energy and joy today?",
          prayer: isFr
            ? "« Grande est Ta fidélité, Seigneur. Merci pour ce nouveau jour et ce souffle de vie. Amen. »"
            : "“Great is Your faithfulness, Lord. Thank You for breath and purpose this morning. Amen.”",
          estimatedMinutes: 5,
        },
        {
          day: 5,
          title: isFr ? "Un sacrifice de louange continu" : "A Continual Sacrifice of Praise",
          reference: isFr ? "Hébreux 13:15 (Louis Segond)" : "Hebrews 13:15 (ESV)",
          theme: isFr ? "Faire de la reconnaissance un style de vie permanent" : "Living outward thankfulness as a sustained daily habit",
          scripture: isFr
            ? "« Par lui, offrons sans cesse à Dieu un sacrifice de louange, c'est-à-dire le fruit de lèvres qui confessent son nom. »"
            : "“Through him then let us continually offer up a sacrifice of praise to God, that is, the fruit of lips that acknowledge his name.”",
          reflectionPrompt: isFr
            ? "Comment allez-vous bénir quelqu'un d'autre aujourd'hui avec cette reconnaissance ?"
            : "How will you extend this grateful heart outward to bless a colleague or family member today?",
          prayer: isFr
            ? "« Que ma vie entière soit une offrande de gratitude. Merci pour ce parcours béni. Amen. »"
            : "“Let my daily routine be an ongoing offering of thanksgiving. Thank You for meeting me in prayer. Amen.”",
          estimatedMinutes: 5,
        },
      ],
    },
  ];

  const currentJourney = journeys.find((j) => j.id === selectedJourneyId) || journeys[0];
  const activeDay = currentJourney.days.find((d) => d.day === selectedDayNum) || currentJourney.days[0];

  function handleSelectJourney(j: PreSignupJourney) {
    setSelectedJourneyId(j.id);
    setSelectedDayNum(1);
    setIsPlayingAudioSample(false);
    trackEvent("pre_signup_journey_previewed", {
      journeyId: j.id,
      slug: j.slug,
      mood: j.moodKey,
    });
  }

  function handleToggleAudio() {
    if (isPlayingAudioSample) {
      setIsPlayingAudioSample(false);
    } else {
      setIsPlayingAudioSample(true);
      trackEvent("mood_preview_selected", {
        action: "audio_sample_played",
        journeyId: currentJourney.id,
        day: activeDay.day,
      });
    }
  }

  function handleStartJourney() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "lifebook_selected_journey",
          JSON.stringify({
            id: currentJourney.id,
            slug: currentJourney.slug,
            title: currentJourney.title,
            mood: currentJourney.moodKey,
            startedAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore local storage error
      }
    }
    trackEvent("pre_signup_journey_started", {
      journeyId: currentJourney.id,
      slug: currentJourney.slug,
      mood: currentJourney.moodKey,
    });
  }

  return (
    <section
      id="journey-preview"
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
      aria-label="Pre-signup 5-day journey preview and mood recommendation reasoning"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eee7f8] border border-[#d5c5ed] text-[#5e4b85] text-xs font-bold uppercase tracking-wider mb-3">
          <span>✦</span>
          <span>{isFr ? "Recommandation transparente · Aperçu sans inscription" : "Transparent Reasoning · Pre-Signup Preview"}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1e1931] tracking-tight mb-4">
          {isFr ? (
            <>
              Pourquoi LifeBook vous recommande ce parcours de 5 jours,{" "}
              <em className="font-normal italic text-[#705eaa]">avant même de créer un compte.</em>
            </>
          ) : (
            <>
              See why LifeBook recommends each 5-day journey{" "}
              <em className="font-normal italic text-[#705eaa]">before creating an account.</em>
            </>
          )}
        </h2>
        <p className="text-sm sm:text-base text-[#5e5370] leading-relaxed">
          {isFr
            ? "Les applications bibliques génériques vous imposent des listes généalogiques quand vous êtes épuisé. LifeBook adapte son parcours en fonction de votre état émotionnel et spirituel réel."
            : "Generic Bible apps hand you random 40-chapter reading plans regardless of how worn out you feel. LifeBook prescribes focused 5-day sprints calibrated to your exact emotional state."}
        </p>
      </div>

      {/* Mood Selector Switcher */}
      <div className="mb-8">
        <p className="text-center text-xs font-semibold text-[#705e8c] uppercase tracking-wider mb-3">
          {isFr ? "Sélectionnez votre état de cœur actuel pour tester la recommandation :" : "Select your current season or emotional state to test the recommendation:"}
        </p>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-4xl mx-auto"
          role="tablist"
          aria-label="Mood journey selectors"
        >
          {journeys.map((j) => {
            const isSelected = j.id === currentJourney.id;
            return (
              <button
                key={j.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleSelectJourney(j)}
                id={`journey-tab-${j.id}`}
                className={`flex flex-col items-start p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? "bg-[#2d2542] text-white border-[#2d2542] shadow-md scale-[1.02]"
                    : "bg-white/80 hover:bg-white text-[#2d2542] border-[#2d2542]/12 hover:border-[#2d2542]/25"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl" aria-hidden="true">
                    {j.moodIcon}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold bg-[#3bb582] text-white px-2 py-0.5 rounded-full">
                      {isFr ? "Actif" : "Active"}
                    </span>
                  )}
                </div>
                <strong className={`text-xs font-serif font-bold leading-tight ${isSelected ? "text-white" : "text-[#1e1931]"}`}>
                  {j.title}
                </strong>
                <span className={`text-[11px] mt-0.5 line-clamp-1 ${isSelected ? "text-white/70" : "text-[#705e8c]"}`}>
                  {j.moodName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="max-w-5xl mx-auto bg-[#faf7f2] rounded-3xl border border-[#2d2542]/12 shadow-xl overflow-hidden">
        {/* REASONING BANNER */}
        <div className="bg-gradient-to-r from-[#2d2542] to-[#3a2f54] text-white p-5 sm:p-7 border-b border-[#2d2542]/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[11px] font-bold tracking-wider uppercase border border-white/10">
                  <span>💡</span>
                  <span>{isFr ? "Pourquoi ce parcours vous est recommandé" : "Why this journey was recommended"}</span>
                </span>
                <span className="text-white/60 text-xs font-mono">• 5 {isFr ? "jours · 5 min/jour" : "days · 5 min/day"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white m-0">
                {currentJourney.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed m-0 italic font-serif">
                “{currentJourney.reasoning}”
              </p>
            </div>

            <div className="shrink-0 bg-white/10 rounded-2xl p-3 border border-white/10 text-center min-w-[170px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                {isFr ? "Format garanti" : "Guaranteed Format"}
              </span>
              <strong className="text-sm font-bold text-white block">
                {isFr ? "3 étapes en 5 minutes" : "3 Steps in 5 Minutes"}
              </strong>
              <small className="text-[11px] text-white/70 block mt-0.5">
                {isFr ? "Lire (90s) · Méditer (2m) · Prier (60s)" : "Read (90s) · Reflect (2m) · Pray (60s)"}
              </small>
            </div>
          </div>

          {/* Contrast vs generic apps callout */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-white/80">
            <span className="text-amber-300 font-bold shrink-0">vs.</span>
            <p className="m-0 leading-relaxed">
              <span className="text-white/50">{isFr ? "La différence avec les applications classiques :" : "The difference vs. standard Bible apps:"} </span>
              {currentJourney.contrastVsGeneric}
            </p>
          </div>
        </div>

        {/* 5-DAY PROGRESSION TABS */}
        <div className="bg-[#f0ebe1] px-4 sm:px-7 py-3 border-b border-[#2d2542]/10 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-bold text-[#705e8c] uppercase tracking-wider mr-2 shrink-0">
              {isFr ? "Plan des 5 jours :" : "5-Day Plan:"}
            </span>
            {currentJourney.days.map((day) => {
              const isCurrentDay = day.day === selectedDayNum;
              return (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => setSelectedDayNum(day.day)}
                  id={`day-select-btn-${day.day}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isCurrentDay
                      ? "bg-white text-[#2d2542] font-bold border-[#2d2542]/20 shadow-xs ring-1 ring-[#2d2542]/10"
                      : "bg-transparent text-[#705e8c] hover:bg-white/50 border-transparent"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isCurrentDay ? "bg-[#2d2542] text-white font-bold" : "bg-[#2d2542]/10 text-[#2d2542]"}`}>
                    {day.day}
                  </span>
                  <span>{day.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* P3 RETENTION PROTECTION BANNER & INTERACTIVE DEMO */}
        <div className="bg-[#f8f5fd] px-4 sm:px-7 py-3 border-b border-[#2d2542]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🛡️</span>
            <div>
              <span className="font-bold text-[#2d2542]">
                {isFr ? "Garantie anti-culpabilité : 2 Journées de Grâce incluses" : "Zero-Guilt Guarantee: 2 Journey Grace Days Included"}
              </span>
              <span className="text-[#64597b] ml-1.5 hidden sm:inline">
                {isFr
                  ? "— Si votre semaine s'emballe, votre progression n'est jamais réinitialisée à zéro."
                  : "— If work or life interrupts, your study never resets to Day 1. Grace holds your spot."}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGraceProtectionDemoOpen(!isGraceProtectionDemoOpen)}
            id="toggle-grace-demo-btn"
            className="px-3 py-1 rounded-lg bg-white hover:bg-[#ede6f7] border border-[#d8cfec] text-[#5e4b85] font-semibold text-[11px] shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{isGraceProtectionDemoOpen ? "▲" : "▼"}</span>
            <span>
              {isGraceProtectionDemoOpen
                ? (isFr ? "Masquer la démo de grâce" : "Hide Grace Demo")
                : (isFr ? "Tester l'effet d'une Journée de Grâce" : "Test Grace Day Effect")}
            </span>
          </button>
        </div>

        {/* EXPANDABLE GRACE RETENTION DEMO DRAWER */}
        {isGraceProtectionDemoOpen && (
          <div
            id="pre-signup-grace-demo-drawer"
            className="bg-[#faf5ff] p-4 sm:p-6 border-b border-[#e9d5ff] space-y-3 animate-fade-in text-xs text-[#4d4262]"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[#6b21a8] text-[11px] flex items-center gap-1.5">
                <span>🛡️</span>
                <span>{isFr ? "Simulation de protection de persévérance" : "Retention Science in Action"}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#6b21a8] font-bold text-[10px]">
                {isFr ? "Taux de complétion × 3,8" : "3.8x Completion Multiplier"}
              </span>
            </div>

            <p className="leading-relaxed m-0">
              {isFr
                ? "Dans les applications classiques, manquer le Jour 3 vous fait vous sentir coupable et 78 % des fidèles abandonnent l'application. Sur LifeBook, une Journée de Grâce s'active automatiquement :"
                : "In traditional Bible apps, missing Day 3 triggers an ugly broken chain icon, and 78% of people abandon the app out of guilt. In LifeBook, your Grace Shield steps in automatically:"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white border border-[#e9d5ff] space-y-1">
                <span className="font-bold text-[#1e1931] block">1. Spot Held in Peace</span>
                <span className="text-[#64597b] text-[11px] block">
                  {isFr ? "Votre Jour 3 reste ouvert sans pénalité." : "Day 3 is preserved without resetting to Day 1."}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e9d5ff] space-y-1">
                <span className="font-bold text-[#1e1931] block">2. 90-Second Catch-Up</span>
                <span className="text-[#64597b] text-[11px] block">
                  {isFr ? "Pas de double devoir : une simple respiration de 90s." : "No double homework: just a 90s reconnect prayer."}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e9d5ff] space-y-1">
                <span className="font-bold text-[#1e1931] block">3. Habit Momentum Stays</span>
                <span className="text-[#64597b] text-[11px] block">
                  {isFr ? "Votre série et vos points de grâce continuent." : "Your spiritual habit momentum remains intact."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* DAY CONTENT TEST DRIVE (Inside the Preview) */}
        <div className="p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#2d2542]/10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c]">
                {isFr ? `Jour ${activeDay.day} sur 5 · Aperçu interactif` : `Day ${activeDay.day} of 5 · Interactive Preview`}
              </span>
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#1e1931] mt-0.5 m-0">
                {activeDay.title}
              </h4>
              <p className="text-xs text-[#5e5370] m-0 mt-0.5 font-medium">
                {activeDay.theme}
              </p>
            </div>

            {/* Audio Toggle button */}
            <button
              type="button"
              onClick={handleToggleAudio}
              id="preview-audio-sample-btn"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                isPlayingAudioSample
                  ? "bg-[#2d2542] text-white border-[#2d2542] shadow-sm animate-pulse"
                  : "bg-white text-[#2d2542] border-[#2d2542]/20 hover:bg-[#f4efe4]"
              }`}
            >
              <span>{isPlayingAudioSample ? "⏸" : "▶"}</span>
              <span>
                {isPlayingAudioSample
                  ? (isFr ? "Commentaire audio actif (90s)" : "Playing Audio Devotion (90s)")
                  : (isFr ? "Écouter l'extrait vocal (90s)" : "Listen to Audio Sample (90s)")}
              </span>
            </button>
          </div>

          {/* STEP 1: SCRIPTURE BOX */}
          <div className="bg-white rounded-2xl p-5 border border-[#2d2542]/12 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#705e8c] bg-[#eee7f8] px-2.5 py-0.5 rounded-full">
                <span>📖</span>
                <span>{isFr ? "Étape 1 · Écriture Sainte (90s)" : "Step 1 · Scripture (90s)"}</span>
              </span>
              <span className="text-xs font-bold text-[#2d2542] bg-[#faf6ee] px-2 py-0.5 rounded-md border border-[#edd79d]/50">
                {activeDay.reference}
              </span>
            </div>

            <blockquote className="m-0 pl-4 border-l-2 border-[#705eaa]">
              <p className="font-serif text-base sm:text-lg text-[#1e1931] italic leading-relaxed m-0 font-medium">
                {activeDay.scripture}
              </p>
            </blockquote>
          </div>

          {/* STEP 2: REFLECTION PROMPT */}
          <div className="bg-[#faf6ee] rounded-2xl p-5 border border-[#edd79d] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#916212] bg-white px-2.5 py-0.5 rounded-full border border-[#edd79d]">
                <span>✍️</span>
                <span>{isFr ? "Étape 2 · Question de méditation (2 min)" : "Step 2 · Reflection Prompt (2 min)"}</span>
              </span>
              <span className="text-[11px] text-[#776e82]">
                {isFr ? "Sauvegarde locale privée" : "Stored locally & privately"}
              </span>
            </div>

            <p className="text-sm sm:text-base font-serif text-[#2d2542] leading-snug font-semibold m-0">
              {activeDay.reflectionPrompt}
            </p>

            {/* Interactive Scratchpad for immediate engagement */}
            <div className="pt-1">
              <input
                type="text"
                value={scratchpadNote}
                onChange={(e) => setScratchpadNote(e.target.value)}
                placeholder={
                  isFr
                    ? "Exprimez votre pensée ici pour tester votre journal (privé)..."
                    : "Type your reflection here to test the private journal experience..."
                }
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-[#2d2542]/15 text-[#2d2542] placeholder-[#8c8297] focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                id="pre-signup-scratchpad-input"
              />
            </div>
          </div>

          {/* STEP 3: GUIDED PRAYER */}
          <div className="bg-[#f0f6f3] rounded-2xl p-5 border border-[#cbe3d7] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1e5843] bg-white px-2.5 py-0.5 rounded-full border border-[#cbe3d7]">
                <span>🙏</span>
                <span>{isFr ? "Étape 3 · Prière guidée (60s)" : "Step 3 · Guided Prayer (60s)"}</span>
              </span>
              <span className="text-[11px] text-[#1e5843] font-semibold">
                {isFr ? "À réciter ou adapter" : "Pray aloud or adapt"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#1c3e34] italic leading-relaxed m-0 font-serif">
              {activeDay.prayer}
            </p>
          </div>

          {/* BOTTOM CONVERSION ACTION STRIP */}
          <div className="pt-4 border-t border-[#2d2542]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-4 rounded-2xl border">
            <div>
              <strong className="block text-sm font-bold text-[#1e1931]">
                {isFr
                  ? `Prêt à vivre le Jour 1 de « ${currentJourney.title} » ?`
                  : `Ready to start Day 1 of “${currentJourney.title}”?`}
              </strong>
              <small className="text-xs text-[#5e5370]">
                {isFr
                  ? "Rejoignez LifeBook gratuitement. Aucune carte bancaire requise. Protection de grâce incluse."
                  : "Join LifeBook free. Zero credit card required. Built-in grace days protect your streak."}
              </small>
            </div>

            <Link
              href={`/sign-up?journey=${currentJourney.slug}&mood=${currentJourney.moodKey}`}
              onClick={handleStartJourney}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#2d2542] hover:bg-[#1a1429] text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg shrink-0"
              id="start-pre-signup-journey-btn"
            >
              <span>{isFr ? "Commencer ce parcours (5 min)" : "Start this 5-Day Journey"}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PreSignupJourneyPreview;
