import React from "react";
import { redirect } from "next/navigation";
import { getAdminCredentials, getAdminSession } from "@/lib/auth";
import { isArchiveConfigured } from "@/lib/archive";
import { getAllData, isSupabaseConfigured } from "@/lib/store";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const data = await getAllData();
  const { isDefault } = getAdminCredentials();

  return (
    <AdminDashboardClient
      initialData={data}
      config={{
        supabaseConfigured: isSupabaseConfigured(),
        archiveConfigured: isArchiveConfigured(),
        isDefaultCredentials: isDefault,
      }}
    />
  );
}
