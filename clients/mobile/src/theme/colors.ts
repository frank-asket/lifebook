// Matches LifeBook_UIUX_Design.docx, section 2 (Visual identity).
export const colors = {
  bgDeep: '#1E1B2E',
  bgMid: '#322257',
  surface: '#F6F2FB',
  surfaceDim: '#EAE2F5',
  ink: '#241A3D',
  inkSoft: '#6A6180',
  purple: '#5B36B8',
  teal: '#1FB6B0',
  hairline: 'rgba(36,26,61,0.12)',
  white: '#FFFFFF',
};

// Mood set grounded in documented Christian faith-journey research rather
// than generic secular mood vocabulary — see root README, "Mood set
// redesign" for sourcing (LifeWay Research on doubt, Barna Group on
// spiritual transformation stages, and the documented literature on
// spiritual dryness). Deliberately includes harder states (doubting,
// distant, convicted), not just upbeat ones.
export const MOODS = [
  { id: 'grateful', label: 'Grateful', emoji: '🙏', desc: 'Thankful for what God has done', color: '#E3B15E' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🕊', desc: 'Resting in God\u2019s presence', color: '#37C6C2' },
  { id: 'seeking', label: 'Seeking', emoji: '🔍', desc: 'Searching for direction', color: '#7B62B8' },
  { id: 'doubting', label: 'Doubting', emoji: '🤔', desc: 'Wrestling with questions of faith', color: '#6B8CAE' },
  { id: 'distant', label: 'Distant', emoji: '🌫', desc: 'Feeling far from God right now', color: '#5B5580' },
  { id: 'convicted', label: 'Convicted', emoji: '🕯', desc: 'Aware of where you\u2019ve fallen short', color: '#B8746B' },
] as const;

export type MoodId = typeof MOODS[number]['id'];
