"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n";

export type SyncStatus = "synced" | "syncing" | "local";

interface CloudSyncBadgeProps {
  status?: SyncStatus;
  lastSyncedAt?: string | null;
  onManualSync?: () => void;
}

export function CloudSyncBadge({
  status = "synced",
  lastSyncedAt,
  onManualSync,
}: CloudSyncBadgeProps = {}) {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const formatTime = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(isFr ? "fr-FR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (status === "syncing") {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 border-l border-stone-300 dark:border-stone-700 text-amber-800 dark:text-amber-400 text-[11px] font-mono uppercase tracking-wider">
        <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 animate-pulse" />
        <span>{isFr ? "Synchronisation..." : "Syncing Archive..."}</span>
      </div>
    );
  }

  if (status === "synced") {
    const timeStr = formatTime(lastSyncedAt);
    return (
      <button
        type="button"
        onClick={onManualSync}
        title={
          isFr
            ? "Sauvegardé dans le Cloud Sanctuaire. Cliquez pour synchroniser."
            : "Backed up to Sanctuary Cloud. Click to refresh sync."
        }
        className="inline-flex items-center gap-2 px-2.5 py-1 border-l border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-[11px] font-mono uppercase tracking-wider hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
      >
        <span className="w-1.5 h-1.5 bg-emerald-700 dark:bg-emerald-500" />
        <span>
          {isFr ? "Archive Sync" : "Cloud Synced"}
          {timeStr ? ` · ${timeStr}` : ""}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onManualSync}
      title={
        isFr
          ? "Sauvegardé localement sur cet appareil"
          : "Saved locally on this device"
      }
      className="inline-flex items-center gap-2 px-2.5 py-1 border-l border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-[11px] font-mono uppercase tracking-wider hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
    >
      <span className="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-600" />
      <span>{isFr ? "Mémoire Locale" : "Local Ledger"}</span>
    </button>
  );
}

export default CloudSyncBadge;
