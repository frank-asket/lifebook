import Link from "next/link";
import ProgressScreen from "../../components/ProgressScreen";
import { LanguageToggle } from "../../components/LanguageToggle";

export const metadata = {
  title: "Progress & Mood Trends | LifeBook",
  description: "Track your 30-day mood trends, streaks, and faith reflections with interactive Recharts visualizations.",
};

export default function ProgressPage() {
  return (
    <main className="route-page bg-[#FBFAF7] min-h-screen">
      <nav className="route-nav page-shell">
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">LifeBook</Link>
          <span>/</span>
          <strong>Progress & Trends</strong>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link href="/#features" className="pill-button pill-dark">
            Devotions
          </Link>
        </div>
      </nav>
      <div className="py-6">
        <ProgressScreen />
      </div>
    </main>
  );
}
