"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getAllTeachings,
  CATALOG_CHANGE_EVENT,
  type Teaching,
} from "./livingWordData";
import {
  BIBLE_CANON,
  BibleBook,
  getBookById,
  getChapterContent,
  searchScriptures,
} from "@/lib/bible-canon";
import { useLanguage } from "@/lib/i18n";
import { usePlaylists, type Playlist } from "@/lib/usePlaylists";
import { PlaylistModal } from "@/components/PlaylistModal";
import { PlaylistPlayer } from "@/components/PlaylistPlayer";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";
import HumanVoiceSelector from "@/components/HumanVoiceSelector";
import {
  VoiceProfile,
  getPreferredVoiceProfile,
  speakWithHumanVoice,
} from "@/lib/human-voices";

export interface LivingWordProps {
  initialBookId?: string;
  initialChapter?: number;
  completedChapters?: string[];
  onMarkChapterRead?: (bookId: string, chapter: number) => void;
  onOpenVoicePractice?: (bookId: string, chapter: number) => void;
}

export default function LivingWord({
  initialBookId = "psalms",
  initialChapter = 23,
  completedChapters = [],
  onMarkChapterRead,
  onOpenVoicePractice,
}: LivingWordProps = {}) {
  const { language, isFr, t } = useLanguage();
  const { playTeaching, currentTrack, isPlaying, togglePlay } =
    useSanctuaryAudio();

  const [subView, setSubView] = useState<"canon" | "teachings" | "playlists">(
    "canon"
  );

  // Bible Canon State
  const [testamentFilter, setTestamentFilter] = useState<"ALL" | "OT" | "NT">(
    "ALL"
  );
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId);
  const [selectedChapterNum, setSelectedChapterNum] =
    useState<number>(initialChapter);
  const [searchQuery, setSearchQuery] = useState("");
  const [speakingVerse, setSpeakingVerse] = useState<number | null>(null);
  const [selectedVoiceProfile, setSelectedVoiceProfile] =
    useState<VoiceProfile>(() => getPreferredVoiceProfile(language));

  useEffect(() => {
    setSelectedBookId(initialBookId);
    setSelectedChapterNum(initialChapter);
  }, [initialBookId, initialChapter]);

  useEffect(() => {
    setSelectedVoiceProfile(getPreferredVoiceProfile(language));
  }, [language]);

  // Teachings & Playlists State
  const [allTeachings, setAllTeachings] = useState<Teaching[]>(() =>
    getAllTeachings()
  );
  const [category, setCategory] = useState("All");
  const { playlists, deletePlaylist, removeFromPlaylist, createPlaylist } =
    usePlaylists();
  const [activeModalTeaching, setActiveModalTeaching] =
    useState<Teaching | null>(null);
  const [playingPlaylist, setPlayingPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylistDetail, setSelectedPlaylistDetail] =
    useState<Playlist | null>(null);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineDesc, setInlineDesc] = useState("");

  useEffect(() => {
    const sync = () => setAllTeachings(getAllTeachings());
    window.addEventListener(CATALOG_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const selectedBook: BibleBook = useMemo(
    () => getBookById(selectedBookId) || BIBLE_CANON[18],
    [selectedBookId]
  );

  const chapterContent = useMemo(
    () => getChapterContent(selectedBook.id, selectedChapterNum),
    [selectedBook.id, selectedChapterNum]
  );

  const filteredBooks = useMemo(() => {
    return BIBLE_CANON.filter((b) =>
      testamentFilter === "ALL" ? true : b.testament === testamentFilter
    );
  }, [testamentFilter]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchScriptures(searchQuery, language);
  }, [searchQuery, language]);

  const isChapterDone = completedChapters.includes(
    `${selectedBook.id}-${selectedChapterNum}`
  );

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingVerse(null);
  };

  const speakSingleVerse = (verseNumber: number, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingVerse === verseNumber) {
      stopSpeech();
      return;
    }
    speakWithHumanVoice({
      text,
      profile: selectedVoiceProfile,
      onStart: () => setSpeakingVerse(verseNumber),
      onEnd: () => setSpeakingVerse(null),
      onError: () => setSpeakingVerse(null),
    });
  };

  const speakChapterAloud = () => {
    if (speakingVerse !== null) {
      stopSpeech();
      return;
    }
    const fullText = chapterContent.verses
      .map((v) => (isFr ? v.fr : v.en))
      .join(" ");
    speakWithHumanVoice({
      text: fullText,
      profile: selectedVoiceProfile,
      onStart: () => setSpeakingVerse(0),
      onEnd: () => setSpeakingVerse(null),
      onError: () => setSpeakingVerse(null),
    });
  };

  const categories = [
    { id: "All", label: isFr ? "Tous" : "All" },
    { id: "Faith", label: isFr ? "Foi" : "Faith" },
    { id: "Prayer", label: isFr ? "Prière" : "Prayer" },
    { id: "Hope", label: isFr ? "Espérance" : "Hope" },
    { id: "Discipleship", label: isFr ? "Vie chrétienne" : "Discipleship" },
  ];

  const visibleTeachings =
    category === "All"
      ? allTeachings
      : allTeachings.filter((teaching) => teaching.category === category);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    await createPlaylist(inlineTitle.trim(), inlineDesc.trim(), "I");
    setInlineTitle("");
    setInlineDesc("");
    setIsCreatingInline(false);
  };

  return (
    <section className="space-y-8" id="living-word">
      {/* Editorial Section Header & Sub-Mode Ledger Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-300 dark:border-stone-800 pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-900 dark:text-amber-400 font-semibold">
            {isFr
              ? "CANON BIBLIQUE & ARCHIVE D'ENSEIGNEMENTS"
              : "BIBLICAL CANON & PASTORAL TEACHING ARCHIVE"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
            {t("scripture.title")}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-0.5 rounded bg-[#F3EFE6] dark:bg-[#1C1917] border border-stone-300 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setSubView("canon")}
              className={`px-3.5 py-2 rounded-xs text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                subView === "canon"
                  ? "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-semibold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {isFr ? "I. Canon (66 Livres)" : "I. Bible Canon (66)"}
            </button>
            <button
              type="button"
              onClick={() => setSubView("teachings")}
              className={`px-3.5 py-2 rounded-xs text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                subView === "teachings"
                  ? "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-semibold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {isFr
                ? `II. Enseignements (${allTeachings.length})`
                : `II. Teachings (${allTeachings.length})`}
            </button>
            <button
              type="button"
              onClick={() => setSubView("playlists")}
              className={`px-3.5 py-2 rounded-xs text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                subView === "playlists"
                  ? "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-semibold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {isFr
                ? `III. Listes (${playlists.length})`
                : `III. Playlists (${playlists.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW I: 66-BOOK BIBLICAL CANON */}
      {subView === "canon" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 4 Cols: Book & Testament Index */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-lg sanctuary-card space-y-4">
              {/* Search Scripture Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("scripture.searchPlaceholder")}
                className="w-full px-3.5 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-800"
              />

              {/* Testament Filter Tabs */}
              <div className="grid grid-cols-3 border border-stone-300 dark:border-stone-800 rounded p-0.5 bg-[#F3EFE6] dark:bg-[#1C1917]">
                {(
                  [
                    { id: "ALL", label: t("scripture.allBooks") },
                    { id: "OT", label: t("scripture.oldTestament") },
                    { id: "NT", label: t("scripture.newTestament") },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTestamentFilter(item.id)}
                    className={`py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-xs transition-colors cursor-pointer truncate px-1 ${
                      testamentFilter === item.id
                        ? "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-semibold"
                        : "text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Scrollable 66 Books Directory */}
              <div className="max-h-[460px] overflow-y-auto divide-y divide-stone-200 dark:divide-stone-800 border-t border-stone-200 dark:border-stone-800">
                {filteredBooks.map((book) => {
                  const isSelected = book.id === selectedBook.id;
                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => {
                        stopSpeech();
                        setSelectedBookId(book.id);
                        setSelectedChapterNum(1);
                      }}
                      className={`w-full py-2.5 px-3 text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-900/10 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-semibold"
                          : "hover:bg-stone-100 dark:hover:bg-stone-900/50 text-stone-800 dark:text-stone-200"
                      }`}
                    >
                      <span className="font-serif text-sm truncate">
                        {isFr ? book.name.fr : book.name.en}
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 tabular-nums shrink-0">
                        {book.totalChapters} ch
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 8 Cols: Active Chapter Reader & Regional Voice Narration */}
          <div className="lg:col-span-8 space-y-6">
            {searchQuery.trim() ? (
              <div className="p-6 rounded-lg sanctuary-card space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                  <h3 className="font-serif font-bold text-lg">
                    {isFr ? "Résultats de recherche" : "Search Results"} (
                    {searchResults.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
                  >
                    {isFr ? "Effacer" : "Clear"}
                  </button>
                </div>
                {searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded border border-stone-200 dark:border-stone-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-amber-900 dark:text-amber-400 font-semibold">
                        {isFr ? res.book.name.fr : res.book.name.en}{" "}
                        {res.chapter}:{res.verse.verse}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBookId(res.book.id);
                          setSelectedChapterNum(res.chapter);
                          setSearchQuery("");
                        }}
                        className="text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-stone-900 dark:text-stone-400 cursor-pointer"
                      >
                        {isFr ? "Ouvrir Chapitre →" : "Open Chapter →"}
                      </button>
                    </div>
                    <p className="font-serif text-sm text-stone-800 dark:text-stone-200">
                      {isFr ? res.verse.fr : res.verse.en}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-lg sanctuary-card space-y-6">
                {/* Chapter Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      {isFr ? selectedBook.category.fr : selectedBook.category.en}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                      {isFr ? selectedBook.name.fr : selectedBook.name.en}{" "}
                      {selectedChapterNum}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <HumanVoiceSelector
                      selectedProfile={selectedVoiceProfile}
                      onSelectProfile={(profile) => {
                        setSelectedVoiceProfile(profile);
                        stopSpeech();
                      }}
                      compact
                    />

                    <button
                      type="button"
                      onClick={speakChapterAloud}
                      className={`px-3.5 py-2 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                        speakingVerse !== null
                          ? "bg-amber-800 text-white"
                          : "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900"
                      }`}
                    >
                      {speakingVerse !== null
                        ? t("scripture.stopReading")
                        : t("scripture.listenAloud")}
                    </button>

                    {onOpenVoicePractice && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenVoicePractice(
                            selectedBook.id,
                            selectedChapterNum
                          )
                        }
                        className="px-3.5 py-2 rounded border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-mono uppercase tracking-wider font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        {t("scripture.speakVerse")}
                      </button>
                    )}

                    {onMarkChapterRead && (
                      <button
                        type="button"
                        onClick={() =>
                          onMarkChapterRead(selectedBook.id, selectedChapterNum)
                        }
                        className={`px-3.5 py-2 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                          isChapterDone
                            ? "bg-emerald-800 text-white"
                            : "border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {isChapterDone
                          ? t("scripture.completed")
                          : t("scripture.markCompleted")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Chapter Number Selector Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                  {Array.from(
                    { length: Math.min(selectedBook.totalChapters, 50) },
                    (_, i) => i + 1
                  ).map((chNum) => (
                    <button
                      key={chNum}
                      type="button"
                      onClick={() => {
                        stopSpeech();
                        setSelectedChapterNum(chNum);
                      }}
                      className={`w-8 h-8 rounded text-xs font-mono tabular-nums shrink-0 transition-colors cursor-pointer ${
                        selectedChapterNum === chNum
                          ? "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-bold"
                          : "border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400"
                      }`}
                    >
                      {chNum}
                    </button>
                  ))}
                </div>

                {/* Verses Ledger */}
                <div className="space-y-4">
                  {chapterContent.verses.map((v) => {
                    const text = isFr ? v.fr : v.en;
                    const note = isFr ? v.meditation.fr : v.meditation.en;
                    const active = speakingVerse === v.verse;

                    return (
                      <div
                        key={v.verse}
                        className={`p-4 rounded border transition-colors ${
                          active
                            ? "bg-amber-900/10 border-amber-800 dark:border-amber-500"
                            : "bg-[#FAF8F5] dark:bg-[#141210] border-stone-200 dark:border-stone-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-serif text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-relaxed">
                            <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-400 mr-2 tabular-nums">
                              {v.verse}
                            </span>
                            {text}
                          </p>
                          <button
                            type="button"
                            onClick={() => speakSingleVerse(v.verse, text)}
                            className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-300 shrink-0 cursor-pointer"
                          >
                            {active
                              ? isFr
                                ? "Arrêt"
                                : "Stop"
                              : isFr
                              ? "Voix"
                              : "Listen"}
                          </button>
                        </div>

                        {note && (
                          <p className="mt-2 pt-2 border-t border-stone-200/70 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 italic font-serif">
                            {note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW II: PASTORAL TEACHINGS */}
      {subView === "teachings" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`px-3.5 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    category === item.id
                      ? "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-semibold"
                      : "border border-stone-300 dark:border-stone-800 text-stone-600 dark:text-stone-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Link
              href="/teachers"
              className="text-xs font-mono uppercase tracking-wider text-amber-900 dark:text-amber-400 hover:underline"
            >
              {isFr
                ? "Portail des Enseignants & Analytique →"
                : "Teachers Portal & Analytics →"}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleTeachings.map((teaching) => {
              const title = isFr ? teaching.titleFr : teaching.title;
              const excerpt = isFr ? teaching.excerptFr : teaching.excerpt;
              const categoryLabel = isFr
                ? teaching.categoryFr
                : teaching.category;
              const scripture = isFr
                ? teaching.scriptureFr
                : teaching.scripture;
              const duration = isFr ? teaching.durationFr : teaching.duration;
              const isCurrent =
                currentTrack?.slug === teaching.slug && isPlaying;

              return (
                <article
                  key={teaching.slug}
                  className="p-6 rounded-lg sanctuary-card flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Image
                          src={teaching.portrait}
                          alt={teaching.teacher}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover border border-stone-300 dark:border-stone-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {teaching.teacher}
                          </p>
                          <p className="text-[11px] font-mono text-stone-500">
                            {categoryLabel}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-stone-500 tabular-nums">
                        {duration}
                      </span>
                    </div>

                    <p className="font-mono text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-400 font-semibold">
                      {scripture}
                    </p>

                    <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                      <Link
                        href={`/living-word/${teaching.slug}`}
                        className="hover:underline"
                      >
                        {title}
                      </Link>
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                      {excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentTrack?.slug === teaching.slug) {
                          togglePlay();
                        } else {
                          playTeaching(teaching);
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-amber-800 text-white"
                          : "bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900"
                      }`}
                    >
                      {isCurrent
                        ? isFr
                          ? "En écoute"
                          : "Playing"
                        : isFr
                        ? "Écouter"
                        : "Listen"}
                    </button>

                    <Link
                      href={`/living-word/${teaching.slug}`}
                      className="py-2 px-3 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      {isFr ? "Étudier" : "Study"}
                    </Link>

                    <button
                      type="button"
                      onClick={() => setActiveModalTeaching(teaching)}
                      title={
                        isFr ? "Ajouter à une liste" : "Save to playlist"
                      }
                      className="py-2 px-2.5 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW III: PLAYLISTS */}
      {subView === "playlists" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-lg bg-[#F3EFE6] dark:bg-[#1C1917] border border-stone-300 dark:border-stone-800">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                {isFr
                  ? "Listes d'écoute dévotionnelles"
                  : "Curated Devotional Playlists"}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                {isFr
                  ? "Rassemblez vos enseignements préférés pour une écoute continue."
                  : "Collect your favorite teachings for continuous morning or evening study."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingInline(!isCreatingInline)}
              className="px-4 py-2 rounded bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer"
            >
              {isFr ? "+ Créer une liste" : "+ New Playlist"}
            </button>
          </div>

          {isCreatingInline && (
            <form
              onSubmit={handleCreatePlaylist}
              className="p-5 rounded-lg sanctuary-card space-y-4 max-w-lg"
            >
              <input
                type="text"
                required
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                placeholder={
                  isFr ? "Titre de la liste..." : "Playlist title..."
                }
                className="w-full px-3.5 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-sm"
              />
              <input
                type="text"
                value={inlineDesc}
                onChange={(e) => setInlineDesc(e.target.value)}
                placeholder={isFr ? "Description..." : "Short description..."}
                className="w-full px-3.5 py-2 rounded bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-700 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(false)}
                  className="px-3 py-1.5 text-xs font-mono uppercase text-stone-500 cursor-pointer"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-800 text-white text-xs font-mono uppercase font-semibold cursor-pointer"
                >
                  {isFr ? "Créer" : "Create"}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="p-5 rounded-lg sanctuary-card flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5">
                    <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                      {playlist.title}
                    </h4>
                    {!playlist.isDefault && (
                      <button
                        type="button"
                        onClick={() => deletePlaylist(playlist.id)}
                        className="text-xs font-mono text-stone-400 hover:text-red-600 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {playlist.description}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    {playlist.items && playlist.items.length > 0 ? (
                      playlist.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs py-1 border-b border-stone-100 dark:border-stone-800/60"
                        >
                          <span className="truncate text-stone-800 dark:text-stone-200">
                            {idx + 1}. {item.teachingTitle}
                          </span>
                          <span className="font-mono text-[11px] text-stone-500 tabular-nums ml-2">
                            {item.duration}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-stone-500">
                        {isFr
                          ? "Aucun enseignement."
                          : "No teachings added yet."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setPlayingPlaylist(playlist)}
                    disabled={!playlist.items || playlist.items.length === 0}
                    className="flex-1 py-2 px-3 rounded bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-mono uppercase tracking-wider font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    {isFr ? "Écouter Tout" : "Play All"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPlaylistDetail(
                        selectedPlaylistDetail?.id === playlist.id
                          ? null
                          : playlist
                      )
                    }
                    className="py-2 px-3 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    {selectedPlaylistDetail?.id === playlist.id
                      ? "×"
                      : isFr
                      ? "Gérer"
                      : "Manage"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeModalTeaching && (
        <PlaylistModal
          teaching={activeModalTeaching}
          isOpen={Boolean(activeModalTeaching)}
          onClose={() => setActiveModalTeaching(null)}
        />
      )}

      {playingPlaylist && (
        <PlaylistPlayer
          playlist={playingPlaylist}
          onClose={() => setPlayingPlaylist(null)}
          onRemoveItem={removeFromPlaylist}
        />
      )}
    </section>
  );
}
