import Link from "next/link";

export default function NotFound() {
  return (
    <main className="utility-page">
      <p className="showcase-eyebrow">LifeBook · 404</p>
      <h1>This page has not been written yet.</h1>
      <p>Return to the quiet place, or continue into Scripture, prayer, and the journey ahead.</p>
      <Link className="pill-button pill-dark" href="/">Return to LifeBook ↗</Link>
    </main>
  );
}
