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
          <Link
            href="/living-word/cms"
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#faf5ff] text-[#705eaa] border border-[#dccff3] hover:bg-[#ede3f7] transition-colors"
          >
            Pastoral CMS (P5)
          </Link>
          <LanguageToggle />
          <Link href="/waitlist" className="pill-button pill-dark">
            Waitlist Cohorts (P4)
          </Link>
        </div>
      </nav>
      <LivingWord />
    </main>
  );
}
