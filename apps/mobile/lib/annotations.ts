export type Annotation = { id: string; passageId: string; locale: 'en' | 'fr'; bookmarked: boolean; highlight: string | null; note: string | null };
export const HIGHLIGHTS = ['yellow', 'green', 'blue', 'pink'] as const;
export const highlightColors = {
  light: { yellow: '#fff0ad', green: '#d8efdf', blue: '#dae9fc', pink: '#f8dfec' },
  dark: { yellow: '#50421e', green: '#203f32', blue: '#233950', pink: '#4a2b40' },
};
export function annotationAt(items: Annotation[], chapterId: string, verse: string) {
  const n = Number(verse);
  return items.find(item => item.passageId === `${chapterId}.${verse}`) ?? items.find(item => {
    if (!item.passageId.startsWith(`${chapterId}.`)) return false;
    const range = item.passageId.slice(chapterId.length + 1).split('-').map(Number);
    return range.length === 2 && n >= range[0] && n <= range[1];
  });
}
export function validVerseRange(value: string) {
  if (!/^[1-9][0-9]{0,2}(?:-[1-9][0-9]{0,2})?$/.test(value)) return false;
  const [start, end = start] = value.split('-').map(Number);
  return start <= 200 && end <= 200 && end >= start && end - start <= 50;
}
