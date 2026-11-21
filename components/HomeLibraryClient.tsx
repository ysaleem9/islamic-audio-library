"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Headphones,
  Layers,
  Play,
  Search,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { DatabasePayload, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { LessonRow } from "./LessonRow";
import { formatTotalDurationArabic } from "@/lib/format";

const ACCENT_STYLES: Record<Series["coverAccent"], { bar: string; badge: string; iconBg: string }> = {
  emerald: {
    bar: "from-[#14533c] to-[#1f6f52]",
    badge: "bg-[#eef5f1] text-[#14533c]",
    iconBg: "bg-[#14533c]/10 text-[#14533c]",
  },
  gold: {
    bar: "from-[#9a6f2d] to-[#c4974c]",
    badge: "bg-[#f9f3e7] text-[#8d6428]",
    iconBg: "bg-[#b88a44]/15 text-[#8d6428]",
  },
  teal: {
    bar: "from-[#155e63] to-[#227c82]",
    badge: "bg-[#ebf6f7] text-[#155e63]",
    iconBg: "bg-[#155e63]/10 text-[#155e63]",
  },
  slate: {
    bar: "from-[#2c3e50] to-[#465c71]",
    badge: "bg-slate-100 text-slate-700",
    iconBg: "bg-slate-200/70 text-slate-700",
  },
};

export function HomeLibraryClient({ data }: { data: DatabasePayload }) {
  const { playLesson } = useAudioPlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [lessonTab, setLessonTab] = useState<"all" | "single">("all");

  const seriesMap = useMemo(() => {
    const m = new Map<string, Series>();
    data.series.forEach((s) => m.set(s.id, s));
    return m;
  }, [data.series]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    data.series.forEach((s) => set.add(s.category));
    data.lessons.forEach((l) => set.add(l.category));
    return ["الكل", ...Array.from(set)];
  }, [data.lessons, data.series]);

  const seriesStats = useMemo(() => {
    const stats = new Map<string, { count: number; totalSeconds: number }>();
    for (const lesson of data.lessons) {
      if (!lesson.seriesId) continue;
      const cur = stats.get(lesson.seriesId) || { count: 0, totalSeconds: 0 };
      cur.count += 1;
      cur.totalSeconds += lesson.durationSeconds || 0;
      stats.set(lesson.seriesId, cur);
    }
    return stats;
  }, [data.lessons]);

  const totalDurationSeconds = useMemo(
    () => data.lessons.reduce((acc, l) => acc + (l.durationSeconds || 0), 0),
    [data.lessons]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSeries = useMemo(() => {
    return data.series.filter((s) => {
      const catOk = selectedCategory === "الكل" || s.category === selectedCategory;
      const qOk =
        !normalizedQuery ||
        s.title.toLowerCase().includes(normalizedQuery) ||
        s.description.toLowerCase().includes(normalizedQuery) ||
        s.category.toLowerCase().includes(normalizedQuery);
      return catOk && qOk;
    });
  }, [data.series, normalizedQuery, selectedCategory]);

  const filteredLessons = useMemo(() => {
    return data.lessons.filter((l) => {
      if (lessonTab === "single" && l.seriesId !== null) return false;
      const catOk = selectedCategory === "الكل" || l.category === selectedCategory;
      const qOk =
        !normalizedQuery ||
        l.title.toLowerCase().includes(normalizedQuery) ||
        l.description.toLowerCase().includes(normalizedQuery) ||
        l.notes.toLowerCase().includes(normalizedQuery) ||
        l.category.toLowerCase().includes(normalizedQuery);
      return catOk && qOk;
    });
  }, [data.lessons, lessonTab, normalizedQuery, selectedCategory]);

  const latestLesson = data.lessons[0] || null;

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-[#0e3d2b] via-[#14533c] to-[#1a6348] text-white">
        <div className="absolute inset-0 islamic-pattern pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm text-[#f3dfb8] mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{data.settings.sheikhTitle || "الدروس العلمية والمحاضرات الصوتية"}</span>
            </div>

            <h1 className="font-serif-arabic text-3xl sm:text-5xl font-bold leading-tight text-white">
              {data.settings.sheikhName}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#e4efe9] leading-relaxed max-w-2xl">
              {data.settings.bio}
            </p>

            {/* Primary CTA + Search */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {latestLesson && (
                <button
                  type="button"
                  onClick={() => playLesson(latestLesson, data.lessons)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#b88a44] hover:bg-[#a67a38] text-white font-semibold shadow-lg transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>استمع لأحدث درس</span>
                </button>
              )}

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#a7c2b7] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن درس، سلسلة، أو موضوع..."
                  className="w-full pr-11 pl-4 py-3.5 rounded-xl bg-white/12 border border-white/20 text-white placeholder:text-[#c7dcd3] focus:outline-none focus:bg-white/18 focus:border-[#f3dfb8] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg pt-6 border-t border-white/15">
              <div>
                <div className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#f3dfb8]">
                  {data.series.length}
                </div>
                <div className="text-xs sm:text-sm text-[#d1e4dc] mt-0.5">سلسلة علمية</div>
              </div>
              <div>
                <div className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#f3dfb8]">
                  {data.lessons.length}
                </div>
                <div className="text-xs sm:text-sm text-[#d1e4dc] mt-0.5">درس صوتي</div>
              </div>
              <div>
                <div className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#f3dfb8]">
                  {formatTotalDurationArabic(totalDurationSeconds)}
                </div>
                <div className="text-xs sm:text-sm text-[#d1e4dc] mt-0.5">محتوى صوتي</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Bar */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#14533c] text-white shadow-sm"
                  : "bg-white border border-[#e6dfd1] text-[#5a6660] hover:border-[#14533c] hover:text-[#14533c]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Series Section */}
      <section id="series" className="max-w-6xl mx-auto px-4 mt-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eef5f1] text-[#14533c] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#1a2420]">
                السلاسل العلمية
              </h2>
              <p className="text-xs sm:text-sm text-[#5a6660]">
                شروحات منهجية مرتبة للاستماع المتتابع
              </p>
            </div>
          </div>
        </div>

        {filteredSeries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cfc0] bg-white/70 p-10 text-center text-sm text-[#5a6660]">
            لا توجد سلاسل مطابقة لخيار البحث أو التصنيف الحالي.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSeries.map((series) => {
              const st = seriesStats.get(series.id) || { count: 0, totalSeconds: 0 };
              const style = ACCENT_STYLES[series.coverAccent] || ACCENT_STYLES.emerald;
              return (
                <Link
                  key={series.id}
                  href={`/series/${series.slug}`}
                  className="group rounded-2xl border border-[#e6dfd1] bg-white overflow-hidden hover:border-[#14533c] hover:shadow-md transition-all flex flex-col"
                >
                  <div className={`h-2.5 bg-gradient-to-l ${style.bar}`} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                        {series.category}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          series.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {series.status === "completed" ? "مكتملة" : "مستمرة"}
                      </span>
                    </div>

                    <h3 className="font-serif-arabic text-xl font-bold text-[#1a2420] group-hover:text-[#14533c] transition-colors leading-snug">
                      {series.title}
                    </h3>

                    <p className="mt-2 text-sm text-[#5a6660] line-clamp-3 leading-relaxed flex-1">
                      {series.description || "سلسلة دروس صوتية مرتبة."}
                    </p>

                    <div className="mt-5 pt-3.5 border-t border-[#f0eadf] flex items-center justify-between text-xs text-[#5a6660]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-medium text-[#1a2420]">
                          <BookOpen className="w-3.5 h-3.5 text-[#14533c]" />
                          {st.count} {st.count === 1 ? "درس" : "دروس"}
                        </span>
                        {st.totalSeconds > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#b88a44]" />
                            {formatTotalDurationArabic(st.totalSeconds)}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[#14533c] font-semibold group-hover:-translate-x-1 transition-transform">
                        <span>تصفح</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Lessons Section */}
      <section id="lessons" className="max-w-6xl mx-auto px-4 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f9f3e7] text-[#9a6f2d] flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#1a2420]">
                الدروس والمحاضرات الصوتية
              </h2>
              <p className="text-xs sm:text-sm text-[#5a6660]">
                استمع مباشرة أو حمّل الدروس بصيغة MP3 مجاناً
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl border border-[#e6dfd1] bg-white p-1 self-start">
            <button
              type="button"
              onClick={() => setLessonTab("all")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                lessonTab === "all"
                  ? "bg-[#14533c] text-white"
                  : "text-[#5a6660] hover:text-[#14533c]"
              }`}
            >
              جميع الدروس ({data.lessons.length})
            </button>
            <button
              type="button"
              onClick={() => setLessonTab("single")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                lessonTab === "single"
                  ? "bg-[#14533c] text-white"
                  : "text-[#5a6660] hover:text-[#14533c]"
              }`}
            >
              دروس مفردة ومحاضرات ({data.lessons.filter((l) => !l.seriesId).length})
            </button>
          </div>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cfc0] bg-white/70 p-12 text-center text-sm text-[#5a6660]">
            لا توجد دروس مطابقة للبحث الحالي.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredLessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                series={lesson.seriesId ? seriesMap.get(lesson.seriesId) : null}
                queue={filteredLessons}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
