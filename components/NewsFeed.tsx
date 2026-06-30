"use client";

import { useEffect, useState } from "react";
import { NewsFeedItem } from "@/components/NewsFeedItem";
import type { SignalRow } from "@/lib/ingestion/read-signals";

type NewsFeedProps = {
  signals: SignalRow[];
  ticker?: string;
};

function getDateKey(value: string | null, useLocalTime: boolean) {
  if (!value) {
    return "Undated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Undated";
  }

  if (!useLocalTime) {
    return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isSameDate(left: Date, right: Date, useLocalTime: boolean) {
  if (!useLocalTime) {
    return (
      left.getUTCFullYear() === right.getUTCFullYear() &&
      left.getUTCMonth() === right.getUTCMonth() &&
      left.getUTCDate() === right.getUTCDate()
    );
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDateHeading(dateKey: string, value: string | null, useLocalTime: boolean) {
  if (dateKey === "Undated" || !value) {
    return "Undated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Undated";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDate(date, today, useLocalTime)) {
    return "Today";
  }

  if (isSameDate(date, yesterday, useLocalTime)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: useLocalTime ? undefined : "UTC"
  }).format(date);
}

function formatDateTime(value: string | null | undefined, useLocalTime: boolean) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: useLocalTime ? undefined : "UTC"
  }).format(date);
}

export function NewsFeed({ signals, ticker }: NewsFeedProps) {
  const [useLocalTime, setUseLocalTime] = useState(false);

  useEffect(() => {
    setUseLocalTime(true);
  }, []);

  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-zinc-400">
        No cached news yet{ticker ? <span> for <span className="font-mono text-zinc-200">{ticker}</span></span> : null}. Run the refresh job to
        populate this feed.
      </div>
    );
  }

  const groupedSignals = Object.entries(
    signals.reduce<Record<string, SignalRow[]>>((groups, signal) => {
      const dateKey = getDateKey(signal.source_published_at, useLocalTime);
      groups[dateKey] = [...(groups[dateKey] ?? []), signal];
      return groups;
    }, {})
  );

  return groupedSignals.map(([dateKey, dateSignals]) => (
    <div key={dateKey} className="mb-8 last:mb-0">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          {formatDateHeading(dateKey, dateSignals[0]?.source_published_at ?? null, useLocalTime)}
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div>
        {dateSignals.map((signal) => (
          <NewsFeedItem
            key={signal.id}
            signal={signal}
            sourcePublishedAtLabel={formatDateTime(signal.source_published_at, useLocalTime)}
            createdAtLabel={formatDateTime(signal.created_at, useLocalTime)}
          />
        ))}
      </div>
    </div>
  ));
}
