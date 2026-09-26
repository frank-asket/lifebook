"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, HandsPraying, BookOpenText, Users } from "@phosphor-icons/react";
import { FellowshipSanctuarySection } from "@/components/FellowshipSanctuarySection";
import { LifeBookLogo } from "@/components/LifeBookLogo";

export default function FellowshipPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 dark:bg-[#0D1117]/90 backdrop-blur-md border-b border-[#E6DFD3] dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Sanctuary</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <LifeBookLogo size={24} rounded="rounded-lg" />
              <span className="font-serif font-bold text-sm sm:text-base">
                LifeBook Fellowship Sanctuary
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/living-word"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <BookOpenText size={15} />
              <span>Living Word</span>
            </Link>
            <Link
              href="/teachers"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Users size={15} />
              <span>Pastoral Directory</span>
            </Link>
          </nav>
        </div>
      </header>

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
