'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { BookOpen, CalendarDays, LockKeyhole, Settings2, Sparkles, Sun, Type, X } from 'lucide-react';
import { useLanguage } from './language-provider';
import { byId, markSeen, parseSeen, pickAnnouncement, seenKey, RELEASES, type Announcement as Item, type Slide } from '../lib/announcements';

const ICONS: Record<Slide['icon'], typeof Sun> = { sun: Sun, book: BookOpen, lock: LockKeyhole, calendar: CalendarDays, settings: Settings2, type: Type, sparkles: Sparkles };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* not remembered on this device */ } };

/**
 * Decides whether Home shows the welcome tour or a "What's new" sheet, once per account on this device.
 * `/dashboard?tour=welcome` or `?tour=whats-new` reopens one on purpose (linked from Settings).
 */
export function Announcements() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [item, setItem] = useState<Item | null>(null);
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !user) return;
    const requested = new URLSearchParams(window.location.search).get('tour');
    if (requested) { setItem(requested === 'whats-new' ? RELEASES[0] ?? null : byId(requested)); return; }
    setItem(pickAnnouncement({ createdAt: user.createdAt ?? null, now: new Date(), seen: parseSeen(read(seenKey(userId))) }));
  }, [isLoaded, isSignedIn, userId, user]);
  const close = useCallback(() => {
    if (item && userId) write(seenKey(userId), JSON.stringify(markSeen(parseSeen(read(seenKey(userId))), item)));
    if (new URLSearchParams(window.location.search).has('tour')) window.history.replaceState(null, '', window.location.pathname);
    setItem(null);
  }, [item, userId]);
  return item ? <AnnouncementSheet item={item} onClose={close} /> : null;
}

export function AnnouncementSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const { language } = useLanguage();
  const t = (text: { en: string; fr: string }) => text[language === 'fr' ? 'fr' : 'en'];
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [leaving, setLeaving] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const slide = item.slides[index];
  const last = index === item.slides.length - 1;
  const Icon = ICONS[slide.icon];

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  // Move focus to the new title so screen readers announce each card.
  useEffect(() => { heading.current?.focus(); }, [index]);

  // Leave along the same path it came in on; with Reduce Motion this is a short fade.
  const finish = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => { dialog.current?.close(); onClose(); }, 200);
  }, [leaving, onClose]);
  const go = useCallback((next: number) => {
    if (next < 0 || next >= item.slides.length) return;
    setDirection(next > index ? 'forward' : 'back');
    setIndex(next);
  }, [index, item.slides.length]);

  return <dialog ref={dialog} className={`announce${leaving ? ' leaving' : ''}`} aria-labelledby="announce-title" aria-describedby="announce-body"
    onCancel={e => { e.preventDefault(); finish(); }}
    onClick={e => { if (e.target === dialog.current) finish(); }}
    onKeyDown={e => { if (e.target instanceof HTMLElement && e.target.closest('a,button') === null) { if (e.key === 'ArrowRight') go(index + 1); if (e.key === 'ArrowLeft') go(index - 1); } }}>
    <div className="announce-sheet"
      onPointerDown={e => { if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={e => {
        const start = swipe.current; swipe.current = null;
        if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
      }}>
      <span className="announce-grabber" aria-hidden="true" />
      <div className="announce-top">
        <span className="announce-label">{t(item.label)}</span>
        <button type="button" className="announce-close" onClick={finish} aria-label={tr('Close', 'Fermer')}><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="announce-slide" key={slide.id} data-direction={direction}>
        <div className={`announce-art announce-art-${slide.icon}`} aria-hidden="true"><Icon size={34} strokeWidth={1.6} /></div>
        <h2 id="announce-title" ref={heading} tabIndex={-1}>{t(slide.title)}</h2>
        <p id="announce-body">{t(slide.body)}</p>
      </div>
      {item.slides.length > 1 && <ol className="announce-dots" aria-label={tr(`Card ${index + 1} of ${item.slides.length}`, `Carte ${index + 1} sur ${item.slides.length}`)}>
        {item.slides.map((s, i) => <li key={s.id}><button type="button" className={i === index ? 'current' : ''} aria-current={i === index ? 'step' : undefined} aria-label={`${i + 1}. ${t(s.title)}`} onClick={() => go(i)} /></li>)}
      </ol>}
      <div className="announce-actions">
        {index > 0 ? <button type="button" className="btn btn-light" onClick={() => go(index - 1)}>{tr('Back', 'Retour')}</button>
          : item.slides.length > 1 ? <button type="button" className="announce-skip" onClick={finish}>{tr('Skip', 'Passer')}</button> : <span />}
        {!last ? <button type="button" className="btn btn-primary" onClick={() => go(index + 1)}>{tr('Next', 'Suivant')}</button>
          : slide.cta ? <Link className="btn btn-primary" href={slide.cta.href} onClick={() => { dialog.current?.close(); onClose(); }}>{t(slide.cta.label)}</Link>
          : <button type="button" className="btn btn-primary" onClick={finish}>{tr('Done', 'Terminé')}</button>}
      </div>
      {last && slide.cta && <button type="button" className="announce-skip announce-later" onClick={finish}>{tr('Maybe later', 'Plus tard')}</button>}
    </div>
  </dialog>;
}
