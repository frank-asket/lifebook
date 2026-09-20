import { auth, currentUser, clerkClient, verifyToken } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Validates the session token using @clerk/nextjs/server and returns the user identity.
 * Supports:
 *  1. Clerk cookie / session from auth() & currentUser()
 *  2. Authorization: Bearer <session_token> header via verifyToken() & clerkClient()
 */
async function verifySessionAndGetUser(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    return NextResponse.json(
      {
        authenticated: false,
        error: "ConfigurationError",
        message: "Clerk environment variables are not configured.",
      },
      { status: 500 }
    );
  }

  let userId: string | null = null;
  let sessionId: string | null = null;

  // 1. Check Clerk session from request context (cookies / middleware)
  try {
    const authData = await auth();
    if (authData?.userId) {
      userId = authData.userId;
      sessionId = authData.sessionId ?? null;
    }
  } catch {
    // Context auth check failed or headers not present
  }

  // 2. If not authenticated via context, check Authorization: Bearer <token>
  if (!userId) {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    let rawToken: string | null = null;

    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      rawToken = authHeader.slice(7).trim();
    }

    if (rawToken) {
      try {
        const verified = await verifyToken(rawToken, {
          secretKey,
        });

        if (verified && "data" in verified && verified.data) {
          const claims = verified.data as Record<string, unknown>;
          if (typeof claims.sub === "string") {
            userId = claims.sub;
            sessionId = typeof claims.sid === "string" ? claims.sid : null;
          }
        }
      } catch {
        // Token verification failed
      }
    }
  }

  // 3. If still no valid user ID, return 401 Unauthorized
  if (!userId) {
    return NextResponse.json(
      {
        authenticated: false,
        error: "Unauthorized",
        message: "No valid Clerk session or token provided.",
      },
      { status: 401 }
    );
  }

  // 4. Retrieve and return user identity
  try {
    let userDetails = null;

    // Try currentUser() first
    try {
      const user = await currentUser();
      if (user && user.id === userId) {
        userDetails = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null,
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
          username: user.username ?? null,
          imageUrl: user.imageUrl ?? null,
        };
      }
    } catch {
      // currentUser failed, fallback to clerkClient
    }

    // If currentUser was null or failed, fetch user directly using clerkClient
    if (!userDetails) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user) {
          userDetails = {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
            username: user.username ?? null,
            imageUrl: user.imageUrl ?? null,
          };
        }
      } catch {
        // User record could not be fetched from Clerk API
      }
    }

    return NextResponse.json(
      {
        authenticated: true,
        userId,
        sessionId,
        user: userDetails,
        message: "Session token validated successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve user identity";
    return NextResponse.json(
      {
        authenticated: false,
        error: "InternalServerError",
        message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return verifySessionAndGetUser(request);
}

export async function POST(request: Request) {
  return verifySessionAndGetUser(request);
}

