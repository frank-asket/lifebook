"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { teachers, getTeachingsByTeacher, type Teaching } from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PlaylistModal } from "@/components/PlaylistModal";
import { TeachingShareModal } from "@/components/TeachingShareModal";

export default function TeacherProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { isFr } = useLanguage();

  const teacher = teachers.find((t) => t.slug === slug);
  const teacherTeachings = teacher ? getTeachingsByTeacher(teacher.slug) : [];

  const [selectedTeachingForPlaylist, setSelectedTeachingForPlaylist] = useState<Teaching | null>(null);
  const [selectedTeachingForShare, setSelectedTeachingForShare] = useState<Teaching | null>(null);
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  if (!teacher) {
    notFound();
  }

  const role = isFr ? teacher.roleFr : teacher.role;
  const theologicalSpecialty = isFr ? teacher.theologicalSpecialtyFr : teacher.theologicalSpecialty;
  const specialties = isFr ? teacher.specialtiesFr : teacher.specialties;
  const bio = isFr ? teacher.bioFr : teacher.bio;
  const education = isFr ? teacher.educationFr : teacher.education;
  const featuredScripture = isFr ? teacher.featuredScriptureFr : teacher.featuredScripture;

  const BIO_LIMIT = 200;
  const isBioLong = bio.length > BIO_LIMIT;
  const displayedBio = isBioLong && !isBioExpanded ? `${bio.slice(0, BIO_LIMIT).trim()}...` : bio;

  async function handleShareProfile() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareText = `🎓 ${teacher?.name} — ${theologicalSpecialty}\n\n${role} at LifeBook LivingWord.\n\nListen to published teachings: ${url}`;
    
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${teacher?.name} · LifeBook Pastoral Contributor`,
          text: shareText,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedProfile(true);
      setTimeout(() => setCopiedProfile(false), 3000);
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#2A2146] pb-24">
      {/* Top Navigation */}
      <nav className="border-b border-[#EAE3D6] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6E6382]">
            <Link href="/" className="hover:text-[#1E1931] transition-colors">LifeBook</Link>
            <span>/</span>
            <Link href="/living-word" className="hover:text-[#1E1931] transition-colors">LivingWord</Link>
            <span>/</span>
            <span className="text-[#1E1931] font-bold">{teacher.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/teacher"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#5D5276] hover:text-[#1E1931] hover:bg-black/5 transition-colors"
            >
              <span>⚙</span>
              <span>{isFr ? "Studio Enseignant" : "Teacher Studio"}</span>
            </Link>
            <button
              type="button"
              onClick={handleShareProfile}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#3D2E5C] hover:bg-[#2A1E42] text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>{copiedProfile ? "✓" : "↗"}</span>
              <span>{copiedProfile ? (isFr ? "Lien copié !" : "Link Copied!") : (isFr ? "Partager profil" : "Share Profile")}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Teacher Profile Hero */}
      <header className="border-b border-[#EAE3D6] bg-gradient-to-b from-[#F2ECE1]/60 to-[#FAF8F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Portrait */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-3 border-white shadow-xl shrink-0 bg-[#E0D7C6]">
              <Image
                src={teacher.portrait}
                alt={teacher.name}
                fill
                sizes="(max-width: 640px) 128px, 160px"
                className="object-cover"
                priority
              />
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3D2E5C] text-white">
                  {isFr ? "Contributeur Pastoral" : "Pastoral Contributor"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8DFCFA] text-[#55496F]">
                  {teacher.title}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E1931] tracking-tight">
                {teacher.name}
              </h1>

              <p className="text-base text-[#52466D] font-medium leading-relaxed max-w-2xl">
                {role} · {teacher.ministryAffiliation}
              </p>

              {/* Theological Specialty Highlight */}
              <div className="p-4 rounded-2xl bg-white border border-[#E3DACB] shadow-xs max-w-3xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">✝</span>
                  <strong className="text-xs font-bold uppercase tracking-wider text-[#3D2E5C]">
                    {isFr ? "Spécialité & Vocation Théologique :" : "Theological Specialty & Conviction:"}
                  </strong>
                </div>
                <p className="text-sm font-serif italic text-[#2E2448] leading-normal m-0">
                  “{theologicalSpecialty}”
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {specialties.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF6EE] text-[#544773] border border-[#DDD3C2]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats & Meta chips */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#6F6486]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#2A2146]">{teacherTeachings.length}</span>
                  <span>{isFr ? "enseignements publiés" : "published teachings"}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span>🎓</span>
                  <span>{education}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span>📖</span>
                  <span>{isFr ? "Verset d'ancrage :" : "Anchor Verse:"} <strong>{featuredScripture}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout: Bio + Teachings */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Comprehensive Biography & Credentials */}
          <section className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E4DCCE] shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D2E5C] flex items-center gap-2 m-0">
                <span>📜</span>
                <span>{isFr ? "Biographie & Parcours" : "Biography & Calling"}</span>
              </h2>
              <div className="text-sm text-[#4E4467] leading-relaxed space-y-3 font-normal">
                <p className="m-0">{displayedBio}</p>
                {isBioLong && (
                  <button
                    type="button"
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3D2E5C] hover:underline cursor-pointer bg-transparent border-0 p-0"
                    aria-expanded={isBioExpanded}
                  >
                    <span>{isBioExpanded ? (isFr ? "Réduire la biographie ↑" : "Show Less ↑") : (isFr ? "Lire la suite ↓" : "Read More ↓")}</span>
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-[#EAE3D6] space-y-3 text-xs">
                <div>
                  <span className="text-[#8B80A1] block">{isFr ? "Affiliation ministérielle :" : "Ministry Affiliation:"}</span>
                  <strong className="text-[#2B2245] font-semibold">{teacher.ministryAffiliation}</strong>
                </div>
                <div>
                  <span className="text-[#8B80A1] block">{isFr ? "Formation théologique :" : "Theological Education:"}</span>
                  <strong className="text-[#2B2245] font-semibold">{education}</strong>
                </div>
              </div>
            </div>

            {/* Other Teachers in LivingWord */}
            <div className="bg-[#FAF6EE] p-5 rounded-3xl border border-[#E2D8C6] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D5174] m-0">
                {isFr ? "Autres enseignants pastoraux" : "Other Pastoral Contributors"}
              </h3>
              <div className="space-y-2.5">
                {teachers
                  .filter((t) => t.slug !== teacher.slug)
                  .map((other) => (
                    <Link
                      key={other.slug}
                      href={`/living-word/teachers/${other.slug}`}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-[#E2D8C6]"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 bg-[#D4CABB]">
                        <Image src={other.portrait} alt={other.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs font-semibold text-[#251D3D] truncate">{other.name}</strong>
                        <span className="block text-[11px] text-[#7A6F91] truncate">
                          {isFr ? other.theologicalSpecialtyFr : other.theologicalSpecialty}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </section>

          {/* Right Column: Published Teachings List */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E7E0D3]">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1E1931] m-0">
                  {isFr ? "Enseignements publiés" : "Published Teachings"}
                </h2>
                <p className="text-xs text-[#6F6486] m-0">
                  {isFr
                    ? `Méditations et exposés bibliques dispensés par ${teacher.name}`
                    : `Expository audio messages and biblical reflections from ${teacher.name}`}
                </p>
              </div>

              <Link
                href="/living-word"
                className="text-xs font-bold text-[#3D2E5C] hover:underline"
              >
                ← {isFr ? "Tous les enseignements" : "All Teachings"}
              </Link>
            </div>

            {teacherTeachings.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#E4DCCE] text-sm text-[#7F7496]">
                {isFr
                  ? "Cet enseignant prépare actuellement de nouveaux enregistrements pastoraux."
                  : "This teacher is currently preparing upcoming pastoral messages."}
              </div>
            ) : (
              <div className="space-y-4">
                {teacherTeachings.map((teaching) => {
                  const teachingTitle = isFr ? teaching.titleFr : teaching.title;
                  const teachingExcerpt = isFr ? teaching.excerptFr : teaching.excerpt;
                  const scripture = isFr ? teaching.scriptureFr : teaching.scripture;
                  const category = isFr ? teaching.categoryFr : teaching.category;

                  return (
                    <article
                      key={teaching.slug}
                      className="bg-white p-6 rounded-3xl border border-[#E3DACB] shadow-xs hover:border-[#3D2E5C]/40 transition-all space-y-3 group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECE5F5] text-[#3D2E5C]">
                            {category}
                          </span>
                          <span className="text-xs text-[#7B7092]">{teaching.duration}</span>
                          <span className="text-xs font-semibold text-[#5B4F75] bg-[#F7F4EE] px-2 py-0.5 rounded-md border border-[#E3DACB]">
                            {scripture}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTeachingForPlaylist(teaching)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5E5279] hover:bg-[#F2ECE1] transition-colors"
                            title={isFr ? "Ajouter à une liste" : "Add to Playlist"}
                          >
                            📑 {isFr ? "Playlist" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTeachingForShare(teaching)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#3D2E5C] bg-[#ECE5F5] hover:bg-[#DDD2ED] transition-colors flex items-center gap-1"
                            title={isFr ? "Partager le message formaté" : "Share formatted teaching"}
                          >
                            <span>↗</span>
                            <span>{isFr ? "Diffuser" : "Share"}</span>
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-serif font-bold text-[#1E1931] group-hover:text-[#3D2E5C] transition-colors m-0">
                        <Link href={`/living-word/${teaching.slug}`}>
                          {teachingTitle}
                        </Link>
                      </h3>

                      <p className="text-sm text-[#4E4467] leading-relaxed m-0 font-normal">
                        “{teachingExcerpt}”
                      </p>

                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          href={`/living-word/${teaching.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3D2E5C] hover:underline"
                        >
                          <span>▶</span>
                          <span>{isFr ? "Écouter l'enseignement" : "Listen to teaching"}</span>
                          <span>→</span>
                        </Link>
                        <span className="text-xs text-[#8F84A6] italic">
                          {isFr ? teaching.theologicalSpecialtyFr : teaching.theologicalSpecialty}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Playlist and Share Modals */}
      {selectedTeachingForPlaylist && (
        <PlaylistModal
          teaching={selectedTeachingForPlaylist}
          isOpen={Boolean(selectedTeachingForPlaylist)}
          onClose={() => setSelectedTeachingForPlaylist(null)}
        />
      )}

      {selectedTeachingForShare && (
        <TeachingShareModal
          teaching={selectedTeachingForShare}
          isOpen={Boolean(selectedTeachingForShare)}
          onClose={() => setSelectedTeachingForShare(null)}
        />
      )}
    </main>
  );
}
