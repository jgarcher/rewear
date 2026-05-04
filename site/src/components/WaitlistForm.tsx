"use client";

import { useState, useTransition } from "react";
import { joinWaitlist } from "@/app/actions";

type Status = "idle" | "submitting" | "success" | "error";

export function WaitlistForm({ source = "site_home" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("That doesn't look like an email — try again?");
      return;
    }
    setStatus("submitting");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await joinWaitlist(email, source);
        if (result.ok) {
          setStatus("success");
          setMessage("You're on the list. We'll be in touch.");
          setEmail("");
        } else {
          setStatus("error");
          setMessage(result.error);
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Something went wrong — try again?"
        );
      }
    });
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
          {status === "submitting"
            ? "Joining…"
            : status === "success"
            ? "On the list"
            : "Join the waitlist"}
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
