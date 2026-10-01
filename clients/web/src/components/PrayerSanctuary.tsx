"use client";

import React, { useState, useEffect } from "react";
import {
  HandsPraying,
  BookOpenText,
  Sparkle,
  LockKey,
  SpeakerHigh,
  Stop,
  Trash,
  ClockCounterClockwise,
  WarningCircle,
  Heart,
} from "@phosphor-icons/react";
import { useLanguage } from "@/lib/i18n";
import { speakWithHumanVoice, stopHumanVoice } from "@/lib/human-voice";

export interface PrayerSanctuaryPassage {
  reference: string;
  text: string;
  translation: string;
}

export interface PrayerSanctuaryResult {
  id: string;
  text?: string;
  themes: string[];
  passage: PrayerSanctuaryPassage | null;
  meditation: string;
  reflectionQuestion: string;
  guidedPrayer: string;
  safetyStatus: "safe" | "distress_detected" | "crisis_escalation";
  supportMessage: string | null;
  saved: boolean;
  createdAt: string;
}

interface PrayerSanctuaryProps {
  userId?: string;
  onActivityRecorded?: () => void;
}

export function PrayerSanctuary({ onActivityRecorded }: PrayerSanctuaryProps) {
  const { isFr } = useLanguage();
  const [prayerText, setPrayerText] = useState("");
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrayerSanctuaryResult | null>(null);
  const [history, setHistory] = useState<PrayerSanctuaryResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Fetch private history on mount
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      fetch("/api/lifebook/prayer-sanctuary/history")
        .then((res) => {
          if (!res.ok) throw new Error("Could not load history");
          return res.json();
        })
        .then((data) => {
          if (mounted && Array.isArray(data.entries)) {
            setHistory(data.entries);
          }
        })
        .catch(() => {
          // Silent catch for local dev fallback or unauthenticated guests
        })
        .finally(() => {
          if (mounted) setHistoryLoading(false);
        });
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopHumanVoice();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = prayerText.trim();
    if (clean.length < 10) {
      setError(
        isFr
          ? "Écrivez au moins une phrase pour nous permettre de trouver un passage approprié."
          : "Write at least a sentence so we can find a helpful Scripture passage to begin."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    stopHumanVoice();
    setIsPlayingAudio(false);

    try {
      const res = await fetch("/api/lifebook/prayer-sanctuary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          saveToHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            (isFr
              ? "Impossible de traiter votre prière. Veuillez réessayer."
              : "Unable to process prayer. Please try again.")
        );
      }

      const data: PrayerSanctuaryResult = await res.json();
      setResult(data);
      setPrayerText("");
      if (data.saved) {
        setHistory((prev) => [data, ...prev]);
      }
      if (onActivityRecorded) {
        onActivityRecorded();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lifebook/prayer-sanctuary/history/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (result?.id === id) {
          setResult(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopHumanVoice();
      setIsPlayingAudio(false);
    } else if (result) {
      const parts = [
        result.passage ? `${result.passage.reference}. ${result.passage.text}` : "",
        result.meditation,
        result.guidedPrayer ? `${isFr ? "Prions ensemble" : "Let us pray"}: ${result.guidedPrayer}` : "",
      ]
        .filter(Boolean)
        .join(". ");

      speakWithHumanVoice({
        text: parts,
        isFrFallback: isFr,
        onEnd: () => setIsPlayingAudio(false),
      });
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#161224] border border-[#2D2542]/10 dark:border-white/10 p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#2D2542]/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E8BA6A] dark:text-[#F7CB7A] mb-1">
            <HandsPraying size={16} weight="duotone" />
            <span>{isFr ? "Sanctuaire de Prière Privé" : "Private Prayer Sanctuary"}</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-[#1E1931] dark:text-white font-normal">
            {isFr ? "Déposez ce qui pèse sur votre cœur." : "Bring what's on your heart."}
          </h2>
          <p className="text-sm text-[#766D87] dark:text-[#B8B0C8] mt-1 max-w-xl">
            {isFr
              ? "Écrivez librement. Nous chercherons un passage biblique réconfortant et façonnerons une courte méditation et une prière guidée adaptées."
              : "Write freely. We will identify themes, select an approved Scripture passage, and shape a gentle meditation and guided prayer."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F5F0E7] dark:bg-[#1E1834] text-[#2D2542] dark:text-[#FDFCFB] hover:bg-[#EAE2D5] dark:hover:bg-[#2A2146] transition-colors cursor-pointer"
          >
            <ClockCounterClockwise size={15} weight="duotone" />
            <span>
              {isFr ? "Historique privé" : "Private history"} ({history.length})
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Column: Form & Privacy Guarantee */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="prayer-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C4B78] dark:text-[#F7CB7A] mb-2"
              >
                {isFr ? "Votre prière ou fardeau" : "Your prayer or burden"}
              </label>
              <textarea
                id="prayer-input"
                rows={6}
                value={prayerText}
                onChange={(e) => setPrayerText(e.target.value)}
                placeholder={
                  isFr
                    ? "Je me sens inquiet au sujet d'une décision au travail, j'ai besoin de paix et de sagesse divine..."
                    : "I'm feeling anxious about a decision at work and home, asking for peace and divine guidance..."
                }
                className="w-full rounded-xl bg-[#FCFAF6] dark:bg-[#0E0C18] border border-[#2D2542]/15 dark:border-white/15 p-4 text-sm text-[#1E1931] dark:text-[#FDFCFB] placeholder-[#766D87]/60 focus:outline-none focus:ring-2 focus:ring-[#66C8BB] dark:focus:ring-[#4EE2D8] transition-all resize-y"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs">
                <WarningCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="save-history"
                checked={saveToHistory}
                onChange={(e) => setSaveToHistory(e.target.checked)}
                className="w-4 h-4 rounded text-[#211B3B] focus:ring-[#66C8BB] cursor-pointer"
              />
              <label
                htmlFor="save-history"
                className="text-xs text-[#5C4B78] dark:text-[#B8B0C8] cursor-pointer select-none"
              >
                {isFr
                  ? "Conserver dans mon historique privé (suppression possible à tout moment)"
                  : "Keep in my private sanctuary history (you can delete it anytime)"}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || prayerText.trim().length < 5}
              className="mt-2 w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-[#211B3B] hover:bg-[#2C2254] dark:bg-[#4EE2D8] dark:hover:bg-[#66C8BB] text-white dark:text-[#0C0918] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{isFr ? "Recherche de l'Écriture..." : "Seeking Scripture..."}</span>
                </>
              ) : (
                <>
                  <Sparkle size={17} weight="duotone" />
                  <span>
                    {isFr ? "Recevoir une réflexion & prière" : "Receive Reflection & Prayer"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Privacy Guarantee Banner */}
          <div className="mt-8 p-4 rounded-xl bg-[#F5F0E7]/60 dark:bg-[#1E1834]/40 border border-[#2D2542]/5 dark:border-white/5 flex items-start gap-3 text-xs text-[#766D87] dark:text-[#B8B0C8]">
            <LockKey size={20} className="shrink-0 text-[#E8BA6A] dark:text-[#F7CB7A] mt-0.5" />
            <div>
              <p className="font-semibold text-[#1E1931] dark:text-[#FDFCFB] mb-0.5">
                {isFr ? "Confidentialité garantie" : "Absolute Privacy Guarantee"}
              </p>
              <p>
                {isFr
                  ? "Vos prières ne sont jamais partagées, publiées ni vendues. Elles restent strictement entre vous et Dieu."
                  : "Your prayers are never shared, public, or sold. They remain strictly between you and God."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Result or Sanctuary Guidance */}
        <div className="lg:col-span-6 flex flex-col">
          {result ? (
            <div className="flex flex-col gap-5 p-6 rounded-2xl bg-[#FCFAF6] dark:bg-[#0E0C18] border border-[#2D2542]/10 dark:border-white/10 shadow-sm animate-fade-in">
              {/* Crisis Escalation Alert if triggered */}
              {result.safetyStatus === "crisis_escalation" && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                    <WarningCircle size={18} weight="fill" className="text-amber-600 dark:text-amber-400" />
                    <span>{isFr ? "Assistance & Écoute immédiate" : "Immediate Support & Lifeline"}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{result.supportMessage}</p>
                  <div className="mt-2.5 pt-2 border-t border-amber-200 dark:border-amber-800/60 flex flex-wrap gap-3 text-xs font-semibold">
                    <span>🇺🇸/🇨🇦 Call/Text: 988</span>
                    <span>🇫🇷 Écoute 24/7: 3114</span>
                    <span>🇬🇧 Call: 111</span>
                  </div>
                </div>
              )}

              {/* Themes & Header */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {result.themes.map((theme) => (
                    <span
                      key={theme}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#211B3B]/10 dark:bg-[#4EE2D8]/15 text-[#211B3B] dark:text-[#4EE2D8]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#1E1834] border border-[#2D2542]/10 dark:border-white/10 text-[#211B3B] dark:text-[#FDFCFB] hover:bg-[#F5F0E7] dark:hover:bg-[#2A2146] transition-colors cursor-pointer"
                  title={isFr ? "Écouter avec une voix humaine" : "Listen with human voice"}
                >
                  {isPlayingAudio ? (
                    <>
                      <Stop size={14} weight="fill" className="text-red-500" />
                      <span>{isFr ? "Arrêter" : "Stop"}</span>
                    </>
                  ) : (
                    <>
                      <SpeakerHigh size={14} weight="duotone" className="text-[#66C8BB] dark:text-[#4EE2D8]" />
                      <span>{isFr ? "Écouter" : "Listen"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scripture Passage Card */}
              {result.passage && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-[#211B3B] to-[#2C2254] text-white relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between text-xs text-[#E8BA6A] dark:text-[#F7CB7A] font-bold tracking-wider uppercase mb-2">
                    <span>{result.passage.reference}</span>
                    <span className="opacity-80">{result.passage.translation}</span>
                  </div>
                  <p className="font-serif text-lg leading-relaxed italic text-[#FDFCFB]">
                    &ldquo;{result.passage.text}&rdquo;
                  </p>
                </div>
              )}

              {/* Meditation Guidance */}
              {result.meditation && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#766D87] dark:text-[#B8B0C8] mb-1.5 flex items-center gap-1.5">
                    <Heart size={14} weight="duotone" className="text-[#66C8BB] dark:text-[#4EE2D8]" />
                    <span>{isFr ? "Méditation pastorale" : "Heart Guidance"}</span>
                  </h4>
                  <p className="text-sm text-[#2B2344] dark:text-[#E2DCF0] leading-relaxed">
                    {result.meditation}
                  </p>
                </div>
              )}

              {/* Reflection Question */}
              {result.reflectionQuestion && (
                <div className="p-3.5 rounded-xl bg-[#F5F0E7] dark:bg-[#1E1834] border-l-4 border-[#E8BA6A] dark:border-[#F7CB7A]">
                  <p className="text-xs font-semibold text-[#1E1931] dark:text-[#FDFCFB] italic">
                    &ldquo;{result.reflectionQuestion}&rdquo;
                  </p>
                </div>
              )}

              {/* Guided Prayer */}
              {result.guidedPrayer && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#766D87] dark:text-[#B8B0C8] mb-1.5 flex items-center gap-1.5">
                    <HandsPraying size={14} weight="duotone" className="text-[#E8BA6A] dark:text-[#F7CB7A]" />
                    <span>{isFr ? "Prière proposée" : "Guided Prayer"}</span>
                  </h4>
                  <p className="text-sm text-[#2B2344] dark:text-[#E2DCF0] leading-relaxed italic bg-white/50 dark:bg-black/20 p-3.5 rounded-xl border border-[#2D2542]/5 dark:border-white/5">
                    {result.guidedPrayer}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-[#FCFAF6] dark:bg-[#0E0C18] border border-dashed border-[#2D2542]/20 dark:border-white/20">
              <div className="w-14 h-14 rounded-full bg-[#F5F0E7] dark:bg-[#1E1834] flex items-center justify-center text-[#211B3B] dark:text-[#4EE2D8] mb-4">
                <BookOpenText size={28} weight="duotone" />
              </div>
              <h3 className="font-serif text-xl text-[#1E1931] dark:text-white font-normal mb-2">
                {isFr ? "Un sanctuaire de paix et de vérité" : "A Sanctuary of Stillness"}
              </h3>
              <p className="text-xs text-[#766D87] dark:text-[#B8B0C8] max-w-sm leading-relaxed">
                {isFr
                  ? "Déposez vos pensées ci-contre. Le sanctuaire analysera vos sentiments et vous offrira une Parole vivante de réconfort et une prière guidée."
                  : "Bring any joy, doubt, anxiety, or praise. LifeBook connects your heart to God's Word with curated Scripture and prayer."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Private History Tray */}
      {historyOpen && (
        <div className="mt-8 pt-6 border-t border-[#2D2542]/10 dark:border-white/10 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E1931] dark:text-white flex items-center gap-2">
              <ClockCounterClockwise size={16} weight="duotone" />
              <span>{isFr ? "Vos prières et méditations passées" : "Your Past Prayers & Reflections"}</span>
            </h3>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="text-xs text-[#766D87] dark:text-[#B8B0C8] hover:text-[#1E1931] dark:hover:text-white cursor-pointer"
            >
              {isFr ? "Fermer" : "Close"}
            </button>
          </div>

          {historyLoading ? (
            <div className="py-8 text-center text-xs text-[#766D87]">
              {isFr ? "Chargement de l'historique..." : "Loading history..."}
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#766D87] dark:text-[#B8B0C8]">
              {isFr ? "Aucune prière enregistrée dans l'historique." : "No saved prayers yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-[#FCFAF6] dark:bg-[#0E0C18] border border-[#2D2542]/10 dark:border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#766D87] dark:text-[#B8B0C8] mb-2">
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      {entry.passage && (
                        <span className="font-semibold text-[#E8BA6A] dark:text-[#F7CB7A]">
                          {entry.passage.reference}
                        </span>
                      )}
                    </div>
                    {entry.text && (
                      <p className="text-xs text-[#2B2344] dark:text-[#E2DCF0] line-clamp-2 italic mb-2">
                        &ldquo;{entry.text}&rdquo;
                      </p>
                    )}
                    {entry.passage && (
                      <p className="text-xs font-serif text-[#1E1931] dark:text-[#FDFCFB] line-clamp-2">
                        {entry.passage.text}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#2D2542]/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setResult(entry);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-xs font-semibold text-[#66C8BB] dark:text-[#4EE2D8] hover:underline cursor-pointer"
                    >
                      {isFr ? "Ouvrir" : "View"}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === entry.id}
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer p-1"
                      title={isFr ? "Supprimer de l'historique" : "Delete from history"}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
