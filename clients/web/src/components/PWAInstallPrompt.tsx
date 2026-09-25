"use client";

import React, { useState } from "react";
import { usePWAInstall, useOnlineStatus } from "@/lib/usePWAInstall";
import { useLanguage } from "@/lib/i18n";

export const PWAInstallButton: React.FC = () => {
  const { isFr } = useLanguage();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isOfflineCacheReady,
    cachedTracksCount,
    install,
    refreshOfflineDevotionalCache,
  } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [cacheRefreshed, setCacheRefreshed] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        id="pwa-install-sanctuary-btn"
        onClick={handleInstallClick}
        className="min-h-[40px] px-3.5 py-2 rounded-full bg-[#2A2146] hover:bg-[#1E1733] dark:bg-[#1FB6B0] dark:hover:bg-[#199E99] text-white dark:text-[#071F1E] text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        title={
          isFr
            ? "Installer LifeBook sur l'écran d'accueil (Mode Avion & Hors-Ligne)"
            : "Install Morning Sanctuary App (Full-Screen & Airplane Mode Ready)"
        }
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>
          {isFr ? "Installer le Sanctuaire" : "Install Morning Sanctuary"}
        </span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#18132B] border border-[#2D2542]/15 dark:border-white/15 p-6 shadow-2xl text-[#1E1931] dark:text-white">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#2D2542]/10 dark:border-white/10">
              <div>
                <p className="text-xs font-mono text-[#1FB6B0] font-semibold">
                  {isFr
                    ? "APPLICATION MATINALE HORS-LIGNE (PWA)"
                    : "OFFLINE-FIRST MORNING SANCTUARY (PWA)"}
                </p>
                <h3
                  id="pwa-install-modal-title"
                  className="text-xl font-serif font-bold mt-0.5"
                >
                  {isFr
                    ? "Installer LifeBook sur votre écran d'accueil"
                    : "Install LifeBook on Your Home Screen"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="min-h-[36px] min-w-[36px] rounded-xl bg-[#F2ECE1] dark:bg-white/10 text-xs font-bold flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                {isFr
                  ? "Lancez directement votre Tableau de Bord du Sanctuaire (/dashboard) en plein écran dès le réveil — sans passer par la page d'accueil marketing, même en Mode Avion."
                  : "Launches directly into your Daily Sanctuary Dashboard (/dashboard) full-screen like a native app—bypassing the marketing page even in Airplane Mode."}
              </p>

              {/* Offline Devotional Cache Status */}
              <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-[#221B3A] border border-[#2D2542]/10 dark:border-white/10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>
                      {isFr
                        ? "Cache Biblique Hors-Ligne Prêt"
                        : "Offline Devotional Cache Active"}
                    </span>
                  </p>
                  <p className="text-[11px] font-mono tabular-nums text-[#5A506B] dark:text-[#C8C2D6] mt-0.5">
                    {isOfflineCacheReady
                      ? isFr
                        ? `${cachedTracksCount}/7 parcours bibliques & Journal prêts en Mode Avion`
                        : `${cachedTracksCount}/7 Scripture tracks & Soul Journal cached for Airplane Mode`
                      : isFr
                      ? "Préparation du cache hors-ligne..."
                      : "Preparing offline devotional cache..."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await refreshOfflineDevotionalCache();
                    setCacheRefreshed(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#2A2146] dark:bg-[#1FB6B0] text-white dark:text-[#071F1E] text-[11px] font-bold cursor-pointer shrink-0"
                >
                  {cacheRefreshed
                    ? isFr
                      ? "Vérifié ✓"
                      : "Verified ✓"
                    : isFr
                    ? "Actualiser"
                    : "Refresh Cache"}
                </button>
              </div>

              {/* Platform-Specific Instructions */}
              <div className="p-4 rounded-2xl bg-[#F7F5F0] dark:bg-white/5 border border-[#2D2542]/10 dark:border-white/10 space-y-2 text-xs">
                <p className="font-bold text-[#1E1931] dark:text-white">
                  {isIOS
                    ? isFr
                      ? "📱 Sur iPhone / iPad (Safari) :"
                      : "📱 On iPhone / iPad (Safari):"
                    : isFr
                    ? "📲 Installation rapide (iOS, Android & Bureau) :"
                    : "📲 Quick Home Screen Setup (iOS, Android & Desktop):"}
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[#5A506B] dark:text-[#C8C2D6]">
                  <li>
                    {isFr ? (
                      <>
                        Sur <strong>iOS Safari</strong> : appuyez sur le bouton{" "}
                        <strong>Partager</strong> puis sur{" "}
                        <strong>Sur l&apos;écran d&apos;accueil</strong>.
                      </>
                    ) : (
                      <>
                        On <strong>iOS Safari</strong>: tap the{" "}
                        <strong>Share</strong> icon in the toolbar, then tap{" "}
                        <strong>Add to Home Screen</strong>.
                      </>
                    )}
                  </li>
                  <li>
                    {isFr ? (
                      <>
                        Sur <strong>Chrome / Android / Desktop</strong> : cliquez
                        sur l&apos;icône <strong>Installer LifeBook</strong> dans la
                        barre d&apos;adresse du navigateur.
                      </>
                    ) : (
                      <>
                        On <strong>Chrome / Android / Desktop</strong>: click the{" "}
                        <strong>Install LifeBook</strong> icon in your browser
                        address bar.
                      </>
                    )}
                  </li>
                </ol>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {isInstallable && (
                  <button
                    type="button"
                    onClick={install}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#1FB6B0] text-[#071F1E] text-xs font-bold cursor-pointer"
                  >
                    {isFr ? "Installer Maintenant" : "Trigger Browser Install"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#2A2146] text-white text-xs font-bold cursor-pointer"
                >
                  {isFr ? "Compris" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isFr } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed top-16 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-[#1E1931] shadow-lg"
    >
      <span className="h-2 w-2 rounded-full bg-[#1E1931] animate-pulse" />
      <span>
        {isFr
          ? "Mode Avion / Hors-Ligne — Méditation de 5 min & Journal disponibles localement."
          : "Offline Sanctuary Mode — Daily Scripture tracks, 5-min ritual & journal active."}
      </span>
    </div>
  );
};
