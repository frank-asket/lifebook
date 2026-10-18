import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';

type Locale = 'en' | 'fr';
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

/** Bible text is fetched server-side. No API key is sent to browsers or stored in PostgreSQL. */
@Injectable()
export class BibleContentService {
  private readonly endpoint = 'https://rest.api.bible/v1';
  private readonly timeoutMs = 8000;

  isConfigured(locale: Locale): boolean {
    return Boolean(process.env.API_BIBLE_KEY && this.bibleId(locale));
  }

  private bibleId(locale: Locale): string | undefined {
    return locale === 'fr' ? process.env.API_BIBLE_FR_BIBLE_ID : process.env.API_BIBLE_EN_BIBLE_ID;
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

  async passage(locale: Locale, passageId: string) {
    if (!/^[A-Z0-9]{3}(?:\.[0-9]+(?:\.[0-9]+(?:-[0-9]+)?)?)?$/.test(passageId)) {
      throw new BadRequestException('Invalid passage identifier');
    }
    const bibleId = this.bibleId(locale);
    if (!bibleId) throw new ServiceUnavailableException('Translation is not configured');
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

  /** Returns metadata for the configured translation. */
  async translation(locale: Locale) {
    const bibleId = this.bibleId(locale);
    if (!bibleId) throw new ServiceUnavailableException('Translation is not configured');
    return this.request(`/bibles/${encodeURIComponent(bibleId)}`);
  }

  async books(locale: Locale) {
    const bibleId = this.bibleId(locale);
    if (!bibleId) throw new ServiceUnavailableException('Translation is not configured');
    return this.request(`/bibles/${encodeURIComponent(bibleId)}/books`);
  }

  async chapters(locale: Locale, bookId: string) {
    if (!/^[A-Z0-9]{3}$/.test(bookId)) throw new BadRequestException('Invalid book');
    const bibleId = this.bibleId(locale);
    if (!bibleId) throw new ServiceUnavailableException('Translation is not configured');
    return this.request(`/bibles/${encodeURIComponent(bibleId)}/books/${bookId}/chapters`);
  }

  async chapter(locale: Locale, chapterId: string) {
    if (!/^[A-Z0-9]{3}\.[0-9]+$/.test(chapterId)) throw new BadRequestException('Invalid chapter');
    const bibleId = this.bibleId(locale);
    if (!bibleId) throw new ServiceUnavailableException('Translation is not configured');
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
