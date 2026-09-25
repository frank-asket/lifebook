import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "LifeBook — Daily 5-Minute Bible & Prayer Sanctuary",
    short_name: "LifeBook",
    description:
      "Open directly into your daily 5-minute Bible and prayer sanctuary with curated Scripture, guided reflection prompts, and private Soul Journal.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#130F24",
    theme_color: "#2A2146",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Daily Sanctuary Dashboard",
        short_name: "Dashboard",
        description: "Open today's 5-minute Scripture and prayer dashboard",
        url: "/dashboard",
        icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Living Word Audio",
        short_name: "Audio",
        description: "Listen to expository teachings and Psalms meditations",
        url: "/living-word",
        icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Streak & 30-Day Heatmap",
        short_name: "Progress",
        description: "View your spiritual rhythm, Sabbath shield, and Soul Journal",
        url: "/progress",
        icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
