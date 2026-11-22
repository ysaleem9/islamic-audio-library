"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  Loader2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useAudioPlayer } from "./AudioPlayerContext";
import { formatDuration } from "@/lib/format";

const RATES = [1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS = [
  { label: "إيقاف المؤقت", value: null },
  { label: "15 دقيقة", value: 15 },
  { label: "30 دقيقة", value: 30 },
  { label: "60 دقيقة", value: 60 },
];

export function AudioPlayerBar() {
  const {
    currentLesson,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    playbackRate,
    sleepMinutesLeft,
    togglePlay,
    seek,
    skipBy,
    playNext,
    playPrevious,
    setPlaybackRate,
    setSleepTimer,
    closePlayer,
    hasNext,
    hasPrevious,
  } = useAudioPlayer();

  const [showSleepMenu, setShowSleepMenu] = useState(false);

  if (!currentLesson) return null;

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const cycleRate = () => {
    const idx = RATES.indexOf(playbackRate);
    const next = RATES[(idx + 1) % RATES.length];
    setPlaybackRate(next);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-[#EBC6DD] bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(142,58,122,0.10)]">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Progress bar row */}
        <div className="flex items-center gap-3 mb-2" dir="ltr">
          <span className="text-[11px] font-mono text-[#6E4E65] w-11 text-right">
            {formatDuration(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={1}
              value={Math.min(currentTime, duration || 100)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="تقدم الدرس الصوتي"
              className="audio-range w-full"
              style={{
                background: `linear-gradient(to right, #8E3A7A ${progressPct}%, #EBC6DD ${progressPct}%)`,
                height: "6px",
                borderRadius: "999px",
              }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#6E4E65] w-11">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Main controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Lesson info */}
          <div className="min-w-0 flex-1 max-w-md">
            <Link
              href={`/lessons/${currentLesson.id}`}
              className="block font-semibold text-sm text-[#2D1626] hover:text-[#8E3A7A] truncate transition-colors"
            >
              {currentLesson.title}
            </Link>
            <div className="flex items-center gap-2 text-xs text-[#6E4E65] mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-[#EBC6DD]/40 text-[#8E3A7A] font-medium">
                {currentLesson.category}
              </span>
              {error && <span className="text-red-600 truncate">{error}</span>}
              {sleepMinutesLeft !== null && (
                <span className="text-[#B8559B] flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  يتوقف بعد {sleepMinutesLeft} د
                </span>
              )}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={playPrevious}
              disabled={!hasPrevious}
              title="الدرس السابق"
              className="p-2 rounded-full text-[#2D1626] hover:bg-[#FAF3F6] disabled:opacity-30 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => skipBy(-15)}
              title="تراجع 15 ثانية"
              className="p-2 rounded-full text-[#2D1626] hover:bg-[#FAF3F6] transition-colors flex items-center gap-0.5 text-[11px]"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">15</span>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
              className="w-11 h-11 rounded-full bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-current mr-[-2px]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipBy(15)}
              title="تقديم 15 ثانية"
              className="p-2 rounded-full text-[#2D1626] hover:bg-[#FAF3F6] transition-colors flex items-center gap-0.5 text-[11px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">15</span>
            </button>

            <button
              type="button"
              onClick={playNext}
              disabled={!hasNext}
              title="الدرس التالي"
              className="p-2 rounded-full text-[#2D1626] hover:bg-[#FAF3F6] disabled:opacity-30 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
          </div>

          {/* Utility controls */}
          <div className="flex items-center gap-1.5 relative">
            <button
              type="button"
              onClick={cycleRate}
              title="سرعة التشغيل"
              className="px-2.5 py-1.5 rounded-lg border border-[#EBC6DD] text-xs font-semibold text-[#2D1626] hover:bg-[#FAF3F6] transition-colors"
              dir="ltr"
            >
              {playbackRate}x
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSleepMenu((v) => !v)}
                title="مؤقت النوم"
                className={`p-2 rounded-lg border transition-colors ${
                  sleepMinutesLeft !== null
                    ? "border-[#B8559B] bg-[#FAF3F6] text-[#8E3A7A]"
                    : "border-[#EBC6DD] text-[#6E4E65] hover:bg-[#FAF3F6]"
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
              {showSleepMenu && (
                <div className="absolute bottom-12 left-0 w-36 rounded-xl border border-[#EBC6DD] bg-white shadow-lg py-1 z-50">
                  {SLEEP_OPTIONS.map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => {
                        setSleepTimer(opt.value);
                        setShowSleepMenu(false);
                      }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-[#FAF3F6] text-[#2D1626]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href={currentLesson.audioUrl}
              download
              target="_blank"
              rel="noreferrer"
              title="تحميل الملف الصوتي"
              className="p-2 rounded-lg border border-[#EBC6DD] text-[#8E3A7A] hover:bg-[#FAF3F6] transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={closePlayer}
              title="إغلاق المشغل"
              className="p-2 rounded-lg text-[#6E4E65] hover:bg-[#FAF3F6] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
