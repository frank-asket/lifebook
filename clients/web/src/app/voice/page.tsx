import VoicePractice from "../VoicePractice";
import { YouVersionNavbar } from "@/components/YouVersionNavbar";

export const metadata = {
  title: "LifeBook Voice | Ask, reflect, pray (Bilingual EN/FR)",
  description:
    "Bring your questions to LifeBook Voice and begin with Scripture, reflection, and prayer in English and French.",
};

export default function VoicePage() {
  return (
    <main className="route-page">
      <YouVersionNavbar activeTab="voice" />
      <VoicePractice />
    </main>
  );
}
