"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderOpen,
  Layers,
  Play,
} from "lucide-react";
import type { Lesson, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { LessonRow } from "./LessonRow";
import { ShareMenu } from "./ShareMenu";
import { formatTotalDurationArabic } from "@/lib/format";
import {
  getDirectChildSeries,
  getRecursiveSeriesStats,
  getSeriesAncestors,
} from "@/lib/seriesTree";

export function SeriesDetailClient({
  series,
  lessons,
  allSeries = [],
  allLessons = [],
  sheikhName,
}: {
  series: Series;
  lessons: Lesson[];
  allSeries?: Series[];
  allLessons?: Lesson[];
  sheikhName: string;
}) {
  const { playLesson } = useAudioPlayer();
  const [lessonsPage, setLessonsPage] = useState(1);
  const LESSONS_PER_PAGE = 5;

  useEffect(() => {
    setLessonsPage(1);
  }, [series.id]);

  const totalLessonsPages = Math.max(1, Math.ceil(lessons.length / LESSONS_PER_PAGE));
  const currentLessonsPage = Math.min(lessonsPage, totalLessonsPages);
  const pageStartIdx = (currentLessonsPage - 1) * LESSONS_PER_PAGE;
  const paginatedLessons = lessons.slice(pageStartIdx, pageStartIdx + LESSONS_PER_PAGE);

  const goToLessonsPage = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalLessonsPages, nextPage));
    setLessonsPage(clamped);
    const el = document.getElementById("series-lessons");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const ancestors = useMemo(
    () => getSeriesAncestors(allSeries, series.id),
    [allSeries, series.id]
  );

  const childSeries = useMemo(
    () => getDirectChildSeries(allSeries, series.id),
    [allSeries, series.id]
  );

  const recursiveStats = useMemo(() => {
    if (allSeries.length > 0 && allLessons.length > 0) {
      return getRecursiveSeriesStats(allSeries, allLessons, series.id);
    }
    return {
      directLessonsCount: lessons.length,
      totalLessonsCount: lessons.length,
      totalSeconds: lessons.reduce((acc, l) => acc + (l.durationSeconds || 0), 0),
      directChildrenCount: childSeries.length,
      totalDescendantsCount: childSeries.length,
    };
  }, [allSeries, allLessons, series.id, lessons, childSeries.length]);

  return (
    <main className="flex-1 pb-24">
      {/* Series Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF3F6] via-white to-[#F6FAF7] border-b border-[#EAD5E1]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EBC6DD]/30 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3D6B52]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute inset-0 organic-lines-pattern pointer-events-none opacity-40" />

        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 relative z-10">
          {/* Hierarchical Breadcrumb Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <nav
              aria-label="مسار السلسلة"
              className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-semibold"
            >
              <Link
                href="/#series"
                className="inline-flex items-center gap-1.5 text-[#8E3A7A] hover:text-[#B8559B] transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>جميع السلاسل</span>
              </Link>

              {ancestors.map((ancestor) => (
                <React.Fragment key={ancestor.id}>
                  <ChevronLeft className="w-3.5 h-3.5 text-[#D68FBF]" />
                  <Link
                    href={`/series/${ancestor.id}`}
                    className="text-[#2E5741] hover:text-[#8E3A7A] transition-colors"
                  >
                    {ancestor.title}
                  </Link>
                </React.Fragment>
              ))}

              <ChevronLeft className="w-3.5 h-3.5 text-[#D68FBF]" />
              <span className="text-[#5C3D55]">{series.title}</span>
            </nav>

            <ShareMenu
              title={series.title}
              path={`/series/${series.id}`}
              label="مشاركة القائمة"
              variant="button"
              align="left"
            />
          </div>

          {/* Series Meta Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#EBF4EE] text-[#2E5741] border border-[#C8DFCF]">
              {series.category}
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                series.status === "completed"
                  ? "bg-[#EBF4EE] text-[#2E5741] border-[#C8DFCF]"
                  : "bg-[#FAF3F6] text-[#8E3A7A] border-[#EBC6DD]"
              }`}
            >
              {series.status === "completed" ? "سلسلة مكتملة" : "سلسلة مستمرة ومحدثة"}
            </span>
            <span className="text-xs text-[#6E4E65] font-medium hidden sm:inline">
              {sheikhName.startsWith("الأستاذة") ? sheikhName : `الأستاذة ${sheikhName}`}
            </span>
          </div>

          {/* Series Title */}
          <h1 className="font-serif-arabic text-3xl sm:text-5xl font-bold leading-tight text-[#2B1626]">
            {series.title}
          </h1>

          {/* Series Description */}
          {series.description && (
            <p className="mt-4 text-sm sm:text-base text-[#5C3D55] leading-relaxed max-w-3xl">
              {series.description}
            </p>
          )}

          {/* Action Row & Stats */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {lessons.length > 0 && (
              <button
                type="button"
                onClick={() => playLesson(lessons[0], lessons)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#8E3A7A] hover:bg-[#752D64] text-white font-bold shadow-[0_6px_20px_rgba(142,58,122,0.28)] transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current mr-[-2px]" />
                <span>تشغيل من الدرس الأول</span>
              </button>
            )}

            <div className="inline-flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-2xl bg-white border border-[#EAD5E1] text-xs sm:text-sm text-[#5C3D55] shadow-2xs">
              {childSeries.length > 0 && (
                <>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#2E5741]">
                    <FolderOpen className="w-4 h-4 text-[#3D6B52]" />
                    {childSeries.length}{" "}
                    {childSeries.length === 1 ? "قائمة فرعية" : "قوائم فرعية"}
                  </span>
                  <span className="h-3.5 w-[1px] bg-[#EAD5E1]" />
                </>
              )}
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#8E3A7A]">
                <BookOpen className="w-4 h-4 text-[#3D6B52]" />
                {recursiveStats.totalLessonsCount}{" "}
                {recursiveStats.totalLessonsCount === 1 ? "درس مسجل" : "دروس مسجلة"}
              </span>
              {recursiveStats.totalSeconds > 0 && (
                <>
                  <span className="h-3.5 w-[1px] bg-[#EAD5E1]" />
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-[#B8559B]" />
                    {formatTotalDurationArabic(recursiveStats.totalSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Series / Nested Folders Grid */}
      {childSeries.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mt-12">
          <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[#EAD5E1]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EBF4EE] border border-[#C8DFCF] text-[#2E5741] flex items-center justify-center">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#2B1626]">
                  القوائم الفرعية داخل «{series.title}»
                </h2>
                <p className="text-xs text-[#6E4E65]">
                  اختر القائمة الفرعية لاستعراض الدروس والأقسام التابعة لها
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-[#2E5741] bg-[#EBF4EE] px-3 py-1 rounded-full border border-[#C8DFCF]">
              {childSeries.length} {childSeries.length === 1 ? "قائمة" : "قوائم"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {childSeries.map((child) => {
              const childStats = getRecursiveSeriesStats(allSeries, allLessons, child.id);
              return (
                <Link
                  key={child.id}
                  href={`/series/${child.id}`}
                  className="group rounded-2xl border border-[#EAD5E1] bg-white p-5 hover:border-[#3D6B52] hover:shadow-[0_10px_28px_rgba(61,107,82,0.09)] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EBF4EE] border border-[#C8DFCF] text-[#2E5741] flex items-center justify-center group-hover:bg-[#2E5741] group-hover:text-white transition-colors">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          child.status === "completed"
                            ? "bg-[#EBF4EE] text-[#2E5741] border-[#C8DFCF]"
                            : "bg-[#FAF3F6] text-[#8E3A7A] border-[#EBC6DD]"
                        }`}
                      >
                        {child.status === "completed" ? "مكتملة" : "مستمرة"}
                      </span>
                    </div>

                    <h3 className="font-serif-arabic text-xl font-bold text-[#2B1626] group-hover:text-[#8E3A7A] transition-colors leading-snug">
                      {child.title}
                    </h3>

                    {child.description && (
                      <p className="mt-2 text-xs text-[#5C3D55] line-clamp-2 leading-relaxed">
                        {child.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#FAF3F6] flex items-center justify-between text-xs text-[#6E4E65]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#2E5741]">
                        <BookOpen className="w-3.5 h-3.5 text-[#3D6B52]" />
                        {childStats.totalLessonsCount}{" "}
                        {childStats.totalLessonsCount === 1 ? "درس" : "دروس"}
                      </span>
                      {childStats.directChildrenCount > 0 && (
                        <span className="text-[#8E3A7A] font-medium">
                          • {childStats.directChildrenCount} فرعي
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[#8E3A7A] font-bold group-hover:-translate-x-1 transition-transform">
                      <span>فتح</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Direct Series Lessons List Section */}
      {(lessons.length > 0 || childSeries.length === 0) && (
        <section id="series-lessons" className="max-w-5xl mx-auto px-4 mt-12 scroll-mt-24">
          <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[#EAD5E1]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#2B1626]">
                  {childSeries.length > 0 ? "الدروس المباشرة في هذه القائمة" : "فهرس دروس السلسلة"}
                </h2>
                <p className="text-xs text-[#6E4E65]">
                  مرتبة منهجياً — اضغط على أي درس للاستماع المباشر أو التحميل
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-[#8E3A7A] bg-[#FAF3F6] px-3 py-1 rounded-full border border-[#EBC6DD]">
              {lessons.length} دروس
            </span>
          </div>

          {lessons.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#EAD5E1] bg-white p-14 text-center text-sm text-[#6E4E65]">
              لم تُضف دروس إلى هذه القائمة بعد.
            </div>
          ) : (
            <>
              <div className="space-y-3.5">
                {paginatedLessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    series={series}
                    queue={lessons}
                    showEpisodeBadge
                  />
                ))}
              </div>

              {lessons.length > LESSONS_PER_PAGE && (
                <div className="mt-7 rounded-2xl border border-[#EAD5E1] bg-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                  <div className="text-xs sm:text-sm text-[#5C3D55]">
                    عرض{" "}
                    <strong className="text-[#8E3A7A]">
                      {pageStartIdx + 1} – {Math.min(pageStartIdx + LESSONS_PER_PAGE, lessons.length)}
                    </strong>{" "}
                    من أصل{" "}
                    <strong className="text-[#2E5741]">{lessons.length}</strong> درساً
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
      )}
    </main>
  );
}
