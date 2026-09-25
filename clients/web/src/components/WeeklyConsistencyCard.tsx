"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Check,
  Clock,
  Sparkle,
  CheckCircle,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { DayActivityRecord } from "./ProgressScreen";
import { useLanguage } from "@/lib/i18n";

export interface WeeklyConsistencyCardProps {
  calendarRecords: Record<string, DayActivityRecord>;
  todayStr: string;
  onUpdateRecord?: (dateStr: string, updated: DayActivityRecord) => void;
  onGracePointsAwarded?: (points: number) => void;
  className?: string;
}

export interface DayHabitStatus {
  dateStr: string;
  dayLabel: string;
  shortDate: string;
  isToday: boolean;
  met: boolean;
  minutes: number;
  isSabbath: boolean;
  practices: string[];
}

const STORAGE_OVERRIDE_KEY = "lifebook.weekly5MinHabit";

export function WeeklyConsistencyCard({
  calendarRecords,
  todayStr,
  onUpdateRecord,
  onGracePointsAwarded,
  className = "",
}: WeeklyConsistencyCardProps) {
  const { isFr } = useLanguage();
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [justCompletedToday, setJustCompletedToday] = useState(false);

  // Local overrides for manually marking 5-minute habit completed
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_OVERRIDE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Calculate the rolling last 7 days (today - 6 days through today)
  const last7Days: DayHabitStatus[] = useMemo(() => {
    const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNamesFr = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const days: DayHabitStatus[] = [];

    // Also check dailyDevotionGoal from localStorage if available
    let devotionHistory: Record<string, number> = {};
    let todayDevotionCompleted = false;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lifebook.dailyDevotionGoal");
        if (saved) {
          const parsed = JSON.parse(saved);
          devotionHistory = parsed.history || {};
          if (parsed.dateStr === todayStr && (parsed.completed || (parsed.secondsCompleted && parsed.secondsCompleted >= 300))) {
            todayDevotionCompleted = true;
          }
        }
      } catch {
        // ignore
      }
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = dateStr === todayStr;
      const rec = calendarRecords[dateStr];

      // Collect completed practices
      const practices: string[] = [];
      if (rec?.stillnessPractice) practices.push(isFr ? "Prière silencieuse" : "Silent Abiding");
      if (rec?.scriptureRead) practices.push(isFr ? "Lecture biblique" : "Scripture");
      if (rec?.prayerCompleted) practices.push(isFr ? "Prière du cœur" : "Heart Prayer");
      if (rec?.journalWritten) practices.push(isFr ? "Journal spirituel" : "Journal");

      // Check if 5-minute habit is met
      const hasDevotionLog =
        (devotionHistory[dateStr] && devotionHistory[dateStr] >= 300) ||
        (isToday && todayDevotionCompleted);

      const hasActivity = Boolean(
        rec &&
          (rec.intensity > 0 ||
            rec.stillnessPractice ||
            rec.scriptureRead ||
            rec.prayerCompleted ||
            rec.journalWritten ||
            rec.isSabbathRest)
      );

      const isManual = manualOverrides[dateStr];
      const isMet = isManual !== undefined ? isManual : (hasDevotionLog || hasActivity);

      // Estimate minutes
      let minutes = 0;
      if (isMet) {
        if (devotionHistory[dateStr]) {
          minutes = Math.round(devotionHistory[dateStr] / 60);
        } else if (rec?.intensity) {
          minutes = Math.max(5, rec.intensity * 4);
        } else {
          minutes = 5;
        }
      }

      const dayIndex = d.getDay();
      const dayLabel = isFr ? dayNamesFr[dayIndex] : dayNamesEn[dayIndex];
      const shortDate = `${d.getDate()} ${d.toLocaleDateString(isFr ? "fr-FR" : "en-US", { month: "short" })}`;

      days.push({
        dateStr,
        dayLabel: isToday ? (isFr ? "Aujourd'hui" : "Today") : dayLabel,
        shortDate,
        isToday,
        met: Boolean(isMet),
        minutes: isMet ? Math.max(5, minutes) : 0,
        isSabbath: Boolean(rec?.isSabbathRest),
        practices,
      });
    }

    return days;
  }, [calendarRecords, todayStr, manualOverrides, isFr]);

  // Aggregate metrics
  const metCount = useMemo(() => last7Days.filter((d) => d.met).length, [last7Days]);
  const scorePercent = Math.round((metCount / 7) * 100);
  const totalMinutesThisWeek = useMemo(
    () => last7Days.reduce((acc, d) => acc + d.minutes, 0),
    [last7Days]
  );
  const isTodayMet = useMemo(() => {
    const today = last7Days.find((d) => d.isToday);
    return Boolean(today?.met);
  }, [last7Days]);

  // Rhythm tier feedback
  const rhythmAssessment = useMemo(() => {
    if (metCount === 7) {
      return {
        label: isFr ? "Rythme parfait (7/7)" : "Flawless Rhythm (7/7)",
        desc: isFr
          ? "Fidélité remarquable ! Vous avez gardé le rendez-vous divin chaque jour cette semaine."
          : "Remarkable faithfulness! You kept your divine appointment every single day this week.",
        badgeColor: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
        icon: "✦",
      };
    }
    if (metCount >= 5) {
      return {
        label: isFr ? "Excellente régularité" : "Strong Consistency",
        desc: isFr
          ? "Un rythme solide et bien enraciné. La paix du Christ habite vos journées."
          : "A steady and deeply rooted rhythm. The peace of Christ anchors your week.",
        badgeColor: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
        icon: "🌿",
      };
    }
    if (metCount >= 3) {
      return {
        label: isFr ? "Croissance constante" : "Steady Growth",
        desc: isFr
          ? "Vous avez atteint votre habitude plus de la moitié de la semaine. Continuez ainsi !"
          : "You met your habit more than half the week. Each moment with God matters.",
        badgeColor: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
        icon: "🌱",
      };
    }
    if (metCount >= 1) {
      return {
        label: isFr ? "Éveil pas à pas" : "Gentle Awakening",
        desc: isFr
          ? "Chaque petit pas compte. 5 minutes suffisent pour ouvrir son cœur à Sa présence."
          : "Every small step counts. 5 quiet minutes are enough to open your soul to His presence.",
        badgeColor: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
        icon: "🕯️",
      };
    }
    return {
      label: isFr ? "Invitation ouverte" : "Open Invitation",
      desc: isFr
        ? "La grâce est nouvelle ce matin. Prenez 5 minutes aujourd'hui pour amorcer votre série."
        : "Grace is fresh this morning. Take 5 quiet minutes today to begin your streak.",
      badgeColor: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
      icon: "✨",
    };
  }, [metCount, isFr]);

  // Toggle or complete a day's habit
  const handleToggleDay = useCallback(
    (dateStr: string) => {
      const current = last7Days.find((d) => d.dateStr === dateStr)?.met;
      const nextState = !current;

      const nextOverrides = {
        ...manualOverrides,
        [dateStr]: nextState,
      };
      setManualOverrides(nextOverrides);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(nextOverrides));
        } catch {
          // ignore
        }
      }

      // If completing today, update calendarRecord and award points
      if (dateStr === todayStr && nextState) {
        const existing = calendarRecords[todayStr] || {
          date: todayStr,
          dayLabel: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          mood: "peaceful",
          intensity: 1,
          scriptureRead: true,
          prayerCompleted: true,
          stillnessPractice: true,
          journalWritten: false,
        };

        const updatedRecord: DayActivityRecord = {
          ...existing,
          stillnessPractice: true,
          prayerCompleted: true,
          intensity: Math.max(existing.intensity || 0, 2),
        };

        onUpdateRecord?.(todayStr, updatedRecord);
        onGracePointsAwarded?.(10);
        setJustCompletedToday(true);
        setTimeout(() => setJustCompletedToday(false), 3000);
      }
    },
    [last7Days, manualOverrides, todayStr, calendarRecords, onUpdateRecord, onGracePointsAwarded]
  );

  return (
    <div
      id="weekly-consistency-score-card"
      data-testid="weekly-consistency-score-card"
      className={`rounded-3xl bg-white dark:bg-[#161228] border border-[#2d2542]/10 dark:border-white/15 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${className}`}
      role="region"
      aria-label={
        isFr
          ? `Score de régularité hebdomadaire : ${metCount} sur 7 jours atteints`
          : `Weekly consistency score: ${metCount} of 7 days met`
      }
    >
      {/* Background ambient lighting accents */}
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#37C6C2]/10 dark:bg-[#37C6C2]/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-[#E8BA6A]/10 dark:bg-[#E8BA6A]/15 blur-3xl pointer-events-none" />

      {/* TOP HEADER ROW: Title & Consistency Score Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 pb-5 border-b border-[#2d2542]/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#2D2542]/5 dark:bg-white/10 text-[#4E4369] dark:text-[#D1C8E4] border border-[#2D2542]/10 dark:border-white/15">
              <Sparkle weight="fill" className="w-3 h-3 text-[#37C6C2]" />
              <span>{isFr ? "Habitude spirituelle" : "7-Day Habit Tracker"}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${rhythmAssessment.badgeColor}`}
            >
              <span>{rhythmAssessment.icon}</span>
              <span>{rhythmAssessment.label}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1931] dark:text-white tracking-tight">
            {isFr ? "Score de régularité hebdomadaire" : "Weekly Consistency Score"}
          </h2>
          <p className="text-xs sm:text-sm text-[#6C6182] dark:text-[#B6ADC9] mt-0.5">
            {isFr
              ? "Nombre de jours où votre habitude de 5 minutes a été tenue sur les 7 derniers jours."
              : "Days you met your 5-minute devotional stillness habit in the last 7 days."}
          </p>
        </div>

        {/* Score Readout Display */}
        <div className="flex items-baseline sm:flex-col sm:items-end gap-2 sm:gap-0 shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-serif font-bold text-[#1E1931] dark:text-white leading-none">
              {metCount}
            </span>
            <span className="text-xl sm:text-2xl font-serif font-normal text-[#756A8E] dark:text-[#A79CBF]">
              / 7
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-[#0E716D] dark:text-[#37C6C2]">
            <ShieldCheck weight="fill" className="w-3.5 h-3.5" />
            <span>{scorePercent}% {isFr ? "Régularité" : "Consistency"}</span>
          </div>
        </div>
      </div>

      {/* PROGRESS DOTS VISUAL TRACK */}
      <div className="mt-6 pt-1 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-[#4E4369] dark:text-[#C8BFDE] flex items-center gap-1.5">
            <Clock weight="bold" className="w-3.5 h-3.5 text-[#37C6C2]" />
            <span>{isFr ? "Parcours des 7 derniers jours :" : "Last 7 Days Progress Track:"}</span>
          </span>
          <span className="text-[11px] text-[#7E7494] dark:text-[#A297B8]">
            {isFr ? "Cible : 5 min / jour" : "Target: 5 mins / day"}
          </span>
        </div>

        {/* The Series of Progress Dots with connecting track */}
        <div className="relative pt-3 pb-2">
          {/* Connecting Track Line */}
          <div
            className="absolute top-[28px] left-[20px] right-[20px] h-[3px] bg-[#2D2542]/10 dark:bg-white/10 rounded-full z-0 pointer-events-none"
            aria-hidden="true"
          >
            {/* Dynamic Fill bar based on met percentage */}
            <div
              className="h-full bg-gradient-to-r from-[#0E716D] via-[#37C6C2] to-[#E8BA6A] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, (metCount / 7) * 100))}%` }}
            />
          </div>

          {/* Dots Flex Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-3 relative z-10">
            {last7Days.map((day) => {
              const isSelected = selectedDayDate === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  className="flex flex-col items-center group relative cursor-pointer"
                  onClick={() => setSelectedDayDate(isSelected ? null : day.dateStr)}
                >
                  {/* The Progress Dot */}
                  <button
                    type="button"
                    data-testid="progress-dot"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDay(day.dateStr);
                    }}
                    className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#37C6C2] focus-visible:outline-offset-2 ${
                      day.met
                        ? "bg-gradient-to-br from-[#10706D] to-[#0A524F] text-white shadow-md shadow-[#10706D]/25 hover:scale-108 ring-4 ring-[#10706D]/15 dark:ring-[#37C6C2]/20"
                        : day.isToday
                        ? "bg-white dark:bg-[#201A38] border-2 border-[#37C6C2] text-[#0E716D] dark:text-[#37C6C2] ring-4 ring-[#37C6C2]/25 animate-pulse"
                        : "bg-[#FAF7F2] dark:bg-[#1E1834] border-2 border-dashed border-[#2D2542]/20 dark:border-white/20 text-[#8E83A4] dark:text-[#8E83A4] hover:border-[#37C6C2]/60 hover:text-[#10706D]"
                    } ${isSelected ? "scale-110 ring-4 ring-[#E8BA6A]" : ""}`}
                    aria-label={`${day.dayLabel} (${day.shortDate}): ${
                      day.met
                        ? isFr
                          ? "Habitude de 5 minutes accomplie"
                          : "5-minute habit met"
                        : isFr
                        ? "Non accomplie"
                        : "Not yet met"
                    }`}
                    title={
                      day.met
                        ? `${day.dayLabel}: ${isFr ? "Habitude accomplie (5+ min)" : "Habit met (5+ mins)"} · Click to toggle`
                        : `${day.dayLabel}: ${isFr ? "Non accomplie" : "Not yet met"} · Click to complete`
                    }
                  >
                    {day.met ? (
                      <Check weight="bold" className="w-5 h-5 text-white" />
                    ) : day.isToday ? (
                      <Clock weight="fill" className="w-5 h-5 text-[#0E716D] dark:text-[#37C6C2]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#2D2542]/25 dark:bg-white/25" />
                    )}

                    {/* Today Floating Badge */}
                    {day.isToday && (
                      <span className="absolute -top-2 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-[#37C6C2] text-[#0E4240] shadow-xs">
                        {isFr ? "Auj" : "Now"}
                      </span>
                    )}
                  </button>

                  {/* Day Label & Date */}
                  <div className="mt-2 text-center select-none">
                    <p
                      className={`text-[11px] sm:text-xs font-bold transition-colors ${
                        day.isToday
                          ? "text-[#10706D] dark:text-[#37C6C2]"
                          : day.met
                          ? "text-[#1E1931] dark:text-white"
                          : "text-[#7E7494] dark:text-[#9F94B6]"
                      }`}
                    >
                      {day.dayLabel}
                    </p>
                    <p className="text-[10px] text-[#9389A8] dark:text-[#7A6F93] leading-none mt-0.5">
                      {day.shortDate.split(" ")[0]}
                    </p>
                  </div>

                  {/* Micro Status Chip below dot */}
                  <div className="mt-1.5">
                    {day.met ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#10706D]/10 dark:bg-[#37C6C2]/15 text-[#10706D] dark:text-[#37C6C2]">
                        <span>✓</span>
                        <span>{day.minutes}m</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#A69DB8] dark:text-[#675C82]">
                        —
                      </span>
                    )}
                  </div>

                  {/* Interactive Day Details Tooltip on Hover/Click */}
                  {isSelected && (
                    <div
                      role="tooltip"
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 min-w-[190px] p-3 rounded-xl bg-[#141022] text-white text-xs border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] text-[#F7CB7A] mb-1">
                        <span>{day.dayLabel} · {day.shortDate}</span>
                        <span className="text-[10px] text-white/70">
                          {day.met ? "✓ Met" : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#D8D2E4] leading-relaxed mb-2">
                        {day.met
                          ? isFr
                            ? `✓ Habitude de 5 min respectée (${day.minutes} mins au sanctuaire).`
                            : `✓ 5-minute stillness habit met (${day.minutes} mins in the sanctuary).`
                          : isFr
                          ? "Habitude non enregistrée pour ce jour."
                          : "Habit not recorded for this day."}
                      </p>
                      {day.practices.length > 0 && (
                        <div className="text-[10px] text-[#9DE1DD] mb-2 flex flex-wrap gap-1">
                          {day.practices.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 bg-white/10 rounded-md">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleDay(day.dateStr)}
                        className="w-full py-1 px-2 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[10px] transition-colors cursor-pointer text-center"
                      >
                        {day.met
                          ? isFr
                            ? "Marquer comme non fait"
                            : "Mark as Incomplete"
                          : isFr
                          ? "Marquer 5 min terminées ✓"
                          : "Mark 5 Mins Done ✓"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* METRICS SUMMARY BAR: 3 Micro-indicators */}
      <div className="mt-4 pt-4 border-t border-[#2D2542]/10 dark:border-white/10 grid grid-cols-3 gap-2 sm:gap-4 text-center">
        {/* Metric 1 */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1632] p-2.5 sm:p-3 rounded-2xl border border-[#2D2542]/5 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#73688C] dark:text-[#A89EC0]">
            {isFr ? "Jours validés" : "Days Met"}
          </p>
          <p className="text-base sm:text-lg font-serif font-bold text-[#1E1931] dark:text-white mt-0.5">
            {metCount} / 7
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1632] p-2.5 sm:p-3 rounded-2xl border border-[#2D2542]/5 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#73688C] dark:text-[#A89EC0]">
            {isFr ? "Temps cumulé" : "Time in Stillness"}
          </p>
          <p className="text-base sm:text-lg font-serif font-bold text-[#10706D] dark:text-[#37C6C2] mt-0.5">
            {totalMinutesThisWeek} mins
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1632] p-2.5 sm:p-3 rounded-2xl border border-[#2D2542]/5 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#73688C] dark:text-[#A89EC0]">
            {isFr ? "Cible quotidienne" : "Daily Target"}
          </p>
          <p className="text-base sm:text-lg font-serif font-bold text-[#E8BA6A] mt-0.5">
            5 {isFr ? "min / jour" : "mins / day"}
          </p>
        </div>
      </div>

      {/* QUICK INTERACTIVE CTA / CELEBRATION */}
      <div className="mt-5 relative z-10">
        {!isTodayMet ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#0E716D]/10 via-[#37C6C2]/10 to-[#FAF8F5] dark:from-[#37C6C2]/15 dark:to-[#1D1736] border border-[#0E716D]/20 dark:border-[#37C6C2]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0E716D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock weight="bold" className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E1931] dark:text-white">
                  {isFr ? "Habitude d'aujourd'hui en attente" : "Today's 5-Minute Habit Pending"}
                </p>
                <p className="text-[11px] text-[#6C6182] dark:text-[#B6ADC9]">
                  {isFr
                    ? "Accordez-vous 5 minutes de paix avec Christ pour compléter votre score."
                    : "Spend 5 minutes in silent Scripture and prayer to keep your weekly score high."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleDay(todayStr)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#10706D] hover:bg-[#0A524F] text-white shadow-sm transition-all cursor-pointer shrink-0"
            >
              <span>{isFr ? "Valider mes 5 minutes aujourd'hui" : "Mark Today's 5 Mins Done"}</span>
              <span className="text-amber-300 font-extrabold">+10 GP</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#E8F8F7] dark:bg-[#16302E] border border-[#9DE1DD] dark:border-[#37C6C2]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#10706D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle weight="fill" className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0E5C58] dark:text-emerald-300">
                  {isFr
                    ? "Habitude de 5 minutes validée pour aujourd'hui ! ✓"
                    : "Today's 5-Minute Habit Met! ✓"}
                </p>
                <p className="text-[11px] text-[#1E736F] dark:text-emerald-200/80">
                  {justCompletedToday
                    ? isFr
                      ? "Félicitations ! +10 Points de Grâce ont été crédités."
                      : "Grace rewarded! +10 Grace Points added to your pilgrim journey."
                    : rhythmAssessment.desc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleDay(todayStr)}
              className="text-[11px] font-semibold text-[#10706D] hover:text-[#0A524F] dark:text-emerald-300 underline cursor-pointer shrink-0"
            >
              {isFr ? "Modifier" : "Toggle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeeklyConsistencyCard;
