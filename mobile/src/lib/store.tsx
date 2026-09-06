import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { journeys, type MoodId } from '@/lib/content';
import { moderate } from '@/lib/moderation';

const STORAGE_KEY = 'lifebook.state.v1';

export type Profile = {
  displayName: string;
  spiritualPath: string;
  dailyHabits: string[];
  notificationTime: string;
  preferredMoods: MoodId[];
  groupId: string | null;
  onboardingCompletedAt: string | null;
};

export type Checkin = {
  id: string;
  mood: MoodId;
  note: string | null;
  verseReference: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  text: string;
  mood: MoodId;
  verseReference: string;
  createdAt: string;
  favorite: boolean;
};

export type JourneyProgress = {
  journeyId: string;
  currentDay: number;
  completedDays: number[];
  startedAt: string;
  completedAt: string | null;
};

export type CommunityPost = {
  id: string;
  kind: 'prayer' | 'discussion';
  groupId: string;
  author: string;
  text: string;
  createdAt: string;
  supportNote: string | null;
  prayerCount: number;
};

export type BookState = { progress: number; bookmarked: boolean };

export type Streak = {
  current: number;
  longest: number;
  lastCompletedOn: string | null;
};

export type AppState = {
  profile: Profile;
  checkins: Checkin[];
  journal: JournalEntry[];
  journeyProgress: JourneyProgress[];
  posts: CommunityPost[];
  books: Record<string, BookState>;
  streak: Streak;
};

export const groups = [
  { id: 'first-steps', name: 'First Steps', blurb: 'New or returning, no assumed vocabulary.' },
  { id: 'quiet-mornings', name: 'Quiet Mornings', blurb: 'Early risers keeping a short daily practice.' },
  { id: 'honest-questions', name: 'Honest Questions', blurb: 'Doubt welcome, answers not required.' },
];

const seededPosts: CommunityPost[] = [
  {
    id: 'seed-1',
    kind: 'prayer',
    groupId: 'first-steps',
    author: 'Ada',
    text: 'Starting a new job Monday after eight months out of work. Grateful and terrified in equal measure.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    supportNote: null,
    prayerCount: 12,
  },
  {
    id: 'seed-2',
    kind: 'discussion',
    groupId: 'honest-questions',
    author: 'Marcus',
    text: 'Does anyone else find the word "convicted" hard to use about themselves? I know what it means, I just would never say it.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    supportNote: null,
    prayerCount: 0,
  },
  {
    id: 'seed-3',
    kind: 'prayer',
    groupId: 'quiet-mornings',
    author: 'Ruth',
    text: 'Three weeks of getting up early to do this before the house wakes. It is working. Pray it holds.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    supportNote: null,
    prayerCount: 7,
  },
];

const emptyState: AppState = {
  profile: {
    displayName: '',
    spiritualPath: '',
    dailyHabits: [],
    notificationTime: '07:30',
    preferredMoods: [],
    groupId: null,
    onboardingCompletedAt: null,
  },
  checkins: [],
  journal: [],
  journeyProgress: [],
  posts: seededPosts,
  books: {},
  streak: { current: 0, longest: 0, lastCompletedOn: null },
};

export type Badge = { id: string; label: string; detail: string; earned: boolean };

export function computeBadges(state: AppState): Badge[] {
  const completedJourneys = state.journeyProgress.filter((entry) => entry.completedAt).length;
  return [
    {
      id: 'first-check-in',
      label: 'First step',
      detail: 'Completed one guided flow',
      earned: state.checkins.length >= 1,
    },
    {
      id: 'three-day',
      label: 'Three days',
      detail: 'A three-day streak',
      earned: state.streak.longest >= 3,
    },
    {
      id: 'seven-day',
      label: 'Seven days',
      detail: 'A seven-day streak',
      earned: state.streak.longest >= 7,
    },
    {
      id: 'reflector',
      label: 'Reflector',
      detail: 'Five saved reflections',
      earned: state.journal.length >= 5,
    },
    {
      id: 'journey-done',
      label: 'Journey finished',
      detail: 'Completed a five-day journey',
      earned: completedJourneys >= 1,
    },
  ];
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextStreak(streak: Streak): Streak {
  const today = dayKey(new Date());
  if (streak.lastCompletedOn === today) return streak;

  const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const current = streak.lastCompletedOn === yesterday ? streak.current + 1 : 1;
  return {
    current,
    longest: Math.max(current, streak.longest),
    lastCompletedOn: today,
  };
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type CompleteFlowInput = {
  mood: MoodId;
  note: string | null;
  verseReference: string;
  reflection: string | null;
  journeyId?: string;
};

type Store = {
  state: AppState;
  hydrated: boolean;
  completeOnboarding: (profile: Omit<Profile, 'onboardingCompletedAt'>) => void;
  completeFlow: (input: CompleteFlowInput) => void;
  toggleFavorite: (entryId: string) => void;
  startJourney: (journeyId: string) => void;
  addPost: (input: { kind: CommunityPost['kind']; groupId: string; text: string }) =>
    | { ok: true }
    | { ok: false; reason: string };
  prayFor: (postId: string) => void;
  joinGroup: (groupId: string | null) => void;
  setBookState: (bookId: string, next: Partial<BookState>) => void;
  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...emptyState, ...(JSON.parse(raw) as AppState) });
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const completeOnboarding = useCallback((profile: Omit<Profile, 'onboardingCompletedAt'>) => {
    setState((previous) => ({
      ...previous,
      profile: { ...profile, onboardingCompletedAt: new Date().toISOString() },
    }));
  }, []);

  const completeFlow = useCallback((input: CompleteFlowInput) => {
    setState((previous) => {
      const now = new Date().toISOString();
      const checkin: Checkin = {
        id: id(),
        mood: input.mood,
        note: input.note,
        verseReference: input.verseReference,
        createdAt: now,
      };
      const journal = input.reflection?.trim()
        ? [
            {
              id: id(),
              text: input.reflection.trim(),
              mood: input.mood,
              verseReference: input.verseReference,
              createdAt: now,
              favorite: false,
            },
            ...previous.journal,
          ]
        : previous.journal;

      const journeyProgress = input.journeyId
        ? previous.journeyProgress.map((entry) => {
            if (entry.journeyId !== input.journeyId || entry.completedAt) return entry;
            const journey = journeys.find((item) => item.id === entry.journeyId);
            const totalDays = journey?.days.length ?? 5;
            const completedDays = entry.completedDays.includes(entry.currentDay)
              ? entry.completedDays
              : [...entry.completedDays, entry.currentDay];
            const finished = completedDays.length >= totalDays;
            return {
              ...entry,
              completedDays,
              currentDay: finished ? entry.currentDay : Math.min(entry.currentDay + 1, totalDays),
              completedAt: finished ? now : null,
            };
          })
        : previous.journeyProgress;

      return {
        ...previous,
        checkins: [checkin, ...previous.checkins],
        journal,
        journeyProgress,
        streak: nextStreak(previous.streak),
      };
    });
  }, []);

  const toggleFavorite = useCallback((entryId: string) => {
    setState((previous) => ({
      ...previous,
      journal: previous.journal.map((entry) =>
        entry.id === entryId ? { ...entry, favorite: !entry.favorite } : entry,
      ),
    }));
  }, []);

  const startJourney = useCallback((journeyId: string) => {
    setState((previous) => {
      if (previous.journeyProgress.some((entry) => entry.journeyId === journeyId && !entry.completedAt)) {
        return previous;
      }
      return {
        ...previous,
        journeyProgress: [
          ...previous.journeyProgress.filter((entry) => entry.journeyId !== journeyId),
          {
            journeyId,
            currentDay: 1,
            completedDays: [],
            startedAt: new Date().toISOString(),
            completedAt: null,
          },
        ],
      };
    });
  }, []);

  const addPost = useCallback<Store['addPost']>(
    (input) => {
      const result = moderate(input.text);
      if (result.verdict === 'rejected') return { ok: false, reason: result.reason };

      setState((previous) => ({
        ...previous,
        posts: [
          {
            id: id(),
            kind: input.kind,
            groupId: input.groupId,
            author: previous.profile.displayName || 'You',
            text: input.text.trim(),
            createdAt: new Date().toISOString(),
            supportNote: 'flagged' in result ? result.supportNote : null,
            prayerCount: 0,
          },
          ...previous.posts,
        ],
      }));
      return { ok: true };
    },
    [],
  );

  const prayFor = useCallback((postId: string) => {
    setState((previous) => ({
      ...previous,
      posts: previous.posts.map((post) =>
        post.id === postId ? { ...post, prayerCount: post.prayerCount + 1 } : post,
      ),
    }));
  }, []);

  const joinGroup = useCallback((groupId: string | null) => {
    setState((previous) => ({ ...previous, profile: { ...previous.profile, groupId } }));
  }, []);

  const setBookState = useCallback((bookId: string, next: Partial<BookState>) => {
    setState((previous) => {
      const current = previous.books[bookId] ?? { progress: 0, bookmarked: false };
      return { ...previous, books: { ...previous.books, [bookId]: { ...current, ...next } } };
    });
  }, []);

  const resetAll = useCallback(() => setState(emptyState), []);

  const value = useMemo<Store>(
    () => ({
      state,
      hydrated,
      completeOnboarding,
      completeFlow,
      toggleFavorite,
      startJourney,
      addPost,
      prayFor,
      joinGroup,
      setBookState,
      resetAll,
    }),
    [
      state,
      hydrated,
      completeOnboarding,
      completeFlow,
      toggleFavorite,
      startJourney,
      addPost,
      prayFor,
      joinGroup,
      setBookState,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside AppProvider');
  return store;
}

export function recommendJourney(state: AppState) {
  const active = state.journeyProgress.find((entry) => !entry.completedAt);
  if (active) {
    const journey = journeys.find((item) => item.id === active.journeyId);
    if (journey) return { journey, progress: active, reason: null as string | null };
  }

  const recentMoods = state.checkins.slice(0, 5).map((checkin) => checkin.mood);
  const scored = journeys
    .map((journey) => ({
      journey,
      score: recentMoods.filter((mood) => journey.recommendedMoods.includes(mood)).length,
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const reason =
    top.score > 0
      ? `You have checked in ${top.journey.recommendedMoods.join(' or ')} ${top.score} of your last ${recentMoods.length} days.`
      : 'A good place to start — five short days, one per sitting.';

  return { journey: top.journey, progress: null, reason };
}
