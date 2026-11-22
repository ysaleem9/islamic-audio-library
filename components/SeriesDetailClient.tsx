"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Play } from "lucide-react";
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
  const totalSeconds = lessons.reduce((acc, l) => acc + (l.durationSeconds || 0), 0);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-gradient-to-bl from-[#6F2B5F] via-[#8E3A7A] to-[#B8559B] text-white">
        <div className="absolute inset-0 islamic-pattern pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#EBC6DD] hover:text-white mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى المكتبة الرئيسية</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium text-[#FAF3F6]">
              {series.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/90">
              {series.status === "completed" ? "سلسلة مكتملة" : "سلسلة مستمرة"}
            </span>
          </div>

          <h1 className="font-serif-arabic text-3xl sm:text-4xl font-bold leading-snug">
            {series.title}
          </h1>

          <p className="mt-2 text-sm text-[#EBC6DD]">{sheikhName}</p>

          {series.description && (
            <p className="mt-4 text-base text-[#FAF3F6]/90 leading-relaxed max-w-3xl">
              {series.description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            {lessons.length > 0 && (
              <button
                type="button"
                onClick={() => playLesson(lessons[0], lessons)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#B8559B] hover:bg-[#D68FBF] hover:text-[#2D1626] border border-[#EBC6DD]/40 text-white font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>تشغيل السلسلة من البداية</span>
              </button>
            )}

            <div className="flex items-center gap-4 text-sm text-[#FAF3F6]">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#EBC6DD]" />
                {lessons.length} دروس
              </span>
              {totalSeconds > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#EBC6DD]" />
                  {formatTotalDurationArabic(totalSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 mt-10">
        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D68FBF] bg-white p-12 text-center text-sm text-[#6E4E65]">
            لم تُضف دروس إلى هذه السلسلة بعد.
          </div>
        ) : (
          <div className="space-y-3.5">
            {lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
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
