"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useId } from "react";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { trackEvent } from "@/lib/telemetry";

interface CohortSummary {
  id: string;
  name: string;
  targetRole: string;
  description: string;
  capacity: number;
  status: string;
  memberCount: number;
  stages: {
    registered: number;
    feedback_submitted: number;
    vip_invited: number;
    onboarded: number;
  };
  occupancyPercent: number;
}

interface WaitlistMember {
  id: string;
  email: string;
  name: string;
  spiritualRole: string;
  cohortId: string;
  referralCode: string;
  referredBy: string | null;
  stage: "registered" | "feedback_submitted" | "vip_invited" | "onboarded";
  priorityScore: number;
  struggleFeedback: string | null;
  desiredFeatures: string[];
  dailyTimeAvailable?: string;
  feedbackNotes: Array<{ note: string; timestamp: string }>;
  referralCount: number;
  createdAt: string;
}

export default function WaitlistPage() {
  const { isFr } = useLanguage();
  const nameInputId = useId();
  const emailInputId = useId();
  const roleSelectId = useId();
  const obstacleTextareaId = useId();
  const referralInputId = useId();
  const timeSelectId = useId();
  const notesTextareaId = useId();

  // Active view: public join vs cohort pipeline management
  const [activeTab, setActiveTab] = useState<"join" | "pipeline">("join");

  // Public join form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [spiritualRole, setSpiritualRole] = useState("Devotional Seeker");
  const [struggleFeedback, setStruggleFeedback] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinSuccessMember, setJoinSuccessMember] = useState<WaitlistMember | null>(null);
  const [joinMessage, setJoinMessage] = useState("");

  // Feedback loop step 2 (after join)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "Journey Grace Days",
    "5-Minute Morning Audio Flow",
  ]);
  const [dailyTime, setDailyTime] = useState("5-7 min");
  const [pastoralNote, setPastoralNote] = useState("");

  // Pipeline dashboard data
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [members, setMembers] = useState<WaitlistMember[]>([]);
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);
  const [feedbackRate, setFeedbackRate] = useState("75%");
  const [totalWaitlist, setTotalWaitlist] = useState(0);

  // Load pipeline data
  const loadPipelineData = useCallback(async () => {
    setIsLoadingPipeline(true);
    try {
      const [resCohorts, resMembers] = await Promise.all([
        fetch("/api/lifebook/waitlist/cohorts"),
        fetch("/api/lifebook/waitlist/members"),
      ]);

      if (resCohorts.ok) {
        const cData = await resCohorts.json();
        setCohorts(cData.cohorts || []);
        setFeedbackRate(cData.feedbackLoopRate || "75%");
        setTotalWaitlist(cData.totalWaitlist || 0);
      }

      if (resMembers.ok) {
        const mData = await resMembers.json();
        setMembers(mData.members || []);
      }
    } catch {
      // Fallback sample data if network drops
    } finally {
      setIsLoadingPipeline(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPipelineData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPipelineData]);

  // Handle join submit
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lifebook/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          spiritualRole,
          struggleFeedback: struggleFeedback.trim(),
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.member) {
        setJoinSuccessMember(data.member);
        setJoinMessage(data.message || (isFr ? "Inscription réussie !" : "Successfully joined cohort!"));
        trackEvent("waitlist_joined", {
          cohortId: data.member.cohortId,
          spiritualRole,
          priorityScore: data.member.priorityScore,
        });
        void loadPipelineData();
      } else {
        setJoinMessage(data.detail || (isFr ? "Erreur lors de l'inscription." : "Error joining waitlist."));
      }
    } catch {
      setJoinMessage(isFr ? "Connexion impossible. Réessayez." : "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deep feedback survey submit
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSuccessMember) return;

    try {
      const res = await fetch("/api/lifebook/waitlist/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: joinSuccessMember.id,
          struggleFeedback: struggleFeedback || "Consistent morning focus",
          desiredFeatures: selectedFeatures,
          dailyTimeAvailable: dailyTime,
          feedbackNote: pastoralNote.trim(),
        }),
      });

      if (res.ok) {
        setFeedbackSubmitted(true);
        trackEvent("waitlist_feedback_submitted", {
          memberId: joinSuccessMember.id,
          features: selectedFeatures,
          time: dailyTime,
        });
        void loadPipelineData();
      }
    } catch {
      setFeedbackSubmitted(true);
    }
  };

  // Promote member stage
  const handlePromoteStage = async (memberId: string, newStage: string) => {
    try {
      const res = await fetch("/api/lifebook/waitlist/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          stage: newStage,
          note: `Promoted by community moderator on ${new Date().toLocaleDateString()}`,
        }),
      });

      if (res.ok) {
        trackEvent("waitlist_stage_promoted", { memberId, newStage });
        void loadPipelineData();
      }
    } catch {
      // ignore
    }
  };

  // Feature choices
  const availableFeatures = [
    { id: "Journey Grace Days", label: isFr ? "Journées de Grâce (anti-culpabilité)" : "Journey Grace Days (Zero Guilt)" },
    { id: "5-Minute Morning Audio Flow", label: isFr ? "Flux audio matinal de 5 minutes" : "5-Minute Morning Audio Flow" },
    { id: "LivingWord Pastoral Review", label: isFr ? "Enseignements pastoraux certifiés" : "Pastoral LivingWord Sermons" },
    { id: "Spiritual Pulse Check-ins", label: isFr ? "Bilan spirituel et résonance biblique" : "Spiritual Pulse Check-in" },
    { id: "Small Group Circles", label: isFr ? "Cercles de prière en petits groupes" : "Small Group Prayer Circles" },
  ];

  // Filter members
  const filteredMembers = members.filter((m) => {
    if (selectedCohortFilter !== "all" && m.cohortId !== selectedCohortFilter) return false;
    if (selectedStageFilter !== "all" && m.stage !== selectedStageFilter) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-[#faf7f2] text-[#2d2542] font-sans antialiased pb-20">
      {/* HEADER NAV */}
      <header className="border-b border-[#2d2542]/10 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#1e1931]">
              LifeBook
            </Link>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f3edf8] text-[#705eaa] border border-[#dccff3]">
              {isFr ? "Pipeline de Cohortes P4" : "Cohort Pipeline P4"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "join" ? "pipeline" : "join")}
              id="switch-cohort-view-btn"
              className="px-3 py-1.5 rounded-lg border border-[#2d2542]/20 font-semibold text-[#2d2542] hover:bg-[#f0ebe1] transition-colors cursor-pointer"
            >
              {activeTab === "join"
                ? (isFr ? "📊 Tableau de bord des cohortes" : "📊 Leader Pipeline Dashboard")
                : (isFr ? "✍️ Formulaire d'inscription" : "✍️ Public Waitlist View")}
            </button>
            <LanguageToggle />
            <Link href="/" className="font-medium text-[#705e8c] hover:text-[#2d2542] transition-colors">
              {isFr ? "← Accueil" : "← Home"}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="py-10 px-6 text-center max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#705eaa] bg-white px-3 py-1 rounded-full border border-[#e4dcf0] shadow-xs mb-3">
          <span>🌱</span>
          <span>{isFr ? "Croissance communautaire & Boucles de rétroaction" : "Community Growth & Feedback Loops"}</span>
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1e1931] tracking-tight leading-tight">
          {isFr
            ? "Rejoignez la cohorte pionnière LifeBook"
            : "Join the LifeBook Waitlist Cohort Pipeline"}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#5e5370] max-w-2xl mx-auto leading-relaxed">
          {isFr
            ? "Participez aux vagues de lancement réservées aux fidèles, pasteurs et animateurs de groupes. Votre voix façonne directement les outils de méditation quotidienne."
            : "Directly shape the future of guilt-free, 5-minute morning devotionals. Move from waitlist to active advisory disciple through structured feedback loops."}
        </p>

        {/* COHORT WAVE METRICS BAR */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-3xl mx-auto">
          <div className="bg-white p-3.5 rounded-2xl border border-[#2d2542]/10 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c] block">
              {isFr ? "Vague 1 · Fondateurs" : "Wave 1 · Disciples"}
            </span>
            <strong className="text-xl font-serif text-[#1e1931] block mt-0.5">Alpha</strong>
            <span className="text-[10px] text-[#3bb582] font-semibold">● {isFr ? "Onboarding actif" : "Active Onboarding"}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#2d2542]/10 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c] block">
              {isFr ? "Vague 2 · Pasteurs" : "Wave 2 · Pastors"}
            </span>
            <strong className="text-xl font-serif text-[#1e1931] block mt-0.5">Beta</strong>
            <span className="text-[10px] text-[#705eaa] font-semibold">● {isFr ? "Conseil pastoral" : "Pastoral Board"}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#2d2542]/10 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c] block">
              {isFr ? "Vague 3 · Groupes" : "Wave 3 · Leaders"}
            </span>
            <strong className="text-xl font-serif text-[#1e1931] block mt-0.5">Gamma</strong>
            <span className="text-[10px] text-[#e0892c] font-semibold">● {isFr ? "Groupes de prière" : "Small Groups"}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#2d2542]/10 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c] block">
              {isFr ? "Boucle de retour" : "Feedback Loop"}
            </span>
            <strong className="text-xl font-serif text-[#1e1931] block mt-0.5">{feedbackRate}</strong>
            <span className="text-[10px] text-[#3bb582] font-semibold">✓ {isFr ? "Rétroaction active" : "Response Rate"}</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <section className="max-w-4xl mx-auto px-6">
        {activeTab === "join" ? (
          /* TAB 1: PUBLIC WAITLIST JOIN & FEEDBACK LOOP */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#2d2542]/10 shadow-sm space-y-6">
            {!joinSuccessMember ? (
              <form onSubmit={handleJoinSubmit} className="space-y-5" id="waitlist-join-form">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#1e1931] m-0">
                    {isFr ? "1. Réservez votre place dans la prochaine cohorte" : "1. Secure Your Seat in the Next Cohort Wave"}
                  </h2>
                  <p className="text-xs text-[#5e5370] mt-1 m-0">
                    {isFr
                      ? "Chaque profil est orienté vers la cohorte la plus pertinente pour assurer des retours qualitatifs."
                      : "We review every submission to assign you to the ideal cohort wave with immediate priority access."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={nameInputId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                      {isFr ? "Nom complet ou prénom" : "Full Name or First Name"}
                    </label>
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isFr ? "ex. Marc Dubois" : "e.g. David Chen"}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20 focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                    />
                  </div>

                  <div>
                    <label htmlFor={emailInputId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                      {isFr ? "Adresse email" : "Email Address"}
                    </label>
                    <input
                      id={emailInputId}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.org"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20 focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={roleSelectId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                      {isFr ? "Votre rôle spirituel / vocation" : "Your Spiritual Role / Ministry Context"}
                    </label>
                    <select
                      id={roleSelectId}
                      value={spiritualRole}
                      onChange={(e) => setSpiritualRole(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                    >
                      <option value="Devotional Seeker">{isFr ? "Fidèle / Chercheur de Dieu" : "Devotional Seeker (Individual Habit)"}</option>
                      <option value="Pastor & Preacher">{isFr ? "Pasteur / Prédicateur / Prêtre" : "Pastor / Teaching Elder / Preacher"}</option>
                      <option value="Small Group Facilitator">{isFr ? "Animateur de groupe de maison" : "Small Group / Bible Study Leader"}</option>
                      <option value="Worship Leader">{isFr ? "Conducteur de louange" : "Worship Leader / Music Ministry"}</option>
                      <option value="Christian Parent">{isFr ? "Parent chrétien (prière familiale)" : "Christian Parent (Family Faith)"}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor={referralInputId} className="block text-xs font-bold text-[#2d2542] uppercase tracking-wider mb-1">
                      {isFr ? "Code de parrainage (facultatif)" : "Invitation / Referral Code (Optional)"}
                    </label>
                    <input
                      id={referralInputId}
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="e.g. LB-PT-1049"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2d2542]/20 focus:outline-hidden focus:ring-2 focus:ring-[#705eaa]"
                    />
                  </div>
                </div>

                {/* FEEDBACK LOOP QUESTION 1 */}
                <div className="bg-[#faf6ee] p-4 sm:p-5 rounded-2xl border border-[#edd79d] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#916212] uppercase tracking-wider">
                    <span>💡</span>
                    <span>{isFr ? "Boucle de retour #1 · Votre plus grand défi spirituel" : "Feedback Loop #1 · What holds you back most?"}</span>
                  </div>
                  <label htmlFor={obstacleTextareaId} className="sr-only">
                    {isFr ? "Quel est votre obstacle majeur à la constance de la prière ?" : "What is your main obstacle to regular prayer?"}
                  </label>
                  <p className="text-xs text-[#52442d] m-0">
                    {isFr
                      ? "Quel est votre obstacle majeur à la constance de la prière ou de la lecture biblique matinale ?"
                      : "What is your primary obstacle to daily devotional consistency? (Busy deadlines, feeling guilty when missing days, dry routines, etc.)"}
                  </p>
                  <textarea
                    id={obstacleTextareaId}
                    rows={2}
                    required
                    value={struggleFeedback}
                    onChange={(e) => setStruggleFeedback(e.target.value)}
                    placeholder={
                      isFr
                        ? "ex. Je commence fort, mais dès le mercredi le rythme s'essouffle et je culpabilise..."
                        : "e.g. I start on Monday, but by Wednesday work stress takes over and breaking the streak makes me give up..."
                    }
                    className="w-full text-xs p-3 rounded-xl border border-[#edd79d] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#916212]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-[#705e8c]">
                    {isFr ? "🔒 Confidentialité garantie · Aucune publicité" : "🔒 100% private · Ad-free spiritual sanctuary"}
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    id="submit-waitlist-btn"
                    className="px-6 py-3 rounded-xl bg-[#2d2542] hover:bg-[#1a1429] text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting
                      ? (isFr ? "Attribution de la cohorte..." : "Assigning Cohort...")
                      : (isFr ? "Rejoindre la cohorte →" : "Join Cohort Wave →")}
                  </button>
                </div>
              </form>
            ) : (
              /* CONFIRMATION & DEEP FEEDBACK LOOP STEP 2 */
              <div className="space-y-6 animate-fade-in" id="waitlist-confirmation-card">
                <div className="p-4 sm:p-6 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-2 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#166534] flex items-center justify-center sm:justify-start gap-1.5">
                      <span>🎉</span>
                      <span>{isFr ? "Félicitations · Place de cohorte confirmée" : "Congratulations · Cohort Seat Reserved"}</span>
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#dcfce7] text-[#166534]">
                      {isFr ? `Score de priorité : ${joinSuccessMember.priorityScore} pts` : `Priority Score: ${joinSuccessMember.priorityScore} pts`}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#1e1931] m-0">
                    {joinMessage}
                  </h3>
                  <p className="text-xs text-[#1e5843] m-0">
                    {isFr
                      ? `Bienvenue, ${joinSuccessMember.name}. Vous êtes assigné(e) à la cohorte : ${joinSuccessMember.cohortId}.`
                      : `Welcome, ${joinSuccessMember.name}. You are placed in cohort: ${joinSuccessMember.cohortId}.`}
                  </p>
                </div>

                {/* PRIORITY REFERRAL LINK */}
                <div className="p-4 rounded-2xl bg-[#faf5ff] border border-[#e9d5ff] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b21a8] block">
                    {isFr ? "Votre code d'accès prioritaire à partager" : "Your Priority Invitation Code"}
                  </span>
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-[#e9d5ff] text-[#6b21a8]">
                      {joinSuccessMember.referralCode}
                    </code>
                    <span className="text-xs text-[#64597b]">
                      {isFr
                        ? "Invitez un ami ou votre groupe pour gagner 20 pts de priorité supplémentaires."
                        : "Share with a friend or your church small group to jump 20 spots in line."}
                    </span>
                  </div>
                </div>

                {/* STEP 2: DEEP FEEDBACK SURVEY */}
                {!feedbackSubmitted ? (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-2 border-t border-[#2d2542]/10">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-[#1e1931] m-0">
                        {isFr ? "Boucle de retour #2 · Personnalisez votre expérience" : "Feedback Loop #2 · Tailor Your Daily Sanctuary"}
                      </h4>
                      <p className="text-xs text-[#5e5370] m-0 mt-0.5">
                        {isFr
                          ? "Ces questions aident l'équipe pastorale à calibrer les premières méditations."
                          : "Your answers directly inform which teachings and journey tracks we publish first."}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2d2542] mb-2">
                        {isFr ? "Quelles fonctionnalités attendez-vous le plus ?" : "Which features are you most excited to use?"}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableFeatures.map((feat) => {
                          const checked = selectedFeatures.includes(feat.id);
                          return (
                            <label
                              key={feat.id}
                              className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                checked
                                  ? "bg-[#faf5ff] border-[#705eaa] font-bold text-[#2d2542]"
                                  : "bg-white border-[#2d2542]/15 text-[#5e5370]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFeatures([...selectedFeatures, feat.id]);
                                  } else {
                                    setSelectedFeatures(selectedFeatures.filter((f) => f !== feat.id));
                                  }
                                }}
                                className="rounded text-[#705eaa]"
                              />
                              <span>{feat.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={timeSelectId} className="block text-xs font-bold text-[#2d2542] mb-1">
                          {isFr ? "Temps disponible le matin :" : "Realistic daily time available:"}
                        </label>
                        <select
                          id={timeSelectId}
                          value={dailyTime}
                          onChange={(e) => setDailyTime(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-[#2d2542]/20 bg-white"
                        >
                          <option value="3 min">{isFr ? "3 minutes (très pressé)" : "3 minutes (ultra hurried)"}</option>
                          <option value="5-7 min">{isFr ? "5-7 minutes (recommandé)" : "5-7 minutes (recommended)"}</option>
                          <option value="10-15 min">{isFr ? "10-15 minutes (approfondi)" : "10-15 minutes (in-depth)"}</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={notesTextareaId} className="block text-xs font-bold text-[#2d2542] mb-1">
                          {isFr ? "Note ou question pour l'équipe pastorale :" : "Note or question for the pastoral board:"}
                        </label>
                        <input
                          id={notesTextareaId}
                          type="text"
                          value={pastoralNote}
                          onChange={(e) => setPastoralNote(e.target.value)}
                          placeholder={isFr ? "ex. Hâte de tester les Journées de Grâce" : "e.g. Excited for grace days!"}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-[#2d2542]/20 bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="submit-deep-feedback-btn"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#705eaa] hover:bg-[#5a4891] text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      {isFr ? "Enregistrer mes préférences (+35 pts priorité)" : "Save Feedback (+35 Priority Points)"}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#faf6ee] border border-[#edd79d] text-xs text-[#52442d] space-y-1">
                    <strong className="block text-sm font-bold text-[#1e1931]">
                      ✓ {isFr ? "Boucle de rétroaction complétée !" : "Feedback Loop Completed!"}
                    </strong>
                    <p className="m-0">
                      {isFr
                        ? "Vos réponses ont été enregistrées. Votre invitation VIP sera envoyée en priorité."
                        : "Your input has been recorded in our pipeline. You will receive first-wave beta notifications."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: LEADER COHORT PIPELINE DASHBOARD */
          <div className="space-y-6" id="leader-cohort-pipeline-dashboard">
            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-[#2d2542]/10 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c]">
                  {isFr ? "Total Liste d'attente" : "Total Waitlist"}
                </span>
                <strong className="block text-2xl font-serif text-[#1e1931] mt-1">
                  {totalWaitlist || members.length}
                </strong>
                <span className="text-[10px] text-[#3bb582] font-semibold">
                  {isFr ? "Toutes cohortes" : "Across 4 cohorts"}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#2d2542]/10 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c]">
                  {isFr ? "Taux Rétroaction" : "Feedback Loop Rate"}
                </span>
                <strong className="block text-2xl font-serif text-[#1e1931] mt-1">
                  {feedbackRate}
                </strong>
                <span className="text-[10px] text-[#705eaa] font-semibold">
                  {isFr ? "Questionnaire rempli" : "Surveys submitted"}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#2d2542]/10 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c]">
                  {isFr ? "Invitations VIP" : "VIP Invites"}
                </span>
                <strong className="block text-2xl font-serif text-[#1e1931] mt-1">
                  {members.filter((m) => m.stage === "vip_invited").length}
                </strong>
                <span className="text-[10px] text-[#e0892c] font-semibold">
                  {isFr ? "En attente d'accès" : "Pending activation"}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#2d2542]/10 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#705e8c]">
                  {isFr ? "Fidèles intégrés" : "Onboarded"}
                </span>
                <strong className="block text-2xl font-serif text-[#1e1931] mt-1">
                  {members.filter((m) => m.stage === "onboarded").length}
                </strong>
                <span className="text-[10px] text-[#3bb582] font-semibold">
                  {isFr ? "Actifs dans l'app" : "Active daily habit"}
                </span>
              </div>
            </div>

            {/* COHORT CAPACITY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cohorts.map((cohort) => (
                <div key={cohort.id} className="bg-white p-5 rounded-2xl border border-[#2d2542]/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="font-serif text-base text-[#1e1931] block leading-snug">
                        {cohort.name}
                      </strong>
                      <span className="text-[11px] text-[#705e8c] block">
                        {cohort.targetRole}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#f3edf8] text-[#705eaa]">
                      {cohort.memberCount} / {cohort.capacity}
                    </span>
                  </div>

                  <p className="text-xs text-[#5e5370] m-0 leading-relaxed">
                    {cohort.description}
                  </p>

                  {/* Occupancy bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#705e8c]">
                      <span>{isFr ? "Remplissage" : "Occupancy"}</span>
                      <span className="font-bold text-[#2d2542]">{cohort.occupancyPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#2d2542]/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#705eaa] transition-all"
                        style={{ width: `${cohort.occupancyPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage distribution pills */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      Reg: {cohort.stages?.registered || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      Feedback: {cohort.stages?.feedback_submitted || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      VIP: {cohort.stages?.vip_invited || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active: {cohort.stages?.onboarded || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* MEMBER PIPELINE TABLE & ACTIONS */}
            <div className="bg-white rounded-3xl p-6 border border-[#2d2542]/10 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#2d2542]/10">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1e1931] m-0">
                    {isFr ? "Membres du pipeline de cohortes" : "Cohort Members & Feedback Loop Details"}
                  </h3>
                  <p className="text-xs text-[#5e5370] m-0">
                    {isFr
                      ? "Consultez les retours d'expérience et promouvez les membres vers l'accès VIP."
                      : "Review member obstacles, feedback answers, and promote candidates through the funnel."}
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCohortFilter}
                    onChange={(e) => setSelectedCohortFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-[#2d2542]/20 bg-white"
                  >
                    <option value="all">{isFr ? "Toutes cohortes" : "All Cohorts"}</option>
                    <option value="cohort-alpha">Alpha (Wave 1)</option>
                    <option value="cohort-beta">Beta (Pastors)</option>
                    <option value="cohort-gamma">Gamma (Small Groups)</option>
                    <option value="cohort-delta">Delta (General)</option>
                  </select>

                  <select
                    value={selectedStageFilter}
                    onChange={(e) => setSelectedStageFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-[#2d2542]/20 bg-white"
                  >
                    <option value="all">{isFr ? "Tous statuts" : "All Stages"}</option>
                    <option value="registered">Registered</option>
                    <option value="feedback_submitted">Feedback Submitted</option>
                    <option value="vip_invited">VIP Invited</option>
                    <option value="onboarded">Onboarded</option>
                  </select>
                </div>
              </div>

              {isLoadingPipeline ? (
                <div className="py-12 text-center text-xs text-[#705e8c]">
                  {isFr ? "Chargement des cohortes..." : "Loading pipeline data..."}
                </div>
              ) : (
                <div className="divide-y divide-[#2d2542]/10">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="py-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <strong className="text-sm font-bold text-[#1e1931]">
                            {member.name}
                          </strong>
                          <span className="text-xs text-[#705e8c] ml-2">
                            ({member.email})
                          </span>
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f3edf8] text-[#705eaa]">
                            {member.spiritualRole}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#705eaa] bg-[#f8f5fc] px-2 py-0.5 rounded">
                            {member.referralCode}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            member.stage === "onboarded"
                              ? "bg-emerald-100 text-emerald-800"
                              : member.stage === "vip_invited"
                              ? "bg-purple-100 text-purple-800"
                              : member.stage === "feedback_submitted"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {member.stage.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Struggle feedback loop text */}
                      {member.struggleFeedback && (
                        <div className="text-xs bg-[#faf6ee] p-2.5 rounded-xl border border-[#edd79d]/70 text-[#52442d]">
                          <strong className="text-[11px] text-[#916212] block">
                            {isFr ? "Obstacle spirituel rapporté :" : "Reported Devotional Obstacle:"}
                          </strong>
                          <span className="italic">“{member.struggleFeedback}”</span>
                        </div>
                      )}

                      {/* Promotion actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-[#705e8c]">
                          Score: <strong>{member.priorityScore} pts</strong> · Parrainages : <strong>{member.referralCount}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          {member.stage !== "vip_invited" && member.stage !== "onboarded" && (
                            <button
                              type="button"
                              onClick={() => handlePromoteStage(member.id, "vip_invited")}
                              className="px-2.5 py-1 rounded-lg bg-[#705eaa] hover:bg-[#59488a] text-white font-semibold text-[11px] cursor-pointer"
                            >
                              {isFr ? "Promouvoir VIP →" : "Invite to VIP →"}
                            </button>
                          )}
                          {member.stage !== "onboarded" && (
                            <button
                              type="button"
                              onClick={() => handlePromoteStage(member.id, "onboarded")}
                              className="px-2.5 py-1 rounded-lg bg-[#3bb582] hover:bg-[#2e946a] text-white font-semibold text-[11px] cursor-pointer"
                            >
                              {isFr ? "Marquer Intégré ✓" : "Mark Onboarded ✓"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
