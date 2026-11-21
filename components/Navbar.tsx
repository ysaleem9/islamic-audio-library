import React from "react";
import Link from "next/link";
import { BookOpen, Headphones, Settings } from "lucide-react";

interface NavbarProps {
  siteName: string;
}

export function Navbar({ siteName }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e6dfd1]/90 bg-[#faf8f4]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#14533c] text-[#f9f3e7] flex items-center justify-center shadow-sm group-hover:bg-[#0e3d2b] transition-colors">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif-arabic text-xl font-bold text-[#14533c] block leading-tight">
              {siteName}
            </span>
            <span className="text-[11px] text-[#5a6660] hidden sm:block">
              دروس علمية ومحاضرات صوتية
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/#series"
            className="px-3 py-2 rounded-lg text-[#1a2420] hover:bg-[#eef5f1] hover:text-[#14533c] transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 hidden sm:block" />
            <span>السلاسل</span>
          </Link>
          <Link
            href="/#lessons"
            className="px-3 py-2 rounded-lg text-[#1a2420] hover:bg-[#eef5f1] hover:text-[#14533c] transition-colors"
          >
            الدروس
          </Link>
          <Link
            href="/admin"
            className="px-3 py-2 rounded-lg border border-[#e6dfd1] bg-white hover:border-[#14533c] text-[#14533c] transition-colors flex items-center gap-1.5 font-medium"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
