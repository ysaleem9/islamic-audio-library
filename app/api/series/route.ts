import { NextResponse } from "next/server";
import { getAdminSession, hasAdminPermission } from "@/lib/auth";
import { createSeries, getAllData } from "@/lib/store";

export async function GET() {
  const data = await getAllData();
  return NextResponse.json(data.series);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasAdminPermission(session, "manage_series")) {
    return NextResponse.json({ error: "ليس لديك صلاحية إدارة السلاسل" }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "عنوان السلسلة مطلوب" }, { status: 400 });
    }
    const created = await createSeries({
      title: String(body.title),
      parentId: body.parentId ? String(body.parentId) : null,
      category: String(body.category || "عام"),
      description: String(body.description || ""),
      status: body.status === "completed" ? "completed" : "ongoing",
      coverAccent: body.coverAccent || "emerald",
      sortOrder: Number(body.sortOrder || 0),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل إنشاء السلسلة" },
      { status: 500 }
    );
  }
}
