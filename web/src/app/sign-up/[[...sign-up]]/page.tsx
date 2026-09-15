import React from "react";
import Link from "next/link";
import { LifeBookLogo } from "@/components/LifeBookLogo";
import { ChristianSignUpForm } from "@/components/ChristianSignUpForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] flex flex-col lg:flex-row">
      {/* Left Column: Full-Screen Spiritual Showcase & Brand Inspiration */}
      <div className="lg:w-5/12 xl:w-5/12 bg-[#171421] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#2A233A]">
        {/* Subtle decorative glow */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#2A2146] opacity-40 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#1FB6B0] opacity-15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Branding with Official LifeBook Logo */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#1FB6B0] rounded-xl p-1 -m-1"
          >
            <LifeBookLogo size={42} showWordmark invert wordmarkClassName="text-2xl" />
          </Link>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-medium tracking-wide">
            <span>Daily Christian Sanctuary</span>
          </div>
        </div>

        {/* Devotional Focus & Scripture */}
        <div className="relative z-10 my-10 lg:my-0 space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1FB6B0]">
              Jesus’ Invitation
            </span>
            <blockquote className="font-serif text-2xl sm:text-3xl font-light text-[#F7F4EB] leading-snug">
              “Come to me, all who labor and are heavy laden, and I will give you rest.”
            </blockquote>
            <p className="text-xs font-medium text-[#A59CB5] tracking-wide">
              Matthew 11:28
            </p>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 text-xs text-[#DDD7E8]">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-sm shrink-0">
                🌿
              </span>
              <span>No Spiritual Scoreboards — grace when life gets full or heavy</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#DDD7E8]">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-sm shrink-0">
                📖
              </span>
              <span>Five Major Translations — ESV, NIV, KJV, CSB, and NLT</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#DDD7E8]">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-sm shrink-0">
                🛡️
              </span>
              <span>Completely Private & Safe — your prayers remain yours and God’s</span>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8C839E]">
          <span>Tailored to your current season of faith</span>
          <Link href="/" className="text-white/70 hover:text-white transition-colors">
            ← Home
          </Link>
        </div>
      </div>

      {/* Right Column: Full-Screen Professional Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-[#FAF8F5] overflow-y-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between max-w-xl w-full mx-auto mb-8">
          <div className="lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <LifeBookLogo size={32} showWordmark wordmarkClassName="text-xl" />
            </Link>
          </div>
          <div className="text-xs text-[#706782] ml-auto flex items-center gap-2">
            <span>Already walking with us?</span>
            <Link
              href="/sign-in"
              className="font-semibold text-[#2A2146] hover:text-[#1FB6B0] underline underline-offset-2 transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>

        {/* Center Content: Form */}
        <div className="max-w-xl w-full mx-auto my-auto py-4">
          <div className="mb-6">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1931] tracking-tight">
              Begin Your Walk
            </h1>
            <p className="mt-2 text-sm text-[#706782] leading-relaxed">
              Create your Christian devotional profile to shape your quiet time and daily scripture rhythm.
            </p>
          </div>

          <div className="bg-white border border-[#EADBFC]/70 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#2A2146]/5">
            <ChristianSignUpForm />
          </div>
        </div>

        {/* Bottom Footer Links */}
        <div className="max-w-xl w-full mx-auto mt-8 pt-4 flex items-center justify-between text-xs text-[#8A7E9F]">
          <Link href="/" className="hover:text-[#2A2146] transition-colors">
            ← Return to LifeBook home
          </Link>
          <span>Psalm 119:105</span>
        </div>
      </div>
    </div>
  );
}
