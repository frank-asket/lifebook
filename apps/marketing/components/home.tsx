import { content, type Locale } from '../lib/content';
import { appLinks } from '../lib/app-links';
import { ProductPreview } from './product-preview';
import { JournalScreen, PastorScreen, Phone, ReaderScreen, StepScreen, TodayScreen } from './phone-screens';
import { ArrowIcon, BookIcon, ChatIcon, LockIcon, SunIcon } from './icons';

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
        <ol className="walk">{t.how.steps.map(([title, text], i) => <li key={title}>
          <Phone label={`${t.screens.steps[i]} · LifeBook`}><StepScreen s={t.screens} step={i} steps={t.screens.steps} /></Phone>
          <div className="walk-copy"><span className="step-n">{i + 1}</span><h3>{title}</h3><p>{text}</p></div>
        </li>)}</ol>
        <p className="screens-note">{t.screens.note}</p>
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
            <div className="tile-phone"><Phone label={c.daily.title}><TodayScreen s={t.screens} /></Phone></div>
          </article>
          <article className="tile tile-bible">
            <span className="tile-icon"><BookIcon /></span>
            <h3>{c.bible.title}</h3><p>{c.bible.text}</p>
            <div className="tile-phone"><Phone label={c.bible.title}><ReaderScreen s={t.screens} sheet={false} /></Phone></div>
          </article>
          <article className="tile tile-prayer">
            <span className="tile-icon rose"><LockIcon /></span>
            <h3>{c.prayer.title}</h3><p>{c.prayer.text}</p>
            <div className="tile-phone"><Phone label={c.prayer.title}><JournalScreen s={t.screens} /></Phone></div>
          </article>
          <article className="tile tile-pastor">
            <span className="tile-icon"><ChatIcon /></span>
            <h3>{c.pastor.title} <span className="badge">{c.pastor.badge}</span></h3><p>{c.pastor.text}</p>
            <div className="tile-phone"><Phone label={c.pastor.title}><PastorScreen s={t.screens} /></Phone></div>
          </article>
        </div>
      </div>
    </section>

    <section className="section" id="ease" aria-labelledby="ease-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">{t.ease.eyebrow}</p>
          <h2 id="ease-title">{t.ease.title}</h2>
          <p className="section-lead">{t.ease.lead}</p>
        </header>
        <div className="ease-phones">
          <figure><Phone label={t.ease.captions[0]}><ReaderScreen s={t.screens} /></Phone><figcaption>{t.ease.captions[0]}</figcaption></figure>
          <figure><Phone label={t.ease.captions[1]} dark><TodayScreen s={t.screens} dark /></Phone><figcaption>{t.ease.captions[1]}</figcaption></figure>
        </div>
        <dl className="ease-points">{t.ease.points.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl>
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
