"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import {
  getAllTeachings,
  CATALOG_CHANGE_EVENT,
  type Teaching,
} from "./livingWordData";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";
import { usePlaylists, type Playlist } from "@/lib/usePlaylists";
import { PlaylistModal } from "@/components/PlaylistModal";
import { PlaylistPlayer } from "@/components/PlaylistPlayer";
import {
  Headphones,
  Pause,
  Play,
  BookOpenText,
  Plus,
  X,
  ArrowUpRight,
  UsersThree,
} from "@phosphor-icons/react";

export default function LivingWord() {
  const { isFr, t } = useLanguage();
  const { playTeaching, currentTrack, isPlaying, togglePlay } =
    useSanctuaryAudio();

  const [teachings, setTeachings] = useState<Teaching[]>(() =>
    getAllTeachings()
  );
  const [viewMode, setViewMode] = useState<"teachings" | "playlists">(
    "teachings"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const refresh = () => setTeachings(getAllTeachings());
    window.addEventListener(CATALOG_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const { playlists, deletePlaylist, removeFromPlaylist, createPlaylist } =
    usePlaylists();

  const [modalTeaching, setModalTeaching] = useState<Teaching | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [expandedPlaylist, setExpandedPlaylist] = useState<Playlist | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("🎧");

  const filteredTeachings =
    selectedCategory === "All"
      ? teachings
      : teachings.filter((item) => item.category === selectedCategory);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      await createPlaylist(newTitle.trim(), newDesc.trim(), newIcon);
      setNewTitle("");
      setNewDesc("");
      setShowCreateForm(false);
    }
  };

  return (
    <section className="living-word-section" id="living-word">
      <div className="page-shell">
        <div className="living-word-heading">
          <div>
            <p className="showcase-eyebrow">{t("audio_eyebrow")}</p>
            <h2>{t("audio_heading")}</h2>
          </div>
          <div>
            <p>{t("audio_desc")}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-[#3F3750] dark:text-[#D5CEE6] list-disc pl-4">
              <li>
                <strong>{t("audio_point1_bold")}</strong> {t("audio_point1_text")}
              </li>
              <li>
                <strong>{t("audio_point2_bold")}</strong> {t("audio_point2_text")}
              </li>
              <li>
                <strong>{t("audio_point3_bold")}</strong> {t("audio_point3_text")}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-3 border-b border-[#E3DEED] dark:border-white/15">
          <div className="flex items-center gap-2 p-1 bg-[#ECE7F6] dark:bg-[#1E1836] rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("teachings")}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "teachings"
                  ? "bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-sm"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#2D2542] dark:hover:text-white"
              }`}
            >
              {isFr ? "Tous les enseignements" : "All Teachings"} (
              {teachings.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("playlists")}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === "playlists"
                  ? "bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-sm"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#2D2542] dark:hover:text-white"
              }`}
            >
              <span>
                {isFr ? "Mes listes de lecture" : "My Playlists"} (
                {playlists.length})
              </span>
            </button>
            <Link
              href="/teachers"
              className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#2D2542] dark:hover:text-white"
            >
              <UsersThree size={15} weight="duotone" />
              <span>
                {isFr ? "Portail des Pasteurs" : "Teachers Portal"}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/teachers"
              className="inline-flex items-center gap-1 font-semibold text-[#5B4894] dark:text-[#4EE2D8] hover:text-[#2d2542] dark:hover:text-white transition-colors"
            >
              <span>
                {isFr
                  ? "Pasteurs Contributeurs & Ajout"
                  : "Pastors Portal & Add Teaching"}{" "}
                →
              </span>
            </Link>
            <span className="hidden sm:inline text-[#4E4462] dark:text-[#C8C2D6]">
              {t("audio_curated")}
            </span>
          </div>
        </div>

        {viewMode === "teachings" ? (
          <>
            <div className="living-word-toolbar">
              <div
                className="living-word-tabs"
                role="tablist"
                aria-label={
                  isFr ? "Catégories d'enseignements" : "Teaching categories"
                }
              >
                {[
                  { id: "All", label: isFr ? "Tous" : "All" },
                  { id: "Faith", label: isFr ? "Foi" : "Faith" },
                  { id: "Prayer", label: isFr ? "Prière" : "Prayer" },
                  { id: "Hope", label: isFr ? "Espérance" : "Hope" },
                  {
                    id: "Discipleship",
                    label: isFr ? "Vie chrétienne" : "Discipleship",
                  },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat.id}
                    className={
                      selectedCategory === cat.id ? "active-word-tab" : ""
                    }
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="living-word-grid">
              {filteredTeachings.map((item) => {
                const title = isFr ? item.titleFr : item.title;
                const excerpt = isFr ? item.excerptFr : item.excerpt;
                const category = isFr ? item.categoryFr : item.category;
                const scripture = isFr ? item.scriptureFr : item.scripture;
                const duration = isFr ? item.durationFr : item.duration;

                return (
                  <article
                    key={item.title}
                    className={`word-card ${item.color}`}
                  >
                    <Link
                      className="word-card-link"
                      href={`/living-word/${item.slug}`}
                      aria-label={`${isFr ? "Ouvrir" : "Open"} ${title}`}
                    >
                      <div className="word-card-top">
                        <Image
                          className="word-card-portrait"
                          src={item.portrait}
                          alt={item.teacher}
                          width={48}
                          height={48}
                        />
                        <span>{duration}</span>
                      </div>
                      <p className="word-card-category">
                        {category} · {scripture}
                      </p>
                      <h3>{title}</h3>
                      <p className="word-card-teacher">{item.teacher}</p>
                      <p className="word-card-excerpt">{excerpt}</p>
                    </Link>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentTrack?.slug === item.slug) {
                            togglePlay();
                          } else {
                            playTeaching(item);
                          }
                        }}
                        className="listen-button flex-1 text-center justify-center cursor-pointer"
                      >
                        <span>
                          {currentTrack?.slug === item.slug && isPlaying ? (
                            <Pause size={15} weight="fill" />
                          ) : (
                            <Headphones size={15} weight="duotone" />
                          )}
                        </span>
                        <span>
                          {currentTrack?.slug === item.slug && isPlaying
                            ? isFr
                              ? "En écoute"
                              : "Playing"
                            : isFr
                            ? "Écouter"
                            : "Listen"}
                        </span>
                      </button>

                      <Link
                        href={`/living-word/${item.slug}`}
                        className="min-h-[40px] px-3.5 py-2 rounded-full border border-[#D5CBE4] dark:border-white/25 bg-white/90 dark:bg-[#1B1630] hover:bg-white dark:hover:bg-[#272042] text-xs font-semibold text-[#3D2E5C] dark:text-white transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                      >
                        <BookOpenText size={14} weight="duotone" />
                        <span>{t("audio_read_study")}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setModalTeaching(item)}
                        title={
                          isFr
                            ? "Enregistrer dans une liste"
                            : "Save to playlist"
                        }
                        className="min-h-[40px] px-3 py-2 rounded-full border border-[#D5CBE4] dark:border-white/25 bg-white/90 dark:bg-[#1B1630] hover:bg-white dark:hover:bg-[#272042] text-xs font-semibold text-[#3D2E5C] dark:text-white transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus size={14} weight="bold" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#F4F1F9] to-[#EBE5F5] dark:from-[#1B1630] dark:to-[#141024] border border-[#DDD6EA] dark:border-white/15">
              <div>
                <h3 className="text-base font-bold text-[#2D2542] dark:text-white">
                  {isFr
                    ? "Listes d'écoute personnalisées"
                    : "Curated Devotional Playlists"}
                </h3>
                <p className="text-xs text-[#4E4462] dark:text-[#C8C2D6] mt-0.5">
                  {isFr
                    ? "Rassemblez vos enseignements préférés pour une écoute continue le matin ou le soir."
                    : "Collect your favorite teachings for continuous morning meditation or quiet evening study."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#3D2E5C] hover:bg-[#4E3B75] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>+</span>
                <span>{isFr ? "Créer une liste" : "New Playlist"}</span>
              </button>
            </div>

            {showCreateForm && (
              <form
                onSubmit={handleCreatePlaylist}
                className="p-5 rounded-2xl bg-white dark:bg-[#18142B] border border-[#DDD6EA] dark:border-white/15 shadow-sm space-y-4 max-w-lg"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#2D2542] dark:text-white">
                    {isFr ? "Nouvelle liste de lecture" : "Create New Playlist"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[#6E628A] dark:text-[#C8C2D6] hover:text-[#2D2542] dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4E4462] dark:text-[#C8C2D6] mb-1">
                    {isFr ? "Titre de la liste" : "Playlist Title"}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={
                      isFr ? "Ex: Calme & Repos" : "E.g. Peace & Stillness"
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#D5CBE4] dark:border-white/20 bg-white dark:bg-[#120E22] text-[#2D2542] dark:text-white focus:outline-none focus:border-[#7F67B5]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4E4462] dark:text-[#C8C2D6] mb-1">
                    {isFr ? "Description facultative" : "Optional Description"}
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={
                      isFr
                        ? "À propos de cette sélection..."
                        : "What this playlist is for..."
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CBE4] dark:border-white/20 bg-white dark:bg-[#120E22] text-[#2D2542] dark:text-white focus:outline-none focus:border-[#7F67B5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4E4462] dark:text-[#C8C2D6] mb-1">
                    {isFr ? "Icône" : "Icon"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["🎧", "⏳", "🕊️", "🌱", "📖", "✝️", "🙏", "🕯️"].map(
                      (icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewIcon(icon)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm border transition-all cursor-pointer ${
                            newIcon === icon
                              ? "bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-[#3D2E5C] dark:border-[#4EE2D8]"
                              : "bg-white dark:bg-[#120E22] border-[#D5CBE4] dark:border-white/20"
                          }`}
                        >
                          {icon}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full min-h-[40px] py-2.5 rounded-lg bg-[#3D2E5C] hover:bg-[#4E3B75] text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isFr ? "Enregistrer la liste" : "Create Playlist"}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="bg-white dark:bg-[#18142B] rounded-2xl border border-[#E3DEED] dark:border-white/15 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div
                    className={`p-5 bg-gradient-to-br ${
                      pl.color || "from-[#5D4E7B] to-[#3B2D54]"
                    } text-white relative`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
                        <Headphones size={22} weight="duotone" className="text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        {pl.isDefault && (
                          <span className="text-xs text-white/85 font-medium">
                            {isFr ? "Sélection LifeBook" : "Curated"}
                          </span>
                        )}
                        {!pl.isDefault && (
                          <button
                            type="button"
                            onClick={() => deletePlaylist(pl.id)}
                            title={
                              isFr ? "Supprimer la liste" : "Delete playlist"
                            }
                            className="w-9 h-9 rounded-lg bg-black/25 hover:bg-rose-600/85 text-white/90 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-bold leading-tight">
                      {pl.title}
                    </h4>
                    <p className="text-xs text-white/85 mt-1 line-clamp-2">
                      {pl.description ||
                        (isFr
                          ? "Sélection personnalisée"
                          : "Personal collection")}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-white/85 font-mono">
                      <span>
                        {pl.itemCount} {isFr ? "titres" : "tracks"}
                      </span>
                      <span>·</span>
                      <span>{pl.totalDuration || "0 min"}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between bg-[#FAF8FC] dark:bg-[#141024]">
                    <div className="space-y-2 mb-4">
                      {pl.items && pl.items.length > 0 ? (
                        pl.items.slice(0, 3).map((track, idx) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-[#EFEBF4] dark:border-white/10 last:border-0"
                          >
                            <span className="truncate font-medium text-[#2D2542] dark:text-[#FDFCFB]">
                              {idx + 1}. {track.teachingTitle}
                            </span>
                            <span className="text-xs text-[#6E628A] dark:text-[#B8B0C8] flex-shrink-0 ml-2">
                              {track.duration}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#6E628A] dark:text-[#B8B0C8] italic py-2">
                          {isFr
                            ? "Aucun enseignement pour l'instant."
                            : "No teachings added yet."}
                        </p>
                      )}
                      {pl.items && pl.items.length > 3 && (
                        <p className="text-xs text-[#5B4894] dark:text-[#4EE2D8] font-semibold pt-1">
                          +{pl.items.length - 3}{" "}
                          {isFr ? "autres enseignements" : "more teachings"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#EFEBF4] dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setActivePlaylist(pl)}
                        disabled={!pl.items || pl.items.length === 0}
                        className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-[#3D2E5C] hover:bg-[#4E3B75] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <Play size={13} weight="fill" />
                        <span>
                          {isFr ? "Écouter en continu" : "Play All"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlaylist(
                            expandedPlaylist?.id === pl.id ? null : pl
                          )
                        }
                        className="min-h-[40px] py-2 px-3.5 rounded-xl border border-[#D5CBE4] dark:border-white/20 hover:border-[#8E7BBF] text-[#483769] dark:text-[#E2DCEF] text-xs font-semibold hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                      >
                        {expandedPlaylist?.id === pl.id ? (
                          <X size={14} weight="bold" />
                        ) : isFr ? (
                          "Détails"
                        ) : (
                          "Manage"
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedPlaylist?.id === pl.id && (
                    <div className="p-4 bg-white dark:bg-[#18142B] border-t border-[#DDD6EA] dark:border-white/15 space-y-2 animate-fade-in">
                      <h5 className="text-xs font-bold text-[#2D2542] dark:text-white uppercase tracking-wider mb-2">
                        {isFr
                          ? "Tous les enseignements de la liste"
                          : "All Teachings in Playlist"}
                      </h5>
                      {pl.items && pl.items.length > 0 ? (
                        pl.items.map((track, idx) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F6FB] dark:bg-[#120E22] text-xs"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-semibold text-[#2D2542] dark:text-white truncate">
                                {idx + 1}. {track.teachingTitle}
                              </p>
                              <p className="text-xs text-[#5E5279] dark:text-[#C8C2D6] mt-0.5">
                                {track.teacher} · {track.duration}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/living-word/${track.teachingSlug}`}
                                className="text-xs font-semibold text-[#5B4894] dark:text-[#4EE2D8] hover:underline"
                              >
                                {isFr ? "Ouvrir ↗" : "Open ↗"}
                              </Link>
                              {!pl.isDefault && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromPlaylist(
                                      pl.id,
                                      track.teachingSlug
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:text-rose-700 text-xs"
                                  title={isFr ? "Retirer" : "Remove"}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#6E628A] dark:text-[#C8C2D6] italic">
                          {isFr
                            ? "Utilisez le bouton ➕ sur un enseignement pour l'ajouter."
                            : "Use the ➕ button on any teaching to add it."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {modalTeaching && (
          <PlaylistModal
            teaching={modalTeaching}
            isOpen={!!modalTeaching}
            onClose={() => setModalTeaching(null)}
          />
        )}

        {activePlaylist && (
          <PlaylistPlayer
            playlist={activePlaylist}
            onClose={() => setActivePlaylist(null)}
            onRemoveItem={removeFromPlaylist}
          />
        )}
      </div>
    </section>
  );
}
