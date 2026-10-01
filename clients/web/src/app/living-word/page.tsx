import LivingWord from "../LivingWord";
import { YouVersionNavbar } from "@/components/YouVersionNavbar";

export const metadata = {
  title: "LivingWord | Christian teaching and reflection (Bilingual EN/FR)",
  description:
    "Listen, reflect, and stay with Scripture through LifeBook's LivingWord teaching library in English and French.",
};

export default function LivingWordPage() {
  return (
    <main className="route-page">
      <YouVersionNavbar activeTab="livingword" />
      <LivingWord />
    </main>
  );
}
