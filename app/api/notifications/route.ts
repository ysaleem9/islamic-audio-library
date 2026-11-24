import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createNotification, getNotifications } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "1";
    const items = await getNotifications(activeOnly);
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذر جلب الإشعارات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const type = body.type === "faith_meeting" ? "faith_meeting" : "announcement";

    if (type === "announcement" && !String(body.message || "").trim()) {
      return NextResponse.json({ error: "يرجى كتابة نص الإعلان" }, { status: 400 });
    }
    if (type === "faith_meeting") {
      if (!String(body.title || "").trim()) {
        return NextResponse.json({ error: "يرجى إدخال عنوان اللقاء الإيماني" }, { status: 400 });
      }
      if (!String(body.meetingDate || "").trim() || !String(body.meetingTime || "").trim()) {
        return NextResponse.json({ error: "يرجى تحديد تاريخ ووقت اللقاء" }, { status: 400 });
      }
    }

    const created = await createNotification({
      type,
      title: String(body.title || ""),
      message: String(body.message || ""),
      meetingDate: String(body.meetingDate || ""),
      meetingTime: String(body.meetingTime || ""),
      zoomUrl: String(body.zoomUrl || ""),
      durationDays: Number(body.durationDays || 7),
      saveDefaultDays: Boolean(body.saveDefaultDays),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل نشر الإشعار" },
      { status: 500 }
    );
  }
}
