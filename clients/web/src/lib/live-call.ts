"use client";

import type {
  ActiveTeacherLiveCall,
  LiveCallParticipant,
  MidCallInvitation,
} from "@/app/api/live-call/route";

export type { ActiveTeacherLiveCall, LiveCallParticipant, MidCallInvitation };

export const MAX_LIVE_CALL_USERS = 40;
export const LIVE_CALL_STORAGE_KEY = "lifebook.teacher.livecall.v1";
export const LIVE_CALL_ROLE_KEY = "lifebook.user.callrole.v1";
export const LIVE_CALL_EVENT = "lifebook-live-call-updated";
export const WALKTHROUGH_COMPLETED_KEY = "lifebook.walkthrough.completed.v1";
export const WALKTHROUGH_PENDING_NEW_USER_KEY = "lifebook.walkthrough.pending_new_user.v1";
export const WALKTHROUGH_OPEN_EVENT = "lifebook-open-walkthrough";

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel("lifebook_live_call_channel");
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "LIVE_CALL_SYNC" && event.data.call !== undefined) {
        try {
          localStorage.setItem(LIVE_CALL_STORAGE_KEY, JSON.stringify(event.data.call));
        } catch {}
        window.dispatchEvent(new CustomEvent(LIVE_CALL_EVENT, { detail: event.data.call }));
      }
    };
  } catch {
    // ignore BroadcastChannel errors in restricted contexts
  }
}

export function broadcastLiveCallUpdate(call: ActiveTeacherLiveCall | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIVE_CALL_STORAGE_KEY, JSON.stringify(call));
  } catch {}
  try {
    broadcastChannel?.postMessage({ type: "LIVE_CALL_SYNC", call });
  } catch {}
  window.dispatchEvent(new CustomEvent(LIVE_CALL_EVENT, { detail: call }));
}

export async function fetchActiveLiveCall(): Promise<ActiveTeacherLiveCall | null> {
  try {
    const res = await fetch("/api/live-call", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.call) {
        broadcastLiveCallUpdate(data.call);
        return data.call;
      }
    }
  } catch {
    // fallback to localStorage cache
  }
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LIVE_CALL_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ActiveTeacherLiveCall;
    } catch {}
  }
  return null;
}

export async function startTeacherLiveCall(params: {
  actorRole: "teacher" | "pilgrim";
  hostTeacherSlug: string;
  hostTeacherName: string;
  hostTeacherTitle: string;
  hostTeacherPortrait: string;
  topic: string;
  scriptureRef: string;
  scriptureText: string;
  callMode: "video-fellowship" | "audio-prayer-circle";
}): Promise<{ call?: ActiveTeacherLiveCall; error?: string }> {
  if (params.actorRole !== "teacher") {
    return {
      error: "Only appointed LifeBook Teachers can start a Live Sanctuary Call (40 users maximum).",
    };
  }

  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start-call",
        ...params,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Unable to start live call." };
    }
    broadcastLiveCallUpdate(data.call);
    return { call: data.call };
  } catch {
    return { error: "Network error while starting live call." };
  }
}

export async function joinTeacherLiveCall(params: {
  participantId: string;
  participantName: string;
  role?: "teacher" | "pilgrim";
  isMuted?: boolean;
  isVideoOn?: boolean;
}): Promise<{ call?: ActiveTeacherLiveCall; error?: string }> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join-call",
        ...params,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Unable to join live call." };
    }
    broadcastLiveCallUpdate(data.call);
    return { call: data.call };
  } catch {
    return { error: "Network error while joining live call." };
  }
}

export async function leaveTeacherLiveCall(participantId: string): Promise<ActiveTeacherLiveCall | null> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "leave-call",
        participantId,
      }),
    });
    const data = await res.json();
    broadcastLiveCallUpdate(data.call);
    return data.call;
  } catch {
    return null;
  }
}

export async function inviteParticipantMidCall(params: {
  actorRole: "teacher" | "pilgrim";
  inviteeName: string;
  inviteeEmail?: string;
  autoConnect?: boolean;
}): Promise<{ call?: ActiveTeacherLiveCall; invitation?: MidCallInvitation; error?: string }> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite-participant",
        ...params,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Unable to invite participant." };
    }
    broadcastLiveCallUpdate(data.call);
    return { call: data.call, invitation: data.invitation };
  } catch {
    return { error: "Network error while sending mid-call invitation." };
  }
}

export async function updateParticipantCallState(params: {
  participantId: string;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isHandRaised?: boolean;
}): Promise<ActiveTeacherLiveCall | null> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle-participant-state",
        ...params,
      }),
    });
    const data = await res.json();
    broadcastLiveCallUpdate(data.call);
    return data.call;
  } catch {
    return null;
  }
}

export async function simulateCallCapacity(
  actorRole: "teacher" | "pilgrim",
  targetCount: number
): Promise<{ call?: ActiveTeacherLiveCall; error?: string }> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "simulate-capacity",
        actorRole,
        targetCount,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    broadcastLiveCallUpdate(data.call);
    return { call: data.call };
  } catch {
    return { error: "Failed to simulate room capacity." };
  }
}

export async function endTeacherLiveCall(
  actorRole: "teacher" | "pilgrim"
): Promise<{ call?: ActiveTeacherLiveCall; error?: string }> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end-call",
        actorRole,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    broadcastLiveCallUpdate(data.call);
    return { call: data.call };
  } catch {
    return { error: "Failed to end live call." };
  }
}

// Walkthrough Helpers for New Users
export function markNewUserForWalkthrough() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALKTHROUGH_PENDING_NEW_USER_KEY, "1");
    localStorage.removeItem(WALKTHROUGH_COMPLETED_KEY);
    window.dispatchEvent(new Event(WALKTHROUGH_OPEN_EVENT));
  } catch {}
}

export function shouldAutoOpenWalkthrough(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const isPendingNewUser = localStorage.getItem(WALKTHROUGH_PENDING_NEW_USER_KEY) === "1";
    const isCompleted = localStorage.getItem(WALKTHROUGH_COMPLETED_KEY) === "1";
    return isPendingNewUser || !isCompleted;
  } catch {
    return false;
  }
}

export function markWalkthroughCompleted() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALKTHROUGH_COMPLETED_KEY, "1");
    localStorage.removeItem(WALKTHROUGH_PENDING_NEW_USER_KEY);
  } catch {}
}

export function triggerOpenWalkthrough() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WALKTHROUGH_OPEN_EVENT));
}
