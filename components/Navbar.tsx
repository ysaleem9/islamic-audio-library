import React from "react";
import Link from "next/link";
import { BookOpen, Headphones, Settings } from "lucide-react";

interface NavbarProps {
  siteName: string;
}

export function Navbar({ siteName }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#EBC6DD]/90 bg-[#FAF3F6]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#8E3A7A] text-[#FAF3F6] flex items-center justify-center shadow-sm group-hover:bg-[#6F2B5F] transition-colors">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif-arabic text-xl font-bold text-[#8E3A7A] block leading-tight">
              {siteName}
            </span>
            <span className="text-[11px] text-[#6E4E65] hidden sm:block">
              دروس علمية ومحاضرات صوتية
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/#series"
            className="px-3 py-2 rounded-lg text-[#2D1626] hover:bg-[#EBC6DD]/40 hover:text-[#8E3A7A] transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 hidden sm:block" />
            <span>السلاسل</span>
          </Link>
          <Link
            href="/#lessons"
            className="px-3 py-2 rounded-lg text-[#2D1626] hover:bg-[#EBC6DD]/40 hover:text-[#8E3A7A] transition-colors"
          >
            الدروس
          </Link>
          <Link
            href="/admin"
            className="px-3 py-2 rounded-lg border border-[#EBC6DD] bg-white hover:border-[#8E3A7A] text-[#8E3A7A] transition-colors flex items-center gap-1.5 font-medium"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
