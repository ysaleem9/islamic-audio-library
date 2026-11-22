import { NextResponse } from "next/server";
import { getAdminSession, hasAdminPermission } from "@/lib/auth";
import { createAdminUser, listAdminUsers } from "@/lib/store";
import type { AdminPermission } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const admins = await listAdminUsers();
  return NextResponse.json(admins);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasAdminPermission(session, "manage_admins")) {
    return NextResponse.json(
      { error: "ليس لديك صلاحية إضافة أو إدارة المشرفين" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      username?: string;
      displayName?: string;
      password?: string;
      permissions?: AdminPermission[];
    };

    const created = await createAdminUser({
      username: String(body.username || ""),
      displayName: String(body.displayName || ""),
      password: String(body.password || ""),
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذر إنشاء حساب المشرف" },
      { status: 400 }
    );
  }
}
