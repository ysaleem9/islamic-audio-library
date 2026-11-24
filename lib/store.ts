import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ALL_ADMIN_PERMISSIONS,
  type AdminPermission,
  type AdminUser,
  type AdminUserRecord,
  type DatabasePayload,
  type Lesson,
  type NotificationType,
  type Series,
  type SiteNotification,
  type SiteSettings,
} from "./types";
import { createSlug } from "./format";
import { getDescendantSeriesIds } from "./seriesTree";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface LocalDatabaseFile extends DatabasePayload {
  admins?: AdminUserRecord[];
}

// Mutex queue to make concurrent local DB read-modify-write operations atomic
let localDbWriteQueue: Promise<unknown> = Promise.resolve();
function withLocalDbLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = localDbWriteQueue.then(fn, fn);
  localDbWriteQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  const [salt, key] = (storedHash || "").split(":");
  if (!salt || !key) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (hashBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, keyBuffer);
}

export function toPublicAdminUser(record: AdminUserRecord): AdminUser {
  const { passwordHash, ...rest } = record;
  void passwordHash;
  return rest;
}

const DEFAULT_DATA: DatabasePayload = {
  settings: {
    id: "main",
    siteName: "مكتبة الأستاذة فاطمة",
    sheikhName: "الأستاذة فاطمة",
    sheikhTitle: "الدروس العلمية والشروحات المنهجية والمحاضرات الصوتية",
    bio: "منصة علمية دعوية مخصصة لنشر الدروس الصوتية المرتبة للأستاذة فاطمة في العقيدة والتفسير والفقه والرقائق والتربية، متاحة للاستماع المباشر والتحميل المجاني.",
    telegramUrl: "https://t.me/",
    youtubeUrl: "",
    whatsappUrl: "",
  },
  series: [
    {
      id: "ser-usul",
      title: "شرح الأصول الثلاثة وأدلتها",
      slug: "sharh-al-usul-al-thalatha",
      category: "عقيدة",
      description:
        "سلسلة علمية ميسّرة في شرح متن الأصول الثلاثة، تتناول المسائل الأربع، ومعرفة العبد ربه ودينه ونبيه محمداً ﷺ بأسلوب واضح يناسب طلاب العلم وعامة المسلمين.",
      status: "completed",
      coverAccent: "emerald",
      sortOrder: 1,
      createdAt: "2026-01-10T08:00:00.000Z",
    },
    {
      id: "ser-kahf",
      title: "تأملات وتدبرات في سورة الكهف",
      slug: "taamulat-surah-al-kahf",
      category: "تفسير",
      description:
        "وقفة تدبرية مع قصص سورة الكهف الأربع: أصحاب الكهف، وصاحب الجنتين، وموسى والخضر، وذي القرنين، واستنباط الدروس العملية للثبات على الدين.",
      status: "ongoing",
      coverAccent: "gold",
      sortOrder: 2,
      createdAt: "2026-02-05T08:00:00.000Z",
    },
    {
      id: "ser-fiqh",
      title: "فقه العبادات الميسر (كتاب الطهارة والصلاة)",
      slug: "fiqh-al-ibadat",
      category: "فقه",
      description:
        "دروس فقهية تطبيقية في أحكام الطهارة والوضوء والصلاة مع بيان الراجح من أقوال أهل العلم مقروناً بالدليل الصحيح.",
      status: "ongoing",
      coverAccent: "teal",
      sortOrder: 3,
      createdAt: "2026-03-01T08:00:00.000Z",
    },
  ],
  lessons: [
    {
      id: "les-usul-1",
      title: "الدرس الأول: مقدمة في أهمية تعلم العلم الشرعي والمسائل الأربع",
      seriesId: "ser-usul",
      episodeNumber: 1,
      category: "عقيدة",
      description:
        "مدخل مهم حول فضل طلب العلم والعمل به والدعوة إليه والصبر على الأذى فيه، مع شرح مختصر لسورة العصر.",
      notes:
        "• العلم قبل القول والعمل.\n• مراتب المسائل الأربع التي يجب على كل مسلم تعلمها.\n• لماذا قال الإمام الشافعي في سورة العصر ما قال.",
      audioUrl: "/sample-lesson.wav",
      archiveIdentifier: "",
      durationSeconds: 1845,
      publishedAt: "2026-01-12",
      playsCount: 412,
      isFeatured: true,
      createdAt: "2026-01-12T10:00:00.000Z",
    },
    {
      id: "les-usul-2",
      title: "الدرس الثاني: معرفة العبد ربه وعلامات الربوبية",
      seriesId: "ser-usul",
      episodeNumber: 2,
      category: "عقيدة",
      description:
        "شرح الأصل الأول وهو معرفة الله تعالى بآياته ومخلوقاته، وأنواع العبادة التي أمر الله بها.",
      notes: "• الفرق بين آيات الله الكونية والشرعية.\n• شروط قبول العبادة: الإخلاص والمتابعة.",
      audioUrl: "/sample-lesson.wav",
      archiveIdentifier: "",
      durationSeconds: 2130,
      publishedAt: "2026-01-19",
      playsCount: 328,
      isFeatured: false,
      createdAt: "2026-01-19T10:00:00.000Z",
    },
    {
      id: "les-kahf-1",
      title: "الدرس الأول: فتية آمنوا بربهم — دروس الثبات من قصة أصحاب الكهف",
      seriesId: "ser-kahf",
      episodeNumber: 1,
      category: "تفسير",
      description:
        "تأملات في مطلع سورة الكهف وقصة الفتية الذين فرّوا بدينهم، وكيف يحفظ الله عبده الصادق في أوقات الفتن.",
      notes: "• فضل قراءة سورة الكهف يوم الجمعة.\n• الصحبة الصالحة وأثرها في الثبات.",
      audioUrl: "/sample-lesson.wav",
      archiveIdentifier: "",
      durationSeconds: 2410,
      publishedAt: "2026-02-08",
      playsCount: 519,
      isFeatured: true,
      createdAt: "2026-02-08T10:00:00.000Z",
    },
    {
      id: "les-fiqh-1",
      title: "الدرس الأول: أحكام المياه وآداب قضاء الحاجة والوضوء",
      seriesId: "ser-fiqh",
      episodeNumber: 1,
      category: "فقه",
      description: "بيان أقسام المياه وصفة الوضوء الكامل كما ثبت عن النبي ﷺ مع أبرز الأخطاء الشائعة.",
      notes: "• الأصل في المياه الطهارة.\n• فرائض الوضوء وسننه.",
      audioUrl: "/sample-lesson.wav",
      archiveIdentifier: "",
      durationSeconds: 1960,
      publishedAt: "2026-03-04",
      playsCount: 274,
      isFeatured: false,
      createdAt: "2026-03-04T10:00:00.000Z",
    },
    {
      id: "les-single-1",
      title: "محاضرة إيمانية: كيف نحفظ قلوبنا في زمن الملهيات؟",
      seriesId: null,
      episodeNumber: null,
      category: "رقائق وتزكية",
      description:
        "محاضرة إيمانية مؤثرة حول أثر كثرة التشتت الرقمي على الخشوع وحضور القلب، ووصايا عملية لإحياء الصلة بالقرآن والذكر.",
      notes: "• الخلوة اليومية مع القرآن.\n• أثر غض البصر وحفظ الوقت على صفاء القلب.",
      audioUrl: "/sample-lesson.wav",
      archiveIdentifier: "",
      durationSeconds: 1520,
      publishedAt: "2026-03-14",
      playsCount: 685,
      isFeatured: true,
      createdAt: "2026-03-14T12:30:00.000Z",
    },
    {
      id: "les-single-2",
      title: "محاضرة: مفاتيح البركة في الوقت والرزق",
      seriesId: null,
      episodeNumber: null,
      category: "فوائد ومحاضرات",
      description:
        "وقفة مع الأسباب الشرعية للبركة: البكور، تقوى الله، صلة الرحم، والصدقة، وكيف يبارك الله في القليل.",
      notes: "• حديث: اللهم بارك لأمتي في بكورها.\n• الصدق في المعاملات وسبب محق البركة.",
      audioUrl: "/sample-lesson.wav",
      archiveIdentifier: "",
      durationSeconds: 2280,
      publishedAt: "2026-03-20",
      playsCount: 491,
      isFeatured: false,
      createdAt: "2026-03-20T18:00:00.000Z",
    },
  ],
};

export function isD1Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_D1_DATABASE_ID &&
      process.env.CLOUDFLARE_API_TOKEN
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function queryCloudflareD1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID || "79403c73437277b14962cde46f2dafe1";
  const dbId =
    process.env.CLOUDFLARE_D1_DATABASE_ID || "8c05913f-0451-4666-b720-154df952c173";
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is required for D1 queries");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`D1 query failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    result?: Array<{ results?: T[] }>;
  };
  return json.result?.[0]?.results || [];
}

let cachedSupabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!cachedSupabase) {
    cachedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return cachedSupabase;
}

async function readLocalDb(): Promise<LocalDatabaseFile> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as LocalDatabaseFile;
    return {
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
      series: Array.isArray(parsed.series) ? parsed.series : [],
      lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      admins: Array.isArray(parsed.admins) ? parsed.admins : [],
    };
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const initial: LocalDatabaseFile = { ...structuredClone(DEFAULT_DATA), admins: [] };
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

async function writeLocalDb(data: LocalDatabaseFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

function mapSupabaseSettings(row: Record<string, unknown> | null): SiteSettings {
  if (!row) return DEFAULT_DATA.settings;
  return {
    id: String(row.id ?? "main"),
    siteName: String(row.site_name ?? DEFAULT_DATA.settings.siteName),
    sheikhName: String(row.sheikh_name ?? DEFAULT_DATA.settings.sheikhName),
    sheikhTitle: String(row.sheikh_title ?? DEFAULT_DATA.settings.sheikhTitle),
    bio: String(row.bio ?? DEFAULT_DATA.settings.bio),
    telegramUrl: String(row.telegram_url ?? ""),
    youtubeUrl: String(row.youtube_url ?? ""),
    whatsappUrl: String(row.whatsapp_url ?? ""),
  };
}

const VALID_COVER_ACCENTS = new Set([
  "purple",
  "rose",
  "plum",
  "blush",
  "sage",
  "emerald",
  "gold",
  "teal",
  "slate",
]);

let d1ParentIdEnsured = false;
async function ensureD1SeriesParentIdColumn(): Promise<void> {
  if (d1ParentIdEnsured || !isD1Configured()) return;
  try {
    await queryCloudflareD1("ALTER TABLE series ADD COLUMN parent_id TEXT");
  } catch {
    // Column already exists — safe to ignore
  }
  d1ParentIdEnsured = true;
}

function mapSupabaseSeries(row: Record<string, unknown>): Series {
  const accent = String(row.cover_accent ?? "emerald");
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    parentId: row.parent_id ? String(row.parent_id) : null,
    category: String(row.category ?? "عام"),
    description: String(row.description ?? ""),
    status: row.status === "completed" ? "completed" : "ongoing",
    coverAccent: (VALID_COVER_ACCENTS.has(accent) ? accent : "emerald") as Series["coverAccent"],
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSupabaseLesson(row: Record<string, unknown>): Lesson {
  return {
    id: String(row.id),
    title: String(row.title),
    seriesId: row.series_id ? String(row.series_id) : null,
    episodeNumber: row.episode_number != null ? Number(row.episode_number) : null,
    category: String(row.category ?? "عام"),
    description: String(row.description ?? ""),
    notes: String(row.notes ?? ""),
    audioUrl: String(row.audio_url ?? ""),
    archiveIdentifier: String(row.archive_identifier ?? ""),
    durationSeconds: Number(row.duration_seconds ?? 0),
    publishedAt: String(row.published_at ?? ""),
    playsCount: Number(row.plays_count ?? 0),
    isFeatured: Boolean(row.is_featured),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getAllData(): Promise<DatabasePayload> {
  if (isD1Configured()) {
    const [settingsRows, seriesRows, lessonsRows] = await Promise.all([
      queryCloudflareD1("SELECT * FROM site_settings WHERE id = 'main' LIMIT 1"),
      queryCloudflareD1("SELECT * FROM series ORDER BY sort_order ASC, created_at DESC"),
      queryCloudflareD1("SELECT * FROM lessons ORDER BY published_at DESC, created_at DESC"),
    ]);
    return {
      settings: mapSupabaseSettings(settingsRows[0] || null),
      series: seriesRows.map(mapSupabaseSeries),
      lessons: lessonsRows.map(mapSupabaseLesson),
    };
  }

  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    db.series.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
    db.lessons.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.createdAt.localeCompare(a.createdAt));
    return db;
  }

  const supabase = getSupabase();
  const [settingsRes, seriesRes, lessonsRes] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
    supabase.from("series").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("lessons").select("*").order("published_at", { ascending: false }).order("created_at", { ascending: false }),
  ]);

  if (settingsRes.error) throw new Error(settingsRes.error.message);
  if (seriesRes.error) throw new Error(seriesRes.error.message);
  if (lessonsRes.error) throw new Error(lessonsRes.error.message);

  return {
    settings: mapSupabaseSettings(settingsRes.data),
    series: (seriesRes.data || []).map(mapSupabaseSeries),
    lessons: (lessonsRes.data || []).map(mapSupabaseLesson),
  };
}

export async function getSeriesByIdOrSlug(idOrSlug: string): Promise<{
  settings: SiteSettings;
  series: Series;
  lessons: Lesson[];
} | null> {
  const data = await getAllData();
  const decoded = decodeURIComponent(idOrSlug);
  const found = data.series.find((s) => s.id === decoded || s.slug === decoded);
  if (!found) return null;
  const lessons = data.lessons
    .filter((l) => l.seriesId === found.id)
    .sort((a, b) => {
      const epA = a.episodeNumber ?? Number.MAX_SAFE_INTEGER;
      const epB = b.episodeNumber ?? Number.MAX_SAFE_INTEGER;
      if (epA !== epB) return epA - epB;
      return a.publishedAt.localeCompare(b.publishedAt);
    });
  return { settings: data.settings, series: found, lessons };
}

export async function getLessonById(id: string): Promise<{
  settings: SiteSettings;
  lesson: Lesson;
  series: Series | null;
  relatedLessons: Lesson[];
} | null> {
  const data = await getAllData();
  const lesson = data.lessons.find((l) => l.id === id);
  if (!lesson) return null;
  const series = lesson.seriesId ? data.series.find((s) => s.id === lesson.seriesId) || null : null;
  const relatedLessons = series
    ? data.lessons
        .filter((l) => l.seriesId === series.id)
        .sort((a, b) => (a.episodeNumber ?? 9999) - (b.episodeNumber ?? 9999))
    : data.lessons.filter((l) => l.id !== lesson.id && l.category === lesson.category).slice(0, 5);
  return { settings: data.settings, lesson, series, relatedLessons };
}

export async function updateSettings(input: Partial<SiteSettings>): Promise<SiteSettings> {
  if (isD1Configured()) {
    const siteName = input.siteName?.trim() || DEFAULT_DATA.settings.siteName;
    const sheikhName = input.sheikhName?.trim() || DEFAULT_DATA.settings.sheikhName;
    const sheikhTitle = input.sheikhTitle?.trim() || "";
    const bio = input.bio?.trim() || "";
    const telegramUrl = input.telegramUrl?.trim() || "";
    const youtubeUrl = input.youtubeUrl?.trim() || "";
    const whatsappUrl = input.whatsappUrl?.trim() || "";

    await queryCloudflareD1(
      `INSERT INTO site_settings (id, site_name, sheikh_name, sheikh_title, bio, telegram_url, youtube_url, whatsapp_url, updated_at)
       VALUES ('main', ?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         site_name = excluded.site_name,
         sheikh_name = excluded.sheikh_name,
         sheikh_title = excluded.sheikh_title,
         bio = excluded.bio,
         telegram_url = excluded.telegram_url,
         youtube_url = excluded.youtube_url,
         whatsapp_url = excluded.whatsapp_url,
         updated_at = datetime('now')`,
      [siteName, sheikhName, sheikhTitle, bio, telegramUrl, youtubeUrl, whatsappUrl]
    );
    const rows = await queryCloudflareD1("SELECT * FROM site_settings WHERE id = 'main' LIMIT 1");
    return mapSupabaseSettings(rows[0] || null);
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      db.settings = {
        ...db.settings,
        siteName: input.siteName?.trim() || db.settings.siteName,
        sheikhName: input.sheikhName?.trim() || db.settings.sheikhName,
        sheikhTitle: input.sheikhTitle?.trim() ?? db.settings.sheikhTitle,
        bio: input.bio?.trim() ?? db.settings.bio,
        telegramUrl: input.telegramUrl?.trim() ?? db.settings.telegramUrl,
        youtubeUrl: input.youtubeUrl?.trim() ?? db.settings.youtubeUrl,
        whatsappUrl: input.whatsappUrl?.trim() ?? db.settings.whatsappUrl,
      };
      await writeLocalDb(db);
      return db.settings;
    });
  }

  const supabase = getSupabase();
  const payload = {
    id: "main",
    site_name: input.siteName?.trim() || DEFAULT_DATA.settings.siteName,
    sheikh_name: input.sheikhName?.trim() || DEFAULT_DATA.settings.sheikhName,
    sheikh_title: input.sheikhTitle?.trim() || "",
    bio: input.bio?.trim() || "",
    telegram_url: input.telegramUrl?.trim() || "",
    youtube_url: input.youtubeUrl?.trim() || "",
    whatsapp_url: input.whatsappUrl?.trim() || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSupabaseSettings(data);
}

export async function createSeries(input: {
  title: string;
  parentId?: string | null;
  category: string;
  description?: string;
  status?: Series["status"];
  coverAccent?: Series["coverAccent"];
  sortOrder?: number;
}): Promise<Series> {
  const id = `ser-${crypto.randomBytes(5).toString("hex")}`;
  const slug = `${createSlug(input.title)}-${id.slice(-4)}`;
  const normalizedParentId = input.parentId && String(input.parentId).trim() ? String(input.parentId).trim() : null;
  const item: Series = {
    id,
    title: input.title.trim(),
    slug,
    parentId: normalizedParentId,
    category: input.category.trim() || "عام",
    description: (input.description || "").trim(),
    status: input.status === "completed" ? "completed" : "ongoing",
    coverAccent: input.coverAccent || "emerald",
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    createdAt: new Date().toISOString(),
  };

  if (isD1Configured()) {
    await ensureD1SeriesParentIdColumn();
    await queryCloudflareD1(
      `INSERT INTO series (id, title, slug, parent_id, category, description, status, cover_accent, sort_order, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
      [
        item.id,
        item.title,
        item.slug,
        item.parentId ?? null,
        item.category,
        item.description,
        item.status,
        item.coverAccent,
        item.sortOrder,
        item.createdAt,
      ]
    );
    return item;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      if (item.parentId && !db.series.some((s) => s.id === item.parentId)) {
        item.parentId = null;
      }
      db.series.push(item);
      await writeLocalDb(db);
      return item;
    });
  }

  const supabase = getSupabase();
  const insertPayload: Record<string, unknown> = {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    description: item.description,
    status: item.status,
    cover_accent: item.coverAccent,
    sort_order: item.sortOrder,
  };
  if (item.parentId !== undefined) {
    insertPayload.parent_id = item.parentId;
  }
  const { data, error } = await supabase
    .from("series")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSupabaseSeries(data);
}

export async function updateSeries(
  id: string,
  input: Partial<Pick<Series, "title" | "parentId" | "category" | "description" | "status" | "coverAccent" | "sortOrder">>
): Promise<Series | null> {
  const normalizedParentId =
    input.parentId !== undefined
      ? input.parentId && String(input.parentId).trim()
        ? String(input.parentId).trim()
        : null
      : undefined;

  if (normalizedParentId === id) {
    throw new Error("لا يمكن جعل السلسلة قائمة فرعية لنفسها");
  }

  if (isD1Configured()) {
    await ensureD1SeriesParentIdColumn();
    const allRows = await queryCloudflareD1("SELECT * FROM series");
    const allSeries = allRows.map(mapSupabaseSeries);
    const current = allSeries.find((s) => s.id === id);
    if (!current) return null;

    if (normalizedParentId) {
      const descendants = getDescendantSeriesIds(allSeries, id);
      if (descendants.has(normalizedParentId)) {
        throw new Error("لا يمكن نقل القائمة داخل إحدى قوائمها الفرعية");
      }
    }

    const updated: Series = {
      ...current,
      ...input,
      parentId: normalizedParentId !== undefined ? normalizedParentId : (current.parentId ?? null),
      title: input.title !== undefined ? input.title.trim() : current.title,
      category: input.category !== undefined ? input.category.trim() : current.category,
      description: input.description !== undefined ? input.description.trim() : current.description,
    };
    await queryCloudflareD1(
      `UPDATE series SET title = ?1, parent_id = ?2, category = ?3, description = ?4, status = ?5, cover_accent = ?6, sort_order = ?7 WHERE id = ?8`,
      [
        updated.title,
        updated.parentId ?? null,
        updated.category,
        updated.description,
        updated.status,
        updated.coverAccent,
        updated.sortOrder,
        id,
      ]
    );
    return updated;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      const idx = db.series.findIndex((s) => s.id === id);
      if (idx === -1) return null;

      if (normalizedParentId) {
        const descendants = getDescendantSeriesIds(db.series, id);
        if (descendants.has(normalizedParentId)) {
          throw new Error("لا يمكن نقل القائمة داخل إحدى قوائمها الفرعية");
        }
      }

      db.series[idx] = {
        ...db.series[idx],
        ...input,
        parentId:
          normalizedParentId !== undefined
            ? normalizedParentId
            : (db.series[idx].parentId ?? null),
        title: input.title !== undefined ? input.title.trim() : db.series[idx].title,
        category: input.category !== undefined ? input.category.trim() : db.series[idx].category,
        description: input.description !== undefined ? input.description.trim() : db.series[idx].description,
      };
      await writeLocalDb(db);
      return db.series[idx];
    });
  }

  const supabase = getSupabase();
  if (normalizedParentId) {
    const { data: allRows } = await supabase.from("series").select("*");
    const allSeries = (allRows || []).map(mapSupabaseSeries);
    const descendants = getDescendantSeriesIds(allSeries, id);
    if (descendants.has(normalizedParentId)) {
      throw new Error("لا يمكن نقل القائمة داخل إحدى قوائمها الفرعية");
    }
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (normalizedParentId !== undefined) patch.parent_id = normalizedParentId;
  if (input.category !== undefined) patch.category = input.category.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.status !== undefined) patch.status = input.status;
  if (input.coverAccent !== undefined) patch.cover_accent = input.coverAccent;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase.from("series").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSupabaseSeries(data) : null;
}

export async function deleteSeries(id: string): Promise<boolean> {
  if (isD1Configured()) {
    await ensureD1SeriesParentIdColumn();
    const existing = await queryCloudflareD1("SELECT parent_id FROM series WHERE id = ?1 LIMIT 1", [id]);
    const grandParentId = existing[0]?.parent_id ? String(existing[0].parent_id) : null;
    await queryCloudflareD1("UPDATE series SET parent_id = ?1 WHERE parent_id = ?2", [grandParentId, id]);
    await queryCloudflareD1("UPDATE lessons SET series_id = NULL WHERE series_id = ?1", [id]);
    await queryCloudflareD1("DELETE FROM series WHERE id = ?1", [id]);
    return true;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      const target = db.series.find((s) => s.id === id);
      if (!target) return false;
      const grandParentId = target.parentId ?? null;
      db.series = db.series
        .filter((s) => s.id !== id)
        .map((s) => (s.parentId === id ? { ...s, parentId: grandParentId } : s));
      db.lessons = db.lessons.map((l) => (l.seriesId === id ? { ...l, seriesId: null } : l));
      await writeLocalDb(db);
      return true;
    });
  }

  const supabase = getSupabase();
  const { data: targetRow } = await supabase.from("series").select("parent_id").eq("id", id).maybeSingle();
  const grandParentId = targetRow?.parent_id ?? null;
  await supabase.from("series").update({ parent_id: grandParentId }).eq("parent_id", id);
  const { error } = await supabase.from("series").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function createLesson(input: {
  title: string;
  seriesId?: string | null;
  episodeNumber?: number | null;
  category: string;
  description?: string;
  notes?: string;
  audioUrl: string;
  archiveIdentifier?: string;
  durationSeconds?: number;
  publishedAt?: string;
  isFeatured?: boolean;
}): Promise<Lesson> {
  const id = `les-${crypto.randomBytes(5).toString("hex")}`;
  const today = new Date().toISOString().slice(0, 10);
  const item: Lesson = {
    id,
    title: input.title.trim(),
    seriesId: input.seriesId ? input.seriesId : null,
    episodeNumber:
      input.episodeNumber !== undefined && input.episodeNumber !== null && !Number.isNaN(Number(input.episodeNumber))
        ? Number(input.episodeNumber)
        : null,
    category: input.category.trim() || "عام",
    description: (input.description || "").trim(),
    notes: (input.notes || "").trim(),
    audioUrl: input.audioUrl.trim(),
    archiveIdentifier: (input.archiveIdentifier || "").trim(),
    durationSeconds: Math.max(0, Math.round(Number(input.durationSeconds || 0))),
    publishedAt: (input.publishedAt || today).trim(),
    playsCount: 0,
    isFeatured: Boolean(input.isFeatured),
    createdAt: new Date().toISOString(),
  };

  if (isD1Configured()) {
    await queryCloudflareD1(
      `INSERT INTO lessons (id, title, series_id, episode_number, category, description, notes, audio_url, archive_identifier, duration_seconds, published_at, plays_count, is_featured, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0, ?12, ?13)`,
      [
        item.id,
        item.title,
        item.seriesId,
        item.episodeNumber,
        item.category,
        item.description,
        item.notes,
        item.audioUrl,
        item.archiveIdentifier,
        item.durationSeconds,
        item.publishedAt,
        item.isFeatured ? 1 : 0,
        item.createdAt,
      ]
    );
    return item;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      db.lessons.unshift(item);
      await writeLocalDb(db);
      return item;
    });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      id: item.id,
      title: item.title,
      series_id: item.seriesId,
      episode_number: item.episodeNumber,
      category: item.category,
      description: item.description,
      notes: item.notes,
      audio_url: item.audioUrl,
      archive_identifier: item.archiveIdentifier,
      duration_seconds: item.durationSeconds,
      published_at: item.publishedAt,
      plays_count: 0,
      is_featured: item.isFeatured,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSupabaseLesson(data);
}

export async function updateLesson(
  id: string,
  input: Partial<
    Pick<
      Lesson,
      | "title"
      | "seriesId"
      | "episodeNumber"
      | "category"
      | "description"
      | "notes"
      | "audioUrl"
      | "archiveIdentifier"
      | "durationSeconds"
      | "publishedAt"
      | "isFeatured"
    >
  >
): Promise<Lesson | null> {
  if (isD1Configured()) {
    const rows = await queryCloudflareD1("SELECT * FROM lessons WHERE id = ?1 LIMIT 1", [id]);
    if (!rows[0]) return null;
    const current = mapSupabaseLesson(rows[0]);
    const updated: Lesson = {
      ...current,
      ...input,
      title: input.title !== undefined ? input.title.trim() : current.title,
      audioUrl: input.audioUrl !== undefined ? input.audioUrl.trim() : current.audioUrl,
      category: input.category !== undefined ? input.category.trim() : current.category,
      description: input.description !== undefined ? input.description.trim() : current.description,
      notes: input.notes !== undefined ? input.notes.trim() : current.notes,
    };
    await queryCloudflareD1(
      `UPDATE lessons SET title = ?1, series_id = ?2, episode_number = ?3, category = ?4, description = ?5, notes = ?6, audio_url = ?7, archive_identifier = ?8, duration_seconds = ?9, published_at = ?10, is_featured = ?11 WHERE id = ?12`,
      [
        updated.title,
        updated.seriesId,
        updated.episodeNumber,
        updated.category,
        updated.description,
        updated.notes,
        updated.audioUrl,
        updated.archiveIdentifier,
        updated.durationSeconds,
        updated.publishedAt,
        updated.isFeatured ? 1 : 0,
        id,
      ]
    );
    return updated;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      const idx = db.lessons.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      db.lessons[idx] = {
        ...db.lessons[idx],
        ...input,
        title: input.title !== undefined ? input.title.trim() : db.lessons[idx].title,
        audioUrl: input.audioUrl !== undefined ? input.audioUrl.trim() : db.lessons[idx].audioUrl,
        category: input.category !== undefined ? input.category.trim() : db.lessons[idx].category,
        description: input.description !== undefined ? input.description.trim() : db.lessons[idx].description,
        notes: input.notes !== undefined ? input.notes.trim() : db.lessons[idx].notes,
      };
      await writeLocalDb(db);
      return db.lessons[idx];
    });
  }

  const supabase = getSupabase();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.seriesId !== undefined) patch.series_id = input.seriesId;
  if (input.episodeNumber !== undefined) patch.episode_number = input.episodeNumber;
  if (input.category !== undefined) patch.category = input.category.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.notes !== undefined) patch.notes = input.notes.trim();
  if (input.audioUrl !== undefined) patch.audio_url = input.audioUrl.trim();
  if (input.archiveIdentifier !== undefined) patch.archive_identifier = input.archiveIdentifier.trim();
  if (input.durationSeconds !== undefined) patch.duration_seconds = Math.max(0, Math.round(input.durationSeconds));
  if (input.publishedAt !== undefined) patch.published_at = input.publishedAt;
  if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;

  const { data, error } = await supabase.from("lessons").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSupabaseLesson(data) : null;
}

export async function deleteLesson(id: string): Promise<boolean> {
  if (isD1Configured()) {
    await queryCloudflareD1("DELETE FROM lessons WHERE id = ?1", [id]);
    return true;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      const before = db.lessons.length;
      db.lessons = db.lessons.filter((l) => l.id !== id);
      if (db.lessons.length === before) return false;
      await writeLocalDb(db);
      return true;
    });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function incrementLessonPlay(id: string): Promise<void> {
  if (isD1Configured()) {
    await queryCloudflareD1(
      "UPDATE lessons SET plays_count = COALESCE(plays_count, 0) + 1 WHERE id = ?1",
      [id]
    );
    return;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      const found = db.lessons.find((l) => l.id === id);
      if (found) {
        found.playsCount += 1;
        await writeLocalDb(db);
      }
    });
  }

  const supabase = getSupabase();
  const { data } = await supabase.from("lessons").select("plays_count").eq("id", id).maybeSingle();
  if (data) {
    await supabase
      .from("lessons")
      .update({ plays_count: Number(data.plays_count || 0) + 1 })
      .eq("id", id);
  }
}

// ==========================================
// Multi-Admin & Granular Permissions Management
// ==========================================

function normalizePermissions(perms: unknown): AdminPermission[] {
  if (!Array.isArray(perms)) return [];
  return perms.filter((p): p is AdminPermission =>
    ALL_ADMIN_PERMISSIONS.includes(p as AdminPermission)
  );
}

function mapSupabaseAdmin(row: Record<string, unknown>): AdminUserRecord {
  const role = row.role === "owner" ? "owner" : "admin";
  let rawPerms = row.permissions;
  if (typeof rawPerms === "string") {
    try {
      rawPerms = JSON.parse(rawPerms);
    } catch {
      rawPerms = [];
    }
  }
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name ?? row.username),
    passwordHash: String(row.password_hash ?? ""),
    role,
    permissions:
      role === "owner" ? [...ALL_ADMIN_PERMISSIONS] : normalizePermissions(rawPerms),
    isActive: row.is_active !== false && row.is_active !== 0,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    lastActiveAt: row.last_active_at ? String(row.last_active_at) : undefined,
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  if (isD1Configured()) {
    const rows = await queryCloudflareD1("SELECT * FROM admin_users ORDER BY created_at ASC");
    return rows.map((r) => toPublicAdminUser(mapSupabaseAdmin(r)));
  }

  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    return (db.admins || []).map(toPublicAdminUser);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    // Graceful fallback if table hasn't been created in Supabase yet
    return [];
  }
  return (data || []).map((row) => toPublicAdminUser(mapSupabaseAdmin(row)));
}

export async function getAdminUserByUsername(username: string): Promise<AdminUserRecord | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;

  if (isD1Configured()) {
    const rows = await queryCloudflareD1(
      "SELECT * FROM admin_users WHERE lower(username) = ?1 LIMIT 1",
      [clean]
    );
    return rows[0] ? mapSupabaseAdmin(rows[0]) : null;
  }

  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    const found = (db.admins || []).find((a) => a.username.toLowerCase() === clean);
    return found || null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .ilike("username", clean)
    .maybeSingle();
  if (error || !data) return null;
  return mapSupabaseAdmin(data);
}

export async function getAdminUserById(id: string): Promise<AdminUserRecord | null> {
  if (isD1Configured()) {
    const rows = await queryCloudflareD1("SELECT * FROM admin_users WHERE id = ?1 LIMIT 1", [id]);
    return rows[0] ? mapSupabaseAdmin(rows[0]) : null;
  }

  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    return (db.admins || []).find((a) => a.id === id) || null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapSupabaseAdmin(data);
}

export async function touchAdminActivity(id: string): Promise<void> {
  const now = new Date().toISOString();
  if (isD1Configured()) {
    await queryCloudflareD1("UPDATE admin_users SET last_active_at = ?1 WHERE id = ?2", [
      now,
      id,
    ]);
    return;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      const admin = (db.admins || []).find((a) => a.id === id);
      if (admin) {
        admin.lastActiveAt = now;
        await writeLocalDb(db);
      }
    });
  }

  const supabase = getSupabase();
  await supabase.from("admin_users").update({ last_active_at: now }).eq("id", id);
}

export async function createAdminUser(input: {
  username: string;
  displayName: string;
  password: string;
  permissions: AdminPermission[];
}): Promise<AdminUser> {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
    throw new Error(
      "اسم المستخدم يجب أن يتكون من 3 إلى 32 حرفاً إنجليزياً أو رقماً (بدون مسافات)"
    );
  }
  if (!input.password || input.password.length < 6) {
    throw new Error("كلمة المرور يجب أن تكون 6 خانات على الأقل");
  }

  const existing = await getAdminUserByUsername(username);
  if (existing) {
    throw new Error("اسم المستخدم مستخدم بالفعل لمشرف آخر");
  }

  const record: AdminUserRecord = {
    id: `adm-${crypto.randomBytes(5).toString("hex")}`,
    username,
    displayName: input.displayName.trim() || username,
    passwordHash: hashPassword(input.password),
    role: "admin",
    permissions: normalizePermissions(input.permissions),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  if (isD1Configured()) {
    await queryCloudflareD1(
      `INSERT INTO admin_users (id, username, display_name, password_hash, role, permissions, is_active, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7)`,
      [
        record.id,
        record.username,
        record.displayName,
        record.passwordHash,
        record.role,
        JSON.stringify(record.permissions),
        record.createdAt,
      ]
    );
    return toPublicAdminUser(record);
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      db.admins = db.admins || [];
      if (db.admins.some((a) => a.username.toLowerCase() === username)) {
        throw new Error("اسم المستخدم مستخدم بالفعل لمشرف آخر");
      }
      db.admins.push(record);
      await writeLocalDb(db);
      return toPublicAdminUser(record);
    });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      id: record.id,
      username: record.username,
      display_name: record.displayName,
      password_hash: record.passwordHash,
      role: record.role,
      permissions: record.permissions,
      is_active: record.isActive,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toPublicAdminUser(mapSupabaseAdmin(data));
}

export async function updateAdminUser(
  id: string,
  input: {
    displayName?: string;
    password?: string;
    permissions?: AdminPermission[];
    isActive?: boolean;
  }
): Promise<AdminUser | null> {
  if (isD1Configured()) {
    const existing = await getAdminUserById(id);
    if (!existing) return null;
    const displayName =
      input.displayName !== undefined
        ? input.displayName.trim() || existing.username
        : existing.displayName;
    let passwordHash = existing.passwordHash;
    if (input.password && input.password.trim()) {
      if (input.password.length < 6) {
        throw new Error("كلمة المرور يجب أن تكون 6 خانات على الأقل");
      }
      passwordHash = hashPassword(input.password);
    }
    const permissions =
      input.permissions !== undefined && existing.role !== "owner"
        ? normalizePermissions(input.permissions)
        : existing.permissions;
    const isActive =
      input.isActive !== undefined && existing.role !== "owner"
        ? Boolean(input.isActive)
        : existing.isActive;

    await queryCloudflareD1(
      `UPDATE admin_users SET display_name = ?1, password_hash = ?2, permissions = ?3, is_active = ?4 WHERE id = ?5`,
      [displayName, passwordHash, JSON.stringify(permissions), isActive ? 1 : 0, id]
    );
    return {
      ...toPublicAdminUser(existing),
      displayName,
      permissions,
      isActive,
    };
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      db.admins = db.admins || [];
      const idx = db.admins.findIndex((a) => a.id === id);
      if (idx === -1) return null;

      const current = db.admins[idx];
      if (input.displayName !== undefined) {
        current.displayName = input.displayName.trim() || current.username;
      }
      if (input.password && input.password.trim()) {
        if (input.password.length < 6) {
          throw new Error("كلمة المرور يجب أن تكون 6 خانات على الأقل");
        }
        current.passwordHash = hashPassword(input.password);
      }
      if (input.permissions !== undefined && current.role !== "owner") {
        current.permissions = normalizePermissions(input.permissions);
      }
      if (input.isActive !== undefined && current.role !== "owner") {
        current.isActive = Boolean(input.isActive);
      }
      await writeLocalDb(db);
      return toPublicAdminUser(current);
    });
  }

  const supabase = getSupabase();
  const patch: Record<string, unknown> = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName.trim();
  if (input.password && input.password.trim()) {
    if (input.password.length < 6) {
      throw new Error("كلمة المرور يجب أن تكون 6 خانات على الأقل");
    }
    patch.password_hash = hashPassword(input.password);
  }
  if (input.permissions !== undefined) {
    patch.permissions = normalizePermissions(input.permissions);
  }
  if (input.isActive !== undefined) {
    patch.is_active = Boolean(input.isActive);
  }

  const { data, error } = await supabase
    .from("admin_users")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPublicAdminUser(mapSupabaseAdmin(data)) : null;
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  if (isD1Configured()) {
    await queryCloudflareD1("DELETE FROM admin_users WHERE id = ?1 AND role != 'owner'", [id]);
    return true;
  }

  if (!isSupabaseConfigured()) {
    return withLocalDbLock(async () => {
      const db = await readLocalDb();
      db.admins = db.admins || [];
      const target = db.admins.find((a) => a.id === id);
      if (!target || target.role === "owner") return false;
      db.admins = db.admins.filter((a) => a.id !== id);
      await writeLocalDb(db);
      return true;
    });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ============================================================================
// Notifications (إعلانات ولقاءات إيمانية مع مدة صلاحية بالأيام)
// ============================================================================
function mapD1Notification(row: Record<string, unknown>): SiteNotification {
  return {
    id: String(row.id),
    type: row.type === "faith_meeting" ? "faith_meeting" : "announcement",
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    meetingDate: row.meeting_date ? String(row.meeting_date) : "",
    meetingTime: row.meeting_time ? String(row.meeting_time) : "",
    zoomUrl: row.zoom_url ? String(row.zoom_url) : "",
    durationDays: Math.max(1, Number(row.duration_days ?? 7)),
    expiresAt: String(row.expires_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

let d1NotificationsTableEnsured = false;
async function ensureD1NotificationsTable(): Promise<void> {
  if (d1NotificationsTableEnsured || !isD1Configured()) return;
  await queryCloudflareD1(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'announcement',
      title TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      meeting_date TEXT DEFAULT '',
      meeting_time TEXT DEFAULT '',
      zoom_url TEXT DEFAULT '',
      duration_days INTEGER NOT NULL DEFAULT 7,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  d1NotificationsTableEnsured = true;
}

export async function getNotifications(activeOnly = false): Promise<SiteNotification[]> {
  let list: SiteNotification[] = [];

  if (isD1Configured()) {
    await ensureD1NotificationsTable();
    const rows = await queryCloudflareD1(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    list = rows.map(mapD1Notification);
  } else {
    const db = await readLocalDb();
    list = Array.isArray(db.notifications) ? [...db.notifications] : [];
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  if (activeOnly) {
    const now = Date.now();
    return list.filter((n) => new Date(n.expiresAt).getTime() > now);
  }
  return list;
}

export async function createNotification(input: {
  type: NotificationType;
  title?: string;
  message?: string;
  meetingDate?: string;
  meetingTime?: string;
  zoomUrl?: string;
  durationDays?: number;
  saveDefaultDays?: boolean;
}): Promise<SiteNotification> {
  const type: NotificationType = input.type === "faith_meeting" ? "faith_meeting" : "announcement";
  const durationDays = Math.max(1, Math.min(365, Math.round(Number(input.durationDays || 7))));
  const nowDate = new Date();
  const createdAt = nowDate.toISOString();
  const expiresAt = new Date(nowDate.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const item: SiteNotification = {
    id: `ntf-${crypto.randomBytes(5).toString("hex")}`,
    type,
    title: String(input.title || "").trim(),
    message: String(input.message || "").trim(),
    meetingDate: String(input.meetingDate || "").trim(),
    meetingTime: String(input.meetingTime || "").trim(),
    zoomUrl: String(input.zoomUrl || "").trim(),
    durationDays,
    expiresAt,
    createdAt,
  };

  if (isD1Configured()) {
    await ensureD1NotificationsTable();
    await queryCloudflareD1(
      `INSERT INTO notifications (id, type, title, message, meeting_date, meeting_time, zoom_url, duration_days, expires_at, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
      [
        item.id,
        item.type,
        item.title,
        item.message,
        item.meetingDate || "",
        item.meetingTime || "",
        item.zoomUrl || "",
        item.durationDays,
        item.expiresAt,
        item.createdAt,
      ]
    );
    return item;
  }

  return withLocalDbLock(async () => {
    const db = await readLocalDb();
    db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
    db.notifications.unshift(item);
    if (input.saveDefaultDays) {
      db.settings.notificationDefaultDays = durationDays;
    }
    await writeLocalDb(db);
    return item;
  });
}

export async function deleteNotification(id: string): Promise<boolean> {
  if (isD1Configured()) {
    await ensureD1NotificationsTable();
    await queryCloudflareD1("DELETE FROM notifications WHERE id = ?1", [id]);
    return true;
  }

  return withLocalDbLock(async () => {
    const db = await readLocalDb();
    db.notifications = (db.notifications || []).filter((n) => n.id !== id);
    await writeLocalDb(db);
    return true;
  });
}
