import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-stack",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-serif-stack",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeBook — scripture that meets you where you actually are",
  description:
    "A quiet daily practice: name how you arrived, receive scripture chosen for it, and walk a five-step flow through reflection, meditation and prayer.",
  openGraph: {
    title: "LifeBook",
    description:
      "Scripture, reflection, meditation and prayer — shaped around the state you actually showed up in.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
