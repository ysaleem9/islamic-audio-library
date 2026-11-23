"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DatabasePayload } from "@/lib/types";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SeriesDetailClient } from "./SeriesDetailClient";
import fallbackData from "@/data/db.json";

export function SeriesPageDynamicClient({ initialId }: { initialId: string }) {
  const pathname = usePathname();
  const [data, setData] = useState<DatabasePayload>(fallbackData as unknown as DatabasePayload);

  const effectiveId = useMemo(() => {
    const parts = (pathname || "").split("/").filter(Boolean);
    const fromUrl = parts.length >= 2 && parts[0] === "series" ? parts[1] : initialId;
    try {
      return decodeURIComponent(fromUrl);
    } catch {
      return fromUrl;
    }
  }, [pathname, initialId]);

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

  const series = useMemo(
    () =>
      data.series.find((s) => s.id === effectiveId || s.slug === effectiveId) ||
      data.series[0] ||
      null,
    [data.series, effectiveId]
  );

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
