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
  Volume1,
  Volume2,
  VolumeX,
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
    volume,
    isMuted,
    sleepMinutesLeft,
    togglePlay,
    seek,
    skipBy,
    playNext,
    playPrevious,
    setPlaybackRate,
    setVolume,
    toggleMute,
    setSleepTimer,
    closePlayer,
    hasNext,
    hasPrevious,
  } = useAudioPlayer();

  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showRemainingTime, setShowRemainingTime] = useState(false);

  if (!currentLesson) return null;

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const remainingTime = Math.max(0, duration - currentTime);

  const cycleRate = () => {
    const idx = RATES.indexOf(playbackRate);
    const next = RATES[(idx + 1) % RATES.length];
    setPlaybackRate(next);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-[#EAD5E1] bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(142,58,122,0.08)]">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Progress bar row */}
        <div className="flex items-center gap-3 mb-2" dir="ltr">
          <span className="text-[11px] font-mono text-[#6E4E65] w-12 text-right select-none">
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
              aria-label="شريط تقدم التسجيل الصوتي"
              className="audio-range w-full"
              style={{
                background: `linear-gradient(to right, #8E3A7A ${progressPct}%, #EAD5E1 ${progressPct}%)`,
                height: "6px",
                borderRadius: "999px",
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowRemainingTime(!showRemainingTime)}
            title="انقر للتبديل بين إجمالي الوقت والوقت المتبقي"
            className="text-[11px] font-mono text-[#6E4E65] hover:text-[#8E3A7A] w-14 text-left select-none cursor-pointer transition-colors"
          >
            {showRemainingTime ? `-${formatDuration(remainingTime)}` : formatDuration(duration)}
          </button>
        </div>

        {/* Main controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Lesson info */}
          <div className="min-w-0 flex-1 max-w-sm sm:max-w-md">
            <Link
              href={`/lessons/${currentLesson.id}`}
              className="block font-semibold text-sm text-[#2B1626] hover:text-[#8E3A7A] truncate transition-colors"
            >
              {currentLesson.title}
            </Link>
            <div className="flex items-center gap-2 text-xs text-[#6E4E65] mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] font-medium text-[11px]">
                {currentLesson.category}
              </span>
              {error && <span className="text-red-600 truncate">{error}</span>}
              {sleepMinutesLeft !== null && (
                <span className="text-[#8E3A7A] flex items-center gap-1 font-medium">
                  <Moon className="w-3 h-3 text-[#B8559B]" />
                  يتوقف بعد {sleepMinutesLeft} د
                </span>
              )}
            </div>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={playPrevious}
              disabled={!hasPrevious}
              title="الدرس السابق"
              className="p-2 rounded-xl text-[#2B1626] hover:bg-[#FAF3F6] disabled:opacity-30 transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4 text-[#8E3A7A]" />
            </button>

            <button
              type="button"
              onClick={() => skipBy(-15)}
              title="تراجع 15 ثانية"
              className="p-2 rounded-xl text-[#2B1626] hover:bg-[#FAF3F6] transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-[#8E3A7A]" />
              <span className="hidden sm:inline font-mono text-xs text-[#6E4E65]">15</span>
            </button>

            {/* Play/Pause main button */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8E3A7A] to-[#B8559B] hover:opacity-95 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(142,58,122,0.3)] transition-transform active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current mr-[-2px]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipBy(15)}
              title="تقديم 15 ثانية"
              className="p-2 rounded-xl text-[#2B1626] hover:bg-[#FAF3F6] transition-colors flex items-center gap-0.5 text-[11px] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#8E3A7A]" />
              <span className="hidden sm:inline font-mono text-xs text-[#6E4E65]">15</span>
            </button>

            <button
              type="button"
              onClick={playNext}
              disabled={!hasNext}
              title="الدرس التالي"
              className="p-2 rounded-xl text-[#2B1626] hover:bg-[#FAF3F6] disabled:opacity-30 transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4 text-[#8E3A7A]" />
            </button>
          </div>

          {/* Utility controls: Volume, Speed, Sleep timer, Download, Close */}
          <div className="flex items-center gap-1.5 relative">
            {/* Speed Rate */}
            <button
              type="button"
              onClick={cycleRate}
              title="سرعة التشغيل"
              className="px-2.5 py-1.5 rounded-xl border border-[#EAD5E1] bg-[#FAF3F6] text-xs font-semibold text-[#8E3A7A] hover:bg-white transition-colors cursor-pointer"
              dir="ltr"
            >
              {playbackRate}x
            </button>

            {/* Volume Control Slider */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                title={isMuted ? "إلغاء كتم الصوت" : "مستوى الصوت"}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isMuted || volume === 0
                    ? "border-[#EAD5E1] bg-[#FAF3F6] text-[#82607A]"
                    : "border-[#EAD5E1] text-[#8E3A7A] hover:bg-[#FAF3F6]"
                }`}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-12 -left-12 sm:left-0 w-36 p-3 rounded-2xl border border-[#EAD5E1] bg-white shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="text-xs font-semibold text-[#8E3A7A] hover:underline"
                    >
                      {isMuted ? "إلغاء الكتم" : "كتم"}
                    </button>
                    <span className="text-[11px] font-mono text-[#6E4E65]">
                      {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    aria-label="مستوى الصوت"
                    className="w-full h-1.5 bg-[#EAD5E1] accent-[#8E3A7A] rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Sleep Timer */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSleepMenu((v) => !v)}
                title="مؤقت النوم"
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  sleepMinutesLeft !== null
                    ? "border-[#8E3A7A] bg-[#FAF3F6] text-[#8E3A7A]"
                    : "border-[#EAD5E1] text-[#6E4E65] hover:bg-[#FAF3F6]"
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
              {showSleepMenu && (
                <div className="absolute bottom-12 left-0 w-36 rounded-2xl border border-[#EAD5E1] bg-white shadow-lg py-1 z-50">
                  {SLEEP_OPTIONS.map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => {
                        setSleepTimer(opt.value);
                        setShowSleepMenu(false);
                      }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-[#FAF3F6] text-[#2B1626] cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download MP3 */}
            <a
              href={currentLesson.audioUrl}
              download
              target="_blank"
              rel="noreferrer"
              title="تحميل الملف الصوتي MP3"
              className="p-2 rounded-xl border border-[#EAD5E1] text-[#8E3A7A] hover:bg-[#FAF3F6] transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={closePlayer}
              title="إغلاق المشغل"
              className="p-2 rounded-xl text-[#6E4E65] hover:bg-[#FAF3F6] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
