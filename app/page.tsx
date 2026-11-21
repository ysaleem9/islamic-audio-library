import React from "react";
import { getAllData } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HomeLibraryClient } from "@/components/HomeLibraryClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getAllData();

  return (
    <>
      <Navbar siteName={data.settings.siteName} />
      <HomeLibraryClient data={data} />
      <Footer settings={data.settings} />
    </>
  );
}
