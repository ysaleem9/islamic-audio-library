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
  Grid,
  CheckCircle2,
  Bookmark,
  Heart,
  Feather,
  Compass,
  X,
} from "lucide-react";
import type { DatabasePayload, Series } from "@/lib/types";
import { useAudioPlayer } from "./AudioPlayerContext";
import { LessonRow } from "./LessonRow";
import { formatTotalDurationArabic } from "@/lib/format";
import { arabicIncludes } from "@/lib/arabic";
import { LogoAnzalahu } from "./LogoAnzalahu";

const ACCENT_STYLES: Record<string, { bar: string; badge: string; iconBg: string }> = {
  purple: {
    bar: "from-[#8E3A7A] to-[#B8559B]",
    badge: "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]",
    iconBg: "bg-[#8E3A7A]/10 text-[#8E3A7A]",
  },
  rose: {
    bar: "from-[#B8559B] to-[#D68FBF]",
    badge: "bg-[#FAF3F6] text-[#B8559B] border border-[#EBC6DD]",
    iconBg: "bg-[#B8559B]/10 text-[#B8559B]",
  },
  plum: {
    bar: "from-[#632454] to-[#8E3A7A]",
    badge: "bg-[#FAF3F6] text-[#632454] border border-[#EBC6DD]",
    iconBg: "bg-[#632454]/10 text-[#632454]",
  },
  blush: {
    bar: "from-[#D68FBF] to-[#EBC6DD]",
    badge: "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]",
    iconBg: "bg-[#D68FBF]/20 text-[#8E3A7A]",
  },
  sage: {
    bar: "from-[#3D6B52] to-[#558B6E]",
    badge: "bg-[#EBF4EE] text-[#3D6B52] border border-[#3D6B52]/20",
    iconBg: "bg-[#3D6B52]/10 text-[#3D6B52]",
  },
  emerald: {
    bar: "from-[#3D6B52] to-[#8E3A7A]",
    badge: "bg-[#EBF4EE] text-[#3D6B52] border border-[#3D6B52]/20",
    iconBg: "bg-[#3D6B52]/10 text-[#3D6B52]",
  },
  gold: {
    bar: "from-[#B8559B] to-[#D68FBF]",
    badge: "bg-[#FAF3F6] text-[#B8559B] border border-[#EBC6DD]",
    iconBg: "bg-[#B8559B]/10 text-[#B8559B]",
  },
  teal: {
    bar: "from-[#3D6B52] to-[#8E3A7A]",
    badge: "bg-[#EBF4EE] text-[#3D6B52] border border-[#3D6B52]/20",
    iconBg: "bg-[#3D6B52]/10 text-[#3D6B52]",
  },
  slate: {
    bar: "from-[#8E3A7A] to-[#B8559B]",
    badge: "bg-[#FAF3F6] text-[#8E3A7A] border border-[#EBC6DD]",
    iconBg: "bg-[#8E3A7A]/10 text-[#8E3A7A]",
  },
};

// Metadata for categories with icons and descriptions
const CATEGORY_META: Record<
  string,
  { icon: React.ElementType; description: string; badgeColor?: string }
> = {
  "تفسير القرآن الكريم": {
    icon: BookOpen,
    description: "تأملات وتدبرات في آيات الذكر الحكيم وقصصه العظيمة",
    badgeColor: "text-[#3D6B52] bg-[#EBF4EE]",
  },
  تفسير: {
    icon: BookOpen,
    description: "تأملات وتدبرات في آيات الذكر الحكيم وقصصه العظيمة",
    badgeColor: "text-[#3D6B52] bg-[#EBF4EE]",
  },
  العقيدة: {
    icon: Compass,
    description: "شروحات الأصول والثوابت الإيمانية ومعرفة الله ورسوله",
  },
  عقيدة: {
    icon: Compass,
    description: "شروحات الأصول والثوابت الإيمانية ومعرفة الله ورسوله",
  },
  الفقه: {
    icon: Feather,
    description: "فقه العبادات والأحكام الميسرة وتطبيقها في الحياة اليومية",
  },
  فقه: {
    icon: Feather,
    description: "فقه العبادات والأحكام الميسرة وتطبيقها في الحياة اليومية",
  },
  "الرقائق والتزكية": {
    icon: Heart,
    description: "أعمال القلوب، الخشوع، والتخلص من ملهيات الدنيا",
  },
  "التربية الإيمانية": {
    icon: Bookmark,
    description: "إصلاح البيوت، تنشئة الأبناء، وتزكية النفس في ظل الشرع",
  },
  "الدروس والمحاضرات": {
    icon: Headphones,
    description: "محاضرات عامة وفوائد متفرقة ترتقي بالروح والفكر",
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

  // Dynamic set of unique categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    data.series.forEach((s) => set.add(s.category));
    data.lessons.forEach((l) => set.add(l.category));
    return Array.from(set);
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

  // Normalized search across lessons & series
  const filteredSeries = useMemo(() => {
    return data.series.filter((s) => {
      const catOk = selectedCategory === "الكل" || s.category === selectedCategory;
      if (!catOk) return false;
      if (!searchQuery.trim()) return true;

      return (
        arabicIncludes(s.title, searchQuery) ||
        arabicIncludes(s.description, searchQuery) ||
        arabicIncludes(s.category, searchQuery)
      );
    });
  }, [data.series, searchQuery, selectedCategory]);

  const filteredLessons = useMemo(() => {
    return data.lessons.filter((l) => {
      if (lessonTab === "single" && l.seriesId !== null) return false;
      const catOk = selectedCategory === "الكل" || l.category === selectedCategory;
      if (!catOk) return false;
      if (!searchQuery.trim()) return true;

      const series = l.seriesId ? seriesMap.get(l.seriesId) : null;
      return (
        arabicIncludes(l.title, searchQuery) ||
        arabicIncludes(l.description, searchQuery) ||
        arabicIncludes(l.notes, searchQuery) ||
        arabicIncludes(l.category, searchQuery) ||
        (series && arabicIncludes(series.title, searchQuery))
      );
    });
  }, [data.lessons, lessonTab, searchQuery, selectedCategory, seriesMap]);

  const latestLesson = data.lessons[0] || null;

  return (
    <main className="flex-1 pb-16">
      {/* 2. Hero Section – القسم الرئيسي */}
      <section
        id="hero"
        className="relative overflow-hidden bg-gradient-to-b from-[#FAF3F6] via-white to-[#FAF3F6] border-b border-[#EAD5E1]"
      >
        {/* Soft floral/ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EBC6DD]/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3D6B52]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute inset-0 organic-lines-pattern pointer-events-none opacity-40" />

        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Right text column */}
            <div className="flex-1 max-w-2xl text-center lg:text-right">
              {/* Badge: Slogan "أنزله بعلمه" */}
              <div className="inline-block mb-4">
                <LogoAnzalahu variant="hero" />
              </div>

              {/* Main Headline */}
              <h1 className="font-serif-arabic text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight text-[#2B1626] tracking-tight">
                في رِحابِ القُرآن
              </h1>

              {/* Lecturer name */}
              <div className="mt-3 flex items-center justify-center lg:justify-start gap-3">
                <span className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#8E3A7A]">
                  أ. فاطمة حجازي
                </span>
                <span className="h-4 w-[1px] bg-[#D68FBF]" />
                <span className="text-xs sm:text-sm text-[#5C3D55] font-medium">
                  {data.settings.sheikhTitle || "دروس علمية وشروحات منهجية"}
                </span>
              </div>

              {/* Spiritual welcoming text */}
              <p className="mt-5 text-base sm:text-lg text-[#5C3D55] leading-relaxed">
                مرحباً بكم في المنصة العلمية والدعوية المباركة. شروحات منهجية وتأملات إيمانية
                مستوحاة من كتاب الله وسنة رسوله ﷺ، تُعين المسلم والمسلمة على طلب العلم ونقاء السريرة
                والثبات في زمن الفتن.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                {latestLesson && (
                  <button
                    type="button"
                    onClick={() => playLesson(latestLesson, data.lessons)}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E3A7A] to-[#B8559B] hover:opacity-95 text-white font-semibold shadow-[0_4px_20px_rgba(184,85,155,0.35)] transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Play className="w-4 h-4 fill-current mr-[-2px]" />
                    <span>استمع لأحدث درس</span>
                  </button>
                )}

                <a
                  href="#series"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-[#EAD5E1] hover:border-[#8E3A7A] text-[#8E3A7A] hover:bg-[#FAF3F6] font-semibold transition-all shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-[#3D6B52]" />
                  <span>استعراض السلاسل العلمية</span>
                </a>

                <a
                  href="#lessons"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-[#5C3D55] hover:text-[#8E3A7A] hover:bg-[#EBC6DD]/30 text-sm font-medium transition-colors"
                >
                  <Headphones className="w-4 h-4 text-[#B8559B]" />
                  <span>جميع المحاضرات</span>
                </a>
              </div>
            </div>

            {/* Left Column: Visual Quranic Emblem */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8E3A7A]/20 via-[#EBC6DD] to-[#3D6B52]/20 blur-2xl -z-10" />

                {/* Emblem Frame */}
                <div className="w-64 sm:w-76 p-6 sm:p-7 rounded-3xl bg-white/90 backdrop-blur-md border border-[#EAD5E1] shadow-[0_12px_40px_rgba(142,58,122,0.08)] flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FAF3F6] to-[#EBF4EE] border border-[#3D6B52]/30 flex items-center justify-center mb-4">
                    <span className="font-serif-arabic text-2xl font-bold text-[#3D6B52]">
                      ۝
                    </span>
                  </div>

                  <div className="font-serif-arabic text-lg font-bold text-[#8E3A7A] leading-relaxed">
                    «لَّـٰكِنِ ٱللَّهُ يَشْهَدُ بِمَآ أَنزَلَ إِلَيْكَ ۖ أَنزَلَهُۥ بِعِلْمِهِۦ»
                  </div>

                  <div className="mt-1.5 text-xs text-[#3D6B52] font-semibold">
                    [سورة النساء: 166]
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#FAF3F6] w-full text-xs text-[#5C3D55] leading-relaxed">
                    محتوى علمي ودعوي مبارك — متاح للنفع العام والاستماع المباشر والتحميل لوجه الله تعالى.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Statistics – الإحصائيات المرتبطة بالبيانات الفعلية */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: السلاسل */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAD5E1] shadow-[0_4px_20px_rgba(142,58,122,0.04)] flex items-center gap-3.5 hover:border-[#8E3A7A]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[#8E3A7A]" />
            </div>
            <div>
              <div className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#8E3A7A] leading-none">
                {data.series.length}
              </div>
              <div className="text-xs text-[#6E4E65] font-medium mt-1">
                سلسلة علمية
              </div>
            </div>
          </div>

          {/* Card 2: الدروس */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAD5E1] shadow-[0_4px_20px_rgba(142,58,122,0.04)] flex items-center gap-3.5 hover:border-[#8E3A7A]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#B8559B] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#B8559B]" />
            </div>
            <div>
              <div className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#8E3A7A] leading-none">
                {data.lessons.length}
              </div>
              <div className="text-xs text-[#6E4E65] font-medium mt-1">
                درس ومحاضرة
              </div>
            </div>
          </div>

          {/* Card 3: إجمالي المدة */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAD5E1] shadow-[0_4px_20px_rgba(142,58,122,0.04)] flex items-center gap-3.5 hover:border-[#8E3A7A]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#EBF4EE] border border-[#3D6B52]/20 text-[#3D6B52] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#3D6B52]" />
            </div>
            <div>
              <div className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#8E3A7A] leading-none">
                {formatTotalDurationArabic(totalDurationSeconds)}
              </div>
              <div className="text-xs text-[#6E4E65] font-medium mt-1">
                محتوى صوتي مسجل
              </div>
            </div>
          </div>

          {/* Card 4: التصنيفات */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAD5E1] shadow-[0_4px_20px_rgba(142,58,122,0.04)] flex items-center gap-3.5 hover:border-[#8E3A7A]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center shrink-0">
              <Grid className="w-5 h-5 text-[#8E3A7A]" />
            </div>
            <div>
              <div className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#8E3A7A] leading-none">
                {availableCategories.length}
              </div>
              <div className="text-xs text-[#6E4E65] font-medium mt-1">
                تصنيفات علمية
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Search Section – صندوق البحث المطوّر باللغة العربية */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="relative">
          <div className="relative flex items-center rounded-2xl bg-white border border-[#EAD5E1] shadow-[0_4px_24px_rgba(142,58,122,0.06)] focus-within:border-[#8E3A7A] focus-within:ring-2 focus-within:ring-[#8E3A7A]/20 transition-all">
            <div className="pr-4 text-[#8E3A7A]">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن درس، سورة، سلسلة، أو موضوع باللغة العربية..."
              className="w-full py-4 pr-3 pl-12 bg-transparent text-sm sm:text-base text-[#2B1626] placeholder:text-[#82607A] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-4 p-1 rounded-full hover:bg-[#FAF3F6] text-[#8E3A7A] cursor-pointer"
                aria-label="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="mt-2 text-xs text-[#6E4E65] flex items-center justify-between px-2">
              <span>
                نتائج البحث عن: «{searchQuery}» (تم العثور على {filteredLessons.length} درس و {filteredSeries.length} سلسلة)
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#8E3A7A] hover:underline"
              >
                إلغاء الفلتر
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. Categories – التصنيفات العلمية على شكل بطاقات مرئية */}
      <section id="categories" className="max-w-6xl mx-auto px-4 mt-16">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3F6] border border-[#EBC6DD] text-xs font-semibold text-[#8E3A7A] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#B8559B]" />
            <span>التصنيفات المنهجية</span>
          </div>
          <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2B1626]">
            أبواب العلم والتزكية
          </h2>
          <p className="text-xs sm:text-sm text-[#5C3D55] mt-1">
            اختر الباب العلمي لتصفح الدروس والسلاسل التابعة له مباشرة
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 'All' */}
          <button
            type="button"
            onClick={() => setSelectedCategory("الكل")}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
              selectedCategory === "الكل"
                ? "bg-gradient-to-b from-[#8E3A7A] to-[#B8559B] text-white border-transparent shadow-md transform -translate-y-1"
                : "bg-white border-[#EAD5E1] text-[#2B1626] hover:border-[#8E3A7A] hover:bg-[#FAF3F6]"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 ${
                selectedCategory === "الكل"
                  ? "bg-white/20 text-white"
                  : "bg-[#FAF3F6] text-[#8E3A7A]"
              }`}
            >
              <Grid className="w-5 h-5" />
            </div>
            <div className="font-serif-arabic text-sm sm:text-base font-bold leading-tight">
              جميع الأبواب
            </div>
            <div
              className={`text-[11px] mt-1 ${
                selectedCategory === "الكل" ? "text-white/80" : "text-[#6E4E65]"
              }`}
            >
              {data.lessons.length} درس
            </div>
          </button>

          {/* Active Actual Categories */}
          {availableCategories.map((cat) => {
            const meta = CATEGORY_META[cat] || {
              icon: BookOpen,
              description: "دروس وشروحات علمية مباركة",
            };
            const IconComponent = meta.icon;
            const count = data.lessons.filter((l) => l.category === cat).length;
            const isSelected = selectedCategory === cat;
            const isQuran = cat.includes("تفسير") || cat.includes("قرآن");

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "الكل" : cat)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                  isSelected
                    ? "bg-gradient-to-b from-[#8E3A7A] to-[#B8559B] text-white border-transparent shadow-md transform -translate-y-1"
                    : "bg-white border-[#EAD5E1] text-[#2B1626] hover:border-[#8E3A7A] hover:bg-[#FAF3F6]"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : isQuran
                      ? "bg-[#EBF4EE] text-[#3D6B52]"
                      : "bg-[#FAF3F6] text-[#8E3A7A]"
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="font-serif-arabic text-sm sm:text-base font-bold leading-tight">
                  {cat}
                </div>
                <div
                  className={`text-[11px] mt-1 ${
                    isSelected ? "text-white/80" : "text-[#6E4E65]"
                  }`}
                >
                  {count} {count === 1 ? "درس" : "دروس"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Featured Series – السلاسل العلمية */}
      <section id="series" className="max-w-6xl mx-auto px-4 mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#EAD5E1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2B1626]">
                السلاسل العلمية والمنهجية
              </h2>
              <p className="text-xs sm:text-sm text-[#5C3D55]">
                شروحات مرتبة ومترابطة للاستماع والمتابعة المنهجية
              </p>
            </div>
          </div>

          {selectedCategory !== "الكل" && (
            <div className="text-xs bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] px-3 py-1.5 rounded-xl font-medium self-start flex items-center gap-2">
              <span>تصفية بحسب: {selectedCategory}</span>
              <button
                type="button"
                onClick={() => setSelectedCategory("الكل")}
                className="hover:underline text-[#B8559B]"
              >
                (عرض الكل)
              </button>
            </div>
          )}
        </div>

        {filteredSeries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#EAD5E1] bg-white/80 p-12 text-center text-sm text-[#6E4E65]">
            لا توجد سلاسل مطابقة لخيار البحث أو التصنيف المحدد.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeries.map((series) => {
              const st = seriesStats.get(series.id) || { count: 0, totalSeconds: 0 };
              const style = ACCENT_STYLES[series.coverAccent] || ACCENT_STYLES.purple;
              const isTafsir = series.category.includes("تفسير");

              return (
                <Link
                  key={series.id}
                  href={`/series/${series.slug}`}
                  className="group rounded-3xl border border-[#EAD5E1] bg-white overflow-hidden hover:border-[#8E3A7A] hover:shadow-[0_8px_30px_rgba(142,58,122,0.1)] transition-all flex flex-col"
                >
                  {/* Decorative Header Bar */}
                  <div className={`h-3 bg-gradient-to-l ${style.bar}`} />

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          isTafsir
                            ? "bg-[#EBF4EE] text-[#3D6B52] border-[#3D6B52]/20"
                            : "bg-[#FAF3F6] text-[#8E3A7A] border-[#EBC6DD]"
                        }`}
                      >
                        {series.category}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          series.status === "completed"
                            ? "bg-[#EBF4EE] text-[#3D6B52] border border-[#3D6B52]/20"
                            : "bg-[#FFF4E5] text-[#B8559B] border border-[#FFE0B2]"
                        }`}
                      >
                        {series.status === "completed" ? "مكتملة" : "مستمرة"}
                      </span>
                    </div>

                    {/* Series Title */}
                    <h3 className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#2B1626] group-hover:text-[#8E3A7A] transition-colors leading-snug">
                      {series.title}
                    </h3>

                    {/* Series Description */}
                    <p className="mt-2.5 text-xs sm:text-sm text-[#5C3D55] line-clamp-3 leading-relaxed flex-1">
                      {series.description || "سلسلة علمية منهجية للداعية فاطمة حجازي."}
                    </p>

                    {/* Footer Info: Lessons count, Duration, Button */}
                    <div className="mt-6 pt-4 border-t border-[#FAF3F6] flex items-center justify-between text-xs text-[#6E4E65]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#8E3A7A]">
                          <BookOpen className="w-3.5 h-3.5 text-[#3D6B52]" />
                          {st.count} {st.count === 1 ? "درس" : "دروس"}
                        </span>
                        {st.totalSeconds > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#D68FBF]" />
                            {formatTotalDurationArabic(st.totalSeconds)}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-[#8E3A7A] font-bold group-hover:-translate-x-1 transition-transform">
                        <span>استعراض السلسلة</span>
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

      {/* 7. Latest Lessons – أحدث الدروس والمحاضرات الصوتية */}
      <section id="lessons" className="max-w-6xl mx-auto px-4 mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#EAD5E1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF3F6] border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-arabic text-2xl sm:text-3xl font-bold text-[#2B1626]">
                الدروس والمحاضرات الصوتية
              </h2>
              <p className="text-xs sm:text-sm text-[#5C3D55]">
                استمع مباشرة بنقاء صوتي عالي، أو حمّل الملفات بصيغة MP3 مجاناً
              </p>
            </div>
          </div>

          {/* Filter Tab: All vs Single */}
          <div className="inline-flex rounded-2xl border border-[#EAD5E1] bg-white p-1 self-start shadow-xs">
            <button
              type="button"
              onClick={() => setLessonTab("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                lessonTab === "all"
                  ? "bg-[#8E3A7A] text-white shadow-xs"
                  : "text-[#5C3D55] hover:text-[#8E3A7A]"
              }`}
            >
              جميع الدروس ({data.lessons.length})
            </button>
            <button
              type="button"
              onClick={() => setLessonTab("single")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                lessonTab === "single"
                  ? "bg-[#8E3A7A] text-white shadow-xs"
                  : "text-[#5C3D55] hover:text-[#8E3A7A]"
              }`}
            >
              دروس مفردة ({data.lessons.filter((l) => !l.seriesId).length})
            </button>
          </div>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#EAD5E1] bg-white/80 p-14 text-center text-sm text-[#6E4E65]">
            لا توجد دروس مطابقة لمعايير البحث الحالية.
          </div>
        ) : (
          <div className="space-y-4">
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

      {/* About Section – نبذة عن الداعية فاطمة حجازي */}
      <section
        id="about"
        className="max-w-6xl mx-auto px-4 mt-24 pt-12 border-t border-[#EAD5E1]"
      >
        <div className="rounded-3xl bg-gradient-to-br from-[#FAF3F6] via-white to-[#FAF3F6] border border-[#EAD5E1] p-8 sm:p-12 shadow-[0_8px_30px_rgba(142,58,122,0.04)] relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#EBC6DD] text-xs font-semibold text-[#8E3A7A] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#B8559B]" />
              <span>نبذة تعريفية</span>
            </div>

            <h3 className="font-serif-arabic text-2xl sm:text-4xl font-bold text-[#2B1527] leading-tight">
              عن الداعية أ. فاطمة حجازي ومنصة «أنزله بعلمه»
            </h3>

            <p className="mt-4 text-sm sm:text-base text-[#5C3D55] leading-relaxed">
              {data.settings.bio}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#8E3A7A] font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3D6B52]" />
                <span>شروحات وتأملات قرآنية مبنية على الدليل الصحيح</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3D6B52]" />
                <span>محتوى مجاني ومتاح للجميع للنفع العام والتحميل</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
