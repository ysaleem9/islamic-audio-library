"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CloudUpload,
  CornerDownLeft,
  Database,
  DownloadCloud,
  Edit3,
  ExternalLink,
  Folder,
  FolderPlus,
  Headphones,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  ADMIN_PERMISSION_LABELS,
  ALL_ADMIN_PERMISSIONS,
  DEFAULT_CATEGORIES,
  type AdminPermission,
  type AdminUser,
  type DatabasePayload,
  type Lesson,
  type Series,
  type SiteSettings,
} from "@/lib/types";
import { formatDuration, parseDurationInput } from "@/lib/format";
import {
  flattenSeriesTree,
  getDescendantSeriesIds,
  getSeriesPathLabel,
} from "@/lib/seriesTree";
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

type AdminTab = "lessons" | "import" | "series" | "settings" | "admins" | "guide";

export function AdminDashboardClient({
  initialData,
  currentAdmin,
  initialAdmins,
  config,
}: {
  initialData: DatabasePayload;
  currentAdmin: AdminUser;
  initialAdmins: AdminUser[];
  config: AdminConfig;
}) {
  const router = useRouter();
  const { playLesson } = useAudioPlayer();

  const canPermission = useCallback(
    (perm: AdminPermission) =>
      currentAdmin.role === "owner" || currentAdmin.permissions.includes(perm),
    [currentAdmin]
  );

  const getInitialTab = (): AdminTab => {
    if (canPermission("manage_lessons")) return "lessons";
    if (canPermission("import_archive")) return "import";
    if (canPermission("manage_series")) return "series";
    if (canPermission("manage_settings")) return "settings";
    if (canPermission("manage_admins")) return "admins";
    return "guide";
  };

  const [tab, setTab] = useState<AdminTab>(getInitialTab);
  const [data, setData] = useState<DatabasePayload>(initialData);
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

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
  const [seriesParentId, setSeriesParentId] = useState<string>("");
  const [seriesCategory, setSeriesCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [seriesDescription, setSeriesDescription] = useState("");
  const [seriesStatus, setSeriesStatus] = useState<Series["status"]>("ongoing");
  const [seriesAccent, setSeriesAccent] = useState<Series["coverAccent"]>("emerald");
  const [seriesSortOrder, setSeriesSortOrder] = useState("0");
  const [savingSeries, setSavingSeries] = useState(false);

  // Hierarchical flattened list of series for tree UI and dropdowns
  const flattenedSeries = useMemo(() => flattenSeriesTree(data.series), [data.series]);

  // Exclude self & descendants from parent options when editing a series
  const availableParentOptions = useMemo(() => {
    if (!editingSeriesId) return flattenedSeries;
    const blocked = getDescendantSeriesIds(data.series, editingSeriesId);
    return flattenedSeries.filter((item) => !blocked.has(item.series.id));
  }, [flattenedSeries, data.series, editingSeriesId]);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(initialData.settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Admins management form state
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[]>([
    "manage_lessons",
    "import_archive",
    "manage_series",
  ]);
  const [adminIsActive, setAdminIsActive] = useState(true);
  const [savingAdmin, setSavingAdmin] = useState(false);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshData = useCallback(async (isBackground = false) => {
    if (!isBackground) setSyncing(true);
    try {
      const [dataRes, adminsRes] = await Promise.all([
        fetch("/api/data", { cache: "no-store" }),
        fetch("/api/admins", { cache: "no-store" }),
      ]);
      if (dataRes.ok) {
        const fresh = (await dataRes.json()) as DatabasePayload;
        setData(fresh);
        if (!isBackground) {
          setSettingsForm(fresh.settings);
        }
      }
      if (adminsRes.ok) {
        const freshAdmins = (await adminsRes.json()) as AdminUser[];
        setAdmins(freshAdmins);
      }
    } catch {
      // Ignore background sync failures
    } finally {
      if (!isBackground) setSyncing(false);
    }
  }, []);

  // Live background sync every 8 seconds so multiple admins working simultaneously see updates immediately
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshData]);

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
    setSeriesParentId("");
    setSeriesCategory(DEFAULT_CATEGORIES[0]);
    setSeriesDescription("");
    setSeriesStatus("ongoing");
    setSeriesAccent("emerald");
    setSeriesSortOrder("0");
  };

  const startEditSeries = (s: Series) => {
    setEditingSeriesId(s.id);
    setSeriesTitle(s.title);
    setSeriesParentId(s.parentId || "");
    setSeriesCategory(s.category);
    setSeriesDescription(s.description);
    setSeriesStatus(s.status);
    setSeriesAccent(s.coverAccent);
    setSeriesSortOrder(String(s.sortOrder));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startCreateSubSeries = (parent: Series) => {
    setEditingSeriesId(null);
    setSeriesTitle("");
    setSeriesParentId(parent.id);
    setSeriesCategory(parent.category);
    setSeriesDescription("");
    setSeriesStatus("ongoing");
    setSeriesAccent(parent.coverAccent || "emerald");
    setSeriesSortOrder("0");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          parentId: seriesParentId || null,
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
      showNotice(
        "success",
        editingSeriesId
          ? "تم تحديث القائمة بنجاح"
          : seriesParentId
          ? "تم إنشاء القائمة الفرعية بنجاح"
          : "تم إنشاء القائمة الرئيسية بنجاح"
      );
    } catch {
      showNotice("error", "حدث خطأ أثناء حفظ السلسلة");
    } finally {
      setSavingSeries(false);
    }
  };

  const handleDeleteSeries = async (id: string) => {
    if (
      !window.confirm(
        "حذف هذه القائمة سيجعل دروسها المباشرة دروساً مفردة وسيرفع القوائم الفرعية تحتها إلى المستوى الأعلى (لن تُحذف الدروس أو القوائم الفرعية). هل تريد المتابعة؟"
      )
    ) {
      return;
    }
    const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshData();
      showNotice("success", "تم حذف القائمة");
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

  const seriesNameById = (id: string | null) => getSeriesPathLabel(data.series, id);

  // Admin management handlers
  const resetAdminForm = () => {
    setEditingAdminId(null);
    setAdminUsername("");
    setAdminDisplayName("");
    setAdminPassword("");
    setAdminPermissions(["manage_lessons", "import_archive", "manage_series"]);
    setAdminIsActive(true);
  };

  const startEditAdmin = (adm: AdminUser) => {
    setEditingAdminId(adm.id);
    setAdminUsername(adm.username);
    setAdminDisplayName(adm.displayName);
    setAdminPassword("");
    setAdminPermissions(adm.permissions);
    setAdminIsActive(adm.isActive);
    setTab("admins");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePermissionInForm = (perm: AdminPermission) => {
    setAdminPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPermissions.length === 0) {
      showNotice("error", "يرجى منح المشرف صلاحية واحدة على الأقل");
      return;
    }
    setSavingAdmin(true);
    setNotice(null);

    try {
      const url = editingAdminId ? `/api/admins/${editingAdminId}` : "/api/admins";
      const method = editingAdminId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername,
          displayName: adminDisplayName,
          password: adminPassword || undefined,
          permissions: adminPermissions,
          isActive: adminIsActive,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        showNotice("error", result.error || "تعذر حفظ حساب المشرف");
        return;
      }
      await refreshData();
      resetAdminForm();
      showNotice(
        "success",
        editingAdminId ? "تم تحديث صلاحيات وبيانات المشرف بنجاح" : "تم إنشاء حساب المشرف الجديد بنجاح"
      );
    } catch {
      showNotice("error", "حدث خطأ أثناء حفظ حساب المشرف");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleToggleAdminActive = async (adm: AdminUser) => {
    try {
      const res = await fetch(`/api/admins/${adm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !adm.isActive }),
      });
      const result = await res.json();
      if (!res.ok) {
        showNotice("error", result.error || "تعذر تغيير حالة الحساب");
        return;
      }
      await refreshData();
      showNotice(
        "success",
        !adm.isActive ? `تم تفعيل حساب المشرف ${adm.displayName}` : `تم إيقاف حساب المشرف ${adm.displayName}`
      );
    } catch {
      showNotice("error", "تعذر تحديث حالة المشرف");
    }
  };

  const handleDeleteAdmin = async (adm: AdminUser) => {
    if (!window.confirm(`هل أنت متأكد من حذف حساب المشرف "${adm.displayName}" نهائياً؟`)) return;
    const res = await fetch(`/api/admins/${adm.id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) {
      showNotice("error", result.error || "تعذر حذف المشرف");
      return;
    }
    await refreshData();
    if (editingAdminId === adm.id) resetAdminForm();
    showNotice("success", "تم حذف حساب المشرف");
  };

  const isRecentlyOnline = (iso?: string) => {
    if (!iso) return false;
    return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000; // active within 5 minutes
  };

  const availableTabs = [
    {
      id: "lessons" as AdminTab,
      label: `الدروس (${data.lessons.length})`,
      icon: BookOpen,
      visible: canPermission("manage_lessons"),
    },
    {
      id: "import" as AdminTab,
      label: "استيراد من Archive.org",
      icon: DownloadCloud,
      visible: canPermission("import_archive") || canPermission("manage_lessons"),
    },
    {
      id: "series" as AdminTab,
      label: `السلاسل (${data.series.length})`,
      icon: Layers,
      visible: canPermission("manage_series"),
    },
    {
      id: "settings" as AdminTab,
      label: "إعدادات الموقع والأستاذة",
      icon: Settings,
      visible: canPermission("manage_settings"),
    },
    {
      id: "admins" as AdminTab,
      label: `المشرفون والصلاحيات (${admins.length + 1})`,
      icon: Users,
      visible: canPermission("manage_admins"),
    },
    {
      id: "guide" as AdminTab,
      label: "دليل النشر المجاني",
      icon: HelpCircle,
      visible: true,
    },
  ].filter((t) => t.visible);

  return (
    <div className="min-h-screen bg-[#FAF3F6] pb-28">
      {/* Top Admin Header */}
      <header className="bg-gradient-to-l from-[#6F2B5F] via-[#8E3A7A] to-[#B8559B] text-white border-b border-[#6F2B5F]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-[#FAF3F6]" />
            </div>
            <div>
              <h1 className="font-serif-arabic text-xl font-bold">لوحة إدارة المكتبة الصوتية</h1>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#EBC6DD] mt-0.5">
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/12 border border-[#EBC6DD]/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">{currentAdmin.displayName}</span>
              <span className="text-[#EBC6DD] text-[11px]">
                ({currentAdmin.role === "owner" ? "مدير عام" : `@${currentAdmin.username}`})
              </span>
            </div>

            <button
              type="button"
              onClick={() => refreshData(false)}
              title="مزامنة فورية مع بقية المشرفين"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">مزامنة</span>
            </button>

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
                ? "border-[#D68FBF] bg-[#FAF3F6] text-[#8E3A7A]"
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

        {/* Navigation Tabs (filtered by current admin's permissions) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          {availableTabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-[#8E3A7A] text-white shadow-sm"
                    : "bg-white border border-[#EBC6DD] text-[#6E4E65] hover:border-[#8E3A7A]"
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
              className="lg:col-span-5 rounded-2xl border border-[#EBC6DD] bg-white p-5 sm:p-6 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif-arabic text-xl font-bold text-[#8E3A7A]">
                  {editingLessonId ? "تعديل الدرس الصوتي" : "إضافة درس صوتي جديد"}
                </h2>
                {editingLessonId && (
                  <button
                    type="button"
                    onClick={resetLessonForm}
                    className="text-xs text-[#6E4E65] hover:text-red-600"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              {/* Audio Upload Box */}
              <div className="rounded-xl border-2 border-dashed border-[#D68FBF] bg-[#FAF3F6] p-4">
                <label className="block text-xs font-semibold text-[#8E3A7A] mb-1.5">
                  رفع ملف صوتي (MP3 / M4A / OGG)
                </label>
                <p className="text-[11px] text-[#6E4E65] mb-3">
                  {config.archiveConfigured
                    ? "سيتم رفع الملف تلقائياً إلى حسابك المجاني في Internet Archive."
                    : "سيتم حفظه محلياً للتجربة (أو يمكنك لصق رابط من archive.org بالأسفل)."}
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white text-xs font-medium cursor-pointer transition-colors">
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
                <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                  رابط الملف الصوتي المباشر (MP3) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={lessonAudioUrl}
                  onChange={(e) => setLessonAudioUrl(e.target.value)}
                  placeholder="https://archive.org/download/item-id/lesson-01.mp3"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm text-left focus:outline-none focus:border-[#8E3A7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                  عنوان الدرس *
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="مثال: الدرس الأول — مقدمة في طلب العلم"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                    السلسلة (اختياري)
                  </label>
                  <select
                    value={lessonSeriesId}
                    onChange={(e) => setLessonSeriesId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white focus:outline-none focus:border-[#8E3A7A]"
                  >
                    <option value="">درس مفرد (بدون قائمة)</option>
                    {flattenedSeries.map((item) => (
                      <option key={item.series.id} value={item.series.id}>
                        {item.depth > 0 ? `${"— ".repeat(item.depth)}↳ ` : ""}
                        {item.series.title}
                        {item.depth > 0 ? ` (${item.pathLabel})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                    رقم الدرس في السلسلة
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lessonEpisode}
                    onChange={(e) => setLessonEpisode(e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D1626] mb-1">التصنيف</label>
                  <select
                    value={lessonCategory}
                    onChange={(e) => setLessonCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white focus:outline-none focus:border-[#8E3A7A]"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                    المدة (د:ث)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={lessonDurationText}
                    onChange={(e) => setLessonDurationText(e.target.value)}
                    placeholder="35:00"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm text-left focus:outline-none focus:border-[#8E3A7A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D1626] mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#EBC6DD] text-xs focus:outline-none focus:border-[#8E3A7A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                  نبذة مختصرة عن الدرس
                </label>
                <textarea
                  rows={2}
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                  محاور وفوائد الدرس (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  placeholder="• المحور الأول&#10;• المحور الثاني"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                />
              </div>

              <button
                type="submit"
                disabled={savingLesson}
                className="w-full py-3 rounded-xl bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {savingLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingLessonId ? "حفظ التعديلات" : "نشر الدرس"}</span>
              </button>
            </form>

            {/* Lessons list */}
            <div className="lg:col-span-7 rounded-2xl border border-[#EBC6DD] bg-white p-5 sm:p-6">
              <h2 className="font-serif-arabic text-xl font-bold text-[#2D1626] mb-4">
                الدروس المنشورة ({data.lessons.length})
              </h2>

              {data.lessons.length === 0 ? (
                <p className="text-sm text-[#6E4E65] py-10 text-center">
                  لا توجد دروس بعد. أضف أول درس من النموذج أو استورد من أرشيف الإنترنت.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-xl border border-[#EBC6DD] p-3.5 flex items-center justify-between gap-3 hover:border-[#D68FBF] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6E4E65] mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#EBC6DD]/40 text-[#8E3A7A] font-medium">
                            {lesson.category}
                          </span>
                          <span>{seriesNameById(lesson.seriesId)}</span>
                          {lesson.durationSeconds > 0 && (
                            <span>• {formatDuration(lesson.durationSeconds)}</span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-[#2D1626] truncate">
                          {lesson.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => playLesson(lesson, data.lessons)}
                          title="تشغيل"
                          className="p-2 rounded-lg text-[#8E3A7A] hover:bg-[#FAF3F6] cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditLesson(lesson)}
                          title="تعديل"
                          className="p-2 rounded-lg text-[#6E4E65] hover:bg-[#FAF3F6] cursor-pointer"
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
          <div className="rounded-2xl border border-[#EBC6DD] bg-white p-6 space-y-6">
            <div>
              <h2 className="font-serif-arabic text-2xl font-bold text-[#8E3A7A]">
                استيراد ذكي من Internet Archive (archive.org)
              </h2>
              <p className="text-sm text-[#6E4E65] mt-1 leading-relaxed">
                ارفع ملفاتك الصوتية (أو سلسلة كاملة) مجاناً وبلا حدود على موقع{" "}
                <a
                  href="https://archive.org/upload"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8E3A7A] underline font-medium"
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
                className="flex-1 px-4 py-3 rounded-xl border border-[#EBC6DD] text-sm text-left focus:outline-none focus:border-[#8E3A7A]"
              />
              <button
                type="submit"
                disabled={resolvingArchive}
                className="px-6 py-3 rounded-xl bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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
              <div className="space-y-5 pt-4 border-t border-[#EBC6DD]">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF3F6] p-4 rounded-xl border border-[#EBC6DD]">
                  <div>
                    <div className="text-xs text-[#6E4E65]">العنصر على أرشيف الإنترنت:</div>
                    <div className="font-bold text-[#2D1626]">{archiveMeta.itemTitle}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={importSeriesId}
                      onChange={(e) => setImportSeriesId(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white"
                    >
                      <option value="">استيراد كدروس مفردة</option>
                      {flattenedSeries.map((item) => (
                        <option key={item.series.id} value={item.series.id}>
                          إضافة إلى: {item.pathLabel}
                        </option>
                      ))}
                    </select>
                    <select
                      value={importCategory}
                      onChange={(e) => setImportCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white"
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
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#EBC6DD] bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={track.selected}
                        onChange={(e) => {
                          const next = [...archiveTracks];
                          next[idx] = { ...next[idx], selected: e.target.checked };
                          setArchiveTracks(next);
                        }}
                        className="w-4 h-4 accent-[#8E3A7A]"
                      />
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => {
                          const next = [...archiveTracks];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setArchiveTracks(next);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                      />
                      <span className="text-xs text-[#6E4E65] shrink-0" dir="ltr">
                        {track.durationSeconds > 0 ? formatDuration(track.durationSeconds) : "—"}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#FAF3F6] text-[#6E4E65] shrink-0">
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
                  className="px-6 py-3 rounded-xl bg-[#B8559B] hover:bg-[#8E3A7A] text-white font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"
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

        {/* TAB 3: SERIES & NESTED FOLDERS */}
        {tab === "series" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveSeries}
              className="lg:col-span-5 rounded-2xl border border-[#EBC6DD] bg-white p-6 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif-arabic text-xl font-bold text-[#8E3A7A]">
                  {editingSeriesId
                    ? "تعديل القائمة / السلسلة"
                    : seriesParentId
                    ? "إنشاء قائمة فرعية جديدة"
                    : "إنشاء قائمة أو سلسلة جديدة"}
                </h2>
                {(editingSeriesId || seriesParentId) && (
                  <button
                    type="button"
                    onClick={resetSeriesForm}
                    className="text-xs text-[#6E4E65] hover:text-red-600 cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              {seriesParentId && !editingSeriesId && (
                <div className="rounded-xl bg-[#EBF4EE] border border-[#C8DFCF] px-3.5 py-2.5 text-xs text-[#2E5741] flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 shrink-0 text-[#3D6B52]" />
                  <span>
                    سيتم إنشاء هذه القائمة داخل:{" "}
                    <strong>{getSeriesPathLabel(data.series, seriesParentId)}</strong>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">
                  اسم القائمة / السلسلة *
                </label>
                <input
                  type="text"
                  required
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder={
                    seriesParentId
                      ? "مثال: سورة البقرة، أو السنة 2024"
                      : "مثال: تفسير القرآن، أو رمضان"
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  القائمة الرئيسية (الأب) — اختياري
                </label>
                <select
                  value={seriesParentId}
                  onChange={(e) => {
                    const nextParentId = e.target.value;
                    setSeriesParentId(nextParentId);
                    if (nextParentId) {
                      const parent = data.series.find((s) => s.id === nextParentId);
                      if (parent) setSeriesCategory(parent.category);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white focus:outline-none focus:border-[#8E3A7A]"
                >
                  <option value="">قائمة رئيسية (في المستوى الأول)</option>
                  {availableParentOptions.map((item) => (
                    <option key={item.series.id} value={item.series.id}>
                      {item.depth > 0 ? `${"— ".repeat(item.depth)}↳ ` : ""}
                      {item.series.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#6E4E65] mt-1">
                  اتركه كـ «قائمة رئيسية» لقسم مستقل، أو اختر قائمة رئيسية لإنشاء ملف فرعي داخلها.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">التصنيف</label>
                  <select
                    value={seriesCategory}
                    onChange={(e) => setSeriesCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white"
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
                    className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white"
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
                    className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-sm bg-white"
                  >
                    <option value="emerald">أخضر طبيعي وبنفسجي</option>
                    <option value="sage">أخضر هادئ (#3D6B52)</option>
                    <option value="purple">بنفسجي داكن (#8E3A7A)</option>
                    <option value="rose">وردي بنفسجي (#B8559B)</option>
                    <option value="plum">أرجواني عميق</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">الترتيب</label>
                  <input
                    type="number"
                    value={seriesSortOrder}
                    onChange={(e) => setSeriesSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">وصف القائمة / السلسلة</label>
                <textarea
                  rows={3}
                  value={seriesDescription}
                  onChange={(e) => setSeriesDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                />
              </div>

              <button
                type="submit"
                disabled={savingSeries}
                className="w-full py-3 rounded-xl bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {savingSeries ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>
                  {editingSeriesId
                    ? "حفظ التعديلات"
                    : seriesParentId
                    ? "إنشاء القائمة الفرعية"
                    : "إنشاء القائمة"}
                </span>
              </button>
            </form>

            <div className="lg:col-span-7 rounded-2xl border border-[#EBC6DD] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-serif-arabic text-xl font-bold text-[#2D1626]">
                    هيكل القوائم والسلاسل ({data.series.length})
                  </h2>
                  <p className="text-xs text-[#6E4E65] mt-0.5">
                    اضغط على «+ فرعي» بجانب أي قائمة لإنشاء قائمة فرعية داخلها مباشرة.
                  </p>
                </div>
              </div>

              {flattenedSeries.length === 0 ? (
                <p className="text-sm text-[#6E4E65] py-10 text-center">
                  لا توجد قوائم بعد. أنشئ أول قائمة من النموذج المجاور.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {flattenedSeries.map(({ series: s, depth }) => {
                    const directLessons = data.lessons.filter((l) => l.seriesId === s.id).length;
                    const subFoldersCount = data.series.filter((c) => (c.parentId || null) === s.id).length;

                    return (
                      <div
                        key={s.id}
                        style={{ marginRight: `${Math.min(depth, 4) * 24}px` }}
                        className={`rounded-xl border p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors ${
                          depth === 0
                            ? "border-[#EBC6DD] bg-white"
                            : "border-[#C8DFCF] bg-[#F8FBF9]"
                        }`}
                      >
                        <div className="min-w-0 flex items-start gap-2.5">
                          <div
                            className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              depth === 0
                                ? "bg-[#FAF3F6] text-[#8E3A7A]"
                                : "bg-[#EBF4EE] text-[#2E5741]"
                            }`}
                          >
                            {depth === 0 ? (
                              <Folder className="w-4 h-4" />
                            ) : (
                              <CornerDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-full font-medium ${
                                  depth === 0
                                    ? "bg-[#EBC6DD]/40 text-[#8E3A7A]"
                                    : "bg-[#EBF4EE] text-[#2E5741]"
                                }`}
                              >
                                {depth === 0 ? "قائمة رئيسية" : `قائمة فرعية (مستوى ${depth + 1})`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#FAF3F6] text-[#5C3D55] border border-[#EAD5E1]">
                                {s.category}
                              </span>
                              <span className="text-[#6E4E65]">{directLessons} دروس</span>
                              {subFoldersCount > 0 && (
                                <span className="text-[#2E5741] font-semibold">
                                  • {subFoldersCount} قوائم فرعية
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-sm sm:text-base text-[#2D1626] truncate">
                              {s.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startCreateSubSeries(s)}
                            title="إضافة قائمة فرعية داخلها"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EBF4EE] hover:bg-[#D9EBDF] text-[#2E5741] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>+ فرعي</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditSeries(s)}
                            title="تعديل"
                            className="p-2 rounded-lg text-[#6E4E65] hover:bg-[#FAF3F6] cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSeries(s.id)}
                            title="حذف"
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {tab === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="max-w-2xl rounded-2xl border border-[#EBC6DD] bg-white p-6 space-y-4"
          >
            <h2 className="font-serif-arabic text-2xl font-bold text-[#8E3A7A]">
              إعدادات الموقع والأستاذة
            </h2>

            <div>
              <label className="block text-xs font-semibold mb-1">اسم الموقع</label>
              <input
                type="text"
                required
                value={settingsForm.siteName}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBC6DD] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">اسم الأستاذة / المتحدث</label>
              <input
                type="text"
                required
                value={settingsForm.sheikhName}
                onChange={(e) => setSettingsForm({ ...settingsForm, sheikhName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBC6DD] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">العنوان الفرعي</label>
              <input
                type="text"
                value={settingsForm.sheikhTitle}
                onChange={(e) => setSettingsForm({ ...settingsForm, sheikhTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBC6DD] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">النبذة التعريفية</label>
              <textarea
                rows={4}
                value={settingsForm.bio}
                onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBC6DD] text-sm"
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
                  className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-xs text-left"
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
                  className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-xs text-left"
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
                  className="w-full px-3 py-2 rounded-xl border border-[#EBC6DD] text-xs text-left"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 rounded-xl bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ الإعدادات</span>
            </button>
          </form>
        )}

        {/* TAB 5: ADMINS & GRANULAR PERMISSIONS */}
        {tab === "admins" && canPermission("manage_admins") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create / Edit Admin Form */}
            <form
              onSubmit={handleSaveAdmin}
              className="lg:col-span-5 rounded-2xl border border-[#EBC6DD] bg-white p-6 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif-arabic text-xl font-bold text-[#8E3A7A] flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>{editingAdminId ? "تعديل صلاحيات المشرف" : "إضافة مشرف (أدمن) جديد"}</span>
                </h2>
                {editingAdminId && (
                  <button
                    type="button"
                    onClick={resetAdminForm}
                    className="text-xs text-[#6E4E65] hover:text-red-600 cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <p className="text-xs text-[#6E4E65] leading-relaxed">
                يمكن لجميع المشرفين تسجيل الدخول والعمل في نفس الوقت مع مزامنة تلقائية للبيانات،
                ويقتصر وصول كل مشرف على الأقسام التي تمنحه صلاحيتها هنا.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                    الاسم الظاهر للمشرف *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminDisplayName}
                    onChange={(e) => setAdminDisplayName(e.target.value)}
                    placeholder="مثال: أ. سارة"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm focus:outline-none focus:border-[#8E3A7A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D1626] mb-1">
                    اسم المستخدم للدخول *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingAdminId)}
                    dir="ltr"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="sara_admin"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm text-left focus:outline-none focus:border-[#8E3A7A] disabled:bg-[#FAF3F6] disabled:text-[#6E4E65]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D1626] mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#8E3A7A]" />
                  <span>
                    {editingAdminId
                      ? "كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)"
                      : "كلمة المرور * (6 خانات على الأقل)"}
                  </span>
                </label>
                <input
                  type="password"
                  required={!editingAdminId}
                  minLength={6}
                  dir="ltr"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EBC6DD] text-sm text-left focus:outline-none focus:border-[#8E3A7A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#2D1626]">
                    الصلاحيات الممنوحة للمشرف *
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAdminPermissions([...ALL_ADMIN_PERMISSIONS])}
                      className="text-[#8E3A7A] hover:underline cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-[#EBC6DD]">|</span>
                    <button
                      type="button"
                      onClick={() => setAdminPermissions(["manage_lessons"])}
                      className="text-[#6E4E65] hover:underline cursor-pointer"
                    >
                      الدروس فقط
                    </button>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl bg-[#FAF3F6] border border-[#EBC6DD] p-3">
                  {ALL_ADMIN_PERMISSIONS.map((perm) => {
                    const checked = adminPermissions.includes(perm);
                    const info = ADMIN_PERMISSION_LABELS[perm];
                    return (
                      <label
                        key={perm}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          checked
                            ? "border-[#8E3A7A] bg-white shadow-xs"
                            : "border-transparent hover:bg-white/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermissionInForm(perm)}
                          className="mt-1 w-4 h-4 accent-[#8E3A7A] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2D1626]">{info.title}</div>
                          <div className="text-[11px] text-[#6E4E65] leading-snug mt-0.5">
                            {info.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {editingAdminId && (
                <label className="flex items-center gap-2.5 text-xs font-semibold text-[#2D1626] pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminIsActive}
                    onChange={(e) => setAdminIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#8E3A7A]"
                  />
                  <span>الحساب مفعّل (يسمح له بتسجيل الدخول والعمل)</span>
                </label>
              )}

              <button
                type="submit"
                disabled={savingAdmin}
                className="w-full py-3 rounded-xl bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {savingAdmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{editingAdminId ? "حفظ تعديلات المشرف" : "إنشاء حساب المشرف"}</span>
              </button>
            </form>

            {/* Admins List */}
            <div className="lg:col-span-7 rounded-2xl border border-[#EBC6DD] bg-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif-arabic text-xl font-bold text-[#2D1626]">
                    فريق المشرفين ({admins.length + 1})
                  </h2>
                  <p className="text-xs text-[#6E4E65]">
                    تتم مزامنة التعديلات تلقائياً بين جميع المشرفين المتصلين في نفس الوقت
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Root Owner Card */}
                <div className="rounded-2xl border-2 border-[#8E3A7A]/30 bg-[#FAF3F6]/70 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8E3A7A] text-white text-xs font-semibold">
                        <Shield className="w-3 h-3" />
                        المدير العام (المالك)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        كامل الصلاحيات
                      </span>
                    </div>
                    <p className="font-bold text-sm text-[#2D1626]">
                      الحساب الأساسي (يُضبط عبر إعدادات البيئة <code className="font-mono">ADMIN_USERNAME</code>)
                    </p>
                  </div>
                </div>

                {admins.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D68FBF] p-8 text-center text-sm text-[#6E4E65]">
                    لم تقم بإضافة مشرفين إضافيين بعد. استخدم النموذج لإضافة مشرفين وتخصيص صلاحياتهم.
                  </div>
                ) : (
                  admins.map((adm) => {
                    const online = isRecentlyOnline(adm.lastActiveAt);
                    return (
                      <div
                        key={adm.id}
                        className={`rounded-2xl border p-4 transition-colors ${
                          adm.isActive
                            ? "border-[#EBC6DD] bg-white hover:border-[#D68FBF]"
                            : "border-gray-200 bg-gray-50/70 opacity-75"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-bold text-base text-[#2D1626]">
                                {adm.displayName}
                              </span>
                              <span
                                dir="ltr"
                                className="text-xs px-2 py-0.5 rounded-md bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] font-mono"
                              >
                                @{adm.username}
                              </span>
                              {!adm.isActive ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                  موقوف
                                </span>
                              ) : online ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  متصل الآن
                                </span>
                              ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF3F6] text-[#6E4E65]">
                                  مفعّل
                                </span>
                              )}
                            </div>

                            {/* Permissions badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              {adm.permissions.map((perm) => (
                                <span
                                  key={perm}
                                  className="px-2.5 py-0.5 rounded-full bg-[#EBC6DD]/40 text-[#8E3A7A] text-[11px] font-medium"
                                >
                                  {ADMIN_PERMISSION_LABELS[perm]?.title || perm}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditAdmin(adm)}
                              title="تعديل الصلاحيات أو كلمة المرور"
                              className="p-2 rounded-lg text-[#8E3A7A] hover:bg-[#FAF3F6] cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {adm.id !== currentAdmin.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdminActive(adm)}
                                  title={adm.isActive ? "إيقاف الحساب مؤقتاً" : "تفعيل الحساب"}
                                  className={`p-2 rounded-lg cursor-pointer ${
                                    adm.isActive
                                      ? "text-amber-700 hover:bg-amber-50"
                                      : "text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(adm)}
                                  title="حذف المشرف"
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FREE HOSTING & ARCHIVE GUIDE */}
        {tab === "guide" && (
          <div className="rounded-2xl border border-[#EBC6DD] bg-white p-6 space-y-6 max-w-4xl">
            <h2 className="font-serif-arabic text-2xl font-bold text-[#8E3A7A]">
              دليل التشغيل والنشر المجاني 100% (بدون بطاقة بنكية)
            </h2>

            <div className="space-y-4 text-sm text-[#2D1626] leading-relaxed">
              <div className="rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] p-4">
                <h3 className="font-bold text-[#8E3A7A] mb-1.5">
                  1) تخزين الصوتيات مجاناً وبلا حدود على Internet Archive
                </h3>
                <ul className="list-disc pr-5 space-y-1.5">
                  <li>
                    أنشئ حساباً مجانياً على{" "}
                    <a href="https://archive.org/account/signup" target="_blank" rel="noreferrer" className="underline text-[#8E3A7A]">
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

              <div className="rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] p-4">
                <h3 className="font-bold text-[#8E3A7A] mb-1.5">
                  2) نصيحة ذهبية لضغط الصوتيات قبل الرفع
                </h3>
                <p>
                  تحويل الدروس الصوتية إلى <strong>MP3 Mono بمعدل 48–64 kbps</strong> يجعل ساعة الدرس
                  حوالي 22 ميجابايت فقط مع صوت نقي جداً، ما يسرّع التشغيل للزوار أصحاب الإنترنت البطيء.
                  إذا كنت تستخدم أداة <code className="font-mono">ffmpeg</code>:
                </p>
                <pre
                  dir="ltr"
                  className="mt-2 p-3 rounded-lg bg-[#2D1626] text-[#FAF3F6] text-xs overflow-x-auto"
                >
                  ffmpeg -i input.mp3 -ac 1 -b:a 64k -ar 44100 output-lesson.mp3
                </pre>
              </div>

              <div className="rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] p-4">
                <h3 className="font-bold text-[#8E3A7A] mb-1.5">
                  3) قاعدة البيانات المجانية (Supabase) والاستضافة المجانية (Vercel)
                </h3>
                <ol className="list-decimal pr-5 space-y-1.5">
                  <li>
                    أنشئ مشروعاً مجانياً على{" "}
                    <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline text-[#8E3A7A]">
                      supabase.com
                    </a>{" "}
                    وشغّل محتوى الملف <code className="font-mono">supabase/schema.sql</code> داخل SQL Editor.
                  </li>
                  <li>
                    ارفع هذا المشروع إلى حسابك على <strong>GitHub</strong>، ثم اربطه بـ{" "}
                    <a href="https://vercel.com" target="_blank" rel="noreferrer" className="underline text-[#8E3A7A]">
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
