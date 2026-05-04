"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { next?: string };

export function AuthForm({ next }: Props = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
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
    setMessage("");

    const supabase = createClient();
    const callbackUrl = new URL(
      "/auth/callback",
      window.location.origin
    );
    if (next) callbackUrl.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email — we've sent you a link.");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@yourthings.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "submitting" || status === "sent"}
        className="w-full rounded-full border border-linen-300 bg-linen-50 px-5 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20 disabled:opacity-60"
        required
      />
      <button
        type="submit"
        disabled={status === "submitting" || status === "sent"}
        className="mt-3 w-full rounded-full bg-forest-500 px-6 py-3 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
      >
        {status === "submitting"
          ? "Sending…"
          : status === "sent"
          ? "Link sent"
          : "Send magic link"}
      </button>
      {message && (
        <p
          className={`mt-4 text-sm ${
            status === "error" ? "text-error" : "text-charcoal-soft"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
