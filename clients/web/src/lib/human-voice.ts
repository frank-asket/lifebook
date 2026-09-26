"use client";

import { useState, useEffect, useCallback } from "react";
import { setChristianMelodyVoiceDucking } from "@/lib/christian-melodies";

export type VoiceRegionFamily = "african-ng" | "african-ci" | "american-us";

export interface HumanVoicePersona {
  id: string;
  name: string;
  region: VoiceRegionFamily;
  regionBadgeEn: string;
  regionBadgeFr: string;
  countryFlag: string;
  cityLabel: string;
  langCode: "en-NG" | "fr-CI" | "en-US";
  primaryLanguage: "en" | "fr";
  gender: "male" | "female";
  timbreEn: string;
  timbreFr: string;
  descriptionEn: string;
  descriptionFr: string;
  geminiVoiceName: "Charon" | "Kore" | "Fenrir" | "Puck" | "Zephyr";
  stylePrompt: string;
  baseRate: number;
  basePitch: number;
  sampleGreetingEn: string;
  sampleGreetingFr: string;
}

export const HUMAN_VOICE_PERSONAS: HumanVoicePersona[] = [
  {
    id: "ng-adewale",
    name: "Pastor Adewale",
    region: "african-ng",
    regionBadgeEn: "African · Nigerian (English)",
    regionBadgeFr: "Africain · Nigérian (Anglais)",
    countryFlag: "🇳🇬",
    cityLabel: "Lagos, Nigeria",
    langCode: "en-NG",
    primaryLanguage: "en",
    gender: "male",
    timbreEn: "Warm Nigerian Pastoral Baritone",
    timbreFr: "Baryton Pastoral Nigérian Chaleureux",
    descriptionEn:
      "Deep, resonant Nigerian English cadence with unhurried fatherly warmth and natural breath phrasing.",
    descriptionFr:
      "Cadence anglaise nigériane profonde et chaleureuse, avec une présence pastorale posée et naturelle.",
    geminiVoiceName: "Charon",
    stylePrompt:
      "Speak as Pastor Adewale from Lagos, Nigeria (en-NG accent). Warm, deeply human Nigerian English cadence, rich baritone resonance, gentle breath pauses between Scripture clauses, and fatherly pastoral encouragement.",
    baseRate: 0.92,
    basePitch: 0.91,
    sampleGreetingEn:
      "Peace be unto you, beloved. Let us slow down together and hear the living Word of God from Psalm 23. The Lord is my shepherd; I shall not want. He leads me beside still waters, and He restores my soul.",
    sampleGreetingFr:
      "Peace be unto you, beloved. The Lord is my shepherd; I shall not want. He leads me beside still waters, and He restores my soul.",
  },
  {
    id: "ng-ngozi",
    name: "Sister Ngozi",
    region: "african-ng",
    regionBadgeEn: "African · Nigerian (English)",
    regionBadgeFr: "Africaine · Nigériane (Anglais)",
    countryFlag: "🇳🇬",
    cityLabel: "Abuja, Nigeria",
    langCode: "en-NG",
    primaryLanguage: "en",
    gender: "female",
    timbreEn: "Gentle Nigerian Contemplative Alto",
    timbreFr: "Voix Contemplative Nigériane Douce",
    descriptionEn:
      "Melodious, comforting Nigerian English voice ideal for morning Scripture meditation and prayer.",
    descriptionFr:
      "Voix anglaise nigériane mélodieuse et rassurante, idéale pour la méditation matinale des Écritures.",
    geminiVoiceName: "Kore",
    stylePrompt:
      "Speak as Sister Ngozi from Abuja, Nigeria (en-NG accent). Gentle, deeply human Nigerian English woman's voice, warm melodic intonation, soft breathing, and tender reverence for Scripture.",
    baseRate: 0.93,
    basePitch: 1.04,
    sampleGreetingEn:
      "Good morning, dear friend. Take a quiet breath in God's presence. For I am sure that neither death nor life, nor things present nor things to come, will be able to separate us from the love of God in Christ Jesus.",
    sampleGreetingFr:
      "Good morning, dear friend. Take a quiet breath in God's presence. Nothing in all creation will be able to separate us from the love of God in Christ Jesus.",
  },
  {
    id: "ci-kouame",
    name: "Pasteur Kouamé",
    region: "african-ci",
    regionBadgeEn: "African · Côte d'Ivoire (French)",
    regionBadgeFr: "Africain · Côte d'Ivoire (Français)",
    countryFlag: "🇨🇮",
    cityLabel: "Abidjan, Côte d'Ivoire",
    langCode: "fr-CI",
    primaryLanguage: "fr",
    gender: "male",
    timbreEn: "Warm Ivorian Pastoral Voice (Français)",
    timbreFr: "Voix Pastorale Ivoirienne Chaleureuse",
    descriptionEn:
      "Authentic, dignified Abidjan Francophone cadence with deep West African warmth and unhurried grace.",
    descriptionFr:
      "Diction francophone d'Abidjan authentique, posée et profondément humaine, empreinte de paix pastorale.",
    geminiVoiceName: "Fenrir",
    stylePrompt:
      "Speak in French as Pasteur Kouamé from Abidjan, Côte d'Ivoire (fr-CI accent). Warm, deeply human Ivorian Francophone cadence, resonant West African voice, natural breath pauses, and compassionate pastoral authority.",
    baseRate: 0.92,
    basePitch: 0.92,
    sampleGreetingFr:
      "Que la paix du Seigneur soit avec toi, bien-aimé. Prenons un instant de calme ensemble dans le Psaume 23. L'Éternel est mon berger : je ne manquerai de rien. Il me dirige près des eaux paisibles, et Il restaure mon âme.",
    sampleGreetingEn:
      "Que la paix du Seigneur soit avec toi, bien-aimé. L'Éternel est mon berger : je ne manquerai de rien. Il me dirige près des eaux paisibles, et Il restaure mon âme.",
  },
  {
    id: "ci-adjoua",
    name: "Sœur Adjoua",
    region: "african-ci",
    regionBadgeEn: "African · Côte d'Ivoire (French)",
    regionBadgeFr: "Africaine · Côte d'Ivoire (Français)",
    countryFlag: "🇨🇮",
    cityLabel: "Yamoussoukro, Côte d'Ivoire",
    langCode: "fr-CI",
    primaryLanguage: "fr",
    gender: "female",
    timbreEn: "Soft Ivorian Devotional Voice (Français)",
    timbreFr: "Douce Voix Méditative Ivoirienne",
    descriptionEn:
      "Gentle, poetic Ivorian French delivery crafted for quiet evening reflection and Psalms.",
    descriptionFr:
      "Voix féminine ivoirienne douce, limpide et apaisante pour la lecture des Psaumes et la prière.",
    geminiVoiceName: "Zephyr",
    stylePrompt:
      "Speak in French as Sœur Adjoua from Côte d'Ivoire (fr-CI accent). Soft, deeply human Ivorian French woman's voice, warm and soothing West African prosody, gentle breathing, and peaceful intimacy.",
    baseRate: 0.93,
    basePitch: 1.05,
    sampleGreetingFr:
      "Bonjour et bienvenue dans ton sanctuaire. Respire paisiblement. Il n'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ. Rien ne pourra nous séparer de l'amour de Dieu.",
    sampleGreetingEn:
      "Bonjour et bienvenue dans ton sanctuaire. Il n'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.",
  },
  {
    id: "us-caleb",
    name: "Pastor Caleb",
    region: "american-us",
    regionBadgeEn: "American (US English)",
    regionBadgeFr: "Américain (Anglais US)",
    countryFlag: "🇺🇸",
    cityLabel: "Nashville, USA",
    langCode: "en-US",
    primaryLanguage: "en",
    gender: "male",
    timbreEn: "Soulful American Pastoral Baritone",
    timbreFr: "Baryton Pastoral Américain Chaleureux",
    descriptionEn:
      "Rich, conversational American studio voice with natural breathing and unhurried warmth.",
    descriptionFr:
      "Voix pastorale américaine chaleureuse et naturelle, au rythme posé et réconfortant.",
    geminiVoiceName: "Puck",
    stylePrompt:
      "Speak as Pastor Caleb, a soulful, deeply human American pastor from Nashville (en-US). Use warm conversational cadence, natural studio-mic intimacy, gentle breath pauses, and unhurried sincerity.",
    baseRate: 0.94,
    basePitch: 0.95,
    sampleGreetingEn:
      "Grace and peace to you this morning. Take a slow, quiet breath before the rush of the day begins. The Lord is my shepherd; I shall not want. He leads me beside still waters, and He restores my soul.",
    sampleGreetingFr:
      "Grace and peace to you this morning. The Lord is my shepherd; I shall not want. He leads me beside still waters, and He restores my soul.",
  },
  {
    id: "us-grace",
    name: "Sister Grace",
    region: "american-us",
    regionBadgeEn: "American (US English)",
    regionBadgeFr: "Américaine (Anglais US)",
    countryFlag: "🇺🇸",
    cityLabel: "Boston, USA",
    langCode: "en-US",
    primaryLanguage: "en",
    gender: "female",
    timbreEn: "Contemplative American Devotional Voice",
    timbreFr: "Voix Méditative Américaine Paisible",
    descriptionEn:
      "Clear, intimate, and soothing American devotional voice for daily Scripture and reflection.",
    descriptionFr:
      "Voix méditative américaine limpide, douce et intime pour la lecture biblique quotidienne.",
    geminiVoiceName: "Kore",
    stylePrompt:
      "Speak as Sister Grace, a calm, deeply human American devotional narrator (en-US). Use gentle conversational pacing, soft natural breaths, and warm spiritual clarity.",
    baseRate: 0.95,
    basePitch: 1.03,
    sampleGreetingEn:
      "Welcome into the quiet of your sanctuary. Abide in Me, and I in you. As the branch cannot bear fruit by itself unless it abides in the vine, neither can you, unless you abide in Me.",
    sampleGreetingFr:
      "Welcome into the quiet of your sanctuary. Abide in Me, and I in you, says the Lord.",
  },
];

export const VOICE_PERSONA_STORAGE_KEY = "lifebook.humanVoice.personaId.v1";
export const VOICE_PERSONA_CHANGE_EVENT = "lifebook-human-voice-changed";

export interface RegionalAccentOption {
  id: VoiceRegionFamily;
  flag: string;
  langCode: "en-NG" | "fr-CI" | "en-US";
  labelEn: string;
  labelFr: string;
  shortLabelEn: string;
  shortLabelFr: string;
  cadenceDescriptionEn: string;
  cadenceDescriptionFr: string;
  defaultPersonaId: string;
}

export const REGIONAL_ACCENT_OPTIONS: RegionalAccentOption[] = [
  {
    id: "african-ng",
    flag: "🇳🇬",
    langCode: "en-NG",
    labelEn: "Nigerian English (Lagos & Abuja)",
    labelFr: "Anglais Nigérian (Lagos & Abuja)",
    shortLabelEn: "Nigerian English",
    shortLabelFr: "Nigéria (EN)",
    cadenceDescriptionEn:
      "Warm West African pastoral resonance with unhurried rhythm and natural Scripture reverence.",
    cadenceDescriptionFr:
      "Résonance pastorale ouest-africaine chaleureuse au rythme posé et naturel.",
    defaultPersonaId: "ng-adewale",
  },
  {
    id: "african-ci",
    flag: "🇨🇮",
    langCode: "fr-CI",
    labelEn: "Côte d'Ivoire French (Abidjan)",
    labelFr: "Français de Côte d'Ivoire (Abidjan)",
    shortLabelEn: "Côte d'Ivoire French",
    shortLabelFr: "Côte d'Ivoire (FR)",
    cadenceDescriptionEn:
      "Authentic Abidjan Francophone warmth with gentle melodic prosody and deep pastoral peace.",
    cadenceDescriptionFr:
      "Chaleur francophone d'Abidjan authentique, mélodieuse et empreinte de paix pastorale.",
    defaultPersonaId: "ci-kouame",
  },
  {
    id: "american-us",
    flag: "🇺🇸",
    langCode: "en-US",
    labelEn: "American English (Nashville & Boston)",
    labelFr: "Anglais Américain (Nashville & Boston)",
    shortLabelEn: "American English",
    shortLabelFr: "Américain (EN)",
    cadenceDescriptionEn:
      "Intimate American studio narration with natural conversational breath pauses.",
    cadenceDescriptionFr:
      "Narration américaine intime et naturelle avec des respirations apaisantes.",
    defaultPersonaId: "us-caleb",
  },
];

export interface ScriptureNarrationPassage {
  id: string;
  referenceEn: string;
  referenceFr: string;
  themeEn: string;
  themeFr: string;
  textByRegion: Record<VoiceRegionFamily, string>;
}

export const SCRIPTURE_NARRATION_PASSAGES: ScriptureNarrationPassage[] = [
  {
    id: "psalm-23",
    referenceEn: "Psalm 23:1–3",
    referenceFr: "Psaume 23:1–3",
    themeEn: "Still Waters & Soul Restoration",
    themeFr: "Eaux Paisibles & Restauration",
    textByRegion: {
      "african-ng":
        "Beloved, hear the Word of the Lord from Psalm 23. The Lord is my shepherd; I shall not want. He makes me to lie down in green pastures; He leads me beside the still waters. He restores my soul.",
      "african-ci":
        "Bien-aimé, écoute la Parole du Seigneur dans le Psaume 23. L'Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles. Il restaure mon âme.",
      "american-us":
        "Take a quiet breath and listen to Psalm 23. The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
    },
  },
  {
    id: "romans-8",
    referenceEn: "Romans 8:38–39",
    referenceFr: "Romains 8:38–39",
    themeEn: "Unbreakable Love in Christ",
    themeFr: "L'Amour Inséparable en Christ",
    textByRegion: {
      "african-ng":
        "My brother, my sister, stand firm in Romans chapter 8. For I am persuaded that neither death nor life, nor angels nor principalities, nor things present nor things to come, shall be able to separate us from the love of God which is in Christ Jesus our Lord.",
      "african-ci":
        "Mon frère, ma sœur, demeure ferme dans Romains chapitre 8. Car j'ai l'assurance que ni la mort ni la vie, ni les anges ni les dominations, ni les choses présentes ni les choses à venir ne pourra nous séparer de l'amour de Dieu manifesté en Jésus-Christ notre Seigneur.",
      "american-us":
        "Rest in the promise of Romans 8. For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, will be able to separate us from the love of God in Christ Jesus our Lord.",
    },
  },
  {
    id: "john-15",
    referenceEn: "John 15:4–5",
    referenceFr: "Jean 15:4–5",
    themeEn: "Abiding in the True Vine",
    themeFr: "Demeurer dans le Vrai Cep",
    textByRegion: {
      "african-ng":
        "Listen to the words of Jesus in John chapter 15. Abide in Me, and I in you. As the branch cannot bear fruit of itself, unless it abides in the vine, neither can you, unless you abide in Me. For without Me, you can do nothing.",
      "african-ci":
        "Écoutons les paroles de Jésus dans Jean chapitre 15. Demeurez en moi, et je demeurerai en vous. Comme le sarment ne peut de lui-même porter du fruit, s'il ne demeure attaché au cep, ainsi vous ne le pouvez non plus, si vous ne demeurez en moi.",
      "american-us":
        "Hear the invitation of Jesus in John 15. Abide in Me, and I in you. Whoever abides in Me and I in him, he it is that bears much fruit, for apart from Me you can do nothing.",
    },
  },
];

let activePlaybackAbortController: AbortController | null = null;
let activeAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeClauseTimer: number | null = null;
let cachedBrowserVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const loadVoices = () => {
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        cachedBrowserVoices = list;
      }
    } catch {}
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function getPersonaById(id?: string | null): HumanVoicePersona {
  if (!id) return HUMAN_VOICE_PERSONAS[0];
  return HUMAN_VOICE_PERSONAS.find((p) => p.id === id) || HUMAN_VOICE_PERSONAS[0];
}

export function getSavedVoicePersona(isFrFallback = false): HumanVoicePersona {
  if (typeof window === "undefined") {
    return isFrFallback ? getPersonaById("ci-kouame") : getPersonaById("ng-adewale");
  }
  try {
    const savedId = localStorage.getItem(VOICE_PERSONA_STORAGE_KEY);
    if (savedId) {
      return getPersonaById(savedId);
    }
  } catch {}
  // Default to Nigerian English for EN and Côte d'Ivoire French for FR
  return isFrFallback ? getPersonaById("ci-kouame") : getPersonaById("ng-adewale");
}

export function setSavedVoicePersona(personaId: string): HumanVoicePersona {
  const persona = getPersonaById(personaId);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(VOICE_PERSONA_STORAGE_KEY, persona.id);
    } catch {}
    window.dispatchEvent(new CustomEvent(VOICE_PERSONA_CHANGE_EVENT, { detail: persona }));
  }
  return persona;
}

export function stopHumanVoice() {
  setChristianMelodyVoiceDucking(false);
  if (activePlaybackAbortController) {
    activePlaybackAbortController.abort();
    activePlaybackAbortController = null;
  }
  if (activeClauseTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(activeClauseTimer);
    activeClauseTimer = null;
  }
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {}
    activeSourceNode = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Selects the most natural, human-sounding browser neural voice for:
 * - Nigerian English (en-NG -> African English -> Natural/Neural English)
 * - Côte d'Ivoire French (fr-CI -> African French -> Natural/Neural French)
 * - American English (en-US Natural/Neural/Enhanced)
 */
function selectBestBrowserVoice(persona: HumanVoicePersona): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices =
    cachedBrowserVoices.length > 0
      ? cachedBrowserVoices
      : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const isMale = persona.gender === "male";

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    let score = 0;
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    const name = (v.name || "").toLowerCase();

    // High priority for Natural / Neural / Online / Enhanced / Premium voices (non-robotic)
    if (name.includes("natural") || name.includes("neural") || name.includes("online")) {
      score += 45;
    } else if (name.includes("enhanced") || name.includes("premium") || name.includes("google")) {
      score += 30;
    }
    if (!v.localService) {
      score += 12; // Cloud neural voices sound markedly more human
    }

    // Region matching
    if (persona.region === "african-ng") {
      if (lang === "en-ng" || name.includes("nigeria") || name.includes("abeo") || name.includes("ezinne")) {
        score += 120;
      } else if (
        lang === "en-gh" ||
        lang === "en-ke" ||
        lang === "en-tz" ||
        lang === "en-za" ||
        name.includes("africa")
      ) {
        score += 80;
      } else if (lang.startsWith("en-gb") || lang.startsWith("en-")) {
        score += 35;
      } else {
        return -100;
      }
    } else if (persona.region === "african-ci") {
      if (
        lang === "fr-ci" ||
        name.includes("ivoire") ||
        name.includes("abidjan")
      ) {
        score += 120;
      } else if (
        lang === "fr-sn" ||
        lang === "fr-cm" ||
        lang === "fr-cd" ||
        lang === "fr-ml" ||
        lang === "fr-bf" ||
        name.includes("afrique")
      ) {
        score += 85;
      } else if (lang.startsWith("fr")) {
        score += 45;
      } else {
        return -100;
      }
    } else if (persona.region === "american-us") {
      if (lang === "en-us") {
        score += 85;
      } else if (lang === "en-ca" || lang.startsWith("en")) {
        score += 35;
      } else {
        return -100;
      }
    }

    // Gender & known warm voice names matching
    const maleHints = [
      "abeo", "guy", "christopher", "andrew", "brian", "eric", "steffan", "roger",
      "henri", "remy", "rémy", "thomas", "paul", "daniel", "david", "alex", "evan",
      "nathan", "aaron", "arthur", "male", "homme",
    ];
    const femaleHints = [
      "ezinne", "jenny", "aria", "ava", "emma", "michelle", "ana", "samantha",
      "allison", "victoria", "denise", "eloise", "éloïse", "vivienne", "amelie",
      "amélie", "audrey", "aurelie", "aurélie", "marie", "julie", "female", "femme",
    ];

    if (isMale && maleHints.some((h) => name.includes(h))) score += 25;
    if (!isMale && femaleHints.some((h) => name.includes(h))) score += 25;

    return score;
  };

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -999;
  for (const v of voices) {
    const s = scoreVoice(v);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return bestScore > 0 ? best : voices[0] || null;
}

/**
 * Plays 24kHz PCM or encoded audio returned by Gemini Neural TTS through a Warm Studio Ribbon-Mic Filter
 * so the voice sounds intimate, warm, and free of digital harshness.
 */
async function playGeminiNeuralAudio(
  base64Audio: string,
  mimeType: string,
  playbackRate: number,
  onEnd?: () => void
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    if (!activeAudioCtx || activeAudioCtx.state === "closed") {
      activeAudioCtx = new AudioCtx({ sampleRate: 24000 });
    }
    if (activeAudioCtx.state === "suspended") {
      await activeAudioCtx.resume();
    }

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    let audioBuffer: AudioBuffer;
    if (mimeType.includes("pcm") || mimeType.includes("L16")) {
      // 16-bit signed little-endian PCM at 24000Hz
      const sampleCount = Math.floor(bytes.byteLength / 2);
      audioBuffer = activeAudioCtx.createBuffer(1, sampleCount, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < sampleCount; i++) {
        channelData[i] = dataView.getInt16(i * 2, true) / 32768;
      }
    } else {
      audioBuffer = await activeAudioCtx.decodeAudioData(bytes.buffer.slice(0));
    }

    const source = activeAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;

    // Warm studio vocal chain: gentle low-shelf warmth at 190Hz + soft silk high-cut at 6800Hz
    const warmShelf = activeAudioCtx.createBiquadFilter();
    warmShelf.type = "lowshelf";
    warmShelf.frequency.value = 190;
    warmShelf.gain.value = 2.4;

    const silkFilter = activeAudioCtx.createBiquadFilter();
    silkFilter.type = "lowpass";
    silkFilter.frequency.value = 6800;

    source.connect(warmShelf);
    warmShelf.connect(silkFilter);
    silkFilter.connect(activeAudioCtx.destination);

    activeSourceNode = source;
    source.onended = () => {
      if (activeSourceNode === source) {
        activeSourceNode = null;
      }
      onEnd?.();
    };
    source.start(0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Splits a paragraph into natural human breath clauses and speaks them with
 * subtle prosodic inflection and realistic breathing pauses between thoughts.
 */
function speakWithHumanizedBrowserProsody(params: {
  text: string;
  persona: HumanVoicePersona;
  playbackRate: number;
  signal: AbortSignal;
  onEnd?: () => void;
}) {
  const { text, persona, playbackRate, signal, onEnd } = params;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const chosenVoice = selectBestBrowserVoice(persona);

  // Split by sentence & major clause boundaries to insert natural human breath pauses
  const rawClauses = text
    .replace(/[“”«»]/g, "")
    .split(/(?<=[.!?;:—])\s+/)
    .map((c) => c.trim())
    .filter(Boolean);

  if (rawClauses.length === 0) {
    onEnd?.();
    return;
  }

  let idx = 0;

  const speakNextClause = () => {
    if (signal.aborted || idx >= rawClauses.length) {
      if (!signal.aborted) onEnd?.();
      return;
    }

    const clause = rawClauses[idx];
    const isLast = idx === rawClauses.length - 1;
    const isOpening = idx === 0;
    idx += 1;

    const utterance = new SpeechSynthesisUtterance(clause);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang || persona.langCode;
    } else {
      utterance.lang = persona.langCode;
    }

    // Subtle human prosody variation across clauses (opening warmth -> steady cadence -> gentle closing cadence)
    const rateMultiplier = isOpening ? 0.97 : isLast ? 0.94 : 1.0;
    const pitchDelta = isOpening ? 0.02 : isLast ? -0.03 : (idx % 2 === 0 ? 0.01 : -0.01);

    utterance.rate = Math.max(0.75, Math.min(1.45, persona.baseRate * playbackRate * rateMultiplier));
    utterance.pitch = Math.max(0.75, Math.min(1.25, persona.basePitch + pitchDelta));
    utterance.volume = 1;

    utterance.onend = () => {
      if (signal.aborted) return;
      if (isLast) {
        onEnd?.();
        return;
      }
      // Natural human breath pause (280ms–420ms) between Scripture clauses
      const pauseMs = clause.endsWith(".") || clause.endsWith("!") || clause.endsWith("?") ? 360 : 230;
      activeClauseTimer = window.setTimeout(speakNextClause, pauseMs);
    };

    utterance.onerror = () => {
      if (!signal.aborted) onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNextClause();
}

export function setSavedRegionalAccent(
  region: VoiceRegionFamily,
  preferGender?: "male" | "female"
): HumanVoicePersona {
  const current = getSavedVoicePersona(region === "african-ci");
  const targetGender = preferGender || current.gender || "male";
  const match =
    HUMAN_VOICE_PERSONAS.find((p) => p.region === region && p.gender === targetGender) ||
    HUMAN_VOICE_PERSONAS.find((p) => p.region === region) ||
    HUMAN_VOICE_PERSONAS[0];
  return setSavedVoicePersona(match.id);
}

export async function speakWithHumanVoice(options: {
  text: string;
  persona?: HumanVoicePersona;
  isFrFallback?: boolean;
  playbackRate?: number;
  onStart?: () => void;
  onEnd?: () => void;
}): Promise<void> {
  stopHumanVoice();
  setChristianMelodyVoiceDucking(true);

  const handleFinished = () => {
    setChristianMelodyVoiceDucking(false);
    options.onEnd?.();
  };

  const persona = options.persona || getSavedVoicePersona(options.isFrFallback);
  const playbackRate = options.playbackRate || 1;
  const abortController = new AbortController();
  activePlaybackAbortController = abortController;

  options.onStart?.();

  // 1. Attempt Server-Side Gemini Neural TTS (/api/tts) first for studio-grade human voice
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: options.text,
        personaId: persona.id,
        region: persona.region,
        lang: persona.langCode,
        geminiVoiceName: persona.geminiVoiceName,
        stylePrompt: persona.stylePrompt,
      }),
      signal: abortController.signal,
    });

    if (response.ok && !abortController.signal.aborted) {
      const data = await response.json();
      if (data.audioBase64 && !abortController.signal.aborted) {
        const played = await playGeminiNeuralAudio(
          data.audioBase64,
          data.mimeType || "audio/pcm;rate=24000",
          playbackRate,
          handleFinished
        );
        if (played) return;
      }
    }
  } catch {
    if (abortController.signal.aborted) return;
  }

  // 2. Fallback to Humanized Multi-Clause Browser Neural Engine with Nigerian, Ivorian, or American prosody
  if (!abortController.signal.aborted) {
    speakWithHumanizedBrowserProsody({
      text: options.text,
      persona,
      playbackRate,
      signal: abortController.signal,
      onEnd: handleFinished,
    });
  }
}

export function useHumanVoice(isFr = false) {
  const [activePersona, setActivePersona] = useState<HumanVoicePersona>(() =>
    getSavedVoicePersona(isFr)
  );
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    const sync = (e: Event) => {
      const custom = e as CustomEvent<HumanVoicePersona>;
      if (custom.detail) {
        setActivePersona(custom.detail);
      } else {
        setActivePersona(getSavedVoicePersona(isFr));
      }
    };
    window.addEventListener(VOICE_PERSONA_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VOICE_PERSONA_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [isFr]);

  const selectPersona = useCallback((personaId: string) => {
    const updated = setSavedVoicePersona(personaId);
    setActivePersona(updated);
    return updated;
  }, []);

  const previewPersona = useCallback(
    async (personaOrId?: HumanVoicePersona | string) => {
      const target =
        typeof personaOrId === "string"
          ? getPersonaById(personaOrId)
          : personaOrId || activePersona;

      const sampleText =
        target.primaryLanguage === "fr"
          ? target.sampleGreetingFr
          : isFr
          ? target.sampleGreetingFr
          : target.sampleGreetingEn;

      setIsPreviewing(true);
      await speakWithHumanVoice({
        text: sampleText,
        persona: target,
        onEnd: () => setIsPreviewing(false),
      });
    },
    [activePersona, isFr]
  );

  const selectRegionalAccent = useCallback(
    async (region: VoiceRegionFamily, autoNarrate = false) => {
      const updated = setSavedRegionalAccent(region, activePersona.gender);
      setActivePersona(updated);
      if (autoNarrate) {
        setIsPreviewing(true);
        const passage = SCRIPTURE_NARRATION_PASSAGES[0];
        const text =
          passage?.textByRegion[region] ||
          (updated.primaryLanguage === "fr"
            ? updated.sampleGreetingFr
            : updated.sampleGreetingEn);
        await speakWithHumanVoice({
          text,
          persona: updated,
          onEnd: () => setIsPreviewing(false),
        });
      }
      return updated;
    },
    [activePersona.gender]
  );

  const narrateScripturePassage = useCallback(
    async (passageId: string, personaOverride?: HumanVoicePersona) => {
      const target = personaOverride || activePersona;
      const passage =
        SCRIPTURE_NARRATION_PASSAGES.find((p) => p.id === passageId) ||
        SCRIPTURE_NARRATION_PASSAGES[0];
      const text = passage.textByRegion[target.region] || target.sampleGreetingEn;

      setIsPreviewing(true);
      await speakWithHumanVoice({
        text,
        persona: target,
        onEnd: () => setIsPreviewing(false),
      });
    },
    [activePersona]
  );

  const stopPreview = useCallback(() => {
    stopHumanVoice();
    setIsPreviewing(false);
  }, []);

  return {
    personas: HUMAN_VOICE_PERSONAS,
    regionalAccents: REGIONAL_ACCENT_OPTIONS,
    scripturePassages: SCRIPTURE_NARRATION_PASSAGES,
    activePersona,
    activeRegion: activePersona.region,
    selectPersona,
    selectRegionalAccent,
    previewPersona,
    narrateScripturePassage,
    stopPreview,
    isPreviewing,
  };
}
