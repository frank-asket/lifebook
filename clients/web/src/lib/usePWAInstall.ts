"use client";

import { useEffect, useState, useCallback } from "react";
import { RITUAL_TRACKS } from "./daily-ritual";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const OFFLINE_CACHE_KEY = "lifebook.offline.devotionalCache";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  });
  const [isOfflineCacheReady, setIsOfflineCacheReady] = useState(true);
  const [cachedTracksCount, setCachedTracksCount] = useState<number>(
    Object.keys(RITUAL_TRACKS).length
  );

  const refreshOfflineDevotionalCache = useCallback(async () => {
    if (typeof window === "undefined") return false;
    try {
      const payload = {
        cachedAt: new Date().toISOString(),
        trackCount: Object.keys(RITUAL_TRACKS).length,
        tracks: RITUAL_TRACKS,
      };
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(payload));
      setCachedTracksCount(payload.trackCount);
      setIsOfflineCacheReady(true);

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.active) {
          reg.active.postMessage({
            type: "CACHE_DEVOTIONAL_TRACKS",
            tracks: RITUAL_TRACKS,
          });
        }
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker and warm offline devotional cache
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg.active) {
            reg.active.postMessage({
              type: "CACHE_DEVOTIONAL_TRACKS",
              tracks: RITUAL_TRACKS,
            });
          }
          setIsOfflineCacheReady(true);
        })
        .catch(() => {
          setIsOfflineCacheReady(true);
        });
    }

    try {
      const payload = {
        cachedAt: new Date().toISOString(),
        trackCount: Object.keys(RITUAL_TRACKS).length,
        tracks: RITUAL_TRACKS,
      };
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOfflineCacheReady,
    cachedTracksCount,
    install,
    refreshOfflineDevotionalCache,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
