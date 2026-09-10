import type { NextConfig } from "next";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y2xlcmsuZHVtbXkuYWNjb3VudHMuZGV2JA==";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Vercel manages its own serverless output and .nft.json file tracing.
  // Using output: "standalone" on Vercel causes:
  // "Error: ENOENT: no such file or directory, open '/vercel/path0/web/.next/next-server.js.nft.json'"
  ...(isVercel ? {} : { output: "standalone" }),
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
  },
};

export default nextConfig;

