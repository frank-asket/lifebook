// A few line icons drawn for this page (1.75 stroke, 24 grid), so the site needs no icon dependency.
type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });
export const SunIcon = ({ size = 22 }: P) => <svg {...base(size)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const BookIcon = ({ size = 22 }: P) => <svg {...base(size)}><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>;
export const LockIcon = ({ size = 22 }: P) => <svg {...base(size)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
export const ChatIcon = ({ size = 22 }: P) => <svg {...base(size)}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>;
export const CheckIcon = ({ size = 14 }: P) => <svg {...base(size)} strokeWidth={2.5}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const ArrowIcon = ({ size = 16 }: P) => <svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const CloseIcon = ({ size = 18 }: P) => <svg {...base(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const MenuIcon = ({ size = 20 }: P) => <svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
