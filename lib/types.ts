export interface SiteSettings {
  id: string;
  siteName: string;
  sheikhName: string;
  sheikhTitle: string;
  bio: string;
  telegramUrl: string;
  youtubeUrl: string;
  whatsappUrl: string;
  notificationDefaultDays?: number;
}

export type NotificationType = "announcement" | "faith_meeting";

export interface SiteNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meetingDate?: string;
  meetingTime?: string;
  zoomUrl?: string;
  durationDays: number;
  expiresAt: string;
  createdAt: string;
}

export type SeriesStatus = "ongoing" | "completed";
export type CoverAccent =
  | "purple"
  | "rose"
  | "plum"
  | "blush"
  | "sage"
  | "emerald"
  | "gold"
  | "teal"
  | "slate";

export interface Series {
  id: string;
  title: string;
  slug: string;
  parentId?: string | null;
  category: string;
  description: string;
  status: SeriesStatus;
  coverAccent: CoverAccent;
  sortOrder: number;
  createdAt: string;
}

export interface MindMapImage {
  url: string;
  title?: string;
}

export function normalizeMindMapImages(val: unknown): MindMapImage[] {
  let arr: unknown[] = [];
  if (Array.isArray(val)) {
    arr = val;
  } else if (typeof val === "string" && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      return [];
    }
  }
  const result: MindMapImage[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      const url = item.trim();
      if (url) result.push({ url, title: "" });
    } else if (item && typeof item === "object" && "url" in item) {
      const url = String((item as { url?: unknown }).url || "").trim();
      const title = String((item as { title?: unknown }).title || "").trim();
      if (url) result.push({ url, title });
    }
  }
  return result;
}

export interface Lesson {
  id: string;
  title: string;
  seriesId: string | null;
  episodeNumber: number | null;
  category: string;
  description: string;
  notes: string;
  audioUrl: string;
  archiveIdentifier: string;
  durationSeconds: number;
  publishedAt: string;
  playsCount: number;
  isFeatured: boolean;
  mindMapImages?: MindMapImage[];
  createdAt: string;
}

export type AdminPermission =
  | "manage_lessons"
  | "import_archive"
  | "manage_series"
  | "manage_settings"
  | "manage_admins";

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "manage_lessons",
  "import_archive",
  "manage_series",
  "manage_settings",
  "manage_admins",
];

export const ADMIN_PERMISSION_LABELS: Record<
  AdminPermission,
  { title: string; description: string }
> = {
  manage_lessons: {
    title: "إدارة الدروس الصوتية",
    description: "إضافة، رفع، تعديل، وحذف الدروس الصوتية",
  },
  import_archive: {
    title: "الاستيراد من Archive.org",
    description: "جلب واستيراد السلاسل والملفات الصوتية من أرشيف الإنترنت",
  },
  manage_series: {
    title: "إدارة السلاسل العلمية",
    description: "إنشاء وتعديل وحذف السلاسل العلمية وترتيبها",
  },
  manage_settings: {
    title: "إعدادات الموقع والأستاذة",
    description: "تعديل اسم الموقع، النبذة التعريفية، وروابط التواصل",
  },
  manage_admins: {
    title: "إدارة المشرفين والصلاحيات",
    description: "إضافة مشرفين جدد، تحديد صلاحياتهم، أو إيقاف حساباتهم",
  },
};

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: "owner" | "admin";
  permissions: AdminPermission[];
  isActive: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

export interface AdminUserRecord extends AdminUser {
  passwordHash: string;
}

export interface DatabasePayload {
  settings: SiteSettings;
  series: Series[];
  lessons: Lesson[];
  notifications?: SiteNotification[];
}

export const DEFAULT_CATEGORIES = [
  "تفسير القرآن الكريم",
  "العقيدة",
  "الفقه",
  "الرقائق والتزكية",
  "التربية الإيمانية",
  "الدروس والمحاضرات",
] as const;
