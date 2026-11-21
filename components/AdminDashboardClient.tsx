"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CloudUpload,
  Database,
  DownloadCloud,
  Edit3,
  ExternalLink,
  Headphones,
  HelpCircle,
  Layers,
  Loader2,
  LogOut,
  Play,
  Plus,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  type DatabasePayload,
  type Lesson,
  type Series,
  type SiteSettings,
} from "@/lib/types";
import { formatDuration, parseDurationInput } from "@/lib/format";
import { useAudioPlayer } from "./AudioPlayerContext";

interface AdminConfig {
  supabaseConfigured: boolean;
  archiveConfigured: boolean;
  isDefaultCredentials: boolean;
}

interface ArchiveResolvedTrack {
  name: string;
  title: string;
  downloadUrl: string;
  durationSeconds: number;
  sizeBytes: number;
  format: string;
  selected: boolean;
}

type AdminTab = "lessons" | "import" | "series" | "settings" | "guide";

export function AdminDashboardClient({
  initialData,
  config,
}: {
  initialData: DatabasePayload;
  config: AdminConfig;
}) {
  const router = useRouter();
  const { playLesson } = useAudioPlayer();

  const [tab, setTab] = useState<AdminTab>("lessons");
  const [data, setData] = useState<DatabasePayload>(initialData);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Lesson form state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSeriesId, setLessonSeriesId] = useState("");
  const [lessonEpisode, setLessonEpisode] = useState("");
  const [lessonCategory, setLessonCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [lessonAudioUrl, setLessonAudioUrl] = useState("");
  const [lessonArchiveId, setLessonArchiveId] = useState("");
  const [lessonDurationText, setLessonDurationText] = useState("");
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().slice(0, 10));
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);

  // Internet Archive batch importer state
  const [archiveUrlInput, setArchiveUrlInput] = useState("");
  const [resolvingArchive, setResolvingArchive] = useState(false);
  const [archiveMeta, setArchiveMeta] = useState<{ identifier: string; itemTitle: string } | null>(null);
  const [archiveTracks, setArchiveTracks] = useState<ArchiveResolvedTrack[]>([]);
  const [importSeriesId, setImportSeriesId] = useState("");
  const [importCategory, setImportCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [importingTracks, setImportingTracks] = useState(false);

  // Series form state
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesCategory, setSeriesCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [seriesDescription, setSeriesDescription] = useState("");
  const [seriesStatus, setSeriesStatus] = useState<Series["status"]>("ongoing");
  const [seriesAccent, setSeriesAccent] = useState<Series["coverAccent"]>("emerald");
  const [seriesSortOrder, setSeriesSortOrder] = useState("0");
  const [savingSeries, setSavingSeries] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(initialData.settings);
  const [savingSettings, setSavingSettings] = useState(false);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshData = async () => {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (res.ok) {
      const fresh = (await res.json()) as DatabasePayload;
      setData(fresh);
      setSettingsForm(fresh.settings);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // Detect audio duration in browser before uploading
  const detectLocalAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const dur = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
        URL.revokeObjectURL(url);
        resolve(dur);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      audio.src = url;
    });
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    setNotice(null);

    try {
      const detectedDuration = await detectLocalAudioDuration(file);
      if (detectedDuration > 0 && !lessonDurationText) {
        setLessonDurationText(formatDuration(detectedDuration));
      }
      if (!lessonTitle) {
        setLessonTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", lessonTitle || file.name.replace(/\.[^.]+$/, ""));
      if (lessonArchiveId) fd.append("identifier", lessonArchiveId);

      const res = await fetch("/api/archive/upload", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) {
        showNotice("error", result.error || "فشل رفع الملف الصوتي");
        return;
      }

      setLessonAudioUrl(result.audioUrl);
      if (result.identifier) setLessonArchiveId(result.identifier);
      showNotice("success", result.message || "تم رفع الملف الصوتي بنجاح");
    } catch {
      showNotice("error", "حدث خطأ أثناء رفع الملف");
    } finally {
      setUploadingAudio(false);
      e.target.value = "";
    }
  };

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonSeriesId("");
    setLessonEpisode("");
    setLessonCategory(DEFAULT_CATEGORIES[0]);
    setLessonAudioUrl("");
    setLessonArchiveId("");
    setLessonDurationText("");
    setLessonDate(new Date().toISOString().slice(0, 10));
    setLessonDescription("");
    setLessonNotes("");
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonSeriesId(lesson.seriesId || "");
    setLessonEpisode(lesson.episodeNumber != null ? String(lesson.episodeNumber) : "");
    setLessonCategory(lesson.category);
    setLessonAudioUrl(lesson.audioUrl);
    setLessonArchiveId(lesson.archiveIdentifier || "");
    setLessonDurationText(lesson.durationSeconds ? formatDuration(lesson.durationSeconds) : "");
    setLessonDate(lesson.publishedAt || new Date().toISOString().slice(0, 10));
    setLessonDescription(lesson.description || "");
    setLessonNotes(lesson.notes || "");
    setTab("lessons");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLesson(true);
    setNotice(null);

    const payload = {
      title: lessonTitle,
      seriesId: lessonSeriesId || null,
      episodeNumber: lessonEpisode ? Number(lessonEpisode) : null,
      category: lessonCategory,
      audioUrl: lessonAudioUrl,
      archiveIdentifier: lessonArchiveId,
      durationSeconds: parseDurationInput(lessonDurationText),
      publishedAt: lessonDate,
      description: lessonDescription,
      notes: lessonNotes,
    };

    try {
      const url = editingLessonId ? `/api/lessons/${editingLessonId}` : "/api/lessons";
      const method = editingLessonId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        showNotice("error", result.error || "تعذر حفظ الدرس");
        return;
      }
      await refreshData();
      resetLessonForm();
      showNotice("success", editingLessonId ? "تم تحديث الدرس بنجاح" : "تم نشر الدرس بنجاح");
    } catch {
      showNotice("error", "حدث خطأ أثناء حفظ الدرس");
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الدرس؟")) return;
    const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshData();
      showNotice("success", "تم حذف الدرس");
    }
  };

  // Archive importer handlers
  const handleResolveArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    setResolvingArchive(true);
    setNotice(null);
    setArchiveMeta(null);
    setArchiveTracks([]);

    try {
      const res = await fetch("/api/archive/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: archiveUrlInput }),
      });
      const result = await res.json();
      if (!res.ok) {
        showNotice("error", result.error || "تعذر قراءة الملفات من أرشيف الإنترنت");
        return;
      }
      setArchiveMeta({ identifier: result.identifier, itemTitle: result.itemTitle });
      setArchiveTracks(
        (result.files || []).map((f: Omit<ArchiveResolvedTrack, "selected">) => ({
          ...f,
          selected: true,
        }))
      );
      showNotice("success", `تم العثور على ${result.files.length} ملف صوتي جاهز للاستيراد.`);
    } catch {
      showNotice("error", "تعذر الاتصال بـ archive.org");
    } finally {
      setResolvingArchive(false);
    }
  };

  const handleBatchImport = async () => {
    const selected = archiveTracks.filter((t) => t.selected);
    if (selected.length === 0 || !archiveMeta) return;

    setImportingTracks(true);
    setNotice(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const existingCountInSeries = importSeriesId
        ? data.lessons.filter((l) => l.seriesId === importSeriesId).length
        : 0;

      const lessonsPayload = selected.map((track, idx) => ({
        title: track.title,
        seriesId: importSeriesId || null,
        episodeNumber: importSeriesId ? existingCountInSeries + idx + 1 : null,
        category: importCategory,
        audioUrl: track.downloadUrl,
        archiveIdentifier: archiveMeta.identifier,
        durationSeconds: track.durationSeconds,
        publishedAt: today,
      }));

      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessons: lessonsPayload }),
      });
      const result = await res.json();
      if (!res.ok) {
        showNotice("error", result.error || "فشل استيراد الدروس");
        return;
      }
      await refreshData();
      setArchiveTracks([]);
      setArchiveMeta(null);
      setArchiveUrlInput("");
      showNotice("success", `تم استيراد ${result.count} دروس صوتية من أرشيف الإنترنت بنجاح!`);
      setTab("lessons");
    } catch {
      showNotice("error", "حدث خطأ أثناء الاستيراد");
    } finally {
      setImportingTracks(false);
    }
  };

  // Series handlers
  const resetSeriesForm = () => {
    setEditingSeriesId(null);
    setSeriesTitle("");
    setSeriesCategory(DEFAULT_CATEGORIES[0]);
    setSeriesDescription("");
    setSeriesStatus("ongoing");
    setSeriesAccent("emerald");
    setSeriesSortOrder("0");
  };

  const startEditSeries = (s: Series) => {
    setEditingSeriesId(s.id);
    setSeriesTitle(s.title);
    setSeriesCategory(s.category);
    setSeriesDescription(s.description);
    setSeriesStatus(s.status);
    setSeriesAccent(s.coverAccent);
    setSeriesSortOrder(String(s.sortOrder));
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSeries(true);
    setNotice(null);

    try {
      const url = editingSeriesId ? `/api/series/${editingSeriesId}` : "/api/series";
      const method = editingSeriesId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: seriesTitle,
          category: seriesCategory,
          description: seriesDescription,
          status: seriesStatus,
          coverAccent: seriesAccent,
          sortOrder: Number(seriesSortOrder || 0),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        showNotice("error", result.error || "فشل حفظ السلسلة");
        return;
      }
      await refreshData();
      resetSeriesForm();
      showNotice("success", editingSeriesId ? "تم تحديث السلسلة" : "تم إنشاء السلسلة بنجاح");
    } catch {
      showNotice("error", "حدث خطأ أثناء حفظ السلسلة");
    } finally {
      setSavingSeries(false);
    }
  };

  const handleDeleteSeries = async (id: string) => {
    if (!window.confirm("حذف السلسلة سيجعل دروسها دروساً مفردة (لن تُحذف الدروس). هل تريد المتابعة؟")) {
      return;
    }
    const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshData();
      showNotice("success", "تم حذف السلسلة");
    }
  };

  // Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setNotice(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (!res.ok) {
        showNotice("error", "تعذر حفظ الإعدادات");
        return;
      }
      await refreshData();
      showNotice("success", "تم تحديث إعدادات الموقع بنجاح");
    } catch {
      showNotice("error", "حدث خطأ أثناء الحفظ");
    } finally {
      setSavingSettings(false);
    }
  };

  const seriesNameById = (id: string | null) =>
    id ? data.series.find((s) => s.id === id)?.title || "—" : "درس مفرد";

  return (
    <div className="min-h-screen bg-[#faf8f4] pb-28">
      {/* Top Admin Header */}
      <header className="bg-[#14533c] text-white border-b border-[#0e3d2b]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-[#f3dfb8]" />
            </div>
            <div>
              <h1 className="font-serif-arabic text-xl font-bold">لوحة إدارة المكتبة الصوتية</h1>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#d1e4dc] mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {config.supabaseConfigured ? "متصل بـ Supabase" : "وضع محلي (data/db.json)"}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <CloudUpload className="w-3 h-3" />
                  {config.archiveConfigured
                    ? "الرفع المباشر لـ Internet Archive مفعّل"
                    : "الرفع عبر روابط Archive أو محلياً"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs sm:text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>معاينة الموقع</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-xs sm:text-sm text-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {config.isDefaultCredentials && (
          <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>تنبيه أمني:</strong> تستخدم حالياً كلمة المرور الافتراضية للتجربة المحلية. قبل
              رفع الموقع على الإنترنت، اضبط <code className="font-mono">ADMIN_PASSWORD</code> و{" "}
              <code className="font-mono">AUTH_SECRET</code> في ملف <code className="font-mono">.env.local</code> أو إعدادات Vercel.
            </div>
          </div>
        )}

        {notice && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3.5 text-sm flex items-center justify-between gap-3 ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span className="flex items-center gap-2">
              {notice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {notice.text}
            </span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs underline opacity-75 hover:opacity-100"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          {[
            { id: "lessons", label: `الدروس (${data.lessons.length})`, icon: BookOpen },
            { id: "import", label: "استيراد من Archive.org", icon: DownloadCloud },
            { id: "series", label: `السلاسل (${data.series.length})`, icon: Layers },
            { id: "settings", label: "إعدادات الموقع والداعية", icon: Settings },
            { id: "guide", label: "دليل النشر المجاني", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as AdminTab)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-[#14533c] text-white shadow-sm"
                    : "bg-white border border-[#e6dfd1] text-[#45524c] hover:border-[#14533c]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: LESSONS */}
        {tab === "lessons" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveLesson}
              className="lg:col-span-5 rounded-2xl border border-[#e6dfd1] bg-white p-5 sm:p-6 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif-arabic text-xl font-bold text-[#14533c]">
                  {editingLessonId ? "تعديل الدرس الصوتي" : "إضافة درس صوتي جديد"}
                </h2>
                {editingLessonId && (
                  <button
                    type="button"
                    onClick={resetLessonForm}
                    className="text-xs text-[#5a6660] hover:text-red-600"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              {/* Audio Upload Box */}
              <div className="rounded-xl border-2 border-dashed border-[#cfd8d3] bg-[#f7faf8] p-4">
                <label className="block text-xs font-semibold text-[#14533c] mb-1.5">
                  رفع ملف صوتي (MP3 / M4A / OGG)
                </label>
                <p className="text-[11px] text-[#5a6660] mb-3">
                  {config.archiveConfigured
                    ? "سيتم رفع الملف تلقائياً إلى حسابك المجاني في Internet Archive."
                    : "سيتم حفظه محلياً للتجربة (أو يمكنك لصق رابط من archive.org بالأسفل)."}
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14533c] hover:bg-[#0e3d2b] text-white text-xs font-medium cursor-pointer transition-colors">
                  {uploadingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}
                  <span>{uploadingAudio ? "جارٍ الرفع..." : "اختر ملفاً صوتياً للرفع"}</span>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.m4a,.ogg,.opus,.wav"
                    onChange={handleAudioFileUpload}
                    disabled={uploadingAudio}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a2420] mb-1">
                  رابط الملف الصوتي المباشر (MP3) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={lessonAudioUrl}
                  onChange={(e) => setLessonAudioUrl(e.target.value)}
                  placeholder="https://archive.org/download/item-id/lesson-01.mp3"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm text-left focus:outline-none focus:border-[#14533c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a2420] mb-1">
                  عنوان الدرس *
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="مثال: الدرس الأول — مقدمة في طلب العلم"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm focus:outline-none focus:border-[#14533c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1a2420] mb-1">
                    السلسلة (اختياري)
                  </label>
                  <select
                    value={lessonSeriesId}
                    onChange={(e) => setLessonSeriesId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-sm bg-white focus:outline-none focus:border-[#14533c]"
                  >
                    <option value="">درس مفرد (بدون سلسلة)</option>
                    {data.series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1a2420] mb-1">
                    رقم الدرس في السلسلة
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lessonEpisode}
                    onChange={(e) => setLessonEpisode(e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm focus:outline-none focus:border-[#14533c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1a2420] mb-1">التصنيف</label>
                  <select
                    value={lessonCategory}
                    onChange={(e) => setLessonCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#dfd6c5] text-sm bg-white focus:outline-none focus:border-[#14533c]"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1a2420] mb-1">
                    المدة (د:ث)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={lessonDurationText}
                    onChange={(e) => setLessonDurationText(e.target.value)}
                    placeholder="35:00"
                    className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-sm text-left focus:outline-none focus:border-[#14533c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1a2420] mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#dfd6c5] text-xs focus:outline-none focus:border-[#14533c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a2420] mb-1">
                  نبذة مختصرة عن الدرس
                </label>
                <textarea
                  rows={2}
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm focus:outline-none focus:border-[#14533c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a2420] mb-1">
                  محاور وفوائد الدرس (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  placeholder="• المحور الأول&#10;• المحور الثاني"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm focus:outline-none focus:border-[#14533c]"
                />
              </div>

              <button
                type="submit"
                disabled={savingLesson}
                className="w-full py-3 rounded-xl bg-[#14533c] hover:bg-[#0e3d2b] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {savingLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingLessonId ? "حفظ التعديلات" : "نشر الدرس"}</span>
              </button>
            </form>

            {/* Lessons list */}
            <div className="lg:col-span-7 rounded-2xl border border-[#e6dfd1] bg-white p-5 sm:p-6">
              <h2 className="font-serif-arabic text-xl font-bold text-[#1a2420] mb-4">
                الدروس المنشورة ({data.lessons.length})
              </h2>

              {data.lessons.length === 0 ? (
                <p className="text-sm text-[#5a6660] py-10 text-center">
                  لا توجد دروس بعد. أضف أول درس من النموذج أو استورد من أرشيف الإنترنت.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-xl border border-[#ece5d8] p-3.5 flex items-center justify-between gap-3 hover:border-[#c8bca4] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5a6660] mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#eef5f1] text-[#14533c] font-medium">
                            {lesson.category}
                          </span>
                          <span>{seriesNameById(lesson.seriesId)}</span>
                          {lesson.durationSeconds > 0 && (
                            <span>• {formatDuration(lesson.durationSeconds)}</span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-[#1a2420] truncate">
                          {lesson.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => playLesson(lesson, data.lessons)}
                          title="تشغيل"
                          className="p-2 rounded-lg text-[#14533c] hover:bg-[#eef5f1] cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditLesson(lesson)}
                          title="تعديل"
                          className="p-2 rounded-lg text-[#5a6660] hover:bg-[#f4f0e8] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          title="حذف"
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERNET ARCHIVE BATCH IMPORTER */}
        {tab === "import" && (
          <div className="rounded-2xl border border-[#e6dfd1] bg-white p-6 space-y-6">
            <div>
              <h2 className="font-serif-arabic text-2xl font-bold text-[#14533c]">
                استيراد ذكي من Internet Archive (archive.org)
              </h2>
              <p className="text-sm text-[#5a6660] mt-1 leading-relaxed">
                ارفع ملفاتك الصوتية (أو سلسلة كاملة) مجاناً وبلا حدود على موقع{" "}
                <a
                  href="https://archive.org/upload"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#14533c] underline font-medium"
                >
                  archive.org/upload
                </a>{" "}
                ثم الصق رابط الصفحة هنا، وسنستخرج تلقائياً جميع ملفات MP3 ومددها لاستيرادها بضغطة زر!
              </p>
            </div>

            <form onSubmit={handleResolveArchive} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                dir="ltr"
                value={archiveUrlInput}
                onChange={(e) => setArchiveUrlInput(e.target.value)}
                placeholder="https://archive.org/details/your-item-identifier"
                className="flex-1 px-4 py-3 rounded-xl border border-[#dfd6c5] text-sm text-left focus:outline-none focus:border-[#14533c]"
              />
              <button
                type="submit"
                disabled={resolvingArchive}
                className="px-6 py-3 rounded-xl bg-[#14533c] hover:bg-[#0e3d2b] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {resolvingArchive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DownloadCloud className="w-4 h-4" />
                )}
                <span>جلب الملفات الصوتية</span>
              </button>
            </form>

            {archiveMeta && archiveTracks.length > 0 && (
              <div className="space-y-5 pt-4 border-t border-[#ece5d8]">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#faf8f4] p-4 rounded-xl border border-[#e6dfd1]">
                  <div>
                    <div className="text-xs text-[#5a6660]">العنصر على أرشيف الإنترنت:</div>
                    <div className="font-bold text-[#1a2420]">{archiveMeta.itemTitle}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={importSeriesId}
                      onChange={(e) => setImportSeriesId(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#dfd6c5] text-sm bg-white"
                    >
                      <option value="">استيراد كدروس مفردة</option>
                      {data.series.map((s) => (
                        <option key={s.id} value={s.id}>
                          إضافة إلى سلسلة: {s.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={importCategory}
                      onChange={(e) => setImportCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#dfd6c5] text-sm bg-white"
                    >
                      {DEFAULT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pl-1">
                  {archiveTracks.map((track, idx) => (
                    <div
                      key={track.name}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#ece5d8] bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={track.selected}
                        onChange={(e) => {
                          const next = [...archiveTracks];
                          next[idx] = { ...next[idx], selected: e.target.checked };
                          setArchiveTracks(next);
                        }}
                        className="w-4 h-4 accent-[#14533c]"
                      />
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => {
                          const next = [...archiveTracks];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setArchiveTracks(next);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#e6dfd1] text-sm focus:outline-none focus:border-[#14533c]"
                      />
                      <span className="text-xs text-[#5a6660] shrink-0" dir="ltr">
                        {track.durationSeconds > 0 ? formatDuration(track.durationSeconds) : "—"}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#f4f0e8] text-[#5a6660] shrink-0">
                        {track.sizeBytes > 0
                          ? `${(track.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : track.format}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleBatchImport}
                  disabled={importingTracks || archiveTracks.every((t) => !t.selected)}
                  className="px-6 py-3 rounded-xl bg-[#b88a44] hover:bg-[#9f7637] text-white font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {importingTracks ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    استيراد ({archiveTracks.filter((t) => t.selected).length}) دروس إلى الموقع
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SERIES */}
        {tab === "series" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveSeries}
              className="lg:col-span-5 rounded-2xl border border-[#e6dfd1] bg-white p-6 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif-arabic text-xl font-bold text-[#14533c]">
                  {editingSeriesId ? "تعديل السلسلة" : "إنشاء سلسلة علمية جديدة"}
                </h2>
                {editingSeriesId && (
                  <button
                    type="button"
                    onClick={resetSeriesForm}
                    className="text-xs text-[#5a6660] hover:text-red-600"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">اسم السلسلة *</label>
                <input
                  type="text"
                  required
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="مثال: شرح كتاب التوحيد"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm focus:outline-none focus:border-[#14533c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">التصنيف</label>
                  <select
                    value={seriesCategory}
                    onChange={(e) => setSeriesCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-sm bg-white"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">الحالة</label>
                  <select
                    value={seriesStatus}
                    onChange={(e) => setSeriesStatus(e.target.value as Series["status"])}
                    className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-sm bg-white"
                  >
                    <option value="ongoing">مستمرة</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">لون الشريط</label>
                  <select
                    value={seriesAccent}
                    onChange={(e) => setSeriesAccent(e.target.value as Series["coverAccent"])}
                    className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-sm bg-white"
                  >
                    <option value="emerald">أخضر زمردي</option>
                    <option value="gold">ذهبي تراثي</option>
                    <option value="teal">أزرق بترولي</option>
                    <option value="slate">كحلي هادئ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">الترتيب</label>
                  <input
                    type="number"
                    value={seriesSortOrder}
                    onChange={(e) => setSeriesSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">وصف السلسلة</label>
                <textarea
                  rows={3}
                  value={seriesDescription}
                  onChange={(e) => setSeriesDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dfd6c5] text-sm focus:outline-none focus:border-[#14533c]"
                />
              </div>

              <button
                type="submit"
                disabled={savingSeries}
                className="w-full py-3 rounded-xl bg-[#14533c] hover:bg-[#0e3d2b] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {savingSeries ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingSeriesId ? "حفظ تعديل السلسلة" : "إنشاء السلسلة"}</span>
              </button>
            </form>

            <div className="lg:col-span-7 rounded-2xl border border-[#e6dfd1] bg-white p-6">
              <h2 className="font-serif-arabic text-xl font-bold text-[#1a2420] mb-4">
                السلاسل الحالية ({data.series.length})
              </h2>
              <div className="space-y-3">
                {data.series.map((s) => {
                  const count = data.lessons.filter((l) => l.seriesId === s.id).length;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-[#ece5d8] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#eef5f1] text-[#14533c] font-medium">
                            {s.category}
                          </span>
                          <span className="text-[#5a6660]">{count} دروس</span>
                          <span className="text-[#5a6660]">
                            • {s.status === "completed" ? "مكتملة" : "مستمرة"}
                          </span>
                        </div>
                        <p className="font-bold text-[#1a2420]">{s.title}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditSeries(s)}
                          className="p-2 rounded-lg text-[#5a6660] hover:bg-[#f4f0e8] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSeries(s.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {tab === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="max-w-2xl rounded-2xl border border-[#e6dfd1] bg-white p-6 space-y-4"
          >
            <h2 className="font-serif-arabic text-2xl font-bold text-[#14533c]">
              إعدادات الموقع والداعية
            </h2>

            <div>
              <label className="block text-xs font-semibold mb-1">اسم الموقع</label>
              <input
                type="text"
                required
                value={settingsForm.siteName}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfd6c5] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">اسم الداعية / المتحدث</label>
              <input
                type="text"
                required
                value={settingsForm.sheikhName}
                onChange={(e) => setSettingsForm({ ...settingsForm, sheikhName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfd6c5] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">العنوان الفرعي</label>
              <input
                type="text"
                value={settingsForm.sheikhTitle}
                onChange={(e) => setSettingsForm({ ...settingsForm, sheikhTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfd6c5] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">النبذة التعريفية</label>
              <textarea
                rows={4}
                value={settingsForm.bio}
                onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfd6c5] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">رابط تيليجرام</label>
                <input
                  type="url"
                  dir="ltr"
                  value={settingsForm.telegramUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telegramUrl: e.target.value })}
                  placeholder="https://t.me/..."
                  className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-xs text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">رابط يوتيوب</label>
                <input
                  type="url"
                  dir="ltr"
                  value={settingsForm.youtubeUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-xs text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">رابط واتساب</label>
                <input
                  type="url"
                  dir="ltr"
                  value={settingsForm.whatsappUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappUrl: e.target.value })}
                  placeholder="https://whatsapp.com/channel/..."
                  className="w-full px-3 py-2 rounded-xl border border-[#dfd6c5] text-xs text-left"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 rounded-xl bg-[#14533c] hover:bg-[#0e3d2b] text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ الإعدادات</span>
            </button>
          </form>
        )}

        {/* TAB 5: FREE HOSTING & ARCHIVE GUIDE */}
        {tab === "guide" && (
          <div className="rounded-2xl border border-[#e6dfd1] bg-white p-6 space-y-6 max-w-4xl">
            <h2 className="font-serif-arabic text-2xl font-bold text-[#14533c]">
              دليل التشغيل والنشر المجاني 100% (بدون بطاقة بنكية)
            </h2>

            <div className="space-y-4 text-sm text-[#2f3b36] leading-relaxed">
              <div className="rounded-xl bg-[#faf8f4] border border-[#e6dfd1] p-4">
                <h3 className="font-bold text-[#14533c] mb-1.5">
                  1) تخزين الصوتيات مجاناً وبلا حدود على Internet Archive
                </h3>
                <ul className="list-disc pr-5 space-y-1.5">
                  <li>
                    أنشئ حساباً مجانياً على{" "}
                    <a href="https://archive.org/account/signup" target="_blank" rel="noreferrer" className="underline text-[#14533c]">
                      archive.org
                    </a>.
                  </li>
                  <li>
                    <strong>الطريقة الأولى (الأسرع للسلاسل):</strong> ارفع مجلد/سلسلة الدروس من{" "}
                    <code className="font-mono">archive.org/upload</code>، ثم انسخ رابط الصفحة والصقه في تبويب{" "}
                    <strong>«استيراد من Archive.org»</strong> هنا لاستيراد جميع الدروس بضغطة واحدة.
                  </li>
                  <li>
                    <strong>الطريقة الثانية (الرفع المباشر من لوحة التحكم):</strong> اذهب إلى{" "}
                    <code className="font-mono">https://archive.org/account/s3.php</code> واحصل على مفتاحي{" "}
                    <code className="font-mono">ARCHIVE_ACCESS_KEY</code> و{" "}
                    <code className="font-mono">ARCHIVE_SECRET_KEY</code> وأضفهما في إعدادات البيئة ليرفع الموقع الملفات مباشرة.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-[#faf8f4] border border-[#e6dfd1] p-4">
                <h3 className="font-bold text-[#14533c] mb-1.5">
                  2) نصيحة ذهبية لضغط الصوتيات قبل الرفع
                </h3>
                <p>
                  تحويل الدروس الصوتية إلى <strong>MP3 Mono بمعدل 48–64 kbps</strong> يجعل ساعة الدرس
                  حوالي 22 ميجابايت فقط مع صوت نقي جداً، ما يسرّع التشغيل للزوار أصحاب الإنترنت البطيء.
                  إذا كنت تستخدم أداة <code className="font-mono">ffmpeg</code>:
                </p>
                <pre
                  dir="ltr"
                  className="mt-2 p-3 rounded-lg bg-[#1a2420] text-[#e8f5ee] text-xs overflow-x-auto"
                >
                  ffmpeg -i input.mp3 -ac 1 -b:a 64k -ar 44100 output-lesson.mp3
                </pre>
              </div>

              <div className="rounded-xl bg-[#faf8f4] border border-[#e6dfd1] p-4">
                <h3 className="font-bold text-[#14533c] mb-1.5">
                  3) قاعدة البيانات المجانية (Supabase) والاستضافة المجانية (Vercel)
                </h3>
                <ol className="list-decimal pr-5 space-y-1.5">
                  <li>
                    أنشئ مشروعاً مجانياً على{" "}
                    <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline text-[#14533c]">
                      supabase.com
                    </a>{" "}
                    وشغّل محتوى الملف <code className="font-mono">supabase/schema.sql</code> داخل SQL Editor.
                  </li>
                  <li>
                    ارفع هذا المشروع إلى حسابك على <strong>GitHub</strong>، ثم اربطه بـ{" "}
                    <a href="https://vercel.com" target="_blank" rel="noreferrer" className="underline text-[#14533c]">
                      vercel.com
                    </a>{" "}
                    مجاناً.
                  </li>
                  <li>
                    أضف متغيرات البيئة الموجودة في <code className="font-mono">.env.example</code> داخل
                    إعدادات مشروعك في Vercel (<code className="font-mono">ADMIN_PASSWORD</code>،{" "}
                    <code className="font-mono">AUTH_SECRET</code>،{" "}
                    <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>،{" "}
                    <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>، ومفاتيح Archive إن أردت).
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
