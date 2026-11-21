export interface SiteSettings {
  id: string;
  siteName: string;
  sheikhName: string;
  sheikhTitle: string;
  bio: string;
  telegramUrl: string;
  youtubeUrl: string;
  whatsappUrl: string;
}

export type SeriesStatus = "ongoing" | "completed";
export type CoverAccent = "emerald" | "gold" | "teal" | "slate";

export interface Series {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  status: SeriesStatus;
  coverAccent: CoverAccent;
  sortOrder: number;
  createdAt: string;
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
  createdAt: string;
}

export interface DatabasePayload {
  settings: SiteSettings;
  series: Series[];
  lessons: Lesson[];
}

export const DEFAULT_CATEGORIES = [
  "عقيدة",
  "تفسير",
  "فقه",
  "حديث",
  "سيرة",
  "رقائق وتزكية",
  "الأسرة والتربية",
  "فوائد ومحاضرات",
] as const;
