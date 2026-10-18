// Same palette as the web app (DESIGN.md): one violet accent, quiet neutrals, a true dark theme.
export const palettes = {
  light: { bg: '#f6f5fa', paper: '#ffffff', ink: '#201b32', muted: '#5f5870', line: '#e7e3ef', accent: '#6c4fc4', accentInk: '#ffffff', deep: '#47318a', soft: '#eee8fb', rose: '#f8e7f1', chip: '#ffffff', danger: '#b3261e', scrim: 'rgba(20,14,36,0.32)' },
  dark: { bg: '#121019', paper: '#1c1826', ink: '#f1edf8', muted: '#b5aac6', line: '#332c43', accent: '#b49bef', accentInk: '#1a1424', deep: '#d3c2fa', soft: '#2a2238', rose: '#35232f', chip: '#4a3f60', danger: '#ff8a80', scrim: 'rgba(0,0,0,0.55)' },
};
export type Palette = typeof palettes.light;

// System font for interface text (San Francisco on iOS, with its own optical sizing); Georgia for Scripture.
export const fonts = { serif: 'Georgia' };

export const space = { gutter: 20, card: 18, radius: 20 };
