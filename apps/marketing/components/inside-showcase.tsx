'use client';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type ShowcaseItem = { id: string; title: string; text: string; badge?: string; icon: ReactNode; iconClass?: string; phone: ReactNode };

/**
 * What's inside: a short list of features beside one phone that shows the selected one.
 * Every description stays visible, so nothing is hidden from readers or search; only the phone changes.
 */
export function InsideShowcase({ items, label }: { items: ShowcaseItem[]; label: string }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  // On phones the screen sits above the list; bring it back into view when a lower item is tapped.
  const show = (i: number) => {
    setActive(i);
    const el = stage.current;
    if (el && window.matchMedia('(max-width: 900px)').matches && el.getBoundingClientRect().top < 72) { // 72: below the sticky header
      el.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  const select = (i: number) => { setActive(i); tabs.current[i]?.focus(); };
  const onKey = (e: KeyboardEvent, i: number) => {
    const last = items.length - 1;
    const next = { ArrowDown: i === last ? 0 : i + 1, ArrowRight: i === last ? 0 : i + 1, ArrowUp: i === 0 ? last : i - 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next !== undefined) { e.preventDefault(); select(next); }
  };
  return <div className="showcase">
    <div className="showcase-list" role="tablist" aria-orientation="vertical" aria-label={label}>
      {items.map((item, i) => <button key={item.id} ref={el => { tabs.current[i] = el; }} type="button" role="tab" id={`inside-tab-${item.id}`}
        aria-selected={i === active} aria-controls="inside-panel" aria-labelledby={`inside-title-${item.id}`} aria-describedby={`inside-text-${item.id}`}
        tabIndex={i === active ? 0 : -1} className="showcase-item" onClick={() => show(i)} onKeyDown={e => onKey(e, i)}>
        <span className={`tile-icon${item.iconClass ? ` ${item.iconClass}` : ''}`} aria-hidden="true">{item.icon}</span>
        <span className="showcase-copy">
          <span className="showcase-title" id={`inside-title-${item.id}`}>{item.title}{item.badge && <span className="badge">{item.badge}</span>}</span>
          <span className="showcase-text" id={`inside-text-${item.id}`}>{item.text}</span>
        </span>
      </button>)}
    </div>
    <div ref={stage} className="showcase-stage" role="tabpanel" id="inside-panel" aria-labelledby={`inside-tab-${items[active].id}`}>
      {items.map((item, i) => <div key={item.id} className="showcase-phone" data-active={i === active} aria-hidden={i !== active}>{item.phone}</div>)}
    </div>
  </div>;
}
