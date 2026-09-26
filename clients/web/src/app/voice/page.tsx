import Link from "next/link";
import {
  Sparkle,
  Headphones,
  UsersThree,
  Microphone,
} from "@phosphor-icons/react/dist/ssr";
import VoicePractice from "../VoicePractice";
import { LanguageToggle } from "../../components/LanguageToggle";

export const metadata = {
  title: "LifeBook Voice | Ask, reflect, pray (Bilingual EN/FR)",
  description:
    "Bring your questions to LifeBook Voice and begin with Scripture, reflection, and prayer in English and French.",
};

export default function VoicePage() {
  return (
    <main className="route-page">
      <nav className="route-nav page-shell">
        <div className="flex items-center gap-6">
          <div className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/dashboard">LifeBook</Link>
            <span>/</span>
            <strong>Voice</strong>
          </div>
          <div className="hidden md:flex items-center gap-1 pl-4 border-l border-[#2D2542]/10 dark:border-white/12 text-xs font-semibold text-[#5A506B] dark:text-[#C8C2D6]">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg hover:text-[#1E1931] dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkle size={14} weight="duotone" />
              <span>Sanctuary</span>
            </Link>
            <Link
              href="/living-word"
              className="px-3 py-1.5 rounded-lg hover:text-[#1E1931] dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <Headphones size={14} weight="duotone" />
              <span>LivingWord</span>
            </Link>
            <Link
              href="/teachers"
              className="px-3 py-1.5 rounded-lg hover:text-[#1E1931] dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <UsersThree size={14} weight="duotone" />
              <span>Teachers</span>
            </Link>
            <Link
              href="/voice"
              className="px-3 py-1.5 rounded-lg text-[#1E1931] dark:text-white bg-[#F2ECE1] dark:bg-white/10 transition-colors inline-flex items-center gap-1.5"
            >
              <Microphone size={14} weight="duotone" />
              <span>Voice</span>
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <Link href="/dashboard" className="pill-button pill-dark">
            Sanctuary
          </Link>
        </div>
      </nav>
      <VoicePractice />
    </main>
  );
}
