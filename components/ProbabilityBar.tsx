import { cn } from "@/lib/utils";
import type { SignalDirection } from "@/lib/seed-data";

type ProbabilityBarProps = {
  score: number;
  direction: SignalDirection;
};

export function ProbabilityBar({ score, direction }: ProbabilityBarProps) {
  const boundedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
      <div
        className={cn("h-full rounded-full", direction === "bullish" ? "bg-bullish" : "bg-bearish")}
        style={{ width: `${boundedScore}%` }}
      />
    </div>
  );
}
