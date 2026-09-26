"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getAllTeachers,
  getAllTeachings,
  appointPastoralContributor,
  addTeachingToContributor,
  CATALOG_CHANGE_EVENT,
  type Teacher,
  type Teaching,
} from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CloudSyncBadge } from "@/components/CloudSyncBadge";
import { PWAInstallButton } from "@/components/PWAInstallPrompt";

const PORTRAIT_OPTIONS = [
  { label: "Pastoral Portrait I", value: "/AsketOfficialPic (1).png" },
  { label: "Pastoral Portrait II", value: "/myself.jpeg" },
];

export default function TeachersPortalPage() {
  const { isFr } = useLanguage();
  const [teacherList, setTeacherList] = useState<Teacher[]>(() => getAllTeachers());
  const [teachingList, setTeachingList] = useState<Teaching[]>(() => getAllTeachings());

  // Leadership Modal: Appoint a new Pastoral Contributor
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("Reverend Pastor");
  const [newRole, setNewRole] = useState("Pastoral Contributor & Expository Teacher");
  const [newMinistry, setNewMinistry] = useState("");
  const [newEducation, setNewEducation] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newTags, setNewTags] = useState("Expository Preaching, Contemplative Prayer, Covenant Grace");
  const [newScripture, setNewScripture] = useState("2 Timothy 2:15");
  const [newBio, setNewBio] = useState("");
  const [newPortrait, setNewPortrait] = useState(PORTRAIT_OPTIONS[0].value);
  const [appointSuccess, setAppointSuccess] = useState<string | null>(null);

  // Leadership Quick Modal: Add Teaching for a selected Contributor
  const [selectedTeacherForTeaching, setSelectedTeacherForTeaching] = useState<Teacher | null>(null);
  const [teachingTitle, setTeachingTitle] = useState("");
  const [teachingScripture, setTeachingScripture] = useState("John 15:5");
  const [teachingCategory, setTeachingCategory] = useState<"Faith" | "Prayer" | "Hope" | "Discipleship">("Faith");
  const [teachingDuration, setTeachingDuration] = useState("12 min");
  const [teachingExcerpt, setTeachingExcerpt] = useState("");
  const [teachingBody, setTeachingBody] = useState("");
  const [teachingSuccess, setTeachingSuccess] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setTeacherList(getAllTeachers());
      setTeachingList(getAllTeachings());
    };
    window.addEventListener(CATALOG_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleAppointContributor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSpecialty.trim()) return;

    const slug = newName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const parsedTags = newTags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const contributor: Teacher = {
      id: `teacher-${Date.now()}`,
      slug: slug || `pastor-${Date.now()}`,
      name: newName.trim(),
      title: newTitle.trim() || "Pastoral Contributor",
      titleFr: newTitle.trim() || "Contributeur Pastoral",
      role: newRole.trim() || "LifeBook Appointed Pastoral Contributor",
      roleFr: newRole.trim() || "Contributeur Pastoral Nommé par LifeBook",
      theologicalSpecialty: newSpecialty.trim(),
      theologicalSpecialtyFr: newSpecialty.trim(),
      specialties: parsedTags.length > 0 ? parsedTags : ["Biblical Exposition", "Spiritual Formation"],
      specialtiesFr: parsedTags.length > 0 ? parsedTags : ["Exposition Biblique", "Formation Spirituelle"],
      bio:
        newBio.trim() ||
        `${newName.trim()} has been prayerfully chosen and appointed by LifeBook's Leadership Council as a Pastoral Contributor dedicated to Scripture fidelity and unhurried spiritual formation.`,
      bioFr:
        newBio.trim() ||
        `${newName.trim()} a été choisi et nommé par la direction de LifeBook comme contributeur pastoral dédié à la fidélité biblique et à la formation spirituelle.`,
      ministryAffiliation: newMinistry.trim() || "LifeBook Pastoral Fellowship",
      education: newEducation.trim() || "M.Div. in Pastoral Theology",
      educationFr: newEducation.trim() || "Master en Théologie Pastorale",
      portrait: newPortrait,
      featuredScripture: newScripture.trim() || "2 Timothy 2:15",
      featuredScriptureFr: newScripture.trim() || "2 Timothée 2:15",
    };

    appointPastoralContributor(contributor);
    setTeacherList(getAllTeachers());
    setAppointSuccess(
      isFr
        ? `${contributor.name} a été ajouté comme Contributeur Pastoral officiel de LifeBook.`
        : `${contributor.name} has been appointed as an official LifeBook Pastoral Contributor.`
    );
    setNewName("");
    setNewMinistry("");
    setNewEducation("");
    setNewSpecialty("");
    setNewBio("");
    setTimeout(() => {
      setAppointSuccess(null);
      setIsAppointModalOpen(false);
    }, 1400);
  };

  const handleAddTeachingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForTeaching || !teachingTitle.trim() || !teachingScripture.trim()) return;

    const slug = `${teachingTitle
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
      slug,
      title: teachingTitle.trim(),
      titleFr: teachingTitle.trim(),
      teacher: selectedTeacherForTeaching.name,
      teacherSlug: selectedTeacherForTeaching.slug,
      teacherRole: selectedTeacherForTeaching.role,
      teacherRoleFr: selectedTeacherForTeaching.roleFr,
      theologicalSpecialty: selectedTeacherForTeaching.theologicalSpecialty,
      theologicalSpecialtyFr: selectedTeacherForTeaching.theologicalSpecialtyFr,
      category: teachingCategory,
      categoryFr: categoryFrMap[teachingCategory] || "Foi",
      duration: teachingDuration.trim() || "12 min",
      durationFr: teachingDuration.trim() || "12 min",
      scripture: teachingScripture.trim(),
      scriptureFr: teachingScripture.trim(),
      excerpt:
        teachingExcerpt.trim() ||
        `Expository reflection on ${teachingScripture.trim()} by ${selectedTeacherForTeaching.name}.`,
      excerptFr:
        teachingExcerpt.trim() ||
        `Méditation expositive sur ${teachingScripture.trim()} par ${selectedTeacherForTeaching.name}.`,
      teaching:
        teachingBody.trim() ||
        teachingExcerpt.trim() ||
        `In ${teachingScripture.trim()}, we are invited to rest in the finished work of Christ and abide deeply in His Word.`,
      teachingFr:
        teachingBody.trim() ||
        teachingExcerpt.trim() ||
        `Dans ${teachingScripture.trim()}, nous sommes invités à demeurer fidèlement dans la Parole du Seigneur.`,
      color: colorMap[teachingCategory] || "word-card-gold",
      portrait: selectedTeacherForTeaching.portrait,
    };

    addTeachingToContributor(createdTeaching);
    setTeachingList(getAllTeachings());

    // Also sync with backend CMS endpoint silently
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
      // ignore network error in offline mode
    }

    setTeachingSuccess(
      isFr
        ? `Enseignement « ${createdTeaching.title} » publié sur la page de ${selectedTeacherForTeaching.name} !`
        : `Teaching “${createdTeaching.title}” added to ${selectedTeacherForTeaching.name}'s page and LivingWord!`
    );
    setTeachingTitle("");
    setTeachingExcerpt("");
    setTeachingBody("");
    setTimeout(() => {
      setTeachingSuccess(null);
      setSelectedTeacherForTeaching(null);
    }, 1400);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] dark:bg-[#0E0C18] text-[#2A2146] dark:text-[#F4EFE6] pb-28">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#2D2542]/10 dark:border-white/12 bg-[#FAF8F5]/90 dark:bg-[#171326]/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                LB
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-[#1E1931] dark:text-white block leading-none">
                  LifeBook
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#6E6285] dark:text-[#B8B0C8] block mt-0.5">
                  {isFr ? "PORTAIL DES PASTEURS" : "TEACHERS PORTAL"}
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#2D2542]/10 dark:border-white/12 text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6]">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-lg hover:text-[#1E1931] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors"
              >
                {isFr ? "Tableau de Bord" : "Dashboard"}
              </Link>
              <Link
                href="/living-word"
                className="px-3 py-2 rounded-lg hover:text-[#1E1931] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors"
              >
                {isFr ? "Bibliothèque LivingWord" : "LivingWord Library"}
              </Link>
              <Link
                href="/teachers"
                className="px-3 py-2 rounded-lg text-[#1E1931] dark:text-white bg-[#F2ECE1] dark:bg-white/10 transition-colors"
              >
                {isFr ? "Portail des Pasteurs & Enseignants" : "Pastors & Teachers Portal"}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <PWAInstallButton />
            <CloudSyncBadge />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero & Leadership Governance Explanation */}
      <section className="border-b border-[#EAE3D6] dark:border-white/10 bg-gradient-to-b from-[#F2ECE1]/70 to-[#FAF8F5] dark:from-[#18132B] dark:to-[#0E0C18] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D2542] dark:bg-[#4EE2D8]/15 text-white dark:text-[#4EE2D8] text-xs font-bold uppercase tracking-wider">
                <span>✝</span>
                <span>
                  {isFr
                    ? "Portail des Contributeurs Pastoraux · Choix de la Direction LifeBook"
                    : "Pastor’s Contributor Portal · Chosen by LifeBook Leadership"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1E1931] dark:text-white tracking-tight leading-tight">
                {isFr
                  ? "Les Voix Pastorales & Enseignants Choisis par LifeBook"
                  : "Pastoral Contributors & Teachers Portal"}
              </h1>

              <p className="text-sm sm:text-base text-[#52466D] dark:text-[#C8C2D6] leading-relaxed">
                {isFr
                  ? "Pour préserver une saine doctrine christocentrique, les pages d'enseignants ne sont pas ouvertes à l'inscription publique libre. La direction de LifeBook choisit dans la prière chaque pasteur ou théologien contributeur et publie leurs enseignements directement à l'intérieur de la page de chaque enseignant."
                  : "To safeguard Christocentric doctrine and unhurried pastoral care, contributor pages are not open to random public uploads. LifeBook’s leadership prayerfully chooses every Pastor and Teacher contributor and adds their teachings directly inside each teacher’s page."}
              </p>
            </div>

            {/* Leadership Action: Choose / Appoint a New Pastoral Contributor */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAppointModalOpen(true)}
                className="min-h-[44px] px-5 py-3 rounded-2xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-95 transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>＋</span>
                <span>
                  {isFr
                    ? "Direction LifeBook : Choisir un Pasteur Contributeur"
                    : "LifeBook Leadership: Appoint Pastoral Contributor"}
                </span>
              </button>
              <Link
                href="/living-word/cms"
                className="min-h-[44px] px-4 py-3 rounded-2xl border border-[#2D2542]/20 dark:border-white/20 bg-white/80 dark:bg-white/5 text-xs font-bold text-[#2D2542] dark:text-white hover:bg-white dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
              >
                <span>🛡️</span>
                <span>{isFr ? "Comité d'Audit Théologique" : "Theological Audit CMS"}</span>
              </Link>
            </div>
          </div>

          {/* 3-Step Governance Clarity Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/12 shadow-xs space-y-1.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E726D] dark:text-[#4EE2D8]">
                {isFr ? "01 · SÉLECTION PAR LA DIRECTION" : "01 · CHOSEN BY LEADERSHIP"}
              </div>
              <h2 className="text-sm font-bold text-[#1E1931] dark:text-white">
                {isFr ? "Nomination Pastorale" : "Vetted Pastoral Contributors"}
              </h2>
              <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                {isFr
                  ? "La direction de LifeBook sélectionne des pasteurs, biblistes et conseillers reconnus pour leur fidélité aux Écritures."
                  : "LifeBook leadership selects trusted pastors, biblical counselors, and scholars grounded in historic Christian orthodoxy."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/12 shadow-xs space-y-1.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#5A4B7C] dark:text-[#C8C2D6]">
                {isFr ? "02 · PAGE CONTRIBUTEUR DU PASTEUR" : "02 · PASTOR'S CONTRIBUTOR PAGE"}
              </div>
              <h2 className="text-sm font-bold text-[#1E1931] dark:text-white">
                {isFr ? "Profil & Vocation Théologique" : "Dedicated Ministry Profile"}
              </h2>
              <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                {isFr
                  ? "Chaque pasteur dispose d'une page dédiée présentant sa biographie, son église ou ministère, et son verset d'ancrage."
                  : "Every chosen pastor has a dedicated contributor page highlighting their ministry affiliation, credentials, and anchor Scripture."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/12 shadow-xs space-y-1.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#B07D1E] dark:text-[#FFD770]">
                {isFr ? "03 · AJOUT DANS LA PAGE ENSEIGNANT" : "03 · ADDED INSIDE TEACHER'S PAGE"}
              </div>
              <h2 className="text-sm font-bold text-[#1E1931] dark:text-white">
                {isFr ? "Publication directe des enseignements" : "Leadership Publishes Inside Teacher's Page"}
              </h2>
              <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] leading-relaxed">
                {isFr
                  ? "Ouvrez la page d'un pasteur pour ajouter directement ses méditations et enseignements audio dans LifeBook."
                  : "Open any pastor’s page below to add their teachings directly into LifeBook and the Sanctuary Audio Player."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pastoral Contributors Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1E1931] dark:text-white">
              {isFr
                ? `Pasteurs & Enseignants Contributeurs (${teacherList.length})`
                : `Appointed Pastoral Contributors (${teacherList.length})`}
            </h2>
            <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] mt-0.5">
              {isFr
                ? "Cliquez sur la page d'un pasteur pour écouter ses messages ou ajouter un nouvel enseignement."
                : "Select any Pastor’s Contributor Page to view their messages or add a new teaching into LifeBook."}
            </p>
          </div>
          <div className="text-xs font-mono text-[#5A4B7C] dark:text-[#4EE2D8] font-bold">
            {teachingList.length} {isFr ? "enseignements publiés au total" : "total teachings in LifeBook"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teacherList.map((teacher) => {
            const count = teachingList.filter((t) => t.teacherSlug === teacher.slug).length;
            const role = isFr ? teacher.roleFr : teacher.role;
            const specialty = isFr ? teacher.theologicalSpecialtyFr : teacher.theologicalSpecialty;
            const bio = isFr ? teacher.bioFr : teacher.bio;
            const specs = isFr ? teacher.specialtiesFr : teacher.specialties;

            return (
              <article
                key={teacher.slug}
                className="rounded-3xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/12 p-6 sm:p-7 shadow-sm hover:border-[#3D2E5C] dark:hover:border-[#4EE2D8]/50 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/teachers/${teacher.slug}`}
                      className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#E3DACB] dark:border-white/20 shrink-0 bg-[#E0D7C6]"
                    >
                      <Image
                        src={teacher.portrait}
                        alt={teacher.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2D2542] dark:bg-[#4EE2D8]/20 text-white dark:text-[#4EE2D8]">
                          {isFr ? "Choisi par LifeBook" : "Chosen Contributor"}
                        </span>
                        <span className="text-xs font-mono font-semibold text-[#6E6285] dark:text-[#C8C2D6]">
                          {count} {isFr ? "enseignements" : "teachings"}
                        </span>
                      </div>

                      <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white">
                        <Link href={`/teachers/${teacher.slug}`} className="hover:underline">
                          {teacher.name}
                        </Link>
                      </h3>

                      <p className="text-xs font-medium text-[#52466D] dark:text-[#C8C2D6]">
                        {role} · <span className="font-semibold">{teacher.ministryAffiliation}</span>
                      </p>
                    </div>
                  </div>

                  {/* Theological Conviction Box */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#EADBCE] dark:border-white/10 space-y-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5A4B7C] dark:text-[#4EE2D8]">
                      {isFr ? "Vocation Théologique" : "Theological Conviction"}
                    </div>
                    <p className="text-xs font-serif italic text-[#2E2448] dark:text-[#F4EFE6]">
                      “{specialty}”
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {specs.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-white/10 text-[#544773] dark:text-[#D5CEE6] border border-[#DDD3C2] dark:border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#4E4467] dark:text-[#C8C2D6] leading-relaxed line-clamp-3">
                    {bio}
                  </p>
                </div>

                {/* Action Footer: Open Teacher's Page OR Add Teaching */}
                <div className="pt-4 border-t border-[#EAE3D6] dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/teachers/${teacher.slug}`}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <span>📖</span>
                    <span>
                      {isFr ? "Ouvrir la Page du Pasteur →" : "Open Pastor’s Page →"}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSelectedTeacherForTeaching(teacher)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#2D2542]/20 dark:border-white/20 hover:bg-[#F2ECE1] dark:hover:bg-white/10 text-xs font-bold text-[#2D2542] dark:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>＋</span>
                    <span>{isFr ? "Ajouter un Enseignement" : "Add Teaching"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* MODAL 1: Appoint New Pastoral Contributor (LifeBook Leadership) */}
      {isAppointModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1A162B] border border-[#2D2542]/15 dark:border-white/15 p-6 sm:p-8 shadow-2xl text-[#1E1931] dark:text-white my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2D2542]/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0E726D] dark:text-[#4EE2D8] font-bold">
                  {isFr ? "CONSEIL DE DIRECTION LIFEBOOK" : "LIFEBOOK LEADERSHIP COUNCIL"}
                </span>
                <h2 className="text-xl font-serif font-bold mt-0.5">
                  {isFr ? "Choisir & Nommer un Pasteur Contributeur" : "Appoint a Pastoral Contributor"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F2ECE1] dark:bg-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAppointContributor} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Nom du Pasteur / Enseignant *" : "Pastor / Teacher Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Pastor David Mensah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Titre Pastoral" : "Pastoral Title"}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Senior Pastor & Theologian"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Affiliation Ministérielle / Église" : "Church / Ministry Affiliation"}
                  </label>
                  <input
                    type="text"
                    value={newMinistry}
                    onChange={(e) => setNewMinistry(e.target.value)}
                    placeholder="e.g. Covenant Grace Fellowship"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Verset d'Ancrage" : "Anchor Scripture"}
                  </label>
                  <input
                    type="text"
                    value={newScripture}
                    onChange={(e) => setNewScripture(e.target.value)}
                    placeholder="e.g. Colossians 1:28"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  {isFr ? "Spécialité & Vocation Théologique *" : "Theological Specialty & Conviction *"}
                </label>
                <input
                  type="text"
                  required
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="e.g. Expository Preaching, Covenant Theology & Rhythms of Grace"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Formation Théologique" : "Theological Education"}
                  </label>
                  <input
                    type="text"
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    placeholder="e.g. M.Div., Reformed Theological Seminary"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Portrait Officiel" : "Official Portrait"}
                  </label>
                  <select
                    value={newPortrait}
                    onChange={(e) => setNewPortrait(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  >
                    {PORTRAIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  {isFr ? "Biographie Pastorale" : "Pastoral Biography"}
                </label>
                <textarea
                  rows={3}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder={
                    isFr
                      ? "Décrivez le parcours pastoral et la vision d'édification de cet enseignant..."
                      : "Describe this pastor's ministry calling, teaching heart, and walk with Christ..."
                  }
                  className="w-full p-3 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                />
              </div>

              {appointSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold">
                  ✓ {appointSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppointModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 font-semibold cursor-pointer"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold cursor-pointer"
                >
                  {isFr ? "Créer la Page du Pasteur" : "Create Pastor's Contributor Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Teaching for Selected Contributor */}
      {selectedTeacherForTeaching && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1A162B] border border-[#2D2542]/15 dark:border-white/15 p-6 sm:p-8 shadow-2xl text-[#1E1931] dark:text-white my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2D2542]/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0E726D] dark:text-[#4EE2D8] font-bold">
                  {isFr ? "PUBLICATION PAR LA DIRECTION LIFEBOOK" : "LIFEBOOK LEADERSHIP PUBLISHING"}
                </span>
                <h2 className="text-xl font-serif font-bold mt-0.5">
                  {isFr
                    ? `Ajouter un enseignement pour ${selectedTeacherForTeaching.name}`
                    : `Add Teaching to ${selectedTeacherForTeaching.name}’s Page`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacherForTeaching(null)}
                className="w-8 h-8 rounded-full bg-[#F2ECE1] dark:bg-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeachingSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">
                  {isFr ? "Titre de l'enseignement *" : "Teaching Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={teachingTitle}
                  onChange={(e) => setTeachingTitle(e.target.value)}
                  placeholder="e.g. Abiding in the True Vine When Life Feels Barren"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Passage Biblique *" : "Scripture Reference *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={teachingScripture}
                    onChange={(e) => setTeachingScripture(e.target.value)}
                    placeholder="e.g. John 15:4-5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Catégorie" : "Category"}
                  </label>
                  <select
                    value={teachingCategory}
                    onChange={(e) =>
                      setTeachingCategory(e.target.value as "Faith" | "Prayer" | "Hope" | "Discipleship")
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  >
                    <option value="Faith">Faith / Foi</option>
                    <option value="Prayer">Prayer / Prière</option>
                    <option value="Hope">Hope / Espérance</option>
                    <option value="Discipleship">Discipleship / Vie chrétienne</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Durée d'écoute" : "Audio Duration"}
                  </label>
                  <input
                    type="text"
                    value={teachingDuration}
                    onChange={(e) => setTeachingDuration(e.target.value)}
                    placeholder="12 min"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  {isFr ? "Résumé / Citation Clé *" : "Core Excerpt / Key Quote *"}
                </label>
                <textarea
                  rows={2}
                  required
                  value={teachingExcerpt}
                  onChange={(e) => setTeachingExcerpt(e.target.value)}
                  placeholder="A concise pastoral summary displayed on teaching cards..."
                  className="w-full p-3 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  {isFr ? "Texte Complet de l'Enseignement & Méditation Audio *" : "Full Expository Teaching & Audio Script *"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={teachingBody}
                  onChange={(e) => setTeachingBody(e.target.value)}
                  placeholder="Write the full pastoral exposition for study and Sanctuary Audio playback..."
                  className="w-full p-3 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                />
              </div>

              {teachingSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold">
                  ✓ {teachingSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForTeaching(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 font-semibold cursor-pointer"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold cursor-pointer"
                >
                  {isFr ? "Publier dans LifeBook" : "Publish into LifeBook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
