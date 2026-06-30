import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings | StockSignal"
};

export default function SettingsPage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Settings</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Manage your account and signal alert preferences.</p>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-white">News alerts</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Email alerts for new signals are coming soon. You&apos;ll be able to choose which tracked companies to follow.
          </p>
          <button
            type="button"
            disabled
            className="mt-5 rounded-lg bg-bullish px-4 py-2.5 text-sm font-semibold text-black opacity-60"
          >
            Coming soon
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <p className="mt-2 text-sm text-zinc-400">Plan and billing management will appear here.</p>
          <Link href="/dashboard" className="mt-5 inline-flex text-sm font-medium text-bullish hover:text-emerald-300">
            Back to dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
