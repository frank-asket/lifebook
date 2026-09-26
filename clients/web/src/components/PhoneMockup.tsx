"use client";

import React, { useState } from "react";
import {
  Leaf,
  Compass,
  SunHorizon,
  ChatCenteredText,
  Flame,
  ShieldCheck,
  NotePencil,
  Microphone,
  LockKey,
  Play,
  Pause,
  Check,
  BookOpenText,
  ArrowDown,
} from "@phosphor-icons/react";
import { useLanguage } from "@/lib/i18n";

export function PhoneMockup() {
  const { isFr, t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<"peace" | "seek" | "grateful" | "doubt">("peace");
  const [activePhoneTab, setActivePhoneTab] = useState<"today" | "journeys" | "voice" | "journal">("today");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showPrayerGuide, setShowPrayerGuide] = useState(false);

  const renderMoodIcon = (id: "peace" | "seek" | "grateful" | "doubt", size = 14) => {
    switch (id) {
      case "peace":
        return <Leaf size={size} weight="duotone" className="text-[#1c3e34]" />;
      case "seek":
        return <Compass size={size} weight="duotone" className="text-[#34244f]" />;
      case "grateful":
        return <SunHorizon size={size} weight="duotone" className="text-[#4f3a12]" />;
      case "doubt":
        return <ChatCenteredText size={size} weight="duotone" className="text-[#1c3b4f]" />;
    }
  };

  const moodData = {
    peace: {
      id: "peace" as const,
      name: isFr ? "Paisible" : "Peaceful",
      sub: isFr ? "S'ancrer dans le repos" : "Rest in God's peace",
      bgClass: "bg-[#e5f4ee] hover:bg-[#d8ede5] text-[#1c3e34]",
      borderClass: "border-[#bce2d3]",
      journeyTitle: isFr ? "La paix dans le travail" : "Peace in Busy Workdays",
      journeyDay: 3,
      journeyTotal: 5,
      journeyPercent: 60,
      quote: isFr
        ? "« L'Éternel est mon berger : je ne manquerai de rien. »"
        : "“The Lord is my shepherd; I shall not want.”",
      ref: isFr ? "Psaume 23:1 (LSG)" : "Psalm 23:1 (ESV)",
      reflectionPrompt: isFr
        ? "Où avez-vous besoin de déposer vos fardeaux aujourd'hui ?"
        : "Where do you need to surrender control to God today?",
      prayerSample: isFr
        ? "« Seigneur, je m'abandonne à Ta paix. Sois mon guide dans les urgences du jour. Amen. »"
        : "“Lord, I rest in Your guidance today. Quiet my hurry and steady my heart. Amen.”",
    },
    seek: {
      id: "seek" as const,
      name: isFr ? "En quête" : "Seeking",
      sub: isFr ? "Sagesse & discernement" : "Wisdom for decisions",
      bgClass: "bg-[#eee7f8] hover:bg-[#e3d9f3] text-[#34244f]",
      borderClass: "border-[#d5c5ed]",
      journeyTitle: isFr ? "Sagesse et discernement" : "Clarity in Decisions",
      journeyDay: 1,
      journeyTotal: 5,
      journeyPercent: 20,
      quote: isFr
        ? "« Si quelqu'un d'entre vous manque de sagesse, qu'il la demande à Dieu. »"
        : "“If any of you lacks wisdom, you should ask God, who gives generously.”",
      ref: isFr ? "Jacques 1:5 (LSG)" : "James 1:5 (ESV)",
      reflectionPrompt: isFr
        ? "Quelle décision difficile nécessite la clarté de Dieu ce matin ?"
        : "What major decision requires divine clarity this morning?",
      prayerSample: isFr
        ? "« Père céleste, éclaire mes choix. Que mes paroles reflètent Ta justice. Amen. »"
        : "“Heavenly Father, align my choices with Your purpose. Grant me wisdom. Amen.”",
    },
    grateful: {
      id: "grateful" as const,
      name: isFr ? "Reconnaissant" : "Grateful",
      sub: isFr ? "Célébrer Sa fidélité" : "Count today's blessings",
      bgClass: "bg-[#fdf1d6] hover:bg-[#f7e7c3] text-[#4f3a12]",
      borderClass: "border-[#edd5a2]",
      journeyTitle: isFr ? "La gratitude au réveil" : "The Habit of Thankfulness",
      journeyDay: 4,
      journeyTotal: 5,
      journeyPercent: 80,
      quote: isFr
        ? "« Rendez grâces en toutes choses, car c'est la volonté de Dieu en Jésus-Christ. »"
        : "“Give thanks in all circumstances; for this is God's will in Christ.”",
      ref: isFr ? "1 Thessaloniciens 5:18 (LSG)" : "1 Thessalonians 5:18 (ESV)",
      reflectionPrompt: isFr
        ? "Quelles sont les 3 grâces inattendues reçues au cours des 24h passées ?"
        : "What 3 unexpected blessings did you receive in the past 24 hours?",
      prayerSample: isFr
        ? "« Merci Seigneur pour Ta bonté qui se renouvelle chaque matin pour moi. Amen. »"
        : "“Thank You Lord for Your steadfast love that is renewed every single morning. Amen.”",
    },
    doubt: {
      id: "doubt" as const,
      name: isFr ? "Interrogations" : "Questions",
      sub: isFr ? "Déposer ses soucis" : "Cast your anxieties",
      bgClass: "bg-[#e2eff7] hover:bg-[#d2e5f1] text-[#1c3b4f]",
      borderClass: "border-[#bcd6e8]",
      journeyTitle: isFr ? "Surmonter l'anxiété" : "Overcoming Fear & Anxiety",
      journeyDay: 2,
      journeyTotal: 5,
      journeyPercent: 40,
      quote: isFr
        ? "« Déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous. »"
        : "“Cast all your anxiety on him because he cares for you.”",
      ref: isFr ? "1 Pierre 5:7 (LSG)" : "1 Peter 5:7 (ESV)",
      reflectionPrompt: isFr
        ? "Qu'est-ce qui alourdit votre esprit en ce moment même ?"
        : "What worry is weighing heaviest on your shoulders right now?",
      prayerSample: isFr
        ? "« Seigneur, je Te confie ce fardeau. Remplace mon anxiété par Ta sérénité. Amen. »"
        : "“Lord, I release this pressure to You. Replace my anxiety with Your quiet calm. Amen.”",
    },
  };

  const currentMood = moodData[selectedMood];

  return (
    <div className="relative w-full py-6 flex items-center justify-center" aria-label="LifeBook app interactive preview">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] rounded-full pointer-events-none -z-10"
        style={{
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.75) 0%, rgba(235, 226, 245, 0.45) 45%, rgba(246, 217, 221, 0) 75%)",
        }}
      />

      {/* Floating Card: Study Track (Top Right on desktop) */}
      <div
        className="hidden lg:flex flex-col gap-2.5 absolute -top-2 right-2 xl:-right-6 z-20 w-[248px] p-4 rounded-2xl bg-white/95 dark:bg-[#1B1630]/95 backdrop-blur-md border border-[#2d2542]/12 dark:border-white/15 shadow-[0_14px_32px_-6px_rgba(45,37,66,0.14)] transition-all duration-200 pointer-events-auto"
        id="preview-study-floating-card"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#5A4B7C] dark:text-[#C8C2D6]">
          <span className="flex items-center gap-1.5">
            {renderMoodIcon(currentMood.id, 15)}
            <span>{isFr ? "Parcours actif" : "Active 5-Day Study"}</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[#3bb582]" />
        </div>

        <strong className="font-serif text-sm text-[#2d2542] dark:text-white leading-tight font-semibold">
          {currentMood.journeyTitle}
        </strong>

        <div className="flex items-center justify-between text-xs text-[#5A506B] dark:text-[#C8C2D6] tabular-nums">
          <span>{isFr ? `Jour ${currentMood.journeyDay} sur ${currentMood.journeyTotal}` : `Day ${currentMood.journeyDay} of ${currentMood.journeyTotal}`}</span>
          <span className="font-bold text-[#1D8A5F] dark:text-[#4EE2D8]">{currentMood.journeyPercent}%</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#2d2542]/10 dark:bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3bb582] transition-all duration-300"
            style={{ width: `${currentMood.journeyPercent}%` }}
          />
        </div>

        <a
          href="#journeys"
          className="text-xs font-bold text-[#5A4B7C] dark:text-[#4EE2D8] hover:text-[#2d2542] dark:hover:text-white flex items-center justify-between pt-1.5 border-t border-[#2d2542]/10 dark:border-white/15 transition-colors"
        >
          <span>{isFr ? "Aperçu du plan (5j)" : "Preview 5-day study"}</span>
          <ArrowDown size={13} weight="bold" />
        </a>
      </div>

      {/* Floating Card: Grace Streak (Bottom Left on desktop) */}
      <div
        className="hidden lg:flex flex-col gap-2 absolute -bottom-3 left-2 xl:-left-6 z-20 w-[236px] p-4 rounded-2xl bg-white/95 dark:bg-[#1B1630]/95 backdrop-blur-md border border-[#2d2542]/10 dark:border-white/15 shadow-[0_12px_30px_-6px_rgba(45,37,66,0.14)] transition-transform duration-200 pointer-events-auto"
        id="preview-streak-floating-card"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 shrink-0">
            <Flame size={15} weight="fill" />
          </span>
          <div>
            <strong className="block text-xs font-bold text-[#2d2542] dark:text-white leading-snug tabular-nums">
              {isFr ? "Série de 7 jours · 2 Jours de Grâce" : "7-Day Streak · 2 Grace Days"}
            </strong>
            <small className="text-xs text-[#5A4B7C] dark:text-[#C8C2D6] inline-flex items-center gap-1">
              <ShieldCheck size={13} weight="duotone" />
              <span>{isFr ? "Protection active" : "Grace Shield Active"}</span>
            </small>
          </div>
        </div>
        <p className="text-xs text-[#5A506B] dark:text-[#D5CEE6] leading-snug m-0">
          {isFr
            ? "Le repos du sabbat préserve votre élan sans réinitialisation."
            : "Sabbath rest protects your quiet habit without zeroing your streak."}
        </p>
        <div className="flex items-center gap-1 text-xs text-[#1D8A5F] dark:text-[#4EE2D8] font-semibold">
          <Check size={13} weight="bold" />
          <span>{isFr ? "Régularité active" : "Consistency secured"}</span>
        </div>
      </div>

      {/* SMARTPHONE HARDWARE CHASSIS */}
      <div
        className="relative w-[306px] sm:w-[316px] h-[618px] sm:h-[628px] rounded-[48px] bg-[#1a162b] p-[7px] shadow-[0_32px_75px_-15px_rgba(30,22,48,0.4),0_12px_30px_-8px_rgba(0,0,0,0.22)] border-[5px] border-[#29223d] transition-transform duration-300"
        style={{ boxSizing: "border-box" }}
        id="phone-mockup-frame"
      >
        {/* Hardware side buttons */}
        <div className="absolute top-[85px] -left-[10px] w-[3px] h-[22px] rounded-l-sm bg-[#372f4e]" aria-hidden="true" />
        <div className="absolute top-[125px] -left-[10px] w-[3px] h-[40px] rounded-l-sm bg-[#372f4e]" aria-hidden="true" />
        <div className="absolute top-[175px] -left-[10px] w-[3px] h-[40px] rounded-l-sm bg-[#372f4e]" aria-hidden="true" />
        <div className="absolute top-[135px] -right-[10px] w-[3px] h-[52px] rounded-r-sm bg-[#372f4e]" aria-hidden="true" />

        {/* OLED SCREEN CONTAINER */}
        <div className="relative w-full h-full rounded-[41px] bg-[#faf7f2] overflow-hidden flex flex-col select-none text-[#2d2542] border border-[#2d2542]/10">
          {/* Subtle Screen Glass Specular Reflection Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-30 opacity-40"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 32%, transparent 55%)",
            }}
            aria-hidden="true"
          />

          {/* STATUS BAR & DYNAMIC ISLAND */}
          <div className="relative z-20 pt-3 px-6 pb-2 flex items-center justify-between text-[#1e1931]">
            <span className="text-[11px] font-bold tracking-tight tabular-nums">9:41</span>

            {/* Dynamic Island */}
            <div
              className="absolute top-2.5 left-1/2 -translate-x-1/2 h-[24px] px-3 rounded-full bg-[#0a0814] flex items-center gap-2 shadow-inner transition-all duration-200"
              style={{ width: isPlayingAudio ? "124px" : "96px" }}
              title="Dynamic Island"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#161224] ring-1 ring-white/10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#201c38]" />
              </div>

              {isPlayingAudio ? (
                <div className="flex items-center gap-0.5" title="Audio commentary active">
                  <span className="w-0.5 h-2.5 bg-[#e7b970] rounded-full animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-[#e7b970] rounded-full animate-bounce" />
                  <span className="w-0.5 h-2 bg-[#e7b970] rounded-full animate-pulse" />
                  <span className="text-[9px] text-[#e7b970] font-mono ml-1 tabular-nums">90s</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3bb582] opacity-80" />
                  <span className="text-[8px] text-white/50 tracking-wider font-mono">LB</span>
                </div>
              )}
            </div>

            {/* Cellular, Wifi & Battery Icons */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#2d2542]">
              <svg className="w-3 h-2.5 fill-current" viewBox="0 0 16 12">
                <rect x="1" y="8" width="2" height="4" rx="0.5" />
                <rect x="5" y="5" width="2" height="7" rx="0.5" />
                <rect x="9" y="3" width="2" height="9" rx="0.5" />
                <rect x="13" y="0" width="2" height="12" rx="0.5" />
              </svg>
              <svg className="w-3 h-2.5 fill-current" viewBox="0 0 16 12">
                <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.2-2.8a5.9 5.9 0 0 1 8.4 0 .8.8 0 0 0 1.1-1.1 7.5 7.5 0 0 0-10.6 0 .8.8 0 1 0 1.1 1.1zm-2.8-2.8a9.8 9.8 0 0 1 14 0 .8.8 0 1 0 1.1-1.1 11.4 11.4 0 0 0-16.2 0 .8.8 0 0 0 1.1 1.1z" />
              </svg>
              <div className="flex items-center">
                <div className="w-4 h-2.5 rounded-sm border border-current p-0.5 flex items-center">
                  <div className="h-full w-full bg-[#3bb582] rounded-[1px]" />
                </div>
                <div className="w-0.5 h-1 bg-current rounded-r-xs" />
              </div>
            </div>
          </div>

          {/* APP HEADER */}
          <div className="px-4 pt-1 pb-2 border-b border-[#2d2542]/8 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#705e8c] font-medium tracking-wide m-0">
                {isFr ? "Sanctuaire du matin" : "Morning Sanctuary"}
              </p>
              <h2 className="text-[14px] font-bold text-[#1e1931] tracking-tight m-0 font-serif">
                {isFr ? "Bonjour · Méditation" : "Good morning · Devotion"}
              </h2>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 text-[10px] font-bold shadow-xs tabular-nums"
              title={isFr ? "Série de 7 jours · Protégée par la grâce" : "7-day consistency · Grace protected"}
            >
              <Flame size={12} weight="fill" className="text-amber-600" />
              <span>7 {isFr ? "j" : "d"}</span>
            </div>
          </div>

          {/* SCROLLABLE / TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2.5 text-left scrollbar-none">
            {activePhoneTab === "today" && (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="bg-[#f0ece3] rounded-xl p-2 flex items-center justify-between text-[9px] text-[#5e5370]">
                  <span className="font-bold text-[#2d2542] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#705eaa]" />
                    {isFr ? "Étape 1 sur 3 · Lire (90s)" : "Step 1 of 3 · Read (90s)"}
                  </span>
                  <span className="text-[#776e82] tabular-nums">5 min total</span>
                </div>

                {/* Mood Selector prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#1e1931]">
                      {isFr ? "Votre état de cœur ce matin :" : "How is your heart today?"}
                    </span>
                    <span className="text-[9px] text-[#705e8c]">
                      {isFr ? "Touchez pour changer" : "Tap to select"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Spiritual mood">
                    {(Object.keys(moodData) as Array<keyof typeof moodData>).map((key) => {
                      const mood = moodData[key];
                      const isSelected = selectedMood === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedMood(key);
                            setShowPrayerGuide(false);
                          }}
                          className={`flex flex-col items-start p-2 rounded-xl text-left transition-all duration-150 cursor-pointer border ${mood.bgClass} ${
                            isSelected
                              ? `${mood.borderClass} ring-2 ring-[#2d2542] shadow-xs`
                              : "border-transparent opacity-85 hover:opacity-100"
                          }`}
                          aria-checked={isSelected}
                          role="radio"
                          id={`mood-btn-${key}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            {renderMoodIcon(mood.id, 15)}
                            {isSelected && (
                              <span className="text-[9px] font-bold text-[#2d2542] bg-white/70 p-0.5 rounded-full">
                                <Check size={10} weight="bold" />
                              </span>
                            )}
                          </div>
                          <b className="mt-1 font-serif text-[12px] font-semibold text-[#1e1931] leading-tight">
                            {mood.name}
                          </b>
                          <small className="text-[9px] text-[#5e5370] leading-tight line-clamp-1 mt-0.5">
                            {mood.sub}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SCRIPTURE OF THE DAY CARD */}
                <div
                  className="rounded-2xl p-3 bg-white border border-[#2d2542]/12 shadow-[0_4px_14px_rgba(45,37,66,0.06)] space-y-2 transition-all"
                  id="preview-scripture-box"
                >
                  <div className="flex items-center justify-between text-[9px] text-[#705e8c] font-semibold">
                    <span className="inline-flex items-center gap-1">
                      {renderMoodIcon(currentMood.id, 12)}
                      <span>{currentMood.name}</span>
                    </span>
                    <span className="text-[#776e82]">
                      {isFr ? "Verset du matin" : "Morning Scripture"}
                    </span>
                  </div>

                  <p className="font-serif text-[13px] text-[#1e1931] leading-snug italic m-0 font-medium">
                    {currentMood.quote}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#2d2542]/8 text-[10px]">
                    <span className="font-semibold text-[#5e5370]">{currentMood.ref}</span>

                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold transition-all cursor-pointer ${
                        isPlayingAudio
                          ? "bg-[#2d2542] text-white shadow-xs"
                          : "bg-[#f5efe4] text-[#2d2542] hover:bg-[#ebdcc8]"
                      }`}
                      title={isFr ? "Écouter le commentaire vocal (90s)" : "Listen to audio devotion (90s)"}
                      id="phone-audio-toggle-btn"
                    >
                      {isPlayingAudio ? <Pause size={10} weight="fill" /> : <Play size={10} weight="fill" />}
                      <span>{isPlayingAudio ? (isFr ? "Écoute..." : "Playing...") : "Audio 90s"}</span>
                    </button>
                  </div>

                  {/* Reflection Question Preview */}
                  <div className="pt-1 border-t border-[#2d2542]/6">
                    <span className="block text-[8.5px] font-semibold text-[#705e8c] mb-0.5">
                      {isFr ? "Question de réflexion :" : "Reflection prompt:"}
                    </span>
                    <p className="text-[10px] text-[#3b334a] leading-snug m-0">
                      {currentMood.reflectionPrompt}
                    </p>
                  </div>

                  {/* Prayer button / prompt toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPrayerGuide(!showPrayerGuide)}
                      className="w-full py-1.5 px-2.5 rounded-lg text-center text-[10px] font-bold text-[#2d2542] bg-[#f0f6f3] hover:bg-[#e2ede8] border border-[#d2e5dd] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      id="phone-prayer-toggle-btn"
                    >
                      <NotePencil size={12} weight="duotone" />
                      <span>
                        {showPrayerGuide
                          ? (isFr ? "Masquer la prière" : "Hide prayer prompt")
                          : (isFr ? "Prier avec ce verset (60s)" : "Pray with this verse (60s)")}
                      </span>
                    </button>

                    {showPrayerGuide && (
                      <div className="mt-2 p-2 rounded-xl bg-[#faf6ee] border border-[#ecd9b8] text-[10px] space-y-1 animate-fadeIn">
                        <strong className="block text-[#705e8c] text-[8.5px]">
                          {isFr ? "Suggestion de prière :" : "Prayer Guide:"}
                        </strong>
                        <p className="text-[#3b334a] italic leading-snug m-0">
                          {currentMood.prayerSample}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: JOURNEYS TAB */}
            {activePhoneTab === "journeys" && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between pb-1">
                  <strong className="text-[12px] font-serif text-[#1e1931]">
                    {isFr ? "Parcours thématiques (5 jours)" : "5-Day Topical Journeys"}
                  </strong>
                  <a href="#journeys" className="text-[9px] text-[#705e8c] hover:underline font-bold">
                    {isFr ? "Voir tout ↓" : "View all ↓"}
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-white border-2 border-[#705eaa] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-bold text-[#1D8A5F] flex items-center gap-1">
                      <Check size={10} weight="bold" />
                      <span>{isFr ? "En cours" : "Active Study"}</span>
                    </span>
                    <span className="text-[#705e8c] font-bold flex items-center gap-0.5 tabular-nums">
                      <ShieldCheck size={11} weight="duotone" />
                      <span>{isFr ? `J${currentMood.journeyDay}/5` : `Day ${currentMood.journeyDay}/5`}</span>
                    </span>
                  </div>
                  <strong className="block font-serif text-[12px] text-[#1e1931] leading-tight">
                    {currentMood.journeyTitle}
                  </strong>
                  <div className="w-full h-1.5 rounded-full bg-[#2d2542]/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#3bb582]"
                      style={{ width: `${currentMood.journeyPercent}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f5effb] border border-[#dcc5f4]/50 shadow-xs space-y-1">
                  <span className="text-[8.5px] font-semibold text-[#705eaa]">
                    {isFr ? "5 jours · Philippiens 4" : "5 days · Philippians 4"}
                  </span>
                  <strong className="block font-serif text-[12px] text-[#2d2542] leading-tight">
                    {isFr ? "Surmonter l'anxiété par la prière" : "Overcoming Anxiety with Prayer"}
                  </strong>
                  <p className="text-[9px] text-[#6b6279] m-0">
                    {isFr ? "Ancrer la paix du Christ au quotidien." : "Anchor your soul in Philippians 4 peace."}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#fdf6e6] border border-[#edd79d]/50 shadow-xs space-y-1">
                  <span className="text-[8.5px] font-semibold text-[#b07d1e]">
                    {isFr ? "5 jours · Colossiens 3" : "5 days · Colossians 3"}
                  </span>
                  <strong className="block font-serif text-[12px] text-[#2d2542] leading-tight">
                    {isFr ? "La gratitude au réveil" : "Morning Gratitude & Praise"}
                  </strong>
                  <p className="text-[9px] text-[#6b6279] m-0">
                    {isFr ? "Transformer votre regard sur les difficultés." : "Shift perspective with daily thanksgiving."}
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 3: VOICE COMPANION TAB */}
            {activePhoneTab === "voice" && (
              <div className="space-y-2 animate-fadeIn text-center py-2">
                <div className="w-11 h-11 rounded-full bg-[#2d2542] text-white flex items-center justify-center mx-auto shadow-xs">
                  <Microphone size={20} weight="duotone" />
                </div>
                <div>
                  <strong className="block font-serif text-[13px] text-[#1e1931]">
                    {isFr ? "Studio Vocal Biblique" : "Biblical Voice Studio"}
                  </strong>
                  <p className="text-[10px] text-[#6b6279] mt-0.5 leading-snug">
                    {isFr
                      ? "Dictez votre prière ou posez une question biblique à voix haute."
                      : "Dictate spoken prayers or ask a question for immediate Scripture context."}
                  </p>
                </div>

                <div className="space-y-1 text-left pt-1">
                  <span className="text-[8.5px] font-semibold text-[#705e8c]">
                    {isFr ? "Exemples de questions :" : "Try asking:"}
                  </span>
                  <div className="p-2 rounded-lg bg-white border border-[#2d2542]/10 text-[10px] text-[#2d2542]">
                    {isFr ? "« Où trouver du réconfort face à la surcharge ? »" : "“Where can I find peace when overwhelmed?”"}
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#2d2542]/10 text-[10px] text-[#2d2542]">
                    {isFr ? "« Comment pardonner à un collègue difficile ? »" : "“How can I practice patience at work today?”"}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: JOURNAL TAB */}
            {activePhoneTab === "journal" && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <strong className="text-[12px] font-serif text-[#1e1931]">
                    {isFr ? "Journal de prière privé" : "Private Prayer Journal"}
                  </strong>
                  <span className="text-[9px] text-[#1D8A5F] font-bold flex items-center gap-1">
                    <LockKey size={11} weight="duotone" />
                    <span>{isFr ? "Sur appareil" : "On-device"}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#2d2542]/10 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-[#776e82]">
                    <span>{isFr ? "Hier · 07:15" : "Yesterday · 7:15 AM"}</span>
                    <span className="text-amber-800 font-semibold">{isFr ? "Psaume 23" : "Psalm 23"}</span>
                  </div>
                  <p className="text-[10px] text-[#2d2542] leading-snug m-0 italic">
                    {isFr
                      ? "« Seigneur, merci pour la paix accordée pendant le projet. Garde mon cœur bienveillant. »"
                      : "“Lord, thank You for peace during the project launch. Keep my heart grounded in You.”"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#faf7ef] border border-[#ede2cd] text-[10px] text-[#6b6279] text-center">
                  <span>+ {isFr ? "Ajouter une prière ou réflexion" : "Add a private prayer note"}</span>
                </div>
              </div>
            )}
          </div>

          {/* APP BOTTOM TAB BAR */}
          <div className="px-3 pt-2 pb-2.5 bg-white/95 border-t border-[#2d2542]/10 flex items-center justify-around text-center">
            <button
              type="button"
              onClick={() => setActivePhoneTab("today")}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activePhoneTab === "today"
                  ? "text-[#2d2542] font-bold bg-[#f1edfb]"
                  : "text-[#7b7289] hover:text-[#2d2542]"
              }`}
              id="phone-tab-today"
            >
              <BookOpenText size={14} weight={activePhoneTab === "today" ? "fill" : "regular"} />
              <span className="text-[9px] font-medium leading-tight">{t("preview_tab_today")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePhoneTab("journeys")}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activePhoneTab === "journeys"
                  ? "text-[#2d2542] font-bold bg-[#f1edfb]"
                  : "text-[#7b7289] hover:text-[#2d2542]"
              }`}
              id="phone-tab-journeys"
            >
              <Compass size={14} weight={activePhoneTab === "journeys" ? "fill" : "regular"} />
              <span className="text-[9px] font-medium leading-tight">{t("preview_tab_journeys")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePhoneTab("voice")}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activePhoneTab === "voice"
                  ? "text-[#2d2542] font-bold bg-[#f1edfb]"
                  : "text-[#7b7289] hover:text-[#2d2542]"
              }`}
              id="phone-tab-voice"
            >
              <Microphone size={14} weight={activePhoneTab === "voice" ? "fill" : "regular"} />
              <span className="text-[9px] font-medium leading-tight">{isFr ? "Voix" : "Voice"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePhoneTab("journal")}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activePhoneTab === "journal"
                  ? "text-[#2d2542] font-bold bg-[#f1edfb]"
                  : "text-[#7b7289] hover:text-[#2d2542]"
              }`}
              id="phone-tab-journal"
            >
              <NotePencil size={14} weight={activePhoneTab === "journal" ? "fill" : "regular"} />
              <span className="text-[9px] font-medium leading-tight">{isFr ? "Journal" : "Journal"}</span>
            </button>
          </div>

          {/* HOME INDICATOR BAR */}
          <div className="pb-1.5 pt-0.5 bg-white/95 flex justify-center">
            <div className="w-24 h-1 rounded-full bg-[#1e1931]/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneMockup;
