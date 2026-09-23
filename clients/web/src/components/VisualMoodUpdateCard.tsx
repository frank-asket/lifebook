'use client';

import React, { useState, useMemo } from 'react';
import {
  Heart,
  BookOpen,
  Lightbulb,
  Check,
  CheckCircle,
  HandsPraying,
  PencilSimpleLine,
  FloppyDisk,
  Sparkle,
  Leaf,
} from '@phosphor-icons/react';
import type { MoodItem, DayActivityRecord } from './ProgressScreen';
import { MOODS } from './ProgressScreen';

interface VisualMoodUpdateCardProps {
  todayStr: string;
  selectedDateStr: string;
  calendarRecords: Record<string, DayActivityRecord>;
  onUpdateRecord: (dateStr: string, updatedRecord: DayActivityRecord) => void;
  onOpenJournal?: () => void;
  onSelectDate?: (dateStr: string) => void;
}

// Scripture anchors tailored to each emotional state
const MOOD_SCRIPTURE_MAP: Record<
  string,
  {
    scriptureRef: string;
    verse: string;
    guidance: string;
    ambientBg: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  grateful: {
    scriptureRef: 'Psalm 103:1-2',
    verse: 'Bless the Lord, O my soul, and all that is within me, bless his holy name! Bless the Lord, O my soul, and forget not all his benefits.',
    guidance: 'Anchor this gratitude in thanksgiving: celebrate the small unseen provisions God made today.',
    ambientBg: 'from-[#FFFDF5] via-[#FFF9EB] to-[#FFF3D6]',
    borderColor: '#E3B15E',
    glowColor: 'rgba(227, 177, 94, 0.25)',
  },
  peaceful: {
    scriptureRef: 'John 14:27',
    verse: 'Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.',
    guidance: 'Rest in His finished work. You do not need to strive; let this quietness guard your mind.',
    ambientBg: 'from-[#F4FCFB] via-[#E8F8F7] to-[#DBF4F2]',
    borderColor: '#37C6C2',
    glowColor: 'rgba(55, 198, 194, 0.25)',
  },
  seeking: {
    scriptureRef: 'Jeremiah 29:13',
    verse: 'You will seek me and find me, when you seek me with all your heart.',
    guidance: 'God honors your searching. Sit with open hands and listen for His still small whisper.',
    ambientBg: 'from-[#FAF7FD] via-[#F4EDFA] to-[#EBE0F7]',
    borderColor: '#7B62B8',
    glowColor: 'rgba(123, 98, 184, 0.25)',
  },
  convicted: {
    scriptureRef: 'Psalm 51:10,17',
    verse: 'Create in me a clean heart, O God, and renew a right spirit within me. The sacrifices of God are a broken spirit; a broken and contrite heart, O God, you will not despise.',
    guidance: 'Conviction is an invitation of love, not condemnation. Receive His tender mercy today.',
    ambientBg: 'from-[#FCF6F5] via-[#F9ECEB] to-[#F5DFDD]',
    borderColor: '#B8746B',
    glowColor: 'rgba(184, 116, 107, 0.25)',
  },
  doubting: {
    scriptureRef: 'Mark 9:24',
    verse: 'Immediately the father of the child cried out and said, “I believe; help my unbelief!”',
    guidance: 'Bring your honest questions before Christ. He never turns away a wrestling soul.',
    ambientBg: 'from-[#F5F8FB] via-[#EDF3F9] to-[#E1EAF4]',
    borderColor: '#6B8CAE',
    glowColor: 'rgba(107, 140, 174, 0.25)',
  },
  distant: {
    scriptureRef: 'Psalm 139:7-10',
    verse: 'Where shall I go from your Spirit? Or where shall I flee from your presence? If I take the wings of the morning and dwell in the uttermost parts of the sea, even there your hand shall lead me.',
    guidance: 'Feelings may wander, but His covenant remains unshakable. You are fully seen and held.',
    ambientBg: 'from-[#F6F5F9] via-[#EFECEF] to-[#E6E2EB]',
    borderColor: '#5B5580',
    glowColor: 'rgba(91, 85, 128, 0.25)',
  },
};

const INTENSITY_LEVELS = [
  { level: 1, label: 'Gentle Whisper', desc: 'A quiet, subdued moment with God' },
  { level: 2, label: 'Steady Peace', desc: 'Consistent attentiveness throughout the day' },
  { level: 3, label: 'Deep Encounter', desc: 'Heartfelt clarity and spiritual communion' },
  { level: 4, label: 'Overflowing Presence', desc: 'Vivid revelation, brokenness, or joy' },
];

export function VisualMoodUpdateCard({
  todayStr,
  selectedDateStr,
  calendarRecords,
  onUpdateRecord,
  onOpenJournal,
  onSelectDate,
}: VisualMoodUpdateCardProps) {
  const currentDateKey = selectedDateStr || todayStr;
  const isToday = currentDateKey === todayStr;

  const currentRecord = useMemo(() => {
    return (
      calendarRecords[currentDateKey] || {
        date: currentDateKey,
        dayLabel: new Date(currentDateKey + 'T12:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        mood: null,
        intensity: 0,
        scriptureRead: false,
        prayerCompleted: false,
        stillnessPractice: false,
        journalWritten: false,
      }
    );
  }, [calendarRecords, currentDateKey]);

  // Form states initialized to current record
  const [prevDateKey, setPrevDateKey] = useState(currentDateKey);
  const [selectedMood, setSelectedMood] = useState<MoodItem['id'] | null>(currentRecord.mood);
  const [intensity, setIntensity] = useState<number>(Math.max(1, currentRecord.intensity || 2));
  const [scriptureRead, setScriptureRead] = useState<boolean>(currentRecord.scriptureRead || false);
  const [prayerCompleted, setPrayerCompleted] = useState<boolean>(currentRecord.prayerCompleted || false);
  const [stillnessPractice, setStillnessPractice] = useState<boolean>(currentRecord.stillnessPractice || false);
  const [journalWritten, setJournalWritten] = useState<boolean>(currentRecord.journalWritten || false);
  const [reflectionText, setReflectionText] = useState<string>(currentRecord.reflectionSnippet || '');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Sync state whenever selected date changes
  if (prevDateKey !== currentDateKey) {
    setPrevDateKey(currentDateKey);
    setSelectedMood(currentRecord.mood);
    setIntensity(Math.max(1, currentRecord.intensity || 2));
    setScriptureRead(currentRecord.scriptureRead || false);
    setPrayerCompleted(currentRecord.prayerCompleted || false);
    setStillnessPractice(currentRecord.stillnessPractice || false);
    setJournalWritten(currentRecord.journalWritten || false);
    setReflectionText(currentRecord.reflectionSnippet || '');
    setIsSavedSuccess(false);
  }

  const activeMoodConfig = selectedMood ? MOOD_SCRIPTURE_MAP[selectedMood] : null;

  const handleSaveMood = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedMood) {
      // Default to peaceful if none selected
      setSelectedMood('peaceful');
    }

    const finalMood = selectedMood || 'peaceful';
    const finalIntensity = Math.max(1, intensity);

    const updated: DayActivityRecord = {
      ...currentRecord,
      date: currentDateKey,
      mood: finalMood,
      intensity: finalIntensity,
      scriptureRead,
      prayerCompleted,
      stillnessPractice,
      journalWritten,
      reflectionSnippet: reflectionText.trim() || undefined,
      scriptureRef: activeMoodConfig?.scriptureRef,
    };

    onUpdateRecord(currentDateKey, updated);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
    }, 4000);
  };

  const handleQuickMoodSelect = (moodId: MoodItem['id']) => {
    setSelectedMood(moodId);
    setIsSavedSuccess(false);
  };

  return (
    <div
      id="visual-mood-update-card"
      className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 relative overflow-hidden"
      style={{
        borderColor: activeMoodConfig ? activeMoodConfig.borderColor : '#E5E7EB',
        boxShadow: activeMoodConfig ? `0 12px 30px ${activeMoodConfig.glowColor}` : undefined,
      }}
    >
      {/* Background Soft Aura Accent */}
      {activeMoodConfig && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${activeMoodConfig.ambientBg} opacity-60 pointer-events-none transition-opacity duration-500`}
        />
      )}

      <div className="relative z-10">
        {/* Card Header & Date Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1FB6B0]/15 text-[#0E716D] text-[10px] font-extrabold uppercase tracking-wider">
                <Heart weight="fill" className="w-3 h-3 text-[#1FB6B0]" />
                <span>Visual Soul & Mood Check-In</span>
              </span>
              {isToday && (
                <span className="px-2 py-0.5 rounded-md bg-[#FAF5E6] text-[#785E1B] text-[10px] font-bold">
                  Today
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1931] mt-1.5">
              Record Your Heart Posture
            </h3>
            <p className="text-xs text-[#705E8C] mt-0.5">
              Check in with God. Select how your soul feels right now and pair it with Scripture and practice.
            </p>
          </div>

          {/* Quick Date Switcher / Status */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onSelectDate && !isToday && (
              <button
                type="button"
                onClick={() => onSelectDate(todayStr)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#2D234F] transition-colors cursor-pointer"
              >
                Back to Today
              </button>
            )}
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#483C66] shadow-2xs">
              📅 {new Date(currentDateKey + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* 6 Christian Emotional Postures (Visual Cards) */}
        <div className="mt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-[#705E8C] block mb-3">
            1. Select Your Current Emotional & Spiritual State
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  id={`visual-mood-option-${m.id}`}
                  onClick={() => handleQuickMoodSelect(m.id)}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-white shadow-md ring-2 ring-offset-1 scale-[1.02]'
                      : 'bg-[#FAF8FC] hover:bg-white hover:shadow-xs border-gray-200/80'
                  }`}
                  style={{
                    borderColor: isSelected ? m.color : undefined,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ['--tw-ring-color' as any]: m.color,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl transform transition-transform group-hover:scale-110">
                      {m.emoji}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full border transition-all"
                      style={{
                        backgroundColor: isSelected ? m.color : 'transparent',
                        borderColor: m.color,
                      }}
                    />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#1E1931] group-hover:text-[#2E204A]">
                      {m.label}
                    </h4>
                    <p className="text-[10px] text-[#7E7096] line-clamp-2 mt-0.5 leading-tight">
                      {m.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scripture Promise Anchor based on current mood */}
        {activeMoodConfig && (
          <div className="mt-5 p-4 rounded-2xl bg-white/80 border border-gray-200/90 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1FB6B0] flex items-center gap-1.5">
                <BookOpen weight="bold" className="w-3.5 h-3.5" />
                <span>Anchor Scripture Promise · {activeMoodConfig.scriptureRef}</span>
              </span>
              <span className="text-[11px] font-bold text-[#7E6C3B] bg-[#FFF8E6] px-2 py-0.5 rounded-md border border-[#F0DFB2]">
                Word for Your Soul
              </span>
            </div>
            <p className="font-serif italic text-xs sm:text-sm text-[#2C2442] mt-2 leading-relaxed">
              “{activeMoodConfig.verse}”
            </p>
            <p className="text-[11px] text-[#695B82] mt-2 border-t border-gray-100 pt-2 flex items-center gap-1.5">
              <Lightbulb weight="bold" className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeMoodConfig.guidance}</span>
            </p>
          </div>
        )}

        {/* Spiritual Practices & Intensity Selection */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Depth / Intensity Gauge */}
          <div className="p-4 rounded-2xl bg-[#FAF8FC] border border-gray-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#705E8C]">
                2. Emotional & Spiritual Intensity
              </label>
              <span className="text-xs font-bold text-[#2A1F45]">
                {INTENSITY_LEVELS.find((l) => l.level === intensity)?.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {INTENSITY_LEVELS.map((lvl) => {
                const isActive = intensity === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setIntensity(lvl.level)}
                    className={`py-2 px-1.5 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2A2146] text-white border-[#2A2146] shadow-xs'
                        : 'bg-white hover:bg-gray-50 text-[#54486E] border-gray-200'
                    }`}
                  >
                    <span className="block text-[11px]">Lvl {lvl.level}</span>
                    <span className="block text-[9px] font-medium opacity-80 truncate">
                      {lvl.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#7B6E96] mt-2.5 italic">
              {INTENSITY_LEVELS.find((l) => l.level === intensity)?.desc}
            </p>
          </div>

          {/* Practice Checkboxes */}
          <div className="p-4 rounded-2xl bg-[#FAF8FC] border border-gray-200/80">
            <label className="text-xs font-bold uppercase tracking-wider text-[#705E8C] block mb-2">
              3. Connected Devotional Habits
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                id="habit-check-scripture"
                onClick={() => setScriptureRead((prev) => !prev)}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-2 cursor-pointer ${
                  scriptureRead
                    ? 'bg-[#1FB6B0]/15 border-[#1FB6B0] text-[#0A6460]'
                    : 'bg-white border-gray-200 text-[#473C63] hover:bg-gray-50'
                }`}
              >
                {scriptureRead ? (
                  <CheckCircle weight="fill" className="w-4 h-4 text-[#1FB6B0]" />
                ) : (
                  <BookOpen weight="regular" className="w-4 h-4 text-gray-500" />
                )}
                <span>Scripture Read</span>
              </button>

              <button
                type="button"
                id="habit-check-prayer"
                onClick={() => setPrayerCompleted((prev) => !prev)}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-2 cursor-pointer ${
                  prayerCompleted
                    ? 'bg-[#E3B15E]/20 border-[#E3B15E] text-[#694E15]'
                    : 'bg-white border-gray-200 text-[#473C63] hover:bg-gray-50'
                }`}
              >
                {prayerCompleted ? (
                  <CheckCircle weight="fill" className="w-4 h-4 text-[#E3B15E]" />
                ) : (
                  <HandsPraying weight="regular" className="w-4 h-4 text-gray-500" />
                )}
                <span>Spoke in Prayer</span>
              </button>

              <button
                type="button"
                id="habit-check-stillness"
                onClick={() => setStillnessPractice((prev) => !prev)}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-2 cursor-pointer ${
                  stillnessPractice
                    ? 'bg-[#7B62B8]/15 border-[#7B62B8] text-[#473177]'
                    : 'bg-white border-gray-200 text-[#473C63] hover:bg-gray-50'
                }`}
              >
                {stillnessPractice ? (
                  <CheckCircle weight="fill" className="w-4 h-4 text-[#7B62B8]" />
                ) : (
                  <Leaf weight="regular" className="w-4 h-4 text-gray-500" />
                )}
                <span>Silent Abiding</span>
              </button>

              <button
                type="button"
                id="habit-check-journal"
                onClick={() => setJournalWritten((prev) => !prev)}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-2 cursor-pointer ${
                  journalWritten
                    ? 'bg-[#B8746B]/15 border-[#B8746B] text-[#713932]'
                    : 'bg-white border-gray-200 text-[#473C63] hover:bg-gray-50'
                }`}
              >
                {journalWritten ? (
                  <CheckCircle weight="fill" className="w-4 h-4 text-[#B8746B]" />
                ) : (
                  <PencilSimpleLine weight="regular" className="w-4 h-4 text-gray-500" />
                )}
                <span>Soul Journaling</span>
              </button>
            </div>
            <p className="text-[10px] text-[#7B6E96] mt-2">
              Marking habits fuels your daily consistency streak and unlocks spiritual badges.
            </p>
          </div>
        </div>

        {/* Optional Reflection Snippet */}
        <div className="mt-5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#705E8C] block mb-1.5">
            4. Quick Soul Reflection (Optional)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="visual-mood-reflection-input"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="e.g., Felt deep peace walking by the lake; Psalm 23 was a comforting reminder..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#1E1835] placeholder:text-[#9A8DAE] focus:outline-none focus:ring-2 focus:ring-[#1FB6B0] shadow-2xs"
            />
            {onOpenJournal && (
              <button
                type="button"
                onClick={onOpenJournal}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-[#483C66] transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen weight="bold" className="w-3.5 h-3.5" />
                <span>Full Journal</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Confirmation Bar */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isSavedSuccess ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F8F5] border border-[#A5E3D8] text-[#0D6B63] text-xs font-bold animate-fadeIn">
                <Check weight="bold" className="w-3.5 h-3.5" />
                <span>
                  Heart record updated for {currentDateKey}! Milestone progress recalculated.
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#7B6E96]">
                {currentRecord.mood ? (
                  <span>
                    Current state: <strong className="capitalize text-[#2D234F]">{currentRecord.mood}</strong> ({currentRecord.intensity}/4 practices)
                  </span>
                ) : (
                  <span>No mood recorded yet for this date. Click below to save!</span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="visual-mood-save-btn"
              onClick={() => handleSaveMood()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#241C3D] to-[#17132B] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FloppyDisk weight="fill" className="w-4 h-4 text-white" />
              <span>Save & Update Soul Record</span>
              <Sparkle weight="bold" className="w-3.5 h-3.5 text-[#37C6C2]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
