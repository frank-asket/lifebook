import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./seo.css";
import Analytics from "./Analytics";
import { ClerkProvider } from "@clerk/nextjs";
import { ChristianAuthProvider } from "@/lib/christian-auth";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { CloudSyncProvider } from "@/lib/cloud-sync";
import { SanctuaryAudioProvider } from "@/lib/sanctuary-audio";
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#2A2146",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "LifeBook | Daily 5-Minute Bible & Prayer Companion (Bilingual EN/FR)",
  description:
    "Build a steady 5-minute daily Bible and prayer habit with curated Scripture, guided reflection prompts, and private journaling in English and French.",
  applicationName: "LifeBook",
  manifest: "/manifest.webmanifest",
  keywords: [
    "Christian devotional",
    "daily Bible study",
    "morning prayer habit",
    "5-minute devotional",
    "méditation chrétienne",
    "prière du matin",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeBook",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "LifeBook | Daily 5-Minute Bible & Prayer Companion",
    description:
      "Build a steady 5-minute daily Bible and prayer habit with curated Scripture, guided reflection prompts, and private journaling in English and French.",
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
    description:
      "Build a steady 5-minute daily Bible and prayer habit with curated Scripture, guided reflection prompts, and private journaling in English and French.",
    sameAs: [],
  };

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=clash-display@500,600,700&f[]=zodiak@400,600,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  localStorage.removeItem('lifebook_theme');
                  var mq = window.matchMedia('(prefers-color-scheme: dark)');
                  function apply(isDark) {
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.setAttribute('data-theme', 'dark');
                      document.documentElement.style.colorScheme = 'dark';
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.setAttribute('data-theme', 'light');
                      document.documentElement.style.colorScheme = 'light';
                    }
                  }
                  apply(mq.matches);
                  if (mq.addEventListener) {
                    mq.addEventListener('change', function(e) { apply(e.matches); });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col pb-20">
        <ClerkProvider
          dynamic
          publishableKey={
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            process.env.CLERK_PUBLISHABLE_KEY ||
            "pk_test_Y2xlcmsuZHVtbXkuYWNjb3VudHMuZGV2JA=="
          }
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <Analytics />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <LanguageProvider>
            <ThemeProvider>
              <ChristianAuthProvider>
                <CloudSyncProvider>
                  <SanctuaryAudioProvider>
                    {children}
                    <GlobalAudioPlayer />
                  </SanctuaryAudioProvider>
                </CloudSyncProvider>
              </ChristianAuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
