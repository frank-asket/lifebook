import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalyticsEvent = {
  name: string;
  screen?: string;
  metadata?: Record<string, string | number | boolean>;
  at: string;
};

const STORAGE_KEY = 'lifebook.events.v1';
const MAX_EVENTS = 500;

let buffer: AnalyticsEvent[] = [];
let loaded = false;

async function load() {
  if (loaded) return;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  buffer = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  loaded = true;
}

/** Local-only event log: screen views and guided-flow step completion, the gap named in the TRD. */
export async function track(
  name: string,
  screen?: string,
  metadata?: AnalyticsEvent['metadata'],
): Promise<void> {
  await load();
  buffer = [...buffer, { name, screen, metadata, at: new Date().toISOString() }].slice(-MAX_EVENTS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
}

export async function readEvents(): Promise<AnalyticsEvent[]> {
  await load();
  return [...buffer].reverse();
}

export async function clearEvents(): Promise<void> {
  buffer = [];
  loaded = true;
  await AsyncStorage.removeItem(STORAGE_KEY);
}
