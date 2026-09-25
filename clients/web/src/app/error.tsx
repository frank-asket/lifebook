"use client";

import React from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "#8E82A6", fontSize: "0.875rem" }}>LifeBook</p>
      <h1 style={{ fontSize: "1.5rem", margin: "1rem 0" }}>Something went wrong</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>{error?.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          padding: "0.5rem 1.25rem",
          borderRadius: "9999px",
          backgroundColor: "#1e1931",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </main>
  );
}
