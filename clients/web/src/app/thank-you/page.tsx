import Link from "next/link";

export const metadata = {
  title: "Thank you | LifeBook",
  description: "You are on the LifeBook early circle list.",
};

export default function ThankYouPage() {
  return (
    <main className="utility-page thank-you-page">
      <p className="showcase-eyebrow">LifeBook · you are on the list</p>
      <h1>Thank you for making room.</h1>
      <p>We will send a quiet note when LifeBook is ready for the next step of your journey.</p>
      <div className="utility-links"><Link className="pill-button pill-dark" href="/">Return home ↗</Link><Link className="text-button" href="/living-word">Explore LivingWord</Link></div>
    </main>
  );
}
