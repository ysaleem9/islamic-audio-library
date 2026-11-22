import { NextResponse } from "next/server";
import { getAdminSession, hasAdminPermission } from "@/lib/auth";
import { deleteAdminUser, updateAdminUser } from "@/lib/store";
import type { AdminPermission } from "@/lib/types";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasAdminPermission(session, "manage_admins")) {
    return NextResponse.json(
      { error: "ليس لديك صلاحية تعديل صلاحيات المشرفين" },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    if (id === "owner") {
      return NextResponse.json(
        { error: "لا يمكن تعديل صلاحيات المدير العام الأساسي" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      displayName?: string;
      password?: string;
      permissions?: AdminPermission[];
      isActive?: boolean;
    };

    // Prevent an admin from deactivating their own currently logged-in account
    if (id === session.id && body.isActive === false) {
      return NextResponse.json(
        { error: "لا يمكنك إيقاف حسابك الشخصي أثناء تسجيل الدخول" },
        { status: 400 }
      );
    }

    const updated = await updateAdminUser(id, body);
    if (!updated) {
      return NextResponse.json({ error: "المشرف غير موجود" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذر تحديث بيانات المشرف" },
      { status: 400 }
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
  if (!hasAdminPermission(session, "manage_admins")) {
    return NextResponse.json(
      { error: "ليس لديك صلاحية حذف المشرفين" },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    if (id === "owner" || id === session.id) {
      return NextResponse.json(
        { error: "لا يمكنك حذف حسابك الحالي أو حساب المدير العام" },
        { status: 400 }
      );
    }

    const deleted = await deleteAdminUser(id);
    if (!deleted) {
      return NextResponse.json({ error: "تعذر حذف المشرف" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذر حذف المشرف" },
      { status: 400 }
    );
  }
}
