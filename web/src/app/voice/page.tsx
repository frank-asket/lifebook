import Link from "next/link";
import VoicePractice from "../VoicePractice";

export default function VoicePage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell"><Link href="/" className="route-back">← LifeBook</Link><span>LifeBook Voice</span><Link href="/#join" className="pill-button pill-dark">Join the early circle</Link></nav>
      <VoicePractice />
    </main>
  );
}
