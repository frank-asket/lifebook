"use client";

import React from "react";
import { HandsPraying } from "@phosphor-icons/react";
import { FellowshipSanctuarySection } from "@/components/FellowshipSanctuarySection";
import { YouVersionNavbar } from "@/components/YouVersionNavbar";

export default function FellowshipPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100">
      <YouVersionNavbar activeTab="fellowship" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#2A2146] via-[#1F1835] to-[#151024] text-white p-6 sm:p-10 shadow-lg border border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-4">
            <HandsPraying size={15} weight="fill" />
            <span>Galatians 6:2 • Community Intercession & Praise</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            The Fellowship Sanctuary
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-200/90 max-w-2xl leading-relaxed">
            A calm, moderated circle where believers lift up prayer requests across every season of life, celebrate answered prayer testimonies, and anchor one another in Scripture.
          </p>
        </div>

        <FellowshipSanctuarySection />
      </main>
    </div>
  );
}
