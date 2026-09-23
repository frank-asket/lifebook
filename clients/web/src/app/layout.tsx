import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "./seo.css";
import Analytics from "./Analytics";
import { ClerkProvider } from '@clerk/nextjs';
import { ChristianAuthProvider } from "@/lib/christian-auth";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "LifeBook | Daily 5-Minute Bible & Prayer Companion (Bilingual EN/FR)",
  description: "Build a steady 5-minute daily Bible and prayer habit with curated Scripture, guided reflection prompts, and private journaling in English and French.",
  applicationName: "LifeBook",
  keywords: ["Christian devotional", "daily Bible study", "morning prayer habit", "5-minute devotional", "méditation chrétienne", "prière du matin"],
  openGraph: {
    title: "LifeBook | Daily 5-Minute Bible & Prayer Companion",
    description: "Build a steady 5-minute daily Bible and prayer habit with curated Scripture, guided reflection prompts, and private journaling in English and French.",
    type: "website",
    images: [{ url: "/lifebookbanner.png", width: 1200, height: 420, alt: "LifeBook" }],
  },
  twitter: { card: "summary_large_image", images: ["/lifebookbanner.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LifeBook",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    description: "Build a steady 5-minute daily Bible and prayer habit with curated Scripture, guided reflection prompts, and private journaling in English and French.",
    sameAs: [],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('lifebook_theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          dynamic
          publishableKey={
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            process.env.CLERK_PUBLISHABLE_KEY ||
            "pk_test_Y2xlcmsuZHVtbXkuYWNjb3VudHMuZGV2JA=="
          }
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        >
          <Analytics />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <LanguageProvider>
            <ThemeProvider>
              <ChristianAuthProvider>
                {children}
              </ChristianAuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
