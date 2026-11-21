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
          ? "border-[#14533c] bg-[#f4faf6] shadow-sm"
          : "border-[#e6dfd1] bg-white hover:border-[#c8bca4] hover:shadow-sm"
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
              ? "bg-[#14533c] text-white"
              : "bg-[#eef5f1] text-[#14533c] group-hover:bg-[#14533c] group-hover:text-white"
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
              <span className="px-2 py-0.5 rounded-md bg-[#14533c] text-white font-semibold">
                درس {lesson.episodeNumber}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-[#f9f3e7] text-[#8d6428] font-medium">
              {lesson.category}
            </span>
            {series && (
              <Link
                href={`/series/${series.slug}`}
                className="text-[#14533c] hover:underline font-medium truncate max-w-[220px]"
              >
                سلسلة: {series.title}
              </Link>
            )}
            {progress?.completed && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تم الاستماع
              </span>
            )}
          </div>

          <Link
            href={`/lessons/${lesson.id}`}
            className="block font-serif-arabic text-lg sm:text-xl font-bold text-[#1a2420] hover:text-[#14533c] leading-snug transition-colors"
          >
            {lesson.title}
          </Link>

          {lesson.description && (
            <p className="text-sm text-[#5a6660] mt-1.5 line-clamp-2 leading-relaxed">
              {lesson.description}
            </p>
          )}

          {/* Partial listening progress bar */}
          {pct > 2 && !progress?.completed && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 max-w-44 rounded-full bg-[#e6dfd1] overflow-hidden">
                <div className="h-full bg-[#b88a44] rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] text-[#8d6428]">استكمال ({pct}%)</span>
            </div>
          )}

          {/* Meta & actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#f0eadf]">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#5a6660]">
              {lesson.durationSeconds > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#b88a44]" />
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-[#e6dfd1] text-[#5a6660] hover:text-[#14533c] hover:border-[#14533c] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? "تم النسخ" : "مشاركة"}</span>
              </button>
              <a
                href={lesson.audioUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-[#e6dfd1] bg-[#faf8f4] text-[#14533c] hover:bg-[#eef5f1] font-medium transition-colors"
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
