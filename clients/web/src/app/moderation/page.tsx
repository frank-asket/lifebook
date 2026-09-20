"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Show, UserButton, useUser, useAuth } from "@clerk/nextjs";

interface ModerationReview {
  id: string;
  content_type: "prayer_request" | "discussion" | "journal_entry";
  content_id: string;
  submitted_by: string;
  content_text: string;
  ai_flagged_reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
}

export default function ModerationPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/moderation/reviews", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // Gracefully handle dev / unauthenticated
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      void fetchReviews();
    }, 0);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, fetchReviews]);

  const handleResolve = async (id: string, status: "approved" | "rejected") => {
    setActionInProgress(id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/moderation/reviews/${id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status, reviewed_at: new Date().toISOString() } : r))
        );
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredReviews = reviews.filter((r) => (filter === "all" ? true : r.status === filter));

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2724] font-sans antialiased">
      {/* Header */}
      <header className="border-b border-[#E8E2D9] bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-semibold tracking-tight text-[#1A1816] hover:opacity-80 transition-opacity">
              LifeBook
            </Link>
            <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-[#F4EFE6] text-[#766E65]">
              Careful AI Oversight
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-[#655E55] hover:text-[#1A1816] transition-colors">
              ← Back to App
            </Link>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1816]">Moderation & Pastoral Safety Queue</h1>
          <p className="mt-2 text-[#655E55] max-w-2xl leading-relaxed">
            All user submissions flagged by our deterministic safety edge or AI gateway are staged here. 
            Pastoral and administrative review ensures every community prayer, discussion, and reflection remains grounded, edifying, and protected from crisis escalations.
          </p>
        </div>

        {/* Authentication Wall */}
        <Show when="signed-out">
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-10 text-center max-w-md mx-auto my-12 shadow-sm">
            <div className="w-12 h-12 bg-[#F4EFE6] text-[#8C7A6B] rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
              🛡️
            </div>
            <h2 className="text-lg font-semibold text-[#1A1816]">Reviewer Access Required</h2>
            <p className="text-sm text-[#766E65] mt-2 mb-6">
              Please sign in with your pastoral or reviewer credentials to inspect flagged submissions.
            </p>
            <Link
              href="/sign-in"
              id="moderation-sign-in-link"
              className="w-full inline-block py-2.5 px-4 rounded-xl bg-[#1A1816] text-white text-sm font-medium hover:bg-black transition-colors"
            >
              Sign In to Review Queue
            </Link>
          </div>
        </Show>

        <Show when="signed-in">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8E2D9]">
            <div className="flex items-center gap-2">
              {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filter === tab
                      ? "bg-[#1A1816] text-white"
                      : "text-[#655E55] hover:bg-[#F4EFE6] hover:text-[#1A1816]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={fetchReviews}
              className="text-xs font-semibold uppercase tracking-wider text-[#766E65] hover:text-[#1A1816] transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* List Section */}
          {loading ? (
            <div className="py-20 text-center text-[#766E65] text-sm">Loading queue entries...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center">
              <span className="text-3xl mb-3 block">✓</span>
              <h3 className="text-base font-semibold text-[#1A1816]">No {filter} items in review queue</h3>
              <p className="text-sm text-[#766E65] mt-1">The safety edge is keeping the community clean and grounded.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-sm transition-all hover:border-[#D5CDC2]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[#F4EFE6] text-[#766E65]">
                          {review.content_type.replace("_", " ")}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            review.status === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : review.status === "rejected"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {review.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#9B9389]">
                          {new Date(review.created_at).toLocaleString()}
                        </span>
                      </div>

                      <blockquote className="text-base text-[#1A1816] leading-relaxed pt-1">
                        &ldquo;{review.content_text}&rdquo;
                      </blockquote>

                      {review.ai_flagged_reason && (
                        <div className="bg-[#FFF9F2] border border-[#FBE3CC] rounded-lg px-3 py-2 text-xs text-[#8A511C] flex items-center gap-2">
                          <span>⚠️</span>
                          <span><strong>Flagged Reason:</strong> {review.ai_flagged_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {review.status === "pending" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={actionInProgress === review.id}
                          onClick={() => handleResolve(review.id, "approved")}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actionInProgress === review.id}
                          onClick={() => handleResolve(review.id, "rejected")}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Show>
      </div>
    </main>
  );
}
