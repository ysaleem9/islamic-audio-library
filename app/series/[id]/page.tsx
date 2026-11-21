import React from "react";
import { notFound } from "next/navigation";
import { getSeriesByIdOrSlug } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeriesDetailClient } from "@/components/SeriesDetailClient";

export const dynamic = "force-dynamic";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSeriesByIdOrSlug(id);
  if (!result) notFound();

  return (
    <>
      <Navbar siteName={result.settings.siteName} />
      <SeriesDetailClient
        series={result.series}
        lessons={result.lessons}
        sheikhName={result.settings.sheikhName}
      />
      <Footer settings={result.settings} />
    </>
  );
}
