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
      <section className="relative overflow-hidden bg-gradient-to-bl from-[#0e3d2b] via-[#14533c] to-[#1a6348] text-white">
        <div className="absolute inset-0 islamic-pattern pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#d4e7df] hover:text-white mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى المكتبة الرئيسية</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium text-[#f3dfb8]">
              {series.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/90">
              {series.status === "completed" ? "سلسلة مكتملة" : "سلسلة مستمرة"}
            </span>
          </div>

          <h1 className="font-serif-arabic text-3xl sm:text-4xl font-bold leading-snug">
            {series.title}
          </h1>

          <p className="mt-2 text-sm text-[#cfe3da]">{sheikhName}</p>

          {series.description && (
            <p className="mt-4 text-base text-[#e6f1ec] leading-relaxed max-w-3xl">
              {series.description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            {lessons.length > 0 && (
              <button
                type="button"
                onClick={() => playLesson(lessons[0], lessons)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#b88a44] hover:bg-[#a67a38] text-white font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>تشغيل السلسلة من البداية</span>
              </button>
            )}

            <div className="flex items-center gap-4 text-sm text-[#d9ebe3]">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#f3dfb8]" />
                {lessons.length} دروس
              </span>
              {totalSeconds > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#f3dfb8]" />
                  {formatTotalDurationArabic(totalSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 mt-10">
        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cfc0] bg-white p-12 text-center text-sm text-[#5a6660]">
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
