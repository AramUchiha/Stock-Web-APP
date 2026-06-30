import { cn } from "@/lib/utils";

type SignalTagProps = {
  type: string;
  count?: number;
};

const colorByType: Record<string, string> = {
  insider: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  political: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  contract: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  news: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
};

function formatSignalType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export function SignalTag({ type, count }: SignalTagProps) {
  const normalizedType = type.toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        colorByType[normalizedType] ?? colorByType.news
      )}
    >
      {count ? `${count} ` : null}
      {formatSignalType(type)}
    </span>
  );
}
