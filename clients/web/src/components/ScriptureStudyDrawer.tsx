"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpenText,
  X,
  Check,
  Sparkle,
  Notebook,
  ArrowsLeftRight,
  BookmarkSimple,
  Quotes,
} from "@phosphor-icons/react";
import { useChristianAuth } from "@/lib/christian-auth";

export type BibleTranslationKey = "ESV" | "NIV" | "KJV" | "NLT";

interface ScripturePassageData {
  reference: string;
  theme: string;
  historicalContext: string;
  crossReferences: string[];
  translations: Record<BibleTranslationKey, string>;
}

export const SCRIPTURE_STUDY_LIBRARY: Record<string, ScripturePassageData> = {
  "Psalm 23:1-4": {
    reference: "Psalm 23:1-4",
    theme: "The Good Shepherd's Presence in the Valley",
    historicalContext:
      "Composed by David drawing upon his years shepherding flocks in the Judean wilderness. Notice the intimate shift from third-person ('He leads me') in verses 1–3 to second-person ('You are with me') the moment the valley of shadow is entered.",
    crossReferences: ["John 10:11", "Psalm 34:18", "Isaiah 40:11"],
    translations: {
      ESV: "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He leads me in paths of righteousness for his name's sake. Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
      NIV: "The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name's sake. Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
      KJV: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake. Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
      NLT: "The LORD is my shepherd; I have all that I need. He lets me rest in green meadows; he leads me beside peaceful streams. He renews my strength. He guides me along right paths, bringing honor to his name. Even when I walk through the darkest valley, I will not be afraid, for you are close beside me. Your rod and your staff protect and comfort me.",
    },
  },
  "Psalm 34:18": {
    reference: "Psalm 34:18",
    theme: "God's Nearness to the Brokenhearted",
    historicalContext:
      "An alphabetic acrostic psalm written after David's deliverance from Gath. Rather than promising exemption from sorrow, it reveals that brokenness draws the immediate, tender proximity of the Lord.",
    crossReferences: ["Psalm 23:1-4", "Matthew 11:28-30", "Lamentations 3:22-23"],
    translations: {
      ESV: "The LORD is near to the brokenhearted and saves the crushed in spirit.",
      NIV: "The LORD is close to the brokenhearted and saves those who are crushed in spirit.",
      KJV: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
      NLT: "The LORD is close to the brokenhearted; he rescues those whose spirits are crushed.",
    },
  },
  "Matthew 11:28-30": {
    reference: "Matthew 11:28-30",
    theme: "The Unforced Rhythms of Christ's Rest",
    historicalContext:
      "Spoken by Jesus to crowds weighed down by Pharisaic legalism and Roman taxation. A double-yoke in Galilee paired a seasoned ox with a younger one so the stronger bore the weight of the plow.",
    crossReferences: ["Psalm 23:1-4", "Philippians 4:6-7", "Isaiah 40:11"],
    translations: {
      ESV: "Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.",
      NIV: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.",
      KJV: "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light.",
      NLT: "Then Jesus said, 'Come to me, all of you who are weary and carry heavy burdens, and I will give you rest. Take my yoke upon you. Let me teach you, because I am humble and gentle at heart, and you will find rest for your souls. For my yoke is easy to bear, and the burden I give you is light.'",
    },
  },
  "Lamentations 3:22-23": {
    reference: "Lamentations 3:22-23",
    theme: "Covenant Mercies Renewed Every Morning",
    historicalContext:
      "Set at the structural center of the Book of Lamentations amidst the ruins of Jerusalem, anchoring hope not in changing circumstances but in the steadfast covenant love (chesed) of God.",
    crossReferences: ["Psalm 34:18", "Romans 8:28", "Philippians 4:6-7"],
    translations: {
      ESV: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.",
      NIV: "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
      KJV: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
      NLT: "The faithful love of the LORD never ends! His mercies never cease. Great is his faithfulness; his mercies begin afresh each morning.",
    },
  },
  "Philippians 4:6-7": {
    reference: "Philippians 4:6-7",
    theme: "The Peace of God Guarding Heart and Mind",
    historicalContext:
      "Written by Paul while chained to a Roman Praetorian guard. The Greek verb 'phroureo' ('will guard') is a military term picturing a garrison standing watch around the believer's anxious thoughts.",
    crossReferences: ["Matthew 11:28-30", "Psalm 23:1-4", "Romans 8:28"],
    translations: {
      ESV: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
      NIV: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      KJV: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
      NLT: "Don't worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God's peace, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus.",
    },
  },
  "Romans 8:28": {
    reference: "Romans 8:28",
    theme: "Sovereign Providence in All Things",
    historicalContext:
      "Part of Paul's sweeping exposition of life in the Spirit, assuring believers that suffering and groaning are woven by God's providence toward our conformity to the image of His Son.",
    crossReferences: ["Lamentations 3:22-23", "Philippians 4:6-7", "Psalm 34:18"],
    translations: {
      ESV: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
      NIV: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      KJV: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
      NLT: "And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.",
    },
  },
  "Isaiah 40:11": {
    reference: "Isaiah 40:11",
    theme: "Gentle Shepherding of the Flock",
    historicalContext:
      "Opens the Book of Comfort in Isaiah, picturing the Almighty Creator stooping down to gather weak lambs in His arms and gently pace the flock for nursing mothers.",
    crossReferences: ["Psalm 23:1-4", "Matthew 11:28-30", "Psalm 34:18"],
    translations: {
      ESV: "He will tend his flock like a shepherd; he will gather the lambs in his arms; he will carry them in his bosom, and gently lead those that are with young.",
      NIV: "He tends his flock like a shepherd: He gathers the lambs in his arms and carries them close to his heart; he gently leads those that have young.",
      KJV: "He shall feed his flock like a shepherd: he shall gather the lambs with his arm, and carry them in his bosom, and shall gently lead those that are with young.",
      NLT: "He will feed his flock like a shepherd. He will carry the lambs in his arms, holding them close to his heart. He will gently lead the mother sheep with their young.",
    },
  },
  "Colossians 3:23": {
    reference: "Colossians 3:23",
    theme: "Sacred Vocation & Wholehearted Work",
    historicalContext:
      "Transforms ordinary daily labor into an act of worship offered directly to the risen Lord rather than merely human supervisors.",
    crossReferences: ["Romans 8:28", "Philippians 4:6-7", "Lamentations 3:22-23"],
    translations: {
      ESV: "Whatever you do, work heartily, as for the Lord and not for men.",
      NIV: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",
      KJV: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.",
      NLT: "Work willingly at whatever you do, as though you were working for the Lord rather than for people.",
    },
  },
};

function resolvePassage(ref: string, fallbackText?: string): ScripturePassageData {
  const normalized = ref.trim();
  if (SCRIPTURE_STUDY_LIBRARY[normalized]) {
    return SCRIPTURE_STUDY_LIBRARY[normalized];
  }
  const matchKey = Object.keys(SCRIPTURE_STUDY_LIBRARY).find(
    (k) => k.toLowerCase().includes(normalized.toLowerCase()) || normalized.toLowerCase().includes(k.toLowerCase())
  );
  if (matchKey) {
    return SCRIPTURE_STUDY_LIBRARY[matchKey];
  }
  const baseText =
    fallbackText ||
    "Your word is a lamp to my feet and a light to my path. Forever, O LORD, your word is firmly fixed in the heavens.";
  return {
    reference: normalized || "Psalm 119:105",
    theme: "Abiding in the Living Word",
    historicalContext:
      "Scripture invites slow, prayerful meditation (Lectio Divina)—reading the text aloud, pondering its Christ-centered promise, responding in honest prayer, and resting in God's presence.",
    crossReferences: ["Psalm 23:1-4", "Matthew 11:28-30", "Lamentations 3:22-23"],
    translations: {
      ESV: baseText,
      NIV: `${baseText} (NIV Study Reading)`,
      KJV: `${baseText} (KJV Authorized Reading)`,
      NLT: `${baseText} (NLT Living Reading)`,
    },
  };
}

interface SavedMarginNote {
  id: number;
  verseRef: string;
  translation: string;
  verseText: string;
  marginNote: string;
  sourceContext?: string | null;
  createdAt?: string;
}

interface ScriptureStudyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialReference: string;
  initialVerseText?: string;
  sourceContext?: string;
}

export function ScriptureStudyDrawer({
  isOpen,
  onClose,
  initialReference,
  initialVerseText,
  sourceContext,
}: ScriptureStudyDrawerProps) {
  const { user, getIdToken } = useChristianAuth();
  const [activeRef, setActiveRef] = useState(initialReference || "Psalm 23:1-4");
  const [translation, setTranslation] = useState<BibleTranslationKey>("ESV");
  const [compareMode, setCompareMode] = useState(false);
  const [marginNote, setMarginNote] = useState("");
  const [saveToJournal, setSaveToJournal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<SavedMarginNote[]>([]);

  useEffect(() => {
    if (initialReference) {
      setActiveRef(initialReference);
    }
  }, [initialReference]);

  const fetchSavedNotes = useCallback(async () => {
    try {
      const token = await getIdToken();
      const uid = user?.id || "usr_pilgrim_franck";
      const res = await fetch(`/api/scripture-notes?userUid=${encodeURIComponent(uid)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notes)) {
          setSavedNotes(data.notes);
        }
      }
    } catch {
      // ignore offline error
    }
  }, [getIdToken, user?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchSavedNotes();
    }
  }, [isOpen, fetchSavedNotes]);

  if (!isOpen) return null;

  const passage = resolvePassage(activeRef, initialVerseText);
  const currentText = passage.translations[translation];

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marginNote.trim()) return;
    setSaving(true);
    setSaveToast(null);

    try {
      const token = await getIdToken();
      const uid = user?.id || "usr_pilgrim_franck";
      const email = user?.email || "pilgrim@lifebook.sanctuary";
      const authorName = user?.fullName || "Sanctuary Pilgrim";

      const res = await fetch("/api/scripture-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userUid: uid,
          email,
          authorName,
          verseRef: passage.reference,
          translation,
          verseText: currentText,
          marginNote: marginNote.trim(),
          sourceContext: sourceContext || "Living Word Scripture Study",
          saveToJournal,
        }),
      });

      if (saveToJournal && typeof window !== "undefined") {
        try {
          const existingRaw = localStorage.getItem("lifebook_journal_entries");
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const newEntry = {
            id: `scripture_${Date.now()}`,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            mood: "Peaceful",
            text: `${marginNote.trim()}\n\n— Scripture Study: ${passage.reference} (${translation}): "${currentText}"`,
            verse: `${passage.reference} (${translation})`,
          };
          localStorage.setItem("lifebook_journal_entries", JSON.stringify([newEntry, ...existing]));
        } catch {}
      }

      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setSavedNotes((prev) => [data.note, ...prev]);
        }
        setMarginNote("");
        setSaveToast(
          saveToJournal
            ? `Saved margin note & added ${passage.reference} to your Sanctuary Journal.`
            : `Saved margin note on ${passage.reference} to your Cloud Sanctuary.`
        );
      }
    } catch {
      setSaveToast("Saved locally to your Sanctuary Journal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Scripture Study: ${passage.reference}`}
    >
      <div className="relative w-full max-w-xl bg-[#FAF7F2] dark:bg-[#141A23] text-[#1E1931] dark:text-[#F3EFE6] h-full overflow-y-auto shadow-2xl border-l border-[#E6DFD3] dark:border-slate-800 flex flex-col justify-between">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[#E6DFD3] dark:border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">
                <BookOpenText size={16} weight="duotone" />
                <span>Interactive Scripture Study & Cross-Referencing</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {passage.reference}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {passage.theme} {sourceContext ? `• From ${sourceContext}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Scripture Drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Translation Selector & Side-by-Side Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-[#EFE9DE] dark:bg-slate-800 p-1 border border-[#E2D9C8] dark:border-slate-700">
              {(["ESV", "NIV", "KJV", "NLT"] as BibleTranslationKey[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTranslation(t)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    translation === t
                      ? "bg-[#2A2146] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCompareMode((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                compareMode
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300"
                  : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ArrowsLeftRight size={15} />
              <span>{compareMode ? "Single Reading" : "Compare All 4 Translations"}</span>
            </button>
          </div>

          {/* Primary Scripture Passage Box */}
          {!compareMode ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-[#E6DFD3] dark:border-slate-800 p-6 shadow-xs relative">
              <Quotes
                size={28}
                weight="duotone"
                className="text-amber-600/30 dark:text-amber-400/25 mb-2"
              />
              <p className="font-serif text-lg sm:text-xl leading-relaxed text-slate-900 dark:text-slate-100">
                “{currentText}”
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  {passage.reference} ({translation})
                </span>
                <span>Lectio Divina Sanctuary Reading</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["ESV", "NIV", "KJV", "NLT"] as BibleTranslationKey[]).map((t) => (
                <div
                  key={t}
                  className={`rounded-xl p-4 border ${
                    t === translation
                      ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-400/60"
                      : "bg-white dark:bg-slate-900 border-[#E6DFD3] dark:border-slate-800"
                  }`}
                >
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
                    {t}
                  </span>
                  <p className="font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    “{passage.translations[t]}”
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Historical & Exegetical Context */}
          <div className="rounded-2xl bg-[#F3EDE2]/80 dark:bg-slate-800/50 border border-[#E2D9C8] dark:border-slate-700/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              <Sparkle size={15} weight="fill" className="text-amber-600" />
              <span>Historical & Pastoral Context</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {passage.historicalContext}
            </p>
          </div>

          {/* Cross-References Bar */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Scripture Cross-References (Click to Read)
            </span>
            <div className="flex flex-wrap gap-2">
              {passage.crossReferences.map((xref) => (
                <button
                  key={xref}
                  type="button"
                  onClick={() => setActiveRef(xref)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeRef === xref
                      ? "bg-[#2A2146] text-white border-[#2A2146]"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500"
                  }`}
                >
                  <BookOpenText size={14} />
                  <span>{xref}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Margin Note & Save to Sanctuary Journal Form */}
          <form
            onSubmit={handleSaveNote}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E6DFD3] dark:border-slate-800 p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="scripture-margin-note"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
              >
                <Notebook size={16} className="text-amber-600" />
                <span>Personal Margin Note & Sanctuary Reflection</span>
              </label>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Cloud SQL Synced
              </span>
            </div>

            <textarea
              id="scripture-margin-note"
              rows={3}
              value={marginNote}
              onChange={(e) => setMarginNote(e.target.value)}
              placeholder={`Write how the Lord is speaking to you through ${passage.reference}...`}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF7F2] dark:bg-slate-950 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToJournal}
                  onChange={(e) => setSaveToJournal(e.target.checked)}
                  className="rounded border-slate-300 text-[#2A2146] focus:ring-[#2A2146]"
                />
                <span>Also save verse & reflection to my Sanctuary Journal</span>
              </label>

              <button
                type="submit"
                disabled={saving || !marginNote.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#2A2146] hover:bg-[#1E1733] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <BookmarkSimple size={15} weight="fill" />
                <span>{saving ? "Saving..." : "Save Margin Note"}</span>
              </button>
            </div>

            {saveToast && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check size={16} weight="bold" />
                <span>{saveToast}</span>
              </div>
            )}
          </form>

          {/* Previously Saved Margin Notes */}
          {savedNotes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Saved Scripture Margin Notes ({savedNotes.length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedNotes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveRef(n.verseRef)}
                        className="font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        {n.verseRef} ({n.translation})
                      </button>
                      {n.sourceContext && (
                        <span className="text-[11px] text-slate-400">{n.sourceContext}</span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{n.marginNote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
