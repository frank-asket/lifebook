"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n";
import {
  useChristianMelody,
  type ChristianMelodyId,
} from "@/lib/christian-melodies";

interface ChristianMelodySelectorProps {
  compact?: boolean;
  darkSurface?: boolean;
  className?: string;
}

export function ChristianMelodySelector({
  compact = false,
  darkSurface = false,
  className = "",
}: ChristianMelodySelectorProps) {
  const { isFr } = useLanguage();
  const {
    presets,
    melodyId,
    activePreset,
    isPlaying,
    volume,
    selectMelody,
    togglePlay,
    setVolume,
  } = useChristianMelody();

  if (compact) {
    return (
      <div
        className={`rounded-2xl border p-3.5 transition-all ${
          darkSurface
            ? "bg-white/5 border-white/15 text-white"
            : "bg-[#FAF8F5] dark:bg-[#19142B] border-[#2D2542]/12 dark:border-white/15 text-[#1E1931] dark:text-[#F4EFE6]"
        } ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{activePreset.icon}</span>
            <div className="min-w-0">
              <span
                className={`block text-[10px] font-mono uppercase tracking-wider font-semibold ${
                  darkSurface ? "text-[#4EE2D8]" : "text-[#5A4B7C] dark:text-[#4EE2D8]"
                }`}
              >
                {isFr
                  ? "Mélodies & Instrumentaux Chrétiens"
                  : "Christian Meditation Melodies"}
              </span>
              <span className="block text-xs font-bold truncate">
                {melodyId === "none"
                  ? isFr
                    ? "Silence · Voix Seule"
                    : "Silent · Voice Only"
                  : isFr
                  ? activePreset.titleFr
                  : activePreset.titleEn}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Volume slider */}
            <input
              type="range"
              min={0.08}
              max={0.95}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              title={isFr ? "Volume de l'instrumental" : "Instrumental volume"}
              aria-label={isFr ? "Volume de l'instrumental" : "Instrumental volume"}
              className="w-16 accent-[#1FB6B0] cursor-pointer"
            />

            <button
              type="button"
              onClick={togglePlay}
              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isPlaying
                  ? "bg-[#1FB6B0] text-[#071F1E] shadow-xs"
                  : darkSurface
                  ? "bg-white/15 hover:bg-white/25 text-white"
                  : "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18]"
              }`}
            >
              <span>{isPlaying ? "⏸" : "🎵"}</span>
              <span>
                {isPlaying
                  ? isFr
                    ? "En cours"
                    : "Playing"
                  : isFr
                  ? "Jouer Mélodie"
                  : "Play Melody"}
              </span>
            </button>
          </div>
        </div>

        {/* Christian Hymn & Worship Instrumental Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {presets.map((preset) => {
            const isSelected = melodyId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectMelody(preset.id as ChristianMelodyId, true)}
                className={`px-2.5 py-1.5 rounded-xl text-left text-xs border transition-all cursor-pointer flex items-center gap-1.5 min-w-0 ${
                  isSelected
                    ? darkSurface
                      ? "bg-[#1FB6B0]/25 border-[#4EE2D8] text-white font-bold"
                      : "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-[#2D2542] dark:border-[#4EE2D8] font-bold"
                    : darkSurface
                    ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    : "bg-white dark:bg-[#231C3D] border-[#2D2542]/10 dark:border-white/10 text-[#3F3750] dark:text-[#D5CEE6] hover:border-[#2D2542]/30"
                }`}
              >
                <span className="shrink-0">{preset.icon}</span>
                <span className="truncate">
                  {isFr ? preset.titleFr : preset.titleEn}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] opacity-80">
          <span className="truncate">
            {isFr ? activePreset.instrumentsFr : activePreset.instrumentsEn} ·{" "}
            {activePreset.bpm} BPM
          </span>
          {isPlaying && (
            <button
              type="button"
              onClick={() => selectMelody("none", false)}
              className="underline hover:opacity-100 cursor-pointer shrink-0 ml-2"
            >
              {isFr ? "Couper l'instrumental" : "Mute Instrumental"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full Studio Card
  return (
    <div
      className={`rounded-3xl border p-6 sm:p-7 shadow-sm transition-all ${
        darkSurface
          ? "bg-[#18132B] border-white/15 text-white"
          : "bg-white dark:bg-[#1B1630] border-[#2D2542]/12 dark:border-white/15 text-[#1E1931] dark:text-[#F4EFE6]"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2D2542]/10 dark:border-white/10">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#0E726D] dark:text-[#4EE2D8] font-semibold">
            {isFr
              ? "INSTRUMENTAUX DE MÉDITATION CHRÉTIENNE"
              : "CHRISTIAN MEDITATION MELODIES & INSTRUMENTALS"}
          </span>
          <h3 className="text-xl font-serif font-bold mt-0.5">
            {isFr
              ? "Hymnes Sacrés & Piano d'Adoration pour la Prière"
              : "Sacred Hymns & Soaking Worship Instrumentals"}
          </h3>
          <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] mt-1">
            {isFr
              ? "Accompagnez votre méditation biblique avec des mélodies chrétiennes au piano, violoncelle, harpe et flûte."
              : "Accompany your quiet time and prayer meditation with recognizable Christian hymn melodies on piano, cello, harp, and flute."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-white/5 border border-[#2D2542]/10 dark:border-white/10">
            <span className="text-xs">🔉</span>
            <input
              type="range"
              min={0.08}
              max={0.95}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-[#1FB6B0] cursor-pointer"
              aria-label={isFr ? "Volume de la mélodie" : "Melody volume"}
            />
          </div>

          <button
            type="button"
            onClick={togglePlay}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              isPlaying
                ? "bg-[#1FB6B0] text-[#071F1E] shadow-sm"
                : "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18]"
            }`}
          >
            <span>{isPlaying ? "⏸" : "🎹"}</span>
            <span>
              {isPlaying
                ? isFr
                  ? "Pause Instrumental"
                  : "Pause Instrumental"
                : isFr
                ? "Écouter l'Instrumental"
                : "Play Christian Melody"}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
        {presets.map((preset) => {
          const active = melodyId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectMelody(preset.id as ChristianMelodyId, true)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                active
                  ? "bg-[#2D2542] dark:bg-[#251E42] text-white border-[#1FB6B0] shadow-md"
                  : "bg-[#FAF8F5] dark:bg-[#141024] border-[#2D2542]/10 dark:border-white/10 hover:border-[#1FB6B0]/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{preset.icon}</span>
                  <div>
                    <h4
                      className={`text-sm font-serif font-bold ${
                        active ? "text-white" : "text-[#1E1931] dark:text-white"
                      }`}
                    >
                      {isFr ? preset.titleFr : preset.titleEn}
                    </h4>
                    <span
                      className={`block text-[11px] ${
                        active ? "text-[#4EE2D8]" : "text-[#5A4B7C] dark:text-[#4EE2D8]"
                      }`}
                    >
                      {isFr ? preset.instrumentsFr : preset.instrumentsEn}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    active && isPlaying
                      ? "bg-[#1FB6B0] text-[#071F1E] font-bold"
                      : "bg-black/10 dark:bg-white/10 text-xs"
                  }`}
                >
                  {active && isPlaying
                    ? isFr
                      ? "● Actif"
                      : "● Playing"
                    : `${preset.bpm} BPM`}
                </span>
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  active ? "text-white/80" : "text-[#5A506B] dark:text-[#C8C2D6]"
                }`}
              >
                {isFr ? preset.subtitleFr : preset.subtitleEn}
              </p>

              <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px] font-mono opacity-80">
                <span>📖 {isFr ? preset.scriptureRefFr : preset.scriptureRefEn}</span>
                <span>{active && isPlaying ? "♪ ♫ ♪" : isFr ? "Écouter →" : "Listen →"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
