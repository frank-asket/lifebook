import { MoodDemo } from "@/components/mood-demo";
import { SiteHeader } from "@/components/site-header";
import { Waitlist } from "@/components/waitlist";
import { crisisResources, flowSteps, journeys, pillars } from "@/lib/content";

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{title}</h2>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-lilac/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pt-28">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">
              An AI-native Christian wellness practice
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.1] sm:text-6xl">
              Scripture that meets you in the state you actually arrived in.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Most devotionals hand everyone the same page. LifeBook starts with one honest question
              — how did you come here today? — and builds the next ten minutes around the answer:
              scripture, a reflection, stillness, prayer.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#waitlist"
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Join the first test group
              </a>
              <a
                href="#flow"
                className="rounded-full border border-border-subtle px-6 py-3 text-sm text-muted transition-colors hover:border-lilac hover:text-foreground"
              >
                See the daily flow
              </a>
            </div>
            <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
              Being straight with you: the app is built and works end to end, and no real user has
              opened it yet. We are looking for the first five to ten people, not the first five
              thousand.
            </p>
          </div>
        </section>

        <section id="moods" className="border-t border-border-subtle/60 bg-surface/40">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <SectionHeading eyebrow="The check-in" title="Six words. Pick the true one." />
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              No mood scale from one to ten, no daily quiz. Tap where you are and the day is built
              from there. Try it — this is the same set the app opens with.
            </p>
            <div className="mt-10">
              <MoodDemo />
            </div>
          </div>
        </section>

        <section id="flow" className="border-t border-border-subtle/60">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <SectionHeading
              eyebrow="The daily flow"
              title="Five steps, about ten minutes, then it lets you go."
            />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {flowSteps.map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl border border-border-subtle bg-surface p-6"
                >
                  <span className="font-serif text-sm text-accent">
                    {String(item.step).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-serif text-xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="journeys" className="border-t border-border-subtle/60 bg-surface/40">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <SectionHeading
              eyebrow="Journeys"
              title="When one day is not the thing you need, take five."
            />
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Journeys run through the same five-step flow, one day at a time. The home screen
              suggests one based on how you have been checking in — and tells you why it picked it.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {journeys.map((journey) => (
                <article
                  key={journey.id}
                  className="flex flex-col rounded-2xl border border-border-subtle bg-surface p-6"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">
                    {journey.days} days
                  </p>
                  <h3 className="mt-2 font-serif text-xl">{journey.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{journey.summary}</p>
                  <p className="mt-5 text-xs text-muted">
                    Suggested when you arrive{" "}
                    <span className="text-lilac">{journey.forMoods.join(" or ").toLowerCase()}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="community" className="border-t border-border-subtle/60">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <SectionHeading eyebrow="Around the practice" title="The rest of it, briefly." />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-border-subtle bg-surface p-6"
                >
                  <h3 className="font-serif text-xl leading-snug">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{pillar.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="waitlist" className="border-t border-border-subtle/60 bg-surface/40">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Before anything scales</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              We would rather watch five people use this than launch it at five thousand.
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
              The first test group is small on purpose. You open the app, we watch without
              explaining anything, and what you do decides what gets built next.
            </p>
            <div className="mx-auto mt-9 max-w-xl text-left">
              <Waitlist />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle/60">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="font-serif text-lg">
            If you are in crisis, please reach a person now, not an app.
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:gap-8">
            {crisisResources.map((resource) => (
              <li key={resource.label}>
                <a className="transition-colors hover:text-accent" href={resource.href}>
                  {resource.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-xs text-muted">
            LifeBook — in pre-release testing. Content is reviewed by an automated pass; a human
            theological reviewer is not yet staffed, which is why the test group stays small.
          </p>
        </div>
      </footer>
    </>
  );
}
