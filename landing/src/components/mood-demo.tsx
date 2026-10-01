"use client";

import { useState } from "react";
import { moods } from "@/lib/content";

export function MoodDemo() {
  const [selected, setSelected] = useState(moods[2]);

  return (
    <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {moods.map((mood) => {
            const active = mood.id === selected.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => setSelected(mood)}
                aria-pressed={active}
                className={`rounded-2xl border px-4 py-5 text-left transition-colors ${
                  active
                    ? "border-accent bg-accent-soft/60 text-foreground"
                    : "border-border-subtle bg-surface text-muted hover:border-lilac/60 hover:text-foreground"
                }`}
              >
                <span className="block font-serif text-lg text-foreground">{mood.label}</span>
                <span className="mt-1 block text-xs leading-relaxed">{mood.blurb}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">
          Six words, chosen from LifeWay Research, Barna Group and the Ignatian examen — and still
          being tested on real people before they are treated as settled.
        </p>
      </div>

      <figure className="rounded-3xl border border-border-subtle bg-surface-raised p-7">
        <figcaption className="text-xs uppercase tracking-[0.2em] text-accent">
          Arriving {selected.label.toLowerCase()}
        </figcaption>
        <blockquote className="mt-4 font-serif text-xl leading-relaxed">
          “{selected.verse}”
        </blockquote>
        <p className="mt-3 text-sm text-muted">{selected.reference}</p>
        <p className="mt-6 border-t border-border-subtle pt-5 text-sm leading-relaxed text-muted">
          In the app this verse arrives with a short note on why it was chosen, then opens the
          five-step flow. Verses come from a fixed, vetted corpus — the model writes the reflection
          around scripture, it never writes the scripture.
        </p>
      </figure>
    </div>
  );
}
