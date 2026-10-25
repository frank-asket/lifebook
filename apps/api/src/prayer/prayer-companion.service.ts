import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BibleContentService } from '../bible-content/bible-content.service';

type Locale = 'en' | 'fr';
type Localized = Record<Locale, string>;
type PassageRef = string | { id: string; fr?: string };
/** Keywords are lower-case words without accents ("inquiet"), or phrases ("loin de dieu"); a trailing * also matches longer words ("worr*"). */
export type CompanionTopic = { id: string; title: Localized; description: Localized; prompt: Localized; keywords: Record<Locale, string[]>; passages: PassageRef[] };
export type CompanionLibrary = { version: number; status: 'draft' | 'reviewed'; review: { reviewedBy: string | null; reviewedOn: string | null }; fallbackTopic: string; topics: CompanionTopic[] };

const keywordPattern = /^[a-z0-9]+(?: [a-z0-9]+)*\*?$/;
const passagePattern = /^[1-4A-Z][A-Z0-9]{2}\.[1-9][0-9]{0,2}\.[1-9][0-9]{0,2}(?:-[1-9][0-9]{0,2})?$/;
const CACHE_MS = 6 * 60 * 60 * 1000, CACHE_MAX = 500;

/** Throws on any malformed entry so a bad content change fails at startup and in tests, not in front of a reader. */
export function validateLibrary(value: unknown): CompanionLibrary {
  const lib = value as CompanionLibrary;
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const localized = (v: unknown) => !!v && text((v as Localized).en) && text((v as Localized).fr);
  if (!lib || lib.version !== 1 || !['draft', 'reviewed'].includes(lib.status) || !Array.isArray(lib.topics) || !lib.topics.length) throw new Error('Invalid prayer topic library');
  if (lib.status === 'reviewed' && (!text(lib.review?.reviewedBy) || !text(lib.review?.reviewedOn))) throw new Error('A reviewed library must name its reviewer and date');
  const ids = new Set<string>();
  for (const topic of lib.topics) {
    if (!/^[a-z][a-z0-9-]{1,39}$/.test(topic.id) || ids.has(topic.id)) throw new Error(`Invalid or duplicate topic id: ${topic.id}`);
    ids.add(topic.id);
    if (!localized(topic.title) || !localized(topic.description) || !localized(topic.prompt)) throw new Error(`Topic ${topic.id} needs English and French text`);
    for (const locale of ['en', 'fr'] as const) {
      const words = topic.keywords?.[locale];
      if (!Array.isArray(words) || words.length < 3 || !words.every(w => typeof w === 'string' && keywordPattern.test(w))) throw new Error(`Topic ${topic.id} needs at least 3 ${locale} keywords in lower case without accents`);
    }
    if (!Array.isArray(topic.passages) || topic.passages.length < 3 || topic.passages.length > 8) throw new Error(`Topic ${topic.id} needs 3 to 8 passages`);
    for (const ref of topic.passages) {
      const id = typeof ref === 'string' ? ref : ref?.id;
      const fr = typeof ref === 'string' ? undefined : ref?.fr;
      if (!passagePattern.test(id ?? '') || (fr !== undefined && !passagePattern.test(fr))) throw new Error(`Topic ${topic.id} has an invalid passage: ${JSON.stringify(ref)}`);
    }
  }
  if (!ids.has(lib.fallbackTopic)) throw new Error('fallbackTopic must name a topic');
  return lib;
}

/** Lower case, accents and punctuation removed, so "Inquiète" matches "inquiet" and "l’avenir" matches "avenir". */
export function foldText(text: string): string {
  return ` ${text.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

/** The topic whose keywords appear most often in the prayer (ties go to the earlier topic), or the fallback topic. */
export function matchTopic(library: CompanionLibrary, text: string, locale: Locale): { topic: CompanionTopic; matched: boolean } {
  const folded = foldText(text);
  let best: { topic: CompanionTopic; score: number } | null = null;
  for (const topic of library.topics) {
    // Prayers are often written in the other language than the app's, so both keyword lists count.
    const words = [...topic.keywords[locale], ...topic.keywords[locale === 'fr' ? 'en' : 'fr']];
    const score = new Set(words.filter(w => w.endsWith('*') ? folded.includes(` ${w.slice(0, -1)}`) : folded.includes(` ${w} `))).size;
    if (score > 0 && (!best || score > best.score)) best = { topic, score };
  }
  return best ? { topic: best.topic, matched: true } : { topic: library.topics.find(t => t.id === library.fallbackTopic)!, matched: false };
}

@Injectable()
export class PrayerCompanionService {
  private readonly library = validateLibrary(JSON.parse(readFileSync(join(__dirname, '../../content/prayer-topics.json'), 'utf8')));
  private readonly cache = new Map<string, { expires: number; value: Awaited<ReturnType<BibleContentService['passage']>> }>();
  constructor(private readonly bible: BibleContentService) {}

  // Unreviewed content is only served where an operator has explicitly allowed it (staging).
  private ensureAvailable() {
    if (!this.available()) throw new ServiceUnavailableException('Scripture companion is not available yet');
  }
  private locale(value?: string): Locale { return value === 'fr' ? 'fr' : 'en'; }
  private async passage(locale: Locale, id: string) {
    const key = `${locale}:${id}`;
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    const value = await this.bible.passage(locale, id);
    if (this.cache.size >= CACHE_MAX) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, { expires: Date.now() + CACHE_MS, value });
    return value;
  }

  /** False while the library awaits review, except where drafts are allowed (staging). */
  available() { return this.library.status === 'reviewed' || process.env.PRAYER_COMPANION_ALLOW_DRAFT === 'true'; }
  /** The keyword match for a prayer, and one of its topic's passages chosen by `seed` so the same prayer keeps the same verse. */
  keywordPick(text: string, locale: Locale, seed: string): { topicId: string; passageId: string; matched: boolean } {
    this.ensureAvailable();
    const { topic, matched } = matchTopic(this.library, text, locale);
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const ref = topic.passages[hash % topic.passages.length];
    return { topicId: topic.id, passageId: typeof ref === 'string' ? ref : ref.id, matched };
  }
  topicOf(passageId: string) { return this.library.topics.find(t => t.passages.some(p => (typeof p === 'string' ? p : p.id) === passageId))?.id ?? null; }
  topicTitle(id: string, locale: Locale) { return this.library.topics.find(t => t.id === id)?.title[locale] ?? null; }
  /** For guided meditation: the reviewed themes and their passage ids (English ids; French overrides applied later). */
  candidates() {
    this.ensureAvailable();
    return this.library.topics.map(t => ({ id: t.id, title: t.title.en, description: t.description.en, passages: t.passages.map(p => typeof p === 'string' ? p : p.id) }));
  }
  /** Verified text for library passage ids, in the reader's translation. Unknown ids are rejected. */
  async resolve(localeInput: string | undefined, ids: string[]) {
    this.ensureAvailable();
    const locale = this.locale(localeInput);
    const refs = new Map(this.library.topics.flatMap(t => t.passages).map(p => typeof p === 'string' ? [p, p] as const : [p.id, locale === 'fr' && p.fr ? p.fr : p.id] as const));
    return Promise.all(ids.map(async id => {
      const target = refs.get(id);
      if (!target) throw new Error(`Passage ${id} is not in the reviewed library`);
      const passage = await this.passage(locale, target);
      return { id: target, reference: passage.reference, text: passage.text, copyright: passage.copyright };
    }));
  }

  topics(localeInput?: string) {
    this.ensureAvailable();
    const locale = this.locale(localeInput);
    return {
      reviewed: this.library.status === 'reviewed',
      topics: this.library.topics.map(t => ({ id: t.id, title: t.title[locale], description: t.description[locale] })),
    };
  }

  async topic(id: string, localeInput?: string) {
    this.ensureAvailable();
    const locale = this.locale(localeInput);
    const topic = this.library.topics.find(t => t.id === id);
    if (!topic) throw new NotFoundException('Topic not found');
    const ids = topic.passages.map(ref => typeof ref === 'string' ? ref : locale === 'fr' && ref.fr ? ref.fr : ref.id);
    const results = await Promise.allSettled(ids.map(passageId => this.passage(locale, passageId)));
    const passages = results.flatMap((result, i) => result.status === 'fulfilled'
      ? [{ id: ids[i], reference: result.value.reference, text: result.value.text, copyright: result.value.copyright }] : []);
    if (!passages.length) throw new ServiceUnavailableException('Scripture provider temporarily unavailable');
    return {
      id: topic.id, title: topic.title[locale], description: topic.description[locale], prompt: topic.prompt[locale],
      reviewed: this.library.status === 'reviewed', passages, unavailable: ids.length - passages.length,
    };
  }
}
