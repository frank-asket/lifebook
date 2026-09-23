'use client';

import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  CalendarBlank,
  Star,
  Copy,
  Check,
  Trash,
  X,
  PencilSimpleLine,
} from '@phosphor-icons/react';
import type { JournalEntry } from './DynamicMoodJournal';

interface JournalSearchBarProps {
  entries: JournalEntry[];
  onSelectEntry?: (entry: JournalEntry) => void;
  onOpenJournalTab: () => void;
  onDeleteEntry?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

// Helper to highlight matching text in search results
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[#FFE082] text-[#332200] px-0.5 rounded font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

// Extract YYYY-MM-DD from an entry for consistent date matching
function getEntryISODate(entry: JournalEntry): string {
  if (entry.timestamp) {
    return new Date(entry.timestamp).toISOString().slice(0, 10);
  }
  // Check if date string starts with YYYY-MM-DD
  const match = entry.date.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  // Try parsing date string directly
  try {
    const parsed = new Date(entry.date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch {
    // fallback
  }
  return '';
}

export function JournalSearchBar({
  entries,
  onSelectEntry,
  onOpenJournalTab,
  onDeleteEntry,
  onToggleFavorite,
}: JournalSearchBarProps) {
  const [keywordQuery, setKeywordQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Today string for calculations
  const todayISODate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter entries dynamically by keyword AND date
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

    return entries.filter((entry) => {
      const entryIso = getEntryISODate(entry);
      const entryTimestamp = entry.timestamp || (entryIso ? new Date(entryIso).getTime() : 0);

      // 1. Date Filter: Preset or specific custom date
      if (selectedDate) {
        if (entryIso !== selectedDate && !entry.date.includes(selectedDate)) {
          return false;
        }
      } else if (dateRangePreset === 'today') {
        if (entryIso !== todayISODate && !entry.date.toLowerCase().includes('today')) {
          return false;
        }
      } else if (dateRangePreset === '7days') {
        if (entryTimestamp > 0 && entryTimestamp < sevenDaysAgoMs) {
          return false;
        }
      } else if (dateRangePreset === '30days') {
        if (entryTimestamp > 0 && entryTimestamp < thirtyDaysAgoMs) {
          return false;
        }
      }

      // 2. Keyword Filter: Search across entry text, tags, mood, and Scripture
      if (keywordQuery.trim()) {
        const q = keywordQuery.toLowerCase().trim();
        const textMatch = entry.text.toLowerCase().includes(q);
        const scriptureMatch = Boolean(entry.scriptureRef?.toLowerCase().includes(q));
        const snippetMatch = Boolean(entry.scriptureSnippet?.toLowerCase().includes(q));
        const tagsMatch = Boolean(entry.tags?.some((t) => t.toLowerCase().includes(q)));
        const moodMatch = Boolean(entry.moodLabel?.toLowerCase().includes(q));
        const promptMatch = Boolean(entry.promptUsed?.toLowerCase().includes(q));
        const dateStringMatch = entry.date.toLowerCase().includes(q);

        if (
          !textMatch &&
          !scriptureMatch &&
          !snippetMatch &&
          !tagsMatch &&
          !moodMatch &&
          !promptMatch &&
          !dateStringMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [entries, keywordQuery, selectedDate, dateRangePreset, todayISODate]);

  // Handle copying reflection to clipboard
  const handleCopy = async (entry: JournalEntry) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      const copyText = `${entry.text}${entry.scriptureRef ? `\n\nScripture: ${entry.scriptureRef}` : ''}\n— LifeBook Soul Journal (${entry.date})`;
      await navigator.clipboard.writeText(copyText);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleResetFilters = () => {
    setKeywordQuery('');
    setSelectedDate('');
    setDateRangePreset('all');
  };

  const hasActiveFilters = Boolean(keywordQuery.trim() || selectedDate || dateRangePreset !== 'all');

  return (
    <div
      id="journal-search-filter-section"
      className="rounded-3xl bg-[#fbfaf7] border border-[#2d2542]/12 p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d2542]/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#66c8bb]/15 border border-[#66c8bb]/30 text-[#0e716d] text-[10px] font-extrabold uppercase tracking-[0.14em]">
            <MagnifyingGlass weight="bold" className="w-3.5 h-3.5" />
            <span>Journal Archive & Search</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-normal text-[#1e1931] mt-2">
            Filter Past Journal <em>Reflections</em>
          </h3>
          <p className="text-xs text-[#776e82] mt-0.5">
            Search your past spiritual reflections by keyword, Scripture reference, mood, or calendar date.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenJournalTab}
          className="pill-button pill-dark flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PencilSimpleLine weight="bold" className="w-3.5 h-3.5" />
          <span>Write New Reflection</span>
        </button>
      </div>

      {/* SEARCH CONTROLS: KEYWORD & DATE PICKER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* 1. Keyword Search Input (takes 7 columns on desktop) */}
        <div className="md:col-span-7 relative">
          <label htmlFor="journal-keyword-input" className="block text-[10px] font-bold text-[#705e8c] uppercase tracking-[0.14em] mb-1.5">
            Keyword or Scripture
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              <MagnifyingGlass weight="bold" className="w-4 h-4 text-gray-400" />
            </span>
            <input
              id="journal-keyword-input"
              type="text"
              value={keywordQuery}
              onChange={(e) => setKeywordQuery(e.target.value)}
              placeholder="Search keyword (e.g. peace, gratitude, surrender, Psalm 23)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-[#2d2542]/15 text-xs text-[#1e1931] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66c8bb] transition-all"
            />
            {keywordQuery && (
              <button
                type="button"
                onClick={() => setKeywordQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center bg-gray-200/80 cursor-pointer"
                title="Clear keyword search"
              >
                <X weight="bold" className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Specific Date Picker Input (takes 5 columns on desktop) */}
        <div className="md:col-span-5 relative">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="journal-date-input" className="block text-[10px] font-bold text-[#705e8c] uppercase tracking-[0.14em]">
              Filter by Date
            </label>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-[10px] text-[#0e716d] hover:underline font-bold cursor-pointer"
              >
                Clear Date
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="journal-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) setDateRangePreset('all');
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#2d2542]/15 text-xs text-[#1e1931] focus:outline-none focus:ring-2 focus:ring-[#66c8bb] transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* QUICK DATE RANGE PRESETS & ACTIVE FILTER PILLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#776D8E] mr-1">Quick Dates:</span>
          {(
            [
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Past 7 Days' },
              { id: '30days', label: 'Past 30 Days' },
            ] as const
          ).map((preset) => {
            const active = dateRangePreset === preset.id && !selectedDate;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDateRangePreset(preset.id);
                  setSelectedDate('');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#17151a] text-white shadow-xs'
                    : 'bg-[#f0ebe3] text-[#5d5177] hover:bg-white hover:text-[#17151a] border border-[#2d2542]/10'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Results count & Clear All button */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#705e8c]">
            {filteredEntries.length} of {entries.length} {entries.length === 1 ? 'reflection' : 'reflections'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              id="clear-all-journal-filters-btn"
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>✕</span>
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE FILTER BADGES ROW (if filters active) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#2d2542]/10">
          <span className="text-[11px] font-bold text-[#705e8c]">Active Filters:</span>
          {keywordQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#66c8bb]/15 text-[#0e716d] text-xs font-bold border border-[#66c8bb]/30">
              <span>Keyword: “{keywordQuery}”</span>
              <button
                type="button"
                onClick={() => setKeywordQuery('')}
                className="hover:opacity-75 cursor-pointer font-extrabold"
              >
                ×
              </button>
            </span>
          )}
          {selectedDate && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e8ba6a]/20 text-[#825b0e] text-xs font-bold border border-[#e8ba6a]/35">
              <span>Date: {selectedDate}</span>
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="hover:opacity-75 cursor-pointer font-extrabold"
              >
                ×
              </button>
            </span>
          )}
          {dateRangePreset !== 'all' && !selectedDate && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#705eaa]/15 text-[#4e3a82] text-xs font-bold border border-[#705eaa]/30">
              <span>Range: {dateRangePreset === 'today' ? 'Today' : dateRangePreset === '7days' ? 'Past 7 Days' : 'Past 30 Days'}</span>
              <button
                type="button"
                onClick={() => setDateRangePreset('all')}
                className="hover:opacity-75 cursor-pointer font-extrabold"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* FILTERED PAST JOURNAL ENTRIES LIST */}
      <div className="space-y-3.5 pt-1">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => {
            const moodColor = entry.moodColor || '#1FB6B0';
            const moodEmoji = entry.moodEmoji || '🕊️';
            const moodLabel = entry.moodLabel || (entry.mood === 'sabbath' ? 'Sabbath Rest' : 'Reflection');

            return (
              <div
                key={entry.id}
                id={`search-entry-${entry.id}`}
                className="rounded-2xl border border-gray-200/90 hover:border-[#1FB6B0]/60 p-4 sm:p-5 transition-all bg-white hover:shadow-xs group"
              >
                {/* Entry Top Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mood Chip */}
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                      style={{
                        backgroundColor: `${moodColor}15`,
                        borderColor: `${moodColor}40`,
                        color: moodColor,
                      }}
                    >
                      <span>{moodEmoji}</span>
                      <span>{moodLabel}</span>
                    </span>

                    {/* Date Pill */}
                    <span className="text-xs text-[#706782] font-medium flex items-center gap-1">
                      <CalendarBlank weight="regular" className="w-3.5 h-3.5 text-[#706782]" />
                      <span>{entry.date}</span>
                    </span>

                    {entry.isFavorite && (
                      <span className="text-amber-500 text-xs flex items-center gap-1 font-semibold" title="Favorited reflection">
                        <Star weight="fill" className="w-3.5 h-3.5 text-amber-500" />
                        <span>Favorited</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Copy / Action */}
                  <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(entry)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#554A70] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      title="Copy reflection text"
                    >
                      {copiedId === entry.id ? (
                        <Check weight="bold" className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy weight="bold" className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === entry.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(entry.id)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-amber-100 text-amber-500 text-xs flex items-center justify-center transition-all cursor-pointer"
                        title="Toggle Favorite"
                      >
                        <Star weight={entry.isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteEntry && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 text-xs flex items-center justify-center transition-all cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash weight="bold" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reflection Body Text with highlighted search match */}
                <div
                  onClick={() => onSelectEntry?.(entry)}
                  className={onSelectEntry ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
                >
                  <p className="text-sm text-[#271E3D] leading-relaxed font-sans">
                    <HighlightedText text={entry.text} query={keywordQuery} />
                  </p>
                </div>

                {/* Scripture Reference Quote Snippet */}
                {entry.scriptureRef && (
                  <div className="mt-3 p-3 rounded-xl bg-[#FAF8F3] border border-[#E9E1CE] text-xs text-[#5D4E22]">
                    <div className="font-serif italic">
                      {entry.scriptureSnippet ? (
                        <span>“<HighlightedText text={entry.scriptureSnippet} query={keywordQuery} />”</span>
                      ) : null}
                    </div>
                    <span className="block mt-1 font-bold text-[#8A7539]">
                      — <HighlightedText text={entry.scriptureRef} query={keywordQuery} />
                    </span>
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-[#554A70]"
                      >
                        <HighlightedText text={tag} query={keywordQuery} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty / No Matches State */
          <div className="py-10 text-center rounded-2xl bg-[#FAF8FC] border border-dashed border-gray-200">
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-[#FAF5EE] text-[#705e8c] flex items-center justify-center">
              <MagnifyingGlass weight="duotone" className="w-6 h-6 text-[#705e8c]" />
            </div>
            <h4 className="text-base font-bold text-[#2A2146]">
              {hasActiveFilters ? 'No Matching Reflections Found' : 'No Past Reflections Yet'}
            </h4>
            <p className="text-xs text-[#706782] max-w-md mx-auto mt-1">
              {hasActiveFilters
                ? 'Try adjusting your keyword, choosing another calendar date, or resetting filters to view all entries.'
                : 'Begin recording quiet-time thoughts, prayers, and Scripture lessons to build your spiritual archive.'}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-full bg-[#1FB6B0] text-white text-xs font-bold hover:opacity-95 transition-all shadow-xs cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenJournalTab}
                  className="px-5 py-2.5 rounded-full bg-[#2A2146] text-white text-xs font-bold hover:bg-[#1E1835] transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <span>Write Your First Reflection</span>
                  <PencilSimpleLine weight="bold" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
