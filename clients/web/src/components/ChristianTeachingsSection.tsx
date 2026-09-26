"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n";
import {
  getAllTeachings,
  CATALOG_CHANGE_EVENT,
  type Teaching,
} from "@/app/livingWordData";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";

interface ChristianTeachingsSectionProps {
  maxItems?: number;
  showHeader?: boolean;
}

export default function ChristianTeachingsSection({
  maxItems,
  showHeader = true,
}: ChristianTeachingsSectionProps) {
  const { isFr } = useLanguage();
  const { playTeaching, currentTrack, isPlaying, togglePlay } =
    useSanctuaryAudio();

  const [teachings, setTeachings] = useState<Teaching[]>(() =>
    getAllTeachings()
  );

  useEffect(() => {
    const sync = () => setTeachings(getAllTeachings());
    window.addEventListener(CATALOG_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const displayed = maxItems ? teachings.slice(0, maxItems) : teachings;

  return (
    <section className="space-y-6">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <span className="showcase-eyebrow">
              {isFr ? "ENSEIGNEMENTS PASTORAUX" : "PASTORAL AUDIO TEACHINGS"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1931] dark:text-white">
              {isFr
                ? "Voix Pastorales & Méditations Guidées"
                : "Verified Pastoral Voices & Guided Meditations"}
            </h2>
          </div>

          <Link
            href="/teachers"
            className="pill-button pill-light text-xs font-bold"
          >
            {isFr
              ? "Portail des Enseignants & Analytique →"
              : "Teachers Portal & Analytics →"}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayed.map((teaching) => {
          const title = isFr ? teaching.titleFr : teaching.title;
          const excerpt = isFr ? teaching.excerptFr : teaching.excerpt;
          const categoryLabel = isFr ? teaching.categoryFr : teaching.category;
          const scripture = isFr ? teaching.scriptureFr : teaching.scripture;
          const duration = isFr ? teaching.durationFr : teaching.duration;
          const isCurrent = currentTrack?.slug === teaching.slug && isPlaying;

          return (
            <article
              key={teaching.slug}
              className="p-6 rounded-3xl bg-white dark:bg-[#1B152C] border border-[#2D2542]/10 dark:border-white/10 shadow-[0_12px_32px_rgba(30,25,49,0.06)] flex flex-col justify-between gap-5 transition-all hover:-translate-y-0.5"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#2D2542]/10 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <Image
                      src={teaching.portrait}
                      alt={teaching.teacher}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-2xl object-cover border border-[#2D2542]/15 dark:border-white/20"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#1E1931] dark:text-white">
                        {teaching.teacher}
                      </p>
                      <p className="text-[11px] font-semibold text-[#1FB6B0]">
                        {categoryLabel}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F5F0E7] dark:bg-white/10 font-mono text-[11px] font-semibold text-[#5A506B] dark:text-[#C8C2D6] tabular-nums">
                    {duration}
                  </span>
                </div>

                <p className="font-mono text-[11px] uppercase tracking-wider text-[#8A5E0B] dark:text-[#E3B15E] font-bold">
                  {scripture}
                </p>

                <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white leading-snug">
                  <Link
                    href={`/living-word/${teaching.slug}`}
                    className="hover:text-[#1FB6B0] transition-colors"
                  >
                    {title}
                  </Link>
                </h3>

                <p className="text-xs sm:text-sm text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed line-clamp-3">
                  {excerpt}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-[#2D2542]/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (currentTrack?.slug === teaching.slug) {
                      togglePlay();
                    } else {
                      playTeaching(teaching);
                    }
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-[#1FB6B0] text-[#082220] shadow-sm"
                      : "bg-[#1E1931] dark:bg-[#37C6C2] text-white dark:text-[#092221] hover:opacity-95"
                  }`}
                >
                  <span>{isCurrent ? "❚❚" : "▶"}</span>
                  <span>
                    {isCurrent
                      ? isFr
                        ? "En écoute"
                        : "Playing"
                      : isFr
                      ? "Écouter"
                      : "Listen"}
                  </span>
                </button>

                <Link
                  href={`/living-word/${teaching.slug}`}
                  className="py-2.5 px-4 rounded-full border border-[#2D2542]/15 dark:border-white/15 text-xs font-bold text-[#1E1931] dark:text-white hover:bg-[#F5F0E7] dark:hover:bg-white/10 transition-colors"
                >
                  {isFr ? "Étudier" : "Study"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export { ChristianTeachingsSection };
