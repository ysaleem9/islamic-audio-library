"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Download,
  ExternalLink,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { Lesson, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { LessonRow } from "./LessonRow";
import { formatArabicDate, formatDuration } from "@/lib/format";

export function LessonDetailClient({
  lesson,
  series,
  relatedLessons,
  sheikhName,
}: {
  lesson: Lesson;
  series: Series | null;
  relatedLessons: Lesson[];
  sheikhName: string;
}) {
  const { currentLesson, isPlaying, playLesson, togglePlay, seek, skipBy, currentTime, duration } =
    useAudioPlayer();
  const [copied, setCopied] = useState(false);

  const isCurrent = currentLesson?.id === lesson.id;
  const isThisPlaying = isCurrent && isPlaying;

  // Determine Previous & Next Lessons
  const queueToUse = relatedLessons.length > 0 ? relatedLessons : [lesson];
  const currentIndex = queueToUse.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? queueToUse[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < queueToUse.length - 1
      ? queueToUse[currentIndex + 1]
      : null;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handlePrimaryPlay = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playLesson(lesson, queueToUse);
    }
  };

  const activeDuration = isCurrent && duration > 0 ? duration : lesson.durationSeconds || 0;
  const activeCurrentTime = isCurrent ? currentTime : 0;
  const progressPct =
    activeDuration > 0 ? Math.min(100, (activeCurrentTime / activeDuration) * 100) : 0;

  const isQuranCategory = lesson.category.includes("تفسير") || lesson.category.includes("قرآن");

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 pb-28">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5C3D55]">
        <Link
          href="/"
          className="hover:text-[#8E3A7A] inline-flex items-center gap-1 font-semibold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>المنصة الرئيسية</span>
        </Link>
        {series && (
          <>
            <span className="text-[#EAD5E1]">/</span>
            <Link
              href={`/series/${series.id}`}
              className="hover:text-[#8E3A7A] font-semibold text-[#8E3A7A]"
            >
              سلسلة: {series.title}
            </Link>
          </>
        )}
      </nav>

      {/* Main Lesson Card (Card-Based Design) */}
      <article className="rounded-3xl border border-[#EAD5E1] bg-white overflow-hidden shadow-[0_8px_30px_rgba(142,58,122,0.06)]">
        {/* Top Header Card with Natural Gradients */}
        <div className="bg-gradient-to-b from-[#FAF3F6] via-white to-[#FAF3F6] border-b border-[#EAD5E1] p-6 sm:p-9 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#EBC6DD]/30 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute inset-0 organic-lines-pattern pointer-events-none opacity-30" />

          {/* Badges: Category & Episode */}
          <div className="flex flex-wrap items-center gap-2 mb-3.5">
            {lesson.episodeNumber != null && (
              <span className="px-3 py-1 rounded-xl bg-[#8E3A7A] text-white text-xs font-bold shadow-2xs">
                الدرس رقم {lesson.episodeNumber}
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isQuranCategory
                  ? "bg-[#EBF4EE] text-[#3D6B52] border-[#3D6B52]/20"
                  : "bg-white border-[#EBC6DD] text-[#8E3A7A]"
              }`}
            >
              {lesson.category}
            </span>
            {series && (
              <Link
                href={`/series/${series.id}`}
                className="text-xs text-[#5C3D55] hover:text-[#8E3A7A] font-medium"
              >
                تابع لسلسلة «{series.title}»
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="font-serif-arabic text-2xl sm:text-4xl font-bold leading-snug text-[#2B1626]">
            {lesson.title}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-[#5C3D55] font-medium">
            {sheikhName.startsWith("الأستاذة") ? sheikhName : `الأستاذة ${sheikhName}`}
          </p>

          {/* Meta Info Row */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#6E4E65] pt-4 border-t border-[#EAD5E1]/60">
            {lesson.durationSeconds > 0 && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#B8559B]" />
                {formatDuration(lesson.durationSeconds)}
              </span>
            )}
            {lesson.publishedAt && (
              <span>تاريخ الإضافة: {formatArabicDate(lesson.publishedAt)}</span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-[#D68FBF]" />
              {lesson.playsCount.toLocaleString("ar-EG")} استماع
            </span>
          </div>

          {/* 3. In-Page Audio Player Box */}
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#EAD5E1] shadow-2xs">
            {/* Scrubber Range */}
            <div className="flex items-center gap-3 mb-3" dir="ltr">
              <span className="text-[11px] font-mono text-[#6E4E65] w-12 text-right">
                {formatDuration(activeCurrentTime)}
              </span>
              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={activeDuration || 100}
                  step={1}
                  value={Math.min(activeCurrentTime, activeDuration || 100)}
                  onChange={(e) => {
                    if (!isCurrent) playLesson(lesson, queueToUse);
                    seek(Number(e.target.value));
                  }}
                  aria-label="شريط تقديم وتأخير الدرس"
                  className="audio-range w-full"
                  style={{
                    background: `linear-gradient(to right, #8E3A7A ${progressPct}%, #EAD5E1 ${progressPct}%)`,
                    height: "6px",
                    borderRadius: "999px",
                  }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#6E4E65] w-12 text-left">
                {formatDuration(activeDuration)}
              </span>
            </div>

            {/* In-page Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* 15s backward */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isCurrent) playLesson(lesson, queueToUse);
                    skipBy(-15);
                  }}
                  title="تراجع 15 ثانية"
                  className="p-2 rounded-xl text-[#5C3D55] hover:bg-[#FAF3F6] border border-[#EAD5E1] transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <RotateCw className="w-4 h-4 text-[#8E3A7A]" />
                  <span>15-</span>
                </button>

                {/* Primary Play Button */}
                <button
                  type="button"
                  onClick={handlePrimaryPlay}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#8E3A7A] to-[#B8559B] hover:opacity-95 text-white font-bold shadow-[0_4px_16px_rgba(184,85,155,0.35)] transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  {isThisPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current mr-[-2px]" />
                      <span>{isCurrent ? "استئناف الاستماع" : "استمع للدرس الآن"}</span>
                    </>
                  )}
                </button>

                {/* 15s forward */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isCurrent) playLesson(lesson, queueToUse);
                    skipBy(15);
                  }}
                  title="تقديم 15 ثانية"
                  className="p-2 rounded-xl text-[#5C3D55] hover:bg-[#FAF3F6] border border-[#EAD5E1] transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <span>+15</span>
                  <RotateCcw className="w-4 h-4 text-[#8E3A7A]" />
                </button>
              </div>

              {/* Download & Share */}
              <div className="flex items-center gap-2">
                {lesson.audioUrl && (
                  <a
                    href={lesson.audioUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EAD5E1] bg-[#FAF3F6] hover:bg-white text-xs font-semibold text-[#8E3A7A] transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B8559B]" />
                    <span>تحميل MP3</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EAD5E1] bg-white text-xs font-semibold text-[#5C3D55] hover:text-[#8E3A7A] hover:bg-[#FAF3F6] transition-colors cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#8E3A7A]" />
                      <span className="text-[#8E3A7A]">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#B8559B]" />
                      <span>مشاركة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Description & Notes */}
        <div className="p-6 sm:p-9 space-y-7">
          {lesson.description && (
            <div>
              <h2 className="font-serif-arabic text-xl font-bold text-[#8E3A7A] mb-2">
                نبذة عن الدرس
              </h2>
              <p className="text-[#2B1626] leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {lesson.description}
              </p>
            </div>
          )}

          {lesson.notes && (
            <div className="rounded-2xl bg-[#FAF3F6] border border-[#EAD5E1] p-6">
              <h2 className="font-serif-arabic text-xl font-bold text-[#8E3A7A] mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#B8559B]" />
                <span>محاور وفوائد الدرس</span>
              </h2>
              <div className="text-sm sm:text-base text-[#2B1626] leading-loose whitespace-pre-line">
                {lesson.notes}
              </div>
            </div>
          )}

          {lesson.archiveIdentifier && (
            <div className="pt-2 text-xs text-[#6E4E65] flex items-center gap-2 border-t border-[#FAF3F6]">
              <span>مُستضاف على أرشيف الإنترنت (Internet Archive):</span>
              <a
                href={`https://archive.org/details/${encodeURIComponent(lesson.archiveIdentifier)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#8E3A7A] hover:underline font-medium"
              >
                <span>فتح المصدر</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </article>

      {/* 2. Previous & Next Lesson Navigation Cards */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Previous Lesson Card */}
        {prevLesson ? (
          <Link
            href={`/lessons/${prevLesson.id}`}
            className="group p-5 rounded-2xl border border-[#EAD5E1] bg-white hover:border-[#8E3A7A] hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-1 text-xs font-semibold text-[#6E4E65] group-hover:text-[#8E3A7A] mb-2">
              <ChevronRight className="w-4 h-4 text-[#8E3A7A]" />
              <span>الدرس السابق</span>
            </div>
            <div className="font-serif-arabic text-base sm:text-lg font-bold text-[#2B1626] group-hover:text-[#8E3A7A] line-clamp-2">
              {prevLesson.title}
            </div>
            <div className="mt-2 text-xs text-[#6E4E65]">
              {formatDuration(prevLesson.durationSeconds)}
            </div>
          </Link>
        ) : (
          <div className="p-5 rounded-2xl border border-dashed border-[#EAD5E1] bg-[#FAF3F6]/50 text-xs text-[#6E4E65] flex items-center justify-center">
            هذا هو الدرس الأول في هذه المجموعة
          </div>
        )}

        {/* Next Lesson Card */}
        {nextLesson ? (
          <Link
            href={`/lessons/${nextLesson.id}`}
            className="group p-5 rounded-2xl border border-[#EAD5E1] bg-white hover:border-[#8E3A7A] hover:shadow-sm transition-all flex flex-col justify-between text-left sm:text-left"
          >
            <div className="flex items-center justify-end gap-1 text-xs font-semibold text-[#6E4E65] group-hover:text-[#8E3A7A] mb-2">
              <span>الدرس التالي</span>
              <ChevronLeft className="w-4 h-4 text-[#8E3A7A]" />
            </div>
            <div className="font-serif-arabic text-base sm:text-lg font-bold text-[#2B1626] group-hover:text-[#8E3A7A] line-clamp-2 text-right">
              {nextLesson.title}
            </div>
            <div className="mt-2 text-xs text-[#6E4E65] text-right">
              {formatDuration(nextLesson.durationSeconds)}
            </div>
          </Link>
        ) : (
          <div className="p-5 rounded-2xl border border-dashed border-[#EAD5E1] bg-[#FAF3F6]/50 text-xs text-[#6E4E65] flex items-center justify-center">
            وصلت إلى آخر درس مسجل في هذه المجموعة
          </div>
        )}
      </section>

      {/* 2. Related Lessons / Series Lessons */}
      {relatedLessons.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[#EAD5E1]">
            <div>
              <h2 className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#2B1626]">
                {series ? `بقية دروس سلسلة: ${series.title}` : "دروس ومحاضرات أخرى مرتبطة بالموضوع"}
              </h2>
              <p className="text-xs text-[#6E4E65] mt-0.5">
                {series ? "تابع بقية السلسلة بالترتيب" : "استمع إلى دروس أخرى في نفس الباب العلمي"}
              </p>
            </div>

            {series && (
              <Link
                href={`/series/${series.id}`}
                className="text-xs font-bold text-[#8E3A7A] hover:text-[#B8559B]"
              >
                عرض فهرس السلسلة كاملة
              </Link>
            )}
          </div>

          <div className="space-y-3.5">
            {relatedLessons
              .filter((l) => l.id !== lesson.id)
              .map((item) => (
                <LessonRow
                  key={item.id}
                  lesson={item}
                  series={series}
                  queue={relatedLessons}
                  showEpisodeBadge={Boolean(series)}
                />
              ))}
          </div>
        </section>
      )}
    </main>
  );
}
