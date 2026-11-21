import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateSettings } from "@/lib/store";

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const updated = await updateSettings(body);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل حفظ الإعدادات" },
      { status: 500 }
    );
  }
}
