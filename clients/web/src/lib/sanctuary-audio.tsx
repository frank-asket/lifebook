"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { teachings, recordTeachingListen, type Teaching } from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";
import {
  speakWithHumanVoice,
  stopHumanVoice,
  getSavedVoicePersona,
  setSavedVoicePersona,
  setSavedRegionalAccent,
  VOICE_PERSONA_CHANGE_EVENT,
  type HumanVoicePersona,
  type VoiceRegionFamily,
} from "@/lib/human-voice";
import {
  ChristianMelodiesService,
  startChristianMelody,
  stopChristianMelody,
  toggleChristianMelody,
  setChristianMelodyVolume,
  getSavedChristianMelody,
  isChristianMelodyPlaying,
  CHRISTIAN_MELODY_CHANGE_EVENT,
  type ChristianMelodyId,
  type ChristianMelodyPreset,
} from "@/lib/christian-melodies";

export interface SanctuaryChapterMarker {
  id: string;
  index: number;
  titleEn: string;
  titleFr: string;
  startSec: number;
  endSec: number;
  spokenTextEn: string;
  spokenTextFr: string;
}

export interface SanctuaryAudioTrack {
  id: string;
  slug: string;
  titleEn: string;
  titleFr: string;
  teacher: string;
  teacherRoleEn: string;
  teacherRoleFr: string;
  scriptureEn: string;
  scriptureFr: string;
  categoryEn: string;
  categoryFr: string;
  durationLabelEn: string;
  durationLabelFr: string;
  durationSec: number;
  portrait: string;
  excerptEn: string;
  excerptFr: string;
  audioUrl?: string;
  chapters: SanctuaryChapterMarker[];
}

export type AmbientSoundscape =
  | "none"
  | "amazing-grace"
  | "it-is-well"
  | "be-thou-my-vision"
  | "holy-holy-holy"
  | "great-faithfulness"
  | "selah-worship"
  | "still-waters"
  | "warm-cello"
  | "morning-rain";
export type PlaybackSpeed = 1 | 1.25 | 1.5;
export type SleepTimerOption = null | 5 | 15 | 30;

interface SanctuaryAudioContextValue {
  tracks: SanctuaryAudioTrack[];
  currentTrack: SanctuaryAudioTrack | null;
  queue: SanctuaryAudioTrack[];
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  playbackSpeed: PlaybackSpeed;
  sleepTimerMinutes: SleepTimerOption;
  sleepTimerRemainingSec: number | null;
  ambientBed: AmbientSoundscape;
  activeChapter: SanctuaryChapterMarker | null;
  voicePersona: HumanVoicePersona;
  melodyOverlayPresets: ChristianMelodyPreset[];
  melodyOverlayId: ChristianMelodyId;
  activeMelodyPreset: ChristianMelodyPreset;
  isMelodyOverlayPlaying: boolean;
  melodyOverlayVolume: number;
  overlayDuringMeditation: boolean;
  isExpanded: boolean;
  isMinimized: boolean;
  playTrack: (trackOrSlug: SanctuaryAudioTrack | string, customQueue?: SanctuaryAudioTrack[]) => void;
  playTeaching: (teaching: Teaching) => void;
  togglePlay: () => void;
  pause: () => void;
  closePlayer: () => void;
  seekTo: (seconds: number) => void;
  skipBy: (deltaSec: number) => void;
  selectChapter: (chapterIndex: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  cyclePlaybackSpeed: () => void;
  setSleepTimer: (minutes: SleepTimerOption) => void;
  setAmbientBed: (bed: AmbientSoundscape) => void;
  setVoicePersona: (personaId: string) => void;
  setRegionalVoiceAccent: (region: VoiceRegionFamily) => void;
  startMelodyOverlay: (melodyId?: ChristianMelodyId, volume?: number) => void;
  stopMelodyOverlay: () => void;
  toggleMelodyOverlay: (melodyId?: ChristianMelodyId) => void;
  setMelodyOverlayVolume: (volume: number) => void;
  setOverlayDuringMeditation: (enabled: boolean) => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
}

const STORAGE_KEY = "lifebook.sanctuaryAudio.state";

function buildChaptersForTeaching(t: Teaching, totalSec: number): SanctuaryChapterMarker[] {
  const c1End = Math.round(totalSec * 0.2);
  const c2End = Math.round(totalSec * 0.48);
  const c3End = Math.round(totalSec * 0.82);

  return [
    {
      id: `${t.slug}-ch-1`,
      index: 0,
      titleEn: "01. Scripture Reading",
      titleFr: "01. Lecture de l'Écriture",
      startSec: 0,
      endSec: c1End,
      spokenTextEn: `${t.title}. With ${t.teacher}. Today's Scripture reading is from ${t.scripture}. ${t.excerpt}`,
      spokenTextFr: `${t.titleFr}. Par ${t.teacher}. Lecture biblique du jour dans ${t.scriptureFr}. ${t.excerptFr}`,
    },
    {
      id: `${t.slug}-ch-2`,
      index: 1,
      titleEn: "02. Historical & Covenant Context",
      titleFr: "02. Contexte de l'Alliance",
      startSec: c1End,
      endSec: c2End,
      spokenTextEn: `Context and background on ${t.scripture}. ${t.teaching.slice(0, Math.floor(t.teaching.length / 2))}`,
      spokenTextFr: `Contexte spirituel de ${t.scriptureFr}. ${t.teachingFr.slice(0, Math.floor(t.teachingFr.length / 2))}`,
    },
    {
      id: `${t.slug}-ch-3`,
      index: 2,
      titleEn: "03. Pastoral Exposition",
      titleFr: "03. Méditation Pastorale",
      startSec: c2End,
      endSec: c3End,
      spokenTextEn: t.teaching.slice(Math.floor(t.teaching.length / 2)),
      spokenTextFr: t.teachingFr.slice(Math.floor(t.teachingFr.length / 2)),
    },
    {
      id: `${t.slug}-ch-4`,
      index: 3,
      titleEn: "04. Guided Stillness & Prayer",
      titleFr: "04. Silence Guidé & Prière",
      startSec: c3End,
      endSec: totalSec,
      spokenTextEn: `Let us pause in stillness before the Lord. Father, anchor this word from ${t.scripture} deep within our hearts today. Amen.`,
      spokenTextFr: `Prenons un moment de silence devant le Seigneur. Père, ancre cette parole de ${t.scriptureFr} dans nos cœurs aujourd'hui. Amen.`,
    },
  ];
}

const PSALM_MEDITATION_TRACKS: SanctuaryAudioTrack[] = [
  {
    id: "psalm-23-sanctuary",
    slug: "psalm-23-still-waters",
    titleEn: "Psalm 23 · Beside Still Waters",
    titleFr: "Psaume 23 · Près des Eaux Paisibles",
    teacher: "Pastor Asket",
    teacherRoleEn: "Contemplative Scripture Audio",
    teacherRoleFr: "Méditation Audio des Psaumes",
    scriptureEn: "Psalm 23:1-6 (ESV)",
    scriptureFr: "Psaume 23:1-6 (LSG)",
    categoryEn: "Psalms Audio",
    categoryFr: "Psaumes Audio",
    durationLabelEn: "5 min",
    durationLabelFr: "5 min",
    durationSec: 300,
    portrait: "/AsketOfficialPic (1).png",
    excerptEn: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters.",
    excerptFr: "L'Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles.",
    chapters: [
      {
        id: "ps23-ch1",
        index: 0,
        titleEn: "01. Entering Stillness",
        titleFr: "01. Entrer dans le Calme",
        startSec: 0,
        endSec: 65,
        spokenTextEn: "Take a slow, unhurried breath. The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters.",
        spokenTextFr: "Prenez une grande respiration paisible. L'Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages.",
      },
      {
        id: "ps23-ch2",
        index: 1,
        titleEn: "02. Soul Restoration",
        titleFr: "02. Restauration de l'Âme",
        startSec: 65,
        endSec: 150,
        spokenTextEn: "He restores my soul. He leads me in paths of righteousness for his name's sake. Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me.",
        spokenTextFr: "Il restaure mon âme, Il me conduit dans les sentiers de la justice, à cause de son nom. Quand je marche dans la vallée de l'ombre de la mort, je ne crains aucun mal, car tu es avec moi.",
      },
      {
        id: "ps23-ch3",
        index: 2,
        titleEn: "03. The Shepherd's Table",
        titleFr: "03. La Table du Berger",
        startSec: 150,
        endSec: 235,
        spokenTextEn: "You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.",
        spokenTextFr: "Tu dresses devant moi une table, en face de mes adversaires ; Tu oins d'huile ma tête, et ma coupe déborde.",
      },
      {
        id: "ps23-ch4",
        index: 3,
        titleEn: "04. Goodness & Mercy Prayer",
        titleFr: "04. Prière de Grâce et Bonté",
        startSec: 235,
        endSec: 300,
        spokenTextEn: "Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever. Amen.",
        spokenTextFr: "Oui, le bonheur et la grâce m'accompagneront tous les jours de ma vie, et j'habiterai dans la maison de l'Éternel jusqu'à la fin de mes jours. Amen.",
      },
    ],
  },
  {
    id: "romans-8-sanctuary",
    slug: "romans-8-unbreakable-grace",
    titleEn: "Romans 8 · Unbreakable Covenant Love",
    titleFr: "Romains 8 · L'Amour Inséparable en Christ",
    teacher: "Dr. Esther Laurent",
    teacherRoleEn: "Scripture Assurance Meditation",
    teacherRoleFr: "Méditation d'Assurance Biblique",
    scriptureEn: "Romans 8:31-39 (ESV)",
    scriptureFr: "Romains 8:31-39 (LSG)",
    categoryEn: "Scripture Meditation",
    categoryFr: "Méditation Biblique",
    durationLabelEn: "6 min",
    durationLabelFr: "6 min",
    durationSec: 360,
    portrait: "/myself.jpeg",
    excerptEn: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come will be able to separate us from the love of God.",
    excerptFr: "Car j'ai l'assurance que ni la mort ni la vie, ni les anges ni les dominations ne pourra nous séparer de l'amour de Dieu en Jésus-Christ.",
    chapters: [
      {
        id: "rom8-ch1",
        index: 0,
        titleEn: "01. No Condemnation in Christ",
        titleFr: "01. Aucune Condamnation",
        startSec: 0,
        endSec: 90,
        spokenTextEn: "There is therefore now no condemnation for those who are in Christ Jesus. If God is for us, who can be against us?",
        spokenTextFr: "Il n'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ. Si Dieu est pour nous, qui sera contre nous ?",
      },
      {
        id: "rom8-ch2",
        index: 1,
        titleEn: "02. More Than Conquerors",
        titleFr: "02. Plus que Vainqueurs",
        startSec: 90,
        endSec: 200,
        spokenTextEn: "Who shall separate us from the love of Christ? Shall tribulation, or distress, or famine, or peril? No, in all these things we are more than conquerors through him who loved us.",
        spokenTextFr: "Qui nous séparera de l'amour de Christ ? Mais dans toutes ces choses nous sommes plus que vainqueurs par celui qui nous a aimés.",
      },
      {
        id: "rom8-ch3",
        index: 2,
        titleEn: "03. Held by Sovereign Grace",
        titleFr: "03. Gardés par la Grâce",
        startSec: 200,
        endSec: 290,
        spokenTextEn: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, will be able to separate us from the love of God in Christ Jesus our Lord.",
        spokenTextFr: "Car j'ai l'assurance que ni la mort ni la vie, ni les choses présentes ni les choses à venir ne pourra nous séparer de l'amour de Dieu manifesté en Jésus-Christ.",
      },
      {
        id: "rom8-ch4",
        index: 3,
        titleEn: "04. Closing Prayer of Trust",
        titleFr: "04. Prière de Confiance",
        startSec: 290,
        endSec: 360,
        spokenTextEn: "Lord Jesus, we rest today not in the strength of our grip on You, but in Your unbreakable grip on us. Amen.",
        spokenTextFr: "Seigneur Jésus, nous nous reposons aujourd'hui dans Ta fidélité inébranlable envers nous. Amen.",
      },
    ],
  },
];

export const ALL_SANCTUARY_TRACKS: SanctuaryAudioTrack[] = [
  ...teachings.map((t): SanctuaryAudioTrack => {
    const match = t.duration.match(/\d+/);
    const mins = match ? parseInt(match[0], 10) : 9;
    const durationSec = mins * 60;
    return {
      id: `teaching-${t.slug}`,
      slug: t.slug,
      titleEn: t.title,
      titleFr: t.titleFr,
      teacher: t.teacher,
      teacherRoleEn: t.teacherRole,
      teacherRoleFr: t.teacherRoleFr,
      scriptureEn: t.scripture,
      scriptureFr: t.scriptureFr,
      categoryEn: t.category,
      categoryFr: t.categoryFr,
      durationLabelEn: t.duration,
      durationLabelFr: t.durationFr,
      durationSec,
      portrait: t.portrait,
      excerptEn: t.excerpt,
      excerptFr: t.excerptFr,
      audioUrl: t.audioUrl,
      chapters: buildChaptersForTeaching(t, durationSec),
    };
  }),
  ...PSALM_MEDITATION_TRACKS,
];

const SanctuaryAudioContext = createContext<SanctuaryAudioContextValue | null>(null);

function getInitialSavedAudioState(): {
  track: SanctuaryAudioTrack | null;
  timeSec: number;
  speed: PlaybackSpeed;
  bed: AmbientSoundscape;
} {
  if (typeof window === "undefined") {
    return { track: null, timeSec: 0, speed: 1, bed: "amazing-grace" };
  }
  try {
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw);
      const found = ALL_SANCTUARY_TRACKS.find((t) => t.slug === parsed.slug) || null;
      const timeSec = typeof parsed.currentTimeSec === "number" ? parsed.currentTimeSec : 0;
      const speed: PlaybackSpeed =
        parsed.playbackSpeed === 1 || parsed.playbackSpeed === 1.25 || parsed.playbackSpeed === 1.5
          ? parsed.playbackSpeed
          : 1;
      const bed: AmbientSoundscape = parsed.ambientBed || "amazing-grace";
      return { track: found, timeSec, speed, bed };
    }
  } catch {
    // ignore
  }
  return { track: null, timeSec: 0, speed: 1, bed: "amazing-grace" };
}

export function SanctuaryAudioProvider({ children }: { children: React.ReactNode }) {
  const { isFr } = useLanguage();

  const [currentTrack, setCurrentTrack] = useState<SanctuaryAudioTrack | null>(
    () => getInitialSavedAudioState().track
  );
  const [queue, setQueue] = useState<SanctuaryAudioTrack[]>(ALL_SANCTUARY_TRACKS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(
    () => getInitialSavedAudioState().timeSec
  );
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(
    () => getInitialSavedAudioState().speed
  );
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<SleepTimerOption>(null);
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number | null>(null);
  const [ambientBed, setAmbientBed] = useState<AmbientSoundscape>(
    () => getInitialSavedAudioState().bed
  );
  const [voicePersona, setVoicePersonaState] = useState<HumanVoicePersona>(() =>
    getSavedVoicePersona(isFr)
  );
  const [melodyOverlayId, setMelodyOverlayIdState] = useState<ChristianMelodyId>(
    () => getSavedChristianMelody().melodyId
  );
  const [isMelodyOverlayPlaying, setIsMelodyOverlayPlaying] = useState<boolean>(
    () => isChristianMelodyPlaying()
  );
  const [melodyOverlayVolume, setMelodyOverlayVolumeState] = useState<number>(
    () => getSavedChristianMelody().volume
  );
  const [overlayDuringMeditation, setOverlayDuringMeditation] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const ambientNodesRef = useRef<{ stop: () => void } | null>(null);
  const lastSpokenChapterRef = useRef<string | null>(null);
  const wasPlayingTrackRef = useRef<boolean>(false);

  useEffect(() => {
    const syncPersona = (e: Event) => {
      const custom = e as CustomEvent<HumanVoicePersona>;
      if (custom.detail) {
        setVoicePersonaState(custom.detail);
        lastSpokenChapterRef.current = null;
      } else {
        setVoicePersonaState(getSavedVoicePersona(isFr));
      }
    };
    window.addEventListener(VOICE_PERSONA_CHANGE_EVENT, syncPersona);
    return () => window.removeEventListener(VOICE_PERSONA_CHANGE_EVENT, syncPersona);
  }, [isFr]);

  // Synchronize Christian Melody Overlay state from ChristianMelodiesService
  useEffect(() => {
    const syncMelody = (e: Event) => {
      const custom = e as CustomEvent<{
        melodyId: ChristianMelodyId;
        isPlaying: boolean;
        volume: number;
      }>;
      if (custom.detail) {
        setMelodyOverlayIdState(custom.detail.melodyId);
        setIsMelodyOverlayPlaying(custom.detail.isPlaying);
        setMelodyOverlayVolumeState(custom.detail.volume);
      }
    };
    window.addEventListener(CHRISTIAN_MELODY_CHANGE_EVENT, syncMelody);
    return () => window.removeEventListener(CHRISTIAN_MELODY_CHANGE_EVENT, syncMelody);
  }, []);

  const setVoicePersona = useCallback((personaId: string) => {
    const updated = setSavedVoicePersona(personaId);
    setVoicePersonaState(updated);
    lastSpokenChapterRef.current = null;
  }, []);

  const setRegionalVoiceAccent = useCallback(
    (region: VoiceRegionFamily) => {
      const updated = setSavedRegionalAccent(region, voicePersona.gender);
      setVoicePersonaState(updated);
      lastSpokenChapterRef.current = null;
    },
    [voicePersona.gender]
  );

  const startMelodyOverlay = useCallback(
    (melodyId?: ChristianMelodyId, volume?: number) => {
      const resolvedId =
        melodyId ||
        (ambientBed !== "none" &&
        ambientBed !== "still-waters" &&
        ambientBed !== "warm-cello" &&
        ambientBed !== "morning-rain"
          ? (ambientBed as ChristianMelodyId)
          : melodyOverlayId === "none"
          ? "amazing-grace"
          : melodyOverlayId);
      setAmbientBed(resolvedId);
      ChristianMelodiesService.startOverlay(resolvedId, volume);
    },
    [ambientBed, melodyOverlayId]
  );

  const stopMelodyOverlay = useCallback(() => {
    ChristianMelodiesService.stopOverlay();
  }, []);

  const toggleMelodyOverlay = useCallback(
    (melodyId?: ChristianMelodyId) => {
      const playing = toggleChristianMelody(melodyId);
      if (playing && melodyId && melodyId !== "none") {
        setAmbientBed(melodyId);
      }
    },
    []
  );

  const setMelodyOverlayVolume = useCallback((volume: number) => {
    setChristianMelodyVolume(volume);
    setMelodyOverlayVolumeState(volume);
  }, []);

  // Persist current track & timestamp
  useEffect(() => {
    if (typeof window === "undefined" || !currentTrack) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          slug: currentTrack.slug,
          currentTimeSec,
          playbackSpeed,
          ambientBed,
        })
      );
    } catch {
      // ignore
    }
  }, [currentTrack, currentTimeSec, playbackSpeed, ambientBed]);

  const stopSpeech = useCallback(() => {
    stopHumanVoice();
    lastSpokenChapterRef.current = null;
  }, []);

  const stopAmbientNodes = useCallback(() => {
    stopChristianMelody();
    if (ambientNodesRef.current) {
      try {
        ambientNodesRef.current.stop();
      } catch {
        // ignore
      }
      ambientNodesRef.current = null;
    }
  }, []);

  // Start or stop Christian Melodies & Worship Instrumentals when meditating/playing
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isPlaying) {
      if (wasPlayingTrackRef.current && !overlayDuringMeditation) {
        stopAmbientNodes();
      }
      wasPlayingTrackRef.current = false;
      return;
    }

    wasPlayingTrackRef.current = true;

    if (ambientBed === "none" || !overlayDuringMeditation) {
      stopAmbientNodes();
      return;
    }

    const mappedMelodyId: ChristianMelodyId =
      ambientBed === "still-waters"
        ? "selah-worship"
        : ambientBed === "warm-cello"
        ? "amazing-grace"
        : ambientBed === "morning-rain"
        ? "it-is-well"
        : (ambientBed as ChristianMelodyId);

    startChristianMelody(mappedMelodyId);
  }, [isPlaying, ambientBed, overlayDuringMeditation, stopAmbientNodes]);

  const durationSec = currentTrack?.durationSec || 300;

  const activeChapter = useMemo<SanctuaryChapterMarker | null>(() => {
    if (!currentTrack || !currentTrack.chapters.length) return null;
    const found = currentTrack.chapters.find(
      (ch) => currentTimeSec >= ch.startSec && currentTimeSec < ch.endSec
    );
    return found || currentTrack.chapters[currentTrack.chapters.length - 1];
  }, [currentTrack, currentTimeSec]);

  // Speak chapter text using Human Voice Engine (Nigerian EN, Côte d'Ivoire FR, or American EN)
  useEffect(() => {
    if (!isPlaying || !currentTrack || !activeChapter) {
      if (!isPlaying) stopSpeech();
      return;
    }

    const chapterKey = `${currentTrack.slug}:${activeChapter.id}:${voicePersona.id}:${playbackSpeed}`;
    if (lastSpokenChapterRef.current === chapterKey) return;
    lastSpokenChapterRef.current = chapterKey;

    const text =
      voicePersona.primaryLanguage === "fr"
        ? activeChapter.spokenTextFr
        : activeChapter.spokenTextEn;

    speakWithHumanVoice({
      text,
      persona: voicePersona,
      playbackRate: playbackSpeed,
    });
  }, [isPlaying, currentTrack, activeChapter, voicePersona, playbackSpeed, stopSpeech]);

  // Main progress & sleep timer tick
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      setCurrentTimeSec((prev) => {
        const step = playbackSpeed;
        const next = prev + step;
        if (next >= currentTrack.durationSec) {
          // Advance to next track in queue if available
          const currentIdx = queue.findIndex((t) => t.slug === currentTrack.slug);
          if (currentIdx >= 0 && currentIdx < queue.length - 1) {
            const nextInQueue = queue[currentIdx + 1];
            setCurrentTrack(nextInQueue);
            lastSpokenChapterRef.current = null;
            return 0;
          }
          setIsPlaying(false);
          return currentTrack.durationSec;
        }
        return next;
      });

      setSleepTimerRemainingSec((prevRem) => {
        if (prevRem === null) return null;
        if (prevRem <= 1) {
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          return null;
        }
        return prevRem - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, playbackSpeed, queue]);

  const playTrack = useCallback(
    (trackOrSlug: SanctuaryAudioTrack | string, customQueue?: SanctuaryAudioTrack[]) => {
      const resolved =
        typeof trackOrSlug === "string"
          ? ALL_SANCTUARY_TRACKS.find((t) => t.slug === trackOrSlug || t.id === trackOrSlug) ||
            ALL_SANCTUARY_TRACKS[0]
          : trackOrSlug;

      if (customQueue && customQueue.length > 0) {
        setQueue(customQueue);
      }

      if (currentTrack?.slug !== resolved.slug) {
        stopSpeech();
        setCurrentTrack(resolved);
        setCurrentTimeSec(0);
      }
      setIsMinimized(false);
      setIsPlaying(true);
    },
    [currentTrack, stopSpeech]
  );

  const playTeaching = useCallback(
    (teaching: Teaching) => {
      recordTeachingListen(teaching.slug);
      const match = ALL_SANCTUARY_TRACKS.find((t) => t.slug === teaching.slug);
      if (match) {
        playTrack(match);
        return;
      }
      const minsMatch = teaching.duration.match(/\d+/);
      const mins = minsMatch ? parseInt(minsMatch[0], 10) : 12;
      const durationSec = mins * 60;
      const dynamicTrack: SanctuaryAudioTrack = {
        id: `teaching-${teaching.slug}`,
        slug: teaching.slug,
        titleEn: teaching.title,
        titleFr: teaching.titleFr,
        teacher: teaching.teacher,
        teacherRoleEn: teaching.teacherRole,
        teacherRoleFr: teaching.teacherRoleFr,
        scriptureEn: teaching.scripture,
        scriptureFr: teaching.scriptureFr,
        categoryEn: teaching.category,
        categoryFr: teaching.categoryFr,
        durationLabelEn: teaching.duration,
        durationLabelFr: teaching.durationFr,
        durationSec,
        portrait: teaching.portrait,
        excerptEn: teaching.excerpt,
        excerptFr: teaching.excerptFr,
        audioUrl: teaching.audioUrl,
        chapters: buildChaptersForTeaching(teaching, durationSec),
      };
      playTrack(dynamicTrack);
    },
    [playTrack]
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      setCurrentTrack(ALL_SANCTUARY_TRACKS[0]);
      setCurrentTimeSec(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => {
      if (prev) stopSpeech();
      return !prev;
    });
  }, [currentTrack, stopSpeech]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopSpeech();
  }, [stopSpeech]);

  const closePlayer = useCallback(() => {
    setIsPlaying(false);
    stopSpeech();
    stopAmbientNodes();
    setIsExpanded(false);
    setCurrentTrack(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [stopSpeech, stopAmbientNodes]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!currentTrack) return;
      const clamped = Math.max(0, Math.min(currentTrack.durationSec, seconds));
      lastSpokenChapterRef.current = null;
      setCurrentTimeSec(clamped);
    },
    [currentTrack]
  );

  const skipBy = useCallback(
    (deltaSec: number) => {
      if (!currentTrack) return;
      setCurrentTimeSec((prev) => {
        const clamped = Math.max(0, Math.min(currentTrack.durationSec, prev + deltaSec));
        lastSpokenChapterRef.current = null;
        return clamped;
      });
    },
    [currentTrack]
  );

  const selectChapter = useCallback(
    (chapterIndex: number) => {
      if (!currentTrack) return;
      const target = currentTrack.chapters[chapterIndex];
      if (!target) return;
      lastSpokenChapterRef.current = null;
      setCurrentTimeSec(target.startSec);
      setIsPlaying(true);
    },
    [currentTrack]
  );

  const nextTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.slug === currentTrack.slug);
    const nextIdx = (idx + 1) % queue.length;
    stopSpeech();
    setCurrentTrack(queue[nextIdx]);
    setCurrentTimeSec(0);
    setIsPlaying(true);
  }, [currentTrack, queue, stopSpeech]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    if (currentTimeSec > 8) {
      lastSpokenChapterRef.current = null;
      setCurrentTimeSec(0);
      return;
    }
    const idx = queue.findIndex((t) => t.slug === currentTrack.slug);
    const prevIdx = (idx - 1 + queue.length) % queue.length;
    stopSpeech();
    setCurrentTrack(queue[prevIdx]);
    setCurrentTimeSec(0);
    setIsPlaying(true);
  }, [currentTrack, queue, currentTimeSec, stopSpeech]);

  const cyclePlaybackSpeed = useCallback(() => {
    const speeds: PlaybackSpeed[] = [1, 1.25, 1.5];
    setPlaybackSpeed((prev) => {
      const next = speeds[(speeds.indexOf(prev) + 1) % speeds.length];
      lastSpokenChapterRef.current = null;
      return next;
    });
  }, []);

  const setSleepTimer = useCallback((minutes: SleepTimerOption) => {
    setSleepTimerMinutes(minutes);
    setSleepTimerRemainingSec(minutes ? minutes * 60 : null);
  }, []);

  const activeMelodyPreset = useMemo<ChristianMelodyPreset>(
    () =>
      ChristianMelodiesService.getPresetById(
        melodyOverlayId === "none" ? "amazing-grace" : melodyOverlayId
      ),
    [melodyOverlayId]
  );

  const value = useMemo<SanctuaryAudioContextValue>(
    () => ({
      tracks: ALL_SANCTUARY_TRACKS,
      currentTrack,
      queue,
      isPlaying,
      currentTimeSec,
      durationSec,
      playbackSpeed,
      sleepTimerMinutes,
      sleepTimerRemainingSec,
      ambientBed,
      activeChapter,
      voicePersona,
      melodyOverlayPresets: ChristianMelodiesService.getPresets(),
      melodyOverlayId,
      activeMelodyPreset,
      isMelodyOverlayPlaying,
      melodyOverlayVolume,
      overlayDuringMeditation,
      isExpanded,
      isMinimized,
      playTrack,
      playTeaching,
      togglePlay,
      pause,
      closePlayer,
      seekTo,
      skipBy,
      selectChapter,
      nextTrack,
      prevTrack,
      cyclePlaybackSpeed,
      setSleepTimer,
      setAmbientBed,
      setVoicePersona,
      setRegionalVoiceAccent,
      startMelodyOverlay,
      stopMelodyOverlay,
      toggleMelodyOverlay,
      setMelodyOverlayVolume,
      setOverlayDuringMeditation,
      setIsExpanded,
      setIsMinimized,
    }),
    [
      currentTrack,
      queue,
      isPlaying,
      currentTimeSec,
      durationSec,
      playbackSpeed,
      sleepTimerMinutes,
      sleepTimerRemainingSec,
      ambientBed,
      activeChapter,
      voicePersona,
      melodyOverlayId,
      activeMelodyPreset,
      isMelodyOverlayPlaying,
      melodyOverlayVolume,
      overlayDuringMeditation,
      isExpanded,
      isMinimized,
      playTrack,
      playTeaching,
      togglePlay,
      pause,
      closePlayer,
      seekTo,
      skipBy,
      selectChapter,
      nextTrack,
      prevTrack,
      cyclePlaybackSpeed,
      setSleepTimer,
      setVoicePersona,
      setRegionalVoiceAccent,
      startMelodyOverlay,
      stopMelodyOverlay,
      toggleMelodyOverlay,
      setMelodyOverlayVolume,
    ]
  );

  return (
    <SanctuaryAudioContext.Provider value={value}>
      {children}
    </SanctuaryAudioContext.Provider>
  );
}

export function useSanctuaryAudio() {
  const ctx = useContext(SanctuaryAudioContext);
  if (!ctx) {
    throw new Error("useSanctuaryAudio must be used within a SanctuaryAudioProvider");
  }
  return ctx;
}
