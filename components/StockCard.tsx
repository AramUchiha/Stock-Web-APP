import Link from "next/link";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { SignalTag } from "@/components/SignalTag";
import { cn } from "@/lib/utils";
import type { SignalDirection } from "@/lib/seed-data";

type StockCardProps = {
  ticker: string;
  companyName: string;
  score: number;
  direction: SignalDirection;
  signals: string[];
  isBlurred?: boolean;
  updatedAt?: string;
};

export function StockCard({
  ticker,
  companyName,
  score,
  direction,
  signals,
  isBlurred = false,
  updatedAt
}: StockCardProps) {
  const isBullish = direction === "bullish";
  const label = isBullish ? "Probability to increase" : "Probability to decrease";

  return (
    <article className="group rounded-2xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/stock/${ticker.toLowerCase()}`}
            className={cn(
              "inline-flex rounded-md border px-2.5 py-1 font-mono text-sm font-bold tracking-wide",
              isBullish
                ? "border-bullish/30 bg-bullish/10 text-bullish"
                : "border-bearish/30 bg-bearish/10 text-bearish"
            )}
          >
            {ticker}
          </Link>
          <h3 className="mt-3 text-base font-semibold text-white">{companyName}</h3>
          {updatedAt ? <p className="mt-1 text-xs text-zinc-500">Updated {updatedAt}</p> : null}
        </div>
        <div className="text-right">
          <p className={cn("font-mono text-4xl font-bold", isBullish ? "text-bullish" : "text-bearish")}>{score}%</p>
          <p className="mt-1 text-xs text-zinc-500">{label}</p>
        </div>
      </div>

      <div className="mt-5">
        <ProbabilityBar score={score} direction={direction} />
      </div>

      <div className={cn("mt-5 flex flex-wrap gap-2", isBlurred && "blur-sm select-none")}> 
        {signals.map((signal) => (
          <SignalTag key={`${ticker}-${signal}`} type={signal} />
        ))}
      </div>

      {isBlurred ? (
        <div className="mt-4 rounded-xl border border-border bg-zinc-950 p-3 text-sm text-zinc-300">
          Upgrade to Pro to view full signal details.
        </div>
      ) : null}
    </article>
  );
}
