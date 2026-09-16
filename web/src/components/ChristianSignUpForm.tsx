"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useChristianAuth } from "../lib/christian-auth";
import { LifeBookLogo } from "./LifeBookLogo";

const FAITH_SEASONS = [
  {
    id: "peace",
    label: "Seeking Peace & Stillness",
    scripture: "Philippians 4:6-7",
    description: "Bringing anxiety, racing thoughts, and weariness to Christ.",
    icon: "🌿",
  },
  {
    id: "abiding",
    label: "Abiding in the Word & Prayer",
    scripture: "Psalm 119:105",
    description: "Building an uninterrupted daily rhythm of hearing God's voice.",
    icon: "📖",
  },
  {
    id: "restoration",
    label: "Restoring a Tired Soul",
    scripture: "Psalm 23:3",
    description: "Reconnecting after a season of distance, doubt, or spiritual burnout.",
    icon: "✝️",
  },
  {
    id: "gratitude",
    label: "Growing in Gratitude & Joy",
    scripture: "1 Thessalonians 5:16-18",
    description: "Noticing God’s daily mercies and learning to rejoice always.",
    icon: "☀️",
  },
  {
    id: "guidance",
    label: "Seeking Wisdom & Direction",
    scripture: "James 1:5",
    description: "Discerning God’s calling and faithful next steps in life.",
    icon: "🛡️",
  },
];

const BIBLE_TRANSLATIONS: {
  id: "ESV" | "NIV" | "KJV" | "CSB" | "NLT";
  name: string;
  tag: string;
}[] = [
  { id: "ESV", name: "ESV", tag: "Literal & Thoughtful" },
  { id: "NIV", name: "NIV", tag: "Clear & Balanced" },
  { id: "KJV", name: "KJV", tag: "Poetic & Traditional" },
  { id: "CSB", name: "CSB", tag: "Faithful & Readable" },
  { id: "NLT", name: "NLT", tag: "Warm & Accessible" },
];

const QUIET_TIMES = [
  { id: "Morning 7:00 AM", label: "Dawn / Morning", sub: "7:00 AM", icon: "🌅" },
  { id: "Midday 12:30 PM", label: "Midday Pause", sub: "12:30 PM", icon: "☀️" },
  { id: "Evening 8:30 PM", label: "Evening Stillness", sub: "8:30 PM", icon: "🌙" },
  { id: "Self-Paced", label: "Self-Paced", sub: "Anytime", icon: "⏱️" },
];

export function ChristianSignUpForm() {
  const router = useRouter();
  const { signUp } = useChristianAuth();

  // Wizard Step: 1 = Basic Account, 2 = Faith Personalization
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [faithSeason, setFaithSeason] = useState(FAITH_SEASONS[1].label);
  const [translation, setTranslation] = useState<"ESV" | "NIV" | "KJV" | "CSB" | "NLT">("ESV");
  const [dailyQuietTime, setDailyQuietTime] = useState(QUIET_TIMES[0].id);
  const [covenantAccepted, setCovenantAccepted] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Moving to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please share your preferred or full name so we can address you personally.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Please choose a password with at least 6 characters.");
      return;
    }

    setStep(2);
  };

  // Quick Start with Defaults (One-click skip step 2 if user prefers zero friction)
  const handleQuickStart = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError("Please enter your name first.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Please enter a password with at least 6 characters.");
      return;
    }

    await performSignUp(faithSeason, translation, dailyQuietTime);
  };

  // Final Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!covenantAccepted) {
      setError("Please confirm your heart dedication to walk honestly with God.");
      return;
    }

    await performSignUp(faithSeason, translation, dailyQuietTime);
  };

  const performSignUp = async (
    season: string,
    trans: "ESV" | "NIV" | "KJV" | "CSB" | "NLT",
    time: string
  ) => {
    setLoading(true);
    try {
      const res = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        faithSeason: season,
        translation: trans,
        dailyQuietTime: time,
        covenantAccepted: true,
      });

      if (res.success) {
        router.push("/progress");
      } else {
        setError(res.error || "Unable to complete registration. Please check details.");
      }
    } catch {
      setError("An unexpected error occurred while setting up your sanctuary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Step Header: Clean & calming, non-overwhelming */}
      <div className="mb-6 flex items-center justify-between border-b border-[#EADBFC]/60 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2A2146]">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 1 ? "bg-[#2A2146] text-white" : "bg-[#E6DEEE] text-[#5A4F70]"
            }`}
          >
            1
          </span>
          <span className={step === 1 ? "text-[#2A2146]" : "text-[#706782]"}>
            Account Details
          </span>
          <span className="text-[#C4B7D9]">→</span>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 2 ? "bg-[#2A2146] text-white" : "bg-[#E6DEEE] text-[#5A4F70]"
            }`}
          >
            2
          </span>
          <span className={step === 2 ? "text-[#2A2146]" : "text-[#706782]"}>
            Quiet Time Rhythms
          </span>
        </div>

        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs text-[#8A7E9F] hover:text-[#2A2146] transition-colors"
          >
            ← Back to account
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <span className="text-sm">⚠️</span>
          <div className="flex-1">
            <span className="font-semibold block">Notice</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* STEP 1: Fast, Low-Friction Account Creation */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="space-y-4" id="signup-step1-form">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider mb-1.5"
            >
              Your Full or Preferred Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g., Franck Olivier"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#D8CFE6] bg-white text-sm text-[#1E1931] placeholder-[#A098B2] focus:outline-none focus:ring-2 focus:ring-[#2A2146]/20 focus:border-[#2A2146] transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#D8CFE6] bg-white text-sm text-[#1E1931] placeholder-[#A098B2] focus:outline-none focus:ring-2 focus:ring-[#2A2146]/20 focus:border-[#2A2146] transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider mb-1.5"
            >
              Create Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-[#D8CFE6] bg-white text-sm text-[#1E1931] placeholder-[#A098B2] focus:outline-none focus:ring-2 focus:ring-[#2A2146]/20 focus:border-[#2A2146] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#8A7E9F] hover:text-[#2A2146] transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              id="btn-goto-step2"
              className="w-full py-3.5 px-4 rounded-xl bg-[#2A2146] hover:bg-[#1E1733] text-white font-medium text-sm transition-all duration-200 shadow-md shadow-[#2A2146]/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Personalize Quiet Time Preferences</span>
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              id="btn-quick-start"
              onClick={handleQuickStart}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EDE2] border border-[#E0D7C5] text-xs font-semibold text-[#5A4D39] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LifeBookLogo size={18} rounded="rounded-md" />
              <span>Or Instant Start with Recommended ESV Defaults</span>
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Interactive, Inspiring Faith Personalization */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit} className="space-y-5" id="signup-step2-form">
          {/* Faith Season Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider mb-2">
              Where is your soul right now? (Faith Focus)
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {FAITH_SEASONS.map((season) => {
                const isSelected = faithSeason === season.label;
                return (
                  <button
                    key={season.id}
                    type="button"
                    onClick={() => setFaithSeason(season.label)}
                    className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-[#FAF7FD] border-[#2A2146] ring-1 ring-[#2A2146]/20 shadow-xs"
                        : "bg-white border-[#E5DEEF] hover:border-[#CBBFE0] hover:bg-[#FAF9FC]"
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{season.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1E1931]">
                          {season.label}
                        </span>
                        <span className="text-[10px] font-semibold text-[#1FB6B0] shrink-0">
                          {season.scripture}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#706782] mt-0.5 truncate">
                        {season.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bible Translation Segmented Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider mb-2">
              Preferred Bible Translation
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#FAF8F5] border border-[#E5DEEF] rounded-xl">
              {BIBLE_TRANSLATIONS.map((t) => {
                const isSelected = translation === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTranslation(t.id)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#2A2146] text-white shadow-xs"
                        : "text-[#5A4F70] hover:text-[#1E1931] hover:bg-white/60"
                    }`}
                    title={t.tag}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-[#8A7E9F]">
              Selected:{" "}
              <strong className="text-[#2A2146]">
                {BIBLE_TRANSLATIONS.find((t) => t.id === translation)?.name}
              </strong>{" "}
              ({BIBLE_TRANSLATIONS.find((t) => t.id === translation)?.tag})
            </p>
          </div>

          {/* Quiet Time Segmented Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider mb-2">
              Daily Quiet Time Rhythm
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUIET_TIMES.map((qt) => {
                const isSelected = dailyQuietTime === qt.id;
                return (
                  <button
                    key={qt.id}
                    type="button"
                    onClick={() => setDailyQuietTime(qt.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FAF7FD] border-[#2A2146] ring-1 ring-[#2A2146]/20"
                        : "bg-white border-[#E5DEEF] hover:border-[#CBBFE0]"
                    }`}
                  >
                    <span className="text-base block mb-0.5">{qt.icon}</span>
                    <span className="text-xs font-semibold text-[#1E1931] block">
                      {qt.label}
                    </span>
                    <span className="text-[10px] text-[#8A7E9F] block">{qt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Covenant Checkbox */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9]">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                id="signup-covenant"
                type="checkbox"
                checked={covenantAccepted}
                onChange={(e) => setCovenantAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#D5CBE5] text-[#2A2146] focus:ring-[#2A2146]"
              />
              <span className="text-xs text-[#5C4F3D] leading-relaxed">
                <strong>Abiding Covenant:</strong> I come with an honest heart, ready to slow down with Scripture, pray truthfully, and rest in Christ’s grace.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="btn-submit-signup"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#2A2146] hover:bg-[#1E1733] text-white font-medium text-sm transition-all duration-200 shadow-md shadow-[#2A2146]/10 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Preparing your sanctuary...</span>
              </>
            ) : (
              <>
                <span>Complete Registration & Begin Walk</span>
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
