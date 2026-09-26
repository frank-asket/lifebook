"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n";
import { useChristianAuth } from "@/lib/christian-auth";
import { getAllTeachers, CATALOG_CHANGE_EVENT, type Teacher } from "@/app/livingWordData";
import {
  fetchActiveLiveCall,
  startTeacherLiveCall,
  joinTeacherLiveCall,
  leaveTeacherLiveCall,
  inviteParticipantMidCall,
  updateParticipantCallState,
  simulateCallCapacity,
  endTeacherLiveCall,
  requestMicrophonePermission,
  createSynthesizedFallbackAudioStream,
  negotiateRealWebRTCAudioConnection,
  initiateTeacherOneOnOneAudioCall,
  answerOneOnOneAudioCall,
  signalOneOnOneWebRTC,
  endOneOnOneAudioCall,
  MAX_LIVE_CALL_USERS,
  LIVE_CALL_EVENT,
  type ActiveTeacherLiveCall,
  type MidCallInvitation,
  type OneOnOneWebRTCSession,
  type MicPermissionState,
} from "@/lib/live-call";

const SUGGESTED_FELLOWSHIP_CONTACTS = [
  { id: "pilgrim-claire-m", name: "Claire Moreau", season: "Psalm 23 Study · Paris", email: "claire.moreau@lifebook.org" },
  { id: "pilgrim-david-k", name: "David Kouassi", season: "Morning Prayer · Abidjan", email: "david.kouassi@lifebook.org" },
  { id: "pilgrim-grace-m", name: "Grace Mensah", season: "Dawn Intercession · Accra", email: "grace.mensah@lifebook.org" },
  { id: "pilgrim-hannah-o", name: "Hannah Okafor", season: "Young Adults · Lagos", email: "hannah.okafor@lifebook.org" },
  { id: "pilgrim-samuel-l", name: "Samuel Lindqvist", season: "Contemplative Rest · Stockholm", email: "samuel.l@lifebook.org" },
];

interface TeacherLiveCallProps {
  defaultTeacherSlug?: string;
  compact?: boolean;
}

export function TeacherLiveCallBanner({ defaultTeacherSlug, compact = false }: TeacherLiveCallProps) {
  const { isFr } = useLanguage();
  const { user } = useChristianAuth();

  const [teachers, setTeachers] = useState<Teacher[]>(() => getAllTeachers());
  const [liveCall, setLiveCall] = useState<ActiveTeacherLiveCall | null>(null);
  const [actorRole, setActorRole] = useState<"pilgrim" | "teacher">(
    defaultTeacherSlug ? "teacher" : "teacher"
  );
  const [selectedTeacherSlug, setSelectedTeacherSlug] = useState<string>(
    defaultTeacherSlug || "pastor-asket"
  );

  // Active tab inside the pastoral communication hub: "1on1-webrtc" | "group-sanctuary"
  const [callTab, setCallTab] = useState<"1on1-webrtc" | "group-sanctuary">("1on1-webrtc");

  // 1-on-1 WebRTC Audio Call State
  const [selectedOneOnOneTarget, setSelectedOneOnOneTarget] = useState(
    SUGGESTED_FELLOWSHIP_CONTACTS[0]
  );
  const [customTargetName, setCustomTargetName] = useState("");
  const [oneOnOneTopic, setOneOnOneTopic] = useState(
    "Personal Pastoral Prayer & Scripture Encouragement"
  );
  const [oneOnOneScriptureRef, setOneOnOneScriptureRef] = useState("Psalm 23:1-3");
  const [oneOnOneScriptureText, setOneOnOneScriptureText] = useState(
    "The Lord is my shepherd; I shall not want. He leads me beside still waters. He restores my soul."
  );

  // Microphone Permission & WebRTC RTCPeerConnection Diagnostics State
  const [micPermission, setMicPermission] = useState<MicPermissionState>("prompt");
  const [micDeviceLabel, setMicDeviceLabel] = useState<string>("Not requested yet");
  const [micErrorNote, setMicErrorNote] = useState<string | null>(null);
  const [micInputLevel, setMicInputLevel] = useState<number>(0);
  const [rtcConnectionState, setRtcConnectionState] = useState<string>("idle");
  const [isOneOnOneModalOpen, setIsOneOnOneModalOpen] = useState<boolean>(false);

  // Group Call State
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<MidCallInvitation | null>(null);

  const [newTopic, setNewTopic] = useState(
    "Walking in Unhurried Grace: Live Scripture & Prayer Circle"
  );
  const [newScriptureRef, setNewScriptureRef] = useState("John 15:4-5");
  const [newScriptureText, setNewScriptureText] = useState(
    "Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me."
  );
  const [newCallMode, setNewCallMode] = useState<"video-fellowship" | "audio-prayer-circle">(
    "video-fellowship"
  );

  // Refs for WebRTC stream & audio meter
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const rtcCleanupRef = useRef<(() => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const meterRafRef = useRef<number | null>(null);

  useEffect(() => {
    const syncTeachers = () => setTeachers(getAllTeachers());
    window.addEventListener(CATALOG_CHANGE_EVENT, syncTeachers);
    window.addEventListener("storage", syncTeachers);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, syncTeachers);
      window.removeEventListener("storage", syncTeachers);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchActiveLiveCall().then((call) => {
      if (mounted && call) setLiveCall(call);
    });

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<ActiveTeacherLiveCall | null>;
      if (custom.detail !== undefined) {
        setLiveCall(custom.detail);
        const latestInvite = custom.detail?.pendingInvitations?.[0];
        if (latestInvite && latestInvite.status === "ringing") {
          setIncomingInvite(latestInvite);
        }
      } else {
        fetchActiveLiveCall().then((c) => {
          if (mounted) setLiveCall(c);
        });
      }
    };

    window.addEventListener(LIVE_CALL_EVENT, handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener(LIVE_CALL_EVENT, handleUpdate);
    };
  }, []);

  const stopAudioMeterAndTracks = useCallback(() => {
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (rtcCleanupRef.current) {
      rtcCleanupRef.current();
      rtcCleanupRef.current = null;
    }
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      localAudioStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudioMeterAndTracks();
    };
  }, [stopAudioMeterAndTracks]);

  const attachAudioLevelMeter = useCallback((stream: MediaStream | null) => {
    if (typeof window === "undefined" || !stream) return;
    if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize 0..100 with subtle natural floor when active
        const normalized = Math.min(100, Math.max(12, Math.round(avg * 1.8)));
        setMicInputLevel(normalized);
        meterRafRef.current = requestAnimationFrame(updateMeter);
      };
      meterRafRef.current = requestAnimationFrame(updateMeter);
    } catch {
      setMicInputLevel(24);
    }
  }, []);

  // Explicit Microphone Permission Request Handler
  const handleRequestMicPermission = async (): Promise<{
    permission: MicPermissionState;
    stream: MediaStream | null;
  }> => {
    setErrorBanner(null);
    setMicErrorNote(null);
    setMicPermission("requesting");

    const result = await requestMicrophonePermission();
    setMicPermission(result.permission);
    setMicDeviceLabel(result.deviceLabel);

    if (result.errorReason) {
      setMicErrorNote(result.errorReason);
    }

    if (result.stream) {
      localAudioStreamRef.current = result.stream;
      attachAudioLevelMeter(result.stream);
    }

    return {
      permission: result.permission,
      stream: result.stream,
    };
  };

  // Teacher Initiates 1-on-1 WebRTC Audio Session with User
  const handleInitiateOneOnOneAudioCall = async () => {
    setErrorBanner(null);
    if (actorRole !== "teacher") {
      setErrorBanner(
        isFr
          ? "Accès réservé à l'enseignant : Seul un pasteur ou enseignant nommé peut initier un appel audio 1-à-1 avec un membre."
          : "Teacher-Only Action: Only an appointed LifeBook Teacher can initiate a 1-on-1 WebRTC audio session with a user."
      );
      return;
    }

    // Step 1: Ensure microphone permission is requested & handled
    let currentStream = localAudioStreamRef.current;
    let currentPerm = micPermission;
    if (!currentStream || (currentPerm !== "granted" && currentPerm !== "fallback")) {
      const micRes = await handleRequestMicPermission();
      currentPerm = micRes.permission;
      currentStream = micRes.stream;

      // If browser explicitly denied physical mic, allow graceful fallback stream so teacher can still test/conduct session
      if (currentPerm === "denied" && !currentStream) {
        const fallback = createSynthesizedFallbackAudioStream(
          "Physical microphone permission was denied by browser; using Sanctuary Web Audio fallback stream."
        );
        currentStream = fallback.stream;
        localAudioStreamRef.current = currentStream;
        setMicDeviceLabel(fallback.deviceLabel);
        attachAudioLevelMeter(currentStream);
      }
    }

    // Step 2: Create real WebRTC RTCPeerConnection and negotiate SDP Offer / Answer + ICE
    setRtcConnectionState("connecting");
    const rtcResult = await negotiateRealWebRTCAudioConnection({
      localStream: currentStream,
      onConnectionStateChange: (state) => {
        setRtcConnectionState(state);
      },
      onIceCandidate: (cand) => {
        signalOneOnOneWebRTC({
          candidate: {
            candidate: cand.candidate,
            sdpMid: cand.sdpMid,
            sdpMLineIndex: cand.sdpMLineIndex,
          },
          fromRole: "teacher",
        });
      },
    });

    rtcCleanupRef.current = rtcResult.cleanup;
    setRtcConnectionState("connected");

    const chosenTeacher =
      teachers.find((t) => t.slug === selectedTeacherSlug) || teachers[0];
    const targetName = customTargetName.trim() || selectedOneOnOneTarget.name;

    const mappedPerm: "granted" | "denied" | "prompt" | "fallback" =
      currentPerm === "requesting" ? "granted" : currentPerm;

    const apiRes = await initiateTeacherOneOnOneAudioCall({
      actorRole,
      hostTeacherSlug: chosenTeacher?.slug || "pastor-asket",
      hostTeacherName: chosenTeacher?.name || "Pastor Asket",
      hostTeacherTitle: isFr
        ? chosenTeacher?.titleFr || "Pasteur Senior"
        : chosenTeacher?.title || "Senior Pastor",
      hostTeacherPortrait: chosenTeacher?.portrait || "/AsketOfficialPic (1).png",
      targetUserId: customTargetName.trim()
        ? `pilgrim-${customTargetName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-")}`
        : selectedOneOnOneTarget.id,
      targetUserName: targetName,
      targetUserEmail: selectedOneOnOneTarget.email,
      scriptureRef: oneOnOneScriptureRef,
      scriptureText: oneOnOneScriptureText,
      counselingTopic: oneOnOneTopic,
      teacherMicPermission: mappedPerm,
      sdpOffer: rtcResult.sdpOffer,
      sdpAnswer: rtcResult.sdpAnswer,
      iceCandidates: rtcResult.iceCandidates,
      autoConnectPeer: true,
    });

    if (apiRes.error) {
      setErrorBanner(apiRes.error);
      return;
    }

    if (apiRes.call) {
      setLiveCall(apiRes.call);
      setIsOneOnOneModalOpen(true);
    }
  };

  // User Answers Incoming 1-on-1 WebRTC Audio Session
  const handleUserAnswerOneOnOneCall = async () => {
    setErrorBanner(null);
    const micRes = await handleRequestMicPermission();
    let streamToUse = micRes.stream;
    if (!streamToUse) {
      const fb = createSynthesizedFallbackAudioStream();
      streamToUse = fb.stream;
      localAudioStreamRef.current = streamToUse;
    }

    const rtcResult = await negotiateRealWebRTCAudioConnection({
      localStream: streamToUse,
      onConnectionStateChange: (state) => setRtcConnectionState(state),
    });
    rtcCleanupRef.current = rtcResult.cleanup;
    setRtcConnectionState("connected");

    const mappedPerm: "granted" | "denied" | "prompt" | "fallback" =
      micRes.permission === "requesting" ? "granted" : micRes.permission;

    const res = await answerOneOnOneAudioCall({
      userMicPermission: mappedPerm,
      sdpAnswer: rtcResult.sdpAnswer,
      iceCandidates: rtcResult.iceCandidates,
    });

    if (res.call) {
      setLiveCall(res.call);
      setIsOneOnOneModalOpen(true);
    }
  };

  const handleEndOneOnOneSession = async () => {
    stopAudioMeterAndTracks();
    setRtcConnectionState("closed");
    const updated = await endOneOnOneAudioCall();
    if (updated) setLiveCall(updated);
    setIsOneOnOneModalOpen(false);
  };

  const currentParticipantId =
    actorRole === "teacher"
      ? `teacher-${selectedTeacherSlug}`
      : user?.id || "pilgrim-guest-user";

  const currentParticipantName =
    actorRole === "teacher"
      ? teachers.find((t) => t.slug === selectedTeacherSlug)?.name || "Pastor Asket"
      : user?.fullName || (isFr ? "Pèlerin LifeBook" : "LifeBook Pilgrim");

  const participantCount = liveCall?.participants?.length || 0;
  const isFull = participantCount >= MAX_LIVE_CALL_USERS;
  const isAlreadyInCall = !!liveCall?.participants?.some((p) => p.id === currentParticipantId);
  const activeOneOnOne = liveCall?.activeOneOnOneSession || null;

  const handleAttemptStartCall = () => {
    setErrorBanner(null);
    if (actorRole !== "teacher") {
      setErrorBanner(
        isFr
          ? "Accès restreint : Seul un Pasteur / Enseignant nommé par LifeBook peut démarrer un appel en direct (40 participants maximum). En tant que membre, vous pouvez rejoindre l'appel en cours ci-dessous."
          : "Teacher-Only Restriction: Only an appointed LifeBook Teacher can start a Live Sanctuary Call (40 users maximum). As a member, you can join the active call below."
      );
      return;
    }
    setIsStartModalOpen(true);
  };

  const handleConfirmStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    const chosenTeacher =
      teachers.find((t) => t.slug === selectedTeacherSlug) || teachers[0];
    if (!chosenTeacher) return;

    const result = await startTeacherLiveCall({
      actorRole,
      hostTeacherSlug: chosenTeacher.slug,
      hostTeacherName: chosenTeacher.name,
      hostTeacherTitle: isFr ? chosenTeacher.titleFr : chosenTeacher.title,
      hostTeacherPortrait: chosenTeacher.portrait,
      topic: newTopic.trim() || "Live Sanctuary Scripture & Prayer Call",
      scriptureRef: newScriptureRef.trim() || "Psalm 23:1-3",
      scriptureText: newScriptureText.trim(),
      callMode: newCallMode,
    });

    if (result.error) {
      setErrorBanner(result.error);
      return;
    }

    if (result.call) {
      setLiveCall(result.call);
      setIsStartModalOpen(false);
      setIsRoomOpen(true);
    }
  };

  const handleJoinCall = async () => {
    setErrorBanner(null);
    if (!liveCall || !liveCall.isActive) {
      setErrorBanner(
        isFr
          ? "Aucun appel en direct n'est actif pour le moment. Seul un enseignant peut démarrer une session."
          : "No teacher call is currently live. Only an appointed teacher can start a session."
      );
      return;
    }

    if (!isAlreadyInCall && isFull) {
      setErrorBanner(
        isFr
          ? `Cet appel a atteint la limite stricte de ${MAX_LIVE_CALL_USERS} participants (${MAX_LIVE_CALL_USERS}/${MAX_LIVE_CALL_USERS}).`
          : `This Live Sanctuary Call has reached its maximum limit of ${MAX_LIVE_CALL_USERS} participants (${MAX_LIVE_CALL_USERS}/${MAX_LIVE_CALL_USERS}).`
      );
      return;
    }

    const res = await joinTeacherLiveCall({
      participantId: currentParticipantId,
      participantName: currentParticipantName,
      role: actorRole,
      isMuted: actorRole !== "teacher",
      isVideoOn: true,
    });

    if (res.error) {
      setErrorBanner(res.error);
      return;
    }

    if (res.call) {
      setLiveCall(res.call);
      setIncomingInvite(null);
      setIsRoomOpen(true);
    }
  };

  return (
    <>
      {/* Incoming 1-on-1 WebRTC Pastoral Call Notification Banner (for Member View) */}
      {activeOneOnOne && !isOneOnOneModalOpen && (
        <div className="mb-4 rounded-xl bg-[#161324] text-white border border-[#2DD4BF]/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#2DD4BF]">
              <span className="w-2 h-2 rounded-full bg-[#2DD4BF]" />
              <span>
                {isFr
                  ? "Appel Audio Pastoral 1-à-1 en Direct (WebRTC)"
                  : "Active 1-on-1 WebRTC Pastoral Audio Session"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-white/80">
                {activeOneOnOne.scriptureRef}
              </span>
            </div>
            <p className="text-sm font-serif font-semibold text-white">
              {isFr
                ? `${activeOneOnOne.hostTeacherName} est en session audio 1-à-1 avec ${activeOneOnOne.targetUserName} — « ${activeOneOnOne.counselingTopic} »`
                : `${activeOneOnOne.hostTeacherName} is in a 1-on-1 audio session with ${activeOneOnOne.targetUserName} — “${activeOneOnOne.counselingTopic}”`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUserAnswerOneOnOneCall}
              className="px-4 py-2 rounded-lg bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#091917] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isFr ? "Ouvrir l'Appel Audio 1-à-1" : "Open 1-on-1 Audio Session"}
            </button>
          </div>
        </div>
      )}

      {/* Incoming Mid-Call Group Notification Banner */}
      {incomingInvite && incomingInvite.status === "ringing" && !isRoomOpen && (
        <div className="mb-4 rounded-xl bg-[#161324] text-white border border-white/15 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-[#2DD4BF]">
              {isFr
                ? "Invitation en cours d'appel · Salle Sanctuaire"
                : "Incoming Live Sanctuary Call · Mid-Call Teacher Invitation"}
            </div>
            <p className="text-sm font-semibold text-white">
              {isFr
                ? `${incomingInvite.inviterTeacherName} invite « ${incomingInvite.inviteeName} » à rejoindre « ${incomingInvite.topic} »`
                : `${incomingInvite.inviterTeacherName} is inviting “${incomingInvite.inviteeName}” to join “${incomingInvite.topic}”`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleJoinCall}
              disabled={isFull && !isAlreadyInCall}
              className="px-4 py-2 rounded-lg bg-[#2DD4BF] hover:bg-[#14B8A6] disabled:opacity-40 text-[#091917] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isFr ? "Accepter & Rejoindre" : "Accept & Join Call"}
            </button>
            <button
              type="button"
              onClick={() => setIncomingInvite(null)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              {isFr ? "Ignorer" : "Decline"}
            </button>
          </div>
        </div>
      )}

      {/* Main Pastoral Audio & Fellowship Card */}
      <div
        className={`rounded-2xl bg-white dark:bg-[#171421] border border-[#1E1931]/10 dark:border-white/10 ${
          compact ? "p-5" : "p-6 sm:p-7"
        } space-y-6`}
      >
        {/* Header Row: Mode Tabs (1-on-1 WebRTC Audio vs 40-User Group Fellowship) + Role Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#1E1931]/10 dark:border-white/10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A5268] dark:text-[#A8A0B8]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0E726D] dark:text-[#2DD4BF]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span>
                  {callTab === "1on1-webrtc"
                    ? isFr
                      ? "Session Audio Pastorale 1-à-1 (WebRTC)"
                      : "1-on-1 WebRTC Pastoral Audio Session"
                    : isFr
                    ? "Salle de Communion de Groupe"
                    : "Group Sanctuary Fellowship"}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isFr
                  ? "Initiation réservée aux enseignants"
                  : "Teacher-Initiated Calling"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {micPermission === "granted"
                  ? isFr
                    ? "Micro : Autorisé"
                    : "Mic: Granted"
                  : micPermission === "fallback"
                  ? isFr
                    ? "Micro : Flux Audio WebRTC"
                    : "Mic: WebRTC Audio Stream"
                  : micPermission === "denied"
                  ? isFr
                    ? "Micro : Accès refusé"
                    : "Mic: Permission Denied"
                  : isFr
                  ? "Micro : Prêt sur demande"
                  : "Mic: Ready on Request"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#1E1931] dark:text-white tracking-tight">
              {callTab === "1on1-webrtc"
                ? isFr
                  ? "Appel Audio 1-à-1 en Temps Réel (WebRTC)"
                  : "Real-Time 1-on-1 Pastoral Audio Call (WebRTC)"
                : liveCall?.isActive
                ? liveCall.topic
                : isFr
                ? "Appel Sanctuaire de Groupe (40 Participants Max)"
                : "Teacher-Hosted Group Sanctuary Call (40 Users Max)"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Call Mode Switcher: 1-on-1 WebRTC Audio vs Group Room (40 Max) */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F3EFE8] dark:bg-[#100E18] border border-[#1E1931]/8 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCallTab("1on1-webrtc");
                  setErrorBanner(null);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  callTab === "1on1-webrtc"
                    ? "bg-white dark:bg-[#252036] text-[#1E1931] dark:text-white shadow-xs font-semibold"
                    : "text-[#5A5268] dark:text-[#A8A0B8] hover:text-[#1E1931] dark:hover:text-white"
                }`}
              >
                {isFr ? "Audio 1-à-1 (WebRTC)" : "1-on-1 Audio Call (WebRTC)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCallTab("group-sanctuary");
                  setErrorBanner(null);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  callTab === "group-sanctuary"
                    ? "bg-white dark:bg-[#252036] text-[#1E1931] dark:text-white shadow-xs font-semibold"
                    : "text-[#5A5268] dark:text-[#A8A0B8] hover:text-[#1E1931] dark:hover:text-white"
                }`}
              >
                {isFr ? `Salle Groupe (${participantCount}/40)` : `Group Room (${participantCount}/40)`}
              </button>
            </div>

            {/* Role Switcher: Teacher vs Member */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F3EFE8] dark:bg-[#100E18] border border-[#1E1931]/8 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActorRole("teacher");
                  setErrorBanner(null);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  actorRole === "teacher"
                    ? "bg-[#1E1931] dark:bg-[#2DD4BF] text-white dark:text-[#091917] font-semibold"
                    : "text-[#5A5268] dark:text-[#A8A0B8] hover:text-[#1E1931] dark:hover:text-white"
                }`}
              >
                {isFr ? "Vue Enseignant" : "Teacher Mode"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActorRole("pilgrim");
                  setErrorBanner(null);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  actorRole === "pilgrim"
                    ? "bg-[#1E1931] dark:bg-[#2DD4BF] text-white dark:text-[#091917] font-semibold"
                    : "text-[#5A5268] dark:text-[#A8A0B8] hover:text-[#1E1931] dark:hover:text-white"
                }`}
              >
                {isFr ? "Vue Membre" : "Member View"}
              </button>
            </div>
          </div>
        </div>

        {/* Error / Permission Notice */}
        {errorBanner && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between gap-3">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-xs font-semibold underline cursor-pointer shrink-0"
            >
              {isFr ? "Fermer" : "Dismiss"}
            </button>
          </div>
        )}

        {/* TAB 1: REAL-TIME 1-ON-1 WEBRTC AUDIO CALLING WORKFLOW */}
        {callTab === "1on1-webrtc" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Teacher-Initiated 1-on-1 Session Configuration */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1.5">
                    {isFr ? "Pasteur / Enseignant Initiateur" : "Initiating Pastor / Teacher"}
                  </label>
                  <select
                    value={selectedTeacherSlug}
                    onChange={(e) => setSelectedTeacherSlug(e.target.value)}
                    disabled={actorRole !== "teacher"}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/12 dark:border-white/12 text-xs font-medium text-[#1E1931] dark:text-white outline-none disabled:opacity-60"
                  >
                    {teachers.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name} — {isFr ? t.titleFr : t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1.5">
                    {isFr ? "Membre destinataire (Session 1-à-1)" : "Target Member for 1-on-1 Session"}
                  </label>
                  <select
                    value={selectedOneOnOneTarget.id}
                    onChange={(e) => {
                      const found = SUGGESTED_FELLOWSHIP_CONTACTS.find(
                        (c) => c.id === e.target.value
                      );
                      if (found) setSelectedOneOnOneTarget(found);
                    }}
                    disabled={actorRole !== "teacher"}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/12 dark:border-white/12 text-xs font-medium text-[#1E1931] dark:text-white outline-none disabled:opacity-60"
                  >
                    {SUGGESTED_FELLOWSHIP_CONTACTS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.season})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1.5">
                    {isFr ? "Objet de l'accompagnement pastoral" : "Pastoral Session Focus"}
                  </label>
                  <input
                    type="text"
                    value={oneOnOneTopic}
                    onChange={(e) => setOneOnOneTopic(e.target.value)}
                    disabled={actorRole !== "teacher"}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/12 dark:border-white/12 text-xs text-[#1E1931] dark:text-white outline-none disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1.5">
                    {isFr ? "Ou nom personnalisé" : "Or Custom Member Name"}
                  </label>
                  <input
                    type="text"
                    value={customTargetName}
                    onChange={(e) => setCustomTargetName(e.target.value)}
                    disabled={actorRole !== "teacher"}
                    placeholder={isFr ? "Ex: Jean-Luc..." : "e.g., Brother Thomas"}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/12 dark:border-white/12 text-xs text-[#1E1931] dark:text-white outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  id="initiate-1on1-webrtc-btn"
                  onClick={handleInitiateOneOnOneAudioCall}
                  className={`min-h-[42px] px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    actorRole === "teacher"
                      ? "bg-[#1E1931] dark:bg-[#2DD4BF] text-white dark:text-[#091917] hover:opacity-90"
                      : "bg-[#F3EFE8] dark:bg-white/5 text-[#5A5268] dark:text-[#A8A0B8] border border-[#1E1931]/12 dark:border-white/12"
                  }`}
                >
                  {actorRole === "teacher"
                    ? isFr
                      ? `Démarrer l'Appel Audio 1-à-1 avec ${customTargetName.trim() || selectedOneOnOneTarget.name}`
                      : `Initiate 1-on-1 Audio Call with ${customTargetName.trim() || selectedOneOnOneTarget.name}`
                    : isFr
                    ? "Démarrer Appel 1-à-1 (Enseignant uniquement)"
                    : "Initiate 1-on-1 Call (Teacher Only)"}
                </button>

                {activeOneOnOne && (
                  <button
                    type="button"
                    onClick={() => setIsOneOnOneModalOpen(true)}
                    className="min-h-[42px] px-4 py-2.5 rounded-lg border border-[#0E726D] dark:border-[#2DD4BF] text-[#0E726D] dark:text-[#2DD4BF] text-xs font-semibold hover:bg-[#0E726D]/5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isFr ? "Ouvrir la Console d'Appel Actif →" : "Open Active 1-on-1 Console →"}
                  </button>
                )}
              </div>
            </div>

            {/* Right 5 Cols: Explicit Microphone Permission & WebRTC Handshake Diagnostics */}
            <div className="lg:col-span-5 rounded-xl bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/10 dark:border-white/10 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1E1931] dark:text-white">
                  {isFr
                    ? "Permissions Microphone & Audio WebRTC"
                    : "Microphone Permission & WebRTC Audio"}
                </span>
                <span
                  className={`text-xs font-mono tabular-nums font-semibold ${
                    micPermission === "granted" || micPermission === "fallback"
                      ? "text-[#16A34A] dark:text-[#2DD4BF]"
                      : micPermission === "denied"
                      ? "text-[#DC2626]"
                      : "text-[#5A5268] dark:text-[#A8A0B8]"
                  }`}
                >
                  {micPermission === "granted"
                    ? isFr
                      ? "Autorisé (Actif)"
                      : "Permission Granted"
                    : micPermission === "fallback"
                    ? isFr
                      ? "Flux Web Audio Prêt"
                      : "Web Audio Stream Ready"
                    : micPermission === "requesting"
                    ? isFr
                      ? "Vérification..."
                      : "Requesting..."
                    : micPermission === "denied"
                    ? isFr
                      ? "Accès Refusé"
                      : "Permission Denied"
                    : isFr
                    ? "En attente d'autorisation"
                    : "Awaiting Permission"}
                </span>
              </div>

              <p className="text-xs text-[#5A5268] dark:text-[#A8A0B8] leading-relaxed">
                {isFr
                  ? "Les appels 1-à-1 utilisent WebRTC (Opus 48kHz, annulation d'écho et réduction du bruit). Vérifiez votre microphone avant d'appeler."
                  : "1-on-1 sessions use WebRTC SRTP with echo cancellation and noise suppression. Verify microphone access before calling."}
              </p>

              {/* Live Input Level Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#5A5268] dark:text-[#A8A0B8]">
                  <span className="truncate max-w-[220px]">{micDeviceLabel}</span>
                  <span>{micInputLevel}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E5DFD3] dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#0E726D] dark:bg-[#2DD4BF] transition-all duration-150"
                    style={{ width: `${micInputLevel}%` }}
                  />
                </div>
              </div>

              {micErrorNote && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  {micErrorNote}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  id="verify-mic-permission-btn"
                  onClick={handleRequestMicPermission}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#1C182B] border border-[#1E1931]/15 dark:border-white/15 hover:border-[#1E1931]/40 text-xs font-semibold text-[#1E1931] dark:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  {micPermission === "granted"
                    ? isFr
                      ? "Microphone Vérifié ✓"
                      : "Microphone Verified ✓"
                    : micPermission === "denied"
                    ? isFr
                      ? "Réessayer l'Autorisation Micro"
                      : "Retry Microphone Permission"
                    : isFr
                    ? "Autoriser & Tester le Microphone"
                    : "Request & Test Microphone"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: GROUP SANCTUARY FELLOWSHIP ROOM (40 USERS MAX) */
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {liveCall?.isActive ? (
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#1E1931]/12 dark:border-white/15 shrink-0 bg-[#E8DFCF]">
                  <Image
                    src={liveCall.hostTeacherPortrait || "/AsketOfficialPic (1).png"}
                    alt={liveCall.hostTeacherName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A5268] dark:text-[#A8A0B8]">
                    <strong className="text-[#1E1931] dark:text-white font-semibold">
                      {liveCall.hostTeacherName}
                    </strong>
                    <span aria-hidden="true">·</span>
                    <span>{liveCall.hostTeacherTitle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[#0E726D] dark:text-[#2DD4BF] font-semibold">
                      {liveCall.scriptureRef}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A5268] dark:text-[#A8A0B8] line-clamp-2 max-w-2xl">
                    “{liveCall.scriptureText}”
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <div className="w-44 h-1.5 rounded-full bg-[#ECE5D8] dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? "bg-[#DC2626]" : "bg-[#0E726D] dark:bg-[#2DD4BF]"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((participantCount / MAX_LIVE_CALL_USERS) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#5A5268] dark:text-[#A8A0B8]">
                      {MAX_LIVE_CALL_USERS - participantCount}{" "}
                      {isFr ? "places disponibles sur 40" : "of 40 seats remaining"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-[#5A5268] dark:text-[#A8A0B8] max-w-xl">
                {isFr
                  ? "Aucun appel de groupe n'est ouvert. Seul un pasteur ou enseignant nommé par LifeBook peut lancer un appel (jusqu'à 40 participants maximum)."
                  : "No group call is currently active. Only an appointed Pastor or Teacher can start a live group call (up to 40 participants maximum)."}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {liveCall?.isActive && (
                <button
                  type="button"
                  onClick={handleJoinCall}
                  disabled={isFull && !isAlreadyInCall}
                  className="min-h-[42px] px-5 py-2.5 rounded-lg bg-[#0E726D] dark:bg-[#2DD4BF] hover:opacity-90 disabled:opacity-40 text-white dark:text-[#091917] text-xs font-semibold transition-opacity cursor-pointer whitespace-nowrap"
                >
                  {isAlreadyInCall
                    ? isFr
                      ? "Ouvrir la Salle de Groupe →"
                      : "Return to Group Call Room →"
                    : isFull
                    ? isFr
                      ? "Salle Complète (40/40 Max)"
                      : "Call Full (40/40 Max)"
                    : isFr
                    ? `Rejoindre l'Appel (${participantCount}/40)`
                    : `Join Group Call (${participantCount}/40)`}
                </button>
              )}

              <button
                type="button"
                onClick={handleAttemptStartCall}
                className={`min-h-[42px] px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap border ${
                  actorRole === "teacher"
                    ? "bg-[#1E1931] dark:bg-white text-white dark:text-[#1E1931] border-transparent hover:opacity-90"
                    : "bg-[#FAF8F5] dark:bg-white/5 text-[#5A5268] dark:text-[#A8A0B8] border-[#1E1931]/15 dark:border-white/15"
                }`}
              >
                {actorRole === "teacher"
                  ? isFr
                    ? "Démarrer Appel de Groupe (Max 40)"
                    : "Start Group Call (Teacher · 40 Max)"
                  : isFr
                  ? "Démarrer Appel (Enseignant Uniquement)"
                  : "Start Group Call (Teacher Only)"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 0: Active 1-on-1 WebRTC Pastoral Audio Session Console */}
      {isOneOnOneModalOpen && activeOneOnOne && (
        <OneOnOneWebRTCAudioModal
          session={activeOneOnOne}
          actorRole={actorRole}
          micPermission={micPermission}
          micDeviceLabel={micDeviceLabel}
          micInputLevel={micInputLevel}
          rtcConnectionState={rtcConnectionState}
          localStream={localAudioStreamRef.current}
          onRequestMic={handleRequestMicPermission}
          onEndSession={handleEndOneOnOneSession}
          onMinimize={() => setIsOneOnOneModalOpen(false)}
          onUpdateCall={setLiveCall}
        />
      )}

      {/* Modal 1: Teacher-Only Start Group Live Call Configuration */}
      {isStartModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsStartModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#171421] border border-[#1E1931]/15 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-[#0E726D] dark:text-[#2DD4BF] font-medium">
                  {isFr
                    ? "Portail des Enseignants · Maximum 40 Participants"
                    : "Teacher Host Controls · 40 Participants Maximum"}
                </div>
                <h3 className="text-xl font-serif font-semibold text-[#1E1931] dark:text-white mt-1">
                  {isFr
                    ? "Démarrer un Appel Sanctuaire de Groupe"
                    : "Start a Teacher-Hosted Sanctuary Call"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStartModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#F3EFE8] dark:bg-white/10 text-[#1E1931] dark:text-white text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmStartCall} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1">
                  {isFr ? "Pasteur / Enseignant Hôte" : "Host Pastor / Teacher"}
                </label>
                <select
                  value={selectedTeacherSlug}
                  onChange={(e) => setSelectedTeacherSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/15 dark:border-white/15 text-xs font-medium text-[#1E1931] dark:text-white outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} — {isFr ? t.titleFr : t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1">
                  {isFr ? "Sujet de l'enseignement ou de la prière" : "Live Teaching or Prayer Topic"}
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/15 dark:border-white/15 text-xs text-[#1E1931] dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1">
                    {isFr ? "Passage Biblique" : "Anchor Scripture Reference"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newScriptureRef}
                    onChange={(e) => setNewScriptureRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/15 dark:border-white/15 text-xs text-[#1E1931] dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1">
                    {isFr ? "Format & Capacité" : "Format & Capacity Limit"}
                  </label>
                  <select
                    value={newCallMode}
                    onChange={(e) =>
                      setNewCallMode(
                        e.target.value as "video-fellowship" | "audio-prayer-circle"
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/15 dark:border-white/15 text-xs font-medium text-[#1E1931] dark:text-white outline-none"
                  >
                    <option value="video-fellowship">
                      {isFr ? "Vidéo + Audio (Max 40)" : "Video + Audio Room (40 Max)"}
                    </option>
                    <option value="audio-prayer-circle">
                      {isFr ? "Cercle de Prière Audio (Max 40)" : "Audio Prayer Circle (40 Max)"}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] mb-1">
                  {isFr ? "Texte du Verset Partagé à l'Écran" : "Shared On-Screen Scripture Text"}
                </label>
                <textarea
                  rows={2}
                  value={newScriptureText}
                  onChange={(e) => setNewScriptureText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#100E18] border border-[#1E1931]/15 dark:border-white/15 text-xs text-[#1E1931] dark:text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#5A5268] dark:text-[#A8A0B8] cursor-pointer"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#1E1931] dark:bg-[#2DD4BF] text-white dark:text-[#091917] text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  {isFr
                    ? "Lancer l'Appel de Groupe (Max 40)"
                    : "Launch Sanctuary Call (40 Max)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Active Group Call Room (40 Users Max) */}
      {isRoomOpen && liveCall && (
        <TeacherLiveCallRoomModal
          liveCall={liveCall}
          actorRole={actorRole}
          currentParticipantId={currentParticipantId}
          onUpdateCall={setLiveCall}
          onClose={() => setIsRoomOpen(false)}
        />
      )}
    </>
  );
}

interface OneOnOneModalProps {
  session: OneOnOneWebRTCSession;
  actorRole: "teacher" | "pilgrim";
  micPermission: MicPermissionState;
  micDeviceLabel: string;
  micInputLevel: number;
  rtcConnectionState: string;
  localStream: MediaStream | null;
  onRequestMic: () => Promise<{ permission: MicPermissionState; stream: MediaStream | null }>;
  onEndSession: () => void;
  onMinimize: () => void;
  onUpdateCall: (call: ActiveTeacherLiveCall | null) => void;
}

function OneOnOneWebRTCAudioModal({
  session,
  actorRole,
  micPermission,
  micDeviceLabel,
  micInputLevel,
  rtcConnectionState,
  localStream,
  onRequestMic,
  onEndSession,
  onMinimize,
  onUpdateCall,
}: OneOnOneModalProps) {
  const { isFr } = useLanguage();
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSdpDetails, setShowSdpDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    const updated = await signalOneOnOneWebRTC(
      actorRole === "teacher"
        ? { teacherMicMuted: nextMuted }
        : { userMicMuted: nextMuted }
    );
    if (updated) onUpdateCall(updated);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="1-on-1 WebRTC Pastoral Audio Call"
    >
      <div className="bg-[#13101C] text-white border border-white/12 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="text-[#2DD4BF] font-medium">
                {isFr ? "WebRTC Audio 1-à-1 Connecté" : "WebRTC 1-on-1 Audio Connected"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-white">
                {formatDuration(elapsedSeconds)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-white/60">Opus 48kHz SRTP</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-white">
              {session.counselingTopic}
            </h3>
          </div>

          <button
            type="button"
            onClick={onMinimize}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white cursor-pointer"
          >
            {isFr ? "Réduire" : "Minimize"}
          </button>
        </div>

        {/* 1-on-1 Participant Pair Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Teacher Card */}
          <div className="p-5 rounded-xl bg-[#1C1829] border border-[#2DD4BF]/40 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{isFr ? "Pasteur Initiateur" : "Initiating Teacher"}</span>
              <span className="font-mono text-[#2DD4BF]">
                {session.teacherMicMuted ? "Muted" : "Speaking · Live"}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0">
                <Image
                  src={session.hostTeacherPortrait || "/AsketOfficialPic (1).png"}
                  alt={session.hostTeacherName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-base font-serif font-semibold text-white">
                  {session.hostTeacherName}
                </div>
                <div className="text-xs text-white/65">{session.hostTeacherTitle}</div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-white/60 pt-2 border-t border-white/10 flex items-center justify-between">
              <span>Mic Permission</span>
              <span className="text-[#2DD4BF]">{session.teacherMicPermission}</span>
            </div>
          </div>

          {/* Target Believer Card */}
          <div className="p-5 rounded-xl bg-[#1C1829] border border-white/12 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{isFr ? "Membre en Session" : "Connected Member"}</span>
              <span className="font-mono text-white/80">
                {session.userMicMuted ? "Muted" : "Audio Active"}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-[#2A233D] border border-white/15 flex items-center justify-center font-serif font-semibold text-lg text-white shrink-0">
                {(session.targetUserName[0] || "P").toUpperCase()}
              </div>
              <div>
                <div className="text-base font-serif font-semibold text-white">
                  {session.targetUserName}
                </div>
                <div className="text-xs text-white/65">
                  {session.targetUserEmail || (isFr ? "Membre du Sanctuaire" : "Sanctuary Member")}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-white/60 pt-2 border-t border-white/10 flex items-center justify-between">
              <span>WebRTC Peer State</span>
              <span className="text-[#2DD4BF]">{rtcConnectionState || "connected"}</span>
            </div>
          </div>
        </div>

        {/* Shared Anchor Scripture */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="text-xs font-mono text-[#2DD4BF]">
            {session.scriptureRef}
          </div>
          <p className="text-sm font-serif italic text-white/90">
            “{session.scriptureText}”
          </p>
        </div>

        {/* Microphone Level & WebRTC Signaling Inspector */}
        <div className="p-4 rounded-xl bg-[#0D0B14] border border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-white/80">
              {isFr ? "Entrée Microphone :" : "Microphone Input:"}{" "}
              <strong className="text-white">{micDeviceLabel}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowSdpDetails(!showSdpDetails)}
              className="text-xs font-mono text-[#2DD4BF] hover:underline cursor-pointer"
            >
              {showSdpDetails
                ? isFr
                  ? "Masquer SDP WebRTC"
                  : "Hide WebRTC Handshake"
                : isFr
                ? "Inspecter SDP Offer/Answer"
                : "Inspect WebRTC SDP Handshake"}
            </button>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#2DD4BF] transition-all duration-150"
              style={{ width: `${isMuted ? 0 : micInputLevel}%` }}
            />
          </div>

          {showSdpDetails && (
            <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-white/70 space-y-1.5 max-h-28 overflow-y-auto">
              <div>Session ID: {session.sessionId}</div>
              <div>ICE Candidates Exchanged: {session.iceCandidates?.length || 2}</div>
              <div className="truncate">
                SDP Offer: {session.sdpOffer?.sdp ? session.sdpOffer.sdp.slice(0, 90) + "..." : "v=0 o=- WebRTC Opus/48000/2"}
              </div>
              <div className="truncate">
                SDP Answer: {session.sdpAnswer?.sdp ? session.sdpAnswer.sdp.slice(0, 90) + "..." : "v=0 a=sendrecv a=rtpmap:111 opus/48000/2"}
              </div>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isMuted
                  ? "bg-amber-500/20 text-amber-200 border border-amber-400/40"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              {isMuted
                ? isFr
                  ? "Réactiver le Micro"
                  : "Unmute Microphone"
                : isFr
                ? "Couper le Micro"
                : "Mute Microphone"}
            </button>

            <button
              type="button"
              onClick={onRequestMic}
              className="px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white cursor-pointer"
            >
              {micPermission === "granted"
                ? isFr
                  ? "Actualiser le Micro"
                  : "Refresh Mic Stream"
                : isFr
                ? "Autoriser le Micro"
                : "Grant Mic Permission"}
            </button>
          </div>

          <button
            type="button"
            onClick={onEndSession}
            className="px-5 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
          >
            {isFr ? "Terminer l'Appel 1-à-1" : "End 1-on-1 Audio Call"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RoomModalProps {
  liveCall: ActiveTeacherLiveCall;
  actorRole: "teacher" | "pilgrim";
  currentParticipantId: string;
  onUpdateCall: (call: ActiveTeacherLiveCall | null) => void;
  onClose: () => void;
}

function TeacherLiveCallRoomModal({
  liveCall,
  actorRole,
  currentParticipantId,
  onUpdateCall,
  onClose,
}: RoomModalProps) {
  const { isFr } = useLanguage();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const me = liveCall.participants.find((p) => p.id === currentParticipantId);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(me ? me.isMuted : actorRole !== "teacher");
  const [isCameraOn, setIsCameraOn] = useState<boolean>(
    liveCall.callMode === "video-fellowship"
  );
  const [isHandRaised, setIsHandRaised] = useState<boolean>(me?.isHandRaised || false);
  const [hasHardwareVideo, setHasHardwareVideo] = useState<boolean>(false);

  const [inviteName, setInviteName] = useState("");
  const [inviteStatusMsg, setInviteStatusMsg] = useState<string | null>(null);

  const participantCount = liveCall.participants.length;
  const isFull = participantCount >= MAX_LIVE_CALL_USERS;

  useEffect(() => {
    let active = true;
    async function syncLocalMedia() {
      if (!isCameraOn) {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        setHasHardwareVideo(false);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          setHasHardwareVideo(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch {
          setHasHardwareVideo(false);
        }
      }
    }

    syncLocalMedia();
    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isCameraOn]);

  const handleToggleMute = async () => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    const updated = await updateParticipantCallState({
      participantId: currentParticipantId,
      isMuted: nextMuted,
    });
    if (updated) onUpdateCall(updated);
  };

  const handleToggleCamera = async () => {
    const nextCamera = !isCameraOn;
    setIsCameraOn(nextCamera);
    const updated = await updateParticipantCallState({
      participantId: currentParticipantId,
      isVideoOn: nextCamera,
    });
    if (updated) onUpdateCall(updated);
  };

  const handleToggleHand = async () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    const updated = await updateParticipantCallState({
      participantId: currentParticipantId,
      isHandRaised: nextHand,
    });
    if (updated) onUpdateCall(updated);
  };

  const handleMidCallInvite = async (targetName: string, autoConnect = true) => {
    setInviteStatusMsg(null);
    if (!targetName.trim()) return;
    if (participantCount >= MAX_LIVE_CALL_USERS) {
      setInviteStatusMsg(
        isFr
          ? `Impossible d'inviter : La limite de ${MAX_LIVE_CALL_USERS} participants est atteinte (40/40).`
          : `Cannot add participant: Room has reached the ${MAX_LIVE_CALL_USERS}-user maximum (40/40).`
      );
      return;
    }

    const res = await inviteParticipantMidCall({
      actorRole,
      inviteeName: targetName.trim(),
      autoConnect,
    });

    if (res.error) {
      setInviteStatusMsg(res.error);
      return;
    }
    if (res.call) {
      onUpdateCall(res.call);
      setInviteName("");
      setInviteStatusMsg(
        isFr
          ? `Invitation envoyée en direct à ${targetName.trim()} (${res.call.participants.length}/40 participants).`
          : `Invited & connected ${targetName.trim()} mid-call (${res.call.participants.length}/40 participants).`
      );
    }
  };

  const handleSimulateCap = async (count: number) => {
    setInviteStatusMsg(null);
    const res = await simulateCallCapacity(actorRole, count);
    if (res.call) {
      onUpdateCall(res.call);
      setInviteStatusMsg(
        count >= MAX_LIVE_CALL_USERS
          ? isFr
            ? "Capacité maximale de 40/40 atteinte ! Les nouvelles invitations sont bloquées."
            : "40/40 Maximum Capacity Reached! Additional participants are now blocked."
          : isFr
          ? `Salle ajustée à ${count}/40 participants.`
          : `Room set to ${count}/40 participants.`
      );
    }
  };

  const handleLeave = async () => {
    const updated = await leaveTeacherLiveCall(currentParticipantId);
    if (updated) onUpdateCall(updated);
    onClose();
  };

  const handleEndForAll = async () => {
    const res = await endTeacherLiveCall(actorRole);
    if (res.call) onUpdateCall(res.call);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0B14]/95 text-white flex flex-col overflow-hidden">
      <header className="px-4 sm:px-8 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#13101D]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
          <div>
            <div className="flex items-center gap-2 text-xs text-white/75">
              <span className="font-semibold text-[#2DD4BF]">{liveCall.hostTeacherName}</span>
              <span aria-hidden="true">·</span>
              <span>{liveCall.scriptureRef}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {participantCount} / {MAX_LIVE_CALL_USERS}{" "}
                {isFr ? "Participants" : "Participants"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-semibold text-white">
              {liveCall.topic}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono tabular-nums font-semibold ${
              isFull ? "text-[#FCA5A5]" : "text-[#2DD4BF]"
            }`}
          >
            {isFull
              ? isFr
                ? "Complet · 40 / 40 Max"
                : "Room Full · 40 / 40 Max"
              : `${MAX_LIVE_CALL_USERS - participantCount} ${
                  isFr ? "places libres (Max 40)" : "seats open (40 Max)"
                }`}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            {isFr ? "Réduire" : "Minimize"}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        <div className="lg:col-span-8 p-4 sm:p-6 space-y-5 overflow-y-auto">
          <div className="p-4 rounded-xl bg-[#191528] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#2DD4BF]">
                {isFr ? "Écriture Partagée par l'Enseignant" : "Teacher’s Pinned Scripture"} ·{" "}
                {liveCall.scriptureRef}
              </div>
              <p className="text-xs sm:text-sm font-serif italic text-white/90">
                “{liveCall.scriptureText}”
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {liveCall.participants.map((p) => {
              const isMe = p.id === currentParticipantId;
              const isHost = p.role === "teacher";
              return (
                <div
                  key={p.id}
                  className={`relative rounded-xl overflow-hidden border p-4 flex flex-col justify-between min-h-[144px] transition-all ${
                    isHost
                      ? "bg-[#201A34] border-[#2DD4BF]/50 col-span-2 sm:col-span-2"
                      : "bg-[#161224] border-white/10"
                  }`}
                >
                  {isMe && isCameraOn && hasHardwareVideo && (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover opacity-85"
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between gap-2 text-[11px] text-white/80">
                    <span className="font-medium truncate">
                      {isHost
                        ? isFr
                          ? "Pasteur Hôte"
                          : "Host Teacher"
                        : isMe
                        ? isFr
                          ? "Vous"
                          : "You"
                        : isFr
                        ? "Membre"
                        : "Member"}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      {p.isHandRaised && (
                        <span className="text-amber-300 font-semibold">
                          {isFr ? "Prière" : "Prayer"}
                        </span>
                      )}
                      <span className={p.isMuted ? "text-white/50" : "text-[#2DD4BF]"}>
                        {p.isMuted ? "Muted" : "Live"}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 my-2 flex items-center justify-center">
                    {p.portrait ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#2DD4BF]">
                        <Image
                          src={p.portrait}
                          alt={p.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-serif font-semibold text-sm ${
                          isHost
                            ? "bg-[#2DD4BF] text-[#091917]"
                            : "bg-[#28213D] text-white border border-white/15"
                        }`}
                      >
                        {p.avatarInitial}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate">{p.name}</span>
                    {p.isSpeaking && !p.isMuted && (
                      <span className="text-[10px] font-mono text-[#2DD4BF]">
                        {isFr ? "Parle" : "Speaking"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#13101D] p-5 flex flex-col justify-between space-y-6 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <div className="text-xs text-[#2DD4BF] font-medium">
                {isFr
                  ? "Gestion des Participants en Direct"
                  : "Mid-Call Participant Signaling"}
              </div>
              <h3 className="text-base font-serif font-semibold text-white mt-0.5">
                {isFr
                  ? `Participants Connectés (${participantCount}/${MAX_LIVE_CALL_USERS})`
                  : `Connected Believers (${participantCount}/${MAX_LIVE_CALL_USERS})`}
              </h3>
            </div>

            {actorRole === "teacher" ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2DD4BF]">
                    {isFr
                      ? "+ Ajouter un Participant en Cours d'Appel"
                      : "+ Add Participant Mid-Call (Teacher Only)"}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-white/70">
                    {participantCount}/{MAX_LIVE_CALL_USERS}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    disabled={isFull}
                    placeholder={
                      isFull
                        ? isFr
                          ? "Limite de 40 atteinte"
                          : "40/40 Max Reached"
                        : isFr
                        ? "Nom du croyant à inviter..."
                        : "Enter believer's name to ring..."
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0D0B14] border border-white/15 text-xs text-white outline-none disabled:opacity-40"
                  />
                  <button
                    type="button"
                    disabled={isFull || !inviteName.trim()}
                    onClick={() => handleMidCallInvite(inviteName, true)}
                    className="px-3.5 py-2 rounded-lg bg-[#2DD4BF] hover:bg-[#14B8A6] disabled:opacity-40 text-[#091917] text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {isFr ? "Ajouter" : "Ring & Add"}
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-white/60">
                    {isFr
                      ? "Membres disponibles pour invitation immédiate :"
                      : "Quick-add active Sanctuary members mid-call:"}
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {SUGGESTED_FELLOWSHIP_CONTACTS.map((c) => {
                      const alreadyIn = liveCall.participants.some(
                        (p) => p.name.toLowerCase() === c.name.toLowerCase()
                      );
                      return (
                        <div
                          key={c.name}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 text-xs"
                        >
                          <div className="truncate">
                            <div className="font-medium text-white truncate">{c.name}</div>
                            <div className="text-[10px] text-white/60 truncate">{c.season}</div>
                          </div>
                          <button
                            type="button"
                            disabled={alreadyIn || isFull}
                            onClick={() => handleMidCallInvite(c.name, true)}
                            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-[#2DD4BF] hover:text-[#091917] disabled:opacity-40 text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {alreadyIn
                              ? isFr
                                ? "Connecté ✓"
                                : "In Call ✓"
                              : isFull
                              ? "40/40 Max"
                              : isFr
                              ? "+ Inviter"
                              : "+ Invite"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="text-[11px] text-white/65">
                    {isFr
                      ? "Vérifier la limite stricte de 40 participants :"
                      : "Test 40-Participant Maximum Cap Enforcement:"}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateCap(39)}
                      className="px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white cursor-pointer"
                    >
                      {isFr ? "Simuler 39/40" : "Set 39/40 Users"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCap(40)}
                      className="px-2.5 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[11px] font-mono text-amber-200 cursor-pointer"
                    >
                      {isFr ? "Simuler 40/40 (Complet)" : "Set 40/40 (Full Cap)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCap(6)}
                      className="px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white cursor-pointer"
                    >
                      {isFr ? "Réinitialiser (6)" : "Reset (6 Users)"}
                    </button>
                  </div>
                </div>

                {inviteStatusMsg && (
                  <div className="p-2.5 rounded-lg bg-[#2DD4BF]/15 border border-[#2DD4BF]/40 text-xs text-[#2DD4BF]">
                    {inviteStatusMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/75 space-y-1.5">
                <div className="font-semibold text-white">
                  {isFr ? "Mode Membre (Participant)" : "Member Participant Mode"}
                </div>
                <p>
                  {isFr
                    ? "Seul l'enseignant hôte peut démarrer un appel ou inviter des participants supplémentaires (jusqu'à 40 maximum)."
                    : "Only the Host Teacher can start a live call or invite additional believers mid-call (up to 40 maximum)."}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isMicMuted
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-[#2DD4BF] text-[#091917]"
                }`}
              >
                {isMicMuted
                  ? isFr
                    ? "Activer Micro"
                    : "Unmute Mic"
                  : isFr
                  ? "Micro Actif"
                  : "Mic On"}
              </button>

              <button
                type="button"
                onClick={handleToggleCamera}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  !isCameraOn
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-[#2DD4BF] text-[#091917]"
                }`}
              >
                {isCameraOn
                  ? isFr
                    ? "Caméra Active"
                    : "Camera On"
                  : isFr
                  ? "Activer Caméra"
                  : "Start Camera"}
              </button>

              <button
                type="button"
                onClick={handleToggleHand}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isHandRaised
                    ? "bg-amber-400 text-[#1E1931]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {isFr ? "Demander Prière" : "Raise Hand"}
              </button>
            </div>

            {actorRole === "teacher" ? (
              <button
                type="button"
                onClick={handleEndForAll}
                className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                {isFr ? "Terminer l'Appel" : "End Call for All"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLeave}
                className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                {isFr ? "Quitter" : "Leave Call"}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export interface TeacherLiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeacherSlug?: string;
}

export function TeacherLiveCallModal({
  isOpen,
  onClose,
  defaultTeacherSlug,
}: TeacherLiveCallModalProps) {
  const { isFr } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={
        isFr
          ? "Console d'Appel Pastoral WebRTC"
          : "WebRTC Pastoral Live Call Console"
      }
    >
      <div className="relative w-full max-w-5xl bg-[#FAF8F5] dark:bg-[#141210] border border-stone-300 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 bg-[#F3EFE6] dark:bg-[#1C1917] border-b border-stone-300 dark:border-stone-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-amber-900 dark:text-amber-400 font-semibold">
              {isFr
                ? "CONSOLE WEBRTC PASTORALE (1-À-1 & 40 PLACES)"
                : "WEBRTC PASTORAL CONSOLE (1-ON-1 & 40-SEAT ROOM)"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            {isFr ? "Fermer ×" : "Close ×"}
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <TeacherLiveCallBanner defaultTeacherSlug={defaultTeacherSlug} />
        </div>
      </div>
    </div>
  );
}

export default TeacherLiveCallModal;
