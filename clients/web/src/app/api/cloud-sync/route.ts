import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export interface CloudSanctuarySnapshot {
  userId: string;
  email: string;
  fullName?: string;
  streakData?: Record<string, unknown>;
  calendarHistory?: Record<string, unknown>;
  gracePoints?: number;
  progressJournal?: unknown[];
  dashboardJournal?: unknown[];
  ritualRecords?: Record<string, unknown>;
  playlists?: unknown[];
  faithPreferences?: Record<string, unknown>;
  migratedFromLocal?: boolean;
  updatedAt: string;
}

const API_URL = process.env.LIFEBOOK_API_URL || "http://127.0.0.1:8787";
const FALLBACK_FILE = path.join("/tmp", "lifebook_cloud_sync_store.json");

const memoryStore: Record<string, CloudSanctuarySnapshot> = {};

function readLocalServerStore(): Record<string, CloudSanctuarySnapshot> {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...memoryStore, ...parsed };
    }
  } catch {
    // fallback to in-memory
  }
  return { ...memoryStore };
}

function writeLocalServerStore(store: Record<string, CloudSanctuarySnapshot>) {
  Object.assign(memoryStore, store);
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // ignore read-only fs errors
  }
}

function getAccountKey(userId?: string | null, email?: string | null): string {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (cleanEmail && cleanEmail.includes("@")) {
    return `acct_${cleanEmail}`;
  }
  return userId?.trim() || "acct_anonymous";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");
  const key = getAccountKey(userId, email);

  // 1. Try FastAPI upstream first
  try {
    const res = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/sync?accountKey=${encodeURIComponent(key)}`,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.snapshot) {
        return NextResponse.json({
          ok: true,
          accountKey: key,
          snapshot: data.snapshot,
          source: "fastapi-cloud",
        });
      }
    }
  } catch {
    // Fallback to Next.js server store
  }

  const store = readLocalServerStore();
  const snapshot = store[key] || null;

  return NextResponse.json({
    ok: true,
    accountKey: key,
    snapshot,
    source: "nextjs-cloud",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CloudSanctuarySnapshot> & {
      userId?: string;
      email?: string;
    };

    const key = getAccountKey(body.userId, body.email);
    const store = readLocalServerStore();
    const existing = store[key];

    const merged: CloudSanctuarySnapshot = {
      userId: body.userId || existing?.userId || key,
      email: (body.email || existing?.email || "").toLowerCase(),
      fullName: body.fullName || existing?.fullName || "Pilgrim",
      streakData: body.streakData ?? existing?.streakData,
      calendarHistory: {
        ...(existing?.calendarHistory || {}),
        ...(body.calendarHistory || {}),
      },
      gracePoints: Math.max(
        typeof body.gracePoints === "number" ? body.gracePoints : 0,
        typeof existing?.gracePoints === "number" ? existing.gracePoints : 240
      ),
      progressJournal: Array.isArray(body.progressJournal)
        ? body.progressJournal
        : existing?.progressJournal || [],
      dashboardJournal: Array.isArray(body.dashboardJournal)
        ? body.dashboardJournal
        : existing?.dashboardJournal || [],
      ritualRecords: {
        ...(existing?.ritualRecords || {}),
        ...(body.ritualRecords || {}),
      },
      playlists: Array.isArray(body.playlists)
        ? body.playlists
        : existing?.playlists || [],
      faithPreferences: {
        ...(existing?.faithPreferences || {}),
        ...(body.faithPreferences || {}),
      },
      migratedFromLocal: Boolean(body.migratedFromLocal || existing?.migratedFromLocal),
      updatedAt: new Date().toISOString(),
    };

    store[key] = merged;
    writeLocalServerStore(store);

    // Mirror to FastAPI backend if running
    try {
      await fetch(`${API_URL.replace(/\/$/, "")}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountKey: key, snapshot: merged }),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      // Next.js store already persisted the snapshot
    }

    return NextResponse.json({
      ok: true,
      accountKey: key,
      snapshot: merged,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to sync sanctuary data",
      },
      { status: 400 }
    );
  }
}
