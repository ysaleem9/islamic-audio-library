"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Clock, Download, Headphones, Pause, Play, Share2 } from "lucide-react";
import type { Lesson, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { formatArabicDate, formatDuration } from "@/lib/format";

interface LessonRowProps {
  lesson: Lesson;
  series?: Series | null;
  queue?: Lesson[];
  showEpisodeBadge?: boolean;
}

export function LessonRow({ lesson, series, queue, showEpisodeBadge }: LessonRowProps) {
  const { currentLesson, isPlaying, playLesson, progressMap } = useAudioPlayer();
  const [copied, setCopied] = useState(false);

  const isCurrent = currentLesson?.id === lesson.id;
  const isThisPlaying = isCurrent && isPlaying;
  const progress = progressMap[lesson.id];
  const pct =
    progress && progress.duration > 0
      ? Math.min(100, Math.round((progress.time / progress.duration) * 100))
      : 0;

  const handleShare = async () => {
    const url = `${window.location.origin}/lessons/${lesson.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <article
      className={`group rounded-2xl border p-4 sm:p-5 transition-all ${
        isCurrent
          ? "border-[#8E3A7A] bg-[#FAF3F6] shadow-sm"
          : "border-[#EBC6DD] bg-white hover:border-[#D68FBF] hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Play button */}
        <button
          type="button"
          onClick={() => playLesson(lesson, queue)}
          aria-label={isThisPlaying ? "إيقاف الدرس" : "تشغيل الدرس"}
          className={`shrink-0 mt-0.5 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${
            isCurrent
              ? "bg-[#8E3A7A] text-white"
              : "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD] group-hover:bg-[#8E3A7A] group-hover:text-white group-hover:border-[#8E3A7A]"
          }`}
        >
          {isThisPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 fill-current mr-[-2px]" />
          )}
        </button>

        {/* Lesson Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
            {showEpisodeBadge && lesson.episodeNumber != null && (
              <span className="px-2 py-0.5 rounded-md bg-[#8E3A7A] text-white font-semibold">
                درس {lesson.episodeNumber}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-[#EBC6DD]/45 text-[#8E3A7A] font-medium">
              {lesson.category}
            </span>
            {series && (
              <Link
                href={`/series/${series.slug}`}
                className="text-[#8E3A7A] hover:underline font-medium truncate max-w-[220px]"
              >
                سلسلة: {series.title}
              </Link>
            )}
            {progress?.completed && (
              <span className="inline-flex items-center gap-1 text-[#8E3A7A] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تم الاستماع
              </span>
            )}
          </div>

          <Link
            href={`/lessons/${lesson.id}`}
            className="block font-serif-arabic text-lg sm:text-xl font-bold text-[#2D1626] hover:text-[#8E3A7A] leading-snug transition-colors"
          >
            {lesson.title}
          </Link>

          {lesson.description && (
            <p className="text-sm text-[#6E4E65] mt-1.5 line-clamp-2 leading-relaxed">
              {lesson.description}
            </p>
          )}

          {/* Partial listening progress bar */}
          {pct > 2 && !progress?.completed && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 max-w-44 rounded-full bg-[#EBC6DD] overflow-hidden">
                <div className="h-full bg-[#B8559B] rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] text-[#8E3A7A]">استكمال ({pct}%)</span>
            </div>
          )}

          {/* Meta & actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#FAF3F6]">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#6E4E65]">
              {lesson.durationSeconds > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#B8559B]" />
                  {formatDuration(lesson.durationSeconds)}
                </span>
              )}
              {lesson.publishedAt && <span>{formatArabicDate(lesson.publishedAt)}</span>}
              <span className="inline-flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" />
                {lesson.playsCount.toLocaleString("ar-EG")} استماع
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                title="نسخ رابط الدرس"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-[#EBC6DD] text-[#6E4E65] hover:text-[#8E3A7A] hover:border-[#8E3A7A] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#8E3A7A]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? "تم النسخ" : "مشاركة"}</span>
              </button>
              <a
                href={lesson.audioUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-[#EBC6DD] bg-[#FAF3F6] text-[#8E3A7A] hover:bg-[#EBC6DD]/50 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
