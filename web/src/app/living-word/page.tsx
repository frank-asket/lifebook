import Link from "next/link";
import LivingWord from "../LivingWord";

export const metadata = {
  title: "LivingWord | Christian teaching and reflection",
  description: "Listen, reflect, and stay with Scripture through LifeBook's LivingWord teaching library.",
};

export default function LivingWordPage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell"><div className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">LifeBook</Link><span>/</span><strong>LivingWord</strong></div><Link href="/#join" className="pill-button pill-dark">Join the early circle</Link></nav>
      <LivingWord />
    </main>
  );
}
