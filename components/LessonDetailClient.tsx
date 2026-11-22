"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Download,
  ExternalLink,
  Headphones,
  Pause,
  Play,
  Share2,
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
  const { currentLesson, isPlaying, playLesson } = useAudioPlayer();
  const [copied, setCopied] = useState(false);

  const isCurrent = currentLesson?.id === lesson.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-[#6E4E65]">
        <Link href="/" className="hover:text-[#8E3A7A] inline-flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
        {series && (
          <>
            <span>/</span>
            <Link href={`/series/${series.slug}`} className="hover:text-[#8E3A7A] font-medium">
              {series.title}
            </Link>
          </>
        )}
      </div>

      <article className="rounded-3xl border border-[#EBC6DD] bg-white overflow-hidden shadow-sm">
        <div className="bg-gradient-to-bl from-[#6F2B5F] via-[#8E3A7A] to-[#B8559B] text-white p-6 sm:p-9 relative">
          <div className="absolute inset-0 islamic-pattern pointer-events-none" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
              {lesson.episodeNumber != null && (
                <span className="px-2.5 py-1 rounded-md bg-[#B8559B] border border-[#EBC6DD]/40 text-white font-semibold">
                  الدرس رقم {lesson.episodeNumber}
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-white/15 text-[#FAF3F6]">
                {lesson.category}
              </span>
            </div>

            <h1 className="font-serif-arabic text-2xl sm:text-4xl font-bold leading-snug">
              {lesson.title}
            </h1>
            <p className="mt-2 text-sm text-[#EBC6DD]">{sheikhName}</p>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#FAF3F6]">
              {lesson.durationSeconds > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#EBC6DD]" />
                  {formatDuration(lesson.durationSeconds)}
                </span>
              )}
              {lesson.publishedAt && <span>{formatArabicDate(lesson.publishedAt)}</span>}
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-[#EBC6DD]" />
                {lesson.playsCount.toLocaleString("ar-EG")} استماع
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  playLesson(
                    lesson,
                    relatedLessons.length > 0 ? relatedLessons : [lesson]
                  )
                }
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#B8559B] hover:bg-[#D68FBF] hover:text-[#2D1626] border border-[#EBC6DD]/40 text-white font-semibold shadow-md transition-colors cursor-pointer"
              >
                {isThisPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>استمع للدرس الآن</span>
                  </>
                )}
              </button>

              <a
                href={lesson.audioUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الصوت (MP3)</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#EBC6DD]" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? "تم نسخ الرابط" : "مشاركة"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-9 space-y-7">
          {lesson.description && (
            <div>
              <h2 className="font-serif-arabic text-xl font-bold text-[#8E3A7A] mb-2">
                نبذة عن الدرس
              </h2>
              <p className="text-[#4A2C40] leading-relaxed whitespace-pre-line">
                {lesson.description}
              </p>
            </div>
          )}

          {lesson.notes && (
            <div className="rounded-2xl bg-[#FAF3F6] border border-[#EBC6DD] p-5">
              <h2 className="font-serif-arabic text-xl font-bold text-[#8E3A7A] mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#B8559B]" />
                <span>محاور وفوائد الدرس</span>
              </h2>
              <div className="text-sm sm:text-base text-[#2D1626] leading-loose whitespace-pre-line">
                {lesson.notes}
              </div>
            </div>
          )}

          {lesson.archiveIdentifier && (
            <div className="pt-2 text-xs text-[#6E4E65] flex items-center gap-2">
              <span>مُستضاف مجاناً على أرشيف الإنترنت (Internet Archive):</span>
              <a
                href={`https://archive.org/details/${encodeURIComponent(lesson.archiveIdentifier)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#8E3A7A] hover:underline font-medium"
              >
                <span>عرض المصدر</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </article>

      {relatedLessons.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif-arabic text-2xl font-bold text-[#2D1626] mb-4">
            {series ? `بقية دروس سلسلة: ${series.title}` : "دروس ذات صلة"}
          </h2>
          <div className="space-y-3">
            {relatedLessons
              .filter((l) => l.id !== lesson.id)
              .map((item) => (
                <LessonRow
                  key={item.id}
                  lesson={item}
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
