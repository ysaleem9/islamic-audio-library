import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { resolveArchiveItem } from "@/lib/archive";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { url?: string };
    const result = await resolveArchiveItem(body.url || "");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذر جلب ملفات أرشيف الإنترنت" },
      { status: 400 }
    );
  }
}
