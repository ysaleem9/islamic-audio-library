import React from "react";
import fallbackData from "@/data/db.json";
import { LessonPageDynamicClient } from "@/components/LessonPageDynamicClient";

export function generateStaticParams() {
  const ids = new Set<string>(["placeholder"]);
  for (const l of fallbackData.lessons) {
    ids.add(l.id);
  }
  return Array.from(ids).map((id) => ({ id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LessonPageDynamicClient initialId={id} />;
}
