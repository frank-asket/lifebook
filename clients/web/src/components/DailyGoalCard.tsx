"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { DayActivityRecord } from './ProgressScreen';

export interface DailySpiritualGoal {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: 'prayer' | 'scripture' | 'stillness' | 'kindness' | 'gratitude' | 'custom';
  completed: boolean;
  completedAt?: string;
  streakCount: number;
}

export interface GoalPreset {
  id: string;
  title: string;
  category: DailySpiritualGoal['category'];
  emoji: string;
  tag: string;
  recommendedTime: string;
}

export const PRESET_GOALS: GoalPreset[] = [
  { id: 'p_stillness', title: '5 minutes of silent abiding prayer', category: 'stillness', emoji: '🕊️', tag: 'Stillness', recommendedTime: 'Morning' },
  { id: 'p_psalm', title: 'Read and meditate on one chapter of Psalms', category: 'scripture', emoji: '📖', tag: 'Scripture', recommendedTime: 'Anytime' },
  { id: 'p_kindness', title: 'Send an encouraging scripture text to a friend', category: 'kindness', emoji: '🤲', tag: 'Encouragement', recommendedTime: 'Midday' },
  { id: 'p_gratitude', title: 'Record three specific mercies to God from today', category: 'gratitude', emoji: '✨', tag: 'Gratitude', recommendedTime: 'Evening' },
  { id: 'p_breath', title: 'Pause for a 60-second midday breath prayer', category: 'prayer', emoji: '🕯️', tag: 'Prayer', recommendedTime: 'Noon' },
  { id: 'p_walk', title: 'Take a 10-minute prayer walk noticing creation', category: 'stillness', emoji: '🌿', tag: 'Creation', recommendedTime: 'Afternoon' },
];

const CATEGORY_METADATA: Record<DailySpiritualGoal['category'], { label: string; emoji: string; color: string; bg: string }> = {
  prayer: { label: 'Prayer', emoji: '🕯️', color: '#E3B15E', bg: 'bg-[#FFF8EB] text-[#A0711C] border-[#F1DFB7]' },
  scripture: { label: 'Scripture', emoji: '📖', color: '#37C6C2', bg: 'bg-[#EDFAF9] text-[#10706D] border-[#BBECE9]' },
  stillness: { label: 'Stillness', emoji: '🕊️', color: '#7B62B8', bg: 'bg-[#F4F1FA] text-[#523F80] border-[#D8CFEC]' },
  kindness: { label: 'Encouragement', emoji: '🤲', color: '#1FB6B0', bg: 'bg-[#EBF7F7] text-[#147470] border-[#B6E4E2]' },
  gratitude: { label: 'Gratitude', emoji: '✨', color: '#E29452', bg: 'bg-[#FEF6EE] text-[#9C5819] border-[#F9DCBE]' },
  custom: { label: 'Personal', emoji: '🎯', color: '#65597C', bg: 'bg-[#FAF8FC] text-[#453A5C] border-[#E3DCEE]' },
};

const STORAGE_KEY = 'lifebook.dailySpiritualGoal';
const STORAGE_HISTORY_KEY = 'lifebook.dailySpiritualGoalHistory';

interface DailyGoalCardProps {
  todayStr: string;
  gracePoints: number;
  onUpdateGracePoints: (newPoints: number) => void;
  todayRecord?: DayActivityRecord;
  onTogglePractice?: (key: 'scriptureRead' | 'prayerCompleted' | 'journalWritten') => void;
}

export function DailyGoalCard({
  todayStr,
  gracePoints,
  onUpdateGracePoints,
  todayRecord,
  onTogglePractice,
}: DailyGoalCardProps) {
  const [goal, setGoal] = useState<DailySpiritualGoal>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: DailySpiritualGoal = JSON.parse(saved);
          if (parsed.date === todayStr) {
            return parsed;
          }
          // Date transitioned: check if streak continues from yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);
          const maintainedStreak = parsed.completed && parsed.date === yesterdayStr ? parsed.streakCount : 0;
          return {
            id: 'goal_' + todayStr,
            date: todayStr,
            title: parsed.title || '5 minutes of silent abiding prayer',
            category: parsed.category || 'stillness',
            completed: false,
            streakCount: maintainedStreak,
          };
        }
      } catch {
        // fallback
      }
    }
    return {
      id: 'goal_' + todayStr,
      date: todayStr,
      title: '5 minutes of silent abiding prayer',
      category: 'stillness',
      completed: false,
      streakCount: 0,
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(goal.title);
  const [editCategory, setEditCategory] = useState<DailySpiritualGoal['category']>(goal.category);
  const [showCelebrationToast, setShowCelebrationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');
  const [streakEarned, setStreakEarned] = useState(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Sync state to localStorage
  const saveGoal = useCallback((updated: DailySpiritualGoal) => {
    setGoal(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      try {
        const historyStr = localStorage.getItem(STORAGE_HISTORY_KEY);
        const history: Record<string, DailySpiritualGoal> = historyStr ? JSON.parse(historyStr) : {};
        history[updated.date] = updated;
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
      } catch {
        // suppress
      }
    }
  }, []);

  // Handle checking off the goal
  const handleToggleCompleted = () => {
    const nextState = !goal.completed;
    const newStreak = nextState ? goal.streakCount + 1 : Math.max(0, goal.streakCount - 1);
    const updated: DailySpiritualGoal = {
      ...goal,
      completed: nextState,
      completedAt: nextState ? new Date().toISOString() : undefined,
      streakCount: newStreak,
    };
    saveGoal(updated);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    if (nextState) {
      // Award 25 Grace Points
      onUpdateGracePoints(gracePoints + 25);
      setStreakEarned(newStreak);
      setToastMessage('Daily habit completed! Well done, faithful servant.');
      setToastSubtext('+25 Grace Points added to your shield · Streak maintained');
      setShowCelebrationToast(true);

      toastTimeoutRef.current = setTimeout(() => {
        setShowCelebrationToast(false);
      }, 4500);

      // Optionally sync with devotional practices if today record has not checked off practice
      if (todayRecord && onTogglePractice) {
        if (goal.category === 'scripture' && !todayRecord.scriptureRead) {
          onTogglePractice('scriptureRead');
        } else if ((goal.category === 'prayer' || goal.category === 'stillness') && !todayRecord.prayerCompleted) {
          onTogglePractice('prayerCompleted');
        } else if (goal.category === 'gratitude' && !todayRecord.journalWritten) {
          onTogglePractice('journalWritten');
        }
      }
    } else {
      // Revert 25 Grace Points
      onUpdateGracePoints(Math.max(0, gracePoints - 25));
      setShowCelebrationToast(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    const updated: DailySpiritualGoal = {
      ...goal,
      title: editText.trim(),
      category: editCategory,
    };
    saveGoal(updated);
    setIsEditing(false);
  };

  const handleSelectPreset = (preset: GoalPreset) => {
    setEditText(preset.title);
    setEditCategory(preset.category);
  };

  const categoryMeta = CATEGORY_METADATA[goal.category] || CATEGORY_METADATA.custom;

  return (
    <section
      id="daily-spiritual-goal-container"
      className="rounded-3xl bg-[#1E1835] text-white border border-white/10 p-5 sm:p-6 shadow-lg relative overflow-hidden mt-6 transition-all hover:border-[#1FB6B0]/40"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#1FB6B0]/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-inner ${
              goal.completed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/10 text-white'
            }`}
            id="daily-goal-icon-badge"
          >
            <span>{goal.completed ? '✨' : categoryMeta.emoji}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A69DC0]">
                DAILY SPIRITUAL HABIT
              </span>
              <span className="text-[10px] text-white/40">·</span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${categoryMeta.bg}`}
                id="daily-goal-category-tag"
              >
                <span>{categoryMeta.emoji}</span>
                <span>{categoryMeta.label}</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif text-white mt-0.5 flex items-center gap-2">
              <span>Today’s Small Step of Faith</span>
              {goal.completed && (
                <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fulfilled Today 🎉
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Streak & Reward Badges */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div
            id="daily-goal-streak-badge"
            className="rounded-2xl bg-white/5 border border-white/10 px-3.5 py-1.5 flex items-center gap-2"
          >
            <span className="text-base">🔥</span>
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#A69DC0] leading-tight">Goal Streak</div>
              <div className="text-sm font-bold text-white leading-none">
                {goal.streakCount} {goal.streakCount === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>

          <div
            id="daily-goal-points-badge"
            className="rounded-2xl bg-[#E3B15E]/10 border border-[#E3B15E]/30 px-3.5 py-1.5 flex items-center gap-2"
          >
            <span className="text-base">🛡️</span>
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#E3B15E] leading-tight">Grace Reward</div>
              <div className="text-sm font-bold text-[#E3B15E] leading-none">+25 pts</div>
            </div>
          </div>

          {!isEditing && (
            <button
              id="daily-goal-edit-btn"
              type="button"
              onClick={() => {
                setEditText(goal.title);
                setEditCategory(goal.category);
                setIsEditing(true);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#C5BCD9] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer border border-white/5"
              title="Edit or define new daily goal"
            >
              <span>✏️</span>
              <span className="hidden xs:inline">Change</span>
            </button>
          )}
        </div>
      </div>

      {/* Celebration toast banner with subtle success animation and positive reinforcement */}
      {showCelebrationToast && (
        <div
          id="daily-goal-celebration-toast"
          role="status"
          aria-live="polite"
          className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#192A32]/95 to-[#1E1835] border border-emerald-400/40 p-4 text-xs relative overflow-hidden shadow-[0_8px_24px_-4px_rgba(16,185,129,0.25)] goal-toast-enter"
        >
          {/* Subtle glowing ambient backdrop */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Progress bar line that subtly indicates the toast timeout duration */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-[#1FB6B0] goal-toast-progress" />
          </div>

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div
                id="daily-goal-toast-badge"
                className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-lg shadow-sm shrink-0 goal-check-pop"
              >
                <span>✨</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-200 text-xs sm:text-[13px] tracking-tight">
                    {toastMessage}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    +25 pts
                  </span>
                </div>
                <div className="text-[11px] text-emerald-300/80 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>{toastSubtext}</span>
                  {streakEarned > 1 && (
                    <>
                      <span className="text-emerald-400/40">·</span>
                      <span className="text-[#E3B15E] font-medium flex items-center gap-1">
                        <span>🔥</span>
                        <span>{streakEarned} days</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              id="daily-goal-toast-dismiss-btn"
              type="button"
              onClick={() => setShowCelebrationToast(false)}
              className="text-emerald-300/70 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss completion message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* View Mode: Habit Display & Checkoff */}
      {!isEditing ? (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5 flex-1">
            <button
              id="daily-goal-checkbox"
              type="button"
              onClick={handleToggleCompleted}
              className={`w-7 h-7 mt-0.5 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                goal.completed
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'border-white/30 bg-white/5 hover:border-[#1FB6B0] hover:bg-white/10'
              }`}
              aria-label={goal.completed ? 'Mark habit uncompleted' : 'Mark habit completed'}
            >
              {goal.completed ? (
                <svg className="w-4 h-4 stroke-[3] goal-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[#1FB6B0]" />
              )}
            </button>

            <div className="cursor-pointer select-none flex-1" onClick={handleToggleCompleted}>
              <p
                className={`text-base sm:text-lg font-medium transition-all leading-snug ${
                  goal.completed ? 'line-through text-[#8E84A6]' : 'text-white'
                }`}
                id="daily-goal-title"
              >
                {goal.title}
              </p>
              <p className="text-xs text-[#A69DC0] mt-1 flex items-center gap-2">
                <span>
                  {goal.completed
                    ? goal.completedAt
                      ? `Completed at ${new Date(goal.completedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Completed today'
                    : 'Click the checkbox to mark accomplished and claim +25 Grace Points.'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <button
              id="daily-goal-action-btn"
              type="button"
              onClick={handleToggleCompleted}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                goal.completed
                  ? 'bg-white/10 text-[#C5BCD9] hover:bg-white/15 border border-white/10'
                  : 'bg-gradient-to-r from-[#1FB6B0] to-[#37C6C2] text-[#17132B] hover:brightness-110 shadow-md'
              }`}
            >
              <span>{goal.completed ? 'Undo' : 'Mark Done'}</span>
              <span>{goal.completed ? '↩️' : '✨'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Edit Mode: Customize Habit & Select Preset */
        <form id="daily-goal-edit-form" onSubmit={handleSaveEdit} className="mt-4 space-y-4 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="daily-goal-custom-input" className="text-xs font-bold text-[#C5BCD9] uppercase flex items-center gap-1.5">
              <span>Define Today’s Micro-Habit</span>
              <span className="text-[10px] text-[#A69DC0] font-normal">(Keep it small and easily attainable)</span>
            </label>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-[#A69DC0] hover:text-white underline"
            >
              Cancel
            </button>
          </div>

          <div>
            <input
              id="daily-goal-custom-input"
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="e.g., 5 minutes of quiet listening prayer before bed..."
              className="w-full rounded-xl border border-white/20 bg-[#17132B] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#1FB6B0] focus:outline-none transition-all"
              maxLength={120}
              required
            />
          </div>

          {/* Category Picker */}
          <div>
            <span className="text-[11px] font-semibold text-[#A69DC0] block mb-1.5">Spiritual Category:</span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_METADATA) as Array<DailySpiritualGoal['category']>).map((cat) => {
                const meta = CATEGORY_METADATA[cat];
                const isSelected = editCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditCategory(cat)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-white/20 text-white border-[#1FB6B0] ring-1 ring-[#1FB6B0]'
                        : 'bg-white/5 text-[#A69DC0] border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets Picker */}
          <div>
            <span className="text-[11px] font-semibold text-[#A69DC0] block mb-1.5">Or Choose a Curated Daily Habit:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_GOALS.map((preset) => (
                <button
                  key={preset.id}
                  id={`daily-goal-preset-${preset.id}`}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                    editText === preset.title
                      ? 'bg-[#1FB6B0]/15 border-[#1FB6B0] text-white'
                      : 'bg-white/5 border-white/10 text-[#C5BCD9] hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg shrink-0">{preset.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{preset.title}</div>
                    <div className="text-[10px] text-[#A69DC0] flex items-center gap-2 mt-0.5">
                      <span>{preset.tag}</span>
                      <span>·</span>
                      <span>{preset.recommendedTime}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save / Cancel Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#C5BCD9] transition-all"
            >
              Cancel
            </button>
            <button
              id="daily-goal-save-btn"
              type="submit"
              disabled={!editText.trim()}
              className="px-5 py-2 rounded-xl bg-[#1FB6B0] hover:bg-[#1FB6B0]/90 text-[#17132B] text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 pt-3 border-t border-white/10 flex flex-col xs:flex-row items-center justify-between text-[11px] text-[#A69DC0] gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📖</span>
          <span className="italic">“Whoever is faithful in very little is also faithful in much.” (Luke 16:10)</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#8E84A6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1FB6B0]" />
          <span>Resets daily at midnight</span>
        </div>
      </div>
    </section>
  );
}
