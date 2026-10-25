import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { BIBLE_VERSIONS, LocalBible, resolveVersion, type BibleVersion, type Locale } from './bible-versions';
type BibleResponse = { data?: { id?: string; content?: string; reference?: string; copyright?: string }; meta?: { fumsToken?: string } };

const FUMS_ENDPOINT = 'https://fums.api.bible/f3';
const TOKEN = /^[A-Za-z0-9._~+/=-]{8,1024}$/;
const ID = /^[A-Za-z0-9-]{8,64}$/;

/** Only well-formed usage reports are forwarded: 1–20 tokens and two random, non-identifying IDs. */
export function validUsage(body: unknown): { tokens: string[]; deviceId: string; sessionId: string } | null {
  if (!body || typeof body !== 'object') return null;
  const { tokens, deviceId, sessionId } = body as Record<string, unknown>;
  if (!Array.isArray(tokens) || tokens.length < 1 || tokens.length > 20) return null;
  if (!tokens.every(t => typeof t === 'string' && TOKEN.test(t))) return null;
  if (typeof deviceId !== 'string' || !ID.test(deviceId) || typeof sessionId !== 'string' || !ID.test(sessionId)) return null;
  return { tokens: Array.from(new Set(tokens as string[])), deviceId, sessionId };
}

/** The FUMS v3 report URL: one `t` per token, a device ID and a session ID. No user ID is sent. */
export function usageUrl(tokens: string[], deviceId: string, sessionId: string): string {
  const query = new URLSearchParams();
  for (const t of tokens) query.append('t', t);
  query.set('dId', deviceId); query.set('sId', sessionId);
  return `${FUMS_ENDPOINT}?${query.toString()}`;
}

/**
 * Bible text is fetched server-side. No API key is sent to browsers or stored in PostgreSQL.
 * Every reading method takes an optional version (see bible-versions.ts); without one it reads the language's default.
 */
@Injectable()
export class BibleContentService {
  private readonly endpoint = 'https://rest.api.bible/v1';
  private readonly timeoutMs = 8000;
  private readonly local = new Map(BIBLE_VERSIONS.flatMap(v => v.source === 'local' ? [[v.id, new LocalBible(v.id, v.folder)] as const] : []));

  isConfigured(locale: Locale): boolean {
    return Boolean(process.env.API_BIBLE_KEY && this.bibleId(resolveVersion(locale)));
  }

  /** The API.Bible id for a version, or the local Bible that serves it. */
  private source(locale: Locale, version?: string): { local: LocalBible; bibleId?: undefined } | { local?: undefined; bibleId: string } {
    const v = resolveVersion(locale, version);
    const local = this.local.get(v.id);
    if (local) return { local };
    const bibleId = this.bibleId(v);
    if (!bibleId) throw new ServiceUnavailableException('Translation is not configured');
    return { bibleId };
  }

  private bibleId(version: BibleVersion): string | undefined {
    return version.source === 'api.bible' ? version.bibleId() : undefined;
  }

  private async request<T>(path: string): Promise<T> {
    const key = process.env.API_BIBLE_KEY;
    if (!key) throw new ServiceUnavailableException('Bible provider is not configured');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.endpoint}${path}`, {
        headers: { 'api-key': key, Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
      return await response.json() as T;
    } catch {
      throw new ServiceUnavailableException('Scripture provider temporarily unavailable');
    } finally { clearTimeout(timer); }
  }

  async search(locale: Locale, query: string, offsetInput = '0', sort: 'canonical' | 'relevance' = 'canonical', version?: string) {
    if (typeof query !== 'string' || !query.trim() || query.length > 120 || typeof offsetInput !== 'string' || !/^(0|[1-9][0-9]{0,4})$/.test(offsetInput)) throw new BadRequestException('Invalid Scripture search');
    const { local, bibleId } = this.source(locale, version);
    const offset = Number(offsetInput); const limit = 20;
    if (local) return { ...local.search(query, offset, limit), offset, limit };
    const params = new URLSearchParams({ query: query.trim(), limit: String(limit), offset: String(offset), sort, 'fums-version': '3' });
    const result = await this.request<{ data?: { total?: number; verses?: { id: string; reference: string }[]; passages?: { id: string; reference: string }[] } }>(`/bibles/${encodeURIComponent(bibleId)}/search?${params}`);
    if (!result.data) throw new ServiceUnavailableException('Scripture search unavailable');
    // Reference-only results avoid publishing provider markup or uncredited snippets.
    const items = [...(result.data.verses ?? []), ...(result.data.passages ?? [])].slice(0, limit).flatMap(item => {
      const match = /^([A-Z0-9]{3}\.[1-9][0-9]{0,2})(?:\.([1-9][0-9]{0,2}))?/.exec(item.id);
      return match && typeof item.reference === 'string' ? [{ id: item.id, reference: item.reference, chapterId: match[1], verse: match[2] ? Number(match[2]) : null }] : [];
    });
    return { items, offset, limit, total: typeof result.data.total === 'number' ? result.data.total : items.length };
  }

  async passage(locale: Locale, passageId: string, version?: string) {
    if (!/^[A-Z0-9]{3}(?:\.[0-9]+(?:\.[0-9]+(?:-[0-9]+)?)?)?$/.test(passageId)) {
      throw new BadRequestException('Invalid passage identifier');
    }
    const { local, bibleId } = this.source(locale, version);
    if (local) return { ...local.passage(passageId), translation: local.id, provider: 'LifeBook', fumsToken: null };
    // API.Bible rejects short ranges such as PHP.4.6-7; it needs PHP.4.6-PHP.4.7.
    const range = passageId.match(/^([A-Z0-9]{3}\.[0-9]+\.)([0-9]+)-([0-9]+)$/);
    const providerId = range ? `${range[1]}${range[2]}-${range[1]}${range[3]}` : passageId;
    const result = await this.request<BibleResponse>(`/bibles/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(providerId)}?content-type=text&include-notes=false&include-titles=false&fums-version=3`);
    const data = result.data;
    if (!data?.content) throw new ServiceUnavailableException('Scripture text unavailable');
    return {
      reference: data.reference || passageId,
      text: data.content.trim(),
      translation: bibleId,
      copyright: data.copyright || null,
      provider: 'API.Bible',
      fumsToken: result.meta?.fumsToken ?? null,
    };
  }

  /** Returns metadata for the requested translation. */
  async translation(locale: Locale, version?: string) {
    const { local, bibleId } = this.source(locale, version);
    if (local) return local.translation();
    return this.request(`/bibles/${encodeURIComponent(bibleId)}`);
  }

  async books(locale: Locale, version?: string) {
    const { local, bibleId } = this.source(locale, version);
    if (local) return local.books();
    return this.request(`/bibles/${encodeURIComponent(bibleId)}/books`);
  }

  async chapters(locale: Locale, bookId: string, version?: string) {
    if (!/^[A-Z0-9]{3}$/.test(bookId)) throw new BadRequestException('Invalid book');
    const { local, bibleId } = this.source(locale, version);
    if (local) return local.chapters(bookId);
    return this.request(`/bibles/${encodeURIComponent(bibleId)}/books/${bookId}/chapters`);
  }

  async chapter(locale: Locale, chapterId: string, version?: string) {
    if (!/^[A-Z0-9]{3}\.[0-9]+$/.test(chapterId)) throw new BadRequestException('Invalid chapter');
    const { local, bibleId } = this.source(locale, version);
    if (local) return local.chapter(chapterId);
    const result = await this.request<{ data?: { id?: string; bibleId?: string; reference?: string; content?: string; copyright?: string }; meta?: { fumsToken?: string } }>(
      `/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}?content-type=text&include-notes=false&include-titles=false&fums-version=3`,
    );
    if (!result.data?.content) throw new ServiceUnavailableException('Scripture chapter unavailable');
    return { data: {
      id: result.data.id ?? chapterId,
      bibleId,
      reference: result.data.reference ?? chapterId,
      content: result.data.content,
      copyright: result.data.copyright ?? '',
      fumsToken: result.meta?.fumsToken ?? null,
    } };
  }

  /**
   * API.Bible's Fair Use Management System: report Scripture a reader actually saw, from this server so the
   * reader's browser never contacts API.Bible. Fire and forget; reading never waits on it. Off when API_BIBLE_FUMS=off.
   */
  reportUsage(tokens: string[], deviceId: string, sessionId: string): void {
    if (process.env.API_BIBLE_FUMS === 'off') return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    fetch(usageUrl(tokens, deviceId, sessionId), { signal: controller.signal }).catch(() => undefined).finally(() => clearTimeout(timer));
  }
}
