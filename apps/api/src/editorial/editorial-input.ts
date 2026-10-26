import { BadRequestException } from '@nestjs/common';
export type ContentKind = 'meditations' | 'studies' | 'paths';
export function contentKind(value: string): ContentKind {
  if (!['meditations', 'studies', 'paths'].includes(value)) throw new BadRequestException('Unknown content library');
  return value as ContentKind;
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw new BadRequestException('Invalid editorial fields');
  return value as Record<string, unknown>;
}
function text(value: unknown, name: string, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new BadRequestException(`Invalid ${name}`);
  return value.trim();
}
function questions(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 10) throw new BadRequestException('Use at most ten reflection questions');
  return value.map(item => text(item, 'reflection question', 500, true));
}
export type EditorialLesson = { id?: string; title: string; content?: string; scriptureReference?: string; introduction?: string; historicalContext?: string; exegesis?: string; theology?: string; reflectionQuestions?: string[]; guidedPrayer?: string; application?: string };
export function editorialInput(kind: ContentKind, raw: unknown) {
  const common = ['slug', 'title', 'publish', 'reviewConfirmed', 'revision'];
  const fields = kind === 'meditations' ? ['locale', 'publishDate', 'scriptureReference', 'explanation', 'questions', 'guidedPrayer'] : kind === 'studies' ? ['locale', 'description', 'method', 'difficulty', 'lessons'] : ['description', 'lessons'];
  const input = object(raw, [...common, ...fields]);
  const slug = text(input.slug, 'slug', 100, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new BadRequestException('Use a lowercase hyphenated slug');
  if (typeof input.publish !== 'boolean' || typeof input.reviewConfirmed !== 'boolean') throw new BadRequestException('Publication choices are required');
  if (input.publish && !input.reviewConfirmed) throw new BadRequestException('Confirm pastoral and publication review before publishing');
  const revision = input.revision === undefined ? undefined : text(input.revision, 'revision', 64, true);
  if (revision && !/^[a-f0-9]{64}$/.test(revision)) throw new BadRequestException('Invalid revision');
  const base = { slug, title: text(input.title, 'title', 200, true), publish: input.publish, revision };
  const locale = kind === 'paths' ? undefined : text(input.locale, 'language', 2, true);
  if (locale && !['en', 'fr'].includes(locale)) throw new BadRequestException('Choose English or French');
  if (kind === 'meditations') {
    const date = text(input.publishDate, 'publication date', 10, input.publish);
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new BadRequestException('Use a real YYYY-MM-DD publication date');
    return { ...base, locale: locale!, publishDate: date, scriptureReference: text(input.scriptureReference, 'Scripture reference', 200, base.publish), explanation: text(input.explanation, 'explanation', 20000, base.publish), questions: questions(input.questions), guidedPrayer: text(input.guidedPrayer, 'guided prayer', 10000, base.publish) };
  }
  if (!Array.isArray(input.lessons) || input.lessons.length > 30 || (input.publish && !input.lessons.length)) throw new BadRequestException('Publish at least one lesson; maximum thirty');
  const lessons: EditorialLesson[] = input.lessons.map(rawLesson => {
    const fields = kind === 'paths' ? ['content'] : ['scriptureReference', 'introduction', 'historicalContext', 'exegesis', 'theology', 'reflectionQuestions', 'guidedPrayer', 'application'];
    const lesson = object(rawLesson, ['id', 'title', ...fields]);
    const id = lesson.id === undefined ? undefined : text(lesson.id, 'lesson ID', 64, true);
    if (id && !/^[A-Za-z0-9_-]+$/.test(id)) throw new BadRequestException('Invalid lesson ID');
    const result: EditorialLesson = { ...(id ? { id } : {}), title: text(lesson.title, 'lesson title', 200, true) };
    if (kind === 'paths') return { ...result, content: text(lesson.content, 'lesson content', 20000, base.publish) };
    return { ...result, scriptureReference: text(lesson.scriptureReference, 'Scripture reference', 200, base.publish), introduction: text(lesson.introduction, 'introduction', 10000, base.publish), historicalContext: text(lesson.historicalContext, 'historical context', 10000), exegesis: text(lesson.exegesis, 'passage explanation', 20000, base.publish), theology: text(lesson.theology, 'theology', 10000), reflectionQuestions: questions(lesson.reflectionQuestions), guidedPrayer: text(lesson.guidedPrayer, 'guided prayer', 10000), application: text(lesson.application, 'application', 10000) };
  });
  const ids = lessons.flatMap(lesson => lesson.id ? [lesson.id] : []);
  if (new Set(ids).size !== ids.length) throw new BadRequestException('Duplicate lesson IDs');
  const course = { ...base, description: text(input.description, 'description', 10000, base.publish), lessons };
  if (kind === 'paths') return course;
  const method = text(input.method, 'study method', 20, true);
  if (!['THEMATIC', 'CHARACTER', 'BOOK', 'SYSTEMATIC'].includes(method)) throw new BadRequestException('Invalid study method');
  return { ...course, locale: locale!, method, difficulty: text(input.difficulty, 'difficulty', 80, true) };
}
