import Link from "next/link";
import VoicePractice from "../VoicePractice";
import { LanguageToggle } from "../../components/LanguageToggle";

export const metadata = {
  title: "LifeBook Voice | Ask, reflect, pray (Bilingual EN/FR)",
  description: "Bring your questions to LifeBook Voice and begin with Scripture, reflection, and prayer in English and French.",
};

export default function VoicePage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell">
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">LifeBook</Link>
          <span>/</span>
          <strong>Voice</strong>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link href="/#join" className="pill-button pill-dark">
            Join the early circle
          </Link>
        </div>
      </nav>
      <VoicePractice />
    </main>
  );
}
