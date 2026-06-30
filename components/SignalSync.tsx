"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type SignalSyncProps = {
  ticker: string;
  companyName?: string;
};

export function SignalSync({ ticker, companyName }: SignalSyncProps) {
  const router = useRouter();
  const triggeredForTicker = useRef<string | null>(null);

  useEffect(() => {
    if (triggeredForTicker.current === ticker) {
      return;
    }
    triggeredForTicker.current = ticker;

    const controller = new AbortController();

    async function sync() {
      try {
        const signalParams = new URLSearchParams({ ticker });
        if (companyName) {
          signalParams.set("companyName", companyName);
        }
        const predictionParams = new URLSearchParams({ ticker });

        const results = await Promise.allSettled([
          fetch(`/api/signals/refresh?${signalParams.toString()}`, { signal: controller.signal }),
          fetch(`/api/predictions/refresh?${predictionParams.toString()}`, { signal: controller.signal })
        ]);

        const anyOk = results.some(
          (result) => result.status === "fulfilled" && result.value.ok
        );

        if (anyOk) {
          router.refresh();
        }
      } catch {
        // Best-effort background refresh; cached data already rendered.
      }
    }

    sync();

    return () => controller.abort();
  }, [ticker, companyName, router]);

  return null;
}
