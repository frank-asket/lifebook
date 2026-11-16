// The verified production alias keeps unconfigured marketing builds off localhost.
const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '');
const base = configured || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://lifebook-inky.vercel.app');
export const appLinks = {
  home: `${base}/dashboard`,
  signIn: `${base}/sign-in`,
  signUp: `${base}/sign-up`,
  meditation: `${base}/meditation`,
  prayer: `${base}/prayer`,
  livingword: `${base}/livingword`,
};

/** Pilot requests go to the operator; this does not create an account or promise admission. */
export function pilotLink(locale: 'en' | 'fr') {
  const subject = locale === 'fr' ? 'Demande de participation au pilote LifeBook' : 'LifeBook pilot participation request';
  return `mailto:lifebook.meditation@gmail.com?subject=${encodeURIComponent(subject)}`;
}
