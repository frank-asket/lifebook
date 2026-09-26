"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  useHumanVoice,
  type VoiceRegionFamily,
  type HumanVoicePersona,
} from "@/lib/human-voice";

interface HumanVoiceSelectorProps {
  compact?: boolean;
  darkSurface?: boolean;
}

export function HumanVoiceSelector({
  compact = false,
  darkSurface = false,
}: HumanVoiceSelectorProps) {
  const { isFr } = useLanguage();
  const {
    personas,
    activePersona,
    selectPersona,
    previewPersona,
    stopPreview,
    isPreviewing,
  } = useHumanVoice(isFr);

  const [regionFilter, setRegionFilter] = useState<"all" | VoiceRegionFamily>("all");
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const filteredPersonas =
    regionFilter === "all"
      ? personas
      : personas.filter((p) => p.region === regionFilter);

  const handleSelectAndPreview = async (p: HumanVoicePersona, shouldPlaySample: boolean) => {
    selectPersona(p.id);
    if (shouldPlaySample) {
      if (isPreviewing && previewingId === p.id) {
        stopPreview();
        setPreviewingId(null);
        return;
      }
      setPreviewingId(p.id);
      await previewPersona(p);
    }
  };

  if (compact) {
    return (
      <div
        className={`rounded-2xl border p-3.5 space-y-3 ${
          darkSurface
            ? "bg-white/5 border-white/12 text-white"
            : "bg-[#FAF8F5] dark:bg-[#19142B] border-[#2D2542]/12 dark:border-white/12 text-[#1E1931] dark:text-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold">
              🗣️ {isFr ? "Voix Humaine Pastorale :" : "Human Pastoral Voice:"}
            </span>
            <span className="font-semibold text-[#0E726D] dark:text-[#4EE2D8]">
              {activePersona.countryFlag} {activePersona.name} ({activePersona.cityLabel})
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSelectAndPreview(activePersona, true)}
            className="px-2.5 py-1 rounded-lg bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            {isPreviewing
              ? isFr
                ? "⏹ Arrêter l'extrait"
                : "⏹ Stop Sample"
              : isFr
              ? "🔊 Écouter la Voix"
              : "🔊 Preview Voice"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {personas.map((p) => {
            const isSelected = p.id === activePersona.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectAndPreview(p, false)}
                className={`px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer border flex items-center justify-between gap-1.5 ${
                  isSelected
                    ? darkSurface
                      ? "bg-[#2A2146] border-[#4EE2D8] text-white font-bold"
                      : "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-transparent font-bold"
                    : darkSurface
                    ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    : "bg-white dark:bg-[#120E22] border-[#2D2542]/10 dark:border-white/10 text-[#5A506B] dark:text-[#C8C2D6]"
                }`}
              >
                <span className="truncate">
                  {p.countryFlag} {p.name}
                </span>
                <span className="text-[10px] font-mono opacity-80 shrink-0">
                  {p.langCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/12 dark:border-white/15 p-6 sm:p-7 shadow-sm space-y-5">
      {/* Header + Region Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2D2542]/10 dark:border-white/12">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#0E726D] dark:text-[#4EE2D8] font-mono font-semibold">
            <span>🗣️ NEURAL HUMAN VOICE STUDIO</span>
            <span aria-hidden="true">·</span>
            <span>🇳🇬 NIGERIAN (EN) · 🇨🇮 CÔTE D&apos;IVOIRE (FR) · 🇺🇸 AMERICAN (EN)</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white">
            {isFr
              ? "Choisissez Votre Voix Humaine Pastorale"
              : "Choose Your Human Pastoral Voice & Regional Cadence"}
          </h3>
          <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6]">
            {isFr
              ? "Voix neuronales chaleureuses avec respirations naturelles : Africaine (Nigéria pour l'anglais, Côte d'Ivoire pour le français) et Américaine."
              : "Warm neural voices with natural breath phrasing: African (Nigerian for English, Côte d'Ivoire for French) and American."}
          </p>
        </div>

        {/* Regional Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F2ECE1] dark:bg-[#120E22] border border-[#2D2542]/10 dark:border-white/10">
          {[
            { id: "all" as const, labelEn: "All Voices (6)", labelFr: "Toutes (6)" },
            {
              id: "african-ng" as const,
              labelEn: "🇳🇬 Nigerian (EN)",
              labelFr: "🇳🇬 Nigéria (EN)",
            },
            {
              id: "african-ci" as const,
              labelEn: "🇨🇮 Côte d'Ivoire (FR)",
              labelFr: "🇨🇮 Côte d'Ivoire (FR)",
            },
            {
              id: "american-us" as const,
              labelEn: "🇺🇸 American (EN)",
              labelFr: "🇺🇸 Américain (EN)",
            },
          ].map((tab) => {
            const active = regionFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRegionFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18]"
                    : "text-[#5A506B] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
                }`}
              >
                {isFr ? tab.labelFr : tab.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonas.map((p) => {
          const isSelected = p.id === activePersona.id;
          const isCurrentlyPlayingThis = isPreviewing && previewingId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => selectPersona(p.id)}
              className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? "bg-[#FAF6EE] dark:bg-[#251E40] border-[#1FB6B0] shadow-sm"
                  : "bg-[#FAF8F5] dark:bg-[#141024] border-[#2D2542]/10 dark:border-white/10 hover:border-[#2D2542]/25"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                    {p.countryFlag} {isFr ? p.regionBadgeFr : p.regionBadgeEn}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#2D2542]/8 dark:bg-white/10 text-[#1E1931] dark:text-white">
                    {p.langCode}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-serif font-bold text-[#1E1931] dark:text-white">
                      {p.name}
                    </h4>
                    {isSelected && (
                      <span className="text-[11px] font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                        ✓ {isFr ? "Active" : "Active"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6]">
                    {p.cityLabel} · {isFr ? p.timbreFr : p.timbreEn}
                  </div>
                </div>

                <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                  {isFr ? p.descriptionFr : p.descriptionEn}
                </p>
              </div>

              <div className="pt-2 border-t border-[#2D2542]/8 dark:border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAndPreview(p, true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isCurrentlyPlayingThis
                      ? "bg-amber-500 text-[#1E1931]"
                      : "bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B]"
                  }`}
                >
                  {isCurrentlyPlayingThis
                    ? isFr
                      ? "⏹ Arrêter l'écoute"
                      : "⏹ Stop Sample"
                    : isFr
                    ? "🔊 Écouter un Extrait"
                    : "🔊 Hear Voice Sample"}
                </button>

                <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6] font-medium">
                  {isSelected
                    ? isFr
                      ? "Sélectionnée"
                      : "Selected"
                    : isFr
                    ? "Cliquer pour choisir"
                    : "Click to use"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
