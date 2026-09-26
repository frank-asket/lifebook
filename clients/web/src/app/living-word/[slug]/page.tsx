"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  GraduationCap,
  Scroll,
  BookmarkSimple,
  ArrowUpRight,
  UserCircle,
  Play,
  Pause,
  Sparkle,
  Headphones,
  UsersThree,
  Microphone,
  VideoCamera,
  BellRinging,
  Check,
  NotePencil,
} from "@phosphor-icons/react";
import { getAllTeachings, getTeacherBySlug } from "../../livingWordData";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PlaylistModal } from "@/components/PlaylistModal";
import { TeachingShareModal } from "@/components/TeachingShareModal";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";

export default function LivingWordDetail() {
  const { slug } = useParams<{ slug: string }>();
  const teaching = getAllTeachings().find((item) => item.slug === slug);
  const [streamMode, setStreamMode] = useState<"video" | "audio">("video");
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isLiveReminderSet, setIsLiveReminderSet] = useState<boolean>(() => {
    if (typeof window !== "undefined" && slug) {
      try {
        const saved = localStorage.getItem(`lifebook.liveReminder.${slug}`);
        return saved === "true";
      } catch {}
    }
    return false;
  });
  const [isSavedToJournal, setIsSavedToJournal] = useState(false);
  const { isFr } = useLanguage();
  const { playTeaching, currentTrack, isPlaying, togglePlay } = useSanctuaryAudio();

  const starterComments = isFr
    ? [
        { name: "Maya", text: "C'est exactement ce que je vis aujourd'hui. Merci d'accueillir nos questions sincères.", time: "Aujourd'hui" },
        { name: "Daniel", text: "Ce passage m'a donné un point d'ancrage précieux pour ma prière du matin.", time: "Hier" },
      ]
    : [
        { name: "Maya", text: "This is where I am today. Thank you for making room for honest questions.", time: "Today" },
        { name: "Daniel", text: "The Scripture reference gave me something to return to in prayer.", time: "Yesterday" },
      ];

  const [comments, setComments] = useState(starterComments);
  const [comment, setComment] = useState("");

  if (!teaching) {
    notFound();
  }

  const title = isFr ? teaching.titleFr : teaching.title;
  const excerpt = isFr ? teaching.excerptFr : teaching.excerpt;
  const teachingText = isFr ? teaching.teachingFr : teaching.teaching;
  const category = isFr ? teaching.categoryFr : teaching.category;
  const scripture = isFr ? teaching.scriptureFr : teaching.scripture;
  const teacherRole = isFr ? teaching.teacherRoleFr : teaching.teacherRole;
  const teacher = getTeacherBySlug(teaching.teacherSlug);
  const teacherBio = teacher ? (isFr ? teacher.bioFr : teacher.bio) : "";

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    setComments([{ name: isFr ? "Vous" : "You", text: comment.trim(), time: isFr ? "À l'instant" : "Just now" }, ...comments]);
    setComment("");
  }

  function handleToggleLiveReminder() {
    const next = !isLiveReminderSet;
    setIsLiveReminderSet(next);
    try {
      localStorage.setItem(`lifebook.liveReminder.${teaching?.slug}`, String(next));
    } catch {}
  }

  function handleSaveStudyToJournal() {
    if (!teaching) return;
    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const newEntry = {
      id: `dj-lw-${Date.now()}`,
      date: `${isoDate} · ${timeStr}`,
      isoDate,
      time: timeStr,
      text: `${title} (${teaching.teacher}): “${excerpt}”`,
      mood: "peaceful",
      moodEmoji: "🕊",
      moodLabel: isFr ? "Étude LivingWord" : "LivingWord Study",
      moodColor: "#37C6C2",
      scriptureRef: scripture,
      scriptureSnippet: excerpt.split(". ")[0] + ".",
      tags: ["#LivingWord", `#${teaching.category}`],
      isFavorite: true,
    };
    try {
      const raw = localStorage.getItem("lifebook.dashboard.journal");
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem("lifebook.dashboard.journal", JSON.stringify([newEntry, ...list]));
    } catch {}
    setIsSavedToJournal(true);
  }

  return (
    <main className="living-detail">
      <nav className="detail-nav page-shell">
        <div className="flex items-center gap-6">
          <div className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/dashboard">LifeBook</Link>
            <span>/</span>
            <Link href="/living-word">LivingWord</Link>
            <span>/</span>
            <strong className="truncate max-w-[180px] sm:max-w-xs">{title}</strong>
          </div>
          <div className="hidden lg:flex items-center gap-1 pl-4 border-l border-white/15 text-xs font-semibold text-white/75">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkle size={14} weight="duotone" />
              <span>{isFr ? "Sanctuaire" : "Sanctuary"}</span>
            </Link>
            <Link
              href="/living-word"
              className="px-3 py-1.5 rounded-lg text-white bg-white/15 transition-colors inline-flex items-center gap-1.5"
            >
              <Headphones size={14} weight="duotone" />
              <span>LivingWord</span>
            </Link>
            <Link
              href="/teachers"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-1.5"
            >
              <UsersThree size={14} weight="duotone" />
              <span>{isFr ? "Pasteurs" : "Teachers"}</span>
            </Link>
            <Link
              href="/voice"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-1.5"
            >
              <Microphone size={14} weight="duotone" />
              <span>{isFr ? "Voix" : "Voice"}</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <Link className="detail-home" href="/dashboard">
            {isFr ? "Sanctuaire" : "Sanctuary"}
          </Link>
        </div>
      </nav>

      <section className="detail-hero page-shell">
        <div className="detail-teacher">
          <div className="detail-portrait">
            <Image src={teaching.portrait} alt={teaching.teacher} fill sizes="180px" priority />
          </div>
          <span className="detail-label">{isFr ? "Enseignement LivingWord" : "LivingWord teaching"}</span>
          <h1>{title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link
              href={`/living-word/teachers/${teaching.teacherSlug}`}
              className="detail-teacher-name hover:underline text-white font-medium"
            >
              {teaching.teacher} · {teacherRole} ↗
            </Link>
            <Link
              href={`/living-word/teachers/${teaching.teacherSlug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-900/50 border border-purple-400/40 text-purple-200 text-[11px] font-semibold hover:bg-purple-800/60 transition-colors"
            >
              <GraduationCap weight="duotone" className="w-3.5 h-3.5" />
              <span>{isFr ? teaching.theologicalSpecialtyFr : teaching.theologicalSpecialty}</span>
            </Link>
          </div>
          {teacherBio && (
            <div className="teacher-bio-section mt-3 mb-3 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-white text-xs max-w-lg shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200/90 flex items-center gap-1.5">
                  <Scroll weight="duotone" className="w-3.5 h-3.5" />
                  <span>{isFr ? "Biographie de l'enseignant" : "Teacher Biography"}</span>
                </span>
                <Link
                  href={`/living-word/teachers/${teaching.teacherSlug}`}
                  className="text-[10px] font-semibold text-purple-200 hover:text-white hover:underline transition-colors"
                >
                  {isFr ? "Profil complet →" : "Full Profile →"}
                </Link>
              </div>

              {/* Bio Content with smooth height transition */}
              <div className="relative">
                <div
                  className={`teacher-bio-wrapper transition-all duration-500 ease-out overflow-hidden ${
                    isBioExpanded ? "max-h-[600px] opacity-100" : "max-h-[4.25rem] opacity-90"
                  }`}
                >
                  <p className="m-0 text-white/85 font-normal leading-relaxed text-[12px]">
                    {teacherBio}
                  </p>
                </div>
                {!isBioExpanded && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#2d2542]/70 to-transparent" />
                )}
              </div>

              {/* Branded Toggle Button with Small-Caps & Subtle Hover Pulse */}
              <div className="mt-2.5 pt-1 flex items-center">
                <button
                  type="button"
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="teacher-bio-toggle"
                  aria-expanded={isBioExpanded}
                  aria-label={isBioExpanded ? (isFr ? "Réduire la biographie" : "Collapse biography") : (isFr ? "Lire la biographie complète" : "Read full biography")}
                >
                  <span>{isBioExpanded ? (isFr ? "Afficher Moins" : "Show Less") : (isFr ? "Lire Plus" : "Read More")}</span>
                  <span className="text-[10px] transform transition-transform duration-300" style={{ display: "inline-block", transform: isBioExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ↓
                  </span>
                </button>
              </div>
            </div>
          )}
          <p className="detail-intro">{excerpt}</p>
          <div className="detail-meta">
            <span>{category}</span>
            <span>{teaching.duration}</span>
            <span>{scripture}</span>
            <button
              type="button"
              onClick={() => setIsPlaylistModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors border border-white/20 shadow-xs cursor-pointer"
            >
              <BookmarkSimple weight="duotone" className="w-3.5 h-3.5" />
              <span>{isFr ? "Ajouter à une liste" : "Save to Playlist"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E2B714]/25 hover:bg-[#E2B714]/40 text-[#FCE59F] text-xs font-bold transition-colors border border-[#FCE59F]/40 shadow-xs cursor-pointer"
            >
              <ArrowUpRight weight="bold" className="w-3.5 h-3.5" />
              <span>{isFr ? "Diffuser / Partager" : "Share"}</span>
            </button>
          </div>
        </div>
        <div className="detail-verse">
          <span>“</span>
          <p>{excerpt.split(". ")[0]}.</p>
          <small>{scripture}</small>
        </div>
      </section>

      <section className="live-section page-shell">
        <div className="live-heading">
          <div>
            <p className="detail-label">{isFr ? "Se rassembler dans la Parole" : "Gather in the Word"}</p>
            <h2>{isFr ? "Écouter ensemble.\nGrandir ensemble." : "Listen together.\nLearn together."}</h2>
          </div>
          <p>
            {isFr
              ? "Lorsqu'un temps de rassemblement en direct est programmé, c'est ici que vous pourrez vous joindre à l'enseignement, poser vos questions et prier."
              : "When a live gathering is scheduled, this is where you will join the teaching, ask questions, and respond in prayer."}
          </p>
        </div>
        <div className="live-room">
          <div className={`live-stage ${streamMode === "audio" ? "audio-stage" : ""}`}>
            <div className="live-stage-image">
              <Image src={teaching.portrait} alt="" fill sizes="500px" />
            </div>
            <div className="live-stage-shade" />
            <div className="live-status"><i /> {isFr ? "Bientôt disponible" : "Coming soon"}</div>
            <div className="live-stage-copy">
              <span>{streamMode === "video" ? (isFr ? "Salle vidéo" : "Video room") : (isFr ? "Salle audio" : "Audio room")}</span>
              <h3>{isFr ? "Le prochain rassemblement apparaîtra ici." : "The next gathering will appear here."}</h3>
              <p>
                {isFr
                  ? `L'audio et la vidéo pastorale de ${teaching.teacher} seront diffusés lors de la prochaine session prévue.`
                  : `Licensed live audio and video from ${teaching.teacher} will be available when the broadcast is scheduled.`}
              </p>
            </div>
            <div className="live-controls">
              {teaching.audioUrl ? (
                <audio controls src={teaching.audioUrl} />
              ) : (
                <>
                  <button
                    type="button"
                    className="live-play cursor-pointer flex items-center justify-center"
                    onClick={() => {
                      if (currentTrack?.slug === teaching.slug) {
                        togglePlay();
                      } else {
                        playTeaching(teaching);
                      }
                    }}
                    aria-label={isFr ? "Écouter dans le mini-lecteur" : "Play in Sanctuary Mini-Player"}
                  >
                    {currentTrack?.slug === teaching.slug && isPlaying ? (
                      <Pause weight="fill" className="w-4 h-4" />
                    ) : (
                      <Play weight="fill" className="w-4 h-4" />
                    )}
                  </button>
                  <div className="live-progress">
                    <span>
                      {currentTrack?.slug === teaching.slug && isPlaying
                        ? isFr
                          ? "Lecture active dans le mini-lecteur continu"
                          : "Playing in persistent Sanctuary Mini-Player"
                        : isFr
                        ? "Cliquez sur ▶ pour écouter avec chapitres et minuteur"
                        : "Click ▶ to listen with chapters & sleep timer"}
                    </span>
                    <i />
                  </div>
                  <span className="live-time">{teaching.duration}</span>
                </>
              )}
            </div>
          </div>
          <div className="live-sidebar">
            <div className="mode-switch">
              <button className={`inline-flex items-center justify-center gap-1.5 ${streamMode === "video" ? "mode-active" : ""}`} type="button" onClick={() => setStreamMode("video")}>
                <VideoCamera weight="duotone" className="w-4 h-4" />
                <span>{isFr ? "Vidéo" : "Video"}</span>
              </button>
              <button className={`inline-flex items-center justify-center gap-1.5 ${streamMode === "audio" ? "mode-active" : ""}`} type="button" onClick={() => setStreamMode("audio")}>
                <Headphones weight="duotone" className="w-4 h-4" />
                <span>{isFr ? "Audio" : "Audio"}</span>
              </button>
            </div>
            <p className="live-sidebar-label">{isFr ? "Préparer son cœur" : "Prepare your heart"}</p>
            <h3>{isFr ? "Avant d'écouter" : "Before you listen"}</h3>
            <p>
              {isFr
                ? "Prenez un moment de calme. Demandez au Seigneur de vous accorder une oreille attentive et un cœur prêt à recevoir Sa Parole."
                : "Take a breath. Ask the Lord to give you ears to hear and a heart ready to receive his Word."}
            </p>
            <button
              type="button"
              onClick={handleToggleLiveReminder}
              className="live-reminder inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLiveReminderSet ? (
                <>
                  <Check weight="bold" className="w-4 h-4 text-[#4EE2D8]" />
                  <span>
                    {isFr
                      ? "Alerte activée pour les rassemblements"
                      : "Subscribed to live gathering alerts"}
                  </span>
                </>
              ) : (
                <>
                  <BellRinging weight="duotone" className="w-4 h-4" />
                  <span>
                    {isFr
                      ? "M'alerter des rassemblements en direct"
                      : "Notify me about live gatherings"}
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsPlaylistModalOpen(true)}
              className="w-full mt-3 py-2.5 px-3 rounded-xl border border-[#7F67B5] bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <BookmarkSimple weight="duotone" className="w-4 h-4" />
              <span>{isFr ? "Enregistrer pour plus tard" : "Save to Listening Playlist"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="w-full mt-2 py-2.5 px-3 rounded-xl border border-[#FCE59F]/40 bg-[#E2B714]/15 hover:bg-[#E2B714]/30 text-[#FCE59F] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ArrowUpRight weight="bold" className="w-4 h-4" />
              <span>{isFr ? "Partager le message formaté" : "Share Formatted Message"}</span>
            </button>
            <Link
              href={`/living-word/teachers/${teaching.teacherSlug}`}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <UserCircle weight="duotone" className="w-4 h-4" />
              <span>{isFr ? "Voir le profil de l'enseignant" : "View Teacher Profile"} →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="teaching-section page-shell">
        <div className="teaching-body">
          <p className="detail-label">{isFr ? "L'enseignement" : "The teaching"}</p>
          <h2>{isFr ? "Demeurer dans la Parole." : "Stay with the Word."}</h2>
          <p>{teachingText}</p>
          {teaching.audioUrl && <audio className="detail-audio" controls src={teaching.audioUrl} />}
        </div>
        <aside className="scripture-card">
          <span>{isFr ? "Écriture du jour" : "Scripture for today"}</span>
          <p>{excerpt.split(". ")[0]}.</p>
          <strong>{scripture}</strong>
          <small>{isFr ? "Lire · méditer · prier" : "Read · reflect · pray"}</small>
          <button
            type="button"
            onClick={handleSaveStudyToJournal}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-[#2D2542] text-white text-xs font-bold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSavedToJournal ? (
              <>
                <Check weight="bold" className="w-3.5 h-3.5 text-[#4EE2D8]" />
                <span>{isFr ? "Enregistré dans le Journal" : "Saved to Soul Journal"}</span>
              </>
            ) : (
              <>
                <NotePencil weight="duotone" className="w-3.5 h-3.5" />
                <span>{isFr ? "Ancrer dans mon Journal" : "Anchor in Soul Journal"}</span>
              </>
            )}
          </button>
        </aside>
      </section>

      <section className="comments-section page-shell">
        <div className="comments-heading">
          <p className="detail-label">{isFr ? "Espace de réponse" : "A place to respond"}</p>
          <h2>{isFr ? "Qu'avez-vous\nreçu ?" : "What are you\nhearing?"}</h2>
          <p>{isFr ? "Partagez une pensée, une prière ou une interrogation avec la communauté LifeBook." : "Share a thought, prayer, or question with the LifeBook community."}</p>
        </div>
        <div className="comment-list">
          <form className="comment-form" onSubmit={addComment}>
            <label htmlFor="comment">{isFr ? "Ajouter votre réflexion" : "Add your reflection"}</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={isFr ? "Qu'est-ce que Dieu vous invite à remarquer ?" : "What is God inviting you to notice?"}
              rows={3}
            />
            <button type="submit">{isFr ? "Partager ma réflexion ↗" : "Share reflection ↗"}</button>
          </form>
          {comments.map((item, index) => (
            <article className="comment" key={`${item.name}-${index}`}>
              <div className="comment-avatar">{item.name[0]}</div>
              <div>
                <div className="comment-meta">
                  <strong>{item.name}</strong>
                  <span>{item.time}</span>
                </div>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="detail-footer">
        <div>
          <Link href="/">LifeBook</Link>
          <span>{isFr ? "Écriture · méditation · prière · communauté" : "Scripture · reflection · prayer · community"}</span>
        </div>
        <nav aria-label="LivingWord footer navigation">
          <Link href="/voice">{isFr ? "LifeBook Vocal" : "LifeBook Voice"}</Link>
          <Link href="/living-word">LivingWord</Link>
          <Link href="/#questions">{isFr ? "Questions" : "Questions"}</Link>
          <Link href="/#join">{isFr ? "Rejoindre le cercle" : "Join the early circle"}</Link>
        </nav>
      </footer>

      <PlaylistModal
        teaching={teaching}
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />

      <TeachingShareModal
        teaching={teaching}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </main>
  );
}
