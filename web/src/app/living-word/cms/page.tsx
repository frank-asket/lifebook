"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useId } from "react";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { trackEvent } from "@/lib/telemetry";

interface TheologicalRubric {
  scriptureAccuracy: number;
  christocentricFocus: number;
  pastoralTone: number;
  historicalOrthodoxy: number;
  notes: string;
}

interface CMSTeaching {
  slug: string;
  title: string;
  teacher: string;
  teacherRole: string;
  category: string;
  duration: string;
  scripture: string;
  excerpt: string;
  fullBody?: string;
  theologicalNotes?: string;
  status: "draft" | "under_pastoral_review" | "approved" | "published" | "needs_revision";
  audioUrl?: string | null;
  videoUrl?: string | null;
  theologicalRubric?: TheologicalRubric;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export default function LivingWordCMSPage() {
  const { isFr } = useLanguage();
  const teachingTitleId = useId();
  const teachingScriptureId = useId();
  const teachingTeacherId = useId();
  const teachingCategoryId = useId();
  const teachingDurationId = useId();
  const teachingExcerptId = useId();
  const teachingBodyId = useId();
  const teachingTheologyId = useId();
  const rubricReviewerId = useId();
  const rubricNotesId = useId();

  const [teachings, setTeachings] = useState<CMSTeaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "create" | "preview">("queue");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected teaching for theological review
  const [reviewingTeaching, setReviewingTeaching] = useState<CMSTeaching | null>(null);
  const [reviewerName, setReviewerName] = useState("Pastor Asket");
  const [scriptureAcc, setScriptureAcc] = useState(5);
  const [christocentric, setChristocentric] = useState(5);
  const [pastoralTone, setPastoralTone] = useState(5);
  const [orthodoxy, setOrthodoxy] = useState(5);
  const [pastoralNotes, setPastoralNotes] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // New teaching form state
  const [newTitle, setNewTitle] = useState("");
  const [newTeacher, setNewTeacher] = useState("Pastor Asket");
  const [newTeacherRole, setNewTeacherRole] = useState("LifeBook pastoral teaching contributor");
  const [newCategory, setNewCategory] = useState("Faith");
  const [newDuration, setNewDuration] = useState("10 min");
  const [newScripture, setNewScripture] = useState("Romans 8:28");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newFullBody, setNewFullBody] = useState("");
  const [newTheologicalNotes, setNewTheologicalNotes] = useState("");
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  // Fetch CMS teachings
  const fetchTeachings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lifebook/livingword/cms/teachings");
      if (res.ok) {
        const data = await res.json();
        setTeachings(data.teachings || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTeachings();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTeachings]);

  // Open review modal
  const handleOpenReview = (t: CMSTeaching) => {
    setReviewingTeaching(t);
    setReviewerName(t.reviewedBy || "Pastor Asket");
    if (t.theologicalRubric) {
      setScriptureAcc(t.theologicalRubric.scriptureAccuracy || 5);
      setChristocentric(t.theologicalRubric.christocentricFocus || 5);
      setPastoralTone(t.theologicalRubric.pastoralTone || 5);
      setOrthodoxy(t.theologicalRubric.historicalOrthodoxy || 5);
      setPastoralNotes(t.theologicalRubric.notes || "");
    } else {
      setScriptureAcc(5);
      setChristocentric(5);
      setPastoralTone(5);
      setOrthodoxy(5);
      setPastoralNotes("");
    }
  };

  // Submit review verdict
  const handleSubmitReview = async (verdict: "published" | "approved" | "needs_revision") => {
    if (!reviewingTeaching) return;
    setIsReviewSubmitting(true);

    try {
      const res = await fetch(`/api/lifebook/livingword/cms/${reviewingTeaching.slug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: reviewerName,
          verdict,
          rubric: {
            scriptureAccuracy: scriptureAcc,
            christocentricFocus: christocentric,
            pastoralTone,
            historicalOrthodoxy: orthodoxy,
          },
          notes: pastoralNotes || `Pastoral audit completed by ${reviewerName}`,
        }),
      });

      if (res.ok) {
        trackEvent("pastoral_teaching_reviewed", {
          slug: reviewingTeaching.slug,
          verdict,
          reviewer: reviewerName,
        });
        setReviewingTeaching(null);
        void fetchTeachings();
      }
    } catch {
      // ignore
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Submit new teaching draft
  const handleCreateTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newScripture) return;
    setIsCreateSubmitting(true);

    try {
      const res = await fetch("/api/lifebook/livingword/cms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          teacher: newTeacher.trim(),
          teacherRole: newTeacherRole.trim(),
          category: newCategory,
          duration: newDuration.trim(),
          scripture: newScripture.trim(),
          excerpt: newExcerpt.trim() || newTitle.trim(),
          fullBody: newFullBody.trim(),
          theologicalNotes: newTheologicalNotes.trim(),
          status: "under_pastoral_review",
        }),
      });

      const data = await res.json();
      if (res.ok && data.teaching) {
        setCreateMessage(isFr ? "Enseignement soumis au comité pastoral avec succès !" : "Teaching successfully submitted to Pastoral Review board!");
        trackEvent("pastoral_teaching_submitted", {
          title: newTitle,
          category: newCategory,
          teacher: newTeacher,
        });
        setNewTitle("");
        setNewExcerpt("");
        setNewFullBody("");
        setNewTheologicalNotes("");
        void fetchTeachings();
      } else {
        setCreateMessage(data.detail || "Error submitting teaching.");
      }
    } catch {
      setCreateMessage(isFr ? "Erreur réseau. Veuillez réessayer." : "Network error. Please try again.");
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const filteredTeachings = teachings.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const reviewPendingCount = teachings.filter((t) => t.status === "under_pastoral_review").length;
  const publishedCount = teachings.filter((t) => t.status === "published").length;

  return (
    <main className="min-h-screen bg-[#fcf9f5] text-[#2d2542] font-sans antialiased pb-24">
      {/* CMS HEADER */}
      <header className="border-b border-[#2d2542]/10 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#1e1931]">
              LifeBook
            </Link>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fdf6e6] text-[#b07d1e] border border-[#edd79d]">
              {isFr ? "CMS Pastoral LivingWord P5" : "LivingWord Pastoral CMS P5"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/living-word"
              className="px-3 py-1.5 rounded-lg border border-[#2d2542]/20 font-semibold text-[#2d2542] hover:bg-[#f5effb] transition-colors"
            >
              {isFr ? "← Voir LivingWord public" : "← Public LivingWord Library"}
            </Link>
            <LanguageToggle />
            <Link href="/" className="font-medium text-[#705e8c] hover:text-[#2d2542] transition-colors">
              {isFr ? "Accueil" : "Home"}
            </Link>
          </div>
        </div>
      </header>

      {/* BANNER / OVERVIEW */}
      <section className="py-8 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2d2542]/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#b07d1e] block mb-1">
              {isFr ? "Comité d'audit théologique & Échelle de contenu" : "Theological Review Board & Content Scaling"}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1e1931] m-0">
              {isFr ? "Gestion des enseignements pastoraux" : "Pastoral Review & Editorial CMS"}
            </h1>
            <p className="text-xs sm:text-sm text-[#5e5370] mt-1 m-0">
              {isFr
                ? "Garantir l'orthodoxie biblique, le ton christocentrique et l'absence d'évangile de prospérité avant publication."
                : "Ensure biblical orthodoxy, Christocentric compassion, and sound doctrine across all audio & textual homilies."}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-[#2d2542]/10 text-center shadow-xs">
              <span className="text-[10px] uppercase text-[#705e8c] block font-bold">Total</span>
              <strong className="text-lg font-serif text-[#1e1931]">{teachings.length}</strong>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-[#edd79d] text-center shadow-xs">
              <span className="text-[10px] uppercase text-[#916212] block font-bold">
                {isFr ? "À auditer" : "In Review"}
              </span>
              <strong className="text-lg font-serif text-[#916212]">{reviewPendingCount}</strong>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-[#bbf7d0] text-center shadow-xs">
              <span className="text-[10px] uppercase text-[#166534] block font-bold">
                {isFr ? "Publiés" : "Published"}
              </span>
              <strong className="text-lg font-serif text-[#166534]">{publishedCount}</strong>
            </div>
          </div>
        </div>

        {/* CMS TABS */}
        <div className="flex items-center gap-2 pt-6">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            id="cms-tab-queue"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "queue"
                ? "bg-[#2d2542] text-white shadow-xs"
                : "bg-white text-[#5e5370] hover:bg-gray-100 border border-[#2d2542]/10"
            }`}
          >
            {isFr ? `File d'audit pastoral (${teachings.length})` : `Editorial Review Queue (${teachings.length})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("create")}
            id="cms-tab-create"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "create"
                ? "bg-[#2d2542] text-white shadow-xs"
                : "bg-white text-[#5e5370] hover:bg-gray-100 border border-[#2d2542]/10"
            }`}
          >
            {isFr ? "+ Soumettre un nouvel enseignement" : "+ Submit New Teaching Draft"}
          </button>
        </div>
      </section>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === "queue" && (
        <section className="max-w-6xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#705e8c] font-medium">
              {isFr ? "Filtrer par statut éditorial :" : "Filter by editorial status:"}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-[#2d2542]/20 bg-white"
            >
              <option value="all">{isFr ? "Tous les statuts" : "All Statuses"}</option>
              <option value="under_pastoral_review">{isFr ? "En audit pastoral" : "Under Pastoral Review"}</option>
              <option value="published">{isFr ? "Publié pour l'assemblée" : "Published"}</option>
              <option value="needs_revision">{isFr ? "Révision demandée" : "Needs Revision"}</option>
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[#705e8c]">
              {isFr ? "Chargement des enseignements..." : "Loading pastoral catalog..."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTeachings.map((t) => {
                const isUnderReview = t.status === "under_pastoral_review";
                const isPublished = t.status === "published";
                return (
                  <div
                    key={t.slug}
                    className="bg-white rounded-2xl p-5 border border-[#2d2542]/10 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#faf5ff] text-[#705eaa] border border-[#e9d5ff]">
                          {t.category} · {t.duration}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isPublished
                              ? "bg-emerald-100 text-emerald-800"
                              : isUnderReview
                              ? "bg-amber-100 text-amber-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#1e1931] leading-snug m-0">
                        {t.title}
                      </h3>

                      <p className="text-xs text-[#705e8c] font-medium m-0">
                        {t.teacher} ({t.teacherRole}) · <span className="font-bold text-[#2d2542]">{t.scripture}</span>
                      </p>

                      <p className="text-xs text-[#5e5370] line-clamp-2 italic m-0">
                        “{t.excerpt}”
                      </p>

                      {t.theologicalNotes && (
                        <div className="p-2.5 rounded-xl bg-[#f8f5fc] border border-[#dccff3] text-[11px] text-[#473b61]">
                          <strong className="block text-[10px] font-bold uppercase text-[#705eaa] mb-0.5">
                            {isFr ? "Notes d'exégèse théologique :" : "Theological Exegesis Notes:"}
                          </strong>
                          {t.theologicalNotes}
                        </div>
                      )}
                    </div>

                    {/* ACTIONS & AUDIT SUMMARY */}
                    <div className="pt-3 border-t border-[#2d2542]/10 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-[#705e8c]">
                        {t.reviewedBy ? (
                          <span>
                            {isFr ? "Audité par" : "Audited by"} <strong>{t.reviewedBy}</strong>
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">
                            {isFr ? "● En attente d'audit pastoral" : "● Awaiting Pastoral Review"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/living-word/${t.slug}`}
                          className="px-2.5 py-1 rounded-lg border border-[#2d2542]/20 hover:bg-gray-50 text-[11px] font-semibold text-[#2d2542]"
                        >
                          {isFr ? "Voir" : "View"}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(t)}
                          id={`review-teaching-${t.slug}`}
                          className="px-3 py-1 rounded-lg bg-[#705eaa] hover:bg-[#5a4891] text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          {isFr ? "Auditer la doctrine" : "Audit Rubric"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: CREATE TEACHING DRAFT */}
      {activeTab === "create" && (
        <section className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#2d2542]/10 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1e1931] m-0">
                {isFr ? "Soumettre un enseignement au comité pastoral" : "Submit New Pastoral Teaching for Theological Review"}
              </h2>
              <p className="text-xs text-[#5e5370] mt-1 m-0">
                {isFr
                  ? "Toute méditation ou prédication doit être examinée par le conseil pastoral avant mise en ligne."
                  : "All teaching homilies and audio commentaries undergo orthodox validation prior to release."}
              </p>
            </div>

            {createMessage && (
              <div className="p-3.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs font-semibold text-[#166534]">
                ✓ {createMessage}
              </div>
            )}

            <form onSubmit={handleCreateTeaching} className="space-y-4" id="create-teaching-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={teachingTitleId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                    {isFr ? "Titre de l'enseignement" : "Teaching Title"}
                  </label>
                  <input
                    id={teachingTitleId}
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Abiding in the Vine during Storms"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20 focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                  />
                </div>

                <div>
                  <label htmlFor={teachingScriptureId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                    {isFr ? "Passage biblique central" : "Scripture Anchor"}
                  </label>
                  <input
                    id={teachingScriptureId}
                    type="text"
                    required
                    value={newScripture}
                    onChange={(e) => setNewScripture(e.target.value)}
                    placeholder="e.g. John 15:5-8 or Romans 8:28"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20 focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor={teachingTeacherId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                    {isFr ? "Enseignant / Pasteur" : "Teacher / Speaker"}
                  </label>
                  <input
                    id={teachingTeacherId}
                    type="text"
                    required
                    value={newTeacher}
                    onChange={(e) => setNewTeacher(e.target.value)}
                    placeholder="Pastor Asket"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                    {isFr ? "Rôle / Ministère" : "Teacher Ministry Role"}
                  </label>
                  <input
                    type="text"
                    value={newTeacherRole}
                    onChange={(e) => setNewTeacherRole(e.target.value)}
                    placeholder="Pastoral contributor"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20"
                  />
                </div>

                <div>
                  <label htmlFor={teachingCategoryId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                    {isFr ? "Catégorie théologique" : "Theological Category"}
                  </label>
                  <select
                    id={teachingCategoryId}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20 bg-white"
                  >
                    <option value="Faith">{isFr ? "Foi" : "Faith"}</option>
                    <option value="Prayer">{isFr ? "Prière" : "Prayer"}</option>
                    <option value="Hope">{isFr ? "Espérance" : "Hope"}</option>
                    <option value="Discipleship">{isFr ? "Vie chrétienne" : "Discipleship"}</option>
                    <option value="Peace">{isFr ? "Paix" : "Peace"}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={teachingDurationId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                    {isFr ? "Durée estimée" : "Estimated Duration"}
                  </label>
                  <input
                    id={teachingDurationId}
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="10 min"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={teachingExcerptId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                  {isFr ? "Extrait court ou verset clé" : "Summary / Hook Excerpt"}
                </label>
                <input
                  id={teachingExcerptId}
                  type="text"
                  required
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="e.g. Apart from Me you can do nothing."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20"
                />
              </div>

              <div>
                <label htmlFor={teachingBodyId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                  {isFr ? "Texte intégral de la prédication" : "Full Homily / Teaching Body"}
                </label>
                <textarea
                  id={teachingBodyId}
                  rows={4}
                  value={newFullBody}
                  onChange={(e) => setNewFullBody(e.target.value)}
                  placeholder={
                    isFr
                      ? "Développez la réflexion pastorale ici..."
                      : "Write or paste the pastoral reflection text here..."
                  }
                  className="w-full text-xs p-3.5 rounded-xl border border-[#2d2542]/20 focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                />
              </div>

              <div>
                <label htmlFor={teachingTheologyId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                  {isFr ? "Notes d'exégèse (grec, hébreu, contexte)" : "Theological & Hermeneutical Notes"}
                </label>
                <textarea
                  id={teachingTheologyId}
                  rows={2}
                  value={newTheologicalNotes}
                  onChange={(e) => setNewTheologicalNotes(e.target.value)}
                  placeholder={
                    isFr
                      ? "Notes de fond pour les pasteurs auditeurs..."
                      : "Contextual background, original language insights..."
                  }
                  className="w-full text-xs p-3 rounded-xl border border-[#2d2542]/20 bg-[#faf8fc]"
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCreateSubmitting}
                  id="submit-teaching-draft-btn"
                  className="px-6 py-2.5 rounded-xl bg-[#2d2542] hover:bg-[#1a1429] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreateSubmitting
                    ? (isFr ? "Envoi en cours..." : "Submitting to Board...")
                    : (isFr ? "Soumettre à l'audit pastoral →" : "Submit for Pastoral Audit →")}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* MODAL: PASTORAL THEOLOGICAL AUDIT RUBRIC */}
      {reviewingTeaching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#2d2542]/20 shadow-2xl space-y-5 animate-scale-in"
            id="pastoral-review-rubric-modal"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2542]/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#b07d1e]">
                  {isFr ? "Audit d'orthodoxie théologique" : "Theological Orthodoxy Audit"}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1e1931] m-0">
                  {reviewingTeaching.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingTeaching(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#2d2542] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor={rubricReviewerId} className="block font-bold text-[#2d2542] mb-1">
                  {isFr ? "Pasteur / Auditeur référent :" : "Reviewing Pastor / Elder:"}
                </label>
                <input
                  id={rubricReviewerId}
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#2d2542]/20"
                />
              </div>

              {/* 4 RUBRIC METRICS */}
              <div className="grid grid-cols-2 gap-3 bg-[#faf7f2] p-4 rounded-2xl border border-[#2d2542]/10">
                <div>
                  <label className="block font-bold text-[#2d2542] text-[11px] mb-1">
                    1. {isFr ? "Fidélité au texte biblique" : "Scripture Fidelity"}
                  </label>
                  <select
                    value={scriptureAcc}
                    onChange={(e) => setScriptureAcc(Number(e.target.value))}
                    className="w-full text-xs p-1.5 rounded-lg border border-[#2d2542]/20 bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Exacte</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5) Solide</option>
                    <option value={3}>⭐⭐⭐ (3/5) Acceptable</option>
                    <option value={2}>{"⭐⭐ (2/5) Risque d'erreur"}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2d2542] text-[11px] mb-1">
                    2. {isFr ? "Centré sur Christ" : "Christocentric Focus"}
                  </label>
                  <select
                    value={christocentric}
                    onChange={(e) => setChristocentric(Number(e.target.value))}
                    className="w-full text-xs p-1.5 rounded-lg border border-[#2d2542]/20 bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Parfait</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5) Clair</option>
                    <option value={3}>⭐⭐⭐ (3/5) Moyen</option>
                    <option value={2}>⭐⭐ (2/5) Trop moraliste</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2d2542] text-[11px] mb-1">
                    3. {isFr ? "Ton pastoral & grâce" : "Pastoral Tone & Grace"}
                  </label>
                  <select
                    value={pastoralTone}
                    onChange={(e) => setPastoralTone(Number(e.target.value))}
                    className="w-full text-xs p-1.5 rounded-lg border border-[#2d2542]/20 bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Bienveillant</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5) Constructif</option>
                    <option value={3}>⭐⭐⭐ (3/5) Neutre</option>
                    <option value={2}>⭐⭐ (2/5) Trop culpabilisant</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2d2542] text-[11px] mb-1">
                    4. {isFr ? "Orthodoxie historique" : "Historical Orthodoxy"}
                  </label>
                  <select
                    value={orthodoxy}
                    onChange={(e) => setOrthodoxy(Number(e.target.value))}
                    className="w-full text-xs p-1.5 rounded-lg border border-[#2d2542]/20 bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Conforme</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5) Fidèle</option>
                    <option value={3}>⭐⭐⭐ (3/5) À clarifier</option>
                    <option value={2}>⭐⭐ (2/5) Évangile déformé</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={rubricNotesId} className="block font-bold text-[#2d2542] mb-1">
                  {isFr ? "Observations pastorales et recommandations :" : "Pastoral Review Observations & Endorsement:"}
                </label>
                <textarea
                  id={rubricNotesId}
                  rows={2}
                  value={pastoralNotes}
                  onChange={(e) => setPastoralNotes(e.target.value)}
                  placeholder={
                    isFr
                      ? "ex. Enseignement approuvé. Bonne mise en valeur de la grâce sans compromis théologique."
                      : "e.g. Excellent Christocentric balance. Fully endorsed for congregation study."
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-[#2d2542]/20"
                />
              </div>
            </div>

            {/* VERDICT BUTTONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 pt-2 border-t border-[#2d2542]/10">
              <button
                type="button"
                onClick={() => handleSubmitReview("needs_revision")}
                disabled={isReviewSubmitting}
                className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs cursor-pointer"
              >
                {isFr ? "Demander des révisions" : "Request Revisions"}
              </button>
              <button
                type="button"
                onClick={() => handleSubmitReview("approved")}
                disabled={isReviewSubmitting}
                className="px-3.5 py-2 rounded-xl bg-[#705eaa] hover:bg-[#59488a] text-white font-semibold text-xs cursor-pointer"
              >
                {isFr ? "Approuver (en réserve)" : "Approve as Staged"}
              </button>
              <button
                type="button"
                onClick={() => handleSubmitReview("published")}
                disabled={isReviewSubmitting}
                className="px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {isFr ? "✓ Publier pour l'assemblée" : "✓ Publish to Congregation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
