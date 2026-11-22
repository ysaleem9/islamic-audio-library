import { NextResponse } from "next/server";
import { authenticateAdminUser, setAdminSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = (body.username || "").trim();
    const password = body.password || "";

    const adminUser = await authenticateAdminUser(username, password);
    if (!adminUser) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة أو الحساب موقوف" },
        { status: 401 }
      );
    }

    await setAdminSessionCookie({ id: adminUser.id, username: adminUser.username });
    return NextResponse.json({ ok: true, user: adminUser });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 400 });
  }
}
