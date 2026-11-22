"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Headphones,
  Layers,
  Play,
  Quote,
  Search,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { DatabasePayload, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { LessonRow } from "./LessonRow";
import { formatTotalDurationArabic } from "@/lib/format";

const HERO_QUOTE_TEXT =
  "«ما طابت الحياةُ إلا بالعيشِ في رحابِ القرآن، ولا استقامت الخطى إلا بالسعيِ لأجلهِ في كلِّ ميدان؛ ففي قُربهِ سكينةٌ تُرمِّمُ شتاتَ الروح، وفي صُحبتهِ أنسٌ يَشفي الجروح.. هنا نُصاحبُ الآيةَ تأمُّلاً وعملاً، ليبقى أثرُها في القلبِ حيّاً لا يزول.»";

const HERO_QUOTE_WORDS = HERO_QUOTE_TEXT.split(" ");

const ACCENT_STYLES: Record<Series["coverAccent"], { bar: string; badge: string; iconBg: string }> = {
  emerald: {
    bar: "from-[#8E3A7A] to-[#B8559B]",
    badge: "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]",
    iconBg: "bg-[#8E3A7A]/10 text-[#8E3A7A]",
  },
  gold: {
    bar: "from-[#B8559B] to-[#D68FBF]",
    badge: "bg-[#EBC6DD]/45 text-[#8E3A7A]",
    iconBg: "bg-[#B8559B]/15 text-[#8E3A7A]",
  },
  teal: {
    bar: "from-[#D68FBF] to-[#EBC6DD]",
    badge: "bg-[#FAF3F6] text-[#B8559B] border border-[#EBC6DD]",
    iconBg: "bg-[#D68FBF]/20 text-[#8E3A7A]",
  },
  slate: {
    bar: "from-[#6F2B5F] to-[#8E3A7A]",
    badge: "bg-[#EBC6DD]/35 text-[#6F2B5F]",
    iconBg: "bg-[#6F2B5F]/10 text-[#6F2B5F]",
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
      {/* Hero Section with Integrated Kinetic Quote */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-[#6F2B5F] via-[#8E3A7A] to-[#B8559B] text-white">
        <div className="absolute inset-0 islamic-pattern pointer-events-none" />
        <div className="animate-orb-float absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#EBC6DD]/15 blur-3xl pointer-events-none" />
        <div className="animate-orb-float absolute -bottom-28 -right-24 w-96 h-96 rounded-full bg-[#D68FBF]/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          {/* Top Main Quote Stage in the Hero */}
          <div className="mb-12">
            <div className="quote-aurora-border p-[1.5px] rounded-[2rem] shadow-[0_20px_60px_rgba(45,22,38,0.28)]">
              <div className="relative rounded-[calc(2rem-1.5px)] bg-gradient-to-br from-[#6F2B5F]/90 via-[#8E3A7A]/88 to-[#9D4487]/90 backdrop-blur-xl px-6 py-8 sm:px-12 sm:py-10 overflow-hidden">
                {/* Subtle inner ambient light */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[28rem] h-36 bg-[#FAF3F6]/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col items-center text-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF3F6]/12 border border-[#EBC6DD]/30 text-[#FAF3F6] text-xs mb-6">
                    <Quote className="w-3.5 h-3.5 text-[#EBC6DD]" />
                    <span>في رحاب القرآن</span>
                  </div>

                  {/* Uniform style, font, and color for the entire quote with word-by-word kinetic reveal */}
                  <blockquote className="font-serif-arabic text-2xl sm:text-3xl md:text-[2.15rem] font-normal leading-[1.95] sm:leading-[2.1] text-[#FAF3F6] max-w-4xl mx-auto">
                    {HERO_QUOTE_WORDS.map((word, idx) => (
                      <React.Fragment key={idx}>
                        <span
                          className="kinetic-word"
                          style={{ animationDelay: `${idx * 55}ms` }}
                        >
                          {word}
                        </span>{" "}
                      </React.Fragment>
                    ))}
                  </blockquote>

                  {/* Author signature */}
                  <div
                    className="kinetic-word mt-7 pt-5 border-t border-[#EBC6DD]/25 flex items-center justify-center"
                    style={{ animationDelay: `${HERO_QUOTE_WORDS.length * 55 + 150}ms` }}
                  >
                    <div className="inline-flex items-center gap-3">
                      <span className="h-[1px] w-8 bg-[#EBC6DD]/60" />
                      <span className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#FAF3F6]">
                        أ. فاطمة حجازي
                      </span>
                      <span className="h-[1px] w-8 bg-[#EBC6DD]/60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Bottom Row: Bio, CTA, Search & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-2">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/12 border border-[#EBC6DD]/30 text-xs sm:text-sm text-[#FAF3F6] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#EBC6DD]" />
                <span>{data.settings.sheikhTitle || "الدروس العلمية والمحاضرات الصوتية"}</span>
              </div>

              <h1 className="font-serif-arabic text-3xl sm:text-4xl font-bold leading-tight text-white">
                {data.settings.sheikhName}
              </h1>

              <p className="mt-3 text-sm sm:text-base text-[#FAF3F6]/90 leading-relaxed max-w-2xl">
                {data.settings.bio}
              </p>

              {/* Primary CTA + Search */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {latestLesson && (
                  <button
                    type="button"
                    onClick={() => playLesson(latestLesson, data.lessons)}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#B8559B] hover:bg-[#D68FBF] hover:text-[#2D1626] border border-[#EBC6DD]/40 text-white font-semibold shadow-lg transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>استمع لأحدث درس</span>
                  </button>
                )}

                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#EBC6DD] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن درس، سلسلة، أو موضوع..."
                    className="w-full pr-11 pl-4 py-3.5 rounded-xl bg-white/12 border border-[#EBC6DD]/35 text-white placeholder:text-[#EBC6DD] focus:outline-none focus:bg-white/18 focus:border-[#FAF3F6] transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="lg:col-span-5 grid grid-cols-3 gap-4 p-5 rounded-2xl bg-white/10 border border-[#EBC6DD]/25 backdrop-blur-sm">
              <div className="text-center">
                <div className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#FAF3F6]">
                  {data.series.length}
                </div>
                <div className="text-xs text-[#EBC6DD] mt-0.5">سلسلة علمية</div>
              </div>
              <div className="text-center border-x border-[#EBC6DD]/20">
                <div className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#FAF3F6]">
                  {data.lessons.length}
                </div>
                <div className="text-xs text-[#EBC6DD] mt-0.5">درس صوتي</div>
              </div>
              <div className="text-center">
                <div className="font-serif-arabic text-lg sm:text-2xl font-bold text-[#FAF3F6]">
                  {formatTotalDurationArabic(totalDurationSeconds)}
                </div>
                <div className="text-xs text-[#EBC6DD] mt-0.5">محتوى صوتي</div>
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
                  ? "bg-[#8E3A7A] text-white shadow-sm"
                  : "bg-white border border-[#EBC6DD] text-[#6E4E65] hover:border-[#8E3A7A] hover:text-[#8E3A7A]"
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
            <div className="w-9 h-9 rounded-xl bg-[#EBC6DD]/45 text-[#8E3A7A] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2D1626]">
                السلاسل العلمية
              </h2>
              <p className="text-xs sm:text-sm text-[#6E4E65]">
                شروحات منهجية مرتبة للاستماع المتتابع
              </p>
            </div>
          </div>
        </div>

        {filteredSeries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D68FBF] bg-white/70 p-10 text-center text-sm text-[#6E4E65]">
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
                  className="group rounded-2xl border border-[#EBC6DD] bg-white overflow-hidden hover:border-[#8E3A7A] hover:shadow-md transition-all flex flex-col"
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
                            ? "bg-[#EBC6DD]/50 text-[#8E3A7A]"
                            : "bg-[#FAF3F6] text-[#B8559B] border border-[#EBC6DD]"
                        }`}
                      >
                        {series.status === "completed" ? "مكتملة" : "مستمرة"}
                      </span>
                    </div>

                    <h3 className="font-serif-arabic text-xl font-bold text-[#2D1626] group-hover:text-[#8E3A7A] transition-colors leading-snug">
                      {series.title}
                    </h3>

                    <p className="mt-2 text-sm text-[#6E4E65] line-clamp-3 leading-relaxed flex-1">
                      {series.description || "سلسلة دروس صوتية مرتبة."}
                    </p>

                    <div className="mt-5 pt-3.5 border-t border-[#FAF3F6] flex items-center justify-between text-xs text-[#6E4E65]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-medium text-[#2D1626]">
                          <BookOpen className="w-3.5 h-3.5 text-[#8E3A7A]" />
                          {st.count} {st.count === 1 ? "درس" : "دروس"}
                        </span>
                        {st.totalSeconds > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#B8559B]" />
                            {formatTotalDurationArabic(st.totalSeconds)}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[#8E3A7A] font-semibold group-hover:-translate-x-1 transition-transform">
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
            <div className="w-9 h-9 rounded-xl bg-[#EBC6DD]/45 text-[#B8559B] flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2D1626]">
                الدروس والمحاضرات الصوتية
              </h2>
              <p className="text-xs sm:text-sm text-[#6E4E65]">
                استمع مباشرة أو حمّل الدروس بصيغة MP3 مجاناً
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl border border-[#EBC6DD] bg-white p-1 self-start">
            <button
              type="button"
              onClick={() => setLessonTab("all")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                lessonTab === "all"
                  ? "bg-[#8E3A7A] text-white"
                  : "text-[#6E4E65] hover:text-[#8E3A7A]"
              }`}
            >
              جميع الدروس ({data.lessons.length})
            </button>
            <button
              type="button"
              onClick={() => setLessonTab("single")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                lessonTab === "single"
                  ? "bg-[#8E3A7A] text-white"
                  : "text-[#6E4E65] hover:text-[#8E3A7A]"
              }`}
            >
              دروس مفردة ومحاضرات ({data.lessons.filter((l) => !l.seriesId).length})
            </button>
          </div>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D68FBF] bg-white/70 p-12 text-center text-sm text-[#6E4E65]">
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
