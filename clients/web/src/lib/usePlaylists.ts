"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useChristianAuth } from "./christian-auth";
import type { Teaching } from "@/app/livingWordData";

export interface PlaylistItem {
  id: string;
  playlistId: string;
  teachingSlug: string;
  teachingTitle: string;
  teacher: string;
  duration: string;
  category?: string;
  audioUrl?: string;
  portrait?: string;
  position: number;
  addedAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  itemCount: number;
  totalDuration?: string;
  items?: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_STARTER_PLAYLISTS: Playlist[] = [
  {
    id: "pl_listen_later_local",
    userId: "local",
    title: "Listen Later",
    description: "Teachings saved to listen to in your quiet morning and evening reflection.",
    icon: "⏳",
    color: "from-[#5D4E7B] to-[#3B2D54]",
    isDefault: true,
    itemCount: 1,
    totalDuration: "12 min",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "pli_seed_1_local",
        playlistId: "pl_listen_later_local",
        teachingSlug: "when-faith-feels-small",
        teachingTitle: "When faith feels small",
        teacher: "Pastor Asket",
        duration: "12 min",
        category: "Faith",
        portrait: "/AsketOfficialPic (1).png",
        position: 0,
        addedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "pl_reflections_local",
    userId: "local",
    title: "Sunday Reflections",
    description: "Deeper theological teachings for contemplation and Sabbath rest.",
    icon: "🕊️",
    color: "from-[#3A506B] to-[#1C2541]",
    isDefault: true,
    itemCount: 1,
    totalDuration: "9 min",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "pli_seed_2_local",
        playlistId: "pl_reflections_local",
        teachingSlug: "learning-to-be-still",
        teachingTitle: "Learning to be still",
        teacher: "Pastor Asket",
        duration: "9 min",
        category: "Prayer",
        portrait: "/AsketOfficialPic (1).png",
        position: 0,
        addedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "pl_faith_local",
    userId: "local",
    title: "Strengthening Faith",
    description: "Encouraging pastoral messages on steadfast faith, prayer, and trusting Christ.",
    icon: "🌱",
    color: "from-[#436436] to-[#25391F]",
    isDefault: true,
    itemCount: 0,
    totalDuration: "0 min",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  },
];

const LOCAL_STORAGE_KEY = "lifebook_playlists_cache";

export function usePlaylists() {
  const { user } = useChristianAuth();
  const { getToken, isSignedIn } = useAuth();
  const userId = user?.id || "usr_pilgrim_guest";

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return DEFAULT_STARTER_PLAYLISTS;
  });

  const [isLoading] = useState(false);

  const saveToCache = (newPlaylists: Playlist[]) => {
    setPlaylists(newPlaylists);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPlaylists));
      } catch {}
    }
  };

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      if (isSignedIn) {
        // Attempt supabase template first, fallback to default Clerk session token
        let token = await getToken({ template: "supabase" }).catch(() => null);
        if (!token) {
          token = await getToken().catch(() => null);
        }
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      }
    } catch {}
    return {};
  }, [getToken, isSignedIn]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/lifebook/livingword/playlists", {
          headers: authHeaders,
        });
        if (res.ok && !ignore) {
          const data = await res.json();
          if (Array.isArray(data.playlists) && data.playlists.length > 0) {
            saveToCache(data.playlists);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch playlists from backend:", e);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [getAuthHeaders]);

  const fetchPlaylists = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/lifebook/livingword/playlists", {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.playlists) && data.playlists.length > 0) {
          saveToCache(data.playlists);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch playlists from backend:", e);
    }
  }, [getAuthHeaders]);

  const createPlaylist = async (title: string, description?: string, icon = "🎧", color = "from-[#5D4E7B] to-[#3B2D54]"): Promise<Playlist | null> => {
    const tempId = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newPlaylist: Playlist = {
      id: tempId,
      userId,
      title: title.trim(),
      description: description?.trim() || "",
      icon,
      color,
      isDefault: false,
      itemCount: 0,
      totalDuration: "0 min",
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    const nextPlaylists = [...playlists, newPlaylist];
    saveToCache(nextPlaylists);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/lifebook/livingword/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description?.trim() || "",
          icon,
          color,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.playlist) {
          const updated = nextPlaylists.map((p) => (p.id === tempId ? data.playlist : p));
          saveToCache(updated);
          return data.playlist;
        }
      }
    } catch (e) {
      console.warn("Error creating playlist on server:", e);
    }
    return newPlaylist;
  };

  const addToPlaylist = async (playlistId: string, teaching: Teaching): Promise<boolean> => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return false;

    // Check if item already exists in playlist
    if (target.items?.some((i) => i.teachingSlug === teaching.slug)) {
      return true;
    }

    const newItem: PlaylistItem = {
      id: `pli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      playlistId,
      teachingSlug: teaching.slug,
      teachingTitle: teaching.title,
      teacher: teaching.teacher,
      duration: teaching.duration,
      category: teaching.category,
      audioUrl: teaching.audioUrl,
      portrait: teaching.portrait,
      position: (target.items || []).length,
      addedAt: new Date().toISOString(),
    };

    const updatedItems = [...(target.items || []), newItem];
    const updatedPlaylists = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          itemCount: updatedItems.length,
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveToCache(updatedPlaylists);

    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/lifebook/livingword/playlists/${encodeURIComponent(playlistId)}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          teachingSlug: teaching.slug,
          teachingTitle: teaching.title,
          teacher: teaching.teacher,
          duration: teaching.duration,
          category: teaching.category,
          audioUrl: teaching.audioUrl,
          portrait: teaching.portrait,
        }),
      });
    } catch (e) {
      console.warn("Failed to add playlist item on server:", e);
    }
    return true;
  };

  const removeFromPlaylist = async (playlistId: string, teachingSlug: string): Promise<boolean> => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return false;

    const filteredItems = (target.items || []).filter((i) => i.teachingSlug !== teachingSlug);
    const updatedPlaylists = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          itemCount: filteredItems.length,
          items: filteredItems,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveToCache(updatedPlaylists);

    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/lifebook/livingword/playlists/${encodeURIComponent(playlistId)}/items/${encodeURIComponent(teachingSlug)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
    } catch (e) {
      console.warn("Failed to remove item on server:", e);
    }
    return true;
  };

  const deletePlaylist = async (playlistId: string): Promise<boolean> => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target || target.isDefault) return false;

    const filtered = playlists.filter((p) => p.id !== playlistId);
    saveToCache(filtered);

    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/lifebook/livingword/playlists/${encodeURIComponent(playlistId)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
    } catch (e) {
      console.warn("Failed to delete playlist on server:", e);
    }
    return true;
  };

  return {
    playlists,
    isLoading,
    fetchPlaylists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
  };
}
