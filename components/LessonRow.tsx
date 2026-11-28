"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Download,
  Image as ImageIcon,
  Pause,
  Play,
} from "lucide-react";
import type { Lesson, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { formatDuration } from "@/lib/format";
import { ShareMenu } from "./ShareMenu";

interface LessonRowProps {
  lesson: Lesson;
  series?: Series | null;
  queue?: Lesson[];
  showEpisodeBadge?: boolean;
}

export function LessonRow({ lesson, series, queue, showEpisodeBadge }: LessonRowProps) {
  const { currentLesson, isPlaying, playLesson, progressMap } = useAudioPlayer();

  const isCurrent = currentLesson?.id === lesson.id;
  const isThisPlaying = isCurrent && isPlaying;
  const progress = progressMap[lesson.id];
  const pct =
    progress && progress.duration > 0
      ? Math.min(100, Math.round((progress.time / progress.duration) * 100))
      : 0;

  // Check if category is related to Quran/Tafsir to use the soft botanical green badge
  const isQuranCategory = lesson.category.includes("تفسير") || lesson.category.includes("قرآن");

  return (
    <article
      className={`group rounded-2xl border p-4 sm:p-5 transition-all ${
        isCurrent
          ? "border-[#8E3A7A] bg-[#FCF7F9] shadow-[0_4px_20px_rgba(142,58,122,0.08)]"
          : "border-[#EAD5E1] bg-white hover:border-[#8E3A7A]/60 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Play button */}
        <button
          type="button"
          onClick={() => playLesson(lesson, queue)}
          aria-label={isThisPlaying ? "إيقاف الدرس" : "تشغيل الدرس"}
          className={`shrink-0 mt-0.5 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xs cursor-pointer ${
            isCurrent
              ? "bg-[#8E3A7A] text-white"
              : "bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] group-hover:bg-[#B8559B] group-hover:border-[#B8559B] group-hover:text-white"
          }`}
        >
          {isThisPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current mr-[-2px]" />
          )}
        </button>

        {/* Lesson Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
            {showEpisodeBadge && lesson.episodeNumber != null && (
              <span className="px-2 py-0.5 rounded-lg bg-[#8E3A7A] text-white font-semibold">
                درس {lesson.episodeNumber}
              </span>
            )}
            <span
              className={`px-2.5 py-0.5 rounded-full font-medium border ${
                isQuranCategory
                  ? "bg-[#EBF4EE] text-[#3D6B52] border-[#3D6B52]/20"
                  : "bg-[#FAF3F6] text-[#8E3A7A] border-[#EBC6DD]"
              }`}
            >
              {lesson.category}
            </span>
            {series && (
              <Link
                href={`/series/${series.id}`}
                className="text-[#6E4E65] hover:text-[#8E3A7A] font-medium truncate max-w-[220px]"
              >
                سلسلة: {series.title}
              </Link>
            )}
            {lesson.mindMapImages && lesson.mindMapImages.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[#2E5741] font-semibold text-[11px] bg-[#EBF4EE] border border-[#C8DFCF] px-2 py-0.5 rounded-md">
                <ImageIcon className="w-3 h-3" />
                {lesson.mindMapImages.length === 1
                  ? "خريطة ذهنية"
                  : `${lesson.mindMapImages.length} خرائط ذهنية`}
              </span>
            )}
            {progress?.completed && (
              <span className="inline-flex items-center gap-1 text-[#3D6B52] font-semibold text-[11px] bg-[#EBF4EE] px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تم الاستماع
              </span>
            )}
          </div>

          <Link
            href={`/lessons/${lesson.id}`}
            className="block font-serif-arabic text-lg sm:text-xl font-bold text-[#2B1626] hover:text-[#8E3A7A] leading-snug transition-colors"
          >
            {lesson.title}
          </Link>

          {lesson.description && (
            <p className="mt-1.5 text-xs sm:text-sm text-[#5C3D55] line-clamp-2 leading-relaxed">
              {lesson.description}
            </p>
          )}

          {/* Progress bar if listened to partially */}
          {pct > 0 && !progress?.completed && (
            <div className="mt-2.5 max-w-xs">
              <div className="h-1.5 rounded-full bg-[#EAD5E1] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-[#8E3A7A] to-[#B8559B] rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-0.5 text-[10px] text-[#6E4E65]">
                توقفت عند {pct}% من الدرس
              </div>
            </div>
          )}

          {/* Meta footer: Duration (only if > 0) & Actions */}
          <div className="mt-3 pt-2.5 border-t border-[#FAF3F6] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E4E65]">
            <div className="flex items-center gap-3">
              {lesson.durationSeconds > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#D68FBF]" />
                  {formatDuration(lesson.durationSeconds)}
                </span>
              )}
            </div>

            {/* Actions: Download + Share */}
            <div className="flex items-center gap-1">
              {lesson.audioUrl && (
                <a
                  href={lesson.audioUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#6E4E65] hover:text-[#8E3A7A] hover:bg-[#FAF3F6] transition-colors"
                  title="تحميل مباشر بصيغة MP3"
                >
                  <Download className="w-3.5 h-3.5 text-[#B8559B]" />
                  <span>تحميل</span>
                </a>
              )}

              <ShareMenu
                title={lesson.title}
                path={`/lessons/${lesson.id}`}
                label="مشاركة"
                variant="subtle"
                align="left"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
