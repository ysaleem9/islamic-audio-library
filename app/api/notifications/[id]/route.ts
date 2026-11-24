import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteNotification } from "@/lib/store";

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
    await deleteNotification(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذر حذف الإشعار" },
      { status: 500 }
    );
  }
}
