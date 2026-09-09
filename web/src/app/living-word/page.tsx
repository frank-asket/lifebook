import Link from "next/link";
import LivingWord from "../LivingWord";

export default function LivingWordPage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell"><Link href="/" className="route-back">← LifeBook</Link><span>LivingWord</span><Link href="/#join" className="pill-button pill-dark">Join the early circle</Link></nav>
      <LivingWord />
    </main>
  );
}
