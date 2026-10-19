export type PathSummary = { id: string; slug: string; title: string; description: string; _count?: { lessons: number } };
export type PathDetail = PathSummary & { lessons: { id: string; title: string; position: number; content: string }[] };
export type PathState = { enrollment: { id: string; startedAt: string; completions: { lessonId: string; completedAt: string }[] } | null };
export function completedLessons(path: PathDetail, state: PathState | null) {
  const ids = new Set(state?.enrollment?.completions.map(c => c.lessonId) ?? []);
  return path.lessons.filter(lesson => ids.has(lesson.id)).length;
}
