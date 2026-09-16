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
        <div className="living-word-heading">
          <div>
            <p className="showcase-eyebrow">Audio Bible Teachings</p>
            <h2>Listen to 10-minute audio teachings on your commute.</h2>
          </div>
          <div>
            <p>Stream verse-by-verse audio lessons on faith, prayer, hope, and discipleship when you don&apos;t have time to sit with a physical Bible.</p>
            <ul className="mt-3 space-y-1 text-xs text-[#5D5276] list-disc pl-4">
              <li><strong>Fit growth into busy days:</strong> concise 9 to 18 minute lessons without fluff</li>
              <li><strong>Grounded in Scripture:</strong> each lesson breaks down one passage line by line</li>
              <li><strong>Take action immediately:</strong> end with one practical prayer takeaway for your day</li>
            </ul>
          </div>
        </div>
        <div className="living-word-toolbar">
          <div className="living-word-tabs" role="tablist" aria-label="Teaching categories">
            {categories.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={category === item}
                className={category === item ? "active-word-tab" : ""}
                onClick={() => setCategory(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
          <span>Curated Scripture teachings</span>
        </div>
        <div className="living-word-grid">
          {visibleTeachings.map((teaching) => (
            <article className={`word-card ${teaching.color}`} key={teaching.title}>
              <Link className="word-card-link" href={`/living-word/${teaching.slug}`} aria-label={`Open ${teaching.title}`}>
                <div className="word-card-top">
                  <Image className="word-card-portrait" src={teaching.portrait} alt={teaching.teacher} width={48} height={48} />
                  <span>{teaching.duration}</span>
                </div>
                <p className="word-card-category">{teaching.category} · {teaching.scripture}</p>
                <h3>{teaching.title}</h3>
                <p className="word-card-teacher">{teaching.teacher}</p>
                <p className="word-card-excerpt">{teaching.excerpt}</p>
              </Link>
              <Link href={`/living-word/${teaching.slug}`} className="listen-button">
                <span>📖</span>Read and study lesson
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
