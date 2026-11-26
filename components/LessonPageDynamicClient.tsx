"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DatabasePayload } from "@/lib/types";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { LessonDetailClient } from "./LessonDetailClient";
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

export function LessonPageDynamicClient({ initialId }: { initialId: string }) {
  const pathname = usePathname();
  const [browserPath, setBrowserPath] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.pathname : ""
  );
  const [data, setData] = useState<DatabasePayload>(fallbackData as unknown as DatabasePayload);

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
    const parts = (activePath || "").split("/").filter(Boolean);
    const fromUrl = parts.length >= 2 && parts[0] === "lessons" ? parts[1] : initialId;
    return safeDecode(fromUrl.replace(/\.html$/i, ""));
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
