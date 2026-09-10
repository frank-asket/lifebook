import type { NextConfig } from "next";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y2xlcmsuZHVtbXkuYWNjb3VudHMuZGV2JA==";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
  },
};

export default nextConfig;

