import React from "react";
import fallbackData from "@/data/db.json";
import { SeriesPageDynamicClient } from "@/components/SeriesPageDynamicClient";

export function generateStaticParams() {
  const ids = new Set<string>(["placeholder", "waqfa-maa-ayah", "ser-waqfa"]);
  for (const s of fallbackData.series as Array<{ id: string; slug: string }>) {
    ids.add(s.id);
    ids.add(s.slug);
  }
  return Array.from(ids).map((id) => ({ id }));
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeriesPageDynamicClient initialId={id} />;
}
