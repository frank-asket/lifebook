'use client';

import React, { useState, useMemo } from 'react';
import type { MoodItem, DayActivityRecord } from './ProgressScreen';
import { MOODS } from './ProgressScreen';

export interface JournalEntry {
  id: string;
  text: string;
  date: string;
  timestamp?: number;
  mood?: MoodItem['id'] | 'sabbath';
  moodEmoji?: string;
  moodLabel?: string;
  moodColor?: string;
  scriptureRef?: string;
  scriptureSnippet?: string;
  promptUsed?: string;
  tags?: string[];
  isFavorite?: boolean;
}

interface DynamicMoodJournalProps {
  entries: JournalEntry[];
  todayStr: string;
  todayRecord?: DayActivityRecord;
  onAddEntry: (entry: JournalEntry, autoLogDayActivity?: boolean) => void;
  onDeleteEntry: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCheckInMood: (moodId: MoodItem['id'], dateStr?: string) => void;
  onHonorSabbath?: () => void;
}

// Tailored spiritual prompts matching each soul posture
const MOOD_PROMPTS: Record<
  string,
  {
    theme: string;
    prompt: string;
    scriptureRef: string;
    scriptureSnippet: string;
    suggestedTags: string[];
  }
> = {
  grateful: {
    theme: 'Thanksgiving & Recognition',
    prompt: 'What unexpected grace, small provision, or answered prayer opened your eyes to God’s goodness today?',
    scriptureRef: 'Psalm 103:1-2',
    scriptureSnippet: 'Bless the Lord, O my soul, and forget not all his benefits.',
    suggestedTags: ['#Gratitude', '#Praise', '#AnsweredPrayer', '#Mercy'],
  },
  peaceful: {
    theme: 'Abiding Quiet & Stillness',
    prompt: 'In the midst of demands, where did Christ’s quiet peace guard your heart and silence anxiety?',
    scriptureRef: 'Philippians 4:6-7',
    scriptureSnippet: 'And the peace of God, which surpasses all understanding, will guard your hearts.',
    suggestedTags: ['#Peace', '#Stillness', '#Abiding', '#Trust'],
  },
  seeking: {
    theme: 'Direction, Wisdom & Discernment',
    prompt: 'What crossroad, yearning, or decision are you bringing honestly before the Lord’s guidance?',
    scriptureRef: 'Proverbs 3:5-6',
    scriptureSnippet: 'Trust in the Lord with all your heart, and do not lean on your own understanding.',
    suggestedTags: ['#SeekingWisdom', '#Discernment', '#Guidance', '#Patience'],
  },
  convicted: {
    theme: 'Surrender, Humility & Cleansing',
    prompt: 'What pattern, hesitation, or attitude is the Holy Spirit tenderly prompting you to surrender?',
    scriptureRef: 'Psalm 51:10',
    scriptureSnippet: 'Create in me a clean heart, O God, and renew a right spirit within me.',
    suggestedTags: ['#Surrender', '#Confession', '#Humility', '#Renewal'],
  },
  doubting: {
    theme: 'Honest Heart in the Mystery',
    prompt: 'Speak your raw questions and uncertainties without fear: the Lord holds you even when you can’t see.',
    scriptureRef: 'Mark 9:24',
    scriptureSnippet: 'I believe; help my unbelief!',
    suggestedTags: ['#HonestQuestions', '#FaithInDoubt', '#Lament', '#Anchored'],
  },
  distant: {
    theme: 'Whisper in the Desert',
    prompt: 'When prayer feels heavy or God seems quiet, what promise can you hold onto as anchor?',
    scriptureRef: 'Psalm 139:7-10',
    scriptureSnippet: 'Where shall I go from your Spirit? Even there your hand shall lead me.',
    suggestedTags: ['#Perseverance', '#Thirsting', '#QuietWaiting', '#HisPresence'],
  },
  sabbath: {
    theme: 'Holy Sabbath Rest & Non-Striving',
    prompt: 'What work or anxiety are you laying down today to remember that God is God and you are His child?',
    scriptureRef: 'Matthew 11:28',
    scriptureSnippet: 'Come to me, all who labor and are heavy laden, and I will give you rest.',
    suggestedTags: ['#SabbathRest', '#CeasingStriving', '#SoulRenewal', '#HolyRest'],
  },
};

const QUICK_STARTER_PROMPTS = [
  'Today I noticed God’s hand when...',
  'A burden I am actively surrendering is...',
  'What Scripture spoke most deeply to me today was...',
  'A prayer for someone I love:',
  'Sitting in quietness today, I felt...',
];

export function DynamicMoodJournal({
  entries,
  todayStr,
  todayRecord,
  onAddEntry,
  onDeleteEntry,
  onToggleFavorite,
  onCheckInMood,
  onHonorSabbath,
}: DynamicMoodJournalProps) {
  // Composer state
  const [selectedMood, setSelectedMood] = useState<MoodItem['id'] | 'sabbath'>('grateful');
  const [entryText, setEntryText] = useState('');
  const [customScriptureRef, setCustomScriptureRef] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['#Gratitude']);
  const [showScriptureInput, setShowScriptureInput] = useState(false);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  // Filters & Search
  const [filterMood, setFilterMood] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current mood prompt metadata
  const currentPromptConfig = useMemo(() => {
    return MOOD_PROMPTS[selectedMood] || MOOD_PROMPTS.grateful;
  }, [selectedMood]);

  // Handle choosing mood
  function handleSelectMood(moodId: MoodItem['id'] | 'sabbath') {
    setSelectedMood(moodId);
    if (moodId === 'sabbath') {
      if (onHonorSabbath) onHonorSabbath();
    } else {
      onCheckInMood(moodId);
    }

    // Suggest appropriate default tag for this mood
    const defaultTag = MOOD_PROMPTS[moodId]?.suggestedTags[0];
    if (defaultTag && !selectedTags.includes(defaultTag)) {
      setSelectedTags([defaultTag]);
    }
  }

  // Toggle tag in composer
  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  // Insert suggested Scripture into reflection
  function handleInsertSuggestedScripture() {
    const quote = `“${currentPromptConfig.scriptureSnippet}” (${currentPromptConfig.scriptureRef})`;
    setCustomScriptureRef(currentPromptConfig.scriptureRef);
    setEntryText(prev => (prev.trim() ? `${prev}\n\n${quote}` : quote));
  }

  // Submit new journal reflection
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entryText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const moodObj = selectedMood !== 'sabbath' ? MOODS.find(m => m.id === selectedMood) : null;
    const moodEmoji = selectedMood === 'sabbath' ? '🕊️' : moodObj?.emoji || '🙏';
    const moodLabel = selectedMood === 'sabbath' ? 'Sabbath Rest' : moodObj?.label || 'Grateful';
    const moodColor = selectedMood === 'sabbath' ? '#735DA3' : moodObj?.color || '#E3B15E';

    const now = new Date();
    const dateLabel = todayStr ? `${todayStr} · ` : 'Today · ';
    const formattedDate = `${dateLabel}${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newEntry: JournalEntry = {
      id: `journal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: entryText.trim(),
      date: formattedDate,
      timestamp: Date.now(),
      mood: selectedMood,
      moodEmoji,
      moodLabel,
      moodColor,
      scriptureRef: customScriptureRef.trim() || currentPromptConfig.scriptureRef,
      scriptureSnippet: currentPromptConfig.scriptureSnippet,
      tags: selectedTags,
      promptUsed: currentPromptConfig.prompt,
      isFavorite: false,
    };

    onAddEntry(newEntry, true);
    setEntryText('');
    setCustomScriptureRef('');
    setShowScriptureInput(false);
    setIsSubmitting(false);
  }

  // Copy reflection text to clipboard
  async function handleCopyText(entry: JournalEntry) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      const textToCopy = `${entry.text}${
        entry.scriptureRef ? `\nScripture: ${entry.scriptureRef}` : ''
      }\n[LifeBook Journal · ${entry.moodLabel || 'Soul Reflection'}]`;
      await navigator.clipboard.writeText(textToCopy);
      setCopyFeedbackId(entry.id);
      setTimeout(() => setCopyFeedbackId(null), 2000);
    } catch {
      // Fallback
    }
  }

  // Filtered & searched entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Mood filter
      if (filterMood !== 'all') {
        if (filterMood === 'sabbath' && entry.mood !== 'sabbath') return false;
        if (filterMood !== 'sabbath' && entry.mood !== filterMood) return false;
      }

      // Favorite filter
      if (onlyFavorites && !entry.isFavorite) return false;

      // Date filter
      if (filterDate) {
        let entryIso = '';
        if (entry.timestamp) {
          entryIso = new Date(entry.timestamp).toISOString().slice(0, 10);
        } else {
          const match = entry.date.match(/^(\d{4}-\d{2}-\d{2})/);
          if (match) entryIso = match[1];
        }
        if (entryIso !== filterDate && !entry.date.includes(filterDate)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = entry.text.toLowerCase().includes(query);
        const scriptMatch = Boolean(entry.scriptureRef?.toLowerCase().includes(query));
        const tagMatch = Boolean(entry.tags?.some(t => t.toLowerCase().includes(query)));
        const moodMatch = Boolean(entry.moodLabel?.toLowerCase().includes(query));
        const dateMatch = entry.date.toLowerCase().includes(query);
        if (!textMatch && !scriptMatch && !tagMatch && !moodMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [entries, filterMood, onlyFavorites, searchQuery, filterDate]);

  // Mood counts for filter badges
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    entries.forEach(e => {
      const m = e.mood || 'grateful';
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [entries]);

  return (
    <div id="dynamic-mood-journal" className="space-y-8 animate-fade-in">
      {/* 1. COMPOSER CARD: Dynamic Soul Mood Journal */}
      <section
        id="dynamic-journal-composer"
        className="rounded-3xl bg-gradient-to-br from-[#211B3B] via-[#2A2146] to-[#1C2C3E] p-6 sm:p-8 text-white shadow-xl border border-white/10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-extrabold uppercase tracking-widest text-[#37C6C2]">
              <span>✍️</span>
              <span>Dynamic Mood Journal</span>
            </div>
            <h3 className="text-2xl font-serif text-white mt-1.5 font-bold">
              Record What God Is Speaking
            </h3>
            <p className="text-xs text-[#D1C7E6] mt-0.5 max-w-xl">
              Select your soul’s current posture to reveal tailored spiritual prompts and Scripture anchors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-[#1FB6B0]/20 border border-[#1FB6B0]/40 text-[#45D6D0] text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <span>✦</span>
              <span>+20 Grace Points per Entry</span>
            </span>
          </div>
        </div>

        {/* Dynamic Mood Selector Buttons */}
        <div className="mt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-[#C8BFDE] block mb-2.5">
            Step 1: What is the posture of your heart right now?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {MOODS.map(m => {
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMood(m.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center group cursor-pointer ${
                    isSelected
                      ? 'bg-white/20 border-white text-white shadow-lg ring-2 ring-[#1FB6B0] scale-102'
                      : 'bg-white/5 border-white/10 text-[#C6BEDC] hover:bg-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <span className="text-2xl transform transition-transform group-hover:scale-120 mb-1">
                    {m.emoji}
                  </span>
                  <span className="text-xs font-bold leading-tight">{m.label}</span>
                  <span
                    className="w-2 h-1 rounded-full mt-1.5 transition-all"
                    style={{ backgroundColor: m.color }}
                  />
                </button>
              );
            })}

            {/* Sabbath Rest Mood Tile */}
            <button
              type="button"
              onClick={() => handleSelectMood('sabbath')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center group cursor-pointer ${
                selectedMood === 'sabbath'
                  ? 'bg-gradient-to-br from-[#735DA3]/40 to-[#1FB6B0]/30 border-[#9F8CC4] text-white shadow-lg ring-2 ring-[#735DA3] scale-102'
                  : 'bg-white/5 border-white/10 text-[#C6BEDC] hover:bg-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              <span className="text-2xl transform transition-transform group-hover:scale-120 mb-1">
                🕊️
              </span>
              <span className="text-xs font-bold leading-tight">Sabbath</span>
              <span className="w-2 h-1 rounded-full mt-1.5 bg-[#9F8CC4]" />
            </button>
          </div>
        </div>

        {/* Dynamic Devotional Prompt Card (Tailored to Selected Mood) */}
        <div
          id="mood-guided-prompt-box"
          className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 transition-all duration-300 backdrop-blur-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm">✦</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#37C6C2]">
                {currentPromptConfig.theme}
              </span>
            </div>
            <button
              type="button"
              onClick={handleInsertSuggestedScripture}
              className="text-xs text-[#E3B15E] hover:text-[#F3CB78] font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>📖</span>
              <span>Insert Scripture Anchor ({currentPromptConfig.scriptureRef})</span>
            </button>
          </div>

          <p className="mt-3 text-sm sm:text-base font-serif italic text-white/95 leading-relaxed">
            “{currentPromptConfig.prompt}”
          </p>

          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#B9AFCE]">Quick Starters:</span>
            {QUICK_STARTER_PROMPTS.map((starter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setEntryText(prev => (prev ? `${prev} ${starter}` : starter))}
                className="text-[11px] bg-white/10 hover:bg-white/20 text-[#E0D7F0] px-2.5 py-1 rounded-full transition-all border border-white/10 cursor-pointer"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* Reflection Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs text-[#C8BFDE] mb-1.5 font-medium">
              <span>Your Honest Reflection</span>
              <span className="text-[11px] text-[#A69BBF]">{entryText.length} characters</span>
            </div>
            <textarea
              id="dynamic-journal-textarea"
              rows={4}
              value={entryText}
              onChange={e => setEntryText(e.target.value)}
              placeholder={`Pour out your soul... (${currentPromptConfig.prompt})`}
              className="w-full rounded-2xl bg-white/10 border border-white/20 p-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1FB6B0] focus:border-transparent transition-all leading-relaxed"
            />
          </div>

          {/* Scripture Attachment Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowScriptureInput(!showScriptureInput)}
                className="text-xs text-[#C8BFDE] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>📖</span>
                <span>{showScriptureInput ? 'Hide Scripture Reference' : '+ Attach Custom Scripture'}</span>
              </button>
            </div>

            {/* Suggested Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {currentPromptConfig.suggestedTags.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#1FB6B0] text-[#132A29] border-[#1FB6B0]'
                        : 'bg-white/5 border-white/15 text-[#B9AFCE] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Scripture Input Field */}
          {showScriptureInput && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 animate-fade-in">
              <span className="text-sm">🔍</span>
              <input
                type="text"
                value={customScriptureRef}
                onChange={e => setCustomScriptureRef(e.target.value)}
                placeholder="e.g. Romans 8:28, Psalm 23:1, Colossians 3:15..."
                className="w-full bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#A69BBF] flex items-center gap-2">
              <span>🕊️</span>
              <span>
                {todayRecord?.journalWritten
                  ? 'Reflection already logged for today (Streak secured!)'
                  : 'Logging will complete today’s journal habit (+1 continuous streak)'}
              </span>
            </div>

            <button
              id="save-dynamic-journal-entry-btn"
              type="submit"
              disabled={!entryText.trim() || isSubmitting}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#1FB6B0] to-[#37C6C2] hover:from-[#189b96] hover:to-[#2fb2ae] disabled:opacity-40 disabled:cursor-not-allowed text-[#142627] font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>✦</span>
              <span>Save Reflection & Earn +20 GP</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. RECENT REFLECTIONS FEED WITH MOOD FILTER & SEARCH */}
      <section
        id="dynamic-journal-history-card"
        className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#705E8C]">
              Spiritual Archive
            </span>
            <h3 className="text-2xl font-serif text-[#1E1931] mt-0.5">
              Soul Reflections & Mood Trajectory
            </h3>
            <p className="text-xs text-[#706782] mt-0.5">
              Chronicle of how God has met you across varied seasons of joy, longing, and stillness.
            </p>
          </div>

          {/* Search bar, Date Filter & Favorites toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Keyword search input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reflections or Scripture..."
                className="pl-8 pr-7 py-2 rounded-2xl bg-[#F6F4F9] border border-gray-200 text-xs text-[#2A2045] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1FB6B0] w-48 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date filter input */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-[#F6F4F9] border border-gray-200 text-xs text-[#2A2045] focus:outline-none focus:ring-2 focus:ring-[#1FB6B0] cursor-pointer"
                title="Filter reflections by specific date"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="ml-1 text-gray-400 hover:text-red-500 text-xs font-bold px-1"
                  title="Clear date filter"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyFavorites
                  ? 'bg-[#E3B15E] text-white border-[#E3B15E] shadow-xs'
                  : 'bg-[#F6F4F9] border-gray-200 text-[#594B73] hover:bg-gray-100'
              }`}
            >
              <span>{onlyFavorites ? '★' : '☆'}</span>
              <span>Favorites</span>
            </button>
          </div>
        </div>

        {/* Dynamic Mood Filter Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMood('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterMood === 'all'
                ? 'bg-[#2A2146] text-white shadow-xs'
                : 'bg-gray-100 text-[#65597C] hover:bg-gray-200'
            }`}
          >
            All Reflections ({moodCounts.all || 0})
          </button>

          {MOODS.map(m => {
            const count = moodCounts[m.id] || 0;
            const active = filterMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setFilterMood(m.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'ring-2 ring-offset-1 text-white shadow-xs'
                    : 'bg-[#FAF8FC] text-[#554A70] hover:bg-[#EFEBF6]'
                }`}
                style={{
                  backgroundColor: active ? m.color : undefined,
                  borderColor: active ? m.color : undefined,
                }}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}

          {/* Sabbath Filter */}
          {moodCounts.sabbath ? (
            <button
              type="button"
              onClick={() => setFilterMood('sabbath')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterMood === 'sabbath'
                  ? 'bg-[#735DA3] text-white ring-2 ring-offset-1 ring-[#735DA3] shadow-xs'
                  : 'bg-[#FAF8FC] text-[#554A70] hover:bg-[#EFEBF6]'
              }`}
            >
              <span>🕊️</span>
              <span>Sabbath</span>
              <span className="text-[10px] opacity-80">({moodCounts.sabbath})</span>
            </button>
          ) : null}
        </div>

        {/* Entries List */}
        <div className="mt-6 space-y-4">
          {filteredEntries.length > 0 ? (
            filteredEntries.map(entry => {
              const isSabbath = entry.mood === 'sabbath';
              return (
                <div
                  key={entry.id}
                  id={`journal-entry-${entry.id}`}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 ${
                    isSabbath
                      ? 'bg-gradient-to-br from-[#F6F3FC] to-[#FAF8F5] border-[#D1C5EB] shadow-xs hover:border-[#8E7BB7]'
                      : 'bg-[#FAF8F5] border-gray-200/80 shadow-xs hover:border-[#1FB6B0]/50'
                  }`}
                >
                  {/* Top Bar: Mood Tag, Date & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                        style={{
                          backgroundColor: isSabbath ? '#735DA3' : entry.moodColor || '#1FB6B0',
                        }}
                      >
                        <span>{entry.moodEmoji || '🕊'}</span>
                        <span>{entry.moodLabel || 'Soul Reflection'}</span>
                      </span>

                      <span className="text-[11px] font-semibold text-[#8B7FA4]">{entry.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy Text Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyText(entry)}
                        title="Copy reflection to clipboard"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1FB6B0] hover:bg-white text-xs transition-colors cursor-pointer"
                      >
                        {copyFeedbackId === entry.id ? '✓ Copied' : '📋 Copy'}
                      </button>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(entry.id)}
                        title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        className={`p-1.5 rounded-lg text-sm transition-transform active:scale-120 cursor-pointer ${
                          entry.isFavorite
                            ? 'text-[#E3B15E] bg-[#E3B15E]/10'
                            : 'text-gray-300 hover:text-[#E3B15E] hover:bg-white'
                        }`}
                      >
                        {entry.isFavorite ? '★' : '☆'}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this journal reflection?')) {
                            onDeleteEntry(entry.id);
                          }
                        }}
                        title="Delete reflection"
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Body Text */}
                  <p className="mt-3.5 text-sm sm:text-base text-[#2F2745] leading-relaxed font-sans whitespace-pre-line">
                    {entry.text}
                  </p>

                  {/* Attached Scripture Box */}
                  {entry.scriptureRef && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-white border border-[#E9E3D5] text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[#8A7539] font-bold">
                        <span>📖</span>
                        <span>Scripture Anchor: {entry.scriptureRef}</span>
                      </div>
                      {entry.scriptureSnippet && (
                        <p className="mt-1 font-serif italic text-[#4A3D24]">
                          “{entry.scriptureSnippet}”
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bottom Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-2">
                      {entry.tags.map(t => (
                        <span
                          key={t}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[#6B5E86]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center rounded-3xl bg-[#FAF8FC] border border-dashed border-gray-300">
              <span className="text-3xl block">🕊️</span>
              <h4 className="text-base font-serif font-bold text-[#2A2045] mt-2">
                No reflections found matching your filter
              </h4>
              <p className="text-xs text-[#7B6E96] mt-1 max-w-sm mx-auto">
                {searchQuery || filterMood !== 'all' || onlyFavorites
                  ? 'Try clearing your search query or selecting "All Reflections" to view your spiritual archive.'
                  : 'Take a quiet breath and record your first soul reflection above to begin your spiritual chronicle.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
