"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("That doesn't look like an email — try again?");
      return;
    }
    setStatus("submitting");
    // TODO: wire to real backend (Supabase function or Formspree) in Session 6.
    // For now, simulate a submit and store locally.
    await new Promise((r) => setTimeout(r, 600));
    setStatus("success");
    setMessage("You're on the list. We'll be in touch.");
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@yourthings.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting" || status === "success"}
          className="flex-1 rounded-full border border-linen-300 bg-linen-50 px-5 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20 disabled:opacity-60"
          required
        />
        <button
          type="submit"
          disabled={status === "submitting" || status === "success"}
          className="rounded-full bg-forest-500 px-6 py-3 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
        >
          {status === "submitting" ? "Joining…" : status === "success" ? "On the list" : "Join the waitlist"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${
            status === "error" ? "text-error" : "text-charcoal-soft"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
