"use client";

import type {
  ActiveTeacherLiveCall,
  LiveCallParticipant,
  MidCallInvitation,
  OneOnOneWebRTCSession,
  WebRTCSignalCandidate,
} from "@/app/api/live-call/route";

export type {
  ActiveTeacherLiveCall,
  LiveCallParticipant,
  MidCallInvitation,
  OneOnOneWebRTCSession,
  WebRTCSignalCandidate,
};

export const MAX_LIVE_CALL_USERS = 40;
export const LIVE_CALL_STORAGE_KEY = "lifebook.teacher.livecall.v1";
export const LIVE_CALL_ROLE_KEY = "lifebook.user.callrole.v1";
export const LIVE_CALL_EVENT = "lifebook-live-call-updated";
export const WALKTHROUGH_COMPLETED_KEY = "lifebook.walkthrough.completed.v1";
export const WALKTHROUGH_PENDING_NEW_USER_KEY = "lifebook.walkthrough.pending_new_user.v1";
export const WALKTHROUGH_SEEN_USERS_KEY = "lifebook.walkthrough.seen_users.v1";
export const WALKTHROUGH_OPEN_EVENT = "lifebook-open-walkthrough";

export type MicPermissionState = "prompt" | "requesting" | "granted" | "denied" | "fallback";

export interface MicrophoneAccessResult {
  permission: MicPermissionState;
  stream: MediaStream | null;
  deviceLabel: string;
  errorReason?: string;
  isSimulatedFallback: boolean;
}

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

/**
 * Explicitly requests microphone permission using navigator.mediaDevices.getUserMedia
 * with echoCancellation, noiseSuppression, and autoGainControl enabled.
 * Handles permission denial (NotAllowedError), missing hardware (NotFoundError),
 * and provides a Web Audio synthesized fallback stream if hardware is absent in headless sandboxes.
 */
export async function requestMicrophonePermission(): Promise<MicrophoneAccessResult> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      permission: "fallback",
      stream: null,
      deviceLabel: "Server / Non-Browser Context",
      isSimulatedFallback: true,
    };
  }

  // First check Permissions API if supported
  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      if (status.state === "denied") {
        return {
          permission: "denied",
          stream: null,
          deviceLabel: "Microphone Blocked by Browser Settings",
          errorReason:
            "Microphone access is blocked in your browser address bar. Please allow microphone permissions and click Retry.",
          isSimulatedFallback: false,
        };
      }
    } catch {
      // Permissions API for microphone not supported in all browsers; proceed to getUserMedia
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return createSynthesizedFallbackAudioStream(
      "Browser mediaDevices API unavailable in this frame; using Web Audio sanctuary stream."
    );
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    const audioTrack = stream.getAudioTracks()[0];
    const label = audioTrack?.label || "Default Sanctuary Microphone (48kHz)";

    return {
      permission: "granted",
      stream,
      deviceLabel: label,
      isSimulatedFallback: false,
    };
  } catch (err: unknown) {
    const domErr = err as { name?: string; message?: string };
    const errName = domErr?.name || "";

    if (
      errName === "NotAllowedError" ||
      errName === "PermissionDeniedError" ||
      errName === "SecurityError"
    ) {
      return {
        permission: "denied",
        stream: null,
        deviceLabel: "Microphone Permission Denied",
        errorReason:
          "Microphone permission was declined. Please grant microphone access in your browser prompt or use the Sanctuary Audio Fallback to continue the session.",
        isSimulatedFallback: false,
      };
    }

    // Hardware not found in headless environment -> create real Web Audio MediaStreamDestination so WebRTC RTCPeerConnection still negotiates real RTP audio tracks
    return createSynthesizedFallbackAudioStream(
      domErr?.message || "No physical microphone detected; Web Audio stream initialized."
    );
  }
}

export function createSynthesizedFallbackAudioStream(reason?: string): MicrophoneAccessResult {
  if (typeof window === "undefined") {
    return {
      permission: "fallback",
      stream: null,
      deviceLabel: "Sanctuary Audio Stream",
      errorReason: reason,
      isSimulatedFallback: true,
    };
  }

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const dest = ctx.createMediaStreamDestination();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 220;
    gain.gain.value = 0.002; // Whisper-quiet warm carrier so WebRTC RTP audio track is active
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    return {
      permission: "fallback",
      stream: dest.stream,
      deviceLabel: "Sanctuary Virtual Microphone (Web Audio RTP)",
      errorReason: reason,
      isSimulatedFallback: true,
    };
  } catch {
    return {
      permission: "fallback",
      stream: null,
      deviceLabel: "Sanctuary Virtual Microphone",
      errorReason: reason,
      isSimulatedFallback: true,
    };
  }
}

/**
 * Creates a real WebRTC RTCPeerConnection pair (Caller + Callee responder) and performs
 * a complete SDP Offer / SDP Answer + ICE Candidate negotiation over the provided MediaStream.
 */
export async function negotiateRealWebRTCAudioConnection(params: {
  localStream: MediaStream | null;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceCandidate?: (candidate: WebRTCSignalCandidate) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}): Promise<{
  callerPc: RTCPeerConnection | null;
  calleePc: RTCPeerConnection | null;
  sdpOffer?: { type: "offer"; sdp: string };
  sdpAnswer?: { type: "answer"; sdp: string };
  iceCandidates: WebRTCSignalCandidate[];
  cleanup: () => void;
}> {
  if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") {
    return {
      callerPc: null,
      calleePc: null,
      iceCandidates: [],
      cleanup: () => {},
    };
  }

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const callerPc = new RTCPeerConnection(rtcConfig);
  const calleePc = new RTCPeerConnection(rtcConfig);
  const collectedCandidates: WebRTCSignalCandidate[] = [];

  callerPc.onconnectionstatechange = () => {
    params.onConnectionStateChange?.(callerPc.connectionState);
  };

  calleePc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      params.onRemoteStream?.(event.streams[0]);
    }
  };

  callerPc.onicecandidate = async (event) => {
    if (event.candidate) {
      const cand: WebRTCSignalCandidate = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        fromRole: "teacher",
        createdAt: new Date().toISOString(),
      };
      collectedCandidates.push(cand);
      params.onIceCandidate?.(cand);
      try {
        await calleePc.addIceCandidate(event.candidate);
      } catch {}
    }
  };

  calleePc.onicecandidate = async (event) => {
    if (event.candidate) {
      const cand: WebRTCSignalCandidate = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        fromRole: "pilgrim",
        createdAt: new Date().toISOString(),
      };
      collectedCandidates.push(cand);
      params.onIceCandidate?.(cand);
      try {
        await callerPc.addIceCandidate(event.candidate);
      } catch {}
    }
  };

  if (params.localStream) {
    params.localStream.getTracks().forEach((track) => {
      callerPc.addTrack(track, params.localStream!);
    });
  } else {
    callerPc.addTransceiver("audio", { direction: "sendrecv" });
  }

  let sdpOffer: { type: "offer"; sdp: string } | undefined;
  let sdpAnswer: { type: "answer"; sdp: string } | undefined;

  try {
    const offer = await callerPc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });
    await callerPc.setLocalDescription(offer);
    sdpOffer = { type: "offer", sdp: offer.sdp || "" };

    await calleePc.setRemoteDescription(offer);
    const answer = await calleePc.createAnswer();
    await calleePc.setLocalDescription(answer);
    sdpAnswer = { type: "answer", sdp: answer.sdp || "" };

    await callerPc.setRemoteDescription(answer);
  } catch {
    // ignore negotiation errors in restricted sandboxes
  }

  const cleanup = () => {
    try {
      callerPc.close();
    } catch {}
    try {
      calleePc.close();
    } catch {}
  };

  return {
    callerPc,
    calleePc,
    sdpOffer,
    sdpAnswer,
    iceCandidates: collectedCandidates,
    cleanup,
  };
}

export async function initiateTeacherOneOnOneAudioCall(params: {
  actorRole: "teacher" | "pilgrim";
  hostTeacherSlug: string;
  hostTeacherName: string;
  hostTeacherTitle: string;
  hostTeacherPortrait: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail?: string;
  scriptureRef: string;
  scriptureText: string;
  counselingTopic: string;
  teacherMicPermission: "granted" | "denied" | "prompt" | "fallback";
  sdpOffer?: { type: "offer"; sdp: string };
  sdpAnswer?: { type: "answer"; sdp: string };
  iceCandidates?: WebRTCSignalCandidate[];
  autoConnectPeer?: boolean;
}): Promise<{
  call?: ActiveTeacherLiveCall;
  oneOnOneSession?: OneOnOneWebRTCSession;
  error?: string;
}> {
  if (params.actorRole !== "teacher") {
    return {
      error:
        "Only appointed LifeBook Teachers can initiate a 1-on-1 WebRTC Pastoral Audio Call with a user.",
    };
  }

  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "initiate-1on1-call",
        ...params,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Unable to initiate 1-on-1 audio call." };
    }
    broadcastLiveCallUpdate(data.call);
    return { call: data.call, oneOnOneSession: data.oneOnOneSession };
  } catch {
    return { error: "Network error while initiating 1-on-1 WebRTC audio call." };
  }
}

export async function answerOneOnOneAudioCall(params: {
  userMicPermission: "granted" | "denied" | "prompt" | "fallback";
  sdpAnswer?: { type: "answer"; sdp: string };
  iceCandidates?: WebRTCSignalCandidate[];
}): Promise<{
  call?: ActiveTeacherLiveCall;
  oneOnOneSession?: OneOnOneWebRTCSession;
  error?: string;
}> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "answer-1on1-call",
        ...params,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Unable to answer 1-on-1 audio call." };
    }
    broadcastLiveCallUpdate(data.call);
    return { call: data.call, oneOnOneSession: data.oneOnOneSession };
  } catch {
    return { error: "Network error while answering 1-on-1 audio call." };
  }
}

export async function signalOneOnOneWebRTC(params: {
  sdpOffer?: { type: "offer"; sdp: string };
  sdpAnswer?: { type: "answer"; sdp: string };
  candidate?: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
  };
  fromRole?: "teacher" | "pilgrim";
  teacherMicMuted?: boolean;
  userMicMuted?: boolean;
  teacherMicPermission?: "granted" | "denied" | "prompt" | "fallback";
  userMicPermission?: "granted" | "denied" | "prompt" | "fallback";
}): Promise<ActiveTeacherLiveCall | null> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signal-1on1-webrtc",
        ...params,
      }),
    });
    const data = await res.json();
    if (data.call) {
      broadcastLiveCallUpdate(data.call);
      return data.call;
    }
    return null;
  } catch {
    return null;
  }
}

export async function endOneOnOneAudioCall(): Promise<ActiveTeacherLiveCall | null> {
  try {
    const res = await fetch("/api/live-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end-1on1-call",
      }),
    });
    const data = await res.json();
    broadcastLiveCallUpdate(data.call);
    return data.call;
  } catch {
    return null;
  }
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
  callMode: "video-fellowship" | "audio-prayer-circle" | "one-on-one-audio";
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

// Walkthrough Helpers for First Login & New Users
export function markNewUserForWalkthrough(email?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALKTHROUGH_PENDING_NEW_USER_KEY, "1");
    localStorage.removeItem(WALKTHROUGH_COMPLETED_KEY);
    if (email) {
      const raw = localStorage.getItem(WALKTHROUGH_SEEN_USERS_KEY);
      const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
      delete map[email.toLowerCase()];
      localStorage.setItem(WALKTHROUGH_SEEN_USERS_KEY, JSON.stringify(map));
    }
    window.dispatchEvent(new Event(WALKTHROUGH_OPEN_EVENT));
  } catch {}
}

/**
 * Triggers the interactive step-by-step walkthrough modal automatically on first login
 * for a given user email (or if walkthrough has not yet been completed).
 */
export function triggerFirstLoginWalkthroughIfNeeded(email: string) {
  if (typeof window === "undefined") return;
  try {
    const cleanEmail = email.trim().toLowerCase() || "guest";
    const raw = localStorage.getItem(WALKTHROUGH_SEEN_USERS_KEY);
    const seenUsers: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    const hasCompletedGlobal = localStorage.getItem(WALKTHROUGH_COMPLETED_KEY) === "1";

    if (!seenUsers[cleanEmail] || !hasCompletedGlobal) {
      localStorage.setItem(WALKTHROUGH_PENDING_NEW_USER_KEY, "1");
      localStorage.removeItem(WALKTHROUGH_COMPLETED_KEY);
      window.dispatchEvent(new Event(WALKTHROUGH_OPEN_EVENT));
    }
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

export function markWalkthroughCompleted(email?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALKTHROUGH_COMPLETED_KEY, "1");
    localStorage.removeItem(WALKTHROUGH_PENDING_NEW_USER_KEY);
    if (email) {
      const raw = localStorage.getItem(WALKTHROUGH_SEEN_USERS_KEY);
      const seenUsers: Record<string, boolean> = raw ? JSON.parse(raw) : {};
      seenUsers[email.trim().toLowerCase()] = true;
      localStorage.setItem(WALKTHROUGH_SEEN_USERS_KEY, JSON.stringify(seenUsers));
    }
  } catch {}
}

export function triggerOpenWalkthrough() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WALKTHROUGH_OPEN_EVENT));
}
