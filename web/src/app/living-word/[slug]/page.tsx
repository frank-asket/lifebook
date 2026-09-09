"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { teachings } from "../../livingWordData";

const starterComments = [
  { name: "Maya", text: "This is where I am today. Thank you for making room for honest questions.", time: "Today" },
  { name: "Daniel", text: "The Scripture reference gave me something to return to in prayer.", time: "Yesterday" },
];

export default function LivingWordDetail() {
  const { slug } = useParams<{ slug: string }>();
  const teaching = teachings.find((item) => item.slug === slug);
  const [streamMode, setStreamMode] = useState<"video" | "audio">("video");
  const [comments, setComments] = useState(starterComments);
  const [comment, setComment] = useState("");

  if (!teaching) {
    notFound();
  }
  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    setComments([{ name: "You", text: comment.trim(), time: "Just now" }, ...comments]);
    setComment("");
  }

  return (
    <main className="living-detail">
      <nav className="detail-nav page-shell"><div className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">LifeBook</Link><span>/</span><Link href="/living-word">LivingWord</Link><span>/</span><strong>{teaching.title}</strong></div><Link className="detail-home" href="/">Home ↗</Link></nav>
      <section className="detail-hero page-shell"><div className="detail-teacher"><div className="detail-portrait"><Image src={teaching.portrait} alt={teaching.teacher} fill sizes="180px" priority /></div><span className="detail-label">LivingWord teaching</span><h1>{teaching.title}</h1><p className="detail-teacher-name">{teaching.teacher} · {teaching.teacherRole}</p><p className="detail-intro">{teaching.excerpt}</p><div className="detail-meta"><span>{teaching.category}</span><span>{teaching.duration}</span><span>{teaching.scripture}</span></div></div><div className="detail-verse"><span>“</span><p>{teaching.excerpt.split(". ")[0]}.</p><small>{teaching.scripture}</small></div></section>

      <section className="live-section page-shell"><div className="live-heading"><div><p className="detail-label">Gather in the Word</p><h2>Listen together.<br /><em>Learn together.</em></h2></div><p>When a live gathering is scheduled, this is where you will join the teaching, ask questions, and respond in prayer.</p></div><div className="live-room"><div className={`live-stage ${streamMode === "audio" ? "audio-stage" : ""}`}><div className="live-stage-image"><Image src={teaching.portrait} alt="" fill sizes="500px" /></div><div className="live-stage-shade" /><div className="live-status"><i /> Coming soon</div><div className="live-stage-copy"><span>{streamMode === "video" ? "Video room" : "Audio room"}</span><h3>The next gathering will appear here.</h3><p>Licensed live audio and video from {teaching.teacher} will be available when the broadcast is scheduled.</p></div><div className="live-controls">{teaching.audioUrl ? <audio controls src={teaching.audioUrl} /> : <><button type="button" className="live-play" disabled>▶</button><div className="live-progress"><span>Real preacher recording coming soon</span><i /></div><span className="live-time">{teaching.duration}</span></>}</div></div><div className="live-sidebar"><div className="mode-switch"><button className={streamMode === "video" ? "mode-active" : ""} type="button" onClick={() => setStreamMode("video")}>▣ Video</button><button className={streamMode === "audio" ? "mode-active" : ""} type="button" onClick={() => setStreamMode("audio")}>◉ Audio</button></div><p className="live-sidebar-label">Prepare your heart</p><h3>Before you listen</h3><p>Take a breath. Ask the Lord to give you ears to hear and a heart ready to receive his Word.</p><button type="button" className="live-reminder">Notify me about live gatherings ↗</button></div></div></section>

      <section className="teaching-section page-shell"><div className="teaching-body"><p className="detail-label">The teaching</p><h2>Stay with the <em>Word.</em></h2><p>{teaching.teaching}</p>{teaching.audioUrl && <audio className="detail-audio" controls src={teaching.audioUrl} />}</div><aside className="scripture-card"><span>Scripture for today</span><p>{teaching.excerpt.split(". ")[0]}.</p><strong>{teaching.scripture}</strong><small>Read · reflect · pray</small></aside></section>

      <section className="comments-section page-shell"><div className="comments-heading"><p className="detail-label">A place to respond</p><h2>What are you<br /><em>hearing?</em></h2><p>Share a thought, prayer, or question with the LifeBook community.</p></div><div className="comment-list"><form className="comment-form" onSubmit={addComment}><label htmlFor="comment">Add your reflection</label><textarea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What is God inviting you to notice?" rows={3} /><button type="submit">Share reflection ↗</button></form>{comments.map((item, index) => <article className="comment" key={`${item.name}-${index}`}><div className="comment-avatar">{item.name[0]}</div><div><div className="comment-meta"><strong>{item.name}</strong><span>{item.time}</span></div><p>{item.text}</p></div></article>)}</div></section>
      <footer className="detail-footer"><div><Link href="/">LifeBook</Link><span>Scripture · reflection · prayer · community</span></div><nav aria-label="LivingWord footer navigation"><Link href="/#voice">LifeBook Voice</Link><Link href="/#living-word">LivingWord</Link><Link href="/#questions">Questions</Link><Link href="/#join">Join the early circle</Link></nav></footer>
    </main>
  );
}
