'use client';

import React, { useState, useMemo } from 'react';
import type { Badge } from './ProgressScreen';

interface VisualRewardsBadgesCardProps {
  badges: Badge[];
  currentStreak: number;
  gracePoints: number;
  onTriggerBadgeCelebration: (badge: Badge) => void;
  onUnlockBadgeDirectly?: (badgeId: string) => void;
}

export function VisualRewardsBadgesCard({
  badges,
  currentStreak,
  gracePoints,
  onTriggerBadgeCelebration,
  onUnlockBadgeDirectly,
}: VisualRewardsBadgesCardProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const earnedCount = useMemo(() => badges.filter((b) => b.earned).length, [badges]);
  const totalCount = badges.length;
  const earnedPercentage = Math.round((earnedCount / totalCount) * 100);

  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      if (filter === 'unlocked' && !b.earned) return false;
      if (filter === 'locked' && b.earned) return false;
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      return true;
    });
  }, [badges, filter, selectedCategory]);

  // Find next closest locked milestone
  const nextTarget = useMemo(() => {
    return badges.find((b) => !b.earned) || null;
  }, [badges]);

  return (
    <div
      id="visual-rewards-badges-card"
      className="rounded-3xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-8"
    >
      {/* Header & Overview Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3B15E]/15 border border-[#E3B15E]/30 text-[#84631D] text-[10px] font-extrabold uppercase tracking-widest">
            <span>👑</span>
            <span>Sanctuary Visual Rewards</span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1E1931] mt-2">
            Milestone Badges & Spiritual Crowns
          </h3>
          <p className="text-xs text-[#705E8C] mt-1 max-w-xl">
            Earn sacred badges for hitting consistency milestones like <strong>Faithful Week</strong> and <strong>Monthly Reflection</strong>. Each badge unlocks grace points, sacred seals, and Scripture illumination.
          </p>
        </div>

        {/* Global Rewards Stats */}
        <div className="flex items-center gap-4 bg-[#FAF8FC] border border-[#ECE7F4] rounded-2xl p-3.5 sm:px-5">
          <div className="text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7B6E96] block">
              Badges Earned
            </span>
            <span className="text-xl font-bold font-serif text-[#2B2147]">
              {earnedCount} <span className="text-xs font-sans text-[#7B6E96]">/ {totalCount} ({earnedPercentage}%)</span>
            </span>
          </div>

          <div className="w-[1px] h-8 bg-gray-200" />

          <div className="text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7B6E96] block">
              Sanctuary Grace
            </span>
            <span className="text-xl font-bold font-serif text-[#B38018] flex items-center justify-center gap-1">
              <span>✦</span>
              <span>{gracePoints}</span>
            </span>
          </div>

          <div className="w-[1px] h-8 bg-gray-200" />

          <div className="text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7B6E96] block">
              Current Streak
            </span>
            <span className="text-xl font-bold font-serif text-[#0E716D]">
              {currentStreak}d
            </span>
          </div>
        </div>
      </div>

      {/* Featured Next Milestone Spotlight Banner */}
      {nextTarget && (
        <div
          id="featured-next-milestone-banner"
          className="rounded-3xl bg-gradient-to-r from-[#1F1739] via-[#2A1E4B] to-[#122F3A] p-6 text-white shadow-md relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0 shadow-lg"
                style={{
                  backgroundColor: `${nextTarget.tierColor || '#E3B15E'}25`,
                  borderColor: nextTarget.tierColor || '#E3B15E',
                }}
              >
                {nextTarget.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#37C6C2]">
                    Next Target Milestone
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/15 text-[#F3EDFF]">
                    {nextTarget.tierLabel || nextTarget.tier}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white font-serif mt-0.5">
                  {nextTarget.title}
                </h4>
                <p className="text-xs text-[#C5BCD9] mt-0.5 max-w-lg">
                  {nextTarget.description}
                </p>
                <div className="text-[11px] text-[#37C6C2] mt-1 font-medium flex items-center gap-1">
                  <span>🎯 Requirement:</span>
                  <span>{nextTarget.requirement}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-2xl font-bold font-serif text-[#E3B15E]">
                  +{nextTarget.rewardPoints}
                </span>
                <span className="text-[11px] text-[#C5BCD9] block">Grace Points upon unlock</span>
              </div>

              {onUnlockBadgeDirectly && (
                <button
                  type="button"
                  id={`instant-unlock-target-${nextTarget.id}`}
                  onClick={() => onUnlockBadgeDirectly(nextTarget.id)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1FB6B0] to-[#0E7773] hover:opacity-95 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Simulate hitting this milestone"
                >
                  <span>⚡</span>
                  <span>Simulate Unlock Animation</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar towards next target */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs text-[#C5BCD9] mb-1.5 font-medium">
              <span>Progress towards milestone</span>
              <span>
                {nextTarget.currentProgress ?? 0} / {nextTarget.targetProgress ?? 1} completed (
                {Math.min(
                  100,
                  Math.round(
                    ((nextTarget.currentProgress ?? 0) / Math.max(1, nextTarget.targetProgress ?? 1)) * 100
                  )
                )}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1FB6B0] via-[#72D5CF] to-[#E3B15E] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((nextTarget.currentProgress ?? 0) / Math.max(1, nextTarget.targetProgress ?? 1)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Category Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FAF8FC] p-1 rounded-2xl border border-gray-200">
          <button
            type="button"
            id="badge-filter-all"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#2A2146] text-white shadow-xs'
                : 'text-[#5B4F73] hover:text-[#2A2146]'
            }`}
          >
            All Milestones ({totalCount})
          </button>
          <button
            type="button"
            id="badge-filter-unlocked"
            onClick={() => setFilter('unlocked')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'unlocked'
                ? 'bg-[#2A2146] text-white shadow-xs'
                : 'text-[#5B4F73] hover:text-[#2A2146]'
            }`}
          >
            <span>🏆 Unlocked</span>
            <span>({earnedCount})</span>
          </button>
          <button
            type="button"
            id="badge-filter-locked"
            onClick={() => setFilter('locked')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'locked'
                ? 'bg-[#2A2146] text-white shadow-xs'
                : 'text-[#5B4F73] hover:text-[#2A2146]'
            }`}
          >
            <span>⏳ In Progress</span>
            <span>({totalCount - earnedCount})</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'streak', label: '🌿 Streaks' },
            { id: 'reflection', label: '✍️ Reflections' },
            { id: 'faith', label: '✦ Faith' },
            { id: 'grace', label: '👑 Grace' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-white border-[#2A2146] text-[#2A2146] shadow-2xs font-bold'
                  : 'bg-[#FAF8FC] border-gray-200 text-[#705E8C] hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBadges.map((badge) => {
          const isUnlocked = badge.earned;
          const curr = badge.currentProgress ?? (badge.earned ? 1 : 0);
          const targ = badge.targetProgress ?? 1;
          const progressPercent = Math.min(
            100,
            Math.round((curr / Math.max(1, targ)) * 100)
          );

          return (
            <div
              key={badge.id}
              id={`badge-card-${badge.id}`}
              className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                isUnlocked
                  ? 'bg-white hover:shadow-md border-amber-200/90'
                  : 'bg-[#FAF8FC]/80 border-gray-200/90 opacity-90'
              }`}
              style={{
                borderColor: isUnlocked ? badge.tierColor || '#E3B15E' : undefined,
              }}
            >
              {/* Subtle Ambient Background for Unlocked Badges */}
              {isUnlocked && (
                <div
                  className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10 pointer-events-none blur-xl"
                  style={{ backgroundColor: badge.tierColor || '#E3B15E' }}
                />
              )}

              <div>
                {/* Badge Top Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-105 ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-[#2D234F] to-[#17132B] text-white'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                      style={{
                        borderColor: isUnlocked ? badge.tierColor || '#E3B15E' : '#D1D5DB',
                      }}
                    >
                      <span>{badge.icon}</span>
                    </div>

                    {isUnlocked && (
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-2xs"
                        style={{ backgroundColor: badge.tierColor || '#E3B15E' }}
                      >
                        ✦
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        isUnlocked
                          ? 'bg-[#FAF5E6] text-[#785E1B] border-[#E8CB72]'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {badge.tierLabel || badge.tier}
                    </span>
                    <span className="block text-[11px] font-bold text-[#8A671A] mt-1">
                      +{badge.rewardPoints} pts
                    </span>
                  </div>
                </div>

                {/* Badge Details */}
                <div>
                  <h4 className="text-base font-bold text-[#1E1931] font-serif group-hover:text-[#2E204A]">
                    {badge.title}
                  </h4>
                  {badge.subtitle && (
                    <p className="text-[11px] font-semibold text-[#1FB6B0] mt-0.5">
                      {badge.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-[#6B5F84] mt-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Scripture Anchor Snippet */}
                {badge.scriptureRef && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#FAF8FC] border border-[#ECE7F4] text-[11px] text-[#4A3C63]">
                    <span className="font-bold text-[#1FB6B0] mr-1">Anchor:</span>
                    <span className="italic font-serif">“{badge.scripture}”</span>
                    <span className="block text-[10px] font-mono text-[#8B7E9F] mt-0.5">
                      — {badge.scriptureRef}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress and Actions */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] font-semibold text-[#705E8C] mb-1">
                    <span>
                      {isUnlocked ? '✓ Milestone Completed' : 'Progress to Unlock'}
                    </span>
                    <span>
                      {badge.currentProgress} / {badge.targetProgress} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked
                          ? 'bg-gradient-to-r from-[#1FB6B0] to-[#E3B15E]'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <button
                      type="button"
                      id={`inspect-celebrate-btn-${badge.id}`}
                      onClick={() => onTriggerBadgeCelebration(badge)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#2B2147] to-[#1E1735] hover:opacity-95 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🏆</span>
                      <span>Inspect & Celebrate</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <button
                        type="button"
                        id={`inspect-locked-btn-${badge.id}`}
                        onClick={() => onTriggerBadgeCelebration(badge)}
                        className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#473C63] text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>🔒</span>
                        <span>View Details</span>
                      </button>

                      {onUnlockBadgeDirectly && (
                        <button
                          type="button"
                          id={`test-unlock-btn-${badge.id}`}
                          onClick={() => onUnlockBadgeDirectly(badge.id)}
                          className="py-2 px-3 rounded-xl bg-[#1FB6B0]/15 hover:bg-[#1FB6B0]/25 text-[#0A6460] text-xs font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                          title="Instantly unlock this badge and trigger celebratory animation"
                        >
                          <span>⚡</span>
                          <span>Unlock</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
