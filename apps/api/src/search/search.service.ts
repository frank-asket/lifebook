import { database } from '../common/database';
import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { BibleContentService } from '../bible-content/bible-content.service';
import { READING_PLANS } from '../bible-reading/bible-reading.service';
import { approvedTeachings } from '../livingword/livingword.service';
import { parseReference, rank } from './search-rank';

export type SearchItem = { id: string; title: string; subtitle: string | null; href: string };
export type SearchSection = { kind: 'scripture' | 'plans' | 'studies' | 'pathways' | 'teachings' | 'meditations'; status: 'ok' | 'unavailable'; items: SearchItem[] };

const PER_SECTION = 5;
/** Published catalogues are small; this bounds the work if they grow. */
const CANDIDATES = 500;

/**
 * One search box for everything public: a passage reference, Scripture words, reading plans, studies,
 * pathways, teachings and meditations. Never searches anyone's private writing. Each section fails on its own.
 */
@Injectable()
export class SearchService implements OnModuleDestroy {
  private readonly db = database;
  constructor(private readonly bible: BibleContentService) {}
  async onModuleDestroy() { /* The root Database provider owns the shared pool lifecycle. */ }

  async search(qInput?: string, localeInput?: string) {
    if (typeof qInput !== 'string' || qInput.trim().length < 2 || qInput.length > 120) throw new BadRequestException('Search needs 2 to 120 characters');
    const q = qInput.trim();
    const locale: 'en' | 'fr' = localeInput === 'fr' ? 'fr' : 'en';
    const ref = parseReference(q, locale);
    const go = ref ? { label: ref.label, href: `/bible/read?locale=${locale}&chapter=${ref.chapterId}${ref.verse ? `&verse=${ref.verse}${ref.verseEnd ? `-${ref.verseEnd}` : ''}` : ''}` } : null;
    const section = async (kind: SearchSection['kind'], load: () => Promise<SearchItem[]>): Promise<SearchSection> => {
      try { return { kind, status: 'ok', items: await load() }; } catch { return { kind, status: 'unavailable', items: [] }; }
    };
    const sections = await Promise.all([
      // A reference already has its own "Go to" result; word search needs letters.
      ref || !/\p{L}{2}/u.test(q) ? Promise.resolve<SearchSection>({ kind: 'scripture', status: 'ok', items: [] }) : section('scripture', async () => {
        const found = await this.bible.search(locale, q, '0', 'relevance');
        return found.items.slice(0, PER_SECTION).map(v => ({ id: v.id, title: v.reference, subtitle: null, href: `/bible/read?locale=${locale}&chapter=${v.chapterId}${v.verse ? `&verse=${v.verse}` : ''}` }));
      }),
      section('plans', async () => rank(q, [...READING_PLANS], p => ({ title: p.title[locale], description: p.description[locale] }), PER_SECTION)
        .map(p => ({ id: p.id, title: p.title[locale], subtitle: p.description[locale], href: `/bible/plans/${p.id}` }))),
      section('studies', async () => {
        const rows = await this.db.studySeries.findMany({ where: { status: 'PUBLISHED', locale }, select: { id: true, title: true, description: true }, take: CANDIDATES });
        return rank(q, rows, r => r, PER_SECTION).map(r => ({ id: r.id, title: r.title, subtitle: r.description, href: `/bible/${r.id}` }));
      }),
      section('pathways', async () => {
        const rows = await this.db.learningPath.findMany({ where: { isPublished: true }, select: { id: true, title: true, description: true }, take: CANDIDATES });
        return rank(q, rows, r => r, PER_SECTION).map(r => ({ id: r.id, title: r.title, subtitle: r.description, href: `/discipleship/${r.id}` }));
      }),
      section('teachings', async () => {
        const rows = await this.db.sermon.findMany({ where: { AND: [approvedTeachings(), { locale }] }, select: { id: true, title: true, description: true, speaker: true }, take: CANDIDATES });
        return rank(q, rows, r => ({ title: r.title, description: [r.description, r.speaker].filter(Boolean).join(' ') }), PER_SECTION)
          .map(r => ({ id: r.id, title: r.title, subtitle: r.speaker, href: `/livingword/${r.id}` }));
      }),
      section('meditations', async () => {
        const rows = await this.db.meditation.findMany({ where: { isPublished: true, locale, OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] }, select: { id: true, title: true, scriptureReference: true }, take: CANDIDATES });
        return rank(q, rows, r => ({ title: r.title, description: r.scriptureReference }), PER_SECTION).map(r => ({ id: r.id, title: r.title, subtitle: r.scriptureReference, href: `/meditation/${r.id}` }));
      }),
    ]);
    return { query: q, locale, go, sections };
  }
}
