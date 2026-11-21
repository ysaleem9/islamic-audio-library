"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Lesson } from "@/lib/types";

interface ProgressEntry {
  time: number;
  duration: number;
  completed?: boolean;
}

interface AudioPlayerContextValue {
  currentLesson: Lesson | null;
  queue: Lesson[];
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  sleepMinutesLeft: number | null;
  progressMap: Record<string, ProgressEntry>;
  playLesson: (lesson: Lesson, nextQueue?: Lesson[]) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skipBy: (deltaSeconds: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaybackRate: (rate: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  closePlayer: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const PROGRESS_STORAGE_KEY = "islamic_audio_progress_v1";

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countedPlayRef = useRef<Set<string>>(new Set());

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [queue, setQueue] = useState<Lesson[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const [sleepMinutesLeft, setSleepMinutesLeft] = useState<number | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressEntry>>({});

  // Load saved listening progress from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        setProgressMap(JSON.parse(raw) as Record<string, ProgressEntry>);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persistProgress = useCallback((lessonId: string, time: number, dur: number) => {
    setProgressMap((prev) => {
      const completed = dur > 0 && time / dur >= 0.92 ? true : prev[lessonId]?.completed;
      const next = {
        ...prev,
        [lessonId]: { time, duration: dur, completed },
      };
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const currentIndex = currentLesson
    ? queue.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  const playLesson = useCallback(
    (lesson: Lesson, nextQueue?: Lesson[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (nextQueue && nextQueue.length > 0) {
        setQueue(nextQueue);
      } else {
        setQueue((prev) => (prev.some((l) => l.id === lesson.id) ? prev : [lesson]));
      }

      if (currentLesson?.id === lesson.id) {
        if (audio.paused) {
          audio.play().catch(() => setError("تعذر تشغيل الملف الصوتي"));
        } else {
          audio.pause();
        }
        return;
      }

      setError(null);
      setIsLoading(true);
      setCurrentLesson(lesson);
      setCurrentTime(0);
      setDuration(lesson.durationSeconds || 0);

      audio.src = lesson.audioUrl;
      audio.playbackRate = playbackRate;
      audio.load();

      // Resume from saved position if previously paused mid-way
      const saved = progressMap[lesson.id];
      const resumeAt =
        saved && !saved.completed && saved.time > 5 && saved.time < (saved.duration || 999999) - 10
          ? saved.time
          : 0;

      const onCanPlay = () => {
        if (resumeAt > 0 && Number.isFinite(audio.duration) && resumeAt < audio.duration - 5) {
          audio.currentTime = resumeAt;
        }
        audio.play().catch(() => {
          setIsLoading(false);
          setError("تعذر تشغيل الملف الصوتي. تأكد من صلاحية الرابط.");
        });
        audio.removeEventListener("canplay", onCanPlay);
      };

      audio.addEventListener("canplay", onCanPlay);

      // Increment play count once per session
      if (!countedPlayRef.current.has(lesson.id)) {
        countedPlayRef.current.add(lesson.id);
        fetch(`/api/lessons/${encodeURIComponent(lesson.id)}/play`, { method: "POST" }).catch(() => {});
      }
    },
    [currentLesson?.id, playbackRate, progressMap]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentLesson) return;
    if (audio.paused) {
      audio.play().catch(() => setError("تعذر استئناف التشغيل"));
    } else {
      audio.pause();
    }
  }, [currentLesson]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || seconds));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const skipBy = useCallback((deltaSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(audio.currentTime + deltaSeconds, audio.duration || 0));
    audio.currentTime = target;
    setCurrentTime(target);
  }, []);

  const playNext = useCallback(() => {
    if (!hasNext) return;
    const nextLesson = queue[currentIndex + 1];
    if (nextLesson) playLesson(nextLesson, queue);
  }, [currentIndex, hasNext, playLesson, queue]);

  const playPrevious = useCallback(() => {
    if (!hasPrevious) return;
    const prevLesson = queue[currentIndex - 1];
    if (prevLesson) playLesson(prevLesson, queue);
  }, [currentIndex, hasPrevious, playLesson, queue]);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (!minutes) {
      setSleepEndsAt(null);
      setSleepMinutesLeft(null);
      return;
    }
    setSleepEndsAt(Date.now() + minutes * 60 * 1000);
    setSleepMinutesLeft(minutes);
  }, []);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrentLesson(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    setSleepEndsAt(null);
    setSleepMinutesLeft(null);
  }, []);

  // Sleep timer ticker
  useEffect(() => {
    if (!sleepEndsAt) return;
    const timer = setInterval(() => {
      const remainingMs = sleepEndsAt - Date.now();
      if (remainingMs <= 0) {
        audioRef.current?.pause();
        setSleepEndsAt(null);
        setSleepMinutesLeft(null);
      } else {
        setSleepMinutesLeft(Math.ceil(remainingMs / 60000));
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [sleepEndsAt]);

  // Wire HTMLAudioElement events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastSavedSecond = 0;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      if (currentLesson && Math.abs(t - lastSavedSecond) >= 5) {
        lastSavedSecond = t;
        persistProgress(currentLesson.id, t, audio.duration || currentLesson.durationSeconds || 0);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentLesson) {
        persistProgress(
          currentLesson.id,
          audio.duration || currentLesson.durationSeconds || 0,
          audio.duration || currentLesson.durationSeconds || 0
        );
      }
      if (hasNext) {
        playNext();
      }
    };
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError("تعذر تحميل الملف الصوتي. يرجى التحقق من رابط الملف.");
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentLesson, hasNext, persistProgress, playNext]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentLesson,
        queue,
        isPlaying,
        isLoading,
        error,
        currentTime,
        duration,
        playbackRate,
        sleepMinutesLeft,
        progressMap,
        playLesson,
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
      }}
    >
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return ctx;
}
