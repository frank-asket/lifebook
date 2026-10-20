'use client';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { FeatureGroup, Status } from '../lib/content';

/** Accessible tabs (arrow keys, Home/End). Every panel is in the HTML; only the chosen one is shown. */
export function FeatureTabs({ groups, status, label, phones }: { groups: FeatureGroup[]; status: Record<Status, string>; label: string; phones: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (event: KeyboardEvent, index: number) => {
    const last = groups.length - 1;
    const next = event.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
    if (next === null) return;
    event.preventDefault(); setActive(next); tabs.current[next]?.focus();
  };
  return <div className="feature-tabs">
    <div className="tab-list" role="tablist" aria-label={label}>
      {groups.map((group, i) => <button key={group.id} ref={el => { tabs.current[i] = el; }} type="button" role="tab" id={`tab-${group.id}`} aria-controls={`panel-${group.id}`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} className={active === i ? 'tab on' : 'tab'} onClick={() => setActive(i)} onKeyDown={event => move(event, i)}>{group.tab}</button>)}
    </div>
    {groups.map((group, i) => <section key={group.id} role="tabpanel" id={`panel-${group.id}`} aria-labelledby={`tab-${group.id}`} hidden={active !== i} className="tab-panel">
      <div className="panel-copy">
        <h3>{group.title}</h3>
        <p className="panel-lead">{group.lead}</p>
        <ul className="feature-list">
          {group.items.map(item => <li key={item.title} className={`feature status-${item.status}`}>
            <div className="feature-head"><h4>{item.title}</h4><span className={`status-chip chip-${item.status}`}>{status[item.status]}</span></div>
            <p>{item.text}</p>
          </li>)}
        </ul>
      </div>
      <div className="panel-phone">{phones[i]}</div>
    </section>)}
  </div>;
}
