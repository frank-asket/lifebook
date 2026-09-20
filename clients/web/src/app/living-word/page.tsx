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
          <Link href="/voice" className="text-xs font-semibold text-[#776E82] hover:text-[#1E1931] transition-colors">
            Voice
          </Link>
          <LanguageToggle />
          <Link href="/#features" className="pill-button pill-dark">
            Devotions
          </Link>
        </div>
      </nav>
      <LivingWord />
    </main>
  );
}
