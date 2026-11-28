"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Layers,
  Play,
  Search,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  FolderOpen,
  X,
} from "lucide-react";
import type { DatabasePayload, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { LessonRow } from "./LessonRow";
import { formatTotalDurationArabic } from "@/lib/format";
import { arabicMatchesFields } from "@/lib/arabic";
import {
  getDirectChildSeries,
  getRecursiveSeriesStats,
  getSeriesPathLabel,
} from "@/lib/seriesTree";
import { LogoAnzalahu } from "./LogoAnzalahu";

const ACCENT_STYLES: Record<string, { bar: string; badge: string; iconBg: string }> = {
  purple: {
    bar: "from-[#8E3A7A] to-[#B8559B]",
    badge: "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]",
    iconBg: "bg-[#8E3A7A]/10 text-[#8E3A7A]",
  },
  rose: {
    bar: "from-[#B8559B] to-[#D68FBF]",
    badge: "bg-[#FAF3F6] text-[#B8559B] border border-[#EBC6DD]",
    iconBg: "bg-[#B8559B]/10 text-[#B8559B]",
  },
  plum: {
    bar: "from-[#632454] to-[#8E3A7A]",
    badge: "bg-[#FAF3F6] text-[#632454] border border-[#EBC6DD]",
    iconBg: "bg-[#632454]/10 text-[#632454]",
  },
  blush: {
    bar: "from-[#D68FBF] to-[#EBC6DD]",
    badge: "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]",
    iconBg: "bg-[#D68FBF]/20 text-[#8E3A7A]",
  },
  sage: {
    bar: "from-[#2E5741] to-[#558B6E]",
    badge: "bg-[#EBF4EE] text-[#2E5741] border border-[#C8DFCF]",
    iconBg: "bg-[#3D6B52]/10 text-[#3D6B52]",
  },
  emerald: {
    bar: "from-[#3D6B52] via-[#6F7C6F] to-[#8E3A7A]",
    badge: "bg-[#EBF4EE] text-[#2E5741] border border-[#C8DFCF]",
    iconBg: "bg-[#3D6B52]/10 text-[#3D6B52]",
  },
  gold: {
    bar: "from-[#B8559B] to-[#D68FBF]",
    badge: "bg-[#FAF3F6] text-[#B8559B] border border-[#EBC6DD]",
    iconBg: "bg-[#B8559B]/10 text-[#B8559B]",
  },
  teal: {
    bar: "from-[#3D6B52] to-[#8E3A7A]",
    badge: "bg-[#EBF4EE] text-[#2E5741] border border-[#C8DFCF]",
    iconBg: "bg-[#3D6B52]/10 text-[#3D6B52]",
  },
  slate: {
    bar: "from-[#8E3A7A] to-[#B8559B]",
    badge: "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]",
    iconBg: "bg-[#8E3A7A]/10 text-[#8E3A7A]",
  },
};

export function HomeLibraryClient({ data }: { data: DatabasePayload }) {
  const { playLesson } = useAudioPlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [lessonTab, setLessonTab] = useState<"all" | "single">("all");
  const [lessonsPage, setLessonsPage] = useState(1);
  const LESSONS_PER_PAGE = 5;

  useEffect(() => {
    setLessonsPage(1);
  }, [searchQuery, lessonTab]);

  const seriesMap = useMemo(() => {
    const m = new Map<string, Series>();
    data.series.forEach((s) => m.set(s.id, s));
    return m;
  }, [data.series]);

  const singleLessonsCount = useMemo(
    () => data.lessons.filter((l) => !l.seriesId).length,
    [data.lessons]
  );

  const totalDurationSeconds = useMemo(
    () => data.lessons.reduce((acc, l) => acc + (l.durationSeconds || 0), 0),
    [data.lessons]
  );

  const filteredSeries = useMemo(() => {
    const isSearching = Boolean(searchQuery.trim());
    return data.series.filter((s) => {
      // On the main homepage grid, show top-level (root) series unless the user is actively searching
      const hasValidParent = Boolean(s.parentId && seriesMap.has(s.parentId));
      if (!isSearching && hasValidParent) return false;
      if (!isSearching) return true;

      const fullPath = getSeriesPathLabel(data.series, s.id);
      return arabicMatchesFields([s.title, s.description, s.category, fullPath], searchQuery);
    });
  }, [data.series, searchQuery, seriesMap]);

  const filteredLessons = useMemo(() => {
    return data.lessons.filter((l) => {
      if (lessonTab === "single" && l.seriesId !== null) return false;
      if (!searchQuery.trim()) return true;

      const seriesPath = l.seriesId ? getSeriesPathLabel(data.series, l.seriesId) : "";
      return arabicMatchesFields(
        [l.title, l.description, l.notes, l.category, seriesPath],
        searchQuery
      );
    });
  }, [data.lessons, data.series, lessonTab, searchQuery]);

  // Instant search results right beneath the search box (ignores lessonTab/category filter so user always finds what they type)
  const instantSearchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;

    const matchedSeries = data.series.filter((s) => {
      const fullPath = getSeriesPathLabel(data.series, s.id);
      return arabicMatchesFields([s.title, s.description, s.category, fullPath], q);
    });

    const matchedLessons = data.lessons.filter((l) => {
      const seriesPath = l.seriesId ? getSeriesPathLabel(data.series, l.seriesId) : "";
      return arabicMatchesFields([l.title, l.description, l.notes, l.category, seriesPath], q);
    });

    return {
      series: matchedSeries,
      lessons: matchedLessons,
      total: matchedSeries.length + matchedLessons.length,
    };
  }, [data.series, data.lessons, searchQuery]);

  const latestLesson = data.lessons[0] || null;

  const totalLessonsPages = Math.max(1, Math.ceil(filteredLessons.length / LESSONS_PER_PAGE));
  const currentLessonsPage = Math.min(lessonsPage, totalLessonsPages);
  const pageStartIdx = (currentLessonsPage - 1) * LESSONS_PER_PAGE;
  const paginatedLessons = filteredLessons.slice(pageStartIdx, pageStartIdx + LESSONS_PER_PAGE);

  const goToLessonsPage = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalLessonsPages, nextPage));
    setLessonsPage(clamped);
    const el = document.getElementById("lessons");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="flex-1 pb-20">
      {/* ================================================================= */}
      {/* 1. HERO SECTION – الواجهة الافتتاحية الموحدة والهادئة               */}
      {/* ================================================================= */}
      <section
        id="hero"
        className="relative overflow-hidden bg-gradient-to-b from-[#FAF3F6] via-[#FFFFFF] to-[#F6FAF7] border-b border-[#EAD5E1]/80"
      >
        {/* Ambient soft botanical & rose atmospheric glow */}
        <div
          aria-hidden="true"
          className="absolute -top-28 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#EBC6DD]/45 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-[#3D6B52]/12 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[20rem] rounded-full bg-[#FAF3F6]/80 blur-3xl pointer-events-none"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pt-11 sm:pb-12 relative z-10">
          {/* Two-Column RTL Hero: Official Transparent Emblem on Right + Larger Clear Quote on Left */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Right Column: Official Large Transparent Logo */}
            <div className="lg:col-span-4 flex items-center justify-center">
              <LogoAnzalahu variant="heroEmblem" />
            </div>

            {/* Left Column: Clear, Larger Poetic Quote & Signature */}
            <div className="lg:col-span-8 text-center lg:text-right">
              <h1 className="font-serif-arabic text-2xl sm:text-[1.7rem] lg:text-[1.95rem] font-bold text-[#2B1626] leading-[2] tracking-normal">
                «ما طابت الحياةُ إلا بالعيش{" "}
                <span className="text-[#8E3A7A]">في رحابِ القرآن</span>، ولا
                استقامت الخطى إلا بالسعي لأجلِه في كلّ ميدان؛ ففي قُربِه{" "}
                <span className="text-[#2E5741]">
                  سكينةٌ تُرمِّمُ شتاتَ الروح
                </span>
                ، وفي صُحبتِه أنسٌ يَشفي الجروح. هنا نُصاحب الآيةَ تأمُّلاً
                وعملاً، ليبقى أثرُها في القلبِ حيّاً لا يزول»
              </h1>

              {/* Single Signature Line */}
              <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-2.5 gap-y-1 text-xs sm:text-sm text-[#6E4E65]">
                <span className="font-serif-arabic text-lg sm:text-xl font-bold text-[#8E3A7A]">
                  الأستاذة فاطمة حجازي
                </span>
                <span className="text-[#D68FBF]">•</span>
                <span className="font-medium text-[#2E5741]">
                  {data.settings.sheikhTitle ||
                    "الدروس العلمية والشروحات المنهجية"}
                </span>
              </div>
            </div>
          </div>

          {/* Dedicated Centered Action Buttons Row (2 Focused CTAs) */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            {latestLesson && (
              <button
                type="button"
                onClick={() => playLesson(latestLesson, data.lessons)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-[#8E3A7A] hover:bg-[#752D64] text-white text-sm sm:text-base font-semibold shadow-[0_6px_20px_rgba(142,58,122,0.25)] transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current mr-[-2px]" />
                <span>استمع لأحدث درس</span>
              </button>
            )}

            <a
              href="#series"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border border-[#C8DFCF] hover:border-[#3D6B52] text-[#2E5741] hover:bg-[#EBF4EE]/70 text-sm sm:text-base font-semibold transition-all shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-[#3D6B52]" />
              <span>تصفح السور والسلاسل</span>
            </a>
          </div>

          {/* ================================================================= */}
          {/* Integrated Search & Live Library Stats Strip                      */}
          {/* ================================================================= */}
          <div className="mt-9 sm:mt-10 max-w-4xl mx-auto">
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border border-[#EAD5E1] shadow-[0_12px_40px_rgba(142,58,122,0.06)] p-4 sm:p-5">
              {/* Search Bar */}
              <div className="relative flex items-center rounded-2xl bg-[#FAF3F6]/70 border border-[#EAD5E1] focus-within:bg-white focus-within:border-[#8E3A7A] focus-within:ring-2 focus-within:ring-[#8E3A7A]/15 transition-all">
                <div className="pr-4 text-[#8E3A7A]">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchQuery("");
                  }}
                  placeholder="ابحث عن درس، سورة، سلسلة علمية، أو موضوع (مثال: سورة البقرة، مقدسيات 15، يوسف)..."
                  className="w-full py-3.5 pr-3 pl-12 bg-transparent text-sm sm:text-base text-[#2B1626] placeholder:text-[#82607A] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3.5 p-1.5 rounded-full hover:bg-[#EBC6DD]/40 text-[#8E3A7A] cursor-pointer"
                    aria-label="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Instant Live Search Results Panel right beneath the search box */}
              {instantSearchResults && (
                <div className="mt-3 rounded-2xl border border-[#D68FBF]/70 bg-white shadow-[0_14px_40px_rgba(142,58,122,0.12)] overflow-hidden text-right">
                  {/* Results Summary Header */}
                  <div className="px-4 py-2.5 bg-gradient-to-l from-[#FAF3F6] to-[#F6FAF7] border-b border-[#EAD5E1] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#2B1626] font-medium">
                      نتائج البحث الفوري عن «<strong className="text-[#8E3A7A]">{searchQuery.trim()}</strong>»:{" "}
                      <strong className="text-[#2E5741]">{instantSearchResults.series.length}</strong>{" "}
                      سلسلة/سورة و{" "}
                      <strong className="text-[#8E3A7A]">{instantSearchResults.lessons.length}</strong>{" "}
                      درس
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-[#8E3A7A] hover:text-[#6F2B5F] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>مسح البحث</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {instantSearchResults.total === 0 ? (
                    <div className="p-8 text-center text-sm text-[#6E4E65]">
                      لم يتم العثور على نتائج مطابقة لـ «{searchQuery.trim()}». جرّب البحث باسم السورة أو كلمة أخرى.
                    </div>
                  ) : (
                    <div className="max-h-[26rem] overflow-y-auto divide-y divide-[#FAF3F6]">
                      {/* Matched Series & Surahs */}
                      {instantSearchResults.series.length > 0 && (
                        <div className="p-3.5 sm:p-4">
                          <div className="text-[11px] font-bold text-[#2E5741] mb-2.5 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>القوائم والسور المطابقة ({instantSearchResults.series.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {instantSearchResults.series.slice(0, 8).map((s) => {
                              const st = getRecursiveSeriesStats(data.series, data.lessons, s.id);
                              const parentPath = s.parentId
                                ? getSeriesPathLabel(data.series, s.parentId)
                                : null;
                              return (
                                <Link
                                  key={s.id}
                                  href={`/series/${s.id}`}
                                  className="group flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-[#EAD5E1]/80 bg-[#FAF3F6]/40 hover:bg-[#EBF4EE]/60 hover:border-[#3D6B52]/50 transition-colors"
                                >
                                  <div className="min-w-0">
                                    {parentPath && (
                                      <div className="text-[10px] text-[#2E5741] font-medium truncate">
                                        {parentPath}
                                      </div>
                                    )}
                                    <div className="font-serif-arabic text-sm sm:text-base font-bold text-[#2B1626] group-hover:text-[#8E3A7A] truncate">
                                      {s.title}
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-[#2E5741] bg-white px-2.5 py-1 rounded-lg border border-[#C8DFCF]">
                                    <span>{st.totalLessonsCount} درس</span>
                                    <ArrowLeft className="w-3 h-3 text-[#8E3A7A]" />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Matched Lessons with Instant Play */}
                      {instantSearchResults.lessons.length > 0 && (
                        <div className="p-3.5 sm:p-4">
                          <div className="text-[11px] font-bold text-[#8E3A7A] mb-2.5 flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5" />
                            <span>الدروس والمحاضرات المطابقة ({instantSearchResults.lessons.length})</span>
                          </div>
                          <div className="space-y-2">
                            {instantSearchResults.lessons.slice(0, 15).map((lesson) => {
                              const pathLabel = lesson.seriesId
                                ? getSeriesPathLabel(data.series, lesson.seriesId)
                                : "درس مفرد";
                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[#EAD5E1]/70 bg-white hover:border-[#8E3A7A]/60 hover:bg-[#FAF3F6]/40 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => playLesson(lesson, instantSearchResults.lessons)}
                                      title="تشغيل الدرس الآن"
                                      className="w-9 h-9 rounded-xl bg-[#8E3A7A] hover:bg-[#752D64] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs"
                                    >
                                      <Play className="w-4 h-4 fill-current mr-[-1px]" />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <Link
                                        href={`/lessons/${lesson.id}`}
                                        className="block font-semibold text-xs sm:text-sm text-[#2B1626] hover:text-[#8E3A7A] truncate"
                                      >
                                        {lesson.title}
                                      </Link>
                                      <div className="text-[11px] text-[#2E5741] truncate mt-0.5">
                                        {pathLabel}
                                      </div>
                                    </div>
                                  </div>

                                  <Link
                                    href={`/lessons/${lesson.id}`}
                                    className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#FAF3F6] text-[#8E3A7A] hover:bg-[#EBC6DD]/50 transition-colors"
                                  >
                                    فتح الدرس
                                  </Link>
                                </div>
                              );
                            })}
                          </div>

                          {instantSearchResults.lessons.length > 15 && (
                            <div className="mt-3 text-center">
                              <a
                                href="#lessons"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E3A7A] hover:underline"
                              >
                                <span>
                                  عرض جميع الدروس المطابقة ({instantSearchResults.lessons.length}) بالأسفل
                                </span>
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Compact, Balanced 3-Stat Strip */}
              <div className="mt-4 pt-4 border-t border-[#FAF3F6] grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Stat 1 */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[#FAF3F6]/60">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center shrink-0 shadow-2xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-serif-arabic text-xl font-bold text-[#8E3A7A] leading-none">
                      {data.series.length}
                    </div>
                    <div className="text-[11px] text-[#5C3D55] font-medium mt-1">
                      سلسلة وسورة
                    </div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[#EBF4EE]/55">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#C8DFCF] text-[#3D6B52] flex items-center justify-center shrink-0 shadow-2xs">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-serif-arabic text-xl font-bold text-[#2E5741] leading-none">
                      {data.lessons.length}
                    </div>
                    <div className="text-[11px] text-[#5C3D55] font-medium mt-1">
                      درس ومحاضرة
                    </div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[#FAF3F6]/60">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EBC6DD] text-[#B8559B] flex items-center justify-center shrink-0 shadow-2xs">
                    {totalDurationSeconds > 0 ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-serif-arabic text-base sm:text-lg font-bold text-[#8E3A7A] leading-none">
                      {totalDurationSeconds > 0
                        ? formatTotalDurationArabic(totalDurationSeconds)
                        : "مجاني بالكامل"}
                    </div>
                    <div className="text-[11px] text-[#5C3D55] font-medium mt-1">
                      {totalDurationSeconds > 0 ? "محتوى صوتي" : "استماع وتحميل مباشر"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. FEATURED SERIES – السلاسل العلمية والمنهجية                     */}
      {/* ================================================================= */}
      <section id="series" className="max-w-6xl mx-auto px-4 mt-12 sm:mt-14 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 pb-4 border-b border-[#EAD5E1]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF4EE] border border-[#C8DFCF] text-[#2E5741] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2B1626]">
                السلاسل العلمية والمنهجية
              </h2>
              <p className="text-xs sm:text-sm text-[#5C3D55] mt-0.5">
                شروحات مرتبة ومترابطة للاستماع والمتابعة المنهجية
              </p>
            </div>
          </div>
        </div>

        {filteredSeries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#EAD5E1] bg-white/80 p-12 text-center text-sm text-[#6E4E65]">
            لا توجد سلاسل مطابقة لخيار البحث المحدد.
          </div>
        ) : filteredSeries.length === 1 && !searchQuery.trim() ? (
          (() => {
            const featured = filteredSeries[0];
            const recStats = getRecursiveSeriesStats(data.series, data.lessons, featured.id);
            const directChildren = getDirectChildSeries(data.series, featured.id);
            const style = ACCENT_STYLES[featured.coverAccent] || ACCENT_STYLES.emerald;
            const quickSurahs = directChildren.slice(0, 6);

            return (
              <div className="space-y-6">
                {/* Full-Width Editorial Featured Series Banner */}
                <div className="rounded-3xl border border-[#EAD5E1] bg-gradient-to-l from-white via-[#FCF7FA] to-[#F4FAF6] overflow-hidden shadow-[0_10px_34px_rgba(142,58,122,0.06)]">
                  <div className={`h-2 bg-gradient-to-l ${style.bar}`} />
                  <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF4EE] text-[#2E5741] border border-[#C8DFCF]">
                          {featured.category}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]">
                          {featured.status === "completed" ? "سلسلة مكتملة" : "سلسلة مستمرة ومحدثة"}
                        </span>
                      </div>

                      <h3 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2B1626] leading-snug">
                        {featured.title}
                      </h3>

                      <p className="mt-2.5 text-sm sm:text-base text-[#5C3D55] leading-relaxed">
                        {featured.description || "شروحات وتدبرات منهجية مرتّبة حسب السور القرآنية للأستاذة فاطمة حجازي."}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold">
                        {directChildren.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 text-[#2E5741]">
                            <FolderOpen className="w-4 h-4 text-[#3D6B52]" />
                            <span>{directChildren.length} سورة وقائمة فرعية</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[#8E3A7A]">
                          <Headphones className="w-4 h-4 text-[#B8559B]" />
                          <span>{recStats.totalLessonsCount} درس مسجل</span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={`/series/${featured.id}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#2E5741] hover:bg-[#234432] text-white text-sm sm:text-base font-bold shadow-[0_6px_20px_rgba(46,87,65,0.22)] transition-all hover:-translate-y-0.5"
                      >
                        <span>
                          {directChildren.length > 0
                            ? `استعراض جميع السور (${directChildren.length})`
                            : "فتح السلسلة"}
                        </span>
                        <ArrowLeft className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Quick Access Grid for Top 6 Surahs / Sub-Series */}
                {quickSurahs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className="font-serif-arabic text-lg sm:text-xl font-bold text-[#2B1626] flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-[#3D6B52]" />
                        <span>ابدأ التصفّح مباشرة من السور</span>
                      </h3>
                      {directChildren.length > quickSurahs.length && (
                        <Link
                          href={`/series/${featured.id}`}
                          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#8E3A7A] hover:text-[#6F2B5F]"
                        >
                          <span>عرض الكل ({directChildren.length})</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {quickSurahs.map((child) => {
                        const childStats = getRecursiveSeriesStats(data.series, data.lessons, child.id);
                        return (
                          <Link
                            key={child.id}
                            href={`/series/${child.id}`}
                            className="group rounded-2xl border border-[#EAD5E1] bg-white p-4 sm:p-5 hover:border-[#3D6B52] hover:shadow-[0_8px_24px_rgba(61,107,82,0.09)] transition-all flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#EBF4EE] border border-[#C8DFCF] text-[#2E5741] flex items-center justify-center shrink-0 group-hover:bg-[#2E5741] group-hover:text-white transition-colors">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-serif-arabic text-lg font-bold text-[#2B1626] group-hover:text-[#8E3A7A] transition-colors truncate">
                                  {child.title}
                                </div>
                                <div className="text-xs text-[#5C3D55] mt-0.5">
                                  {childStats.totalLessonsCount}{" "}
                                  {childStats.totalLessonsCount === 1 ? "درس" : "دروس"}
                                  {childStats.directChildrenCount > 0 && (
                                    <span className="text-[#2E5741] font-medium">
                                      {" "}• {childStats.directChildrenCount} فرعي
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="shrink-0 w-8 h-8 rounded-xl bg-[#FAF3F6] text-[#8E3A7A] group-hover:bg-[#8E3A7A] group-hover:text-white flex items-center justify-center transition-colors">
                              <ArrowLeft className="w-4 h-4" />
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {directChildren.length > quickSurahs.length && (
                      <div className="mt-5 text-center">
                        <Link
                          href={`/series/${featured.id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-[#EAD5E1] hover:border-[#8E3A7A] text-xs sm:text-sm font-bold text-[#8E3A7A] hover:bg-[#FAF3F6] transition-all shadow-2xs"
                        >
                          <span>عرض بقية السور ({directChildren.length - quickSurahs.length} سورة أخرى)</span>
                          <ArrowLeft className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div
            className={`grid grid-cols-1 gap-6 ${
              filteredSeries.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredSeries.map((series) => {
              const recStats = getRecursiveSeriesStats(data.series, data.lessons, series.id);
              const directChildren = getDirectChildSeries(data.series, series.id);
              const style = ACCENT_STYLES[series.coverAccent] || ACCENT_STYLES.purple;
              const isTafsir =
                series.category.includes("تفسير") || series.category.includes("قرآن");
              const isNestedMatch = Boolean(series.parentId && seriesMap.has(series.parentId));

              return (
                <Link
                  key={series.id}
                  href={`/series/${series.id}`}
                  className="group rounded-3xl border border-[#EAD5E1] bg-white overflow-hidden hover:border-[#8E3A7A]/70 hover:shadow-[0_12px_32px_rgba(142,58,122,0.09)] transition-all flex flex-col"
                >
                  {/* Decorative Top Bar */}
                  <div className={`h-2.5 bg-gradient-to-l ${style.bar}`} />

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${isTafsir
                            ? "bg-[#EBF4EE] text-[#2E5741] border-[#C8DFCF]"
                            : "bg-[#FAF3F6] text-[#8E3A7A] border-[#EBC6DD]"
                          }`}
                      >
                        {series.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {directChildren.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF4EE] text-[#2E5741] border border-[#C8DFCF]">
                            <FolderOpen className="w-3 h-3" />
                            <span>{directChildren.length} فرعي</span>
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${series.status === "completed"
                              ? "bg-[#EBF4EE] text-[#2E5741] border-[#C8DFCF]"
                              : "bg-[#FAF3F6] text-[#B8559B] border-[#EBC6DD]"
                            }`}
                        >
                          {series.status === "completed" ? "مكتملة" : "مستمرة"}
                        </span>
                      </div>
                    </div>

                    {isNestedMatch && (
                      <div className="text-[11px] text-[#2E5741] font-medium mb-1 truncate">
                        {getSeriesPathLabel(data.series, series.parentId ?? null)}
                      </div>
                    )}

                    {/* Series Title */}
                    <h3 className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#2B1626] group-hover:text-[#8E3A7A] transition-colors leading-snug">
                      {series.title}
                    </h3>

                    {/* Series Description */}
                    <p className="mt-2.5 text-xs sm:text-sm text-[#5C3D55] line-clamp-3 leading-relaxed flex-1">
                      {series.description || "سلسلة علمية منهجية للأستاذة فاطمة حجازي."}
                    </p>

                    {/* Preview chips of nested sub-folders */}
                    {directChildren.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {directChildren.slice(0, 3).map((child) => (
                          <span
                            key={child.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#F6FAF7] border border-[#C8DFCF]/80 text-[#2E5741] font-medium"
                          >
                            <FolderOpen className="w-3 h-3 text-[#3D6B52]" />
                            {child.title}
                          </span>
                        ))}
                        {directChildren.length > 3 && (
                          <span className="text-[11px] px-2 py-1 rounded-lg bg-[#FAF3F6] text-[#8E3A7A] font-semibold">
                            +{directChildren.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-6 pt-4 border-t border-[#FAF3F6] flex items-center justify-between text-xs text-[#6E4E65]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#2E5741]">
                          <BookOpen className="w-3.5 h-3.5 text-[#3D6B52]" />
                          {recStats.totalLessonsCount}{" "}
                          {recStats.totalLessonsCount === 1 ? "درس" : "دروس"}
                        </span>
                        {recStats.totalSeconds > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#B8559B]" />
                            {formatTotalDurationArabic(recStats.totalSeconds)}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-[#8E3A7A] font-bold group-hover:-translate-x-1 transition-transform">
                        <span>استعراض</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 4. LATEST LESSONS – الدروس والمحاضرات الصوتية                      */}
      {/* ================================================================= */}
      <section id="lessons" className="max-w-6xl mx-auto px-4 mt-14 sm:mt-16 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#EAD5E1]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2B1626]">
                أحدث الدروس والمحاضرات الصوتية
              </h2>
              <p className="text-xs sm:text-sm text-[#5C3D55] mt-0.5">
                استمع مباشرة بنقاء صوتي عالي، أو حمّل الملفات بصيغة MP3 مجاناً
              </p>
            </div>
          </div>

          {/* Filter Tabs — only show if standalone lessons exist */}
          {singleLessonsCount > 0 && (
            <div className="inline-flex rounded-2xl border border-[#EAD5E1] bg-white p-1 self-start shadow-xs">
              <button
                type="button"
                onClick={() => setLessonTab("all")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${lessonTab === "all"
                    ? "bg-[#8E3A7A] text-white shadow-xs"
                    : "text-[#5C3D55] hover:text-[#8E3A7A]"
                  }`}
              >
                جميع الدروس ({data.lessons.length})
              </button>
              <button
                type="button"
                onClick={() => setLessonTab("single")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${lessonTab === "single"
                    ? "bg-[#8E3A7A] text-white shadow-xs"
                    : "text-[#5C3D55] hover:text-[#8E3A7A]"
                  }`}
              >
                دروس مفردة ({singleLessonsCount})
              </button>
            </div>
          )}
        </div>

        {filteredLessons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#EAD5E1] bg-white/80 p-14 text-center text-sm text-[#6E4E65]">
            لا توجد دروس مطابقة لمعايير البحث الحالية.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedLessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  series={lesson.seriesId ? seriesMap.get(lesson.seriesId) : null}
                  queue={filteredLessons}
                />
              ))}
            </div>

            {filteredLessons.length > LESSONS_PER_PAGE && (
              <div className="mt-7 rounded-2xl border border-[#EAD5E1] bg-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                <div className="text-xs sm:text-sm text-[#5C3D55]">
                  عرض{" "}
                  <strong className="text-[#8E3A7A]">
                    {pageStartIdx + 1} – {Math.min(pageStartIdx + LESSONS_PER_PAGE, filteredLessons.length)}
                  </strong>{" "}
                  من أصل{" "}
                  <strong className="text-[#2E5741]">{filteredLessons.length}</strong> درساً
                  <span className="mx-2 text-[#D68FBF]">•</span>
                  <span>
                    صفحة <strong>{currentLessonsPage}</strong> من{" "}
                    <strong>{totalLessonsPages}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={currentLessonsPage <= 1}
                    onClick={() => goToLessonsPage(currentLessonsPage - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EAD5E1] bg-white text-xs sm:text-sm font-semibold text-[#8E3A7A] hover:bg-[#FAF3F6] hover:border-[#8E3A7A] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#EAD5E1]"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentLessonsPage >= totalLessonsPages}
                    onClick={() => goToLessonsPage(currentLessonsPage + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8E3A7A] hover:bg-[#752D64] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[#8E3A7A]"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ================================================================= */}
      {/* 5. ABOUT & PLATFORM IDENTITY – نبذة عن الأستاذة وشعار المنصة       */}
      {/* ================================================================= */}
      <section
        id="about"
        className="max-w-6xl mx-auto px-4 mt-20 sm:mt-24 pt-10 border-t border-[#EAD5E1]"
      >
        <div className="rounded-3xl bg-gradient-to-br from-white via-[#FAF3F6]/70 to-[#EBF4EE]/55 border border-[#EAD5E1] p-7 sm:p-11 shadow-[0_10px_36px_rgba(142,58,122,0.05)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Bio & Mission Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF4EE] border border-[#C8DFCF] text-xs font-semibold text-[#2E5741] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#3D6B52]" />
                <span>نبذة تعريفية</span>
              </div>

              <h3 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2B1626] leading-snug">
                عن الأستاذة فاطمة حجازي ومنصة «أنزله بعلمه»
              </h3>

              <p className="mt-4 text-sm sm:text-base text-[#5C3D55] leading-relaxed">
                {data.settings.bio}
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#2B1626] font-medium">
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/85 border border-[#EAD5E1]/70">
                  <CheckCircle2 className="w-4 h-4 text-[#3D6B52] shrink-0" />
                  <span>شروحات وتأملات قرآنية مبنية على الدليل</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/85 border border-[#EAD5E1]/70">
                  <CheckCircle2 className="w-4 h-4 text-[#8E3A7A] shrink-0" />
                  <span>محتوى مجاني متاح للاستماع والتحميل</span>
                </div>
              </div>
            </div>

            {/* Dignified Quranic Emblem Card (Moved gracefully out of Hero) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white/95 border border-[#C8DFCF] p-6 sm:p-7 text-center shadow-[0_8px_28px_rgba(61,107,82,0.07)]">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EBF4EE] border border-[#C8DFCF] flex items-center justify-center mb-4">
                  <span className="font-serif-arabic text-xl font-bold text-[#2E5741]">
                    ۝
                  </span>
                </div>

                <div className="font-serif-arabic text-lg sm:text-xl font-bold text-[#8E3A7A] leading-relaxed">
                  «لَّـٰكِنِ ٱللَّهُ يَشْهَدُ بِمَآ أَنزَلَ إِلَيْكَ ۖ أَنزَلَهُۥ بِعِلْمِهِۦ»
                </div>

                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E5741] bg-[#EBF4EE] px-3 py-1 rounded-full">
                  <span>شعار المنصة: أنزله بعلمه</span>
                  <span>•</span>
                  <span>سورة النساء: 166</span>
                </div>

                <p className="mt-4 pt-4 border-t border-[#FAF3F6] text-xs text-[#5C3D55] leading-relaxed">
                  محتوى علمي ودعوي مبارك — متاح للنفع العام والاستماع المباشر
                  والتحميل لوجه الله تعالى.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
