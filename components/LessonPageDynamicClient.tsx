"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DatabasePayload } from "@/lib/types";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { LessonDetailClient } from "./LessonDetailClient";
import fallbackData from "@/data/db.json";

export function LessonPageDynamicClient({ initialId }: { initialId: string }) {
  const pathname = usePathname();
  const [data, setData] = useState<DatabasePayload>(fallbackData as unknown as DatabasePayload);

  const effectiveId = useMemo(() => {
    const parts = (pathname || "").split("/").filter(Boolean);
    const fromUrl = parts.length >= 2 && parts[0] === "lessons" ? parts[1] : initialId;
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

  const lesson = useMemo(
    () => data.lessons.find((l) => l.id === effectiveId) || data.lessons[0] || null,
    [data.lessons, effectiveId]
  );

  const series = useMemo(
    () => (lesson?.seriesId ? data.series.find((s) => s.id === lesson.seriesId) || null : null),
    [data.series, lesson]
  );

  const relatedLessons = useMemo(() => {
    if (!lesson) return [];
    if (series) {
      return data.lessons
        .filter((l) => l.seriesId === series.id)
        .sort((a, b) => (a.episodeNumber ?? 9999) - (b.episodeNumber ?? 9999));
    }
    return data.lessons
      .filter((l) => l.id !== lesson.id && l.category === lesson.category)
      .slice(0, 5);
  }, [data.lessons, lesson, series]);

  if (!lesson) return null;

  return (
    <>
      <Navbar siteName={data.settings.siteName} />
      <LessonDetailClient
        lesson={lesson}
        series={series}
        relatedLessons={relatedLessons}
        sheikhName={data.settings.sheikhName}
      />
      <Footer settings={data.settings} />
    </>
  );
}
