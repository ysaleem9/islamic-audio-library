export interface ArchiveAudioFile {
  name: string;
  title: string;
  downloadUrl: string;
  durationSeconds: number;
  sizeBytes: number;
  format: string;
}

export interface ArchiveItemResolution {
  identifier: string;
  itemTitle: string;
  creator: string;
  files: ArchiveAudioFile[];
}

const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".opus", ".wav", ".aac"];

export function isArchiveConfigured(): boolean {
  return Boolean(process.env.ARCHIVE_ACCESS_KEY && process.env.ARCHIVE_SECRET_KEY);
}

export function extractArchiveIdentifier(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Direct identifier without slashes or protocol
  if (/^[a-zA-Z0-9._-]{3,100}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes("archive.org")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    // /details/<identifier> or /download/<identifier>/... or /metadata/<identifier>
    if (parts.length >= 2 && ["details", "download", "metadata", "embed"].includes(parts[0])) {
      return parts[1];
    }
    return null;
  } catch {
    return null;
  }
}

function parseArchiveLength(lengthVal: string | number | undefined): number {
  if (typeof lengthVal === "number" && Number.isFinite(lengthVal)) {
    return Math.round(lengthVal);
  }
  if (typeof lengthVal !== "string") return 0;
  const trimmed = lengthVal.trim();
  if (!trimmed) return 0;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.round(Number.parseFloat(trimmed));
  }
  const parts = trimmed.split(":").map((p) => Number.parseFloat(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return 0;
}

function cleanFileTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function resolveArchiveItem(urlOrId: string): Promise<ArchiveItemResolution> {
  const identifier = extractArchiveIdentifier(urlOrId);
  if (!identifier) {
    throw new Error("الرابط غير صالح. يرجى إدخال رابط صفحة أو معرف صالح من موقع archive.org");
  }

  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`تعذر جلب البيانات من أرشيف الإنترنت (رمز الحالة: ${res.status})`);
  }

  const data = (await res.json()) as {
    metadata?: { title?: string | string[]; creator?: string | string[] };
    files?: Array<{
      name?: string;
      source?: string;
      format?: string;
      length?: string | number;
      size?: string | number;
      title?: string;
    }>;
  };

  if (!data || !data.files || data.files.length === 0) {
    throw new Error("لم يتم العثور على ملفات لهذا المعرف على أرشيف الإنترنت.");
  }

  const rawFiles = data.files.filter((f) => {
    if (!f.name) return false;
    const lower = f.name.toLowerCase();
    return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  });

  // Prefer original files over auto-generated derivatives when duplicates exist
  const originals = rawFiles.filter((f) => f.source === "original");
  const selected = originals.length > 0 ? originals : rawFiles;

  const files: ArchiveAudioFile[] = selected
    .map((f) => {
      const name = f.name || "";
      const encodedPath = name
        .split("/")
        .map((seg) => encodeURIComponent(seg))
        .join("/");
      return {
        name,
        title: f.title?.trim() || cleanFileTitle(name.split("/").pop() || name),
        downloadUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodedPath}`,
        durationSeconds: parseArchiveLength(f.length),
        sizeBytes: Number(f.size || 0),
        format: f.format || name.split(".").pop()?.toUpperCase() || "MP3",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar", { numeric: true }));

  if (files.length === 0) {
    throw new Error("هذا العنصر لا يحتوي على ملفات صوتية (MP3/M4A/OGG).");
  }

  const metaTitle = Array.isArray(data.metadata?.title)
    ? data.metadata?.title[0]
    : data.metadata?.title;
  const metaCreator = Array.isArray(data.metadata?.creator)
    ? data.metadata?.creator[0]
    : data.metadata?.creator;

  return {
    identifier,
    itemTitle: metaTitle || identifier,
    creator: metaCreator || "",
    files,
  };
}

function sanitizeArchiveKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadAudioToInternetArchive(params: {
  buffer: Buffer;
  originalFileName: string;
  mimeType: string;
  title: string;
  creator: string;
  identifier?: string;
}): Promise<{ audioUrl: string; identifier: string; fileName: string }> {
  const accessKey = process.env.ARCHIVE_ACCESS_KEY;
  const secretKey = process.env.ARCHIVE_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("مفاتيح أرشيف الإنترنت (ARCHIVE_ACCESS_KEY / ARCHIVE_SECRET_KEY) غير مضبوطة.");
  }

  const prefix = sanitizeArchiveKey(process.env.ARCHIVE_IDENTIFIER_PREFIX || "islamic-audio");
  const ext = params.originalFileName.includes(".")
    ? params.originalFileName.slice(params.originalFileName.lastIndexOf(".")).toLowerCase()
    : ".mp3";
  const baseFile = sanitizeArchiveKey(params.originalFileName.replace(/\.[^.]+$/, "")) || "lesson";
  const timestamp = Date.now();
  const identifier = params.identifier
    ? sanitizeArchiveKey(params.identifier)
    : `${prefix}-${new Date().getFullYear()}-${timestamp.toString(36)}`;
  const fileName = `${baseFile}-${timestamp.toString(36)}${ext}`;

  const uploadUrl = `https://s3.us.archive.org/${encodeURIComponent(identifier)}/${encodeURIComponent(fileName)}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `LOW ${accessKey}:${secretKey}`,
      "Content-Type": params.mimeType || "audio/mpeg",
      "x-archive-auto-make-bucket": "1",
      "x-archive-meta-mediatype": "audio",
      "x-archive-meta-collection": "opensource_audio",
      "x-archive-meta-language": "ara",
      "x-archive-meta-title": encodeURIComponent(params.title || baseFile),
      "x-archive-meta-creator": encodeURIComponent(params.creator || "Islamic Audio Library"),
    },
    body: new Uint8Array(params.buffer),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`فشل الرفع إلى أرشيف الإنترنت (${res.status}): ${errText.slice(0, 200)}`);
  }

  return {
    identifier,
    fileName,
    audioUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(fileName)}`,
  };
}
