"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Layers,
  Play,
  Sparkles,
  Share2,
  Check,
} from "lucide-react";
import type { Lesson, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { LessonRow } from "./LessonRow";
import { formatTotalDurationArabic } from "@/lib/format";

export function SeriesDetailClient({
  series,
  lessons,
  sheikhName,
}: {
  series: Series;
  lessons: Lesson[];
  sheikhName: string;
}) {
  const { playLesson } = useAudioPlayer();
  const [copied, setCopied] = useState(false);

  const totalSeconds = lessons.reduce((acc, l) => acc + (l.durationSeconds || 0), 0);

  const handleShareSeries = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <main className="flex-1 pb-24">
      {/* Series Hero Section (Card & Gradient) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF3F6] via-white to-[#FAF3F6] border-b border-[#EAD5E1]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EBC6DD]/30 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3D6B52]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute inset-0 organic-lines-pattern pointer-events-none opacity-40" />

        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 relative z-10">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              href="/#series"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8E3A7A] hover:text-[#B8559B] transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى جميع السلاسل العلمية</span>
            </Link>

            <button
              type="button"
              onClick={handleShareSeries}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAD5E1] bg-white text-xs font-semibold text-[#8E3A7A] hover:bg-[#FAF3F6] transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#8E3A7A]" />
                  <span>تم نسخ الرابط</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#B8559B]" />
                  <span>مشاركة السلسلة</span>
                </>
              )}
            </button>
          </div>

          {/* Series Meta Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#EBF4EE] text-[#3D6B52] border border-[#3D6B52]/20">
              {series.category}
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                series.status === "completed"
                  ? "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]"
                  : "bg-[#FFF4E5] text-[#B8559B] border border-[#FFE0B2]"
              }`}
            >
              {series.status === "completed" ? "سلسلة مكتملة" : "سلسلة مستمرة ومحدثة"}
            </span>
            <span className="text-xs text-[#6E4E65] font-medium hidden sm:inline">
              الداعية {sheikhName}
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

          {/* Action Row & Stats Cards */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {lessons.length > 0 && (
              <button
                type="button"
                onClick={() => playLesson(lessons[0], lessons)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E3A7A] to-[#B8559B] hover:opacity-95 text-white font-bold shadow-[0_4px_20px_rgba(184,85,155,0.35)] transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current mr-[-2px]" />
                <span>تشغيل السلسلة من الدرس الأول</span>
              </button>
            )}

            <div className="inline-flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-white border border-[#EAD5E1] text-xs sm:text-sm text-[#5C3D55] shadow-2xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#8E3A7A]">
                <BookOpen className="w-4 h-4 text-[#3D6B52]" />
                {lessons.length} {lessons.length === 1 ? "درس مسجل" : "دروس مسجلة"}
              </span>
              {totalSeconds > 0 && (
                <>
                  <span className="h-3.5 w-[1px] bg-[#EAD5E1]" />
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-[#D68FBF]" />
                    {formatTotalDurationArabic(totalSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Series Lessons List Section (Card-Based Layout) */}
      <section className="max-w-5xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[#EAD5E1]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#2B1626]">
                فهرس دروس السلسلة
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
            لم تُضف دروس إلى هذه السلسلة بعد.
          </div>
        ) : (
          <div className="space-y-3.5">
            {lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                series={series}
                queue={lessons}
                showEpisodeBadge
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
