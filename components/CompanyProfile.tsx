"use client";

import { useEffect, useState } from "react";
import type { CompanyProfile as CompanyProfileData } from "@/lib/integrations/market-data/types";

const profileCache = new Map<string, Promise<CompanyProfileData | null>>();

function fetchProfile(ticker: string): Promise<CompanyProfileData | null> {
  const inFlight = profileCache.get(ticker);
  if (inFlight) {
    return inFlight;
  }

  const request = fetch(`/api/market/profile?ticker=${encodeURIComponent(ticker)}`)
    .then((response) => (response.ok ? (response.json() as Promise<CompanyProfileData>) : null))
    .catch(() => null);

  profileCache.set(ticker, request);
  return request;
}

function useCompanyProfile(ticker: string) {
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);

  useEffect(() => {
    let active = true;
    setProfile(null);

    fetchProfile(ticker).then((data) => {
      if (active) {
        setProfile(data);
      }
    });

    return () => {
      active = false;
    };
  }, [ticker]);

  return profile;
}

export function CompanySector({ ticker }: { ticker: string }) {
  const profile = useCompanyProfile(ticker);

  if (!profile?.sector) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-zinc-400">
      {profile.sector}
      {profile.industry ? ` \u00b7 ${profile.industry}` : ""}
    </p>
  );
}

export function CompanyAbout({ ticker }: { ticker: string }) {
  const profile = useCompanyProfile(ticker);

  if (!profile?.description) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">About</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{profile.description}</p>
    </section>
  );
}
