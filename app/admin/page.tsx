"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { AdminUser, DatabasePayload } from "@/lib/types";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import fallbackData from "@/data/db.json";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [data, setData] = useState<DatabasePayload>(fallbackData as unknown as DatabasePayload);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [config, setConfig] = useState({
    supabaseConfigured: true,
    archiveConfigured: true,
    isDefaultCredentials: false,
  });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) {
          router.replace("/admin/login");
          return;
        }
        const me = await meRes.json();
        if (!me.authenticated || !me.user) {
          router.replace("/admin/login");
          return;
        }

        const [dataRes, adminsRes] = await Promise.all([
          fetch("/api/data", { cache: "no-store" }),
          fetch("/api/admins", { cache: "no-store" }),
        ]);

        if (!active) return;

        setCurrentAdmin(me.user as AdminUser);
        if (me.config) setConfig(me.config);

        if (dataRes.ok) {
          const d = await dataRes.json();
          setData(d as DatabasePayload);
        }
        if (adminsRes.ok) {
          const a = await adminsRes.json();
          setAdmins(a as AdminUser[]);
        }
        setLoading(false);
      } catch {
        if (active) router.replace("/admin/login");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !currentAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF3F6] text-[#8E3A7A]">
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>جارٍ تحميل لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboardClient
      initialData={data}
      currentAdmin={currentAdmin}
      initialAdmins={admins}
      config={config}
    />
  );
}
