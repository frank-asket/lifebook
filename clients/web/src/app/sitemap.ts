import type { MetadataRoute } from "next";
import { teachings } from "./livingWordData";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const pages = ["", "/voice", "/living-word", "/privacy", "/thank-you"];
  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() })),
    ...teachings.map((teaching) => ({ url: `${siteUrl}/living-word/${teaching.slug}`, lastModified: new Date() })),
  ];
}
