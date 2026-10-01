"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MagnifyingGlass,
  X,
  Buildings,
  UserCheck,
  BookOpenText,
  Headphones,
  Plus,
  ShieldCheck,
  ChartBar,
  CaretUp,
  CaretDown,
  ArrowRight,
  SlidersHorizontal,
  GraduationCap,
  Funnel,
} from "@phosphor-icons/react";
import {
  getAllTeachers,
  getAllTeachings,
  appointPastoralContributor,
  addTeachingToContributor,
  getTeacherPerformanceSummary,
  CATALOG_CHANGE_EVENT,
  type Teacher,
  type Teaching,
  type TeacherPerformanceSummary,
} from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";
import { TeacherLiveCallBanner } from "@/components/TeacherLiveCallModal";
import { YouVersionNavbar } from "@/components/YouVersionNavbar";

const PORTRAIT_OPTIONS = [
  { label: "Pastoral Portrait I", value: "/AsketOfficialPic (1).png" },
  { label: "Pastoral Portrait II", value: "/myself.jpeg" },
];

type TeacherSortOption =
  | "most-teachings"
  | "most-listens"
  | "highest-completion"
  | "alphabetical";

type SearchFieldScope = "all" | "name" | "ministry";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function highlightSearchMatch(text: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  if (parts.length <= 1) return text;
  return parts.map((part, idx) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark
        key={idx}
        className="bg-[#FFD770]/60 dark:bg-[#4EE2D8]/30 text-[#1E1931] dark:text-white rounded px-0.5 font-bold"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function TeachersPortalPage() {
  const { isFr } = useLanguage();
  const { playTeaching, currentTrack, isPlaying, togglePlay } = useSanctuaryAudio();

  const [teacherList, setTeacherList] = useState<Teacher[]>(() => getAllTeachers());
  const [teachingList, setTeachingList] = useState<Teaching[]>(() => getAllTeachings());
  const [analyticsTick, setAnalyticsTick] = useState(0);

  // Directory Live Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<SearchFieldScope>("all");
  const [selectedMinistry, setSelectedMinistry] = useState<string>("ALL");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("ALL");
  const [showAllSpecialtyTags, setShowAllSpecialtyTags] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<TeacherSortOption>("most-teachings");

  // Performance Analytics Panel State
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState<boolean>(false);
  const [expandedTeacherAnalyticsSlug, setExpandedTeacherAnalyticsSlug] = useState<string | null>(
    "pastor-asket"
  );

  // Leadership Modal: Appoint a new Pastoral Contributor
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("Reverend Pastor");
  const [newRole, setNewRole] = useState("Pastoral Contributor & Expository Teacher");
  const [newMinistry, setNewMinistry] = useState("");
  const [newEducation, setNewEducation] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newTags, setNewTags] = useState(
    "Expository Preaching, Contemplative Prayer, Covenant Grace"
  );
  const [newScripture, setNewScripture] = useState("2 Timothy 2:15");
  const [newBio, setNewBio] = useState("");
  const [newPortrait, setNewPortrait] = useState(PORTRAIT_OPTIONS[0].value);
  const [appointSuccess, setAppointSuccess] = useState<string | null>(null);

  // Leadership Quick Modal: Add Teaching for a selected Contributor
  const [selectedTeacherForTeaching, setSelectedTeacherForTeaching] = useState<Teacher | null>(
    null
  );
  const [teachingTitle, setTeachingTitle] = useState("");
  const [teachingScripture, setTeachingScripture] = useState("John 15:5");
  const [teachingCategory, setTeachingCategory] = useState<
    "Faith" | "Prayer" | "Hope" | "Discipleship"
  >("Faith");
  const [teachingDuration, setTeachingDuration] = useState("12 min");
  const [teachingExcerpt, setTeachingExcerpt] = useState("");
  const [teachingBody, setTeachingBody] = useState("");
  const [teachingSuccess, setTeachingSuccess] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setTeacherList(getAllTeachers());
      setTeachingList(getAllTeachings());
      setAnalyticsTick((t) => t + 1);
    };
    window.addEventListener(CATALOG_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CATALOG_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Build Performance Analytics map per teacher
  const performanceMap = useMemo(() => {
    void analyticsTick;
    void teachingList;
    const map: Record<string, TeacherPerformanceSummary> = {};
    for (const teacher of teacherList) {
      map[teacher.slug] = getTeacherPerformanceSummary(teacher.slug);
    }
    return map;
  }, [teacherList, teachingList, analyticsTick]);

  // Global Leadership Performance Totals
  const globalPerformance = useMemo(() => {
    const summaries = Object.values(performanceMap);
    const totalListens = summaries.reduce((acc, s) => acc + s.totalListens, 0);
    const totalCompletions = summaries.reduce((acc, s) => acc + s.totalCompletions, 0);
    const avgCompletionRate =
      totalListens > 0 ? Math.min(100, Math.round((totalCompletions / totalListens) * 100)) : 0;

    const topTeacher = [...summaries].sort((a, b) => b.totalListens - a.totalListens)[0];

    return {
      totalTeachings: teachingList.length,
      totalListens,
      totalCompletions,
      avgCompletionRate,
      topTeacherName: topTeacher?.teacherName || "Pastor Asket",
      topTeacherListens: topTeacher?.totalListens || 0,
    };
  }, [performanceMap, teachingList.length]);

  // Unique Ministry Affiliations for Quick Filter with Voice Counts
  const allMinistryAffiliations = useMemo(() => {
    const map = new Map<string, number>();
    for (const teacher of teacherList) {
      const m = teacher.ministryAffiliation?.trim();
      if (m) {
        map.set(m, (map.get(m) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [teacherList]);

  // Unique Primary Theological Specialties (Core Convictions)
  const allPrimarySpecialties = useMemo(() => {
    const map = new Map<string, number>();
    for (const teacher of teacherList) {
      const mainSpec = (
        isFr ? teacher.theologicalSpecialtyFr : teacher.theologicalSpecialty
      )?.trim();
      if (mainSpec) {
        map.set(mainSpec, (map.get(mainSpec) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [teacherList, isFr]);

  // Unique Theological Specialty Tags for Filter Bar
  const allSpecialtyFilters = useMemo(() => {
    const set = new Set<string>();
    for (const teacher of teacherList) {
      const specs = isFr ? teacher.specialtiesFr : teacher.specialties;
      for (const s of specs) {
        set.add(s);
      }
    }
    return Array.from(set);
  }, [teacherList, isFr]);

  // Count how many teachers match each specialty option
  const specialtyCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    const allOpts = [
      ...allPrimarySpecialties.map((p) => p.name),
      ...allSpecialtyFilters,
    ];
    for (const opt of allOpts) {
      const target = normalizeSearchText(opt);
      counts[opt] = teacherList.filter((t) => {
        const specs = isFr ? t.specialtiesFr : t.specialties;
        const mainSpec = isFr ? t.theologicalSpecialtyFr : t.theologicalSpecialty;
        return (
          normalizeSearchText(mainSpec).includes(target) ||
          specs.some((s) => normalizeSearchText(s) === target)
        );
      }).length;
    }
    return counts;
  }, [teacherList, allPrimarySpecialties, allSpecialtyFilters, isFr]);

  // Filtered and Sorted Teachers Directory
  const filteredAndSortedTeachers = useMemo(() => {
    const q = normalizeSearchText(searchQuery);

    const filtered = teacherList.filter((teacher) => {
      const specs = isFr ? teacher.specialtiesFr : teacher.specialties;
      const mainSpecialty = isFr ? teacher.theologicalSpecialtyFr : teacher.theologicalSpecialty;

      if (selectedMinistry !== "ALL") {
        if (
          normalizeSearchText(teacher.ministryAffiliation) !==
          normalizeSearchText(selectedMinistry)
        ) {
          return false;
        }
      }

      if (selectedSpecialty !== "ALL") {
        const targetSpec = normalizeSearchText(selectedSpecialty);
        const matchesTag = specs.some(
          (s) =>
            normalizeSearchText(s) === targetSpec ||
            normalizeSearchText(s).includes(targetSpec)
        );
        const matchesMain =
          normalizeSearchText(mainSpecialty) === targetSpec ||
          normalizeSearchText(mainSpecialty).includes(targetSpec);
        if (!matchesTag && !matchesMain) return false;
      }

      if (q) {
        const normalizedName = normalizeSearchText(teacher.name);
        const normalizedMinistry = normalizeSearchText(teacher.ministryAffiliation);
        const normalizedTitle = normalizeSearchText(isFr ? teacher.titleFr : teacher.title);
        const normalizedRole = normalizeSearchText(isFr ? teacher.roleFr : teacher.role);
        const normalizedSpecialty = normalizeSearchText(mainSpecialty);
        const normalizedTags = specs.map((s) => normalizeSearchText(s)).join(" ");
        const normalizedEducation = normalizeSearchText(
          isFr ? teacher.educationFr : teacher.education
        );

        if (searchScope === "name") {
          return normalizedName.includes(q) || normalizedTitle.includes(q);
        }
        if (searchScope === "ministry") {
          return normalizedMinistry.includes(q) || normalizedRole.includes(q);
        }

        const haystack = [
          normalizedMinistry,
          normalizedName,
          normalizedTitle,
          normalizedRole,
          normalizedSpecialty,
          normalizedTags,
          normalizedEducation,
        ].join(" ");

        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const perfA = performanceMap[a.slug];
      const perfB = performanceMap[b.slug];

      if (sortBy === "most-teachings") {
        const diff = (perfB?.publishedCount || 0) - (perfA?.publishedCount || 0);
        if (diff !== 0) return diff;
        return (perfB?.totalListens || 0) - (perfA?.totalListens || 0);
      }
      if (sortBy === "most-listens") {
        return (perfB?.totalListens || 0) - (perfA?.totalListens || 0);
      }
      if (sortBy === "highest-completion") {
        return (perfB?.avgCompletionRate || 0) - (perfA?.avgCompletionRate || 0);
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    teacherList,
    selectedMinistry,
    selectedSpecialty,
    searchQuery,
    searchScope,
    sortBy,
    performanceMap,
    isFr,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedMinistry !== "ALL" ||
    selectedSpecialty !== "ALL" ||
    searchScope !== "all";

  const resetAllDirectoryFilters = () => {
    setSearchQuery("");
    setSearchScope("all");
    setSelectedMinistry("ALL");
    setSelectedSpecialty("ALL");
  };

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
      specialties:
        parsedTags.length > 0 ? parsedTags : ["Biblical Exposition", "Spiritual Formation"],
      specialtiesFr:
        parsedTags.length > 0 ? parsedTags : ["Exposition Biblique", "Formation Spirituelle"],
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
      <YouVersionNavbar activeTab="teachers" />

      {/* Hero & Leadership Governance Header */}
      <section className="border-b border-[#EAE3D6] dark:border-white/10 bg-gradient-to-b from-[#F2ECE1]/70 to-[#FAF8F5] dark:from-[#18132B] dark:to-[#0E0C18] py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D2542] dark:bg-[#4EE2D8]/15 text-white dark:text-[#4EE2D8] text-xs font-bold uppercase tracking-wider">
                <UserCheck weight="bold" className="w-3.5 h-3.5" />
                <span>
                  {isFr
                    ? "Portail des Contributeurs Pastoraux · Choix de la Direction LifeBook"
                    : "Pastor’s Contributor Portal · Chosen by LifeBook Leadership"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1E1931] dark:text-white tracking-tight leading-tight">
                {isFr
                  ? "Les Voix Pastorales & Enseignants Choisis par LifeBook"
                  : "Pastoral Contributors & Teachers Directory"}
              </h1>

              <p className="text-sm sm:text-base text-[#52466D] dark:text-[#C8C2D6] leading-relaxed">
                {isFr
                  ? "Recherchez en direct par affiliation ministérielle ou par nom de pasteur, et filtrez par spécialité théologique pour trouver rapidement une voix pastorale spécifique."
                  : "Live-search pastoral contributors by ministry affiliation or name, and filter by Theological Specialty to quickly locate specific pastoral voices."}
              </p>
            </div>

            {/* Leadership Action: Choose / Appoint a New Pastoral Contributor */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAppointModalOpen(true)}
                className="min-h-[44px] px-5 py-3 rounded-2xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-95 transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Plus weight="bold" className="w-4 h-4" />
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
                <ShieldCheck weight="duotone" className="w-4 h-4 text-[#0E726D] dark:text-[#4EE2D8]" />
                <span>{isFr ? "Comité d'Audit Théologique" : "Theological Audit CMS"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pastoral Contributors Directory Grid with Live Search by Ministry Affiliation & Theological Specialty Filters */}
      <section
        id="pastoral-directory-section"
        className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-6 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1931] dark:text-white">
              {isFr
                ? `Répertoire des Pasteurs Contributeurs (${filteredAndSortedTeachers.length})`
                : `Appointed Pastoral Contributors Directory (${filteredAndSortedTeachers.length})`}
            </h2>
            <p className="text-xs sm:text-sm text-[#5A506B] dark:text-[#C8C2D6] mt-1">
              {isFr
                ? "Filtrez les contributeurs pastoraux en direct par affiliation ministérielle et par spécialité théologique."
                : "Filter pastoral contributors in real time by ministry affiliation and Theological Specialty."}
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2.5 text-xs self-start lg:self-auto">
            <SlidersHorizontal weight="bold" className="w-4 h-4 text-[#5A506B] dark:text-[#C8C2D6]" />
            <label
              htmlFor="teacher-sort-select"
              className="font-bold text-[#5A506B] dark:text-[#C8C2D6] whitespace-nowrap"
            >
              {isFr ? "Trier par :" : "Sort by:"}
            </label>
            <select
              id="teacher-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TeacherSortOption)}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/15 text-xs font-bold text-[#1E1931] dark:text-white cursor-pointer focus:outline-none focus:border-[#2D2542] dark:focus:border-[#4EE2D8]"
            >
              <option value="most-teachings">
                {isFr ? "Plus d'enseignements publiés" : "Most Teachings Published"}
              </option>
              <option value="most-listens">
                {isFr ? "Plus grand nombre d'écoutes" : "Most Total Listens"}
              </option>
              <option value="highest-completion">
                {isFr ? "Meilleur taux de complétion" : "Highest Completion Rate"}
              </option>
              <option value="alphabetical">
                {isFr ? "Ordre alphabétique (A–Z)" : "Alphabetical (A–Z)"}
              </option>
            </select>
          </div>
        </div>

        {/* Dedicated Live Search Bar (Ministry Affiliation & Pastoral Name) + Theological Specialty Filter Panel */}
        <div
          id="teachers-live-search-panel"
          className="rounded-3xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/15 p-5 sm:p-6 shadow-sm space-y-5"
        >
          {/* Row 1: Live Search Input by Ministry Affiliation & Name + Scope Selector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="teachers-live-search-input"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider font-bold text-[#2D2542] dark:text-[#4EE2D8]"
              >
                <Buildings weight="duotone" className="w-4 h-4" />
                <span>
                  {isFr
                    ? "RECHERCHE EN DIRECT PAR AFFILIATION MINISTÉRIELLE & VOIX PASTORALE"
                    : "LIVE SEARCH BY MINISTRY AFFILIATION & PASTORAL VOICE"}
                </span>
              </label>
              <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6]">
                {isFr
                  ? "Filtrage instantané par église/ministère, nom ou spécialité"
                  : "Instant filtering by ministry affiliation, pastor name, or specialty"}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Live Search Input */}
              <div className="relative flex-1">
                <MagnifyingGlass
                  weight="bold"
                  className="w-5 h-5 text-[#5A4B7C] dark:text-[#4EE2D8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="teachers-live-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={
                    isFr
                      ? "Rechercher un pasteur par affiliation ministérielle ou par nom"
                      : "Live search pastoral contributors by ministry affiliation or name"
                  }
                  placeholder={
                    searchScope === "ministry"
                      ? isFr
                        ? "Tapez une affiliation ministérielle (ex. Grace & Truth, Living Hope, All Nations, Anchored Soul)..."
                        : "Type a ministry affiliation to filter voices (e.g., Grace & Truth, Living Hope, All Nations, Anchored Soul)..."
                      : searchScope === "name"
                      ? isFr
                        ? "Rechercher par nom de pasteur (ex. Pastor Asket, Dr. Esther Laurent)..."
                        : "Search by pastoral contributor name (e.g., Pastor Asket, Dr. Esther Laurent)..."
                      : isFr
                      ? "Filtrer en direct par affiliation ministérielle ou pasteur (ex. Grace & Truth, Living Hope, Pastor Asket)..."
                      : "Live search by ministry affiliation or pastor name (e.g., Grace & Truth Fellowship, Living Hope, Pastor Asket)..."
                  }
                  className="w-full min-h-[50px] pl-12 pr-28 py-3 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border-2 border-[#DDD3C2] dark:border-white/15 text-[#1E1931] dark:text-white placeholder:text-[#7A6F8E] dark:placeholder:text-[#968CA8] focus:outline-none focus:border-[#2D2542] dark:focus:border-[#4EE2D8] transition-colors"
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    id="teachers-live-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label={isFr ? "Effacer la recherche" : "Clear search"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EAE3D6] dark:bg-white/10 text-[#1E1931] dark:text-white text-xs font-bold hover:bg-[#DDD3C2] dark:hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <X weight="bold" className="w-3.5 h-3.5" />
                    <span>{isFr ? "Effacer" : "Clear"}</span>
                  </button>
                )}
              </div>

              {/* Search Field Scope Selector (All / Ministry Affiliation / Name) */}
              <div
                role="group"
                aria-label={isFr ? "Portée de la recherche" : "Search scope"}
                className="flex items-center gap-1 p-1 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#E3DACB] dark:border-white/12 shrink-0"
              >
                {(
                  [
                    {
                      id: "all",
                      label: isFr ? "Ministère & Nom" : "Ministry & Name",
                    },
                    {
                      id: "ministry",
                      label: isFr ? "Affiliation Ministérielle" : "Ministry Affiliation",
                    },
                    {
                      id: "name",
                      label: isFr ? "Nom du Pasteur" : "Pastor Name",
                    },
                  ] as const
                ).map((scopeOpt) => {
                  const active = searchScope === scopeOpt.id;
                  return (
                    <button
                      key={scopeOpt.id}
                      type="button"
                      onClick={() => setSearchScope(scopeOpt.id)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                          : "text-[#5A506B] dark:text-[#C8C2D6] hover:text-[#1E1931] dark:hover:text-white"
                      }`}
                    >
                      {scopeOpt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Quick Ministry Affiliation Filter Chips */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#EAE3D6] dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-bold text-[#5A4B7C] dark:text-[#4EE2D8] shrink-0 mr-1">
                <Buildings weight="duotone" className="w-3.5 h-3.5" />
                <span>
                  {isFr ? "Affiliations Ministérielles :" : "Ministry Affiliations:"}
                </span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedMinistry("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedMinistry === "ALL"
                    ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                    : "bg-[#FAF8F5] dark:bg-white/5 text-[#5A506B] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-white/10 border border-[#E3DACB] dark:border-white/10"
                }`}
              >
                {isFr ? "Toutes les affiliations" : "All Ministries"} ({teacherList.length})
              </button>

              {allMinistryAffiliations.map(({ name: ministry, count }) => {
                const isSelected = selectedMinistry === ministry;
                return (
                  <button
                    key={ministry}
                    type="button"
                    onClick={() => setSelectedMinistry(isSelected ? "ALL" : ministry)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                        : "bg-[#FAF8F5] dark:bg-white/5 text-[#5A506B] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-white/10 border border-[#E3DACB] dark:border-white/10"
                    }`}
                  >
                    <Buildings weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                    <span>{highlightSearchMatch(ministry, searchQuery)}</span>
                    <span className="text-[10px] font-mono opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Filter Options for 'Theological Specialty' (Dropdown + Core Specialty Pills + Specialty Focus Tags) */}
          <div
            id="theological-specialty-filter-section"
            className="pt-4 border-t border-[#EAE3D6] dark:border-white/10 space-y-3.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="theological-specialty-select"
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider font-bold text-[#2D2542] dark:text-[#4EE2D8]"
                >
                  <GraduationCap weight="duotone" className="w-4 h-4" />
                  <span>
                    {isFr
                      ? "OPTIONS DE FILTRE : SPÉCIALITÉ THÉOLOGIQUE"
                      : "FILTER OPTIONS: THEOLOGICAL SPECIALTY"}
                  </span>
                </label>
                <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6]">
                  {isFr
                    ? "Sélectionnez une spécialité théologique principale ou un domaine doctrinal pour trouver une voix pastorale."
                    : "Select a core Theological Specialty or doctrinal focus area to locate specific pastoral voices."}
                </p>
              </div>

              {/* Theological Specialty Dropdown Select + Reset */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <Funnel weight="duotone" className="w-4 h-4 text-[#5A4B7C] dark:text-[#4EE2D8] shrink-0" />
                  <select
                    id="theological-specialty-select"
                    aria-label={isFr ? "Spécialité Théologique" : "Theological Specialty"}
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#DDD3C2] dark:border-white/15 text-xs font-bold text-[#1E1931] dark:text-white cursor-pointer focus:outline-none focus:border-[#2D2542] dark:focus:border-[#4EE2D8]"
                  >
                    <option value="ALL">
                      {isFr
                        ? `Toutes les spécialités théologiques (${teacherList.length} voix)`
                        : `All Theological Specialties (${teacherList.length} voices)`}
                    </option>
                    <optgroup
                      label={
                        isFr
                          ? "Spécialités Théologiques Principales"
                          : "Core Theological Specialties"
                      }
                    >
                      {allPrimarySpecialties.map(({ name, count }) => (
                        <option key={name} value={name}>
                          {name} ({count})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup
                      label={
                        isFr
                          ? "Domaines & Disciplines Théologiques"
                          : "Theological Focus Areas & Disciplines"
                      }
                    >
                      {allSpecialtyFilters.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec} ({specialtyCountsMap[spec] || 1})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {selectedSpecialty !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialty("ALL")}
                    className="px-3 py-2 rounded-xl bg-[#F2ECE1] dark:bg-white/10 text-xs font-bold text-[#2D2542] dark:text-[#4EE2D8] hover:opacity-90 cursor-pointer inline-flex items-center gap-1"
                  >
                    <X weight="bold" className="w-3 h-3" />
                    <span>{isFr ? "Réinitialiser la spécialité" : "Clear Specialty"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Core Theological Specialties (Primary Pastoral Convictions) */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#6E6285] dark:text-[#B8B0C8]">
                {isFr
                  ? "Chaires & Spécialités Théologiques Principales :"
                  : "Core Theological Specialties:"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSpecialty("ALL")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSpecialty === "ALL"
                      ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                      : "bg-[#FAF8F5] dark:bg-white/5 text-[#5A506B] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-white/10 border border-[#E3DACB] dark:border-white/10"
                  }`}
                >
                  {isFr ? "Toutes les spécialités" : "All Theological Specialties"} (
                  {teacherList.length})
                </button>

                {allPrimarySpecialties.map(({ name: primarySpec, count }) => {
                  const isSelected = selectedSpecialty === primarySpec;
                  return (
                    <button
                      key={primarySpec}
                      type="button"
                      onClick={() =>
                        setSelectedSpecialty(isSelected ? "ALL" : primarySpec)
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left inline-flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                          : "bg-[#FAF8F5] dark:bg-white/5 text-[#2E2448] dark:text-[#E5DFF0] hover:bg-[#F2ECE1] dark:hover:bg-white/10 border border-[#E3DACB] dark:border-white/10"
                      }`}
                    >
                      <GraduationCap weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                      <span>{primarySpec}</span>
                      <span className="text-[10px] font-mono opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Theological Specialty Focus Tags */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#6E6285] dark:text-[#B8B0C8]">
                  {isFr
                    ? "Thèmes & Disciplines Théologiques :"
                    : "Theological Specialty Focus Tags:"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllSpecialtyTags(!showAllSpecialtyTags)}
                  className="text-[11px] font-semibold text-[#5A4B7C] dark:text-[#4EE2D8] hover:underline cursor-pointer"
                >
                  {showAllSpecialtyTags
                    ? isFr
                      ? "Réduire les thèmes"
                      : "Show Compact Tags"
                    : isFr
                    ? `Voir les ${allSpecialtyFilters.length} thèmes`
                    : `Show All ${allSpecialtyFilters.length} Specialty Tags`}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(showAllSpecialtyTags
                  ? allSpecialtyFilters
                  : allSpecialtyFilters.slice(0, 10)
                ).map((spec) => {
                  const isSelected = selectedSpecialty === spec;
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSelectedSpecialty(isSelected ? "ALL" : spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                        isSelected
                          ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] shadow-xs"
                          : "bg-[#FAF8F5] dark:bg-white/5 text-[#5A506B] dark:text-[#C8C2D6] hover:bg-[#F2ECE1] dark:hover:bg-white/10 border border-[#E3DACB] dark:border-white/10"
                      }`}
                    >
                      <span>{spec}</span>
                      <span className="text-[10px] font-mono opacity-70">
                        ({specialtyCountsMap[spec] || 1})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Active Filter Summary & Live Match Counter */}
          <div className="pt-3 border-t border-[#EAE3D6] dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span
                aria-live="polite"
                className="font-mono font-bold text-[#1E1931] dark:text-white"
              >
                {isFr
                  ? `${filteredAndSortedTeachers.length} sur ${teacherList.length} voix pastorales affichées`
                  : `Showing ${filteredAndSortedTeachers.length} of ${teacherList.length} pastoral voices`}
              </span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2ECE1] dark:bg-white/10 text-[#1E1931] dark:text-white font-semibold">
                  <span>
                    {isFr ? "Recherche :" : "Search:"} “{searchQuery.trim()}”
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={isFr ? "Supprimer la recherche" : "Remove search filter"}
                    className="hover:opacity-75 cursor-pointer"
                  >
                    <X weight="bold" className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedMinistry !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2D2542]/10 dark:bg-[#4EE2D8]/15 text-[#2D2542] dark:text-[#4EE2D8] font-semibold">
                  <Buildings weight="duotone" className="w-3.5 h-3.5" />
                  <span>{selectedMinistry}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMinistry("ALL")}
                    aria-label={
                      isFr ? "Supprimer le filtre ministère" : "Remove ministry filter"
                    }
                    className="hover:opacity-75 cursor-pointer"
                  >
                    <X weight="bold" className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSpecialty !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E726D]/10 dark:bg-[#4EE2D8]/15 text-[#0E726D] dark:text-[#4EE2D8] font-semibold">
                  <GraduationCap weight="duotone" className="w-3.5 h-3.5" />
                  <span>{selectedSpecialty}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialty("ALL")}
                    aria-label={
                      isFr
                        ? "Supprimer le filtre spécialité théologique"
                        : "Remove theological specialty filter"
                    }
                    className="hover:opacity-75 cursor-pointer"
                  >
                    <X weight="bold" className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllDirectoryFilters}
                className="px-3.5 py-1.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              >
                {isFr ? "Réinitialiser tous les filtres" : "Reset All Filters"}
              </button>
            )}
          </div>
        </div>

        {/* Directory Cards */}
        {filteredAndSortedTeachers.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white dark:bg-[#1B1630] border border-[#E3DACB] dark:border-white/12 text-center space-y-3">
            <p className="text-base font-serif font-bold text-[#1E1931] dark:text-white">
              {isFr
                ? "Aucun pasteur contributeur ne correspond à votre recherche."
                : "No pastoral contributors match your search criteria."}
            </p>
            <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6]">
              {searchQuery.trim()
                ? isFr
                  ? `Aucun résultat pour « ${searchQuery.trim()} » par nom ou affiliation ministérielle.`
                  : `No matches found for “${searchQuery.trim()}” across contributor names or ministry affiliations.`
                : isFr
                ? "Essayez un autre filtre de ministère ou de spécialité théologique."
                : "Try selecting another ministry affiliation or theological specialty filter."}
            </p>
            <button
              type="button"
              onClick={resetAllDirectoryFilters}
              className="px-4 py-2.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold cursor-pointer"
            >
              {isFr ? "Afficher tous les pasteurs" : "Show All Pastoral Contributors"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedTeachers.map((teacher) => {
              const perf = performanceMap[teacher.slug];
              const count = perf?.publishedCount || 0;
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

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2D2542] dark:bg-[#4EE2D8]/20 text-white dark:text-[#4EE2D8]">
                            {isFr ? "Choisi par LifeBook" : "Chosen Contributor"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F2ECE1] dark:bg-white/10 text-[#1E1931] dark:text-white">
                            <BookOpenText weight="duotone" className="w-3 h-3" />
                            <span>
                              {count} {isFr ? "enseignements" : "teachings"}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            <Headphones weight="duotone" className="w-3 h-3" />
                            <span>
                              {(perf?.totalListens || 0).toLocaleString()} ·{" "}
                              {perf?.avgCompletionRate || 0}%
                            </span>
                          </span>
                        </div>

                        <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white">
                          <Link href={`/teachers/${teacher.slug}`} className="hover:underline">
                            {highlightSearchMatch(teacher.name, searchQuery)}
                          </Link>
                        </h3>

                        <p className="text-xs font-medium text-[#52466D] dark:text-[#C8C2D6]">
                          {highlightSearchMatch(role, searchQuery)}
                        </p>

                        {/* Highlighted Ministry Affiliation Pill */}
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMinistry(
                                selectedMinistry === teacher.ministryAffiliation
                                  ? "ALL"
                                  : teacher.ministryAffiliation
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                              selectedMinistry === teacher.ministryAffiliation
                                ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-transparent"
                                : "bg-[#FAF8F5] dark:bg-[#120E22] text-[#2D2542] dark:text-[#4EE2D8] border-[#E3DACB] dark:border-white/15 hover:border-[#2D2542] dark:hover:border-[#4EE2D8]"
                            }`}
                          >
                            <Buildings weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {highlightSearchMatch(teacher.ministryAffiliation, searchQuery)}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Theological Conviction Box */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#EADBCE] dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5A4B7C] dark:text-[#4EE2D8] inline-flex items-center gap-1">
                          <GraduationCap weight="duotone" className="w-3.5 h-3.5" />
                          <span>
                            {isFr ? "Spécialité Théologique" : "Theological Specialty"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSpecialty(
                              selectedSpecialty === specialty ? "ALL" : specialty
                            )
                          }
                          className="text-[10px] font-bold text-[#3D2E5C] dark:text-[#4EE2D8] hover:underline cursor-pointer"
                        >
                          {selectedSpecialty === specialty
                            ? isFr
                              ? "Filtre actif ✓"
                              : "Active Filter ✓"
                            : isFr
                            ? "Filtrer par cette spécialité"
                            : "Filter by Specialty"}
                        </button>
                      </div>
                      <p className="text-xs font-serif italic text-[#2E2448] dark:text-[#F4EFE6]">
                        “{highlightSearchMatch(specialty, searchQuery)}”
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {specs.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedSpecialty(selectedSpecialty === tag ? "ALL" : tag)
                            }
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer border ${
                              selectedSpecialty === tag
                                ? "bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] border-transparent"
                                : "bg-white dark:bg-white/10 text-[#544773] dark:text-[#D5CEE6] border-[#DDD3C2] dark:border-white/10 hover:border-[#2D2542]"
                            }`}
                          >
                            {highlightSearchMatch(tag, searchQuery)}
                          </button>
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
                      <BookOpenText weight="duotone" className="w-4 h-4" />
                      <span>
                        {isFr ? "Ouvrir la Page du Pasteur" : "Open Pastor’s Page"}
                      </span>
                      <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedTeacherForTeaching(teacher)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#2D2542]/20 dark:border-white/20 hover:bg-[#F2ECE1] dark:hover:bg-white/10 text-xs font-bold text-[#2D2542] dark:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus weight="bold" className="w-3.5 h-3.5" />
                      <span>{isFr ? "Ajouter un Enseignement" : "Add Teaching"}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* TEACHER-HOSTED LIVE SANCTUARY CALL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
        <TeacherLiveCallBanner />
      </section>

      {/* LEADERSHIP PERFORMANCE ANALYTICS PANEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        <div className="rounded-3xl bg-white dark:bg-[#1B1630] border border-[#2D2542]/12 dark:border-white/15 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Analytics Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE3D6] dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#0E726D] dark:text-[#4EE2D8] font-bold">
                <ChartBar weight="duotone" className="w-4 h-4" />
                <span>
                  {isFr
                    ? "ANALYTIQUE PASTORALE · DIRECTION LIFEBOOK"
                    : "LEADERSHIP PERFORMANCE ANALYTICS"}
                </span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1E1931] dark:text-white mt-0.5">
                {isFr
                  ? "Écoutes Totales & Taux de Complétion par Enseignant"
                  : "Teacher Listen Counts & Completion Rates"}
              </h2>
              <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] mt-0.5">
                {isFr
                  ? "Suivez l'impact spirituel, le volume d'écoute et la persévérance d'écoute pour chaque pasteur contributeur."
                  : "Monitor total Sanctuary listens, completion rates, and per-teaching engagement across all appointed contributors."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-[#2D2542]/15 dark:border-white/15 bg-[#FAF8F5] dark:bg-white/5 text-xs font-bold text-[#2D2542] dark:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5"
            >
              <span>
                {isAnalyticsExpanded
                  ? isFr
                    ? "Masquer les détails"
                    : "Collapse Details"
                  : isFr
                  ? "Afficher le rapport détaillé"
                  : "Expand Detailed Breakdown"}
              </span>
              {isAnalyticsExpanded ? (
                <CaretUp weight="bold" className="w-3.5 h-3.5" />
              ) : (
                <CaretDown weight="bold" className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Top-Level Leadership KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#EADBCE] dark:border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6285] dark:text-[#B8B0C8] block">
                {isFr ? "ÉCOUTES TOTALES" : "TOTAL SANCTUARY LISTENS"}
              </span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1931] dark:text-white tabular-nums mt-1">
                {globalPerformance.totalListens.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#0E726D] dark:text-[#4EE2D8] font-semibold">
                {isFr ? "Sessions audio démarrées" : "Engaged audio sessions"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#EADBCE] dark:border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6285] dark:text-[#B8B0C8] block">
                {isFr ? "TAUX DE COMPLÉTION MOYEN" : "AVG COMPLETION RATE"}
              </span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0E726D] dark:text-[#4EE2D8] tabular-nums mt-1">
                {globalPerformance.avgCompletionRate}%
              </div>
              <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6]">
                {globalPerformance.totalCompletions.toLocaleString()}{" "}
                {isFr ? "enseignements terminés" : "completed listens"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#EADBCE] dark:border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6285] dark:text-[#B8B0C8] block">
                {isFr ? "ENSEIGNEMENTS PUBLIÉS" : "PUBLISHED TEACHINGS"}
              </span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1931] dark:text-white tabular-nums mt-1">
                {globalPerformance.totalTeachings}
              </div>
              <span className="text-[11px] text-[#5A506B] dark:text-[#C8C2D6]">
                {isFr
                  ? `Par ${teacherList.length} pasteurs nommés`
                  : `Across ${teacherList.length} appointed pastors`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#120E22] border border-[#EADBCE] dark:border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6285] dark:text-[#B8B0C8] block">
                {isFr ? "VOIX PASTORALE LA PLUS ÉCOUTÉE" : "MOST LISTENED PASTORAL VOICE"}
              </span>
              <div className="text-base sm:text-lg font-serif font-bold text-[#1E1931] dark:text-white truncate mt-1.5">
                {globalPerformance.topTeacherName}
              </div>
              <span className="text-[11px] font-mono font-bold text-[#B07D1E] dark:text-[#FFD770]">
                {globalPerformance.topTeacherListens.toLocaleString()} {isFr ? "écoutes" : "listens"}
              </span>
            </div>
          </div>

          {/* Per-Teacher & Per-Teaching Analytics Breakdown */}
          {isAnalyticsExpanded && (
            <div className="space-y-3 pt-2">
              {teacherList.map((teacher) => {
                const perf = performanceMap[teacher.slug];
                const isRowOpen = expandedTeacherAnalyticsSlug === teacher.slug;
                const specialty = isFr ? teacher.theologicalSpecialtyFr : teacher.theologicalSpecialty;

                return (
                  <div
                    key={teacher.slug}
                    className="rounded-2xl border border-[#E3DACB] dark:border-white/12 bg-[#FAF8F5]/60 dark:bg-[#120E22]/70 overflow-hidden transition-all"
                  >
                    {/* Teacher Summary Row */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-[#E3DACB] dark:border-white/20 shrink-0 bg-[#E0D7C6]">
                          <Image
                            src={teacher.portrait}
                            alt={teacher.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/teachers/${teacher.slug}`}
                              className="text-base font-serif font-bold text-[#1E1931] dark:text-white hover:underline"
                            >
                              {teacher.name}
                            </Link>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#2D2542]/10 dark:bg-white/10 text-[#2D2542] dark:text-[#4EE2D8]">
                              {perf?.publishedCount || 0} {isFr ? "enseignements" : "teachings"}
                            </span>
                          </div>
                          <p className="text-xs text-[#5A506B] dark:text-[#C8C2D6] truncate max-w-xl">
                            {teacher.ministryAffiliation} · {specialty}
                          </p>
                        </div>
                      </div>

                      {/* Metrics & Progress Bar */}
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6285] dark:text-[#B8B0C8] block">
                            {isFr ? "ÉCOUTES TOTALES" : "TOTAL LISTENS"}
                          </span>
                          <span className="text-lg font-mono font-bold text-[#1E1931] dark:text-white tabular-nums">
                            {(perf?.totalListens || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="w-40">
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="text-[#6E6285] dark:text-[#B8B0C8]">
                              {isFr ? "COMPLÉTION" : "COMPLETION"}
                            </span>
                            <span className="font-bold text-[#0E726D] dark:text-[#4EE2D8]">
                              {perf?.avgCompletionRate || 0}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#E5DEC9] dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] to-[#4EE2D8]"
                              style={{ width: `${Math.max(4, perf?.avgCompletionRate || 0)}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTeacherAnalyticsSlug(isRowOpen ? null : teacher.slug)
                          }
                          className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[#2D2542]/15 dark:border-white/15 bg-white dark:bg-[#1B1630] text-xs font-bold text-[#2D2542] dark:text-white hover:bg-[#F2ECE1] dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          {isRowOpen
                            ? isFr
                              ? "Masquer enseignements"
                              : "Hide Teachings"
                            : isFr
                            ? "Détail par enseignement"
                            : "Per-Teaching Metrics"}
                        </button>
                      </div>
                    </div>

                    {/* Per-Teaching Analytics Sub-Table */}
                    {isRowOpen && perf && (
                      <div className="border-t border-[#E3DACB] dark:border-white/10 bg-white dark:bg-[#1B1630] px-4 sm:px-6 py-4 space-y-2.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#6E6285] dark:text-[#B8B0C8]">
                          {isFr
                            ? `PERFORMANCE DÉTAILLÉE DES ENSEIGNEMENTS DE ${teacher.name.toUpperCase()}`
                            : `PUBLISHED TEACHING PERFORMANCE FOR ${teacher.name.toUpperCase()}`}
                        </div>

                        {perf.teachingsBreakdown.length === 0 ? (
                          <p className="text-xs text-[#6E6285] dark:text-[#C8C2D6] py-2">
                            {isFr
                              ? "Aucun enseignement publié pour ce pasteur."
                              : "No teachings published for this contributor yet."}
                          </p>
                        ) : (
                          <div className="divide-y divide-[#EAE3D6] dark:divide-white/10">
                            {perf.teachingsBreakdown.map(({ teaching, metrics }) => {
                              const tTitle = isFr ? teaching.titleFr : teaching.title;
                              const isThisPlaying =
                                currentTrack?.slug === teaching.slug && isPlaying;

                              return (
                                <div
                                  key={teaching.slug}
                                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <Link
                                        href={`/living-word/${teaching.slug}`}
                                        className="font-bold text-[#1E1931] dark:text-white hover:underline"
                                      >
                                        {tTitle}
                                      </Link>
                                      <span className="px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-white/10 text-[10px] font-mono text-[#5A4B7C] dark:text-[#4EE2D8]">
                                        {teaching.scripture}
                                      </span>
                                      <span className="text-[11px] text-[#6E6285] dark:text-[#B8B0C8]">
                                        ({teaching.duration})
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#6E6285] dark:text-[#B8B0C8]">
                                      {isFr ? "Durée moyenne d'écoute :" : "Avg listen duration:"}{" "}
                                      <strong>{metrics.avgListenMinutes} min</strong>
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-4">
                                    <div className="text-right">
                                      <span className="font-mono font-bold text-[#1E1931] dark:text-white tabular-nums">
                                        {metrics.listenCount.toLocaleString()}
                                      </span>{" "}
                                      <span className="text-[11px] text-[#6E6285] dark:text-[#B8B0C8]">
                                        {isFr ? "écoutes" : "listens"}
                                      </span>
                                    </div>

                                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px]">
                                      {metrics.completionRate}% {isFr ? "complété" : "completion"}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (currentTrack?.slug === teaching.slug) {
                                          togglePlay();
                                        } else {
                                          playTeaching(teaching);
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] font-bold text-[11px] hover:opacity-90 transition-opacity cursor-pointer"
                                    >
                                      {isThisPlaying
                                        ? isFr
                                          ? "En écoute"
                                          : "Playing"
                                        : isFr
                                        ? "Écouter"
                                        : "Listen"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                  {isFr
                    ? "Choisir & Nommer un Pasteur Contributeur"
                    : "Appoint a Pastoral Contributor"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F2ECE1] dark:bg-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                <X weight="bold" className="w-4 h-4" />
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
                    {isFr ? "Rôle Ministériel" : "Ministry Role"}
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Pastoral Contributor & Expository Teacher"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    {isFr
                      ? "Spécialité & Vocation Théologique *"
                      : "Theological Specialty & Conviction *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="e.g. Expository Preaching & Covenant Grace"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    {isFr
                      ? "Domaines Clés (séparés par virgule)"
                      : "Specialty Tags (comma-separated)"}
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Expository Preaching, Contemplative Prayer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2542]/20 dark:border-white/20 bg-[#FAF8F5] dark:bg-[#120E22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    {isFr ? "Formation Théologique" : "Theological Education"}
                  </label>
                  <input
                    type="text"
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    placeholder="e.g. M.Div., RTS"
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
                  {appointSuccess}
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
                <X weight="bold" className="w-4 h-4" />
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
                      setTeachingCategory(
                        e.target.value as "Faith" | "Prayer" | "Hope" | "Discipleship"
                      )
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
                  {isFr
                    ? "Texte Complet de l'Enseignement & Méditation Audio *"
                    : "Full Expository Teaching & Audio Script *"}
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
                  {teachingSuccess}
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
