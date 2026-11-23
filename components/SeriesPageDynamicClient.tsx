"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DatabasePayload } from "@/lib/types";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SeriesDetailClient } from "./SeriesDetailClient";
import fallbackData from "@/data/db.json";

function safeDecode(value: string): string {
  let out = value;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out.normalize("NFC").trim();
}

function extractSeriesSegment(pathStr: string | null | undefined, fallbackId: string): string {
  const parts = (pathStr || "").split("/").filter(Boolean);
  const raw = parts.length >= 2 && parts[0] === "series" ? parts[1] : fallbackId;
  return safeDecode(raw.replace(/\.html$/i, ""));
}

export function SeriesPageDynamicClient({ initialId }: { initialId: string }) {
  const pathname = usePathname();
  const [browserPath, setBrowserPath] = useState<string>("");
  const [data, setData] = useState<DatabasePayload>(fallbackData as unknown as DatabasePayload);

  // Always sync with the actual browser URL (critical when Cloudflare Worker serves placeholder.html)
  useEffect(() => {
    const syncPath = () => {
      if (typeof window !== "undefined") {
        setBrowserPath(window.location.pathname);
      }
    };
    syncPath();
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, [pathname]);

  const effectiveId = useMemo(() => {
    const activePath =
      browserPath && !browserPath.endsWith("/placeholder") ? browserPath : pathname;
    return extractSeriesSegment(activePath, initialId);
  }, [browserPath, pathname, initialId]);

  useEffect(() => {
    fetch("/api/data", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh) => {
        if (fresh && fresh.settings) {
          setData(fresh as DatabasePayload);
        }
      })
      .catch(() => undefined);
  }, []);

  const series = useMemo(() => {
    if (!effectiveId || effectiveId === "placeholder") {
      return data.series[0] || null;
    }
    const found = data.series.find(
      (s) =>
        s.id === effectiveId ||
        safeDecode(s.slug) === effectiveId ||
        s.slug === effectiveId
    );
    return found || data.series[0] || null;
  }, [data.series, effectiveId]);

  const lessons = useMemo(() => {
    if (!series) return [];
    return data.lessons
      .filter((l) => l.seriesId === series.id)
      .sort((a, b) => {
        const epA = a.episodeNumber ?? Number.MAX_SAFE_INTEGER;
        const epB = b.episodeNumber ?? Number.MAX_SAFE_INTEGER;
        if (epA !== epB) return epA - epB;
        return a.publishedAt.localeCompare(b.publishedAt);
      });
  }, [data.lessons, series]);

  if (!series) return null;

  return (
    <>
      <Navbar siteName={data.settings.siteName} />
      <SeriesDetailClient
        series={series}
        lessons={lessons}
        allSeries={data.series}
        allLessons={data.lessons}
        sheikhName={data.settings.sheikhName}
      />
      <Footer settings={data.settings} />
    </>
  );
}
