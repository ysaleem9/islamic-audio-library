import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteLesson, updateLesson } from "@/lib/store";

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
    const updated = await updateLesson(id, {
      ...body,
      seriesId: body.seriesId ? String(body.seriesId) : null,
      episodeNumber:
        body.episodeNumber !== "" && body.episodeNumber != null
          ? Number(body.episodeNumber)
          : null,
      durationSeconds:
        body.durationSeconds !== undefined ? Number(body.durationSeconds) : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل تعديل الدرس" },
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
    await deleteLesson(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل حذف الدرس" },
      { status: 500 }
    );
  }
}
