import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Expected a JSON body." }, { status: 400 });
  }

  const email =
    typeof payload === "object" && payload !== null && "email" in payload
      ? String((payload as { email: unknown }).email).trim()
      : "";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ message: "That email address doesn't look right." }, { status: 400 });
  }

  console.info(`[waitlist] ${email}`);

  return NextResponse.json({
    message:
      "Thank you — the first test group is 5 to 10 people, so you'll hear from a person, not an autoresponder.",
  });
}
