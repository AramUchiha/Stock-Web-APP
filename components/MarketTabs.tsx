import Link from "next/link";
import { cn } from "@/lib/utils";

type MarketTab = {
  href: string;
  label: string;
};

type MarketTabsProps = {
  active: "news" | "insiders";
};

const tabs: MarketTab[] = [
  { href: "/news", label: "News" },
  { href: "/insiders", label: "Insiders" }
];

export function MarketTabs({ active }: MarketTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-1">
      {tabs.map((tab) => {
        const isActive = tab.href.includes(active);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
