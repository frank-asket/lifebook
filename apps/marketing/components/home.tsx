import { content, type Locale } from '../lib/content';
import { appLinks } from '../lib/app-links';
import { ProductPreview } from './product-preview';
import { ArrowIcon, BookIcon, ChatIcon, CheckIcon, LockIcon, SunIcon } from './icons';

export function Home({ locale }: { locale: Locale }) {
  const t = content[locale];
  const c = t.inside.cards;
  return <main>
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p className="lead">{t.hero.lead}</p>
          <div className="actions">
            <a className="button" href={appLinks.signUp}>{t.hero.primary} <ArrowIcon /></a>
            <a className="button button-quiet" href="#how">{t.hero.secondary}</a>
          </div>
          <p className="hero-note">{t.hero.note}</p>
        </div>
        <ProductPreview t={t.preview} />
      </div>
    </section>

    <section className="section" id="how" aria-labelledby="how-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">{t.how.eyebrow}</p>
          <h2 id="how-title">{t.how.title}</h2>
          <p className="section-lead">{t.how.lead}</p>
        </header>
        <ol className="steps">{t.how.steps.map(([title, text], i) => <li key={title}><span className="step-n">{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
      </div>
    </section>

    <section className="section section-tint" id="inside" aria-labelledby="inside-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">{t.inside.eyebrow}</p>
          <h2 id="inside-title">{t.inside.title}</h2>
        </header>
        <div className="bento">
          <article className="tile tile-daily">
            <span className="tile-icon"><SunIcon /></span>
            <h3>{c.daily.title}</h3><p>{c.daily.text}</p>
            <div className="mini-week" aria-hidden="true"><span className="mini-label">{c.daily.week}</span>
              <span className="mini-days">{c.daily.days.map((d, i) => <span key={i} className={i === 1 || i === 2 || i === 4 ? 'done' : i === 6 ? 'today' : ''}><i>{(i === 1 || i === 2 || i === 4) && <CheckIcon size={11} />}</i>{d}</span>)}</span>
            </div>
          </article>
          <article className="tile tile-bible">
            <span className="tile-icon"><BookIcon /></span>
            <h3>{c.bible.title}</h3><p>{c.bible.text}</p>
            <figure className="mini-scripture"><blockquote><sup>1</sup>{c.bible.sample}</blockquote><figcaption>{c.bible.sampleRef}</figcaption></figure>
          </article>
          <article className="tile tile-prayer">
            <span className="tile-icon rose"><LockIcon /></span>
            <h3>{c.prayer.title}</h3><p>{c.prayer.text}</p>
            <span className="mini-pill" aria-hidden="true"><LockIcon size={13} /> {c.prayer.lock}</span>
          </article>
          <article className="tile tile-pastor">
            <span className="tile-icon"><ChatIcon /></span>
            <h3>{c.pastor.title} <span className="badge">{c.pastor.badge}</span></h3><p>{c.pastor.text}</p>
            <span className="mini-marks" aria-hidden="true">{c.pastor.marks.map(m => <span key={m} className="mini-pill"><CheckIcon size={12} /> {m}</span>)}</span>
          </article>
        </div>
      </div>
    </section>

    <section className="section" id="promises" aria-labelledby="promises-title">
      <div className="container promises">
        <header className="section-head">
          <p className="eyebrow">{t.promises.eyebrow}</p>
          <h2 id="promises-title">{t.promises.title}</h2>
        </header>
        <dl className="promise-list">{t.promises.items.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl>
      </div>
    </section>

    <section className="verse-band" aria-label={t.verse.reference}>
      <figure className="container">
        <blockquote>{t.verse.text}</blockquote>
        <figcaption><cite>{t.verse.reference}</cite> · {t.verse.translation}</figcaption>
      </figure>
    </section>

    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="container faq">
        <header className="section-head">
          <p className="eyebrow">{t.faq.eyebrow}</p>
          <h2 id="faq-title">{t.faq.title}</h2>
        </header>
        <div className="faq-items">{t.faq.items.map(([q, a]) => <details key={q}><summary>{q}<span className="chev" aria-hidden="true" /></summary><p>{a}</p></details>)}</div>
      </div>
    </section>

    <section className="closing" aria-labelledby="closing-title">
      <div className="container closing-inner">
        <h2 id="closing-title">{t.cta.title}</h2>
        <p>{t.cta.text}</p>
        <div className="actions">
          <a className="button" href={appLinks.signUp}>{t.cta.button} <ArrowIcon /></a>
          <a className="button button-quiet" href={appLinks.home}>{t.cta.open}</a>
        </div>
      </div>
    </section>
  </main>;
}
