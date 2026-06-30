"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

const contentByMode: Record<AuthMode, { title: string; description: string; submitLabel: string; altCopy: string; altHref: string; altLabel: string }> = {
  login: {
    title: "Sign in",
    description: "Access your StockSignal dashboard.",
    submitLabel: "Sign in",
    altCopy: "New to StockSignal?",
    altHref: "/signup",
    altLabel: "Create an account"
  },
  signup: {
    title: "Create your account",
    description: "Start with a limited preview of current signal activity.",
    submitLabel: "Create account",
    altCopy: "Already have an account?",
    altHref: "/login",
    altLabel: "Sign in"
  }
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const content = contentByMode[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (loginError) {
          setError(loginError.message);
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const redirectTo = `${window.location.origin}/dashboard`;
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo }
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account, then sign in.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to complete authentication.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div>
        <Link href="/" className="font-mono text-sm font-bold tracking-wide text-bullish">
          StockSignal
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">{content.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{content.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-bullish"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-bullish"
            placeholder="At least 8 characters"
          />
        </div>

        {error ? <p className="rounded-lg border border-bearish/30 bg-bearish/10 p-3 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="rounded-lg border border-bullish/30 bg-bullish/10 p-3 text-sm text-emerald-200">{message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-bullish px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Working..." : content.submitLabel}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {content.altCopy} {" "}
        <Link href={content.altHref} className="font-medium text-zinc-200 hover:text-white">
          {content.altLabel}
        </Link>
      </p>
    </div>
  );
}
