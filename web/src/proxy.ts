import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const isRealClerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY &&
  pubKey &&
  !pubKey.includes("dummy")
);

interface SessionClaimsRecord {
  metadata?: { role?: string; isStaff?: boolean };
  public_metadata?: { role?: string };
  publicMetadata?: { role?: string; isStaff?: boolean };
  role?: string;
  org_role?: string;
  is_staff?: boolean;
  [key: string]: unknown;
}

const isStaffRoute = createRouteMatcher(["/moderation(.*)", "/api/moderation(.*)", "/api/lifebook/moderation(.*)"]);

export default isRealClerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isStaffRoute(req)) {
        const authObj = await auth();
        // If not signed in -> 401 or redirect
        if (!authObj.userId) {
          if (req.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "unauthorized", detail: "Authentication required" }, { status: 401 });
          }
          return authObj.redirectToSignIn();
        }

        // Role check
        const hasPermission =
          (typeof authObj.has === "function" &&
            (authObj.has({ role: "admin" }) ||
             authObj.has({ role: "org:admin" }) ||
             authObj.has({ permission: "org:moderation:review" }))) || false;

        const claims = (authObj.sessionClaims as SessionClaimsRecord | null | undefined) || {};
        const role =
          claims.metadata?.role ||
          claims.public_metadata?.role ||
          claims.publicMetadata?.role ||
          claims.role ||
          claims.org_role;

        const isStaff =
          hasPermission ||
          (typeof role === "string" && ["admin", "moderator", "reviewer", "staff", "org:admin"].includes(role.toLowerCase())) ||
          claims.publicMetadata?.isStaff === true ||
          claims.metadata?.isStaff === true;

        if (!isStaff) {
          if (req.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "forbidden", detail: "Staff or reviewer permission required" }, { status: 403 });
          }
          return new NextResponse("403 Forbidden: Staff or pastoral reviewer privileges required", { status: 403 });
        }
      }

      return NextResponse.next();
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
