import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteSeries, updateSeries } from "@/lib/store";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = await updateSeries(id, body);
    if (!updated) {
      return NextResponse.json({ error: "السلسلة غير موجودة" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل تعديل السلسلة" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    await deleteSeries(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل حذف السلسلة" },
      { status: 500 }
    );
  }
}
