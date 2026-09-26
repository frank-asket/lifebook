"use client";

import { useState, useEffect, useCallback } from "react";

export type ChristianMelodyId =
  | "amazing-grace"
  | "it-is-well"
  | "be-thou-my-vision"
  | "holy-holy-holy"
  | "great-faithfulness"
  | "selah-worship"
  | "none";

export interface MelodyNote {
  /** Musical note name, e.g. 'G4', 'C5' */
  note: string;
  /** Duration in beats */
  beats: number;
  /** Optional underlying warm worship chord notes triggered at the start of this note */
  chord?: string[];
}

export interface ChristianMelodyPreset {
  id: ChristianMelodyId;
  titleEn: string;
  titleFr: string;
  subtitleEn: string;
  subtitleFr: string;
  instrumentsEn: string;
  instrumentsFr: string;
  scriptureRefEn: string;
  scriptureRefFr: string;
  bpm: number;
  icon: string;
  timbre: "piano-cello" | "harp-strings" | "flute-acoustic" | "cathedral-pad" | "worship-rhodes";
  notes: MelodyNote[];
}

/** Standard concert pitch frequencies (A4 = 440Hz) */
const NOTE_FREQUENCIES: Record<string, number> = {
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  "F#2": 92.5,
  G2: 98.0,
  A2: 110.0,
  Bb2: 116.54,
  B2: 123.47,
  C3: 130.81,
  "C#3": 138.59,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  "F#3": 185.0,
  G3: 196.0,
  "G#3": 207.65,
  A3: 220.0,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  "C#5": 554.37,
  D5: 587.33,
  Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  "F#5": 739.99,
  G5: 783.99,
  A5: 880.0,
};

export const CHRISTIAN_MELODY_PRESETS: ChristianMelodyPreset[] = [
  {
    id: "amazing-grace",
    titleEn: "Amazing Grace",
    titleFr: "Grâce Infinie (Amazing Grace)",
    subtitleEn: "Contemplative Grand Piano & Warm Cello",
    subtitleFr: "Piano à Queue Contemplatif & Violoncelle",
    instrumentsEn: "Grand Piano · Warm Cello Pad",
    instrumentsFr: "Piano à Queue · Violoncelle Doux",
    scriptureRefEn: "Ephesians 2:8 · 2 Corinthians 12:9",
    scriptureRefFr: "Éphésiens 2:8 · 2 Corinthiens 12:9",
    bpm: 64,
    icon: "🎹",
    timbre: "piano-cello",
    // Authentic 3/4 hymn melody in C Major (G3 pickup -> C4 -> E4/C4 -> E4 -> D4 -> C4 -> A3 -> G3)
    notes: [
      { note: "G3", beats: 1, chord: ["C3", "G3", "E4"] },
      { note: "C4", beats: 2, chord: ["C3", "G3", "E4"] },
      { note: "E4", beats: 0.65 },
      { note: "C4", beats: 0.35 },
      { note: "E4", beats: 2, chord: ["A2", "E3", "C4"] },
      { note: "D4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "C4", beats: 2, chord: ["F2", "C3", "A3"] },
      { note: "A3", beats: 1 },
      { note: "G3", beats: 2, chord: ["C3", "E3", "G3"] },
      // Phrase 2: "'Twas grace that taught my heart to fear..."
      { note: "G3", beats: 1 },
      { note: "C4", beats: 2, chord: ["C3", "G3", "E4"] },
      { note: "E4", beats: 0.65 },
      { note: "C4", beats: 0.35 },
      { note: "E4", beats: 2, chord: ["A2", "E3", "C4"] },
      { note: "D4", beats: 1 },
      { note: "G4", beats: 3, chord: ["G2", "D3", "B3"] },
      // Phrase 3: "And grace my fears relieved..."
      { note: "E4", beats: 1 },
      { note: "G4", beats: 1.5, chord: ["C3", "G3", "E4"] },
      { note: "E4", beats: 0.5 },
      { note: "G4", beats: 0.65 },
      { note: "E4", beats: 0.35 },
      { note: "C4", beats: 2, chord: ["F2", "C3", "A3"] },
      { note: "G3", beats: 1 },
      // Phrase 4: "How precious did that grace appear..."
      { note: "A3", beats: 1.5, chord: ["F2", "C3", "A3"] },
      { note: "C4", beats: 0.5 },
      { note: "C4", beats: 0.65 },
      { note: "A3", beats: 0.35 },
      { note: "G3", beats: 2, chord: ["C3", "E3", "G3"] },
      { note: "G3", beats: 1 },
      { note: "C4", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "E4", beats: 0.65 },
      { note: "C4", beats: 0.35 },
      { note: "E4", beats: 2, chord: ["A2", "E3", "C4"] },
      { note: "D4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "C4", beats: 4, chord: ["C3", "G3", "E4"] },
    ],
  },
  {
    id: "it-is-well",
    titleEn: "It Is Well With My Soul",
    titleFr: "Quel Repos Céleste (It Is Well)",
    subtitleEn: "Sanctuary Harp, Strings & Soft Piano",
    subtitleFr: "Harpe du Sanctuaire, Cordes & Piano Doux",
    instrumentsEn: "Acoustic Harp · Warm String Ensemble",
    instrumentsFr: "Harpe Acoustique · Ensemble à Cordes",
    scriptureRefEn: "Psalm 46:10 · Philippians 4:7",
    scriptureRefFr: "Psaume 46:10 · Philippiens 4:7",
    bpm: 60,
    icon: "🎻",
    timbre: "harp-strings",
    // Authentic Horatio Spafford / Philip Bliss melody in C Major
    // "When peace like a river, attendeth my way..."
    notes: [
      { note: "G4", beats: 1, chord: ["C3", "E3", "G3"] },
      { note: "G4", beats: 1.5, chord: ["C3", "G3", "E4"] },
      { note: "F4", beats: 0.5 },
      { note: "E4", beats: 1 },
      { note: "E4", beats: 1.5, chord: ["G2", "D3", "B3"] },
      { note: "D4", beats: 0.5 },
      { note: "C4", beats: 1, chord: ["C3", "E3", "G3"] },
      { note: "D4", beats: 1.5, chord: ["G2", "D3", "B3"] },
      { note: "E4", beats: 0.5 },
      { note: "F4", beats: 1, chord: ["A2", "E3", "C4"] },
      { note: "E4", beats: 2, chord: ["E3", "G3", "B3"] },
      { note: "D4", beats: 1, chord: ["G2", "D3", "B3"] },
      // "When sorrows like sea billows roll..."
      { note: "G4", beats: 1 },
      { note: "C5", beats: 1.5, chord: ["A2", "E3", "C4"] },
      { note: "B4", beats: 0.5 },
      { note: "A4", beats: 1, chord: ["F2", "C3", "A3"] },
      { note: "A4", beats: 1.5, chord: ["D3", "F#3", "C4"] },
      { note: "G4", beats: 0.5 },
      { note: "F#4", beats: 1 },
      { note: "G4", beats: 3, chord: ["G2", "D3", "B3"] },
      // Refrain: "It is well, with my soul..."
      { note: "G4", beats: 1, chord: ["C3", "G3", "E4"] },
      { note: "G4", beats: 2 },
      { note: "E4", beats: 1, chord: ["C3", "E3", "G3"] },
      { note: "F4", beats: 1.5, chord: ["F2", "C3", "A3"] },
      { note: "F4", beats: 0.5 },
      { note: "F4", beats: 1 },
      { note: "D4", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "G4", beats: 1 },
      { note: "G4", beats: 1.5, chord: ["C3", "E3", "G3"] },
      { note: "A4", beats: 0.5 },
      { note: "B4", beats: 1, chord: ["G2", "D3", "G3"] },
      { note: "C5", beats: 2, chord: ["A2", "E3", "C4"] },
      { note: "E4", beats: 1, chord: ["F2", "C3", "A3"] },
      { note: "D4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "C4", beats: 3.5, chord: ["C3", "G3", "E4"] },
    ],
  },
  {
    id: "be-thou-my-vision",
    titleEn: "Be Thou My Vision",
    titleFr: "Sois Ma Vision (Hymne Celtique)",
    subtitleEn: "Celtic Sanctuary Flute & Acoustic Harp",
    subtitleFr: "Flûte Celtique & Harpe Acoustique",
    instrumentsEn: "Wooden Flute · Acoustic Arpeggio",
    instrumentsFr: "Flûte Douce · Arpèges Acoustiques",
    scriptureRefEn: "Psalm 119:105 · Colossians 3:16",
    scriptureRefFr: "Psaume 119:105 · Colossiens 3:16",
    bpm: 66,
    icon: "🪈",
    timbre: "flute-acoustic",
    // Traditional Irish hymn 'Slane' in D Major
    notes: [
      { note: "D4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "D4", beats: 1 },
      { note: "E4", beats: 0.5 },
      { note: "D4", beats: 0.5 },
      { note: "B3", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "A3", beats: 1 },
      { note: "B3", beats: 1 },
      { note: "D4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "D4", beats: 1 },
      { note: "E4", beats: 1, chord: ["A2", "E3", "C#4"] },
      { note: "F#4", beats: 3, chord: ["B2", "F#3", "D4"] },
      // "Naught be all else to me, save that Thou art..."
      { note: "E4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "E4", beats: 1 },
      { note: "E4", beats: 1 },
      { note: "E4", beats: 1, chord: ["A2", "E3", "C#4"] },
      { note: "F#4", beats: 1 },
      { note: "A4", beats: 1 },
      { note: "B4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "A4", beats: 1 },
      { note: "F#4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "A4", beats: 3, chord: ["A2", "E3", "C#4"] },
      // "Thou my best thought, by day or by night..."
      { note: "B4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "C#5", beats: 0.5 },
      { note: "D5", beats: 0.5 },
      { note: "C#5", beats: 1 },
      { note: "B4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "A4", beats: 1 },
      { note: "F#4", beats: 1 },
      { note: "A4", beats: 1, chord: ["A2", "E3", "C#4"] },
      { note: "D4", beats: 1 },
      { note: "C#4", beats: 1 },
      { note: "B3", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "A3", beats: 1 },
      // "Waking or sleeping, Thy presence my light."
      { note: "D4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "F#4", beats: 1 },
      { note: "A4", beats: 1 },
      { note: "B4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "A4", beats: 0.5 },
      { note: "F#4", beats: 0.5 },
      { note: "E4", beats: 1, chord: ["A2", "E3", "C#4"] },
      { note: "F#4", beats: 1 },
      { note: "D4", beats: 1 },
      { note: "D4", beats: 3.5, chord: ["D3", "A3", "F#4"] },
    ],
  },
  {
    id: "holy-holy-holy",
    titleEn: "Holy, Holy, Holy",
    titleFr: "Saint, Saint, Saint est l'Éternel",
    subtitleEn: "Morning Cathedral Organ & Worship Piano",
    subtitleFr: "Orgue Doux de Cathédrale & Piano",
    instrumentsEn: "Cathedral Pad · Sanctuary Piano",
    instrumentsFr: "Pad Cathédrale · Piano de Louange",
    scriptureRefEn: "Isaiah 6:3 · Revelation 4:8",
    scriptureRefFr: "Ésaïe 6:3 · Apocalypse 4:8",
    bpm: 62,
    icon: "🕯️",
    timbre: "cathedral-pad",
    // Nicaea hymn melody in D Major
    notes: [
      { note: "D4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "D4", beats: 1 },
      { note: "F#4", beats: 1, chord: ["B2", "F#3", "D4"] },
      { note: "F#4", beats: 1 },
      { note: "A4", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "A4", beats: 2 },
      { note: "B4", beats: 2, chord: ["G2", "D3", "G3"] },
      { note: "B4", beats: 1 },
      { note: "B4", beats: 1 },
      { note: "A4", beats: 2, chord: ["D3", "A3", "F#4"] },
      { note: "F#4", beats: 2 },
      // "Early in the morning our song shall rise to Thee..."
      { note: "A4", beats: 1.5, chord: ["A2", "E3", "C#4"] },
      { note: "A4", beats: 0.5 },
      { note: "A4", beats: 1 },
      { note: "A4", beats: 1 },
      { note: "D5", beats: 2, chord: ["B2", "F#3", "D4"] },
      { note: "C#5", beats: 1 },
      { note: "A4", beats: 1 },
      { note: "E4", beats: 1, chord: ["A2", "E3", "C#4"] },
      { note: "A4", beats: 1 },
      { note: "B4", beats: 1.5, chord: ["E3", "G#3", "B3"] },
      { note: "A4", beats: 0.5 },
      { note: "A4", beats: 4, chord: ["A2", "E3", "C#4"] },
      // "Merciful and mighty, God in three Persons, blessed Trinity!"
      { note: "D4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "D4", beats: 1 },
      { note: "F#4", beats: 1 },
      { note: "F#4", beats: 1 },
      { note: "A4", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "A4", beats: 2 },
      { note: "B4", beats: 1.5, chord: ["G2", "D3", "G3"] },
      { note: "B4", beats: 0.5 },
      { note: "B4", beats: 1 },
      { note: "B4", beats: 1 },
      { note: "A4", beats: 2, chord: ["D3", "A3", "F#4"] },
      { note: "A4", beats: 2 },
      { note: "D5", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "A4", beats: 1, chord: ["D3", "A3", "F#4"] },
      { note: "A4", beats: 1 },
      { note: "B4", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "F#4", beats: 2, chord: ["D3", "A3", "F#4"] },
      { note: "G4", beats: 1.5, chord: ["A2", "E3", "C#4"] },
      { note: "E4", beats: 0.5 },
      { note: "E4", beats: 1 },
      { note: "D4", beats: 3.5, chord: ["D3", "A3", "F#4"] },
    ],
  },
  {
    id: "great-faithfulness",
    titleEn: "Great Is Thy Faithfulness",
    titleFr: "Grande Est Ta Fidélité",
    subtitleEn: "Warm Soaking Piano & Rhodes Worship",
    subtitleFr: "Piano de Prière & Nappes Douces",
    instrumentsEn: "Worship Rhodes · Soft Upright Piano",
    instrumentsFr: "Piano Rhodes · Piano Droit",
    scriptureRefEn: "Lamentations 3:22-23",
    scriptureRefFr: "Lamentations 3:22-23",
    bpm: 64,
    icon: "🌅",
    timbre: "worship-rhodes",
    // William M. Runyan melody in C Major
    notes: [
      { note: "E4", beats: 1, chord: ["C3", "G3", "E4"] },
      { note: "E4", beats: 1 },
      { note: "E4", beats: 1 },
      { note: "F4", beats: 1.5, chord: ["G2", "D3", "B3"] },
      { note: "E4", beats: 0.5 },
      { note: "D4", beats: 1 },
      { note: "G4", beats: 1, chord: ["F2", "C3", "A3"] },
      { note: "A4", beats: 1.5 },
      { note: "G4", beats: 0.5 },
      { note: "F4", beats: 1 },
      { note: "E4", beats: 3, chord: ["C3", "G3", "E4"] },
      // "There is no shadow of turning with Thee..."
      { note: "A4", beats: 1, chord: ["A2", "E3", "C4"] },
      { note: "B4", beats: 1 },
      { note: "C5", beats: 1 },
      { note: "B4", beats: 1.5, chord: ["E3", "G3", "B3"] },
      { note: "A4", beats: 0.5 },
      { note: "G4", beats: 1 },
      { note: "F4", beats: 1, chord: ["D3", "A3", "F4"] },
      { note: "E4", beats: 1 },
      { note: "D4", beats: 1 },
      { note: "G4", beats: 3, chord: ["G2", "D3", "B3"] },
      // Chorus: "Great is Thy faithfulness! Great is Thy faithfulness!"
      { note: "G4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "D4", beats: 0.5 },
      { note: "E4", beats: 0.5 },
      { note: "F4", beats: 1.5 },
      { note: "E4", beats: 0.5 },
      { note: "E4", beats: 2, chord: ["C3", "G3", "E4"] },
      { note: "A4", beats: 1, chord: ["A2", "E3", "C4"] },
      { note: "E4", beats: 0.5 },
      { note: "F4", beats: 0.5 },
      { note: "G4", beats: 1.5 },
      { note: "F4", beats: 0.5 },
      { note: "F4", beats: 2, chord: ["D3", "A3", "F4"] },
      // "Morning by morning new mercies I see..."
      { note: "B4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "C5", beats: 1 },
      { note: "D5", beats: 1 },
      { note: "C5", beats: 1.5, chord: ["C3", "G3", "E4"] },
      { note: "G4", beats: 0.5 },
      { note: "E4", beats: 1 },
      { note: "F4", beats: 1, chord: ["F2", "C3", "A3"] },
      { note: "E4", beats: 1 },
      { note: "D4", beats: 1, chord: ["G2", "D3", "B3"] },
      { note: "C4", beats: 3.5, chord: ["C3", "G3", "E4"] },
    ],
  },
  {
    id: "selah-worship",
    titleEn: "Selah · Beside Still Waters",
    titleFr: "Sélah · Près des Eaux Paisibles",
    subtitleEn: "Spontaneous Christian Prayer & Meditation Instrumental",
    subtitleFr: "Instrumental Chrétien de Méditation & Prière",
    instrumentsEn: "Soaking Piano · Cello Swell · Shimmer Pad",
    instrumentsFr: "Piano d'Adoration · Violoncelle · Nappe Céleste",
    scriptureRefEn: "Psalm 23:1-3 · Psalm 62:5",
    scriptureRefFr: "Psaume 23:1-3 · Psaume 62:5",
    bpm: 58,
    icon: "🕊️",
    timbre: "piano-cello",
    notes: [
      { note: "E4", beats: 1.5, chord: ["C3", "G3", "E4"] },
      { note: "G4", beats: 1.5 },
      { note: "C5", beats: 2, chord: ["C3", "G3", "B3"] },
      { note: "B4", beats: 1 },
      { note: "G4", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "D4", beats: 2 },
      { note: "E4", beats: 1.5, chord: ["A2", "E3", "C4"] },
      { note: "A4", beats: 1.5 },
      { note: "G4", beats: 2 },
      { note: "F4", beats: 1 },
      { note: "E4", beats: 2, chord: ["F2", "C3", "A3"] },
      { note: "C4", beats: 2 },
      { note: "D4", beats: 1.5, chord: ["D3", "A3", "F4"] },
      { note: "F4", beats: 1.5 },
      { note: "A4", beats: 2 },
      { note: "G4", beats: 2, chord: ["G2", "D3", "B3"] },
      { note: "D4", beats: 2 },
      { note: "E4", beats: 2, chord: ["C3", "G3", "E4"] },
      { note: "C4", beats: 3 },
    ],
  },
];

export const CHRISTIAN_MELODY_STORAGE_KEY = "lifebook.christianMelody.state";
export const CHRISTIAN_MELODY_CHANGE_EVENT = "lifebook:christian-melody-changed";

interface EngineController {
  stop: () => void;
  setVolume: (vol: number) => void;
  setDucked: (ducked: boolean) => void;
  melodyId: ChristianMelodyId;
}

let activeEngine: EngineController | null = null;
let sharedAudioCtx: AudioContext | null = null;
let currentPlayingState = false;
let currentMelodyIdState: ChristianMelodyId = "amazing-grace";
let currentVolumeState = 0.5;
let isVoiceDucked = false;

function notifyMelodyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CHRISTIAN_MELODY_CHANGE_EVENT, {
      detail: {
        melodyId: currentMelodyIdState,
        isPlaying: currentPlayingState,
        volume: currentVolumeState,
      },
    })
  );
}

export function getSavedChristianMelody(): {
  melodyId: ChristianMelodyId;
  volume: number;
} {
  if (typeof window === "undefined") {
    return { melodyId: "amazing-grace", volume: 0.5 };
  }
  try {
    const raw = localStorage.getItem(CHRISTIAN_MELODY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validId = CHRISTIAN_MELODY_PRESETS.some((p) => p.id === parsed.melodyId) || parsed.melodyId === "none"
        ? (parsed.melodyId as ChristianMelodyId)
        : "amazing-grace";
      const vol = typeof parsed.volume === "number" ? Math.max(0.05, Math.min(1, parsed.volume)) : 0.5;
      currentMelodyIdState = validId;
      currentVolumeState = vol;
      return { melodyId: validId, volume: vol };
    }
  } catch {
    // ignore
  }
  return { melodyId: currentMelodyIdState, volume: currentVolumeState };
}

export function saveChristianMelodyPreference(melodyId: ChristianMelodyId, volume?: number) {
  currentMelodyIdState = melodyId;
  if (typeof volume === "number") {
    currentVolumeState = Math.max(0.05, Math.min(1, volume));
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        CHRISTIAN_MELODY_STORAGE_KEY,
        JSON.stringify({
          melodyId: currentMelodyIdState,
          volume: currentVolumeState,
        })
      );
    } catch {
      // ignore
    }
  }
  if (activeEngine && typeof volume === "number") {
    activeEngine.setVolume(currentVolumeState);
  }
  notifyMelodyChange();
}

export function getMelodyPresetById(id: ChristianMelodyId): ChristianMelodyPreset {
  return (
    CHRISTIAN_MELODY_PRESETS.find((p) => p.id === id) || CHRISTIAN_MELODY_PRESETS[0]
  );
}

/**
 * Ducks the Christian instrumental volume gently when a Pastoral Human Voice speaks,
 * and restores it smoothly when speech ends.
 */
export function setChristianMelodyVoiceDucking(ducked: boolean) {
  isVoiceDucked = ducked;
  if (activeEngine) {
    activeEngine.setDucked(ducked);
  }
}

/**
 * Synthesizes a single melodic note (piano, harp, flute, or Rhodes) with natural harmonics
 * and a warm acoustic envelope.
 */
function triggerMelodyNote(
  ctx: AudioContext,
  destination: AudioNode,
  freq: number,
  durationSec: number,
  timbre: ChristianMelodyPreset["timbre"]
) {
  const now = ctx.currentTime;
  const noteGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";

  // Fundamental oscillator
  const osc1 = ctx.createOscillator();
  // Warm overtone oscillator (one octave higher or gentle detune)
  const osc2 = ctx.createOscillator();
  const osc2Gain = ctx.createGain();

  if (timbre === "piano-cello") {
    osc1.type = "triangle";
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc2Gain.gain.setValueAtTime(0.18, now);
    filter.frequency.setValueAtTime(1350, now);
    filter.frequency.exponentialRampToValueAtTime(480, now + durationSec);
  } else if (timbre === "harp-strings") {
    osc1.type = "triangle";
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 3, now);
    osc2Gain.gain.setValueAtTime(0.09, now);
    filter.frequency.setValueAtTime(1650, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + durationSec);
  } else if (timbre === "flute-acoustic") {
    osc1.type = "sine";
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc2Gain.gain.setValueAtTime(0.12, now);
    filter.frequency.setValueAtTime(1150, now);
  } else if (timbre === "cathedral-pad") {
    osc1.type = "sine";
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 1.002, now); // Warm chorus detune
    osc2Gain.gain.setValueAtTime(0.35, now);
    filter.frequency.setValueAtTime(980, now);
  } else {
    // worship-rhodes
    osc1.type = "sine";
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 4, now); // Bell tine harmonic
    osc2Gain.gain.setValueAtTime(0.06, now);
    filter.frequency.setValueAtTime(1250, now);
  }

  osc1.frequency.setValueAtTime(freq, now);

  // Expressive acoustic envelope (soft strike, singing sustain, warm tail)
  const attack = timbre === "flute-acoustic" || timbre === "cathedral-pad" ? 0.14 : 0.035;
  const release = Math.max(0.65, durationSec * 0.55);
  const peakGain = 0.22;

  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.linearRampToValueAtTime(peakGain, now + attack);
  noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.55, now + Math.max(attack + 0.1, durationSec * 0.7));
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec + release);

  osc1.connect(filter);
  osc2.connect(osc2Gain);
  osc2Gain.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(destination);

  osc1.start(now);
  osc2.start(now);
  const stopAt = now + durationSec + release + 0.05;
  osc1.stop(stopAt);
  osc2.stop(stopAt);
}

/**
 * Synthesizes warm worship pad & cello chord accompaniment underneath the hymn melody.
 */
function triggerWorshipChordPad(
  ctx: AudioContext,
  destination: AudioNode,
  chordNotes: string[],
  durationSec: number
) {
  const now = ctx.currentTime;
  const chordDur = Math.max(2.4, durationSec * 1.4);

  chordNotes.forEach((noteName, idx) => {
    const freq = NOTE_FREQUENCIES[noteName];
    if (!freq) return;

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const padGain = ctx.createGain();

    osc.type = idx === 0 ? "triangle" : "sine"; // Root has warm cello body
    osc.frequency.setValueAtTime(freq, now);

    // Subtle detuned pad shimmer
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(freq * 1.003, now);
    subGain.gain.setValueAtTime(0.35, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, now);

    const peak = idx === 0 ? 0.085 : 0.06;
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.linearRampToValueAtTime(peak, now + 0.45);
    padGain.gain.exponentialRampToValueAtTime(peak * 0.7, now + chordDur * 0.75);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + chordDur + 1.2);

    osc.connect(filter);
    subOsc.connect(subGain);
    subGain.connect(filter);
    filter.connect(padGain);
    padGain.connect(destination);

    osc.start(now);
    subOsc.start(now);
    const stopTime = now + chordDur + 1.3;
    osc.stop(stopTime);
    subOsc.stop(stopTime);
  });
}

/**
 * Starts playing the specified Christian Melody & Instrumental loop.
 */
export function startChristianMelody(
  melodyId?: ChristianMelodyId,
  customVolume?: number
): void {
  if (typeof window === "undefined") return;

  const saved = getSavedChristianMelody();
  const targetId = melodyId ?? saved.melodyId;
  const targetVol = typeof customVolume === "number" ? customVolume : saved.volume;

  if (targetId === "none") {
    stopChristianMelody();
    saveChristianMelodyPreference("none", targetVol);
    return;
  }

  // If the exact same melody is already playing, just update volume
  if (activeEngine && currentPlayingState && activeEngine.melodyId === targetId) {
    saveChristianMelodyPreference(targetId, targetVol);
    return;
  }

  stopChristianMelody(false);

  const preset = getMelodyPresetById(targetId);
  saveChristianMelodyPreference(preset.id, targetVol);

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContextClass();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Master Gain + Cathedral Stereo Echo Delay Bus
    const masterGain = ctx.createGain();
    const effectiveGain = (isVoiceDucked ? targetVol * 0.35 : targetVol) * 0.42;
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, effectiveGain), ctx.currentTime + 0.6);

    // Gentle sanctuary reverb/echo network
    const delayNode = ctx.createDelay(1.0);
    delayNode.delayTime.setValueAtTime(0.36, ctx.currentTime);
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.setValueAtTime(0.28, ctx.currentTime);
    const wetFilter = ctx.createBiquadFilter();
    wetFilter.type = "lowpass";
    wetFilter.frequency.setValueAtTime(900, ctx.currentTime);

    delayNode.connect(wetFilter);
    wetFilter.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(masterGain);

    const mixBus = ctx.createGain();
    mixBus.gain.setValueAtTime(1.0, ctx.currentTime);
    mixBus.connect(masterGain);
    mixBus.connect(delayNode);
    masterGain.connect(ctx.destination);

    let isCancelled = false;
    let noteIndex = 0;
    let timerId: number | null = null;
    const secPerBeat = 60 / preset.bpm;

    const scheduleNextNote = () => {
      if (isCancelled) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const item = preset.notes[noteIndex % preset.notes.length];
      noteIndex += 1;

      const noteDurationSec = item.beats * secPerBeat;
      const freq = NOTE_FREQUENCIES[item.note];

      if (item.chord && item.chord.length > 0) {
        triggerWorshipChordPad(ctx, mixBus, item.chord, noteDurationSec * 1.8);
      }

      if (freq) {
        triggerMelodyNote(ctx, mixBus, freq, noteDurationSec, preset.timbre);
      }

      // Add a gentle breath pause at the end of a full hymn cycle
      const isCycleEnd = noteIndex % preset.notes.length === 0;
      const nextDelayMs = (noteDurationSec + (isCycleEnd ? 1.1 : 0)) * 1000;

      timerId = window.setTimeout(scheduleNextNote, nextDelayMs);
    };

    scheduleNextNote();
    currentPlayingState = true;

    activeEngine = {
      melodyId: preset.id,
      setVolume: (vol: number) => {
        const g = (isVoiceDucked ? vol * 0.35 : vol) * 0.42;
        try {
          masterGain.gain.setTargetAtTime(Math.max(0.005, g), ctx.currentTime, 0.2);
        } catch {}
      },
      setDucked: (ducked: boolean) => {
        const g = (ducked ? currentVolumeState * 0.35 : currentVolumeState) * 0.42;
        try {
          masterGain.gain.setTargetAtTime(Math.max(0.005, g), ctx.currentTime, 0.3);
        } catch {}
      },
      stop: () => {
        isCancelled = true;
        if (timerId !== null) {
          window.clearTimeout(timerId);
          timerId = null;
        }
        try {
          masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
          window.setTimeout(() => {
            try {
              mixBus.disconnect();
              delayNode.disconnect();
              masterGain.disconnect();
            } catch {}
          }, 350);
        } catch {}
      },
    };

    notifyMelodyChange();
  } catch {
    // ignore browser autoplay restriction until user gesture
  }
}

export function stopChristianMelody(emit = true): void {
  if (activeEngine) {
    activeEngine.stop();
    activeEngine = null;
  }
  currentPlayingState = false;
  if (emit) {
    notifyMelodyChange();
  }
}

export function toggleChristianMelody(melodyId?: ChristianMelodyId): boolean {
  if (currentPlayingState) {
    if (melodyId && melodyId !== currentMelodyIdState) {
      startChristianMelody(melodyId);
      return true;
    }
    stopChristianMelody();
    return false;
  }
  const target = melodyId && melodyId !== "none" ? melodyId : currentMelodyIdState === "none" ? "amazing-grace" : currentMelodyIdState;
  startChristianMelody(target);
  return true;
}

export function isChristianMelodyPlaying(): boolean {
  return currentPlayingState;
}

export function setChristianMelodyVolume(volume: number): void {
  saveChristianMelodyPreference(currentMelodyIdState, volume);
}

/**
 * High-level service in `lib/christian-melodies` to manage polyphonic
 * instrumental worship music and meditation overlays across LifeBook.
 */
export const ChristianMelodiesService = {
  getPresets: (): ChristianMelodyPreset[] => CHRISTIAN_MELODY_PRESETS,
  getPresetById: (id: ChristianMelodyId): ChristianMelodyPreset => getMelodyPresetById(id),
  getState: () => ({
    ...getSavedChristianMelody(),
    isPlaying: isChristianMelodyPlaying(),
    isVoiceDucked,
  }),
  startOverlay: (melodyId?: ChristianMelodyId, volume?: number) => {
    startChristianMelody(melodyId, volume);
  },
  stopOverlay: () => {
    stopChristianMelody(true);
  },
  toggleOverlay: (melodyId?: ChristianMelodyId): boolean => {
    return toggleChristianMelody(melodyId);
  },
  setVolume: (volume: number) => {
    setChristianMelodyVolume(volume);
  },
  setVoiceDucking: (ducked: boolean) => {
    setChristianMelodyVoiceDucking(ducked);
  },
};

/**
 * React hook for controlling Christian Melodies & Worship Instrumentals in any meditation component.
 */
export function useChristianMelody() {
  const [melodyId, setMelodyId] = useState<ChristianMelodyId>(
    () => getSavedChristianMelody().melodyId
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(() => isChristianMelodyPlaying());
  const [volume, setVolumeState] = useState<number>(() => getSavedChristianMelody().volume);

  useEffect(() => {
    const onSync = (e: Event) => {
      const custom = e as CustomEvent<{
        melodyId: ChristianMelodyId;
        isPlaying: boolean;
        volume: number;
      }>;
      if (custom.detail) {
        setMelodyId(custom.detail.melodyId);
        setIsPlaying(custom.detail.isPlaying);
        setVolumeState(custom.detail.volume);
      }
    };
    window.addEventListener(CHRISTIAN_MELODY_CHANGE_EVENT, onSync);
    return () => window.removeEventListener(CHRISTIAN_MELODY_CHANGE_EVENT, onSync);
  }, []);

  const selectMelody = useCallback((id: ChristianMelodyId, autoPlay = true) => {
    if (id === "none") {
      stopChristianMelody();
      saveChristianMelodyPreference("none");
      return;
    }
    saveChristianMelodyPreference(id);
    if (autoPlay || isChristianMelodyPlaying()) {
      startChristianMelody(id);
    }
  }, []);

  const togglePlay = useCallback(() => {
    toggleChristianMelody();
  }, []);

  const setVolume = useCallback((vol: number) => {
    saveChristianMelodyPreference(currentMelodyIdState, vol);
  }, []);

  const activePreset = getMelodyPresetById(melodyId === "none" ? "amazing-grace" : melodyId);

  return {
    presets: CHRISTIAN_MELODY_PRESETS,
    melodyId,
    activePreset,
    isPlaying,
    volume,
    selectMelody,
    togglePlay,
    startMelody: startChristianMelody,
    stopMelody: stopChristianMelody,
    setVolume,
  };
}
