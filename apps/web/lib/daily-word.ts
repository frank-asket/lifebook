export type DailyWord = {
  date: string; passageKey: string;
  verse: { reference: string; text: string; translation: string };
  explanation: string; meditation: string; reflectionQuestion: string;
  prayer: string; application: string;
};

// Use the reader's calendar day consistently, including around UTC midnight.
export function dailyWordDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
