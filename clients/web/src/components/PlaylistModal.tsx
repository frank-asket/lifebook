"use client";

import { useState } from "react";
import { usePlaylists, Playlist } from "@/lib/usePlaylists";
import type { Teaching } from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";

interface PlaylistModalProps {
  teaching: Teaching;
  isOpen: boolean;
  onClose: () => void;
}

const ICONS = ["🎧", "⏳", "🕊️", "🌱", "📖", "✝️", "🙏", "🕯️", "🌅", "💡"];
const GRADIENTS = [
  { name: "Purple Twilight", class: "from-[#5D4E7B] to-[#3B2D54]" },
  { name: "Deep Ocean", class: "from-[#3A506B] to-[#1C2541]" },
  { name: "Olive Grace", class: "from-[#436436] to-[#25391F]" },
  { name: "Warm Amber", class: "from-[#8C5E32] to-[#4A2E12]" },
  { name: "Royal Sapphire", class: "from-[#2B4C7E] to-[#162942]" },
];

export function PlaylistModal({ teaching, isOpen, onClose }: PlaylistModalProps) {
  const { isFr } = useLanguage();
  const { playlists, addToPlaylist, removeFromPlaylist, createPlaylist } = usePlaylists();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("🎧");
  const [newGradient, setNewGradient] = useState(GRADIENTS[0].class);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleToggle = async (playlist: Playlist) => {
    setSavingId(playlist.id);
    const isIncluded = playlist.items?.some((i) => i.teachingSlug === teaching.slug);

    if (isIncluded) {
      await removeFromPlaylist(playlist.id, teaching.slug);
      showToast(isFr ? `Retiré de "${playlist.title}"` : `Removed from "${playlist.title}"`);
    } else {
      await addToPlaylist(playlist.id, teaching);
      showToast(isFr ? `Ajouté à "${playlist.title}"` : `Saved to "${playlist.title}"`);
    }
    setSavingId(null);
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await createPlaylist(newTitle.trim(), newDesc.trim(), newIcon, newGradient);
    if (created) {
      await addToPlaylist(created.id, teaching);
      showToast(isFr ? `Créé et ajouté à "${created.title}"` : `Created and added to "${created.title}"`);
      setIsCreating(false);
      setNewTitle("");
      setNewDesc("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#241F35] text-[#ECE7F6] rounded-2xl border border-[#443B5E] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#352E4B] bg-[#1E192D]">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#A898CE] font-semibold">
              {isFr ? "Gestion des listes de lecture" : "Playlist Management"}
            </span>
            <h3 className="text-lg font-bold text-white leading-snug">
              {isFr ? "Enregistrer l'enseignement" : "Save Teaching to Playlist"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A898CE] hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Selected Teaching Mini Card */}
        <div className="px-6 py-3 bg-[#1B1629] border-b border-[#352E4B] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-900/50 flex-shrink-0 flex items-center justify-center text-xl">
            📖
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {isFr ? teaching.titleFr : teaching.title}
            </h4>
            <p className="text-xs text-[#A898CE] truncate">
              {teaching.teacher} · {teaching.duration}
            </p>
          </div>
        </div>

        {/* Toast alert */}
        {toastMsg && (
          <div className="mx-6 mt-3 px-3 py-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs rounded-lg flex items-center gap-2">
            <span>✓</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="text-xs font-semibold text-[#8E80B4] uppercase tracking-wider mb-2">
            {isFr ? "Sélectionner une liste :" : "Select a playlist:"}
          </div>

          {playlists.map((playlist) => {
            const isIncluded = playlist.items?.some((i) => i.teachingSlug === teaching.slug);
            const isSaving = savingId === playlist.id;

            return (
              <button
                key={playlist.id}
                type="button"
                onClick={() => handleToggle(playlist)}
                disabled={isSaving}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isIncluded
                    ? "bg-[#332A4C] border-[#7F67B5] shadow-sm"
                    : "bg-[#2A233E]/60 border-[#3D3456] hover:bg-[#332B4A] hover:border-[#574B78]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                      playlist.color || "from-[#5D4E7B] to-[#3B2D54]"
                    } flex items-center justify-center text-lg shadow-inner flex-shrink-0`}
                  >
                    {playlist.icon || "🎧"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{playlist.title}</span>
                      {playlist.isDefault && (
                        <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/40">
                          {isFr ? "Défaut" : "Default"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A898CE] truncate">
                      {playlist.itemCount} {isFr ? "enseignements" : "teachings"} · {playlist.totalDuration || "0 min"}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div
                    className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs transition-colors ${
                      isIncluded
                        ? "bg-[#7F67B5] border-[#A898CE] text-white"
                        : "border-[#5E5181] bg-transparent text-transparent"
                    }`}
                  >
                    {isSaving ? "⏳" : "✓"}
                  </div>
                </div>
              </button>
            );
          })}

          {/* New Playlist Form / Toggle */}
          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full mt-2 py-3 px-4 rounded-xl border border-dashed border-[#574B78] hover:border-[#8E7BBF] hover:bg-white/5 text-sm font-medium text-[#C8BCDE] flex items-center justify-center gap-2 transition-colors"
            >
              <span>+</span>
              <span>{isFr ? "Créer une nouvelle liste" : "Create new playlist"}</span>
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="mt-4 p-4 rounded-xl bg-[#1B1629] border border-[#443B5E] space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">
                  {isFr ? "Nouvelle liste de lecture" : "New Curated Playlist"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#A898CE] hover:text-white"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder={isFr ? "Ex: Méditations du soir" : "E.g. Evening Devotionals"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#2B2340] border border-[#4B4068] text-white placeholder-[#786A99] focus:outline-none focus:border-[#8E7BBF]"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder={isFr ? "Description facultative..." : "Optional description..."}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#2B2340] border border-[#4B4068] text-white placeholder-[#786A99] focus:outline-none focus:border-[#8E7BBF]"
                />
              </div>

              {/* Icon selector */}
              <div>
                <label className="block text-[11px] text-[#A898CE] mb-1">
                  {isFr ? "Icône spirituelle" : "Spiritual Icon"}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewIcon(icon)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all ${
                        newIcon === icon
                          ? "bg-[#7F67B5] border-white scale-110"
                          : "bg-[#2B2340] border-[#4B4068] hover:bg-[#392F54]"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient Theme selector */}
              <div>
                <label className="block text-[11px] text-[#A898CE] mb-1">
                  {isFr ? "Ambiance de couleur" : "Color Theme"}
                </label>
                <div className="flex gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => setNewGradient(g.class)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${g.class} border-2 transition-transform ${
                        newGradient === g.class ? "border-white scale-110 shadow-md" : "border-transparent opacity-75"
                      }`}
                      title={g.name}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-[#7F67B5] hover:bg-[#9278CF] text-white font-semibold text-xs tracking-wide transition-colors shadow-md disabled:opacity-50"
              >
                {isFr ? "Créer et ajouter" : "Create & Save Teaching"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#352E4B] bg-[#1E192D] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition-colors"
          >
            {isFr ? "Terminé" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
