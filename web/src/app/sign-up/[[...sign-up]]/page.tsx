import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4 py-12">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-serif text-[#2A2146] hover:opacity-85 transition-opacity"
        >
          <span className="text-xl">🕊️</span>
          <span className="font-bold">LifeBook</span>
        </Link>
        <p className="mt-1 text-xs text-[#706782]">
          Begin your faith journey with scripture and reflection
        </p>
      </div>
      <div className="w-full max-w-md flex justify-center">
        <SignUp />
      </div>
      <p className="mt-8 text-xs text-[#8A7E9F]">
        <Link href="/" className="hover:text-[#2A2146] transition-colors">
          ← Return to Home
        </Link>
      </p>
    </div>
  );
}
