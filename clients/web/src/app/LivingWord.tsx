"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllTeachings, CATALOG_CHANGE_EVENT, type Teaching } from "./livingWordData";
import { useLanguage } from "@/lib/i18n";
import { usePlaylists, type Playlist } from "@/lib/usePlaylists";
import { PlaylistModal } from "@/components/PlaylistModal";
import { PlaylistPlayer } from "@/components/PlaylistPlayer";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";

export default function LivingWord() {
  const { isFr, t } = useLanguage();
  const { playTeaching, currentTrack, isPlaying, togglePlay } = useSanctuaryAudio();
  const [allTeachings, setAllTeachings] = useState<Teaching[]>(() => getAllTeachings());
  const [mainTab, setMainTab] = useState<"teachings" | "playlists">("teachings");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const sync = () => setAllTeachings(getAllTeachings());
    window.addEventListener(CATALOG_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Playlist management states
  const { playlists, deletePlaylist, removeFromPlaylist, createPlaylist } = usePlaylists();
  const [activeModalTeaching, setActiveModalTeaching] = useState<Teaching | null>(null);
  const [playingPlaylist, setPlayingPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylistDetail, setSelectedPlaylistDetail] = useState<Playlist | null>(null);

  // New playlist form in playlists tab
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineDesc, setInlineDesc] = useState("");
  const [inlineIcon, setInlineIcon] = useState("🎧");

  const categories = [
    { id: "All", label: isFr ? "Tous" : "All" },
    { id: "Faith", label: isFr ? "Foi" : "Faith" },
    { id: "Prayer", label: isFr ? "Prière" : "Prayer" },
    { id: "Hope", label: isFr ? "Espérance" : "Hope" },
    { id: "Discipleship", label: isFr ? "Vie chrétienne" : "Discipleship" },
  ];

  const visibleTeachings = category === "All" ? allTeachings : allTeachings.filter((teaching) => teaching.category === category);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    await createPlaylist(inlineTitle.trim(), inlineDesc.trim(), inlineIcon);
    setInlineTitle("");
    setInlineDesc("");
    setIsCreatingInline(false);
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
              <li><strong>{t("audio_point1_bold")}</strong> {t("audio_point1_text")}</li>
              <li><strong>{t("audio_point2_bold")}</strong> {t("audio_point2_text")}</li>
              <li><strong>{t("audio_point3_bold")}</strong> {t("audio_point3_text")}</li>
            </ul>
          </div>
        </div>

        {/* Main Tab Navigation: Teachings vs Playlists */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-3 border-b border-[#E3DEED] dark:border-white/15">
          <div className="flex items-center gap-2 p-1 bg-[#ECE7F6] dark:bg-[#1E1836] rounded-xl">
            <button
              type="button"
              onClick={() => setMainTab("teachings")}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mainTab === "teachings"
                  ? "bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-sm"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#2D2542] dark:hover:text-white"
              }`}
            >
              {isFr ? "Tous les enseignements" : "All Teachings"} ({allTeachings.length})
            </button>
            <button
              type="button"
              onClick={() => setMainTab("playlists")}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                mainTab === "playlists"
                  ? "bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-sm"
                  : "text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#2D2542] dark:hover:text-white"
              }`}
            >
              <span>{isFr ? "Mes listes de lecture" : "My Playlists"} ({playlists.length})</span>
            </button>
            <Link
              href="/teachers"
              className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-[#4E4462] dark:text-[#C8C2D6] hover:text-[#2D2542] dark:hover:text-white"
            >
              <span>✝</span>
              <span>{isFr ? "Portail des Pasteurs" : "Teachers Portal"}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/teachers"
              className="inline-flex items-center gap-1 font-semibold text-[#5B4894] dark:text-[#4EE2D8] hover:text-[#2d2542] dark:hover:text-white transition-colors"
            >
              <span>{isFr ? "Pasteurs Contributeurs & Ajout" : "Pastors Portal & Add Teaching"} →</span>
            </Link>
            <span className="hidden sm:inline text-[#4E4462] dark:text-[#C8C2D6]">{t("audio_curated")}</span>
          </div>
        </div>

        {mainTab === "teachings" ? (
          <>
            {/* Category Toolbar */}
            <div className="living-word-toolbar">
              <div className="living-word-tabs" role="tablist" aria-label={isFr ? "Catégories d'enseignements" : "Teaching categories"}>
                {categories.map((item) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={category === item.id}
                    className={category === item.id ? "active-word-tab" : ""}
                    onClick={() => setCategory(item.id)}
                    key={item.id}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Teachings Grid */}
            <div className="living-word-grid">
              {visibleTeachings.map((teaching) => {
                const title = isFr ? teaching.titleFr : teaching.title;
                const excerpt = isFr ? teaching.excerptFr : teaching.excerpt;
                const categoryLabel = isFr ? teaching.categoryFr : teaching.category;
                const scripture = isFr ? teaching.scriptureFr : teaching.scripture;
                const duration = isFr ? teaching.durationFr : teaching.duration;

                return (
                  <article className={`word-card ${teaching.color}`} key={teaching.title}>
                    <Link className="word-card-link" href={`/living-word/${teaching.slug}`} aria-label={`${isFr ? "Ouvrir" : "Open"} ${title}`}>
                      <div className="word-card-top">
                        <Image className="word-card-portrait" src={teaching.portrait} alt={teaching.teacher} width={48} height={48} />
                        <span>{duration}</span>
                      </div>
                      <p className="word-card-category">{categoryLabel} · {scripture}</p>
                      <h3>{title}</h3>
                      <p className="word-card-teacher">{teaching.teacher}</p>
                      <p className="word-card-excerpt">{excerpt}</p>
                    </Link>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentTrack?.slug === teaching.slug) {
                            togglePlay();
                          } else {
                            playTeaching(teaching);
                          }
                        }}
                        className="listen-button flex-1 text-center justify-center cursor-pointer"
                      >
                        <span>{currentTrack?.slug === teaching.slug && isPlaying ? "⏸" : "🎧"}</span>
                        <span>
                          {currentTrack?.slug === teaching.slug && isPlaying
                            ? isFr
                              ? "En écoute"
                              : "Playing"
                            : isFr
                            ? "Écouter"
                            : "Listen"}
                        </span>
                      </button>
                      <Link href={`/living-word/${teaching.slug}`} className="min-h-[40px] px-3.5 py-2 rounded-full border border-[#D5CBE4] dark:border-white/25 bg-white/90 dark:bg-[#1B1630] hover:bg-white dark:hover:bg-[#272042] text-xs font-semibold text-[#3D2E5C] dark:text-white transition-all flex items-center gap-1 shadow-xs whitespace-nowrap">
                        <span>📖</span>
                        <span>{t("audio_read_study")}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setActiveModalTeaching(teaching)}
                        title={isFr ? "Enregistrer dans une liste" : "Save to playlist"}
                        className="min-h-[40px] px-3 py-2 rounded-full border border-[#D5CBE4] dark:border-white/25 bg-white/90 dark:bg-[#1B1630] hover:bg-white dark:hover:bg-[#272042] text-xs font-semibold text-[#3D2E5C] dark:text-white transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>➕</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          /* Playlists View */
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#F4F1F9] to-[#EBE5F5] dark:from-[#1B1630] dark:to-[#141024] border border-[#DDD6EA] dark:border-white/15">
              <div>
                <h3 className="text-base font-bold text-[#2D2542] dark:text-white">
                  {isFr ? "Listes d'écoute personnalisées" : "Curated Devotional Playlists"}
                </h3>
                <p className="text-xs text-[#4E4462] dark:text-[#C8C2D6] mt-0.5">
                  {isFr
                    ? "Rassemblez vos enseignements préférés pour une écoute continue le matin ou le soir."
                    : "Collect your favorite teachings for continuous morning meditation or quiet evening study."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingInline(!isCreatingInline)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#3D2E5C] hover:bg-[#4E3B75] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>+</span>
                <span>{isFr ? "Créer une liste" : "New Playlist"}</span>
              </button>
            </div>

            {/* Inline creation form */}
            {isCreatingInline && (
              <form onSubmit={handleCreatePlaylist} className="p-5 rounded-2xl bg-white dark:bg-[#18142B] border border-[#DDD6EA] dark:border-white/15 shadow-sm space-y-4 max-w-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#2D2542] dark:text-white">
                    {isFr ? "Nouvelle liste de lecture" : "Create New Playlist"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreatingInline(false)}
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
                    value={inlineTitle}
                    onChange={(e) => setInlineTitle(e.target.value)}
                    placeholder={isFr ? "Ex: Calme & Repos" : "E.g. Peace & Stillness"}
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
                    value={inlineDesc}
                    onChange={(e) => setInlineDesc(e.target.value)}
                    placeholder={isFr ? "À propos de cette sélection..." : "What this playlist is for..."}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CBE4] dark:border-white/20 bg-white dark:bg-[#120E22] text-[#2D2542] dark:text-white focus:outline-none focus:border-[#7F67B5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4E4462] dark:text-[#C8C2D6] mb-1">
                    {isFr ? "Icône" : "Icon"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["🎧", "⏳", "🕊️", "🌱", "📖", "✝️", "🙏", "🕯️"].map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setInlineIcon(ic)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm border transition-all cursor-pointer ${
                          inlineIcon === ic ? "bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-[#3D2E5C] dark:border-[#4EE2D8]" : "bg-white dark:bg-[#120E22] border-[#D5CBE4] dark:border-white/20"
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inlineTitle.trim()}
                  className="w-full min-h-[40px] py-2.5 rounded-lg bg-[#3D2E5C] hover:bg-[#4E3B75] text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isFr ? "Enregistrer la liste" : "Create Playlist"}
                </button>
              </form>
            )}

            {/* Playlists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-white dark:bg-[#18142B] rounded-2xl border border-[#E3DEED] dark:border-white/15 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Playlist Header Banner */}
                  <div className={`p-5 bg-gradient-to-br ${playlist.color || "from-[#5D4E7B] to-[#3B2D54]"} text-white relative`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
                        {playlist.icon || "🎧"}
                      </div>
                      <div className="flex items-center gap-2">
                        {playlist.isDefault && (
                          <span className="text-xs text-white/85 font-medium">
                            {isFr ? "Sélection LifeBook" : "Curated"}
                          </span>
                        )}
                        {!playlist.isDefault && (
                          <button
                            type="button"
                            onClick={() => deletePlaylist(playlist.id)}
                            title={isFr ? "Supprimer la liste" : "Delete playlist"}
                            className="w-9 h-9 rounded-lg bg-black/25 hover:bg-rose-600/85 text-white/90 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-base font-bold leading-tight">{playlist.title}</h4>
                    <p className="text-xs text-white/85 mt-1 line-clamp-2">
                      {playlist.description || (isFr ? "Sélection personnalisée" : "Personal collection")}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-white/85 font-mono">
                      <span>{playlist.itemCount} {isFr ? "titres" : "tracks"}</span>
                      <span>·</span>
                      <span>{playlist.totalDuration || "0 min"}</span>
                    </div>
                  </div>

                  {/* Playlist Preview List */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-[#FAF8FC] dark:bg-[#141024]">
                    <div className="space-y-2 mb-4">
                      {playlist.items && playlist.items.length > 0 ? (
                        playlist.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-[#EFEBF4] dark:border-white/10 last:border-0"
                          >
                            <span className="truncate font-medium text-[#2D2542] dark:text-[#FDFCFB]">
                              {idx + 1}. {item.teachingTitle}
                            </span>
                            <span className="text-xs text-[#6E628A] dark:text-[#B8B0C8] flex-shrink-0 ml-2">
                              {item.duration}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#6E628A] dark:text-[#B8B0C8] italic py-2">
                          {isFr ? "Aucun enseignement pour l'instant." : "No teachings added yet."}
                        </p>
                      )}
                      {playlist.items && playlist.items.length > 3 && (
                        <p className="text-xs text-[#5B4894] dark:text-[#4EE2D8] font-semibold pt-1">
                          +{playlist.items.length - 3} {isFr ? "autres enseignements" : "more teachings"}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#EFEBF4] dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setPlayingPlaylist(playlist)}
                        disabled={!playlist.items || playlist.items.length === 0}
                        className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-[#3D2E5C] hover:bg-[#4E3B75] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <span>▶</span>
                        <span>{isFr ? "Écouter en continu" : "Play All"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlaylistDetail(selectedPlaylistDetail?.id === playlist.id ? null : playlist)}
                        className="min-h-[40px] py-2 px-3.5 rounded-xl border border-[#D5CBE4] dark:border-white/20 hover:border-[#8E7BBF] text-[#483769] dark:text-[#E2DCEF] text-xs font-semibold hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {selectedPlaylistDetail?.id === playlist.id ? "✕" : (isFr ? "Détails" : "Manage")}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail drawer if clicked */}
                  {selectedPlaylistDetail?.id === playlist.id && (
                    <div className="p-4 bg-white dark:bg-[#18142B] border-t border-[#DDD6EA] dark:border-white/15 space-y-2 animate-fade-in">
                      <h5 className="text-xs font-bold text-[#2D2542] dark:text-white uppercase tracking-wider mb-2">
                        {isFr ? "Tous les enseignements de la liste" : "All Teachings in Playlist"}
                      </h5>
                      {playlist.items && playlist.items.length > 0 ? (
                        playlist.items.map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F6FB] dark:bg-[#120E22] text-xs">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-semibold text-[#2D2542] dark:text-white truncate">{idx + 1}. {item.teachingTitle}</p>
                              <p className="text-xs text-[#5E5279] dark:text-[#C8C2D6] mt-0.5">{item.teacher} · {item.duration}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/living-word/${item.teachingSlug}`}
                                className="text-xs font-semibold text-[#5B4894] dark:text-[#4EE2D8] hover:underline"
                              >
                                {isFr ? "Ouvrir ↗" : "Open ↗"}
                              </Link>
                              {!playlist.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => removeFromPlaylist(playlist.id, item.teachingSlug)}
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
                          {isFr ? "Utilisez le bouton ➕ sur un enseignement pour l'ajouter." : "Use the ➕ button on any teaching to add it."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save to Playlist Modal */}
        {activeModalTeaching && (
          <PlaylistModal
            teaching={activeModalTeaching}
            isOpen={Boolean(activeModalTeaching)}
            onClose={() => setActiveModalTeaching(null)}
          />
        )}

        {/* Continuous Playlist Audio Player */}
        {playingPlaylist && (
          <PlaylistPlayer
            playlist={playingPlaylist}
            onClose={() => setPlayingPlaylist(null)}
            onRemoveItem={removeFromPlaylist}
          />
        )}
      </div>
    </section>
  );
}

