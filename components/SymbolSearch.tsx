"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SymbolMatch } from "@/lib/integrations/market-data/types";
import { cn } from "@/lib/utils";

type SymbolSearchProps = {
  placeholder?: string;
  className?: string;
};

export function SymbolSearch({ placeholder = "Search any stock (e.g. AAPL)", className }: SymbolSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolMatch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/market/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        const data = await response.json();
        setResults(data.results ?? []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        // ignore aborted/transient errors
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToTicker(ticker: string) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/stock/${ticker.toLowerCase()}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      if (event.key === "Enter" && query.trim()) {
        goToTicker(query.trim());
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const match = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (match) {
        goToTicker(match.ticker);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search stocks"
        className="w-full rounded-lg border border-border bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-bullish"
      />

      {isOpen && results.length > 0 ? (
        <ul className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-card">
          {results.map((match, index) => (
            <li key={`${match.ticker}-${index}`}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToTicker(match.ticker)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                  index === activeIndex ? "bg-zinc-800" : "hover:bg-zinc-900"
                )}
              >
                <span className="min-w-0">
                  <span className="font-mono font-bold text-white">{match.ticker}</span>
                  {match.name ? <span className="ml-2 truncate text-zinc-400">{match.name}</span> : null}
                </span>
                {match.exchange ? <span className="shrink-0 text-xs text-zinc-600">{match.exchange}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
