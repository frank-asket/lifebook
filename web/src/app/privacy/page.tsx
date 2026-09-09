import Link from "next/link";

export const metadata = {
  title: "Privacy policy | LifeBook",
  description: "How LifeBook approaches privacy for mood, journal, voice, and prayer data.",
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <nav className="policy-nav page-shell"><Link href="/">LifeBook</Link><Link href="/">Back home ↗</Link></nav>
      <article className="policy-content page-shell"><p className="showcase-eyebrow">LifeBook · privacy</p><h1>Your inner life deserves care.</h1><p className="policy-lead">This early product is being built with a simple conviction: personal spiritual reflection should not become casual data.</p><p><strong>Status:</strong> This is a product-stage privacy overview, not legal advice or a final store-ready privacy policy. A final policy will be reviewed and published before public launch.</p><h2>What LifeBook may handle</h2><ul><li>Mood check-ins and spiritual preferences</li><li>Journal entries, favorite verses, and journey progress</li><li>Prayer requests, community comments, and moderation flags</li><li>Voice transcripts when voice features are connected and when you choose to use them</li><li>Basic technical information needed to keep the service secure</li></ul><h2>What we are building toward</h2><p>Users should be able to understand why data is collected, control how long it is retained, delete personal content, and know when a response is AI-generated. Voice recordings and transcripts should never be stored by default without clear consent.</p><h2>Questions</h2><p>For privacy questions during the early build, contact the LifeBook team before sharing sensitive personal information.</p><Link className="text-button" href="/">Return to LifeBook ↗</Link></article>
    </main>
  );
}
