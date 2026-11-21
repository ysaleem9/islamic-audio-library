import { NextResponse } from "next/server";
import { setAdminSessionCookie, verifyAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = (body.username || "").trim();
    const password = body.password || "";

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    await setAdminSessionCookie(username);
    return NextResponse.json({ ok: true, username });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 400 });
  }
}
