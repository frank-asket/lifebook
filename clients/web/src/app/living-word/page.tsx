import Link from "next/link";
import LivingWord from "../LivingWord";
import { LanguageToggle } from "../../components/LanguageToggle";
import { ThemeToggle } from "../../components/ThemeToggle";
import { CloudSyncBadge } from "../../components/CloudSyncBadge";
import { PWAInstallButton } from "../../components/PWAInstallPrompt";

export const metadata = {
  title: "LivingWord | Christian teaching and reflection (Bilingual EN/FR)",
  description: "Listen, reflect, and stay with Scripture through LifeBook's LivingWord teaching library in English and French.",
};

export default function LivingWordPage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell">
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/dashboard">LifeBook Sanctuary</Link>
          <span>/</span>
          <strong>LivingWord</strong>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/teachers" className="text-xs font-semibold text-[#776E82] hover:text-[#1E1931] dark:text-[#B8B0C8] dark:hover:text-white transition-colors">
            Teachers Portal
          </Link>
          <Link href="/voice" className="text-xs font-semibold text-[#776E82] hover:text-[#1E1931] dark:text-[#B8B0C8] dark:hover:text-white transition-colors">
            Voice
          </Link>
          <CloudSyncBadge />
          <PWAInstallButton />
          <LanguageToggle />
          <ThemeToggle />
          <Link href="/dashboard" className="pill-button pill-dark">
            Dashboard
          </Link>
        </div>
      </nav>
      <LivingWord />
    </main>
  );
}
