import { NextResponse } from "next/server";
import { getAdminCredentials, getAdminSession } from "@/lib/auth";
import { isArchiveConfigured } from "@/lib/archive";
import { isSupabaseConfigured } from "@/lib/store";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const { isDefault } = getAdminCredentials();
  return NextResponse.json({
    authenticated: true,
    username: session.username,
    user: session,
    config: {
      supabaseConfigured: isSupabaseConfigured(),
      archiveConfigured: isArchiveConfigured(),
      isDefaultCredentials: isDefault,
    },
  });
}
