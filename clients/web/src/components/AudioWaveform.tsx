"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export type WaveformStatus = "idle" | "listening" | "thinking" | "answered" | "unsupported";

export interface AudioWaveformProps {
  /** Current state of the Voice Practice session */
  status?: WaveformStatus;
  /** Optional shorthand active boolean */
  isActive?: boolean;
  /** Optional external MediaStream if already acquired by parent */
  mediaStream?: MediaStream | null;
  /** Number of frequency bars to render in the visualizer */
  barCount?: number;
  /** Whether the UI is in French or English */
  isFr?: boolean;
  /** Callback fired with real-time normalized volume (0..1) */
  onVolumeChange?: (volume: number) => void;
  /** Optional className for container */
  className?: string;
}

interface AudioMetrics {
  rmsVolume: number; // 0..100
  peakDb: number; // -60..0 dB
  dominantHz: number; // Estimated fundamental/dominant speech frequency
  isSpeechDetected: boolean;
  sourceMode: "microphone" | "simulated" | "standby";
}

export function AudioWaveform({
  status: statusProp,
  isActive,
  mediaStream: externalStream,
  barCount = 32,
  isFr = false,
  onVolumeChange,
  className = "",
}: AudioWaveformProps) {
  const status: WaveformStatus = statusProp || (isActive ? "listening" : "idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const internalStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedBarsRef = useRef<number[]>(new Array(barCount).fill(0.08));
  const phaseRef = useRef<number>(0);

  const [metrics, setMetrics] = useState<AudioMetrics>({
    rmsVolume: 0,
    peakDb: -60,
    dominantHz: 0,
    isSpeechDetected: false,
    sourceMode: "standby",
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const cleanupAudio = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      sourceNodeRef.current = null;
    }
    analyserRef.current = null;

    if (internalStreamRef.current) {
      internalStreamRef.current.getTracks().forEach((track) => track.stop());
      internalStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  // Track elapsed listening duration
  useEffect(() => {
    if (status !== "listening") {
      return;
    }
    const start = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 200);
    return () => clearInterval(interval);
  }, [status]);

  // Setup Web Audio API microphone stream & AnalyserNode when listening
  useEffect(() => {
    let isCancelled = false;

    async function setupMicrophoneAnalyser() {
      if (status !== "listening") {
        cleanupAudio();
        setMetrics((prev) => ({
          ...prev,
          rmsVolume: 0,
          peakDb: -60,
          dominantHz: 0,
          isSpeechDetected: false,
          sourceMode: "standby",
        }));
        return;
      }

      try {
        let stream = externalStream ?? null;
        if (!stream && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          if (isCancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          internalStreamRef.current = stream;
        }

        if (stream && typeof window !== "undefined") {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

          if (AudioCtx) {
            const ctx = new AudioCtx();
            if (ctx.state === "suspended") {
              await ctx.resume();
            }
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.78;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            sourceNodeRef.current = source;

            setMetrics((prev) => ({ ...prev, sourceMode: "microphone" }));
            return;
          }
        }

        // Fallback to simulated acoustic wave if getUserMedia or AudioContext is unavailable
        if (!isCancelled) {
          setMetrics((prev) => ({ ...prev, sourceMode: "simulated" }));
        }
      } catch {
        // Permission denied or no mic hardware in sandbox; use simulated acoustic wave
        if (!isCancelled) {
          setMetrics((prev) => ({ ...prev, sourceMode: "simulated" }));
        }
      }
    }

    setupMicrophoneAnalyser();

    return () => {
      isCancelled = true;
      cleanupAudio();
    };
  }, [status, externalStream, cleanupAudio]);

  // Main Canvas Animation Loop (60fps real-time frequency + oscilloscope rendering)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastMetricsUpdate = 0;

    const freqData = new Uint8Array(128);
    const timeData = new Uint8Array(128);

    const renderFrame = (timestamp: number) => {
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 420;
      const height = rect.height || 112;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      phaseRef.current += 0.045;
      const t = timestamp / 1000;
      const analyser = analyserRef.current;

      const smoothed = smoothedBarsRef.current;
      if (smoothed.length !== barCount) {
        smoothedBarsRef.current = new Array(barCount).fill(0.08);
      }

      let currentRms = 0;
      let peakVal = 0;
      let maxBinIndex = 0;
      let maxBinValue = 0;

      if (status === "listening" && analyser) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // Compute RMS from time-domain data
        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const normalized = (timeData[i] - 128) / 128;
          sumSquares += normalized * normalized;
          const abs = Math.abs(normalized);
          if (abs > peakVal) peakVal = abs;
        }
        currentRms = Math.sqrt(sumSquares / timeData.length);

        // Map FFT bins to barCount with vocal-range weighting (bins 2..48 cover human voice fundamentals & harmonics)
        const usableBins = Math.min(56, freqData.length);
        for (let i = 0; i < barCount; i++) {
          // Symmetric center-weighted layout so vocal energy blooms from the center outward
          const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
          const binIdx = Math.min(
            usableBins - 1,
            Math.max(1, Math.floor(distFromCenter * (usableBins * 0.75)) + 1)
          );
          const rawVal = freqData[binIdx] / 255;

          if (freqData[binIdx] > maxBinValue && binIdx > 1) {
            maxBinValue = freqData[binIdx];
            maxBinIndex = binIdx;
          }

          // Add subtle organic micro-motion even in quiet room
          const floorWave = 0.06 + Math.sin(t * 3.2 + i * 0.35) * 0.025;
          const target = Math.max(floorWave, Math.min(1, rawVal * 1.35));
          smoothed[i] = smoothed[i] * 0.68 + target * 0.32;
        }
      } else if (status === "listening") {
        // Realistic speech cadence simulation when browser mic isn't available
        const syllableEnvelope =
          Math.max(0, Math.sin(t * 2.4) * 0.55 + Math.sin(t * 5.7) * 0.35 + Math.cos(t * 9.3) * 0.2);
        currentRms = 0.12 + syllableEnvelope * 0.42;
        peakVal = Math.min(1, currentRms * 1.65);
        maxBinIndex = Math.floor(6 + Math.sin(t * 3.1) * 3);
        maxBinValue = Math.floor(currentRms * 220);

        for (let i = 0; i < barCount; i++) {
          const centerWeight = 1 - Math.pow(Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2), 1.4);
          const harmonic1 = Math.sin(t * 6.5 + i * 0.45) * 0.28;
          const harmonic2 = Math.cos(t * 11.2 - i * 0.7) * 0.18;
          const formant = Math.sin(t * 18.4 + i * 1.1) * 0.08;
          const rawTarget =
            0.08 + centerWeight * syllableEnvelope * 0.85 + centerWeight * (harmonic1 + harmonic2 + formant);
          const clamped = Math.max(0.07, Math.min(0.96, rawTarget));
          smoothed[i] = smoothed[i] * 0.72 + clamped * 0.28;
        }
      } else if (status === "thinking") {
        // Meditative golden harmonic ripple while searching Scripture
        currentRms = 0.18;
        for (let i = 0; i < barCount; i++) {
          const wave =
            0.22 +
            Math.sin(t * 4.2 - i * 0.28) * 0.16 +
            Math.cos(t * 2.1 + i * 0.15) * 0.08;
          smoothed[i] = smoothed[i] * 0.8 + Math.max(0.08, wave) * 0.2;
        }
      } else {
        // Idle or answered: calm contemplative breathing baseline
        for (let i = 0; i < barCount; i++) {
          const centerFactor = 1 - Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
          const breathe = 0.07 + centerFactor * 0.08 * (0.5 + 0.5 * Math.sin(t * 1.6 + i * 0.2));
          smoothed[i] = smoothed[i] * 0.85 + breathe * 0.15;
        }
      }

      // Update React metrics throttled to ~8fps for smooth UI readout without excessive re-renders
      if (timestamp - lastMetricsUpdate > 120) {
        lastMetricsUpdate = timestamp;
        const normalizedVol = Math.min(1, currentRms * 2.2);
        if (onVolumeChange && status === "listening") {
          onVolumeChange(normalizedVol);
        }

        if (status === "listening") {
          const rmsPercent = Math.min(100, Math.round(normalizedVol * 100));
          const db = peakVal > 0.001 ? Math.max(-60, Math.round(20 * Math.log10(peakVal))) : -60;
          const sampleRate = audioContextRef.current?.sampleRate || 44100;
          const fftSize = analyser?.fftSize || 256;
          const hz =
            maxBinValue > 25 ? Math.round((maxBinIndex * sampleRate) / fftSize) : 0;

          setMetrics((prev) => ({
            ...prev,
            rmsVolume: rmsPercent,
            peakDb: db,
            dominantHz: hz,
            isSpeechDetected: rmsPercent > 16,
          }));
        }
      }

      // Draw subtle horizontal center reference line
      const centerY = height / 2;
      ctx.strokeStyle = "rgba(45, 37, 66, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, centerY);
      ctx.lineTo(width - 12, centerY);
      ctx.stroke();

      // Draw soft background glow behind active waveform
      if (status === "listening" || status === "thinking") {
        const glowGrad = ctx.createRadialGradient(
          width / 2,
          centerY,
          4,
          width / 2,
          centerY,
          width * 0.45
        );
        if (status === "listening") {
          glowGrad.addColorStop(0, "rgba(162, 91, 108, 0.16)");
          glowGrad.addColorStop(0.5, "rgba(112, 94, 170, 0.08)");
          glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        } else {
          glowGrad.addColorStop(0, "rgba(231, 185, 112, 0.22)");
          glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        }
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw smooth background spline wave (time-domain / harmonic carrier)
      ctx.beginPath();
      const horizontalPad = 16;
      const usableWidth = width - horizontalPad * 2;
      for (let i = 0; i < barCount; i++) {
        const x = horizontalPad + (i / (barCount - 1)) * usableWidth;
        const amp = smoothed[i] * (height * 0.36);
        const waveY = centerY + Math.sin(t * 5 + i * 0.45) * amp * 0.65;
        if (i === 0) {
          ctx.moveTo(x, waveY);
        } else {
          const prevX = horizontalPad + ((i - 1) / (barCount - 1)) * usableWidth;
          const prevAmp = smoothed[i - 1] * (height * 0.36);
          const prevY = centerY + Math.sin(t * 5 + (i - 1) * 0.45) * prevAmp * 0.65;
          const cx = (prevX + x) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cx, (prevY + waveY) / 2);
        }
      }
      ctx.strokeStyle =
        status === "listening"
          ? "rgba(31, 182, 176, 0.32)"
          : status === "thinking"
          ? "rgba(231, 185, 112, 0.45)"
          : "rgba(112, 94, 170, 0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw symmetric frequency spectrum bars
      const gap = Math.max(3, Math.floor(usableWidth / (barCount * 2.3)));
      const barWidth = Math.max(3, (usableWidth - gap * (barCount - 1)) / barCount);
      const maxBarHeight = height - 18;

      for (let i = 0; i < barCount; i++) {
        const val = smoothed[i];
        const barHeight = Math.max(5, val * maxBarHeight);
        const x = horizontalPad + i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        const barGrad = ctx.createLinearGradient(x, y, x, y + barHeight);
        if (status === "listening") {
          if (val > 0.6) {
            barGrad.addColorStop(0, "#1FB6B0");
            barGrad.addColorStop(0.5, "#A25B6C");
            barGrad.addColorStop(1, "#705EAA");
          } else {
            barGrad.addColorStop(0, "#A25B6C");
            barGrad.addColorStop(1, "#463665");
          }
        } else if (status === "thinking") {
          barGrad.addColorStop(0, "#E7B970");
          barGrad.addColorStop(0.5, "#C89648");
          barGrad.addColorStop(1, "#6A598B");
        } else if (status === "answered") {
          barGrad.addColorStop(0, "#1FB6B0");
          barGrad.addColorStop(1, "#57B9B1");
        } else {
          barGrad.addColorStop(0, "rgba(112, 94, 170, 0.45)");
          barGrad.addColorStop(1, "rgba(45, 37, 66, 0.35)");
        }

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 99);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);
    rafRef.current = animationFrameId;

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, barCount, onVolumeChange]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  return (
    <div
      id="voice-audio-waveform"
      data-testid="audio-waveform"
      data-status={status}
      className={`rounded-2xl border border-[#2D2542]/12 dark:border-white/15 bg-white/90 dark:bg-[#1B1630] backdrop-blur-xs p-4 shadow-xs transition-all ${className}`}
    >
      {/* Top Status & Real-Time Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              status === "listening"
                ? "bg-[#A25B6C] animate-ping"
                : status === "thinking"
                ? "bg-[#E7B970] animate-pulse"
                : status === "answered"
                ? "bg-[#1FB6B0]"
                : "bg-[#8D8496]"
            }`}
          />
          <span className="font-bold text-[#29243B] dark:text-[#FDFCFB] tracking-tight">
            {status === "listening"
              ? isFr
                ? "Entrée microphone en temps réel"
                : "Real-Time Microphone Input"
              : status === "thinking"
              ? isFr
                ? "Analyse acoustique & recherche biblique…"
                : "Analyzing voice & searching Scripture…"
              : status === "answered"
              ? isFr
                ? "Réponse biblique prête"
                : "Scripture response ready"
              : isFr
              ? "Visualiseur vocal prêt"
              : "Voice Visualizer Ready"}
          </span>

          {status === "listening" && (
            <span className="text-xs font-medium text-[#5A506B] dark:text-[#C8C2D6]">
              ·{" "}
              {metrics.sourceMode === "microphone"
                ? isFr
                  ? "Micro en direct"
                  : "Live Mic"
                : isFr
                ? "Aperçu acoustique"
                : "Acoustic Preview"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#5A506B] dark:text-[#C8C2D6]">
          {status === "listening" && (
            <>
              <span
                className={`font-bold ${
                  metrics.isSpeechDetected
                    ? "text-[#0A5F5B] dark:text-[#4EE2D8]"
                    : "text-[#6E6386] dark:text-[#A9A0BC]"
                }`}
              >
                {metrics.isSpeechDetected
                  ? isFr
                    ? "Voix active"
                    : "Voice Active"
                  : isFr
                  ? "Écoute…"
                  : "Listening…"}
              </span>
              {metrics.dominantHz > 0 && <span>· {metrics.dominantHz} Hz</span>}
              <span>· {metrics.peakDb} dB</span>
              <span className="font-bold text-[#A25B6C] dark:text-[#F49CAE]">
                · {formatTimer(elapsedSeconds)}
              </span>
            </>
          )}
          {status !== "listening" && (
            <span className="text-[#6E6386] dark:text-[#B8B0C8] font-sans">
              {isFr ? "Traitement local dans le navigateur" : "Browser-local Web Audio"}
            </span>
          )}
        </div>
      </div>

      {/* Real-time Waveform Canvas */}
      <div className="relative w-full h-24 sm:h-28 rounded-xl bg-gradient-to-b from-[#FAF8F5] to-[#F1EDF7] dark:from-[#120E22] dark:to-[#1E1836] overflow-hidden border border-[#2D2542]/8 dark:border-white/10">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          aria-label={
            isFr
              ? "Visualisation de l'onde sonore du microphone en temps réel"
              : "Real-time microphone audio waveform visualization"
          }
        />
      </div>

      {/* Bottom Live Input Level Meter */}
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6] shrink-0">
          {isFr ? "Niveau d'entrée" : "Input Level"}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-[#2D2542]/10 dark:bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-[#1FB6B0] via-[#705EAA] to-[#A25B6C]"
            style={{
              width: `${status === "listening" ? Math.max(6, metrics.rmsVolume) : status === "thinking" ? 35 : 4}%`,
            }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-[#29243B] dark:text-[#FDFCFB] w-9 text-right">
          {status === "listening" ? `${metrics.rmsVolume}%` : status === "thinking" ? "•••" : "0%"}
        </span>
      </div>
    </div>
  );
}

export default AudioWaveform;
