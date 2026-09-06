"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body: { message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setMessage(body.message ?? "Something went wrong. Try again.");
        return;
      }
      setStatus("done");
      setMessage(body.message ?? "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-2xl border border-accent/50 bg-accent-soft/40 px-5 py-4 text-sm">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-full border border-border-subtle bg-surface px-5 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Request an invite"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-lilac sm:self-center">
          {message}
        </p>
      )}
    </form>
  );
}
