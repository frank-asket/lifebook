"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getAllTeachers,
  getTeacherBySlug,
  getTeachingsByTeacher,
  addTeachingToContributor,
  CATALOG_CHANGE_EVENT,
  type Teaching,
  type Teacher,
} from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlaylistModal } from "@/components/PlaylistModal";
import { TeachingShareModal } from "@/components/TeachingShareModal";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";

export default function TeacherProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { isFr } = useLanguage();
  const { playTeaching, currentTrack, isPlaying, togglePlay } = useSanctuaryAudio();

  const [allTeachers, setAllTeachers] = useState<Teacher[]>(() => getAllTeachers());
  const [teacher, setTeacher] = useState<Teacher | undefined>(() => getTeacherBySlug(slug));
  const [teacherTeachings, setTeacherTeachings] = useState<Teaching[]>(() =>
    slug ? getTeachingsByTeacher(slug) : []
  );

  const [selectedTeachingForPlaylist, setSelectedTeachingForPlaylist] = useState<Teaching | null>(null);
  const [selectedTeachingForShare, setSelectedTeachingForShare] = useState<Teaching | null>(null);
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Leadership: Add Teaching directly inside this Teacher's Page
  const [isAddingTeaching, setIsAddingTeaching] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newScripture, setNewScripture] = useState("John 15:4-5");
  const [newCategory, setNewCategory] = useState<"Faith" | "Prayer" | "Hope" | "Discipleship">("Faith");
  const [newDuration, setNewDuration] = useState("12 min");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newBody, setNewBody] = useState("");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  useEffect(() => {
    const syncCatalog = () => {
      setAllTeachers(getAllTeachers());
      setTeacher(getTeacherBySlug(slug));
      setTeacherTeachings(getTeachingsByTeacher(slug));
    };
    syncCatalog();
    window.addEventListener(CATALOG_CHANGE_EVENT, syncCatalog);
    window.addEventListener("storage", syncCatalog);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, syncCatalog);
      window.removeEventListener("storage", syncCatalog);
    };
  }, [slug]);

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

  const handleAddTeachingInsidePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !newTitle.trim() || !newScripture.trim()) return;

    const teachingSlug = `${newTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-4)}`;

    const categoryFrMap: Record<string, string> = {
      Faith: "Foi",
      Prayer: "Prière",
      Hope: "Espérance",
      Discipleship: "Vie chrétienne",
    };

    const colorMap: Record<string, string> = {
      Faith: "word-card-rose",
      Prayer: "word-card-sage",
      Hope: "word-card-blue",
      Discipleship: "word-card-gold",
    };

    const createdTeaching: Teaching = {
      slug: teachingSlug,
      title: newTitle.trim(),
      titleFr: newTitle.trim(),
      teacher: teacher.name,
      teacherSlug: teacher.slug,
      teacherRole: teacher.role,
      teacherRoleFr: teacher.roleFr,
      theologicalSpecialty: teacher.theologicalSpecialty,
      theologicalSpecialtyFr: teacher.theologicalSpecialtyFr,
      category: newCategory,
      categoryFr: categoryFrMap[newCategory] || "Foi",
      duration: newDuration.trim() || "12 min",
      durationFr: newDuration.trim() || "12 min",
      scripture: newScripture.trim(),
      scriptureFr: newScripture.trim(),
      excerpt:
        newExcerpt.trim() ||
        `Expository reflection on ${newScripture.trim()} by ${teacher.name}.`,
      excerptFr:
        newExcerpt.trim() ||
        `Méditation expositive sur ${newScripture.trim()} par ${teacher.name}.`,
      teaching:
        newBody.trim() ||
        newExcerpt.trim() ||
        `In ${newScripture.trim()}, ${teacher.name} guides us into quiet, Christ-centered trust and daily obedience.`,
      teachingFr:
        newBody.trim() ||
        newExcerpt.trim() ||
        `Dans ${newScripture.trim()}, ${teacher.name} nous conduit dans une confiance paisible et centrée sur le Christ.`,
      color: colorMap[newCategory] || "word-card-gold",
      portrait: teacher.portrait,
    };

    addTeachingToContributor(createdTeaching);
    setTeacherTeachings(getTeachingsByTeacher(teacher.slug));

    try {
      await fetch("/api/lifebook/livingword/cms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createdTeaching.title,
          teacher: createdTeaching.teacher,
          teacherRole: createdTeaching.teacherRole,
          category: createdTeaching.category,
          duration: createdTeaching.duration,
          scripture: createdTeaching.scripture,
          excerpt: createdTeaching.excerpt,
          fullBody: createdTeaching.teaching,
          status: "published",
        }),
      });
    } catch {
      // ignore network error
    }

    setPublishMessage(
      isFr
        ? `Enseignement « ${createdTeaching.title} » ajouté avec succès à la page de ${teacher.name} et dans LifeBook !`
        : `Teaching “${createdTeaching.title}” added to ${teacher.name}’s page and published into LifeBook!`
    );
    setNewTitle("");
    setNewExcerpt("");
    setNewBody("");
    setTimeout(() => {
      setPublishMessage(null);
      setIsAddingTeaching(false);
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] dark:bg-[#0E0C18] text-[#2A2146] dark:text-[#F4EFE6] pb-28">
      {/* Top Navigation */}
      <nav className="border-b border-[#EAE3D6] dark:border-white/12 bg-[#FAF8F5]/90 dark:bg-[#171326]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6E6382] dark:text-[#C8C2D6]">
            <Link href="/dashboard" className="hover:text-[#1E1931] dark:hover:text-white transition-colors">
              LifeBook Sanctuary
            </Link>
            <span>/</span>
            <Link href="/teachers" className="hover:text-[#1E1931] dark:hover:text-white transition-colors">
              {isFr ? "Portail des Pasteurs" : "Teachers Portal"}
            </Link>
            <span>/</span>
            <span className="text-[#1E1931] dark:text-white font-bold">{teacher.name}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/teachers"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#5D5276] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <span>✝</span>
              <span>{isFr ? "Tous les Pasteurs Contributeurs" : "All Pastoral Contributors"}</span>
            </Link>
            <button
              type="button"
              onClick={handleShareProfile}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#3D2E5C] dark:bg-[#4EE2D8] hover:bg-[#2A1E42] text-white dark:text-[#0E0C18] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>{copiedProfile ? "✓" : "↗"}</span>
              <span>
                {copiedProfile
                  ? isFr
                    ? "Lien copié !"
                    : "Link Copied!"
                  : isFr
                  ? "Partager profil"
                  : "Share Profile"}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Teacher Profile Hero */}
      <header className="border-b border-[#EAE3D6] dark:border-white/10 bg-gradient-to-b from-[#F2ECE1]/60 to-[#FAF8F5] dark:from-[#18132B] dark:to-[#0E0C18]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Portrait */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-3 border-white dark:border-white/20 shadow-xl shrink-0 bg-[#E0D7C6]">
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
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3D2E5C] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18]">
                  {isFr
                    ? "Page Contributeur du Pasteur · Choisi par LifeBook"
                    : "Pastor’s Contributor Page · Chosen by LifeBook Leadership"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8DFCF] dark:bg-white/10 text-[#55496F] dark:text-[#D5CEE6]">
                  {isFr ? teacher.titleFr : teacher.title}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E1931] dark:text-white tracking-tight">
                {teacher.name}
              </h1>

              <p className="text-base text-[#52466D] dark:text-[#C8C2D6] font-medium leading-relaxed max-w-2xl">
                {role} · {teacher.ministryAffiliation}
              </p>

              {/* Theological Specialty Highlight */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/12 shadow-xs max-w-3xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">✝</span>
                  <strong className="text-xs font-bold uppercase tracking-wider text-[#3D2E5C] dark:text-[#4EE2D8]">
                    {isFr ? "Spécialité & Vocation Théologique :" : "Theological Specialty & Conviction:"}
                  </strong>
                </div>
                <p className="text-sm font-serif italic text-[#2E2448] dark:text-[#F4EFE6] leading-normal m-0">
                  “{theologicalSpecialty}”
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {specialties.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF6EE] dark:bg-white/10 text-[#544773] dark:text-[#D5CEE6] border border-[#DDD3C2] dark:border-white/10"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats & Meta chips */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#6F6486] dark:text-[#C8C2D6]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#2A2146] dark:text-white">{teacherTeachings.length}</span>
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
                  <span>
                    {isFr ? "Verset d'ancrage :" : "Anchor Verse:"} <strong>{featuredScripture}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout: Bio + Leadership Teaching Publisher + Teachings */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Comprehensive Biography & Credentials */}
          <section className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#1B1630] p-6 rounded-3xl border border-[#E4DCCE] dark:border-white/12 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D2E5C] dark:text-[#4EE2D8] flex items-center gap-2 m-0">
                <span>📜</span>
                <span>{isFr ? "Biographie & Parcours" : "Biography & Calling"}</span>
              </h2>
              <div className="text-sm text-[#4E4467] dark:text-[#C8C2D6] leading-relaxed space-y-3 font-normal">
                <p className="m-0">{displayedBio}</p>
                {isBioLong && (
                  <button
                    type="button"
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3D2E5C] dark:text-[#4EE2D8] hover:underline cursor-pointer bg-transparent border-0 p-0"
                    aria-expanded={isBioExpanded}
                  >
                    <span>
                      {isBioExpanded
                        ? isFr
                          ? "Réduire la biographie ↑"
                          : "Show Less ↑"
                        : isFr
                        ? "Lire la suite ↓"
                        : "Read More ↓"}
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-[#EAE3D6] dark:border-white/10 space-y-3 text-xs">
                <div>
                  <span className="text-[#8B80A1] dark:text-[#9D94B0] block">
                    {isFr ? "Affiliation ministérielle :" : "Ministry Affiliation:"}
                  </span>
                  <strong className="text-[#2B2245] dark:text-white font-semibold">
                    {teacher.ministryAffiliation}
                  </strong>
                </div>
                <div>
                  <span className="text-[#8B80A1] dark:text-[#9D94B0] block">
                    {isFr ? "Formation théologique :" : "Theological Education:"}
                  </span>
                  <strong className="text-[#2B2245] dark:text-white font-semibold">{education}</strong>
                </div>
                <div>
                  <span className="text-[#8B80A1] dark:text-[#9D94B0] block">
                    {isFr ? "Statut de gouvernance :" : "Leadership Status:"}
                  </span>
                  <strong className="text-[#0E726D] dark:text-[#4EE2D8] font-semibold">
                    ✓ {isFr ? "Contributeur nommé par la direction LifeBook" : "Appointed by LifeBook Leadership"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Other Teachers in LivingWord */}
            <div className="bg-[#FAF6EE] dark:bg-[#141024] p-5 rounded-3xl border border-[#E2D8C6] dark:border-white/12 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D5174] dark:text-[#C8C2D6] m-0">
                  {isFr ? "Autres Pasteurs Contributeurs" : "Other Pastoral Contributors"}
                </h3>
                <Link href="/teachers" className="text-[11px] font-bold text-[#3D2E5C] dark:text-[#4EE2D8] hover:underline">
                  {isFr ? "Portail →" : "Portal →"}
                </Link>
              </div>
              <div className="space-y-2.5">
                {allTeachers
                  .filter((t) => t.slug !== teacher.slug)
                  .map((other) => (
                    <Link
                      key={other.slug}
                      href={`/teachers/${other.slug}`}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-colors border border-transparent hover:border-[#E2D8C6]"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 bg-[#D4CABB]">
                        <Image src={other.portrait} alt={other.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs font-semibold text-[#251D3D] dark:text-white truncate">
                          {other.name}
                        </strong>
                        <span className="block text-[11px] text-[#7A6F91] dark:text-[#B8B0C8] truncate">
                          {isFr ? other.theologicalSpecialtyFr : other.theologicalSpecialty}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </section>

          {/* Right Column: Leadership Teaching Publisher + Published Teachings List */}
          <section className="lg:col-span-2 space-y-6">
            {/* LifeBook Leadership Panel: Add Teaching Inside Teacher's Page */}
            <div className="rounded-3xl bg-gradient-to-r from-[#2D2542] to-[#1E1931] text-white p-6 shadow-md border border-white/15 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#4EE2D8] font-bold block">
                    {isFr
                      ? "DIRECTION LIFEBOOK · GESTION DU CONTRIBUTEUR"
                      : "LIFEBOOK LEADERSHIP · CONTRIBUTOR CURATION"}
                  </span>
                  <h2 className="text-lg font-serif font-bold text-white mt-0.5">
                    {isFr
                      ? `Ajouter un enseignement de ${teacher.name} dans LifeBook`
                      : `Add ${teacher.name}’s Teaching into LifeBook`}
                  </h2>
                  <p className="text-xs text-white/75 mt-0.5">
                    {isFr
                      ? "La direction de LifeBook publie directement les méditations et enseignements de ce pasteur depuis cette page."
                      : "LifeBook’s leadership curates and publishes teachings for this chosen contributor directly inside their page."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingTeaching(!isAddingTeaching)}
                  className="min-h-[42px] px-4 py-2.5 rounded-xl bg-[#4EE2D8] text-[#0E0C18] text-xs font-bold hover:bg-[#64EDE3] transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <span>{isAddingTeaching ? "✕" : "＋"}</span>
                  <span>
                    {isAddingTeaching
                      ? isFr
                        ? "Fermer le formulaire"
                        : "Close Publisher"
                      : isFr
                      ? "Ajouter un Enseignement"
                      : "Add Teaching to Page"}
                  </span>
                </button>
              </div>

              {isAddingTeaching && (
                <form
                  onSubmit={handleAddTeachingInsidePage}
                  className="pt-4 border-t border-white/15 space-y-4 text-xs"
                >
                  <div>
                    <label className="font-bold text-white/90 block mb-1">
                      {isFr ? "Titre de l'enseignement *" : "Teaching Title *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Resting in the Shepherd's Voice"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#4EE2D8]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-white/90 block mb-1">
                        {isFr ? "Passage Biblique *" : "Scripture Reference *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newScripture}
                        onChange={(e) => setNewScripture(e.target.value)}
                        placeholder="e.g. John 10:27"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#4EE2D8]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-white/90 block mb-1">
                        {isFr ? "Catégorie" : "Category"}
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) =>
                          setNewCategory(e.target.value as "Faith" | "Prayer" | "Hope" | "Discipleship")
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1E1931] border border-white/20 text-white focus:outline-none focus:border-[#4EE2D8]"
                      >
                        <option value="Faith">Faith / Foi</option>
                        <option value="Prayer">Prayer / Prière</option>
                        <option value="Hope">Hope / Espérance</option>
                        <option value="Discipleship">Discipleship / Vie chrétienne</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-white/90 block mb-1">
                        {isFr ? "Durée" : "Duration"}
                      </label>
                      <input
                        type="text"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        placeholder="12 min"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#4EE2D8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-white/90 block mb-1">
                      {isFr ? "Extrait / Citation Clé *" : "Key Excerpt / Summary *"}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newExcerpt}
                      onChange={(e) => setNewExcerpt(e.target.value)}
                      placeholder="Key pastoral takeaway shown on teaching cards..."
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#4EE2D8]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-white/90 block mb-1">
                      {isFr
                        ? "Texte Complet de l'Enseignement (Lecture & Audio) *"
                        : "Full Expository Teaching & Audio Script *"}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      placeholder="Full pastoral message for study and Sanctuary Audio playback..."
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#4EE2D8]"
                    />
                  </div>

                  {publishMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold">
                      ✓ {publishMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTeaching(false)}
                      className="px-4 py-2 rounded-xl border border-white/20 text-white font-semibold cursor-pointer"
                    >
                      {isFr ? "Annuler" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#4EE2D8] text-[#0E0C18] font-bold cursor-pointer"
                    >
                      {isFr ? "Publier dans LifeBook" : "Publish Teaching into LifeBook"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E7E0D3] dark:border-white/10">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white m-0">
                  {isFr ? "Enseignements publiés" : "Published Teachings"} ({teacherTeachings.length})
                </h2>
                <p className="text-xs text-[#6F6486] dark:text-[#C8C2D6] m-0">
                  {isFr
                    ? `Méditations et exposés bibliques dispensés par ${teacher.name}`
                    : `Expository audio messages and biblical reflections from ${teacher.name}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/teachers"
                  className="text-xs font-bold text-[#5A4B7C] dark:text-[#C8C2D6] hover:underline"
                >
                  ← {isFr ? "Portail des Pasteurs" : "Teachers Portal"}
                </Link>
                <Link
                  href="/living-word"
                  className="text-xs font-bold text-[#3D2E5C] dark:text-[#4EE2D8] hover:underline"
                >
                  {isFr ? "Bibliothèque LivingWord →" : "LivingWord Library →"}
                </Link>
              </div>
            </div>

            {teacherTeachings.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#1B1630] rounded-3xl border border-[#E4DCCE] dark:border-white/12 text-sm text-[#7F7496] dark:text-[#C8C2D6]">
                {isFr
                  ? "Aucun enseignement encore publié. Utilisez le bouton « Ajouter un Enseignement » ci-dessus pour publier le premier message de ce pasteur."
                  : "No teachings published yet. Use the “Add Teaching to Page” button above to publish this pastor’s first message into LifeBook."}
              </div>
            ) : (
              <div className="space-y-4">
                {teacherTeachings.map((teaching) => {
                  const teachingTitle = isFr ? teaching.titleFr : teaching.title;
                  const teachingExcerpt = isFr ? teaching.excerptFr : teaching.excerpt;
                  const scripture = isFr ? teaching.scriptureFr : teaching.scripture;
                  const category = isFr ? teaching.categoryFr : teaching.category;
                  const isThisPlaying = currentTrack?.slug === teaching.slug && isPlaying;

                  return (
                    <article
                      key={teaching.slug}
                      className="bg-white dark:bg-[#1B1630] p-6 rounded-3xl border border-[#E3DACB] dark:border-white/12 shadow-xs hover:border-[#3D2E5C]/40 dark:hover:border-[#4EE2D8]/40 transition-all space-y-3 group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECE5F5] dark:bg-white/10 text-[#3D2E5C] dark:text-[#4EE2D8]">
                            {category}
                          </span>
                          <span className="text-xs text-[#7B7092] dark:text-[#C8C2D6]">{teaching.duration}</span>
                          <span className="text-xs font-semibold text-[#5B4F75] dark:text-[#E2DCEF] bg-[#F7F4EE] dark:bg-white/5 px-2 py-0.5 rounded-md border border-[#E3DACB] dark:border-white/10">
                            {scripture}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTeachingForPlaylist(teaching)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5E5279] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title={isFr ? "Ajouter à une liste" : "Add to Playlist"}
                          >
                            📑 {isFr ? "Playlist" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTeachingForShare(teaching)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#3D2E5C] dark:text-[#0E0C18] bg-[#ECE5F5] dark:bg-[#4EE2D8] hover:opacity-90 transition-colors flex items-center gap-1 cursor-pointer"
                            title={isFr ? "Partager le message formaté" : "Share formatted teaching"}
                          >
                            <span>↗</span>
                            <span>{isFr ? "Diffuser" : "Share"}</span>
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-serif font-bold text-[#1E1931] dark:text-white group-hover:text-[#3D2E5C] dark:group-hover:text-[#4EE2D8] transition-colors m-0">
                        <Link href={`/living-word/${teaching.slug}`}>{teachingTitle}</Link>
                      </h3>

                      <p className="text-sm text-[#4E4467] dark:text-[#C8C2D6] leading-relaxed m-0 font-normal">
                        “{teachingExcerpt}”
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentTrack?.slug === teaching.slug) {
                                togglePlay();
                              } else {
                                playTeaching(teaching);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>{isThisPlaying ? "⏸" : "🎧"}</span>
                            <span>
                              {isThisPlaying
                                ? isFr
                                  ? "En écoute"
                                  : "Playing"
                                : isFr
                                ? "Écouter l'audio"
                                : "Listen in Mini-Player"}
                            </span>
                          </button>

                          <Link
                            href={`/living-word/${teaching.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3D2E5C] dark:text-[#4EE2D8] hover:underline"
                          >
                            <span>📖</span>
                            <span>{isFr ? "Lire l'étude complète" : "Read Full Study"}</span>
                            <span>→</span>
                          </Link>
                        </div>

                        <span className="text-xs text-[#8F84A6] dark:text-[#9D94B0] italic">
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
