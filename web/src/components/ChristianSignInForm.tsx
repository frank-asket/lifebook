"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useChristianAuth } from "../lib/christian-auth";
import { LifeBookLogo } from "./LifeBookLogo";

export function ChristianSignInForm() {
  const router = useRouter();
  const { signIn, loginAsDemo } = useChristianAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.success) {
        router.push("/");
      } else {
        setError(res.error || "Unable to sign in. Please check your email and password.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    loginAsDemo("asketfranckolivieralex@gmail.com");
    router.push("/");
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <span className="text-sm">⚠️</span>
          <div className="flex-1">
            <span className="font-semibold block">Authentication Notice</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" id="christian-signin-form">
        <div>
          <label
            htmlFor="signin-email"
            className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <input
            id="signin-email"
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="signin-password"
              className="block text-xs font-semibold text-[#2A2146] uppercase tracking-wider"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-[#1FB6B0] hover:text-[#18918C] hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
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

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="signin-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#D8CFE6] text-[#2A2146] focus:ring-[#2A2146]"
            />
            <span className="text-xs text-[#706782]">Keep me signed in for daily quiet times</span>
          </label>
        </div>

        <button
          type="submit"
          id="btn-submit-signin"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#2A2146] hover:bg-[#1E1733] text-white font-medium text-sm transition-all duration-200 shadow-md shadow-[#2A2146]/10 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Entering Sanctuary...</span>
            </>
          ) : (
            <>
              <span>Sign In to LifeBook</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      {/* Instant Demo Access Button */}
      <div className="mt-6 pt-6 border-t border-[#EDE7F5]">
        <div className="text-center mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#9185A7] bg-[#FAF8F5] px-2">
            One-Click Testing Access
          </span>
        </div>
        <button
          type="button"
          id="btn-quick-demo-signin"
          onClick={handleQuickDemo}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#F6F3EE] border border-[#DDD5C7] text-xs font-semibold text-[#3A3025] transition-all flex items-center justify-center gap-2.5 shadow-xs group"
        >
          <LifeBookLogo size={20} rounded="rounded-md" />
          <span>One-Click Sign-In (asketfranckolivieralex@gmail.com)</span>
        </button>
        <p className="mt-2 text-center text-[11px] text-[#8A7E9F]">
          Instantly access preloaded spiritual streaks, devotional progress, and soul journals
        </p>
      </div>

      {/* Forgot Password Pastoral Dialog */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-[#EADBFC] text-center">
            <div className="flex justify-center mb-4">
              <LifeBookLogo size={48} rounded="rounded-2xl" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#2A2146]">Restoring Your Sanctuary Access</h3>
            <p className="text-xs text-[#706782] mt-2.5 leading-relaxed">
              In this preview environment, you can sign in directly with your email address or use the one-click button. All your Scripture journals, streaks, and reflections are securely saved locally.
            </p>
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="mt-6 w-full py-2.5 bg-[#2A2146] text-white text-xs font-semibold rounded-xl hover:bg-[#1E1733] transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
