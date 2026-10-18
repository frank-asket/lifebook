import type { Content } from '../lib/content';
import { CheckIcon, CloseIcon, LockIcon } from './icons';

type S = Content['screens'];

/**
 * A phone drawn at real iPhone size (390 × 844 points) and scaled down with CSS, so type stays sharp
 * and every screen matches the app. Each phone is one described image; its UI is hidden from screen readers.
 */
export function Phone({ label, dark, children }: { label: string; dark?: boolean; children: React.ReactNode }) {
  return <div className={`phone${dark ? ' phone-dark' : ''}`} role="img" aria-label={label}>
    <div className="phone-screen" aria-hidden="true">{children}</div>
  </div>;
}

const TabBar = ({ tabs, active = 0 }: { tabs: string[]; active?: number }) =>
  <div className="ps-tabs">{tabs.map((tab, i) => <span key={tab} className={i === active ? 'on' : ''}><i />{tab}</span>)}</div>;

export function TodayScreen({ s, dark }: { s: S; dark?: boolean }) {
  const d = dark ? s.dark : s;
  return <>
    <div className="ps-body">
      <p className="ps-eyebrow">{d.date}</p>
      <p className="ps-large">{d.greet}</p>
      <div className="ps-card">
        <div className="ps-row"><span className="ps-caps">{d.todayWord}</span><span className="ps-muted">{d.about}</span></div>
        <p className="ps-verse">{d.verse}</p>
        <p className="ps-ref"><b>{d.ref}</b> · {d.translation}</p>
        <span className="ps-button">{d.begin}</span>
      </div>
      {!dark && <div className="ps-card">
        <p className="ps-card-title">{s.week}</p>
        <div className="ps-week">{s.days.map((day, i) => <span key={i} className={i === 1 || i === 3 ? 'done' : i === 6 ? 'today' : ''}><i>{(i === 1 || i === 3) && <CheckIcon size={14} />}</i>{day}</span>)}</div>
        <p className="ps-muted">{s.weekLine}</p>
      </div>}
    </div>
    <TabBar tabs={d.tabs} />
  </>;
}

/** One prayer-time step: close button, progress dots, the step, and Back / Continue. */
export function StepScreen({ s, step, steps }: { s: S; step: number; steps: string[] }) {
  return <>
    <div className="ps-top"><CloseIcon size={22} /><span className="ps-dots">{steps.map((_, i) => <i key={i} className={i === step ? 'current' : i < step ? 'done' : ''} />)}</span><span /></div>
    <div className="ps-step">
      <p className="ps-caps">{steps[step]}</p>
      {step === 0 && <><p className="ps-verse ps-verse-xl">{s.verse}</p><p className="ps-ref"><b>{s.ref}</b> · {s.translation}</p><p className="ps-text">{s.explanation}</p></>}
      {step === 1 && <><p className="ps-title">{s.stillTitle}</p><div className="ps-breath"><span /></div><p className="ps-cue">{s.breathe}</p><p className="ps-muted ps-center">{s.clock}</p></>}
      {step === 2 && <><p className="ps-title">{s.question}</p><div className="ps-field">{s.reflection}<span className="ps-caret" /></div><p className="ps-muted">{s.reflectHint}</p></>}
      {step === 3 && <><p className="ps-title">{s.prayTitle}</p><p className="ps-prayer">{s.prayer}</p></>}
      {step === 4 && <><p className="ps-title">{s.liveTitle}</p><p className="ps-text ps-text-lg">{s.application}</p></>}
    </div>
    <div className="ps-footer"><span className="ps-btn-quiet">{s.back}</span><span className="ps-btn">{step === 3 ? s.amen : step === 4 ? s.finish : s.next}</span></div>
  </>;
}

/** The Bible reader with the "Aa" reading settings sheet raised over it. */
export function ReaderScreen({ s, sheet = true }: { s: S; sheet?: boolean }) {
  return <>
    <div className="ps-toolbar"><span className="ps-chev">‹</span><span className="ps-pick ps-pick-book">{s.book}<i /></span><span className="ps-pick">1<i /></span><span className="ps-chev">›</span><span className="ps-aa">Aa</span></div>
    <div className="ps-body ps-reader">
      <p className="ps-chapter">{s.bookTitle}</p>
      <p className="ps-scripture">{s.bibleVerses.map(([n, text]) => <span key={n}><sup>{n}</sup>{text} </span>)}</p>
    </div>
    {sheet && <><div className="ps-scrim" />
    <div className="ps-sheet">
      <span className="ps-grabber" />
      <div className="ps-row"><b className="ps-sheet-title">{s.aa}</b><span className="ps-link">{s.done}</span></div>
      <p className="ps-label">{s.bibleLanguage}</p>
      <div className="ps-seg"><span className="on">English</span><span>Français</span></div>
      <p className="ps-label">{s.textSize}</p>
      <div className="ps-size"><span className="ps-a ps-a-small">A</span><span className="ps-bars"><i className="on" /><i className="on" /><i className="on" /><i /></span><span className="ps-a">A</span></div>
      <p className="ps-label">{s.spacing}</p>
      <div className="ps-seg"><span>{s.standard}</span><span className="on">{s.airy}</span></div>
    </div></>}
    {!sheet && <TabBar tabs={s.tabs} active={1} />}
  </>;
}

/** The private prayer journal: write a prayer, see past ones, answered prayers marked. */
export function JournalScreen({ s }: { s: S }) {
  const j = s.journal;
  return <>
    <div className="ps-body">
      <p className="ps-large">{j.title}</p>
      <div className="ps-card">
        <div className="ps-row"><b className="ps-card-title">{j.write}</b><span className="ps-chip"><LockIcon size={11} />{j.lock}</span></div>
        <div className="ps-field ps-field-quiet">{j.placeholder}</div>
        <span className="ps-button">{j.save}</span>
      </div>
      <p className="ps-label">{j.heading}</p>
      <div className="ps-card ps-list">{j.items.map(([title, preview, date, answered]) => <div key={title} className="ps-list-item">
        <div className="ps-row"><b>{title}</b><span className="ps-muted">{date}</span></div>
        <p className="ps-muted ps-clamp">{preview}</p>
        {answered && <span className="ps-chip ps-chip-start">{j.answered}</span>}
      </div>)}</div>
    </div>
    <TabBar tabs={s.tabs} active={2} />
  </>;
}

/** Ask a pastor: who reads the request, a private message, how to be reached. */
export function PastorScreen({ s }: { s: S }) {
  const p = s.pastor;
  return <>
    <div className="ps-body">
      <div className="ps-row ps-row-center"><p className="ps-large">{p.title}</p><span className="ps-chip">{p.pilot}</span></div>
      <div className="ps-card ps-notes"><p>{p.who}</p><p>{p.when}</p></div>
      <p className="ps-label">{p.message}</p>
      <div className="ps-field">{p.sample}<span className="ps-caret" /></div>
      <p className="ps-label">{p.reach}</p>
      <div className="ps-seg"><span className="on">{p.messages}</span><span>{p.call}</span></div>
      <span className="ps-button">{p.send}</span>
    </div>
    <TabBar tabs={s.tabs} active={2} />
  </>;
}
