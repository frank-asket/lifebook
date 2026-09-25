import Link from "next/link";
import VoicePractice from "../VoicePractice";
import { LanguageToggle } from "../../components/LanguageToggle";
import { ThemeToggle } from "../../components/ThemeToggle";
import { CloudSyncBadge } from "../../components/CloudSyncBadge";
import { PWAInstallButton } from "../../components/PWAInstallPrompt";

export const metadata = {
  title: "LifeBook Voice | Ask, reflect, pray (Bilingual EN/FR)",
  description: "Bring your questions to LifeBook Voice and begin with Scripture, reflection, and prayer in English and French.",
};

export default function VoicePage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell">
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/dashboard">LifeBook Sanctuary</Link>
          <span>/</span>
          <strong>Voice</strong>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CloudSyncBadge />
          <PWAInstallButton />
          <LanguageToggle />
          <ThemeToggle />
          <Link href="/dashboard" className="pill-button pill-dark">
            Dashboard
          </Link>
        </div>
      </nav>
      <VoicePractice />
    </main>
  );
}
