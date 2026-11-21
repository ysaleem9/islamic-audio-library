import React from "react";
import { notFound } from "next/navigation";
import { getLessonById } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LessonDetailClient } from "@/components/LessonDetailClient";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getLessonById(id);
  if (!result) notFound();

  return (
    <>
      <Navbar siteName={result.settings.siteName} />
      <LessonDetailClient
        lesson={result.lesson}
        series={result.series}
        relatedLessons={result.relatedLessons}
        sheikhName={result.settings.sheikhName}
      />
      <Footer settings={result.settings} />
    </>
  );
}
