import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';

type Locale = 'en' | 'fr';
type BibleResponse = { data?: { id?: string; content?: string; reference?: string; copyright?: string }; };

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
    const result = await this.request<BibleResponse>(`/bibles/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(passageId)}?content-type=text&include-notes=false&include-titles=false`);
    const data = result.data;
    if (!data?.content) throw new ServiceUnavailableException('Scripture text unavailable');
    return {
      reference: data.reference || passageId,
      text: data.content.trim(),
      translation: bibleId,
      copyright: data.copyright || null,
      provider: 'API.Bible',
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
    const result = await this.request<{ data?: { id?: string; bibleId?: string; reference?: string; content?: string; copyright?: string } }>(
      `/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}?content-type=text&include-notes=false&include-titles=false`,
    );
    if (!result.data?.content) throw new ServiceUnavailableException('Scripture chapter unavailable');
    return { data: {
      id: result.data.id ?? chapterId,
      bibleId,
      reference: result.data.reference ?? chapterId,
      content: result.data.content,
      copyright: result.data.copyright ?? '',
    } };
  }
}
