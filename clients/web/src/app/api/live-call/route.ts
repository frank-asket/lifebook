import { NextResponse } from "next/server";

export const MAX_LIVE_CALL_PARTICIPANTS = 40;

export interface LiveCallParticipant {
  id: string;
  name: string;
  role: "teacher" | "pilgrim";
  teacherTitle?: string;
  avatarInitial: string;
  portrait?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  joinedAt: string;
}

export interface MidCallInvitation {
  id: string;
  roomId: string;
  inviteeName: string;
  inviteeEmail?: string;
  inviterTeacherName: string;
  inviterTeacherSlug: string;
  topic: string;
  createdAt: string;
  status: "ringing" | "accepted" | "declined";
}

export interface WebRTCSignalCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  fromRole: "teacher" | "pilgrim";
  createdAt: string;
}

export interface OneOnOneWebRTCSession {
  sessionId: string;
  roomId: string;
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
  status: "ringing" | "connecting" | "connected" | "ended";
  startedAt: string;
  connectedAt?: string;
  teacherMicMuted: boolean;
  userMicMuted: boolean;
  teacherMicPermission: "granted" | "denied" | "prompt" | "fallback";
  userMicPermission: "granted" | "denied" | "prompt" | "fallback";
  sdpOffer?: { type: "offer"; sdp: string };
  sdpAnswer?: { type: "answer"; sdp: string };
  iceCandidates: WebRTCSignalCandidate[];
  audioCodec: string;
}

export interface ActiveTeacherLiveCall {
  roomId: string;
  hostTeacherSlug: string;
  hostTeacherName: string;
  hostTeacherTitle: string;
  hostTeacherPortrait: string;
  topic: string;
  scriptureRef: string;
  scriptureText: string;
  callMode: "video-fellowship" | "audio-prayer-circle" | "one-on-one-audio";
  maxParticipants: number;
  startedAt: string;
  isActive: boolean;
  participants: LiveCallParticipant[];
  pendingInvitations: MidCallInvitation[];
  activeOneOnOneSession?: OneOnOneWebRTCSession | null;
}

// Server-authoritative in-memory state seeded with an active Teacher Call and ready for 1-on-1 WebRTC sessions
let currentLiveCall: ActiveTeacherLiveCall | null = {
  roomId: "room-sanctuary-psalm23",
  hostTeacherSlug: "pastor-asket",
  hostTeacherName: "Pastor Asket",
  hostTeacherTitle: "Senior Pastor & Founder",
  hostTeacherPortrait: "/AsketOfficialPic (1).png",
  topic: "Abiding in Still Waters: Mid-Week Scripture & Prayer Fellowship",
  scriptureRef: "Psalm 23:1-3",
  scriptureText:
    "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
  callMode: "video-fellowship",
  maxParticipants: MAX_LIVE_CALL_PARTICIPANTS,
  startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  isActive: true,
  participants: [
    {
      id: "teacher-pastor-asket",
      name: "Pastor Asket",
      role: "teacher",
      teacherTitle: "Host Teacher · Senior Pastor",
      avatarInitial: "A",
      portrait: "/AsketOfficialPic (1).png",
      isMuted: false,
      isVideoOn: true,
      isHandRaised: false,
      isSpeaking: true,
      joinedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: "pilgrim-claire-m",
      name: "Claire Moreau",
      role: "pilgrim",
      avatarInitial: "C",
      isMuted: true,
      isVideoOn: true,
      isHandRaised: false,
      isSpeaking: false,
      joinedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    },
    {
      id: "pilgrim-david-k",
      name: "David Kouassi",
      role: "pilgrim",
      avatarInitial: "D",
      isMuted: true,
      isVideoOn: false,
      isHandRaised: true,
      isSpeaking: false,
      joinedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    },
    {
      id: "pilgrim-sarah-l",
      name: "Sarah Lindqvist",
      role: "pilgrim",
      avatarInitial: "S",
      isMuted: true,
      isVideoOn: true,
      isHandRaised: false,
      isSpeaking: false,
      joinedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "pilgrim-emmanuel-t",
      name: "Emmanuel T.",
      role: "pilgrim",
      avatarInitial: "E",
      isMuted: false,
      isVideoOn: false,
      isHandRaised: false,
      isSpeaking: false,
      joinedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
  ],
  pendingInvitations: [],
  activeOneOnOneSession: null,
};

export async function GET() {
  return NextResponse.json({
    call: currentLiveCall,
    maxParticipants: MAX_LIVE_CALL_PARTICIPANTS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "initiate-1on1-call") {
      if (body.actorRole !== "teacher" || !body.hostTeacherSlug || !body.hostTeacherName) {
        return NextResponse.json(
          {
            error:
              "Only appointed LifeBook Teachers can initiate a 1-on-1 WebRTC Pastoral Audio Session.",
          },
          { status: 403 }
        );
      }

      const session: OneOnOneWebRTCSession = {
        sessionId: `webrtc-1on1-${Date.now()}`,
        roomId: `room-1on1-${body.hostTeacherSlug}-${Date.now().toString().slice(-4)}`,
        hostTeacherSlug: body.hostTeacherSlug,
        hostTeacherName: body.hostTeacherName,
        hostTeacherTitle: body.hostTeacherTitle || "Appointed Pastoral Contributor",
        hostTeacherPortrait: body.hostTeacherPortrait || "/AsketOfficialPic (1).png",
        targetUserId: body.targetUserId || `pilgrim-${Date.now()}`,
        targetUserName: body.targetUserName || "Pilgrim Believer",
        targetUserEmail: body.targetUserEmail,
        scriptureRef: body.scriptureRef || "Psalm 23:1-3",
        scriptureText:
          body.scriptureText ||
          "The Lord is my shepherd; I shall not want. He leads me beside still waters. He restores my soul.",
        counselingTopic:
          body.counselingTopic || "1-on-1 Pastoral Prayer & Scripture Encouragement",
        status: body.autoConnectPeer ? "connected" : "ringing",
        startedAt: new Date().toISOString(),
        connectedAt: body.autoConnectPeer ? new Date().toISOString() : undefined,
        teacherMicMuted: false,
        userMicMuted: false,
        teacherMicPermission: body.teacherMicPermission || "granted",
        userMicPermission: body.userMicPermission || "granted",
        sdpOffer: body.sdpOffer,
        sdpAnswer: body.sdpAnswer,
        iceCandidates: Array.isArray(body.iceCandidates) ? body.iceCandidates : [],
        audioCodec: "Opus 48kHz / WebRTC SRTP (Echo Cancellation + Noise Suppression)",
      };

      if (!currentLiveCall) {
        currentLiveCall = {
          roomId: session.roomId,
          hostTeacherSlug: session.hostTeacherSlug,
          hostTeacherName: session.hostTeacherName,
          hostTeacherTitle: session.hostTeacherTitle,
          hostTeacherPortrait: session.hostTeacherPortrait,
          topic: session.counselingTopic,
          scriptureRef: session.scriptureRef,
          scriptureText: session.scriptureText,
          callMode: "one-on-one-audio",
          maxParticipants: MAX_LIVE_CALL_PARTICIPANTS,
          startedAt: session.startedAt,
          isActive: true,
          participants: [],
          pendingInvitations: [],
          activeOneOnOneSession: session,
        };
      } else {
        currentLiveCall.activeOneOnOneSession = session;
      }

      return NextResponse.json({
        call: currentLiveCall,
        oneOnOneSession: session,
      });
    }

    if (action === "answer-1on1-call") {
      if (!currentLiveCall?.activeOneOnOneSession) {
        return NextResponse.json(
          { error: "No active 1-on-1 pastoral audio call to answer." },
          { status: 404 }
        );
      }

      const session = currentLiveCall.activeOneOnOneSession;
      session.status = "connected";
      session.connectedAt = new Date().toISOString();
      if (body.userMicPermission) {
        session.userMicPermission = body.userMicPermission;
      }
      if (body.sdpAnswer) {
        session.sdpAnswer = body.sdpAnswer;
      }
      if (Array.isArray(body.iceCandidates)) {
        session.iceCandidates = [...session.iceCandidates, ...body.iceCandidates];
      }

      return NextResponse.json({
        call: currentLiveCall,
        oneOnOneSession: session,
      });
    }

    if (action === "signal-1on1-webrtc") {
      if (!currentLiveCall?.activeOneOnOneSession) {
        return NextResponse.json({ error: "No active 1-on-1 session." }, { status: 404 });
      }
      const session = currentLiveCall.activeOneOnOneSession;
      if (body.sdpOffer) session.sdpOffer = body.sdpOffer;
      if (body.sdpAnswer) {
        session.sdpAnswer = body.sdpAnswer;
        session.status = "connected";
        if (!session.connectedAt) session.connectedAt = new Date().toISOString();
      }
      if (body.candidate) {
        session.iceCandidates.push({
          candidate: body.candidate.candidate || "",
          sdpMid: body.candidate.sdpMid ?? null,
          sdpMLineIndex: body.candidate.sdpMLineIndex ?? null,
          fromRole: body.fromRole === "teacher" ? "teacher" : "pilgrim",
          createdAt: new Date().toISOString(),
        });
      }
      if (typeof body.teacherMicMuted === "boolean") {
        session.teacherMicMuted = body.teacherMicMuted;
      }
      if (typeof body.userMicMuted === "boolean") {
        session.userMicMuted = body.userMicMuted;
      }
      if (body.teacherMicPermission) {
        session.teacherMicPermission = body.teacherMicPermission;
      }
      if (body.userMicPermission) {
        session.userMicPermission = body.userMicPermission;
      }
      return NextResponse.json({
        call: currentLiveCall,
        oneOnOneSession: session,
      });
    }

    if (action === "end-1on1-call") {
      if (currentLiveCall?.activeOneOnOneSession) {
        currentLiveCall.activeOneOnOneSession.status = "ended";
        currentLiveCall.activeOneOnOneSession = null;
      }
      return NextResponse.json({
        call: currentLiveCall,
        oneOnOneSession: null,
      });
    }

    if (action === "start-call") {
      // STRICT RULE: Only an appointed Teacher can start a live call
      if (body.actorRole !== "teacher" || !body.hostTeacherSlug || !body.hostTeacherName) {
        return NextResponse.json(
          {
            error:
              "Only appointed LifeBook Teachers can start a Live Sanctuary Call (maximum 40 participants).",
          },
          { status: 403 }
        );
      }

      const hostId = `teacher-${body.hostTeacherSlug}`;
      currentLiveCall = {
        roomId: `room-${body.hostTeacherSlug}-${Date.now().toString().slice(-5)}`,
        hostTeacherSlug: body.hostTeacherSlug,
        hostTeacherName: body.hostTeacherName,
        hostTeacherTitle: body.hostTeacherTitle || "Appointed Pastoral Contributor",
        hostTeacherPortrait: body.hostTeacherPortrait || "/AsketOfficialPic (1).png",
        topic: body.topic || "Live Scripture Exposition & Prayer Circle",
        scriptureRef: body.scriptureRef || "John 15:4-5",
        scriptureText:
          body.scriptureText ||
          "Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me.",
        callMode:
          body.callMode === "audio-prayer-circle"
            ? "audio-prayer-circle"
            : body.callMode === "one-on-one-audio"
            ? "one-on-one-audio"
            : "video-fellowship",
        maxParticipants: MAX_LIVE_CALL_PARTICIPANTS,
        startedAt: new Date().toISOString(),
        isActive: true,
        participants: [
          {
            id: hostId,
            name: body.hostTeacherName,
            role: "teacher",
            teacherTitle: body.hostTeacherTitle || "Host Teacher",
            avatarInitial: (body.hostTeacherName[0] || "T").toUpperCase(),
            portrait: body.hostTeacherPortrait || "/AsketOfficialPic (1).png",
            isMuted: false,
            isVideoOn: true,
            isHandRaised: false,
            isSpeaking: true,
            joinedAt: new Date().toISOString(),
          },
        ],
        pendingInvitations: [],
        activeOneOnOneSession: currentLiveCall?.activeOneOnOneSession || null,
      };

      return NextResponse.json({ call: currentLiveCall });
    }

    if (action === "join-call") {
      if (!currentLiveCall || !currentLiveCall.isActive) {
        return NextResponse.json(
          { error: "There is no active Teacher Live Call right now." },
          { status: 404 }
        );
      }

      const participantId = String(body.participantId || `pilgrim-${Date.now()}`);
      const existing = currentLiveCall.participants.find((p) => p.id === participantId);
      if (existing) {
        return NextResponse.json({ call: currentLiveCall, joined: existing });
      }

      if (currentLiveCall.participants.length >= MAX_LIVE_CALL_PARTICIPANTS) {
        return NextResponse.json(
          {
            error: `This Live Sanctuary Call has reached its maximum capacity of ${MAX_LIVE_CALL_PARTICIPANTS} participants.`,
          },
          { status: 409 }
        );
      }

      const newParticipant: LiveCallParticipant = {
        id: participantId,
        name: body.participantName || "Pilgrim Believer",
        role: body.role === "teacher" ? "teacher" : "pilgrim",
        avatarInitial: ((body.participantName || "P")[0] || "P").toUpperCase(),
        isMuted: body.isMuted ?? true,
        isVideoOn: body.isVideoOn ?? true,
        isHandRaised: false,
        isSpeaking: false,
        joinedAt: new Date().toISOString(),
      };

      currentLiveCall.participants.push(newParticipant);
      return NextResponse.json({ call: currentLiveCall, joined: newParticipant });
    }

    if (action === "leave-call") {
      if (!currentLiveCall) {
        return NextResponse.json({ call: null });
      }
      const participantId = String(body.participantId || "");
      currentLiveCall.participants = currentLiveCall.participants.filter(
        (p) => p.id !== participantId
      );
      return NextResponse.json({ call: currentLiveCall });
    }

    if (action === "invite-participant") {
      // Teacher-only mid-call dynamic invitation (WhatsApp-style add-participant)
      if (!currentLiveCall || !currentLiveCall.isActive) {
        return NextResponse.json({ error: "No active live call." }, { status: 404 });
      }
      if (body.actorRole !== "teacher") {
        return NextResponse.json(
          { error: "Only the Host Teacher can invite or add participants mid-call." },
          { status: 403 }
        );
      }
      if (currentLiveCall.participants.length >= MAX_LIVE_CALL_PARTICIPANTS) {
        return NextResponse.json(
          {
            error: `Cannot invite more participants: Maximum limit of ${MAX_LIVE_CALL_PARTICIPANTS} users reached.`,
          },
          { status: 409 }
        );
      }

      const invite: MidCallInvitation = {
        id: `inv-${Date.now()}`,
        roomId: currentLiveCall.roomId,
        inviteeName: body.inviteeName || "Believer",
        inviteeEmail: body.inviteeEmail,
        inviterTeacherName: currentLiveCall.hostTeacherName,
        inviterTeacherSlug: currentLiveCall.hostTeacherSlug,
        topic: currentLiveCall.topic,
        createdAt: new Date().toISOString(),
        status: "ringing",
      };

      currentLiveCall.pendingInvitations = [
        invite,
        ...currentLiveCall.pendingInvitations.slice(0, 9),
      ];

      // If autoJoin is requested (e.g. adding from contact directory), add participant directly if < 40
      if (body.autoConnect && currentLiveCall.participants.length < MAX_LIVE_CALL_PARTICIPANTS) {
        const pId = `invited-${invite.inviteeName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        if (!currentLiveCall.participants.some((p) => p.id === pId)) {
          currentLiveCall.participants.push({
            id: pId,
            name: invite.inviteeName,
            role: "pilgrim",
            avatarInitial: (invite.inviteeName[0] || "B").toUpperCase(),
            isMuted: true,
            isVideoOn: true,
            isHandRaised: false,
            isSpeaking: false,
            joinedAt: new Date().toISOString(),
          });
        }
        invite.status = "accepted";
      }

      return NextResponse.json({ call: currentLiveCall, invitation: invite });
    }

    if (action === "toggle-participant-state") {
      if (!currentLiveCall) {
        return NextResponse.json({ call: null });
      }
      const { participantId, isMuted, isVideoOn, isHandRaised } = body;
      currentLiveCall.participants = currentLiveCall.participants.map((p) => {
        if (p.id !== participantId) return p;
        return {
          ...p,
          isMuted: typeof isMuted === "boolean" ? isMuted : p.isMuted,
          isVideoOn: typeof isVideoOn === "boolean" ? isVideoOn : p.isVideoOn,
          isHandRaised: typeof isHandRaised === "boolean" ? isHandRaised : p.isHandRaised,
        };
      });
      return NextResponse.json({ call: currentLiveCall });
    }

    if (action === "simulate-capacity") {
      if (!currentLiveCall || body.actorRole !== "teacher") {
        return NextResponse.json({ error: "Teacher role required" }, { status: 403 });
      }
      const targetCount = Math.min(
        MAX_LIVE_CALL_PARTICIPANTS,
        Math.max(1, Number(body.targetCount) || 39)
      );
      const sampleNames = [
        "Miriam Okafor", "Jean-Baptiste L.", "Hannah Mensah", "Lucas Vance", "Grace Kim",
        "Samuel Adeyemi", "Chloe Tremblay", "Daniel Boateng", "Esther Ndiaye", "Caleb Wright",
        "Naomi Diop", "Jared Miller", "Ruth Kamau", "Micah Chen", "Lydia Laurent",
        "Josiah Brooks", "Abigail Owusu", "Gideon Park", "Deborah Silva", "Ezra Foster",
        "Priscilla Tan", "Solomon B.", "Martha K.", "Timothy G.", "Phoebe R.",
        "Titus W.", "Rebekah H.", "Silas M.", "Tabitha J.", "Barnabas C.",
        "Lois D.", "Eunice F.", "Apollos N.", "Aquila P.", "Lazarus V.",
        "Mary Magdalene", "Stephen T.", "Philip S.", "Cornelius R.", "Lydia M.",
      ];
      while (currentLiveCall.participants.length < targetCount) {
        const idx = currentLiveCall.participants.length;
        const name = sampleNames[idx % sampleNames.length] + (idx > 30 ? ` #${idx}` : "");
        currentLiveCall.participants.push({
          id: `pilgrim-sim-${idx}`,
          name,
          role: "pilgrim",
          avatarInitial: name[0].toUpperCase(),
          isMuted: true,
          isVideoOn: idx % 3 !== 0,
          isHandRaised: idx % 9 === 0,
          isSpeaking: false,
          joinedAt: new Date().toISOString(),
        });
      }
      if (currentLiveCall.participants.length > targetCount) {
        currentLiveCall.participants = currentLiveCall.participants.slice(0, targetCount);
      }
      return NextResponse.json({ call: currentLiveCall });
    }

    if (action === "end-call") {
      if (body.actorRole !== "teacher") {
        return NextResponse.json(
          { error: "Only the Host Teacher can end the Live Sanctuary Call." },
          { status: 403 }
        );
      }
      if (currentLiveCall) {
        currentLiveCall.isActive = false;
      }
      return NextResponse.json({ call: currentLiveCall });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
