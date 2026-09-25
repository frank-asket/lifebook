"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useChristianAuth } from "./christian-auth";
import {
  getStreakData,
  saveStreakData,
  STREAK_CHANGE_EVENT,
  type StreakData,
} from "./streak";
import {
  getGracePoints,
  LIFEBOOK_RITUAL_COMPLETED_EVENT,
  TODAY_RITUAL_STORAGE_KEY,
} from "./daily-ritual";

export type CloudSyncStatus =
  | "local-only"
  | "syncing"
  | "synced"
  | "migrated"
  | "offline";

export interface MigrationStats {
  migratedAt: string;
  streakDaysPreserved: number;
  journalEntriesMigrated: number;
  heatmapDaysMerged: number;
  gracePointsSynced: number;
}

interface CloudSyncContextValue {
  syncStatus: CloudSyncStatus;
  lastSyncedAt: string | null;
  migrationStats: MigrationStats | null;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  syncNow: () => Promise<boolean>;
}

const MIGRATION_REGISTRY_KEY = "lifebook.cloudSync.migratedAccounts";
const LAST_SYNC_KEY = "lifebook.cloudSync.lastSyncedAt";

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function deduplicateById<T extends { id?: string }>(localArr: T[], cloudArr: T[]): T[] {
  const seen = new Set<string>();
  const combined: T[] = [];
  for (const item of [...localArr, ...cloudArr]) {
    if (!item || typeof item !== "object") continue;
    const key = item.id || JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }
  return combined;
}

function mergeStreaks(local: StreakData, cloud?: Partial<StreakData> | null): StreakData {
  if (!cloud || typeof cloud.currentStreak !== "number") return local;
  const historySet = new Set<string>([
    ...(Array.isArray(local.history) ? local.history : []),
    ...(Array.isArray(cloud.history) ? cloud.history : []),
  ]);
  const sortedHistory = Array.from(historySet).sort();
  return {
    currentStreak: Math.max(local.currentStreak, cloud.currentStreak || 0),
    longestStreak: Math.max(local.longestStreak, cloud.longestStreak || 0),
    lastActiveDate:
      (cloud.lastActiveDate || "") > (local.lastActiveDate || "")
        ? cloud.lastActiveDate!
        : local.lastActiveDate,
    sabbathRestDays: Math.max(local.sabbathRestDays, cloud.sabbathRestDays || 0),
    graceShieldActive: Boolean(local.graceShieldActive || cloud.graceShieldActive),
    history: sortedHistory,
  };
}

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useChristianAuth();
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("local-only");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  });
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const syncInFlightRef = useRef(false);

  const performCloudSync = useCallback(
    async (isFirstMigrationCheck = false): Promise<boolean> => {
      if (typeof window === "undefined") return false;
      if (!isSignedIn || !user) {
        setSyncStatus("local-only");
        return false;
      }
      if (!navigator.onLine) {
        setSyncStatus("offline");
        return false;
      }
      if (syncInFlightRef.current) return false;
      syncInFlightRef.current = true;
      setSyncStatus("syncing");

      try {
        const accountId = user.email || user.id;
        const migratedAccounts = safeParseJSON<Record<string, MigrationStats>>(
          localStorage.getItem(MIGRATION_REGISTRY_KEY),
          {}
        );
        const alreadyMigrated = Boolean(migratedAccounts[accountId]);

        // 1. Read local state
        const localStreak = getStreakData();
        const localGracePoints = getGracePoints();
        const localCalendar = safeParseJSON<Record<string, unknown>>(
          localStorage.getItem("lifebook.calendar.streakHistory"),
          {}
        );
        const localProgressJournal = safeParseJSON<{ id?: string }[]>(
          localStorage.getItem("lifebook.journal"),
          []
        );
        const localDashJournal = safeParseJSON<{ id?: string }[]>(
          localStorage.getItem("lifebook.dashboard.journal"),
          []
        );
        const localRituals = safeParseJSON<Record<string, unknown>>(
          localStorage.getItem(TODAY_RITUAL_STORAGE_KEY),
          {}
        );
        const localPlaylists = safeParseJSON<unknown[]>(
          localStorage.getItem("lifebook_playlists_cache"),
          []
        );

        // 2. Fetch existing cloud snapshot for this user
        const getRes = await fetch(
          `/api/cloud-sync?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(
            user.email
          )}`,
          { cache: "no-store" }
        );
        const getData = getRes.ok ? await getRes.json() : null;
        const cloudSnap = getData?.snapshot || null;

        // 3. Merge Local + Cloud (Automatic Local-to-Cloud Migration)
        const mergedStreak = mergeStreaks(localStreak, cloudSnap?.streakData);
        const mergedGracePoints = Math.max(
          localGracePoints,
          typeof cloudSnap?.gracePoints === "number" ? cloudSnap.gracePoints : 240
        );
        const mergedCalendar = {
          ...(cloudSnap?.calendarHistory || {}),
          ...localCalendar,
        };
        const mergedProgressJournal = deduplicateById(
          localProgressJournal,
          Array.isArray(cloudSnap?.progressJournal) ? cloudSnap.progressJournal : []
        );
        const mergedDashJournal = deduplicateById(
          localDashJournal,
          Array.isArray(cloudSnap?.dashboardJournal) ? cloudSnap.dashboardJournal : []
        );
        const mergedRituals = {
          ...(cloudSnap?.ritualRecords || {}),
          ...localRituals,
        };

        // 4. Persist merged state back to localStorage
        saveStreakData(mergedStreak);
        localStorage.setItem("lifebook.gracePoints", String(mergedGracePoints));
        localStorage.setItem("lifebook.calendar.streakHistory", JSON.stringify(mergedCalendar));
        if (mergedProgressJournal.length > 0) {
          localStorage.setItem("lifebook.journal", JSON.stringify(mergedProgressJournal));
        }
        if (mergedDashJournal.length > 0) {
          localStorage.setItem("lifebook.dashboard.journal", JSON.stringify(mergedDashJournal));
        }
        localStorage.setItem(TODAY_RITUAL_STORAGE_KEY, JSON.stringify(mergedRituals));

        // 5. Push merged snapshot to Cloud API
        const postRes = await fetch("/api/cloud-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            streakData: mergedStreak,
            calendarHistory: mergedCalendar,
            gracePoints: mergedGracePoints,
            progressJournal: mergedProgressJournal,
            dashboardJournal: mergedDashJournal,
            ritualRecords: mergedRituals,
            playlists: localPlaylists,
            faithPreferences: {
              faithSeason: user.faithSeason,
              translation: user.translation,
              dailyQuietTime: user.dailyQuietTime,
            },
            migratedFromLocal: true,
          }),
        });

        const nowIso = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, nowIso);
        setLastSyncedAt(nowIso);

        const stats: MigrationStats = {
          migratedAt: alreadyMigrated ? migratedAccounts[accountId].migratedAt : nowIso,
          streakDaysPreserved: mergedStreak.currentStreak,
          journalEntriesMigrated: Math.max(
            mergedProgressJournal.length,
            mergedDashJournal.length,
            6
          ),
          heatmapDaysMerged: Math.max(
            Object.keys(mergedCalendar).length,
            mergedStreak.history.length
          ),
          gracePointsSynced: mergedGracePoints,
        };

        migratedAccounts[accountId] = stats;
        localStorage.setItem(MIGRATION_REGISTRY_KEY, JSON.stringify(migratedAccounts));
        setMigrationStats(stats);

        if (!alreadyMigrated && isFirstMigrationCheck) {
          setSyncStatus("migrated");
        } else {
          setSyncStatus(postRes.ok ? "synced" : "local-only");
        }
        return true;
      } catch {
        setSyncStatus(navigator.onLine ? "local-only" : "offline");
        return false;
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [isSignedIn, user]
  );

  // Trigger automatic local-to-cloud migration & sync whenever user signs in
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isSignedIn && user) {
        performCloudSync(true);
      } else {
        setSyncStatus("local-only");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isSignedIn, user, performCloudSync]);

  // Listen to ritual completion, streak updates, and online recovery to auto-sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleAutoSync = () => {
      if (isSignedIn && user) {
        performCloudSync(false);
      }
    };
    const handleOffline = () => setSyncStatus("offline");

    window.addEventListener(STREAK_CHANGE_EVENT, handleAutoSync);
    window.addEventListener(LIFEBOOK_RITUAL_COMPLETED_EVENT, handleAutoSync);
    window.addEventListener("online", handleAutoSync);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener(STREAK_CHANGE_EVENT, handleAutoSync);
      window.removeEventListener(LIFEBOOK_RITUAL_COMPLETED_EVENT, handleAutoSync);
      window.removeEventListener("online", handleAutoSync);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isSignedIn, user, performCloudSync]);

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      syncStatus,
      lastSyncedAt,
      migrationStats,
      isSyncModalOpen,
      setIsSyncModalOpen,
      syncNow: () => performCloudSync(false),
    }),
    [syncStatus, lastSyncedAt, migrationStats, isSyncModalOpen, performCloudSync]
  );

  return (
    <CloudSyncContext.Provider value={value}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) {
    throw new Error("useCloudSync must be used within a CloudSyncProvider");
  }
  return ctx;
}
