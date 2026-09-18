"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { teachings } from "./livingWordData";
import { useLanguage } from "@/lib/i18n";

export default function LivingWord() {
  const { isFr, t } = useLanguage();
  const [category, setCategory] = useState("All");

  const categories = [
    { id: "All", label: isFr ? "Tous" : "All" },
    { id: "Faith", label: isFr ? "Foi" : "Faith" },
    { id: "Prayer", label: isFr ? "Prière" : "Prayer" },
    { id: "Hope", label: isFr ? "Espérance" : "Hope" },
    { id: "Discipleship", label: isFr ? "Vie chrétienne" : "Discipleship" },
  ];

  const visibleTeachings = category === "All" ? teachings : teachings.filter((teaching) => teaching.category === category);

  return (
    <section className="living-word-section" id="living-word">
      <div className="page-shell">
        <div className="living-word-heading">
          <div>
            <p className="showcase-eyebrow">{t("audio_eyebrow")}</p>
            <h2>{t("audio_heading")}</h2>
          </div>
          <div>
            <p>{t("audio_desc")}</p>
            <ul className="mt-3 space-y-1 text-xs text-[#5D5276] list-disc pl-4">
              <li><strong>{t("audio_point1_bold")}</strong> {t("audio_point1_text")}</li>
              <li><strong>{t("audio_point2_bold")}</strong> {t("audio_point2_text")}</li>
              <li><strong>{t("audio_point3_bold")}</strong> {t("audio_point3_text")}</li>
            </ul>
          </div>
        </div>
        <div className="living-word-toolbar">
          <div className="living-word-tabs" role="tablist" aria-label={isFr ? "Catégories d'enseignements" : "Teaching categories"}>
            {categories.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={category === item.id}
                className={category === item.id ? "active-word-tab" : ""}
                onClick={() => setCategory(item.id)}
                key={item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/living-word/cms"
              className="inline-flex items-center gap-1 font-bold text-[#705eaa] hover:text-[#2d2542] transition-colors"
            >
              <span>🛡️</span>
              <span>{isFr ? "Audit Pastoral CMS" : "Pastoral Review CMS"}</span>
            </Link>
            <span className="hidden sm:inline">{t("audio_curated")}</span>
          </div>
        </div>
        <div className="living-word-grid">
          {visibleTeachings.map((teaching) => {
            const title = isFr ? teaching.titleFr : teaching.title;
            const excerpt = isFr ? teaching.excerptFr : teaching.excerpt;
            const categoryLabel = isFr ? teaching.categoryFr : teaching.category;
            const scripture = isFr ? teaching.scriptureFr : teaching.scripture;
            const duration = isFr ? teaching.durationFr : teaching.duration;

            return (
              <article className={`word-card ${teaching.color}`} key={teaching.title}>
                <Link className="word-card-link" href={`/living-word/${teaching.slug}`} aria-label={`${isFr ? "Ouvrir" : "Open"} ${title}`}>
                  <div className="word-card-top">
                    <Image className="word-card-portrait" src={teaching.portrait} alt={teaching.teacher} width={48} height={48} />
                    <span>{duration}</span>
                  </div>
                  <p className="word-card-category">{categoryLabel} · {scripture}</p>
                  <h3>{title}</h3>
                  <p className="word-card-teacher">{teaching.teacher}</p>
                  <p className="word-card-excerpt">{excerpt}</p>
                </Link>
                <Link href={`/living-word/${teaching.slug}`} className="listen-button">
                  <span>📖</span>{t("audio_read_study")}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
