/** Bible Study catalog and progress contract, shared by the web pages and the Expo screen. Framework-free. */
export type StudyMethod = 'THEMATIC' | 'CHARACTER' | 'BOOK' | 'SYSTEMATIC';
export type StudySummary = { id: string; title: string; description: string; method: StudyMethod; difficulty: string; _count: { lessons: number } };
export type StudyLesson = {
  id: string; position: number; title: string; scriptureReference: string; introduction: string;
  historicalContext: string | null; exegesis: string; theology: string | null;
  reflectionQuestions: string[]; guidedPrayer: string | null; application: string | null;
};
export type StudySeries = { id: string; title: string; description: string; method: StudyMethod; lessons: StudyLesson[] };
/** GET /bible-studies/my-studies. Only the fields LifeBook reads are typed. */
export type MyStudies = { enrollments: { seriesId: string }[]; completedLessonIds: string[] };

export const STUDY_METHODS: StudyMethod[] = ['THEMATIC', 'CHARACTER', 'BOOK', 'SYSTEMATIC'];

const labels: Record<StudyMethod, { en: string; fr: string }> = {
  THEMATIC: { en: 'Topics', fr: 'Thèmes' },
  CHARACTER: { en: 'Characters', fr: 'Personnages' },
  BOOK: { en: 'Books', fr: 'Livres' },
  SYSTEMATIC: { en: 'Doctrine', fr: 'Doctrine' },
};
export function methodLabel(method: string, lang: 'en' | 'fr'): string {
  const label = labels[method as StudyMethod];
  return label ? label[lang] : lang === 'fr' ? 'Étude' : 'Study';
}

/** Route and API ids are opaque; reject anything that could change the request path. */
export function isStudyId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

export function orderedLessons(series: StudySeries): StudyLesson[] {
  return [...series.lessons].sort((a, b) => a.position - b.position);
}

export function completedInSeries(series: StudySeries, completedLessonIds: readonly string[]): number {
  const done = new Set(completedLessonIds);
  return series.lessons.filter(lesson => done.has(lesson.id)).length;
}

export function matchesStudy(study: StudySummary, method: StudyMethod | null, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  return (!method || study.method === method) && (!q || `${study.title} ${study.description}`.toLocaleLowerCase().includes(q));
}
