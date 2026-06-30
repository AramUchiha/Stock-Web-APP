import Link from "next/link";
import { StockCard } from "@/components/StockCard";
import { SymbolSearch } from "@/components/SymbolSearch";
import { demoStockSignals } from "@/lib/seed-data";

const features = [
  {
    title: "Insider Trades",
    description: "Track recent corporate disclosure activity and surface unusual accumulation patterns."
  },
  {
    title: "Political Signals",
    description: "Monitor public congressional disclosures and connect them to ticker-level movement signals."
  },
  {
    title: "Administration Alignment",
    description: "Compare company exposure to contracts, policy direction, and regulatory momentum."
  }
];

const previewSignals = demoStockSignals.slice(0, 3);

export default function HomePage() {
  return (
    <main className="flex-1">
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="font-mono text-lg font-bold tracking-wide text-white">
            StockSignal
          </Link>
          <SymbolSearch className="hidden flex-1 md:block" />
          <div className="flex items-center gap-3">
            <Link href="/news" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white sm:inline-flex">
              News
            </Link>
            <Link href="/insiders" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white sm:inline-flex">
              Insiders
            </Link>
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-lg bg-bullish px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="font-mono text-sm uppercase tracking-[0.25em] text-bullish">Public market signals</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              See what insiders are doing. Before everyone else does.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              StockSignal aggregates public disclosures, contracts, lobbying activity, and news sentiment into one dashboard for bullish and bearish signal monitoring.
            </p>
            <div className="mt-8 max-w-xl">
              <SymbolSearch placeholder="Search any public stock (e.g. AAPL, TSLA, MSFT)" className="max-w-xl" />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="rounded-lg bg-bullish px-5 py-3 text-center text-sm font-semibold text-black hover:bg-emerald-400">
                Start Free
              </Link>
              <Link href="#pricing" className="rounded-lg border border-border px-5 py-3 text-center text-sm font-semibold text-zinc-200 hover:border-zinc-700">
                Compare Plans
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {previewSignals.map((signal) => (
              <StockCard
                key={signal.ticker}
                ticker={signal.ticker}
                companyName={signal.companyName}
                score={signal.score}
                direction={signal.direction}
                signals={signal.signals}
                updatedAt={signal.updatedAt}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-zinc-950/30 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-sm uppercase tracking-[0.25em] text-zinc-500">Pricing</p>
            <h2 className="mt-4 text-3xl font-bold text-white">Simple access for signal monitoring.</h2>
            <p className="mt-3 text-zinc-400">Start with a limited preview, then upgrade when you need full dashboard access and alerts.</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h3 className="text-xl font-semibold text-white">Free</h3>
              <p className="mt-2 text-sm text-zinc-400">Limited preview for quick product evaluation.</p>
              <p className="mt-8 font-mono text-4xl font-bold text-white">$0</p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                <li>3 bullish signals</li>
                <li>3 bearish signals</li>
                <li>Signal details hidden</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-bullish/40 bg-surface p-6 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-white">Pro</h3>
                <span className="rounded-full border border-bullish/30 bg-bullish/10 px-3 py-1 text-xs font-semibold text-bullish">
                  Full access
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">For users who need full signal visibility and alerts.</p>
              <p className="mt-8 font-mono text-4xl font-bold text-white">
                $19<span className="text-base font-medium text-zinc-500">/mo</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                <li>Full dashboard</li>
                <li>All signal details</li>
                <li>Email alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
