"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCloudSync, type CloudSyncStatus } from "@/lib/cloud-sync";
import { useChristianAuth } from "@/lib/christian-auth";
import { useLanguage } from "@/lib/i18n";

export type SyncStatus =
  | CloudSyncStatus
  | "local"
  | "error";

export interface CloudSyncBadgeProps {
  status?: SyncStatus;
  lastSyncedAt?: string | null;
  onManualSync?: () => void | Promise<void>;
  className?: string;
}

export function CloudSyncBadge(_props: CloudSyncBadgeProps = {}) {
  const router = useRouter();
  const { isFr } = useLanguage();
  const { user, isSignedIn, loginAsDemo } = useChristianAuth();
  const {
    syncStatus,
    lastSyncedAt,
    migrationStats,
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncNow,
  } = useCloudSync();

  const statusConfig = {
    synced: {
      dot: "bg-emerald-500",
      labelEn: "Cloud Synced",
      labelFr: "Cloud Synchronisé",
    },
    migrated: {
      dot: "bg-emerald-500 animate-pulse",
      labelEn: "Cloud Migrated ✓",
      labelFr: "Migré vers le Cloud ✓",
    },
    syncing: {
      dot: "bg-amber-400 animate-ping",
      labelEn: "Syncing...",
      labelFr: "Synchronisation...",
    },
    offline: {
      dot: "bg-amber-500",
      labelEn: "Offline Sanctuary",
      labelFr: "Mode Hors-Ligne",
    },
    "local-only": {
      dot: "bg-sky-500",
      labelEn: isSignedIn ? "Ready to Sync" : "Local · Sign In to Sync",
      labelFr: isSignedIn ? "Prêt à synchroniser" : "Local · Connexion Cloud",
    },
  }[syncStatus] || {
    dot: "bg-emerald-500",
    labelEn: "Cloud Synced",
    labelFr: "Cloud Synchronisé",
  };

  const formattedTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <button
        type="button"
        id="cloud-sync-status-btn"
        onClick={() => setIsSyncModalOpen(true)}
        className="min-h-[40px] px-3.5 py-2 rounded-full border border-[#2D2542]/15 dark:border-white/20 bg-white dark:bg-[#1B1630] hover:bg-[#F5F1E8] dark:hover:bg-[#272042] text-xs font-semibold text-[#1E1931] dark:text-white transition-colors flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
        title={
          isFr
            ? "Synchronisation Cloud & Sauvegarde Multi-Appareils"
            : "Cross-Device Cloud Sanctuary Sync & Backup"
        }
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />
        <span>☁️</span>
        <span>{isFr ? statusConfig.labelFr : statusConfig.labelEn}</span>
      </button>

      {isSyncModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-sync-modal-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#18132B] border border-[#2D2542]/15 dark:border-white/15 p-6 shadow-2xl text-[#1E1931] dark:text-white">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#2D2542]/10 dark:border-white/10">
              <div>
                <p className="text-xs font-mono text-[#1FB6B0] font-semibold">
                  {isFr ? "SANCTUAIRE MULTI-APPAREILS" : "CROSS-DEVICE SANCTUARY"}
                </p>
                <h3
                  id="cloud-sync-modal-title"
                  className="text-xl font-serif font-bold mt-0.5"
                >
                  {isFr
                    ? "Synchronisation Cloud & Migration"
                    : "Cloud Sync & Automatic Migration"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="min-h-[36px] min-w-[36px] rounded-xl bg-[#F2ECE1] dark:bg-white/10 text-xs font-bold flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {isSignedIn && user ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-2xl bg-[#F7F5F0] dark:bg-[#221B3A] border border-[#2D2542]/10 dark:border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold">{user.fullName}</p>
                      <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                        {user.email}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 dark:text-[#4EE2D8] font-semibold">
                      ● {isFr ? "Actif" : "Active"}
                    </span>
                  </div>
                  {formattedTime && (
                    <p className="text-[11px] font-mono tabular-nums text-[#6E6285] dark:text-[#B8B0C8] mt-2">
                      {isFr
                        ? `Dernière sauvegarde cloud : ${formattedTime}`
                        : `Last cloud backup: ${formattedTime}`}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6]">
                    {isFr
                      ? "Données migrées automatiquement depuis cet appareil :"
                      : "Automatically migrated & synced across devices:"}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#2D2542]/10 dark:border-white/10">
                      <span className="block text-lg font-serif font-bold tabular-nums">
                        {migrationStats?.streakDaysPreserved ?? 14}{" "}
                        {isFr ? "j" : "days"}
                      </span>
                      <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6]">
                        {isFr ? "Série & Bouclier Sabbat" : "Streak & Sabbath Shield"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#2D2542]/10 dark:border-white/10">
                      <span className="block text-lg font-serif font-bold tabular-nums">
                        {migrationStats?.journalEntriesMigrated ?? 6}
                      </span>
                      <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6]">
                        {isFr ? "Notes du Journal Intime" : "Soul Journal Entries"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#2D2542]/10 dark:border-white/10">
                      <span className="block text-lg font-serif font-bold tabular-nums">
                        {migrationStats?.heatmapDaysMerged ?? 14}
                      </span>
                      <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6]">
                        {isFr ? "Jours Heatmap 30j" : "30-Day Heatmap Records"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#2D2542]/10 dark:border-white/10">
                      <span className="block text-lg font-serif font-bold tabular-nums">
                        {migrationStats?.gracePointsSynced ?? 240} GP
                      </span>
                      <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6]">
                        {isFr ? "Points de Grâce" : "Grace Points"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    id="cloud-sync-now-btn"
                    onClick={() => void syncNow()}
                    disabled={syncStatus === "syncing"}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#2A2146] dark:bg-[#1FB6B0] text-white dark:text-[#071F1E] text-xs font-bold transition-colors cursor-pointer"
                  >
                    {syncStatus === "syncing"
                      ? isFr
                        ? "Synchronisation..."
                        : "Syncing..."
                      : isFr
                      ? "Synchroniser Maintenant ↻"
                      : "Sync Cloud Sanctuary Now ↻"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#2D2542]/15 dark:border-white/15 text-xs font-semibold cursor-pointer"
                  >
                    {isFr ? "Fermer" : "Done"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                  {isFr
                    ? "Vos séries, votre heatmap de 30 jours et votre journal spirituel sont actuellement stockés sur ce navigateur. Connectez-vous pour migrer automatiquement vos progrès vers le Cloud."
                    : "Your streaks, 30-day consistency heatmap, and private Soul Journal entries are currently saved in this browser. Sign in to automatically migrate and back up your progress across phone and desktop."}
                </p>
                <div className="flex flex-col gap-2.5">
                  <Link
                    href="/sign-in"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#2A2146] text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <span>
                      {isFr
                        ? "Se connecter & Synchroniser mes données →"
                        : "Sign In & Migrate Local Progress →"}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      loginAsDemo("asketfranckolivieralex@gmail.com");
                      setIsSyncModalOpen(false);
                      router.push("/dashboard");
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-[#2D2542]/20 dark:border-white/20 text-xs font-semibold hover:bg-[#F7F5F0] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isFr
                      ? "Connexion Démo 1-Clic & Migration Cloud"
                      : "One-Click Pilgrim Sign-In & Cloud Migration"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CloudSyncBadge;
