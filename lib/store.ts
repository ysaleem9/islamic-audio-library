import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DatabasePayload, Lesson, Series, SiteSettings } from "./types";
import { createSlug } from "./format";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_DATA: DatabasePayload = {
  settings: {
    id: "main",
    siteName: "مكتبة الداعية فاطمة",
    sheikhName: "الداعية فاطمة",
    sheikhTitle: "الدروس العلمية والشروحات المنهجية والمحاضرات الصوتية",
    bio: "منصة علمية دعوية مخصصة لنشر الدروس الصوتية المرتبة للداعية فاطمة في العقيدة والتفسير والفقه والرقائق والتربية، متاحة للاستماع المباشر والتحميل المجاني.",
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

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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

async function readLocalDb(): Promise<DatabasePayload> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DatabasePayload;
    return {
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
      series: Array.isArray(parsed.series) ? parsed.series : [],
      lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
    };
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf8");
    return structuredClone(DEFAULT_DATA);
  }
}

async function writeLocalDb(data: DatabasePayload): Promise<void> {
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

function mapSupabaseSeries(row: Record<string, unknown>): Series {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    category: String(row.category ?? "عام"),
    description: String(row.description ?? ""),
    status: row.status === "completed" ? "completed" : "ongoing",
    coverAccent: (["emerald", "gold", "teal", "slate"].includes(String(row.cover_accent))
      ? String(row.cover_accent)
      : "emerald") as Series["coverAccent"],
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
  if (!isSupabaseConfigured()) {
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
  category: string;
  description?: string;
  status?: Series["status"];
  coverAccent?: Series["coverAccent"];
  sortOrder?: number;
}): Promise<Series> {
  const id = `ser-${crypto.randomBytes(5).toString("hex")}`;
  const slug = `${createSlug(input.title)}-${id.slice(-4)}`;
  const item: Series = {
    id,
    title: input.title.trim(),
    slug,
    category: input.category.trim() || "عام",
    description: (input.description || "").trim(),
    status: input.status === "completed" ? "completed" : "ongoing",
    coverAccent: input.coverAccent || "emerald",
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    db.series.push(item);
    await writeLocalDb(db);
    return item;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("series")
    .insert({
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      description: item.description,
      status: item.status,
      cover_accent: item.coverAccent,
      sort_order: item.sortOrder,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSupabaseSeries(data);
}

export async function updateSeries(
  id: string,
  input: Partial<Pick<Series, "title" | "category" | "description" | "status" | "coverAccent" | "sortOrder">>
): Promise<Series | null> {
  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    const idx = db.series.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    db.series[idx] = {
      ...db.series[idx],
      ...input,
      title: input.title !== undefined ? input.title.trim() : db.series[idx].title,
      category: input.category !== undefined ? input.category.trim() : db.series[idx].category,
      description: input.description !== undefined ? input.description.trim() : db.series[idx].description,
    };
    await writeLocalDb(db);
    return db.series[idx];
  }

  const supabase = getSupabase();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
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
  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    const before = db.series.length;
    db.series = db.series.filter((s) => s.id !== id);
    db.lessons = db.lessons.map((l) => (l.seriesId === id ? { ...l, seriesId: null } : l));
    if (db.series.length === before) return false;
    await writeLocalDb(db);
    return true;
  }

  const supabase = getSupabase();
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

  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    db.lessons.unshift(item);
    await writeLocalDb(db);
    return item;
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
  if (!isSupabaseConfigured()) {
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
  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    const before = db.lessons.length;
    db.lessons = db.lessons.filter((l) => l.id !== id);
    if (db.lessons.length === before) return false;
    await writeLocalDb(db);
    return true;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function incrementLessonPlay(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = await readLocalDb();
    const found = db.lessons.find((l) => l.id === id);
    if (found) {
      found.playsCount += 1;
      await writeLocalDb(db);
    }
    return;
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
