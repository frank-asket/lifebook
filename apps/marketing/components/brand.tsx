export function BookMark({ size = 32 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect width="48" height="48" rx="14" fill="var(--accent)" /><path d="M10 14.5c5.3-2.1 10.2-1.3 14 2.2v19c-3.8-3.5-8.7-4.3-14-2.2v-19Z" fill="#fff" /><path d="M38 14.5c-5.3-2.1-10.2-1.3-14 2.2v19c3.8-3.5 8.7-4.3 14-2.2v-19Z" fill="#fff" fillOpacity=".7" /></svg>;
}
export function Brand({ href = '/' }: { href?: string }) {
  return <a className="brand" href={href} aria-label="LifeBook"><BookMark /><span>LifeBook</span></a>;
}
