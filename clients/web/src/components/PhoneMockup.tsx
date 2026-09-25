"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n";

export function PhoneMockup() {
  const { isFr, t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<"peace" | "seek" | "grateful" | "doubt">("peace");
  const [activePhoneTab, setActivePhoneTab] = useState<"today" | "journeys" | "voice" | "journal">("today");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showPrayerGuide, setShowPrayerGuide] = useState(false);

  const moodData = {
    peace: {
      id: "peace",
      name: isFr ? "Paisible" : "Peaceful",
      sub: isFr ? "S'ancrer dans le repos" : "Rest in God's peace",
      icon: "🌿",
      bgClass: "bg-[#e5f4ee] hover:bg-[#d8ede5] text-[#1c3e34]",
      borderClass: "border-[#bce2d3]",
      journeyTitle: isFr ? "La paix dans le tourbillon du travail" : "Peace in Busy Workdays",
      journeyDay: 3,
      journeyTotal: 5,
      journeyPercent: 60,
      recommendationReason: isFr
        ? "Parce que vous portez la pression du travail et la course des e-mails, LifeBook vous oriente vers Philippiens 4 pour apaiser l'urgence avant de commencer vos réunions."
        : "Because you've carried work hurry and deadline pressure this week, LifeBook routes you to Philippians 4 so you surrender urgent thoughts before opening email.",
      quote: isFr
        ? "« L'Éternel est mon berger : je ne manquerai de rien. »"
        : "“The Lord is my shepherd; I shall not want.”",
      ref: isFr ? "Psaume 23:1 (Louis Segond)" : "Psalm 23:1 (ESV)",
      reflectionPrompt: isFr
        ? "Où avez-vous besoin de déposer vos fardeaux aujourd'hui ?"
        : "Where do you need to surrender control to God today?",
      prayerSample: isFr
        ? "« Seigneur, je m'abandonne à Ta paix. Sois mon guide dans les urgences du jour. Amen. »"
        : "“Lord, I rest in Your guidance today. Quiet my hurry and steady my heart. Amen.”",
    },
    seek: {
      id: "seek",
      name: isFr ? "En quête" : "Seeking",
      sub: isFr ? "Sagesse & discernement" : "Wisdom for decisions",
      icon: "🧭",
      bgClass: "bg-[#eee7f8] hover:bg-[#e3d9f3] text-[#34244f]",
      borderClass: "border-[#d5c5ed]",
      journeyTitle: isFr ? "Grandir dans la foi et le discernement" : "Clarity in Big Decisions",
      journeyDay: 1,
      journeyTotal: 5,
      journeyPercent: 20,
      recommendationReason: isFr
        ? "Parce que vous pesez des choix professionnels ou familiaux difficiles, LifeBook ancre vos matinées dans Jacques 1:5 pour demander la sagesse dans la foi."
        : "Because you're navigating crossroads and major career choices, LifeBook grounds your morning in James 1:5 so you seek divine wisdom with confidence.",
      quote: isFr
        ? "« Si quelqu'un d'entre vous manque de sagesse, qu'il la demande à Dieu. »"
        : "“If any of you lacks wisdom, you should ask God, who gives generously.”",
      ref: isFr ? "Jacques 1:5 (Louis Segond)" : "James 1:5 (ESV)",
      reflectionPrompt: isFr
        ? "Quelle décision difficile nécessite la clarté de Dieu ce matin ?"
        : "What major decision requires divine clarity this morning?",
      prayerSample: isFr
        ? "« Père céleste, éclaire mes choix. Que mes paroles reflètent Ta justice. Amen. »"
        : "“Heavenly Father, align my choices with Your purpose. Grant me wisdom. Amen.”",
    },
    grateful: {
      id: "grateful",
      name: isFr ? "Reconnaissant" : "Grateful",
      sub: isFr ? "Célébrer Sa fidélité" : "Count today's blessings",
      icon: "✦",
      bgClass: "bg-[#fdf1d6] hover:bg-[#f7e7c3] text-[#4f3a12]",
      borderClass: "border-[#edd5a2]",
      journeyTitle: isFr ? "La gratitude au réveil" : "The Habit of Thankfulness",
      journeyDay: 4,
      journeyTotal: 5,
      journeyPercent: 80,
      recommendationReason: isFr
        ? "Parce que votre cœur est reconnaissant ce matin, LifeBook canalise cette joie dans 1 Thessaloniciens 5 pour enraciner une habitude pérenne."
        : "Because your heart feels grateful this morning, LifeBook channels your joy into 1 Thessalonians 5 so thankfulness becomes your default daily habit.",
      quote: isFr
        ? "« Rendez grâces en toutes choses, car c'est la volonté de Dieu en Jésus-Christ. »"
        : "“Give thanks in all circumstances; for this is God's will in Christ.”",
      ref: isFr ? "1 Thessaloniciens 5:18 (Louis Segond)" : "1 Thessalonians 5:18 (ESV)",
      reflectionPrompt: isFr
        ? "Quelles sont les 3 grâces inattendues reçues au cours des 24h passées ?"
        : "What 3 unexpected blessings did you receive in the past 24 hours?",
      prayerSample: isFr
        ? "« Merci Seigneur pour Ta bonté qui se renouvelle chaque matin pour moi. Amen. »"
        : "“Thank You Lord for Your steadfast love that is renewed every single morning. Amen.”",
    },
    doubt: {
      id: "doubt",
      name: isFr ? "Interrogations" : "Questions",
      sub: isFr ? "Déposer ses soucis" : "Cast your anxieties",
      icon: "💬",
      bgClass: "bg-[#e2eff7] hover:bg-[#d2e5f1] text-[#1c3b4f]",
      borderClass: "border-[#bcd6e8]",
      journeyTitle: isFr ? "Surmonter la peur et l'anxiété" : "Overcoming Fear & Anxiety",
      journeyDay: 2,
      journeyTotal: 5,
      journeyPercent: 40,
      recommendationReason: isFr
        ? "Parce que vous portez des soucis intérieurs non résolus, LifeBook propose 1 Pierre 5:7 pour déposer ce fardeau à Christ sans culpabilité."
        : "Because you've been carrying unresolved worries and emotional fatigue, LifeBook routes you to 1 Peter 5:7 to cast your burdens on Christ without guilt.",
      quote: isFr
        ? "« Déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous. »"
        : "“Cast all your anxiety on him because he cares for you.”",
      ref: isFr ? "1 Pierre 5:7 (Louis Segond)" : "1 Peter 5:7 (ESV)",
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

      {/* Floating Card: Study Track (Top Right on desktop) with Dynamic Recommendation Reasoning */}
      <div
        className="hidden lg:flex flex-col gap-2.5 absolute -top-2 right-2 xl:-right-6 z-20 w-[256px] p-4 rounded-2xl bg-white/95 dark:bg-[#1B1630]/95 backdrop-blur-md border border-[#2d2542]/12 dark:border-white/15 shadow-[0_14px_32px_-6px_rgba(45,37,66,0.16)] transform rotate-[2deg] hover:rotate-0 transition-all duration-300 pointer-events-auto"
        id="preview-study-floating-card"
      >
        <div className="flex items-center justify-between text-xs font-bold text-[#5A4B7C] dark:text-[#C8C2D6] tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <span>{currentMood.icon}</span>
            <span>{isFr ? "Parcours recommandé" : "Recommended Track"}</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[#3bb582]" />
        </div>

        <strong className="font-serif text-sm text-[#2d2542] dark:text-white leading-tight font-semibold">
          {currentMood.journeyTitle}
        </strong>

        <div className="flex items-center justify-between text-xs text-[#5A506B] dark:text-[#C8C2D6]">
          <span>{isFr ? `Jour ${currentMood.journeyDay} sur ${currentMood.journeyTotal}` : `Day ${currentMood.journeyDay} of ${currentMood.journeyTotal}`}</span>
          <span className="font-bold text-[#1D8A5F] dark:text-[#4EE2D8]">{currentMood.journeyPercent}%</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#2d2542]/10 dark:bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3bb582] transition-all duration-500"
            style={{ width: `${currentMood.journeyPercent}%` }}
          />
        </div>

        {/* Dynamic Reasoning Callout on Floating Card */}
        <div className="bg-[#f4effa] dark:bg-[#120E22] border border-[#dccff3] dark:border-white/15 rounded-xl p-2.5 text-xs leading-snug text-[#3E3356] dark:text-[#E2DCEF]">
          <div className="flex items-center gap-1 font-bold text-[#5A4B7C] dark:text-[#4EE2D8] text-xs uppercase tracking-wider mb-1">
            <span>💡</span>
            <span>{isFr ? "Raison de la recommandation :" : "Why recommended:"}</span>
          </div>
          <p className="m-0 italic text-[#2d2542] dark:text-white line-clamp-2">
            “{currentMood.recommendationReason}”
          </p>
        </div>

        <a
          href="#journey-preview"
          className="text-xs font-bold text-[#5A4B7C] dark:text-[#4EE2D8] hover:text-[#2d2542] dark:hover:text-white flex items-center justify-between pt-1.5 border-t border-[#2d2542]/10 dark:border-white/15 transition-colors"
        >
          <span>{isFr ? "Aperçu complet du plan (5j)" : "Preview 5-day curriculum"}</span>
          <span>↓</span>
        </a>
      </div>

      {/* Floating Card: Grace Streak (Bottom Left on desktop) */}
      <div
        className="hidden lg:flex flex-col gap-2 absolute -bottom-3 left-2 xl:-left-6 z-20 w-[236px] p-4 rounded-2xl bg-white/95 dark:bg-[#1B1630]/95 backdrop-blur-md border border-[#2d2542]/10 dark:border-white/15 shadow-[0_12px_30px_-6px_rgba(45,37,66,0.14)] transform -rotate-[3deg] hover:rotate-0 transition-transform duration-300 pointer-events-auto"
        id="preview-streak-floating-card"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-xs shrink-0">
            🔥
          </span>
          <div>
            <strong className="block text-xs font-bold text-[#2d2542] dark:text-white leading-snug">
              {isFr ? "Série de 7 jours · 2 Jours de Grâce" : "7-Day Streak · 2 Grace Days"}
            </strong>
            <small className="text-xs text-[#5A4B7C] dark:text-[#C8C2D6]">
              {isFr ? "Protection de parcours active 🛡️" : "Journey Shield Active 🛡️"}
            </small>
          </div>
        </div>
        <p className="text-xs text-[#5A506B] dark:text-[#D5CEE6] leading-snug m-0">
          {isFr
            ? "Le repos du sabbat préserve votre élan sans réinitialisation."
            : "Sabbath rest protects your quiet habit without zeroing your streak."}
        </p>
        <div className="flex items-center gap-1 text-xs text-[#1D8A5F] dark:text-[#4EE2D8] font-semibold">
          <span>✓</span>
          <span>{isFr ? "Régularité active" : "Consistency secured"}</span>
        </div>
      </div>

      {/* SMARTPHONE HARDWARE CHASSIS */}
      <div
        className="relative w-[306px] sm:w-[316px] h-[618px] sm:h-[628px] rounded-[48px] bg-[#1a162b] p-[7px] shadow-[0_32px_75px_-15px_rgba(30,22,48,0.4),0_12px_30px_-8px_rgba(0,0,0,0.22)] border-[5px] border-[#29223d] transition-transform duration-500 hover:rotate-0 md:rotate-[1.5deg]"
        style={{ boxSizing: "border-box" }}
        id="phone-mockup-frame"
      >
        {/* Hardware side buttons */}
        {/* Silent / Action Button */}
        <div className="absolute top-[85px] -left-[10px] w-[3px] h-[22px] rounded-l-sm bg-[#372f4e]" aria-hidden="true" />
        {/* Volume Up */}
        <div className="absolute top-[125px] -left-[10px] w-[3px] h-[40px] rounded-l-sm bg-[#372f4e]" aria-hidden="true" />
        {/* Volume Down */}
        <div className="absolute top-[175px] -left-[10px] w-[3px] h-[40px] rounded-l-sm bg-[#372f4e]" aria-hidden="true" />
        {/* Power / Lock Button */}
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
            {/* Clock */}
            <span className="text-[11px] font-bold tracking-tight">9:41</span>

            {/* Dynamic Island */}
            <div
              className="absolute top-2.5 left-1/2 -translate-x-1/2 h-[24px] px-3 rounded-full bg-[#0a0814] flex items-center gap-2 shadow-inner transition-all duration-300"
              style={{ width: isPlayingAudio ? "124px" : "96px" }}
              title="Dynamic Island"
            >
              {/* Camera Lens */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#161224] ring-1 ring-white/10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#201c38]" />
              </div>

              {/* Audio Equalizer bars when audio is playing */}
              {isPlayingAudio ? (
                <div className="flex items-center gap-0.5" title="Audio commentary active">
                  <span className="w-0.5 h-2.5 bg-[#e7b970] rounded-full animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-[#e7b970] rounded-full animate-bounce" />
                  <span className="w-0.5 h-2 bg-[#e7b970] rounded-full animate-pulse" />
                  <span className="text-[9px] text-[#e7b970] font-mono ml-1">90s</span>
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
              {/* Cellular */}
              <svg className="w-3 h-2.5 fill-current" viewBox="0 0 16 12">
                <rect x="1" y="8" width="2" height="4" rx="0.5" />
                <rect x="5" y="5" width="2" height="7" rx="0.5" />
                <rect x="9" y="3" width="2" height="9" rx="0.5" />
                <rect x="13" y="0" width="2" height="12" rx="0.5" />
              </svg>
              {/* Wifi */}
              <svg className="w-3 h-2.5 fill-current" viewBox="0 0 16 12">
                <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.2-2.8a5.9 5.9 0 0 1 8.4 0 .8.8 0 0 0 1.1-1.1 7.5 7.5 0 0 0-10.6 0 .8.8 0 1 0 1.1 1.1zm-2.8-2.8a9.8 9.8 0 0 1 14 0 .8.8 0 1 0 1.1-1.1 11.4 11.4 0 0 0-16.2 0 .8.8 0 0 0 1.1 1.1z" />
              </svg>
              {/* Battery */}
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
                {isFr ? "Mercredi 16 Septembre" : "Wednesday, Sep 16"}
              </p>
              <h2 className="text-[14px] font-bold text-[#1e1931] tracking-tight m-0 font-serif">
                {isFr ? "Bonjour · Méditation" : "Good morning · Devotion"}
              </h2>
            </div>
            {/* Streak chip */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 text-[10px] font-bold shadow-xs cursor-help"
              title={isFr ? "Série de 7 jours · Protégée par la grâce" : "7-day consistency · Grace protected"}
            >
              <span>🔥</span>
              <span>7 {isFr ? "j" : "d"}</span>
            </div>
          </div>

          {/* SCROLLABLE / TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2.5 text-left scrollbar-none">
            {/* VIEW 1: TODAY DEVOTION */}
            {activePhoneTab === "today" && (
              <div className="space-y-2.5 animate-fadeIn">
                {/* 5-Min Step Indicator */}
                <div className="bg-[#f0ece3] rounded-xl p-2 flex items-center justify-between text-[9px] text-[#5e5370]">
                  <span className="font-bold text-[#2d2542] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#705eaa]" />
                    {isFr ? "Étape 1 sur 3 · Lire (90s)" : "Step 1 of 3 · Read (90s)"}
                  </span>
                  <span className="text-[#776e82]">5 min total</span>
                </div>

                {/* Mood Selector prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#1e1931]">
                      {isFr ? "Votre état de cœur ce matin :" : "How is your heart today?"}
                    </span>
                    <span className="text-[9px] text-[#705e8c]">
                      {isFr ? "Touchez pour changer" : "Tap to update"}
                    </span>
                  </div>

                  {/* 4 Responsive Mood Grid Buttons - FIXED NO MORE 104px SPAN BUG */}
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
                          className={`flex flex-col items-start p-2 rounded-xl text-left transition-all duration-200 cursor-pointer border ${mood.bgClass} ${
                            isSelected
                              ? `${mood.borderClass} ring-2 ring-[#2d2542] shadow-sm transform scale-[1.02]`
                              : "border-transparent opacity-85 hover:opacity-100"
                          }`}
                          aria-checked={isSelected}
                          role="radio"
                          id={`mood-btn-${key}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-base leading-none" aria-hidden="true">
                              {mood.icon}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-bold text-[#2d2542] bg-white/70 px-1 rounded-full">
                                ✓
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

                  {/* Subtle in-app recommendation reasoning */}
                  <div className="mt-2 rounded-xl p-2 bg-[#f4effa] border border-[#dfd2f3] text-[9.5px] space-y-0.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-[#705e8c]">
                      <span className="flex items-center gap-1">
                        <span>💡</span>
                        <span>{isFr ? "Recommandation ciblée" : "Intentional Routing"}</span>
                      </span>
                      <span className="text-[#3bb582] font-semibold">{isFr ? "Parcours 5j" : "5-day sprint"}</span>
                    </div>
                    <p className="text-[#2d2542] italic leading-tight m-0 line-clamp-2">
                      “{currentMood.recommendationReason}”
                    </p>
                  </div>
                </div>

                {/* SCRIPTURE OF THE DAY CARD (INSIDE THE PHONE) */}
                <div
                  className="rounded-2xl p-3 bg-white border border-[#2d2542]/12 shadow-[0_4px_14px_rgba(45,37,66,0.06)] space-y-2 transition-all"
                  id="preview-scripture-box"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#705e8c] bg-[#eee7f8] px-2 py-0.5 rounded-full">
                      <span>{currentMood.icon}</span>
                      <span>{currentMood.name}</span>
                    </span>
                    <span className="text-[9px] text-[#776e82] font-medium">
                      {isFr ? "Verset du matin" : "Morning Scripture"}
                    </span>
                  </div>

                  <p className="font-serif text-[13px] text-[#1e1931] leading-snug italic m-0 font-medium">
                    {currentMood.quote}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#2d2542]/8 text-[10px]">
                    <span className="font-semibold text-[#5e5370]">{currentMood.ref}</span>

                    {/* Audio commentary toggle button inside phone */}
                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold transition-all cursor-pointer ${
                        isPlayingAudio
                          ? "bg-[#2d2542] text-white shadow-xs"
                          : "bg-[#f5efe4] text-[#2d2542] hover:bg-[#ebdcc8]"
                      }`}
                      title={isFr ? "Écouter le commentaire vocal (90s)" : "Listen to audio devotion (90s)"}
                      id="phone-audio-toggle-btn"
                    >
                      <span>{isPlayingAudio ? "⏸" : "▶"}</span>
                      <span>{isPlayingAudio ? (isFr ? "Écoute..." : "Playing...") : (isFr ? "Audio 90s" : "Audio 90s")}</span>
                    </button>
                  </div>

                  {/* Prayer button / prompt toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPrayerGuide(!showPrayerGuide)}
                      className="w-full py-1.5 px-2.5 rounded-lg text-center text-[10px] font-bold text-[#2d2542] bg-[#f0f6f3] hover:bg-[#e2ede8] border border-[#d2e5dd] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      id="phone-prayer-toggle-btn"
                    >
                      <span>✍️</span>
                      <span>
                        {showPrayerGuide
                          ? (isFr ? "Masquer la prière" : "Hide prayer prompt")
                          : (isFr ? "Prier avec ce verset (60s)" : "Pray with this verse (60s)")}
                      </span>
                    </button>

                    {showPrayerGuide && (
                      <div className="mt-2 p-2 rounded-xl bg-[#faf6ee] border border-[#ecd9b8] text-[10px] space-y-1 animate-fadeIn">
                        <strong className="block text-[#705e8c] uppercase tracking-wider text-[8px]">
                          {isFr ? "Suggestion de prière :" : "Prayer Guide:"}
                        </strong>
                        <p className="text-[#3b334a] italic leading-snug m-0">
                          {currentMood.prayerSample}
                        </p>
                      </div>
                    )}

                    {/* Pre-signup 5-day journey preview link */}
                    <a
                      href="#journey-preview"
                      className="block text-center pt-2 text-[9px] font-bold text-[#705e8c] hover:text-[#2d2542] transition-colors"
                      id="phone-curriculum-anchor"
                    >
                      {isFr ? "Consulter ce plan de 5 jours en détail ↓" : "Explore full 5-day plan & reasoning ↓"}
                    </a>
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
                  <a href="#journey-preview" className="text-[9px] text-[#705e8c] hover:underline font-bold">
                    {isFr ? "Voir tout ↓" : "View all ↓"}
                  </a>
                </div>

                {/* Dynamically highlighted track matching selectedMood */}
                <div className="p-2.5 rounded-xl bg-white border-2 border-[#705eaa] shadow-xs space-y-1.5 ring-1 ring-[#705eaa]/20">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-bold text-[#3bb582] uppercase tracking-wider flex items-center gap-1">
                      <span>✓</span>
                      <span>{isFr ? "Recommandé pour votre humeur" : "Recommended for your mood"}</span>
                    </span>
                    <span className="text-[#705e8c] font-bold flex items-center gap-0.5">
                      <span>🛡️</span>
                      <span>{isFr ? `J${currentMood.journeyDay}/5 · Grâce active` : `Day ${currentMood.journeyDay}/5 · Grace Active`}</span>
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
                  <p className="text-[8.5px] text-[#5e5370] italic m-0 line-clamp-1">
                    “{currentMood.recommendationReason}”
                  </p>
                </div>

                {/* Track 2: Overcoming Anxiety */}
                <div className="p-2.5 rounded-xl bg-[#f5effb] border border-[#dcc5f4]/50 shadow-xs space-y-1">
                  <span className="text-[8px] font-bold text-[#705eaa] uppercase tracking-wider">
                    {isFr ? "5 jours" : "5 days"}
                  </span>
                  <strong className="block font-serif text-[12px] text-[#2d2542] leading-tight">
                    {isFr ? "Surmonter l'anxiété par la prière" : "Overcoming Anxiety with Prayer"}
                  </strong>
                  <p className="text-[9px] text-[#6b6279] m-0">
                    {isFr ? "Ancrer la paix de Philippiens 4 au quotidien." : "Anchor your soul in Philippians 4 peace."}
                  </p>
                </div>

                {/* Track 3: Daily Gratitude */}
                <div className="p-2.5 rounded-xl bg-[#fdf6e6] border border-[#edd79d]/50 shadow-xs space-y-1">
                  <span className="text-[8px] font-bold text-[#b07d1e] uppercase tracking-wider">
                    {isFr ? "5 jours" : "5 days"}
                  </span>
                  <strong className="block font-serif text-[12px] text-[#2d2542] leading-tight">
                    {isFr ? "La gratitude au réveil" : "Morning Gratitude & Praise"}
                  </strong>
                  <p className="text-[9px] text-[#6b6279] m-0">
                    {isFr ? "Transformer votre regard sur les difficultés." : "Shift perspective with Colossians 3 thanksgiving."}
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 3: VOICE COMPANION TAB */}
            {activePhoneTab === "voice" && (
              <div className="space-y-2 animate-fadeIn text-center py-2">
                <div className="w-12 h-12 rounded-full bg-[#2d2542] text-white flex items-center justify-center mx-auto text-lg shadow-sm">
                  🎙️
                </div>
                <div>
                  <strong className="block font-serif text-[13px] text-[#1e1931]">
                    {isFr ? "Compagnon vocal biblique" : "Biblical Voice Practice"}
                  </strong>
                  <p className="text-[10px] text-[#6b6279] mt-0.5 leading-snug">
                    {isFr
                      ? "Posez votre question à voix haute pour recevoir des versets et conseils immédiats."
                      : "Speak your question out loud to receive immediate scripture guidance."}
                  </p>
                </div>

                <div className="space-y-1 text-left pt-1">
                  <span className="text-[8px] font-bold text-[#705e8c] uppercase tracking-wider">
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
                  <span className="text-[9px] text-[#3bb582] font-bold flex items-center gap-1">
                    <span>🔒</span>
                    <span>{isFr ? "Sur appareil" : "On-device"}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#2d2542]/10 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-[#776e82]">
                    <span>{isFr ? "Hier, 07:15" : "Yesterday, 7:15 AM"}</span>
                    <span className="text-amber-700 font-semibold">{isFr ? "Psaume 23" : "Psalm 23"}</span>
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
                activePhoneTab === "today" || activePhoneTab === "journal"
                  ? "text-[#2d2542] font-bold bg-[#f1edfb]"
                  : "text-[#7b7289] hover:text-[#2d2542]"
              }`}
              id="phone-tab-today"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
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
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8" />
              </svg>
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
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              <span className="text-[9px] font-medium leading-tight">{isFr ? "Voix" : "Voice"}</span>
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
