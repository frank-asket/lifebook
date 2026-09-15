import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "./seo.css";
import Analytics from "./Analytics";
import { ClerkProvider } from '@clerk/nextjs';
import { ChristianAuthProvider } from "@/lib/christian-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "LifeBook — Meet yourself where you are",
  description: "A Christian devotional companion for Scripture, reflection, prayer, and community.",
  applicationName: "LifeBook",
  keywords: ["Christian devotional", "Scripture reflection", "Christian prayer", "faith journey"],
  openGraph: {
    title: "LifeBook — Meet yourself where you are",
    description: "A Christian devotional companion for Scripture, reflection, prayer, and community.",
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
    description: "A Christian devotional companion for Scripture, reflection, prayer, and community.",
    sameAs: [],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
          <ChristianAuthProvider>
            {children}
          </ChristianAuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
