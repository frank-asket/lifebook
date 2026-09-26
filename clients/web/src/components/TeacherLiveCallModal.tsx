"use client";

import React, { useState, useEffect, useRef } from "react";
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
  MAX_LIVE_CALL_USERS,
  LIVE_CALL_EVENT,
  type ActiveTeacherLiveCall,
  type MidCallInvitation,
} from "@/lib/live-call";

const SUGGESTED_FELLOWSHIP_CONTACTS = [
  { name: "Grace Mensah", season: "Morning Prayer Circle · Accra" },
  { name: "Jean-Marc Dubois", season: "Psalm 23 Study Group · Paris" },
  { name: "Hannah Okafor", season: "Young Professionals Fellowship · London" },
  { name: "Samuel Lindqvist", season: "Contemplative Stillness · Stockholm" },
  { name: "Ruth Adeyemi", season: "Sabbath Rest Cohort · Toronto" },
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
    defaultTeacherSlug ? "teacher" : "pilgrim"
  );
  const [selectedTeacherSlug, setSelectedTeacherSlug] = useState<string>(
    defaultTeacherSlug || "pastor-asket"
  );

  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<MidCallInvitation | null>(null);

  // Start Call Form State (Teacher Only)
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
      {/* Incoming WhatsApp-Style Mid-Call Ring Notification Banner */}
      {incomingInvite && incomingInvite.status === "ringing" && !isRoomOpen && (
        <div className="mb-4 rounded-2xl bg-[#162726] text-white border border-[#4EE2D8]/40 p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#1FB6B0] text-[#081C1B] font-bold flex items-center justify-center text-sm shrink-0">
              📞
            </span>
            <div>
              <div className="text-xs font-mono text-[#4EE2D8]">
                {isFr
                  ? "Appel Sanctuaire en direct · Invitation en cours d'appel"
                  : "Incoming Live Sanctuary Call · Mid-Call Teacher Invitation"}
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {isFr
                  ? `${incomingInvite.inviterTeacherName} invite « ${incomingInvite.inviteeName} » à rejoindre « ${incomingInvite.topic} »`
                  : `${incomingInvite.inviterTeacherName} is inviting “${incomingInvite.inviteeName}” to join “${incomingInvite.topic}”`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleJoinCall}
              disabled={isFull && !isAlreadyInCall}
              className="px-4 py-2 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] disabled:opacity-40 text-[#081C1B] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isFr ? "Accepter & Rejoindre" : "Accept & Join Call"}
            </button>
            <button
              type="button"
              onClick={() => setIncomingInvite(null)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isFr ? "Ignorer" : "Decline"}
            </button>
          </div>
        </div>
      )}

      {/* Main Live Call Sanctuary Card */}
      <div
        className={`rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/12 dark:border-white/15 ${
          compact ? "p-5" : "p-6 sm:p-7"
        } shadow-sm space-y-5`}
      >
        {/* Top Row: Status + Role Switcher for Testing Teacher vs Pilgrim Permissions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2D2542]/10 dark:border-white/12">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A506B] dark:text-[#C8C2D6]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0E726D] dark:text-[#4EE2D8]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span>
                  {liveCall?.isActive
                    ? isFr
                      ? "En direct maintenant"
                      : "Live Sanctuary Call Active"
                    : isFr
                    ? "Salle de Communion Pastorale"
                    : "Pastoral Fellowship Room"}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-semibold text-[#1E1931] dark:text-white">
                {participantCount} / {MAX_LIVE_CALL_USERS}{" "}
                {isFr ? "Participants (Max 40)" : "Participants (40 Max)"}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isFr
                  ? "Création d'appel réservée aux enseignants"
                  : "Host Creation: Teachers Only"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1931] dark:text-white">
              {liveCall?.isActive
                ? liveCall.topic
                : isFr
                ? "Appel en Direct des Pasteurs & Enseignants (Max 40 Croyants)"
                : "Teacher-Hosted Live Sanctuary Call (40 Users Maximum)"}
            </h2>
          </div>

          {/* Interactive Role Selector to Verify Teacher-Only Call Creation vs Pilgrim Join */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F2ECE1] dark:bg-[#120E22] border border-[#2D2542]/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActorRole("pilgrim");
                  setErrorBanner(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  actorRole === "pilgrim"
                    ? "bg-white dark:bg-[#2D2542] text-[#1E1931] dark:text-white shadow-xs"
                    : "text-[#5A506B] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
                }`}
              >
                {isFr ? "Vue Membre (Rejoindre seul.)" : "Member View (Join Only)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActorRole("teacher");
                  setErrorBanner(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  actorRole === "teacher"
                    ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                    : "text-[#5A506B] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
                }`}
              >
                {isFr ? "Mode Enseignant (Peut Démarrer)" : "Teacher Mode (Can Start Call)"}
              </button>
            </div>
          </div>
        </div>

        {/* Error / Permission Notice */}
        {errorBanner && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/70 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between gap-3">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-xs font-bold underline cursor-pointer shrink-0"
            >
              {isFr ? "Fermer" : "Dismiss"}
            </button>
          </div>
        )}

        {/* Active Call Details & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {liveCall?.isActive ? (
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#2D2542]/15 dark:border-white/20 shrink-0 bg-[#E8DFCF]">
                <Image
                  src={liveCall.hostTeacherPortrait || "/AsketOfficialPic (1).png"}
                  alt={liveCall.hostTeacherName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                  <strong className="text-[#1E1931] dark:text-white font-semibold">
                    {liveCall.hostTeacherName}
                  </strong>
                  <span aria-hidden="true">·</span>
                  <span>{liveCall.hostTeacherTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#0E726D] dark:text-[#4EE2D8] font-semibold">
                    {liveCall.scriptureRef}
                  </span>
                </div>
                <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] line-clamp-2 max-w-2xl">
                  “{liveCall.scriptureText}”
                </p>
                {/* Capacity Progress Bar */}
                <div className="pt-1 flex items-center gap-3">
                  <div className="w-44 h-2 rounded-full bg-[#ECE5D8] dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? "bg-[#DC2626]" : "bg-[#1FB6B0]"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((participantCount / MAX_LIVE_CALL_USERS) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#5A506B] dark:text-[#C8C2D6]">
                    {MAX_LIVE_CALL_USERS - participantCount}{" "}
                    {isFr ? "places disponibles sur 40" : "of 40 seats remaining"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#5A506B] dark:text-[#C8C2D6] max-w-xl">
              {isFr
                ? "Aucun appel en direct n'est ouvert. Seul un pasteur ou enseignant choisi par la direction de LifeBook peut lancer un appel en direct (jusqu'à 40 participants maximum)."
                : "No live call is currently active. Only a Pastor or Teacher appointed by LifeBook leadership can start a live call (up to 40 participants maximum)."}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {liveCall?.isActive && (
              <button
                type="button"
                onClick={handleJoinCall}
                disabled={isFull && !isAlreadyInCall}
                className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] disabled:opacity-40 text-[#081C1B] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isAlreadyInCall
                  ? isFr
                    ? "Ouvrir l'Appel en Direct →"
                    : "Return to Live Call Room →"
                  : isFull
                  ? isFr
                    ? "Salle Complète (40/40 Max)"
                    : "Call Full (40/40 Max)"
                  : isFr
                  ? `Rejoindre l'Appel (${participantCount}/40)`
                  : `Join Teacher's Call (${participantCount}/40)`}
              </button>
            )}

            {/* Teacher-Only Start Live Call Button */}
            <button
              type="button"
              onClick={handleAttemptStartCall}
              className={`min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap border ${
                actorRole === "teacher"
                  ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-transparent hover:opacity-95"
                  : "bg-[#FAF8F5] dark:bg-white/5 text-[#6E6285] dark:text-[#A9A0BC] border-[#2D2542]/15 dark:border-white/15 hover:border-[#2D2542]/30"
              }`}
            >
              {actorRole === "teacher"
                ? isFr
                  ? "🎥 Démarrer un Appel en Direct (Max 40)"
                  : "🎥 Start Live Call (Teacher · 40 Max)"
                : isFr
                ? "🔒 Démarrer un Appel (Enseignant Uniquement)"
                : "🔒 Start Live Call (Teacher Only)"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Teacher-Only Start Live Call Configuration */}
      {isStartModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsStartModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#19142B] border border-[#2D2542]/15 dark:border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-[#0E726D] dark:text-[#4EE2D8] font-semibold">
                  {isFr
                    ? "Portail des Enseignants · Maximum 40 Participants"
                    : "Teacher Host Controls · 40 Participants Maximum"}
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white mt-1">
                  {isFr
                    ? "Démarrer un Appel Sanctuaire en Direct"
                    : "Start a Teacher-Hosted Live Call"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStartModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F2ECE1] dark:bg-white/10 text-[#1E1931] dark:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmStartCall} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2542] dark:text-[#D5CEE6] mb-1">
                  {isFr ? "Pasteur / Enseignant Hôte" : "Host Pastor / Teacher"}
                </label>
                <select
                  value={selectedTeacherSlug}
                  onChange={(e) => setSelectedTeacherSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#2D2542]/15 dark:border-white/15 text-xs font-semibold text-[#1E1931] dark:text-white outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} — {isFr ? t.titleFr : t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2542] dark:text-[#D5CEE6] mb-1">
                  {isFr ? "Sujet de l'enseignement ou de la prière" : "Live Teaching or Prayer Topic"}
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#2D2542]/15 dark:border-white/15 text-xs text-[#1E1931] dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2542] dark:text-[#D5CEE6] mb-1">
                    {isFr ? "Passage Biblique" : "Anchor Scripture Reference"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newScriptureRef}
                    onChange={(e) => setNewScriptureRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#2D2542]/15 dark:border-white/15 text-xs text-[#1E1931] dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D2542] dark:text-[#D5CEE6] mb-1">
                    {isFr ? "Format & Capacité" : "Format & Capacity Limit"}
                  </label>
                  <select
                    value={newCallMode}
                    onChange={(e) =>
                      setNewCallMode(
                        e.target.value as "video-fellowship" | "audio-prayer-circle"
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#2D2542]/15 dark:border-white/15 text-xs font-semibold text-[#1E1931] dark:text-white outline-none"
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
                <label className="block text-xs font-bold text-[#2D2542] dark:text-[#D5CEE6] mb-1">
                  {isFr ? "Texte du Verset Partagé à l'Écran" : "Shared On-Screen Scripture Text"}
                </label>
                <textarea
                  rows={2}
                  value={newScriptureText}
                  onChange={(e) => setNewScriptureText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#2D2542]/15 dark:border-white/15 text-xs text-[#1E1931] dark:text-white outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#F2ECE1]/70 dark:bg-white/5 text-xs text-[#5A506B] dark:text-[#C8C2D6] flex items-center justify-between">
                <span>
                  {isFr
                    ? "Capacité maximale stricte de la salle SFU :"
                    : "Strict SFU Room Participant Cap:"}
                </span>
                <strong className="font-mono tabular-nums text-[#1E1931] dark:text-white">
                  40 {isFr ? "Utilisateurs Maximum" : "Users Maximum"}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6] cursor-pointer"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] text-[#081C1B] text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  {isFr
                    ? "Lancer l'Appel en Direct (Max 40)"
                    : "Launch Live Sanctuary Call (40 Max)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Active WebRTC + SFU Live Call Room */}
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

  // Mid-Call Invite Drawer State (WhatsApp-style Add Participant)
  const [inviteName, setInviteName] = useState("");
  const [inviteStatusMsg, setInviteStatusMsg] = useState<string | null>(null);

  const participantCount = liveCall.participants.length;
  const isFull = participantCount >= MAX_LIVE_CALL_USERS;

  // Connect real WebRTC local camera/microphone stream when camera is toggled on
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
          // Graceful fallback to avatar card when camera hardware is unavailable in sandbox
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
    <div className="fixed inset-0 z-50 bg-[#0B0914]/95 text-white flex flex-col overflow-hidden">
      {/* Top Call Bar */}
      <header className="px-4 sm:px-8 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#120E20]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
          <div>
            <div className="flex items-center gap-2 text-xs text-white/75">
              <span className="font-semibold text-[#4EE2D8]">{liveCall.hostTeacherName}</span>
              <span aria-hidden="true">·</span>
              <span>{liveCall.scriptureRef}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-bold text-white">
                {participantCount} / {MAX_LIVE_CALL_USERS}{" "}
                {isFr ? "Participants" : "Participants"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-white">
              {liveCall.topic}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-mono tabular-nums font-bold ${
              isFull
                ? "bg-[#DC2626]/20 text-[#FCA5A5] border border-[#DC2626]/40"
                : "bg-white/10 text-[#4EE2D8]"
            }`}
          >
            {isFull
              ? isFr
                ? "COMPLET · 40 / 40 MAX"
                : "ROOM FULL · 40 / 40 MAX"
              : `${MAX_LIVE_CALL_USERS - participantCount} ${
                  isFr ? "places libres (Max 40)" : "seats open (40 Max)"
                }`}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            {isFr ? "Réduire" : "Minimize"}
          </button>
        </div>
      </header>

      {/* Main Call Body: Left Video/Avatar Grid + Right Teacher Mid-Call Invite & Scripture Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        {/* Left 8 Columns: Shared Scripture Banner + Participant Video/Audio Grid */}
        <div className="lg:col-span-8 p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Pinned Scripture Card */}
          <div className="p-4 rounded-2xl bg-[#1A142D] border border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#FFD770] font-semibold">
                📖 {isFr ? "Écriture Partagée par l'Enseignant" : "Teacher’s Pinned Scripture"} ·{" "}
                {liveCall.scriptureRef}
              </div>
              <p className="text-xs sm:text-sm font-serif italic text-white/90">
                “{liveCall.scriptureText}”
              </p>
            </div>
          </div>

          {/* Participant Stream Grid (Up to 40 Participants) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {liveCall.participants.map((p) => {
              const isMe = p.id === currentParticipantId;
              const isHost = p.role === "teacher";
              return (
                <div
                  key={p.id}
                  className={`relative rounded-2xl overflow-hidden border p-4 flex flex-col justify-between min-h-[148px] transition-all ${
                    isHost
                      ? "bg-[#221A3A] border-[#4EE2D8]/60 col-span-2 sm:col-span-2"
                      : "bg-[#171229] border-white/10"
                  }`}
                >
                  {/* If this tile is current user and camera hardware is active, show real WebRTC video */}
                  {isMe && isCameraOn && hasHardwareVideo && (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover opacity-85"
                    />
                  )}

                  {/* Top Row inside Tile */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-white/90 truncate">
                      {isHost
                        ? isFr
                          ? "✝ Pasteur Hôte"
                          : "✝ Host Teacher"
                        : isMe
                        ? isFr
                          ? "Vous"
                          : "You"
                        : isFr
                        ? "Pèlerin"
                        : "Pilgrim"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {p.isHandRaised && (
                        <span
                          className="text-xs bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-md font-bold"
                          title="Hand raised for prayer"
                        >
                          ✋
                        </span>
                      )}
                      <span className="text-xs">
                        {p.isMuted ? "🔇" : "🎙️"}
                      </span>
                    </div>
                  </div>

                  {/* Center Avatar */}
                  <div className="relative z-10 my-2 flex items-center justify-center">
                    {p.portrait ? (
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#4EE2D8]">
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
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-serif font-bold text-sm ${
                          isHost
                            ? "bg-[#4EE2D8] text-[#081C1B]"
                            : "bg-[#2F254B] text-white border border-white/15"
                        }`}
                      >
                        {p.avatarInitial}
                      </div>
                    )}
                  </div>

                  {/* Bottom Name */}
                  <div className="relative z-10 flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate">{p.name}</span>
                    {p.isSpeaking && !p.isMuted && (
                      <span className="text-[10px] font-mono text-[#4EE2D8]">
                        {isFr ? "Parle" : "Speaking"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: WhatsApp-Style Mid-Call Add Participant (Teacher Only) & Roster */}
        <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#130F22] p-5 flex flex-col justify-between space-y-6 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <div className="text-xs font-mono text-[#4EE2D8] font-semibold">
                {isFr
                  ? "GESTION DES PARTICIPANTS EN DIRECT"
                  : "MID-CALL PARTICIPANT SIGNALING"}
              </div>
              <h3 className="text-base font-serif font-bold text-white mt-0.5">
                {isFr
                  ? `Participants Connectés (${participantCount}/${MAX_LIVE_CALL_USERS})`
                  : `Connected Believers (${participantCount}/${MAX_LIVE_CALL_USERS})`}
              </h3>
            </div>

            {/* Teacher-Only Mid-Call Invite Box (WhatsApp Add Experience) */}
            {actorRole === "teacher" ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/12 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4EE2D8]">
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
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0B0914] border border-white/15 text-xs text-white outline-none disabled:opacity-40"
                  />
                  <button
                    type="button"
                    disabled={isFull || !inviteName.trim()}
                    onClick={() => handleMidCallInvite(inviteName, true)}
                    className="px-3.5 py-2 rounded-xl bg-[#1FB6B0] hover:bg-[#199E99] disabled:opacity-40 text-[#081C1B] text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    {isFr ? "Ajouter" : "Ring & Add"}
                  </button>
                </div>

                {/* Quick Add Suggested Sanctuary Contacts */}
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
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 text-xs"
                        >
                          <div className="truncate">
                            <div className="font-semibold text-white truncate">{c.name}</div>
                            <div className="text-[10px] text-white/60 truncate">{c.season}</div>
                          </div>
                          <button
                            type="button"
                            disabled={alreadyIn || isFull}
                            onClick={() => handleMidCallInvite(c.name, true)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#1FB6B0] hover:text-[#081C1B] disabled:opacity-40 text-white text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
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

                {/* Capacity Simulator to Test 40-User Hard Cap */}
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
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white cursor-pointer"
                    >
                      {isFr ? "Simuler 39/40" : "Set 39/40 Users"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCap(40)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[11px] font-mono text-amber-200 cursor-pointer"
                    >
                      {isFr ? "Simuler 40/40 (Complet)" : "Set 40/40 (Full Cap)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCap(6)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white cursor-pointer"
                    >
                      {isFr ? "Réinitialiser (6)" : "Reset (6 Users)"}
                    </button>
                  </div>
                </div>

                {inviteStatusMsg && (
                  <div className="p-2.5 rounded-xl bg-[#1FB6B0]/15 border border-[#1FB6B0]/40 text-xs text-[#4EE2D8]">
                    {inviteStatusMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/75 space-y-1.5">
                <div className="font-bold text-white">
                  🔒 {isFr ? "Mode Pèlerin (Participant)" : "Member Participant Mode"}
                </div>
                <p>
                  {isFr
                    ? "Seul l'enseignant hôte peut démarrer un appel ou inviter des participants supplémentaires (jusqu'à 40 maximum). Vous pouvez lever la main pour prier."
                    : "Only the Host Teacher can start a live call or invite additional believers mid-call (up to 40 maximum). You can unmute or raise your hand for prayer below."}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Call Controls Bar */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  isMicMuted
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-[#1FB6B0] text-[#081C1B]"
                }`}
              >
                {isMicMuted
                  ? isFr
                    ? "🔇 Micro Coupé"
                    : "🔇 Unmute Mic"
                  : isFr
                  ? "🎙️ Micro Actif"
                  : "🎙️ Mic On"}
              </button>

              <button
                type="button"
                onClick={handleToggleCamera}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  !isCameraOn
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-[#1FB6B0] text-[#081C1B]"
                }`}
              >
                {isCameraOn
                  ? isFr
                    ? "📷 Caméra Active"
                    : "📷 Camera On"
                  : isFr
                  ? "📷 Activer Caméra"
                  : "📷 Start Camera"}
              </button>

              <button
                type="button"
                onClick={handleToggleHand}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  isHandRaised
                    ? "bg-amber-400 text-[#1E1931]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                ✋ {isFr ? "Prière" : "Raise Hand"}
              </button>
            </div>

            {actorRole === "teacher" ? (
              <button
                type="button"
                onClick={handleEndForAll}
                className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                {isFr ? "Terminer l'Appel" : "End Call for All"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLeave}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
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
