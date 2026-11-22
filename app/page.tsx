"use client";

import React, { useEffect, useState } from "react";
import type { DatabasePayload } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HomeLibraryClient } from "@/components/HomeLibraryClient";
import fallbackData from "@/data/db.json";

export default function HomePage() {
  const [data, setData] = useState<DatabasePayload>(fallbackData as unknown as DatabasePayload);

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

  return (
    <>
      <Navbar siteName={data.settings.siteName} />
      <HomeLibraryClient data={data} />
      <Footer settings={data.settings} />
    </>
  );
}
