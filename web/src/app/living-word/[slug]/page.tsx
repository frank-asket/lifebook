"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { teachings } from "../../livingWordData";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PlaylistModal } from "@/components/PlaylistModal";

export default function LivingWordDetail() {
  const { slug } = useParams<{ slug: string }>();
  const teaching = teachings.find((item) => item.slug === slug);
  const [streamMode, setStreamMode] = useState<"video" | "audio">("video");
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const { isFr } = useLanguage();

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

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    setComments([{ name: isFr ? "Vous" : "You", text: comment.trim(), time: isFr ? "À l'instant" : "Just now" }, ...comments]);
    setComment("");
  }

  return (
    <main className="living-detail">
      <nav className="detail-nav page-shell">
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">LifeBook</Link>
          <span>/</span>
          <Link href="/living-word">LivingWord</Link>
          <span>/</span>
          <strong>{title}</strong>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link className="detail-home" href="/">
            {isFr ? "Accueil ↗" : "Home ↗"}
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
          <p className="detail-teacher-name">{teaching.teacher} · {teacherRole}</p>
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
              <span>📑</span>
              <span>{isFr ? "Ajouter à une liste" : "Save to Playlist"}</span>
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
                  <button type="button" className="live-play" disabled>▶</button>
                  <div className="live-progress">
                    <span>{isFr ? "Enregistrement pastoral en cours de préparation" : "Real preacher recording coming soon"}</span>
                    <i />
                  </div>
                  <span className="live-time">{teaching.duration}</span>
                </>
              )}
            </div>
          </div>
          <div className="live-sidebar">
            <div className="mode-switch">
              <button className={streamMode === "video" ? "mode-active" : ""} type="button" onClick={() => setStreamMode("video")}>
                {isFr ? "▣ Vidéo" : "▣ Video"}
              </button>
              <button className={streamMode === "audio" ? "mode-active" : ""} type="button" onClick={() => setStreamMode("audio")}>
                {isFr ? "◉ Audio" : "◉ Audio"}
              </button>
            </div>
            <p className="live-sidebar-label">{isFr ? "Préparer son cœur" : "Prepare your heart"}</p>
            <h3>{isFr ? "Avant d'écouter" : "Before you listen"}</h3>
            <p>
              {isFr
                ? "Prenez un moment de calme. Demandez au Seigneur de vous accorder une oreille attentive et un cœur prêt à recevoir Sa Parole."
                : "Take a breath. Ask the Lord to give you ears to hear and a heart ready to receive his Word."}
            </p>
            <button type="button" className="live-reminder">
              {isFr ? "M'alerter des rassemblements en direct ↗" : "Notify me about live gatherings ↗"}
            </button>
            <button
              type="button"
              onClick={() => setIsPlaylistModalOpen(true)}
              className="w-full mt-3 py-2.5 px-3 rounded-xl border border-[#7F67B5] bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>📑</span>
              <span>{isFr ? "Enregistrer pour plus tard" : "Save to Listening Playlist"}</span>
            </button>
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
    </main>
  );
}
