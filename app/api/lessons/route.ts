import { NextResponse } from "next/server";
import { getAdminSession, hasAdminPermission } from "@/lib/auth";
import { createLesson, getAllData } from "@/lib/store";
import { normalizeMindMapImages } from "@/lib/types";

export async function GET() {
  const data = await getAllData();
  return NextResponse.json(data.lessons);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const body = await request.json();

    // Support batch import from Internet Archive item
    if (Array.isArray(body.lessons)) {
      if (
        !hasAdminPermission(session, "import_archive") &&
        !hasAdminPermission(session, "manage_lessons")
      ) {
        return NextResponse.json(
          { error: "ليس لديك صلاحية استيراد أو إضافة الدروس" },
          { status: 403 }
        );
      }
      const created = [];
      for (const item of body.lessons) {
        if (!item.title || !item.audioUrl) continue;
        const lesson = await createLesson({
          title: String(item.title),
          seriesId: item.seriesId ? String(item.seriesId) : null,
          episodeNumber: item.episodeNumber != null ? Number(item.episodeNumber) : null,
          category: String(item.category || "عام"),
          description: String(item.description || ""),
          notes: String(item.notes || ""),
          audioUrl: String(item.audioUrl),
          archiveIdentifier: String(item.archiveIdentifier || ""),
          durationSeconds: Number(item.durationSeconds || 0),
          publishedAt: item.publishedAt ? String(item.publishedAt) : undefined,
          isFeatured: Boolean(item.isFeatured),
        });
        created.push(lesson);
      }
      return NextResponse.json({ created, count: created.length }, { status: 201 });
    }

    if (!hasAdminPermission(session, "manage_lessons")) {
      return NextResponse.json({ error: "ليس لديك صلاحية إدارة الدروس" }, { status: 403 });
    }

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "عنوان الدرس مطلوب" }, { status: 400 });
    }
    if (!body.audioUrl || !String(body.audioUrl).trim()) {
      return NextResponse.json({ error: "رابط الملف الصوتي مطلوب" }, { status: 400 });
    }

    const created = await createLesson({
      title: String(body.title),
      seriesId: body.seriesId ? String(body.seriesId) : null,
      episodeNumber:
        body.episodeNumber !== "" && body.episodeNumber != null
          ? Number(body.episodeNumber)
          : null,
      category: String(body.category || "عام"),
      description: String(body.description || ""),
      notes: String(body.notes || ""),
      audioUrl: String(body.audioUrl),
      archiveIdentifier: String(body.archiveIdentifier || ""),
      durationSeconds: Number(body.durationSeconds || 0),
      publishedAt: body.publishedAt ? String(body.publishedAt) : undefined,
      isFeatured: Boolean(body.isFeatured),
      mindMapImages: normalizeMindMapImages(body.mindMapImages),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل حفظ الدرس" },
      { status: 500 }
    );
  }
}
