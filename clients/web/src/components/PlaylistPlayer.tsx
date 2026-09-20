"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import type { Playlist, PlaylistItem } from "@/lib/usePlaylists";
import { teachings } from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";

interface PlaylistPlayerProps {
  playlist: Playlist;
  initialIndex?: number;
  onClose: () => void;
  onRemoveItem?: (playlistId: string, teachingSlug: string) => Promise<boolean>;
}

export function PlaylistPlayer({ playlist, initialIndex = 0, onClose, onRemoveItem }: PlaylistPlayerProps) {
  const { isFr } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const items = playlist.items || [];
  const currentItem: PlaylistItem | undefined = items[currentIndex];

  // Match with rich teaching data for scripture and reflection
  const teachingDetail = teachings.find((t) => t.slug === currentItem?.teachingSlug);

  // Derived duration in seconds
  const match = currentItem?.duration?.match(/\d+/);
  const mins = match ? parseInt(match[0], 10) : 10;
  const durationSec = mins * 60;

  const isSpeechMode = !currentItem?.audioUrl;

  // Audio / Speech handling
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Progress timer and audio synchronization
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeech();
      return;
    }

    if (currentItem?.audioUrl) {
      // Native audio tag handles progress
      return;
    }

    // Synchronize with speech synthesis if browser supports it
    if (typeof window !== "undefined" && "speechSynthesis" in window && teachingDetail) {
      stopSpeech();
      const textToRead = isFr
        ? `${teachingDetail.titleFr}. Enseigné par ${teachingDetail.teacher}. ${teachingDetail.scriptureFr}. ${teachingDetail.teachingFr}`
        : `${teachingDetail.title}. Taught by ${teachingDetail.teacher}. ${teachingDetail.scripture}. ${teachingDetail.teaching}`;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = isFr ? "fr-FR" : "en-US";
      utterance.rate = playbackSpeed;

      utterance.onend = () => {
        if (currentIndex < items.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setCurrentTimeSec(0);
          setProgressPercent(0);
        } else {
          setIsPlaying(false);
        }
      };

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    timerRef.current = setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = prev + 1;
        if (next >= durationSec) {
          if (currentIndex < items.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return durationSec;
          }
        }
        setProgressPercent((next / durationSec) * 100);
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeech();
    };
  }, [isPlaying, currentIndex, durationSec, currentItem, teachingDetail, isFr, items.length, playbackSpeed, stopSpeech]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeech();
    } else {
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      stopSpeech();
      setCurrentIndex((prev) => prev + 1);
      setCurrentTimeSec(0);
      setProgressPercent(0);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentTimeSec > 5) {
      setCurrentTimeSec(0);
      setProgressPercent(0);
    } else if (currentIndex > 0) {
      stopSpeech();
      setCurrentIndex((prev) => prev - 1);
      setCurrentTimeSec(0);
      setProgressPercent(0);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgressPercent(val);
    const newSec = Math.floor((val / 100) * durationSec);
    setCurrentTimeSec(newSec);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!currentItem) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-[#1E192D] p-6 rounded-2xl border border-[#3D3456] text-center max-w-sm">
          <p className="text-white text-base font-semibold mb-2">
            {isFr ? "Cette liste de lecture est vide" : "This playlist is empty"}
          </p>
          <p className="text-xs text-[#A898CE] mb-4">
            {isFr ? "Ajoutez des enseignements pour démarrer l'écoute continue." : "Add teachings to start continuous audio playback."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#7F67B5] hover:bg-[#9278CF] text-white text-xs font-semibold rounded-lg"
          >
            {isFr ? "Retour aux enseignements" : "Back to Teachings"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl mx-auto bg-[#1A1528] border-t border-x border-[#40355D] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-[#2C2442] bg-[#161222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{playlist.icon || "🎧"}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{playlist.title}</h3>
                <span className="text-[10px] text-[#A898CE] bg-white/10 px-2 py-0.5 rounded-full font-mono">
                  {currentIndex + 1} / {items.length}
                </span>
              </div>
              <p className="text-xs text-[#8E80B4]">
                {isFr ? "Lecture continue LifeBook" : "Continuous LifeBook Audio"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isQueueOpen
                  ? "bg-[#7F67B5] border-[#9E86DC] text-white"
                  : "bg-white/5 border-white/10 text-[#C8BCDE] hover:bg-white/10"
              }`}
            >
              <span>☰</span>
              <span>{isFr ? "File d'attente" : "Queue"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#A898CE] hover:text-white hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content area: Either Queue or Active Teaching View */}
        {isQueueOpen ? (
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-2 bg-[#171224]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8E80B4] uppercase tracking-wider mb-3">
              <span>{isFr ? "Ordre de lecture" : "Playback Order"} ({items.length})</span>
              <span>{playlist.totalDuration}</span>
            </div>

            {items.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? "bg-[#332A4C] border-[#7F67B5]"
                      : "bg-[#201A31] border-[#31284A] hover:bg-[#28203D]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                      setIsQueueOpen(false);
                    }}
                    className="flex items-center gap-3 text-left min-w-0 flex-1"
                  >
                    <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-xs font-mono text-[#A898CE]">
                      {isCurrent ? "▶" : idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? "text-purple-200" : "text-white"}`}>
                        {item.teachingTitle}
                      </p>
                      <p className="text-xs text-[#8E80B4] truncate">
                        {item.teacher} · {item.duration}
                      </p>
                    </div>
                  </button>

                  {onRemoveItem && !playlist.isDefault && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(playlist.id, item.teachingSlug)}
                      title={isFr ? "Retirer de la liste" : "Remove from playlist"}
                      className="text-xs text-rose-400/60 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center text-center">
            {/* Portrait / Visual */}
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#544577] mb-5 bg-[#2A233E]">
              <Image
                src={currentItem.portrait || "/AsketOfficialPic (1).png"}
                alt={currentItem.teacher}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white/90 bg-black/50 backdrop-blur-xs py-0.5 rounded px-1.5 truncate">
                {currentItem.category || "Devotional"}
              </div>
            </div>

            <span className="text-xs uppercase tracking-widest text-[#B5A4DD] font-semibold mb-1">
              {teachingDetail ? (isFr ? teachingDetail.scriptureFr : teachingDetail.scripture) : "Scripture Study"}
            </span>
            <h2 className="text-xl font-bold text-white mb-1 max-w-md">
              {teachingDetail ? (isFr ? teachingDetail.titleFr : teachingDetail.title) : currentItem.teachingTitle}
            </h2>
            <p className="text-xs text-[#9E90C0] mb-4">
              {currentItem.teacher} · LifeBook Pastoral Contributor
            </p>

            {/* Excerpt / Verse snippet */}
            {teachingDetail && (
              <div className="w-full max-w-md p-3.5 rounded-xl bg-[#231C35] border border-[#3A3056] text-xs text-[#C8BCDE] italic mb-6 shadow-inner text-left">
                “{isFr ? teachingDetail.excerptFr : teachingDetail.excerpt}”
              </div>
            )}

            {/* Progress Bar & Timers */}
            <div className="w-full max-w-md mb-4">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progressPercent}
                onChange={handleSeek}
                className="w-full h-1.5 bg-[#372D52] rounded-lg appearance-none cursor-pointer accent-[#9E86DC]"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#8E80B4] mt-1.5">
                <span>{formatTime(currentTimeSec)}</span>
                <span>{formatTime(durationSec)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Skip Prev */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0 && currentTimeSec === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg text-[#C8BCDE] hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                title={isFr ? "Précédent" : "Previous"}
              >
                ⏮
              </button>

              {/* 15s Rewind */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTimeSec((prev) => Math.max(0, prev - 15));
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-[#A898CE] hover:text-white hover:bg-white/10 transition-colors"
                title="-15s"
              >
                ↺ 15
              </button>

              {/* Big Play / Pause */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7F67B5] to-[#A48BD9] hover:from-[#8D73C7] hover:to-[#B399EA] text-white flex items-center justify-center text-xl shadow-lg shadow-purple-950/50 scale-105 transition-transform"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              {/* 30s Forward */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTimeSec((prev) => Math.min(durationSec, prev + 30));
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-[#A898CE] hover:text-white hover:bg-white/10 transition-colors"
                title="+30s"
              >
                30 ↻
              </button>

              {/* Skip Next */}
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= items.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg text-[#C8BCDE] hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                title={isFr ? "Suivant" : "Next"}
              >
                ⏭
              </button>
            </div>

            {/* Speed toggle and mode indicator */}
            <div className="flex items-center gap-3 text-[11px] text-[#A898CE]">
              <button
                type="button"
                onClick={() => {
                  const speeds = [1, 1.25, 1.5];
                  const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                  setPlaybackSpeed(nextSpeed);
                }}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 font-mono"
              >
                {playbackSpeed}x
              </button>
              <span>·</span>
              <span className="text-emerald-400/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isSpeechMode ? (isFr ? "Voix pastorale active" : "Pastoral Voice Active") : (isFr ? "Audio HD en cours" : "HD Audio Streaming")}
              </span>
            </div>
          </div>
        )}

        {/* Hidden native audio tag if file URL present */}
        {currentItem.audioUrl && (
          <audio
            ref={audioRef}
            src={currentItem.audioUrl}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTimeSec(audioRef.current.currentTime);
                setProgressPercent((audioRef.current.currentTime / audioRef.current.duration) * 100);
              }
            }}
            onEnded={handleNext}
          />
        )}
      </div>
    </div>
  );
}
