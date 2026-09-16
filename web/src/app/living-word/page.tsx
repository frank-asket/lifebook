import Link from "next/link";
import LivingWord from "../LivingWord";
import { LanguageToggle } from "../../components/LanguageToggle";

export const metadata = {
  title: "LivingWord | Christian teaching and reflection (Bilingual EN/FR)",
  description: "Listen, reflect, and stay with Scripture through LifeBook's LivingWord teaching library in English and French.",
};

export default function LivingWordPage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell">
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">LifeBook</Link>
          <span>/</span>
          <strong>LivingWord</strong>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link href="/#join" className="pill-button pill-dark">
            Join the early circle
          </Link>
        </div>
      </nav>
      <LivingWord />
    </main>
  );
}
