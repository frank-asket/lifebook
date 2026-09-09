"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { teachings } from "./livingWordData";

const categories = ["All", "Faith", "Prayer", "Hope", "Discipleship"];

export default function LivingWord() {
  const [category, setCategory] = useState("All");

  const visibleTeachings = category === "All" ? teachings : teachings.filter((teaching) => teaching.category === category);

  return (
    <section className="living-word-section" id="living-word">
      <div className="page-shell">
        <div className="living-word-heading"><div><p className="showcase-eyebrow">LivingWord · preview library</p><h2>Hear teaching.<br /><em>Stay with the Word.</em></h2></div><p>Make room for voices that point you back to Jesus. Listen to a short teaching, sit with the Scripture, and carry one thought into prayer.</p></div>
        <div className="living-word-toolbar"><div className="living-word-tabs" role="tablist" aria-label="Teaching categories">{categories.map((item) => <button type="button" role="tab" aria-selected={category === item} className={category === item ? "active-word-tab" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><span>Curated content · licensed voices coming soon</span></div>
        <div className="living-word-grid">{visibleTeachings.map((teaching) => <article className={`word-card ${teaching.color}`} key={teaching.title}><Link className="word-card-link" href={`/living-word/${teaching.slug}`} aria-label={`Open ${teaching.title}`}><div className="word-card-top"><Image className="word-card-portrait" src={teaching.portrait} alt="LifeBook teaching contributor" width={48} height={48} /><span>{teaching.duration}</span></div><p className="word-card-category">{teaching.category} · {teaching.scripture}</p><h3>{teaching.title}</h3><p className="word-card-teacher">{teaching.teacher}</p><p className="word-card-excerpt">{teaching.excerpt}</p></Link><button type="button" className="listen-button" disabled={!teaching.audioUrl}><span>▶</span>{teaching.audioUrl ? "Listen teaching" : "Audio coming soon"}</button></article>)}</div>
      </div>
    </section>
  );
}
