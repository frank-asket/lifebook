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
