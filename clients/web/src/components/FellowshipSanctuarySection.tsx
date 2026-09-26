"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  HandsPraying,
  Sparkle,
  BookOpenText,
  Plus,
  Check,
  Heart,
  UsersThree,
} from "@phosphor-icons/react";
import { useChristianAuth } from "@/lib/christian-auth";
import { ScriptureStudyDrawer } from "./ScriptureStudyDrawer";

export interface CommunityPrayerItem {
  id: number;
  userUid: string;
  authorName: string;
  lifeSeason: string;
  content: string;
  scriptureAnchor?: string | null;
  prayingCount: number;
  isTestimony: boolean;
  createdAt?: string;
}

const LIFE_SEASONS = [
  "All",
  "Healing",
  "Family",
  "Vocation",
  "Peace",
  "Praise & Testimony",
] as const;

const SUGGESTED_SCRIPTURE_ANCHORS = [
  "Psalm 34:18",
  "Psalm 23:1-4",
  "Matthew 11:28-30",
  "Philippians 4:6-7",
  "Lamentations 3:22-23",
  "Isaiah 40:11",
  "Colossians 3:23",
  "Romans 8:28",
];

export function FellowshipSanctuarySection() {
  const { user, getIdToken } = useChristianAuth();
  const [selectedSeason, setSelectedSeason] = useState<string>("All");
  const [prayers, setPrayers] = useState<CommunityPrayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prayedIds, setPrayedIds] = useState<Record<number, boolean>>({});
  const [composerOpen, setComposerOpen] = useState(false);

  // Composer form states
  const [isTestimony, setIsTestimony] = useState(false);
  const [lifeSeason, setLifeSeason] = useState("Peace");
  const [content, setContent] = useState("");
  const [scriptureAnchor, setScriptureAnchor] = useState("Philippians 4:6-7");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Scripture Study Drawer state
  const [drawerRef, setDrawerRef] = useState<string | null>(null);

  const loadPrayers = useCallback(async (seasonFilter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fellowship-prayers?season=${encodeURIComponent(seasonFilter)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.prayers)) {
          setPrayers(data.prayers);
        }
      }
    } catch {
      // keep existing items on transient network issue
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrayers(selectedSeason);
  }, [selectedSeason, loadPrayers]);

  const handlePrayWithYou = async (id: number) => {
    if (prayedIds[id]) return;
    setPrayedIds((prev) => ({ ...prev, [id]: true }));
    setPrayers((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, prayingCount: item.prayingCount + 1 } : item
      )
    );
    try {
      await fetch("/api/fellowship-prayers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {}
  };

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setFeedbackBanner(null);

    try {
      const token = await getIdToken();
      const uid = user?.id || "usr_pilgrim_franck";
      const email = user?.email || "pilgrim@lifebook.sanctuary";
      const authorName = user?.fullName || "Sanctuary Pilgrim";

      const res = await fetch("/api/fellowship-prayers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userUid: uid,
          email,
          authorName,
          lifeSeason: isTestimony ? "Praise & Testimony" : lifeSeason,
          content: content.trim(),
          scriptureAnchor,
          isTestimony,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.prayer) {
          setPrayers((prev) => [data.prayer, ...prev]);
        }
        setContent("");
        setComposerOpen(false);
        setFeedbackBanner(
          isTestimony
            ? "Your testimony of God's faithfulness has been shared with the Fellowship Sanctuary."
            : "Your prayer request has been lifted up to the Fellowship Sanctuary circle."
        );
      }
    } catch {
      setFeedbackBanner("Unable to post right now. Please try again shortly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="fellowship-sanctuary"
      className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-[#E6DFD3] dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EFE9DE] dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1.5">
            <UsersThree size={16} weight="duotone" />
            <span>Fellowship Sanctuary • Shared Prayer & Testimony Wall</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Bear One Another’s Burdens in Prayer
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Join believers lifting one another before the throne of grace, filter requests by life season, or click any Scripture anchor to study the passage side-by-side.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen((prev) => !prev)}
          className="px-4 py-2.5 rounded-xl bg-[#2A2146] hover:bg-[#1E1733] text-white text-xs font-semibold transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-xs"
        >
          <Plus size={16} weight="bold" />
          <span>{composerOpen ? "Close Prayer Form" : "Share Prayer or Testimony"}</span>
        </button>
      </div>

      {feedbackBanner && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
          <Check size={16} weight="bold" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Composer Drawer */}
      {composerOpen && (
        <form
          onSubmit={handleSubmitPrayer}
          className="rounded-2xl bg-[#FAF7F2] dark:bg-slate-950 border border-[#E2D9C8] dark:border-slate-800 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTestimony(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isTestimony
                    ? "bg-[#2A2146] text-white"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Prayer Request
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTestimony(true);
                  setLifeSeason("Praise & Testimony");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isTestimony
                    ? "bg-amber-700 text-white"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Praise & Answered Prayer
              </button>
            </div>

            {!isTestimony && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Life Season:
                </label>
                <select
                  value={lifeSeason}
                  onChange={(e) => setLifeSeason(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="Healing">Healing</option>
                  <option value="Family">Family</option>
                  <option value="Vocation">Vocation</option>
                  <option value="Peace">Peace</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isTestimony
                  ? "Share how the Lord answered prayer or met you in your walk..."
                  : "Share how the Sanctuary community can pray for you this week..."
              }
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Scripture Anchor:
              </span>
              <select
                value={scriptureAnchor}
                onChange={(e) => setScriptureAnchor(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300"
              >
                {SUGGESTED_SCRIPTURE_ANCHORS.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#2A2146] hover:bg-[#1E1733] text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? "Sharing with Sanctuary..."
                : isTestimony
                ? "Publish Praise Testimony"
                : "Lift Up Prayer Request"}
            </button>
          </div>
        </form>
      )}

      {/* Life Season Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {LIFE_SEASONS.map((season) => {
          const active = selectedSeason === season;
          return (
            <button
              key={season}
              type="button"
              onClick={() => setSelectedSeason(season)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                active
                  ? "bg-[#2A2146] text-white border-[#2A2146] shadow-xs"
                  : "bg-[#FAF7F2] dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-[#E2D9C8] dark:border-slate-700 hover:border-amber-500/50"
              }`}
            >
              {season === "All" ? "All Life Seasons" : season}
            </button>
          );
        })}
      </div>

      {/* Prayer & Testimony Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/60 dark:border-slate-800"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prayers.map((item) => {
            const hasPrayed = Boolean(prayedIds[item.id]);
            return (
              <article
                key={item.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                  item.isTestimony || item.lifeSeason === "Praise & Testimony"
                    ? "bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/80 dark:border-amber-800/40"
                    : "bg-[#FAF7F2]/80 dark:bg-slate-950/60 border-[#E6DFD3] dark:border-slate-800"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2A2146] text-white text-xs font-bold flex items-center justify-center">
                        {(item.authorName?.[0] || "P").toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.authorName}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                        item.isTestimony || item.lifeSeason === "Praise & Testimony"
                          ? "bg-amber-100/80 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border-amber-300/60"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {item.isTestimony ? "Praise & Testimony" : item.lifeSeason}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    “{item.content}”
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
                  {item.scriptureAnchor ? (
                    <button
                      type="button"
                      onClick={() => setDrawerRef(item.scriptureAnchor || "Psalm 23:1-4")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                    >
                      <BookOpenText size={14} weight="duotone" />
                      <span>Study {item.scriptureAnchor}</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    onClick={() => handlePrayWithYou(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      hasPrayed
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#2A2146]"
                    }`}
                  >
                    {item.isTestimony ? (
                      <Sparkle size={14} weight="fill" />
                    ) : hasPrayed ? (
                      <Heart size={14} weight="fill" />
                    ) : (
                      <HandsPraying size={14} weight="duotone" />
                    )}
                    <span>
                      {item.isTestimony
                        ? `Amen • ${item.prayingCount}`
                        : hasPrayed
                        ? `Praying with you • ${item.prayingCount}`
                        : `Praying with you (${item.prayingCount})`}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Interactive Scripture Study Drawer */}
      <ScriptureStudyDrawer
        isOpen={Boolean(drawerRef)}
        onClose={() => setDrawerRef(null)}
        initialReference={drawerRef || "Psalm 23:1-4"}
        sourceContext="Fellowship Sanctuary Prayer Wall"
      />
    </section>
  );
}
