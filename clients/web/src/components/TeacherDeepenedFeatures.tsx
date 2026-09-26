"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpenText,
  DownloadSimple,
  HandsPraying,
  Check,
  Sparkle,
  Playlist,
  ChatCircleText,
  Headphones,
  FileText,
  Copy,
} from "@phosphor-icons/react";
import type { Teacher, Teaching } from "@/app/livingWordData";
import { useSanctuaryAudio } from "@/lib/sanctuary-audio";
import { useChristianAuth } from "@/lib/christian-auth";
import { ScriptureStudyDrawer } from "./ScriptureStudyDrawer";

interface CurriculumDay {
  day: number;
  title: string;
  scripture: string;
  reflectionPrompt: string;
  liturgyPrayer: string;
}

function getCurriculumForTeacher(teacher: Teacher): {
  seriesTitle: string;
  seriesSubtitle: string;
  days: CurriculumDay[];
} {
  if (teacher.slug.includes("david") || teacher.theologicalSpecialty.toLowerCase().includes("lament")) {
    return {
      seriesTitle: "5-Day Grief, Lament & Restorative Grace Walk",
      seriesSubtitle: "Guided pastoral curriculum through the Psalms of Lament into honest hope",
      days: [
        {
          day: 1,
          title: "Bringing Honest Tears to the Sanctuary",
          scripture: "Psalm 34:18",
          reflectionPrompt: "What unspoken grief or weariness have you been trying to carry politely instead of naming before the Lord?",
          liturgyPrayer: "O Lord, God of my salvation, You do not despise a bruised reed. Receive my honest groaning today as an act of trust.",
        },
        {
          day: 2,
          title: "The Shepherd in the Valley of Shadow",
          scripture: "Psalm 23:1-4",
          reflectionPrompt: "Where in your present valley do you need to hear the shift from 'He leads me' to 'You are with me'?",
          liturgyPrayer: "Good Shepherd, when the path grows dim, let Your rod and Your staff comfort my anxious heart.",
        },
        {
          day: 3,
          title: "Trading Heavy Burdens for Christ's Yoke",
          scripture: "Matthew 11:28-30",
          reflectionPrompt: "Which expectations—from yourself or others—is Jesus inviting you to lay down at His feet today?",
          liturgyPrayer: "Gentle and lowly Savior, teach me the unforced rhythms of Your grace and quiet my striving soul.",
        },
        {
          day: 4,
          title: "Morning Mercies Amidst the Ruins",
          scripture: "Lamentations 3:22-23",
          reflectionPrompt: "Name one small token of God's covenant faithfulness you witnessed this morning.",
          liturgyPrayer: "Father of mercies, before my circumstances change, anchor my hope in Your unchanging covenant love.",
        },
        {
          day: 5,
          title: "The Garrison of Peace Over Heart & Mind",
          scripture: "Philippians 4:6-7",
          reflectionPrompt: "How can thanksgiving accompany your supplication as you step into the week ahead?",
          liturgyPrayer: "Prince of Peace, stand watch over my thoughts and establish Your quiet rule within my home.",
        },
      ],
    };
  }

  return {
    seriesTitle: `5-Day Guided Sanctuary Curriculum with ${teacher.name}`,
    seriesSubtitle: `Structured daily walk in ${teacher.theologicalSpecialty}`,
    days: [
      {
        day: 1,
        title: "Abiding Before Achieving",
        scripture: teacher.featuredScripture || "Psalm 23:1-4",
        reflectionPrompt: "How does beginning your day in reception of grace reshape the way you view your responsibilities?",
        liturgyPrayer: "Lord Jesus, root my identity in Your finished work before my hands touch a single task today.",
      },
      {
        day: 2,
        title: "Covenant Faithfulness at Dawn",
        scripture: "Lamentations 3:22-23",
        reflectionPrompt: "Where have you seen God's fresh mercy meet yesterday's exhaustion?",
        liturgyPrayer: "Faithful Father, awaken my heart to receive the new mercies You have prepared for this morning.",
      },
      {
        day: 3,
        title: "Sacred Vocation & Wholehearted Love",
        scripture: "Colossians 3:23",
        reflectionPrompt: "How can your ordinary work or caregiving today become a quiet altar of worship?",
        liturgyPrayer: "Creator Spirit, sanctify the work of my hands and keep my heart free from comparison.",
      },
      {
        day: 4,
        title: "Gentle Strength for the Weary",
        scripture: "Isaiah 40:11",
        reflectionPrompt: "Who in your circle needs the gentle, unhurried patience of the Shepherd through you today?",
        liturgyPrayer: "Tend Your flock, O Lord, and teach me to walk at the pace of grace.",
      },
      {
        day: 5,
        title: "Sovereign Purpose in Every Season",
        scripture: "Romans 8:28",
        reflectionPrompt: "What unanswered question can you entrust to the Father's wise providence tonight?",
        liturgyPrayer: "Sovereign Lord, weave every joy and trial of this week into the likeness of Christ.",
      },
    ],
  };
}

interface TeacherQuestionItem {
  id: number;
  teacherSlug: string;
  userUid: string;
  authorName: string;
  requestType: string;
  content: string;
  pastoralReply?: string | null;
  amenCount: number;
  createdAt?: string;
}

export function TeacherDeepenedFeatures({
  teacher,
  teachings,
}: {
  teacher: Teacher;
  teachings: Teaching[];
}) {
  const { playTeaching } = useSanctuaryAudio();
  const { user, getIdToken } = useChristianAuth();

  const curriculum = getCurriculumForTeacher(teacher);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [completedDays, setCompletedDays] = useState<number[]>([1]);
  const [drawerScripture, setDrawerScripture] = useState<string | null>(null);
  const [copiedNoteSlug, setCopiedNoteSlug] = useState<string | null>(null);

  // Q&A / Prayer Wall states
  const [questions, setQuestions] = useState<TeacherQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [requestType, setRequestType] = useState<"question" | "prayer">("question");
  const [questionContent, setQuestionContent] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState<string | null>(null);
  const [amenedIds, setAmenedIds] = useState<Record<number, boolean>>({});

  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(
        `/api/teachers/questions?teacherSlug=${encodeURIComponent(teacher.slug)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      }
    } catch {
      // ignore transient error
    } finally {
      setLoadingQuestions(false);
    }
  }, [teacher.slug]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const activeDayObj =
    curriculum.days.find((d) => d.day === selectedDay) || curriculum.days[0];

  const toggleDayComplete = (dayNum: number) => {
    setCompletedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleDownloadStudyGuide = (teaching: Teaching) => {
    const content = [
      `LIFEBOOK SANCTUARY · STUDY GUIDE & LITURGY`,
      `==================================================`,
      `Teaching: ${teaching.title}`,
      `Pastoral Voice: ${teacher.name} (${teacher.ministryAffiliation})`,
      `Theological Specialty: ${teacher.theologicalSpecialty}`,
      `Anchor Scripture: ${teaching.scripture}`,
      `Duration: ${teaching.duration}`,
      ``,
      `1. KEY PASTORAL EXCERPT`,
      `"${teaching.excerpt}"`,
      ``,
      `2. EXPOSITORY STUDY NOTES`,
      `${teaching.teaching}`,
      ``,
      `3. SANCTUARY REFLECTION QUESTIONS`,
      `• How does ${teaching.scripture} challenge or comfort your current walk?`,
      `• Where is the Holy Spirit inviting you to trade anxious striving for quiet trust today?`,
      `• Who in your family or church fellowship can you encourage with this truth?`,
      ``,
      `4. CLOSING PASTORAL LITURGY`,
      `"Lord Jesus, seal the truth of ${teaching.scripture} within my heart. Let Your Word dwell in me richly today. Amen."`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${teaching.slug}-study-notes-liturgy.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLiturgy = async (teaching: Teaching) => {
    const text = `${teaching.title} (${teaching.scripture}) — ${teacher.name}\n\n"${teaching.excerpt}"\n\nLiturgy Prayer: Lord Jesus, seal the truth of ${teaching.scripture} within my heart today. Amen.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNoteSlug(teaching.slug);
      setTimeout(() => setCopiedNoteSlug(null), 2500);
    } catch {}
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionContent.trim()) return;
    setSubmittingQuestion(true);
    setQuestionFeedback(null);

    try {
      const token = await getIdToken();
      const uid = user?.id || "usr_pilgrim_franck";
      const email = user?.email || "pilgrim@lifebook.sanctuary";
      const authorName = user?.fullName || "Sanctuary Pilgrim";

      const autoReply =
        requestType === "prayer"
          ? `Standing with you in prayer, ${authorName.split(" ")[0]}. May the Lord meet you with His nearness in ${teacher.featuredScripture || "Psalm 34:18"}.`
          : `Thank you for this thoughtful question, ${authorName.split(" ")[0]}. Let us anchor our reflection in ${teacher.featuredScripture || "Psalm 23:1-4"} and the sufficiency of Christ's grace.`;

      const res = await fetch("/api/teachers/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          teacherSlug: teacher.slug,
          userUid: uid,
          email,
          authorName,
          requestType,
          content: questionContent.trim(),
          pastoralReply: autoReply,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          setQuestions((prev) => [data.question, ...prev]);
        }
        setQuestionContent("");
        setQuestionFeedback(
          requestType === "prayer"
            ? `Your prayer request has been shared on ${teacher.name}’s Pastoral Wall.`
            : `Your theological question has been posted to ${teacher.name}’s Study Wall.`
        );
      }
    } catch {
      setQuestionFeedback("Unable to submit right now. Please try again.");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAmenQuestion = async (id: number) => {
    if (amenedIds[id]) return;
    setAmenedIds((prev) => ({ ...prev, [id]: true }));
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, amenCount: q.amenCount + 1 } : q))
    );
    try {
      await fetch("/api/teachers/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {}
  };

  return (
    <div className="space-y-8 pt-4">
      {/* 1. Series & Curriculum Playlists */}
      <section className="bg-white dark:bg-[#1B1630] p-6 sm:p-7 rounded-3xl border border-[#E3DACB] dark:border-white/12 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3D6] dark:border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
              <Playlist size={16} weight="duotone" />
              <span>Guided Series & Curriculum Playlist</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white m-0">
              {curriculum.seriesTitle}
            </h3>
            <p className="text-xs text-[#6F6486] dark:text-[#C8C2D6] mt-0.5">
              {curriculum.seriesSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              {completedDays.length} / {curriculum.days.length} Days Completed
            </span>
          </div>
        </div>

        {/* Day Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {curriculum.days.map((d) => {
            const isSelected = d.day === selectedDay;
            const isDone = completedDays.includes(d.day);
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDay(d.day)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#2D2542] text-white border-[#2D2542] shadow-sm"
                    : "bg-[#FAF8F5] dark:bg-white/5 text-[#2D2542] dark:text-white border-[#E3DACB] dark:border-white/10 hover:border-amber-500/50"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">
                  <span>Day {d.day}</span>
                  {isDone && <Check size={13} weight="bold" className="text-emerald-400" />}
                </div>
                <div className="text-xs font-semibold line-clamp-1">{d.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Day Study Card */}
        <div className="rounded-2xl bg-[#FAF6EE] dark:bg-[#141024] border border-[#E2D8C6] dark:border-white/10 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">
                Day {activeDayObj.day} Focus • {activeDayObj.scripture}
              </span>
              <h4 className="text-lg font-serif font-bold text-[#1E1931] dark:text-white mt-0.5">
                {activeDayObj.title}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerScripture(activeDayObj.scripture)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1B1630] border border-amber-500/40 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <BookOpenText size={14} weight="duotone" />
                <span>Open {activeDayObj.scripture} in Study Drawer</span>
              </button>

              {teachings[0] && (
                <button
                  type="button"
                  onClick={() => playTeaching(teachings[(activeDayObj.day - 1) % teachings.length])}
                  className="px-3 py-1.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Headphones size={14} weight="duotone" />
                  <span>Play Day {activeDayObj.day} Audio</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-[#4E4467] dark:text-[#C8C2D6] leading-relaxed">
            <strong>Pastoral Reflection Prompt:</strong> {activeDayObj.reflectionPrompt}
          </p>

          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-white/5 border border-[#E3DACB] dark:border-white/10 text-xs italic font-serif text-[#2E2448] dark:text-[#F4EFE6]">
            “{activeDayObj.liturgyPrayer}”
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => toggleDayComplete(activeDayObj.day)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                completedDays.includes(activeDayObj.day)
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-white/10 text-[#2D2542] dark:text-white border border-[#D8CFE6]"
              }`}
            >
              <Check size={14} weight="bold" />
              <span>
                {completedDays.includes(activeDayObj.day)
                  ? `Day ${activeDayObj.day} Completed`
                  : `Mark Day ${activeDayObj.day} Complete`}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Downloadable Study Notes & Liturgies */}
      <section className="bg-white dark:bg-[#1B1630] p-6 sm:p-7 rounded-3xl border border-[#E3DACB] dark:border-white/12 shadow-xs space-y-4">
        <div className="border-b border-[#EAE3D6] dark:border-white/10 pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3D2E5C] dark:text-[#4EE2D8] mb-1">
            <FileText size={16} weight="duotone" />
            <span>Downloadable Study Notes & Liturgies</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white m-0">
            Printable Reflection Guides & Scripture Outlines
          </h3>
          <p className="text-xs text-[#6F6486] dark:text-[#C8C2D6] mt-0.5">
            Download structured study notes or open any Scripture anchor in the side-by-side Bible reader.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachings.map((t) => (
            <div
              key={t.slug}
              className="rounded-2xl bg-[#FAF8F5] dark:bg-[#141024] border border-[#E3DACB] dark:border-white/10 p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawerScripture(t.scripture)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-300/50 hover:underline cursor-pointer"
                  >
                    <BookOpenText size={13} />
                    <span>{t.scripture} (Click to Study)</span>
                  </button>
                  <span className="text-[11px] text-[#7A6F91] dark:text-[#B8B0C8]">
                    {t.duration} Study Guide
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#1E1931] dark:text-white">
                  {t.title}
                </h4>
                <p className="text-xs text-[#52466D] dark:text-[#C8C2D6] line-clamp-2">
                  {t.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EAE3D6] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => handleDownloadStudyGuide(t)}
                  className="px-3 py-1.5 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <DownloadSimple size={14} weight="bold" />
                  <span>Download Study Notes (.txt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLiturgy(t)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-[#D8CFE6] dark:border-white/15 text-xs font-semibold text-[#2D2542] dark:text-white hover:bg-[#F2ECE1] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {copiedNoteSlug === t.slug ? (
                    <>
                      <Check size={14} weight="bold" className="text-emerald-600" />
                      <span>Copied Liturgy</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Liturgy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Direct Pastoral Question / Prayer Request Wall */}
      <section className="bg-white dark:bg-[#1B1630] p-6 sm:p-7 rounded-3xl border border-[#E3DACB] dark:border-white/12 shadow-xs space-y-5">
        <div className="border-b border-[#EAE3D6] dark:border-white/10 pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
            <ChatCircleText size={16} weight="duotone" />
            <span>Direct Question & Prayer Request Wall • Cloud SQL Synced</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1E1931] dark:text-white m-0">
            Ask {teacher.name} or Share a Prayer Request
          </h3>
          <p className="text-xs text-[#6F6486] dark:text-[#C8C2D6] mt-0.5">
            Leave a theological question or personal prayer request directly on {teacher.name}’s ministry page.
          </p>
        </div>

        <form onSubmit={handleSubmitQuestion} className="space-y-3 bg-[#FAF8F5] dark:bg-[#141024] p-4 sm:p-5 rounded-2xl border border-[#E3DACB] dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-xl bg-white dark:bg-[#1B1630] p-1 border border-[#E3DACB] dark:border-white/10">
              <button
                type="button"
                onClick={() => setRequestType("question")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  requestType === "question"
                    ? "bg-[#2D2542] text-white"
                    : "text-[#5D5276] dark:text-[#C8C2D6]"
                }`}
              >
                Theological Question
              </button>
              <button
                type="button"
                onClick={() => setRequestType("prayer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  requestType === "prayer"
                    ? "bg-amber-700 text-white"
                    : "text-[#5D5276] dark:text-[#C8C2D6]"
                }`}
              >
                Prayer Request
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            required
            value={questionContent}
            onChange={(e) => setQuestionContent(e.target.value)}
            placeholder={
              requestType === "prayer"
                ? `Share how ${teacher.name} and the Sanctuary community can pray for you...`
                : `Ask ${teacher.name} a question about ${teacher.theologicalSpecialty}...`
            }
            className="w-full rounded-xl border border-[#E3DACB] dark:border-white/15 bg-white dark:bg-[#1B1630] p-3.5 text-sm text-[#1E1931] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submittingQuestion || !questionContent.trim()}
              className="px-4 py-2 rounded-xl bg-[#2D2542] dark:bg-[#4EE2D8] text-white dark:text-[#0E0C18] text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingQuestion
                ? "Posting..."
                : requestType === "prayer"
                ? "Post Prayer Request"
                : "Submit Theological Question"}
            </button>
          </div>

          {questionFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check size={15} weight="bold" />
              <span>{questionFeedback}</span>
            </div>
          )}
        </form>

        {/* Questions & Prayer Wall Feed */}
        <div className="space-y-3">
          {loadingQuestions ? (
            <div className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ) : questions.length === 0 ? (
            <p className="text-xs text-[#6F6486] dark:text-[#C8C2D6] italic">
              Be the first to post a theological question or prayer request for {teacher.name}.
            </p>
          ) : (
            questions.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl bg-[#FAF8F5] dark:bg-[#141024] border border-[#E3DACB] dark:border-white/10 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2D2542] text-white text-[11px] font-bold flex items-center justify-center">
                      {(q.authorName?.[0] || "P").toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-[#1E1931] dark:text-white">
                      {q.authorName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300">
                      {q.requestType === "prayer" ? "Prayer Request" : "Theological Q&A"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAmenQuestion(q.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                      amenedIds[q.id]
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white dark:bg-[#1B1630] text-[#2D2542] dark:text-white border-[#E3DACB] dark:border-white/15"
                    }`}
                  >
                    <HandsPraying size={13} weight="duotone" />
                    <span>Amen / Praying ({q.amenCount})</span>
                  </button>
                </div>

                <p className="text-sm text-[#2E2448] dark:text-[#F4EFE6] leading-relaxed m-0">
                  “{q.content}”
                </p>

                {q.pastoralReply && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1630] border-l-4 border-l-[#3D2E5C] dark:border-l-[#4EE2D8] border border-[#E3DACB] dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3D2E5C] dark:text-[#4EE2D8]">
                      <Sparkle size={13} weight="fill" />
                      <span>Pastoral Response from {teacher.name}</span>
                    </div>
                    <p className="text-xs text-[#4E4467] dark:text-[#C8C2D6] leading-relaxed m-0">
                      {q.pastoralReply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Interactive Scripture Study Drawer */}
      <ScriptureStudyDrawer
        isOpen={Boolean(drawerScripture)}
        onClose={() => setDrawerScripture(null)}
        initialReference={drawerScripture || teacher.featuredScripture || "Psalm 23:1-4"}
        sourceContext={`${teacher.name} (${teacher.ministryAffiliation})`}
      />
    </div>
  );
}
