"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useSanctuaryAudio,
  type AmbientSoundscape,
  type SleepTimerOption,
} from "@/lib/sanctuary-audio";
import { HumanVoiceSelector } from "@/components/HumanVoiceSelector";
import { useLanguage } from "@/lib/i18n";

function formatClock(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function GlobalAudioPlayer() {
  const { isFr } = useLanguage();
  const {
    tracks,
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
    isExpanded,
    isMinimized,
    playTrack,
    togglePlay,
    closePlayer,
    seekTo,
    skipBy,
    selectChapter,
    nextTrack,
    prevTrack,
    cyclePlaybackSpeed,
    setSleepTimer,
    setAmbientBed,
    setIsExpanded,
    setIsMinimized,
  } = useSanctuaryAudio();

  // If no track is loaded yet, provide a non-intrusive floating sanctuary audio trigger
  if (!currentTrack) {
    return (
      <div className="fixed bottom-4 right-4 z-40 print:hidden">
        <button
          type="button"
          id="global-audio-launcher-btn"
          onClick={() => playTrack("psalm-23-still-waters")}
          className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#1E1931]/95 dark:bg-[#221C38]/95 hover:bg-[#2A2146] text-white border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold transition-transform active:scale-95 cursor-pointer"
          title={
            isFr
              ? "Lancer le lecteur audio continu du sanctuaire"
              : "Launch persistent Sanctuary Audio Mini-Player"
          }
        >
          <span className="w-2 h-2 rounded-full bg-[#4EE2D8] animate-pulse" />
          <span>🎧</span>
          <span className="whitespace-nowrap">
            {isFr ? "Sanctuaire Audio · Psaume 23" : "Sanctuary Audio · Psalm 23"}
          </span>
        </button>
      </div>
    );
  }

  const title = isFr ? currentTrack.titleFr : currentTrack.titleEn;
  const scripture = isFr ? currentTrack.scriptureFr : currentTrack.scriptureEn;
  const activeChapterTitle = activeChapter
    ? isFr
      ? activeChapter.titleFr
      : activeChapter.titleEn
    : "";
  const progressPercent =
    durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 print:hidden">
        <div className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#181328]/95 text-white border border-white/15 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-[#1FB6B0] text-[#071F1E] flex items-center justify-center text-xs font-bold cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="text-left max-w-[160px] cursor-pointer"
          >
            <span className="block text-xs font-semibold truncate">{title}</span>
            <span className="block text-[10px] text-[#4EE2D8] font-mono tabular-nums">
              {formatClock(currentTimeSec)} / {formatClock(durationSec)}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const sleepOptions: { value: SleepTimerOption; label: string }[] = [
    { value: null, label: isFr ? "Désactivé" : "Off" },
    { value: 5, label: "5m" },
    { value: 15, label: "15m" },
    { value: 30, label: "30m" },
  ];

  const ambientOptions: { value: AmbientSoundscape; labelEn: string; labelFr: string }[] = [
    { value: "still-waters", labelEn: "Still Waters", labelFr: "Eaux Paisibles" },
    { value: "warm-cello", labelEn: "Warm Cello Pad", labelFr: "Violoncelle Doux" },
    { value: "morning-rain", labelEn: "Morning Rain", labelFr: "Pluie du Matin" },
    { value: "none", labelEn: "Voice Only", labelFr: "Voix Seule" },
  ];

  return (
    <div
      id="global-sanctuary-mini-player"
      className="fixed bottom-0 left-0 right-0 z-50 print:hidden pointer-events-none"
    >
      <div className="max-w-5xl mx-auto px-2 sm:px-4 pb-2 sm:pb-3 pointer-events-auto">
        {/* Expanded Chapter Markers, Sleep Timer & Queue Drawer */}
        {isExpanded && (
          <div className="mb-2 rounded-2xl bg-[#161126]/98 border border-white/15 text-white shadow-2xl backdrop-blur-xl p-4 sm:p-5 max-h-[68vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/10">
              <div>
                <p className="text-[11px] font-mono text-[#4EE2D8]">
                  {isFr
                    ? "Lecteur Audio Continu du Sanctuaire"
                    : "Persistent Sanctuary Audio Studio"}
                </p>
                <h3 className="text-base font-serif font-semibold text-white">
                  {title}{" "}
                  <span className="text-xs font-sans font-normal text-white/70">
                    · {currentTrack.teacher} · {scripture}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/living-word"
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors whitespace-nowrap"
                >
                  {isFr ? "Bibliothèque LivingWord ↗" : "LivingWord Library ↗"}
                </Link>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="min-h-[36px] min-w-[36px] rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center cursor-pointer"
                  aria-label="Collapse drawer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
              {/* Left Column: Chapter Markers */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/75 mb-1">
                  <span className="font-semibold">
                    {isFr ? "Chapitres de la Méditation" : "Teaching Chapter Markers"}
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-white/60">
                    {currentTrack.chapters.length} {isFr ? "parties" : "chapters"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {currentTrack.chapters.map((ch) => {
                    const isCurrentCh = activeChapter?.id === ch.id;
                    const chTitle = isFr ? ch.titleFr : ch.titleEn;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => selectChapter(ch.index)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isCurrentCh
                            ? "bg-[#2A2146] border-[#4EE2D8]/60 text-white"
                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 ${
                              isCurrentCh
                                ? "bg-[#1FB6B0] text-[#071F1E] font-bold"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
                            {isCurrentCh && isPlaying ? "▶" : ch.index + 1}
                          </span>
                          <span className="text-xs font-medium truncate">{chTitle}</span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-white/60 shrink-0">
                          {formatClock(ch.startSec)} – {formatClock(ch.endSec)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Human Voice Persona, Sleep Timer, Ambient Soundscape & Track Switcher */}
              <div className="lg:col-span-5 space-y-4">
                {/* Human Pastoral Voice Persona Selector (Nigerian EN, Côte d'Ivoire FR, American EN) */}
                <HumanVoiceSelector compact darkSurface />

                {/* Sleep Timer */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">
                      🌙 {isFr ? "Minuteur de Veille" : "Sleep Timer"}
                    </span>
                    {sleepTimerRemainingSec !== null && (
                      <span className="text-xs font-mono tabular-nums text-[#FFD770]">
                        {formatClock(sleepTimerRemainingSec)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {sleepOptions.map((opt) => {
                      const active = sleepTimerMinutes === opt.value;
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setSleepTimer(opt.value)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? "bg-[#1FB6B0] text-[#071F1E] font-bold"
                              : "bg-white/10 text-white/80 hover:bg-white/15"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ambient Soundscape */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-xs font-semibold text-white mb-2">
                    🌊 {isFr ? "Fond Sonore Contemplatif" : "Contemplative Ambient Bed"}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ambientOptions.map((amb) => {
                      const active = ambientBed === amb.value;
                      return (
                        <button
                          key={amb.value}
                          type="button"
                          onClick={() => setAmbientBed(amb.value)}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-medium text-left truncate transition-colors cursor-pointer ${
                            active
                              ? "bg-[#7F67B5] text-white font-semibold"
                              : "bg-white/10 text-white/75 hover:bg-white/15"
                          }`}
                        >
                          {isFr ? amb.labelFr : amb.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Track Switcher */}
                <div>
                  <span className="block text-xs font-semibold text-white/75 mb-1.5">
                    {isFr ? "File d'écoute continue" : "Up Next in Sanctuary"}
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {(queue.length > 0 ? queue : tracks).map((tr) => {
                      const isCur = tr.slug === currentTrack.slug;
                      return (
                        <button
                          key={tr.slug}
                          type="button"
                          onClick={() => playTrack(tr)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isCur
                              ? "bg-[#1FB6B0]/20 text-[#4EE2D8] font-semibold"
                              : "hover:bg-white/10 text-white/80"
                          }`}
                        >
                          <span className="truncate">
                            {isFr ? tr.titleFr : tr.titleEn} · {tr.teacher}
                          </span>
                          <span className="font-mono tabular-nums text-[11px] text-white/60 shrink-0">
                            {isFr ? tr.durationLabelFr : tr.durationLabelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Floating Mini-Player Bar */}
        <div className="rounded-2xl bg-[#181329]/95 border border-white/15 text-white shadow-2xl backdrop-blur-xl px-3 sm:px-5 py-2.5">
          {/* Interactive Progress Scrubber */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[11px] font-mono tabular-nums text-white/70 w-9 text-right">
              {formatClock(currentTimeSec)}
            </span>
            <input
              type="range"
              aria-label={isFr ? "Position de lecture" : "Playback position"}
              min={0}
              max={durationSec}
              step={1}
              value={Math.floor(currentTimeSec)}
              onChange={(e) => seekTo(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #1FB6B0 ${progressPercent}%, rgba(255,255,255,0.18) ${progressPercent}%)`,
              }}
              className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-[#1FB6B0]"
            />
            <span className="text-[11px] font-mono tabular-nums text-white/70 w-9">
              {formatClock(durationSec)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Left: Portrait + Track Title + Active Chapter */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-[#2A2146]">
                <Image
                  src={currentTrack.portrait || "/AsketOfficialPic (1).png"}
                  alt={currentTrack.teacher}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    {title}
                  </p>
                  <span className="hidden md:inline text-xs text-white/50">·</span>
                  <span className="hidden md:inline text-xs text-[#4EE2D8] truncate">
                    {scripture}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/70 truncate">
                  <span>{currentTrack.teacher}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="text-[#4EE2D8] hover:underline font-medium truncate cursor-pointer"
                    title={
                      isFr
                        ? "Changer la voix humaine (Nigéria EN, Côte d'Ivoire FR, Américain EN)"
                        : "Switch human voice (Nigerian EN, Côte d'Ivoire FR, American EN)"
                    }
                  >
                    {voicePersona.countryFlag} {voicePersona.name}
                  </button>
                  {activeChapterTitle && (
                    <>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[#FFD770] hover:underline truncate cursor-pointer"
                      >
                        {activeChapterTitle}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Playback Transport Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={prevTrack}
                className="min-h-[38px] min-w-[38px] rounded-full hover:bg-white/10 text-white/85 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                title={isFr ? "Piste précédente" : "Previous track"}
                aria-label={isFr ? "Piste précédente" : "Previous track"}
              >
                ⏮
              </button>
              <button
                type="button"
                onClick={() => skipBy(-15)}
                className="hidden sm:flex min-h-[38px] px-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white items-center justify-center text-[11px] font-mono tabular-nums transition-colors cursor-pointer"
                title="-15s"
              >
                -15s
              </button>
              <button
                type="button"
                id="global-audio-play-pause-btn"
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[#1FB6B0] hover:bg-[#199E99] text-[#071F1E] flex items-center justify-center text-sm font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                type="button"
                onClick={() => skipBy(30)}
                className="hidden sm:flex min-h-[38px] px-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white items-center justify-center text-[11px] font-mono tabular-nums transition-colors cursor-pointer"
                title="+30s"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={nextTrack}
                className="min-h-[38px] min-w-[38px] rounded-full hover:bg-white/10 text-white/85 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                title={isFr ? "Piste suivante" : "Next track"}
                aria-label={isFr ? "Piste suivante" : "Next track"}
              >
                ⏭
              </button>
            </div>

            {/* Right: Speed, Sleep Timer, Chapters Drawer & Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="global-audio-speed-btn"
                onClick={cyclePlaybackSpeed}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono tabular-nums text-white transition-colors cursor-pointer whitespace-nowrap"
                title={isFr ? "Vitesse de lecture" : "Playback speed"}
              >
                {playbackSpeed}x
              </button>

              <button
                type="button"
                id="global-audio-chapters-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  isExpanded
                    ? "bg-[#7F67B5] text-white"
                    : "bg-white/10 hover:bg-white/15 text-white/90"
                }`}
                title={isFr ? "Chapitres et minuteur de veille" : "Chapters & Sleep Timer"}
              >
                <span>☰</span>
                <span className="hidden sm:inline">
                  {isFr ? "Chapitres" : "Chapters"}
                </span>
                {sleepTimerRemainingSec !== null && (
                  <span className="text-[10px] font-mono tabular-nums text-[#FFD770] ml-0.5">
                    ({Math.ceil(sleepTimerRemainingSec / 60)}m)
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="hidden sm:flex min-h-[36px] min-w-[32px] rounded-lg hover:bg-white/10 text-white/70 hover:text-white items-center justify-center text-xs cursor-pointer"
                title={isFr ? "Réduire" : "Minimize"}
                aria-label={isFr ? "Réduire" : "Minimize"}
              >
                _
              </button>

              <button
                type="button"
                onClick={closePlayer}
                className="min-h-[36px] min-w-[32px] rounded-lg hover:bg-rose-500/20 text-white/70 hover:text-rose-200 flex items-center justify-center text-xs cursor-pointer"
                title={isFr ? "Fermer le lecteur" : "Close player"}
                aria-label={isFr ? "Fermer le lecteur" : "Close player"}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
