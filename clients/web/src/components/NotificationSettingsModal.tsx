'use client';

import React, { useState, useRef } from 'react';
import {
  Bell,
  Clock,
  Check,
  X,
  HandsPraying,
} from '@phosphor-icons/react';
import type { MoodItem } from './ProgressScreen';
import { MOODS } from './ProgressScreen';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // "HH:MM" 24h format (e.g. "08:30", "20:00")
  label: string; // e.g. "Morning Abiding Reflection"
  soundEnabled: boolean;
  preset: 'morning' | 'midday' | 'evening' | 'bedtime' | 'custom';
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  time: '20:30', // 8:30 PM evening check-in
  label: 'Evening Soul Reflection',
  soundEnabled: true,
  preset: 'evening',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
};

const PRESETS: Array<{
  id: NotificationSettings['preset'];
  title: string;
  time: string;
  emoji: string;
  tag: string;
  defaultLabel: string;
}> = [
  {
    id: 'morning',
    title: 'Morning Stillness',
    time: '07:30',
    emoji: '🌅',
    tag: 'Dawn Abiding',
    defaultLabel: 'Morning Stillness & Scripture',
  },
  {
    id: 'midday',
    title: 'Midday Breath',
    time: '12:30',
    emoji: '☀️',
    tag: 'Noon Recenter',
    defaultLabel: 'Midday Breath Prayer & Posture',
  },
  {
    id: 'evening',
    title: 'Evening Gratitude',
    time: '20:30',
    emoji: '🌙',
    tag: 'Dusk Thanksgiving',
    defaultLabel: 'Evening Soul Reflection & Gratitude',
  },
  {
    id: 'bedtime',
    title: 'Night Sabbath Rest',
    time: '22:00',
    emoji: '🕯️',
    tag: 'Peaceful Slumber',
    defaultLabel: 'Bedtime Surrender & Peace',
  },
  {
    id: 'custom',
    title: 'Custom Rhythm',
    time: '19:00',
    emoji: '⏰',
    tag: 'Personalized',
    defaultLabel: 'Daily Soul Check-In',
  },
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'S', name: 'Sun' },
  { id: 1, label: 'M', name: 'Mon' },
  { id: 2, label: 'T', name: 'Tue' },
  { id: 3, label: 'W', name: 'Wed' },
  { id: 4, label: 'T', name: 'Thu' },
  { id: 5, label: 'F', name: 'Fri' },
  { id: 6, label: 'S', name: 'Sat' },
];

export interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSaveSettings: (newSettings: NotificationSettings) => void;
  onStartMoodCheckIn: (moodId?: MoodItem['id']) => void;
  todayHasMoodLogged: boolean;
  todayMood?: MoodItem['id'] | null;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onStartMoodCheckIn,
  todayHasMoodLogged,
  todayMood,
}: NotificationSettingsModalProps) {
  // Key state initialized from props
  const [prevSettings, setPrevSettings] = useState<NotificationSettings>(settings);
  const [draft, setDraft] = useState<NotificationSettings>(settings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    if (typeof window !== 'undefined' && !('Notification' in window)) {
      return 'unsupported';
    }
    return 'default';
  });
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync draft during render when incoming settings prop changes
  if (prevSettings !== settings) {
    setPrevSettings(settings);
    setDraft(settings);
  }

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
      } catch (err) {
        console.error('Notification permission request error:', err);
      }
    }
  };

  const playGentleChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz transformation chime
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.95);
    } catch {
      // Audio playback fails gracefully
    }
  };

  const handleTriggerTestNotification = () => {
    if (draft.soundEnabled) {
      playGentleChime();
    }

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification('LifeBook: Daily Soul Check-In 🕊️', {
          body: `Time for your ${draft.label || 'Daily Check-in'}. Pause, breathe, and record your heart posture with God.`,
          icon: '/favicon.ico',
          tag: 'lifebook-daily-checkin',
        });
        notif.onclick = () => {
          window.focus();
          onStartMoodCheckIn();
        };
      } catch {
        // Fallback banner handles it
      }
    }
  };

  const handleToggleDay = (dayId: number) => {
    setDraft((prev) => {
      const exists = prev.daysOfWeek.includes(dayId);
      let updated: number[];
      if (exists) {
        if (prev.daysOfWeek.length === 1) return prev; // At least 1 day required
        updated = prev.daysOfWeek.filter((d) => d !== dayId);
      } else {
        updated = [...prev.daysOfWeek, dayId].sort();
      }
      return { ...prev, daysOfWeek: updated };
    });
  };

  const handleApplyPreset = (preset: typeof PRESETS[number]) => {
    setDraft((prev) => ({
      ...prev,
      preset: preset.id,
      time: preset.time,
      label: preset.defaultLabel,
    }));
  };

  const handleSave = () => {
    onSaveSettings(draft);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 600);
  };

  // Convert 24h to 12h readable string (e.g., "20:30" -> "8:30 PM")
  const formatTime12h = (time24: string) => {
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return time24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' : ''}${m} ${ampm}`;
  };

  return (
    <div
      id="notification-settings-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-3xl bg-white text-[#1E1931] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#21193D] via-[#2D2350] to-[#123942] p-6 text-white relative">
          <button
            type="button"
            id="notification-settings-close-btn"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close notification settings"
          >
            <X weight="bold" className="w-4 h-4 text-white" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1FB6B0]/20 border border-[#1FB6B0]/40 text-[#37C6C2] text-[11px] font-extrabold uppercase tracking-widest">
            <Clock weight="bold" className="w-3.5 h-3.5" />
            <span>Rhythm Settings</span>
          </div>

          <h3 id="notification-settings-title" className="text-2xl font-serif font-bold text-white mt-2">
            Daily Check-In Reminder
          </h3>
          <p className="text-xs text-[#C8BFDC] mt-1 max-w-md">
            Anchor your daily mood and heart check-in at a recurring time to cultivate consistent spiritual data and unbroken streaks.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Main Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F6FC] border border-[#E5DEEE]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#2A2146] text-white flex items-center justify-center text-xl shadow-xs">
                <Bell weight="fill" className="w-5 h-5 text-[#37C6C2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E1835]">
                  Daily Notification Alert
                </h4>
                <p className="text-xs text-[#6E6386]">
                  {draft.enabled
                    ? `Active daily at ${formatTime12h(draft.time)}`
                    : 'Reminders currently paused'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="notification-enabled-toggle"
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1FB6B0]"></div>
            </label>
          </div>

          {/* Section 2: Preset Sacred Moments */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5D5275] mb-2.5">
              Quick Rhythm Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.filter((p) => p.id !== 'custom').map((p) => {
                const isSelected = draft.time === p.time;
                return (
                  <button
                    key={p.id}
                    id={`notification-preset-${p.id}`}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[82px] active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1FB6B0]/15 border-[#1FB6B0] text-[#0A5F5B] ring-2 ring-[#1FB6B0]/40'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-[10px] font-mono font-bold text-[#867B9E]">
                        {formatTime12h(p.time)}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{p.title}</div>
                      <div className="text-[10px] text-gray-400">{p.tag}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Time & Label Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="notification-time-picker"
                className="block text-xs font-bold uppercase tracking-wider text-[#5D5275] mb-1.5"
              >
                Notification Time
              </label>
              <div className="relative">
                <input
                  id="notification-time-picker"
                  type="time"
                  value={draft.time}
                  onChange={(e) => setDraft({ ...draft, time: e.target.value, preset: 'custom' })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-[#1E1931] bg-[#FAF9FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1FB6B0]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7C6F95] pointer-events-none">
                  {formatTime12h(draft.time)}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="notification-label-input"
                className="block text-xs font-bold uppercase tracking-wider text-[#5D5275] mb-1.5"
              >
                Reminder Label
              </label>
              <input
                id="notification-label-input"
                type="text"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="e.g. Evening Reflection & Check-In"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1E1931] bg-[#FAF9FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1FB6B0]"
              />
            </div>
          </div>

          {/* Section 4: Days of Week Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5D5275]">
                Active Reminder Days
              </label>
              <span className="text-[11px] text-[#7E7395]">
                {draft.daysOfWeek.length === 7 ? 'Every day' : `${draft.daysOfWeek.length} days / week`}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = draft.daysOfWeek.includes(d.id);
                return (
                  <button
                    key={d.id}
                    id={`notification-day-${d.id}`}
                    type="button"
                    onClick={() => handleToggleDay(d.id)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#2A2146] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={d.name}
                  >
                    <div>{d.label}</div>
                    <div className="text-[9px] opacity-75">{d.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Audio Chime & Browser Permissions */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔔</span>
                <div>
                  <span className="text-xs font-bold text-gray-800">
                    Sacred Chime Sound
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Play a gentle, meditative 528 Hz bell chime with the reminder
                  </p>
                </div>
              </div>
              <input
                id="notification-sound-toggle"
                type="checkbox"
                checked={draft.soundEnabled}
                onChange={(e) => setDraft({ ...draft, soundEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#1FB6B0] focus:ring-[#1FB6B0] border-gray-300 cursor-pointer"
              />
            </div>

            {/* Browser permission status card */}
            <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Browser Permissions:</span>
                {permissionStatus === 'granted' ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    ✓ Granted
                  </span>
                ) : permissionStatus === 'denied' ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                    ✕ Blocked in Browser
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                    • Permission Needed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                  <button
                    type="button"
                    id="notification-grant-permission-btn"
                    onClick={handleRequestPermission}
                    className="px-3 py-1 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-[#1E1931] font-bold text-xs cursor-pointer"
                  >
                    Enable Browser Alerts
                  </button>
                )}
                <button
                  type="button"
                  id="notification-test-chime-btn"
                  onClick={handleTriggerTestNotification}
                  className="px-3 py-1 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-[#1E1931] font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>🔔</span>
                  <span>Test Alert</span>
                </button>
              </div>
            </div>

            {testNotificationSent && (
              <div
                id="test-notification-feedback"
                className="p-3 rounded-xl bg-[#E8F8F7] border border-[#7BD7D2] text-[#0A635F] text-xs font-medium flex items-center justify-between animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <span>Reminder sent: “{draft.label}” at {formatTime12h(draft.time)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartMoodCheckIn();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1FB6B0] hover:bg-[#189b96] text-white font-bold text-[11px] cursor-pointer"
                >
                  Check In Now →
                </button>
              </div>
            )}
          </div>

          {/* Section 6: Direct Link to Today's Mood Check-in Flow */}
          <div
            id="notification-direct-checkin-card"
            className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF8FC] via-[#F4F1FA] to-[#EDFAF9] border border-[#D5CAE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1FB6B0]">
                  Immediate Data Flow
                </span>
                {todayHasMoodLogged && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    ✓ Logged for today
                  </span>
                )}
              </div>
              <h5 className="text-sm font-bold text-[#1E1835] mt-0.5">
                Ready for today’s heart posture?
              </h5>
              <p className="text-xs text-[#6B5F84]">
                {todayHasMoodLogged
                  ? `Current mood recorded: ${todayMood ? todayMood.toUpperCase() : 'Logged'}. You can update it anytime.`
                  : 'Take 30 seconds to record your primary spiritual mood and preserve your streak.'}
              </p>
            </div>

            {/* Quick Mood Selection triggers directly */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  id={`notification-quick-mood-${m.id}`}
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartMoodCheckIn(m.id);
                  }}
                  title={`Log ${m.label} today`}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-base flex items-center justify-center transition-all shadow-2xs hover:scale-110 active:scale-95 cursor-pointer"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            id="notification-modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-bold text-[#554C6D] transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="notification-modal-jump-checkin-btn"
              onClick={() => {
                handleSave();
                onStartMoodCheckIn();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#2A2146] hover:bg-[#1E1835] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <HandsPraying weight="fill" className="w-4 h-4 text-[#37C6C2]" />
              <span>Save & Check In Now</span>
            </button>

            <button
              type="button"
              id="notification-modal-save-btn"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#1FB6B0] hover:bg-[#189b96] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {saveToast ? (
                <>
                  <Check weight="bold" className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check weight="bold" className="w-4 h-4 text-white" />
                  <span>Save Reminder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
