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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-300 dark:border-stone-800 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-900 dark:text-amber-400 font-semibold">
              {isFr ? "ENSEIGNEMENTS PASTORAUX" : "PASTORAL AUDIO TEACHINGS"}
            </p>
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              {isFr
                ? "Voix Pastorales & Méditations Guidées"
                : "Verified Pastoral Voices & Guided Meditations"}
            </h2>
          </div>

          <Link
            href="/teachers"
            className="text-xs font-mono uppercase tracking-wider text-amber-900 dark:text-amber-400 hover:underline"
          >
            {isFr
              ? "Ouvrir le Portail des Enseignants & Analytique →"
              : "Open Teachers Portal & Analytics →"}
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
              className="p-6 rounded-lg sanctuary-card flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={teaching.portrait}
                      alt={teaching.teacher}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border border-stone-300 dark:border-stone-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {teaching.teacher}
                      </p>
                      <p className="text-[11px] font-mono text-stone-500">
                        {categoryLabel}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-stone-500 tabular-nums">
                    {duration}
                  </span>
                </div>

                <p className="font-mono text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-400 font-semibold">
                  {scripture}
                </p>

                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                  <Link
                    href={`/living-word/${teaching.slug}`}
                    className="hover:underline"
                  >
                    {title}
                  </Link>
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                  {excerpt}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    if (currentTrack?.slug === teaching.slug) {
                      togglePlay();
                    } else {
                      playTeaching(teaching);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-amber-800 text-white"
                      : "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900"
                  }`}
                >
                  {isCurrent
                    ? isFr
                      ? "En écoute"
                      : "Playing"
                    : isFr
                    ? "Écouter"
                    : "Listen"}
                </button>

                <Link
                  href={`/living-word/${teaching.slug}`}
                  className="py-2 px-3 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
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
