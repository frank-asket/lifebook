import Link from "next/link";
import VoicePractice from "../VoicePractice";

export const metadata = {
  title: "LifeBook Voice | Ask, reflect, pray",
  description: "Bring your questions to LifeBook Voice and begin with Scripture, reflection, and prayer.",
};

export default function VoicePage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell"><div className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">LifeBook</Link><span>/</span><strong>Voice</strong></div><Link href="/#join" className="pill-button pill-dark">Join the early circle</Link></nav>
      <VoicePractice />
    </main>
  );
}
