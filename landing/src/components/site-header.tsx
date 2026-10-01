import Link from "next/link";

const links = [
  { href: "#moods", label: "The check-in" },
  { href: "#flow", label: "Daily flow" },
  { href: "#journeys", label: "Journeys" },
  { href: "#community", label: "Community" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg tracking-tight">
          Life<span className="text-accent">Book</span>
        </Link>
        <nav className="hidden gap-7 text-sm text-muted md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="#waitlist"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Join the first test
        </a>
      </div>
    </header>
  );
}
