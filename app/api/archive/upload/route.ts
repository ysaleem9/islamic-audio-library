import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getAdminSession, hasAdminPermission } from "@/lib/auth";
import {
  isArchiveConfigured,
  isR2Configured,
  uploadAudioToCloudflareR2,
  uploadAudioToInternetArchive,
} from "@/lib/archive";
import { getAllData } from "@/lib/store";

const ALLOWED_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".opus", ".wav", ".aac"];
const MAX_UPLOAD_BYTES = 120 * 1024 * 1024; // 120 MB

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasAdminPermission(session, "manage_lessons")) {
    return NextResponse.json({ error: "ليس لديك صلاحية رفع الملفات الصوتية" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") || "").trim();
    const identifier = String(formData.get("identifier") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "يرجى اختيار ملف صوتي للرفع" }, { status: 400 });
    }

    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "صيغة الملف غير مدعومة. الصيغ المدعومة: MP3, M4A, OGG, OPUS, WAV, AAC" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error:
            "حجم الملف أكبر من 120 ميجابايت. يُنصح بضغط الصوتيات إلى 48–64 kbps أو رفعها مباشرة من موقع archive.org ثم استيراد الرابط هنا.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isR2Configured()) {
      const uploaded = await uploadAudioToCloudflareR2({
        buffer,
        originalFileName: file.name,
        mimeType: file.type || "audio/mpeg",
        folder: identifier || "lessons",
      });

      return NextResponse.json({
        storageMode: "r2",
        audioUrl: uploaded.audioUrl,
        identifier: uploaded.identifier,
        fileName: uploaded.fileName,
        message: "تم رفع الملف الصوتي بنجاح إلى Cloudflare R2!",
      });
    }

    if (isArchiveConfigured()) {
      const data = await getAllData();
      const uploaded = await uploadAudioToInternetArchive({
        buffer,
        originalFileName: file.name,
        mimeType: file.type || "audio/mpeg",
        title: title || file.name.replace(/\.[^.]+$/, ""),
        creator: data.settings.sheikhName,
        identifier: identifier || undefined,
      });

      return NextResponse.json({
        storageMode: "archive",
        audioUrl: uploaded.audioUrl,
        identifier: uploaded.identifier,
        fileName: uploaded.fileName,
        message: "تم رفع الملف بنجاح إلى حسابك على Internet Archive!",
      });
    }

    // Fallback: local storage for development / preview when Archive S3 keys are not set yet
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await fs.writeFile(path.join(uploadsDir, safeName), buffer);

    return NextResponse.json({
      storageMode: "local",
      audioUrl: `/uploads/${safeName}`,
      identifier: "",
      fileName: safeName,
      message:
        "تم حفظ الملف محلياً للتجربة (مفاتيح Internet Archive غير مضبوطة بعد في .env.local).",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل رفع الملف الصوتي" },
      { status: 500 }
    );
  }
}
