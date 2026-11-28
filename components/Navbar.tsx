"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Headphones,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { LogoAnzalahu } from "./LogoAnzalahu";
import { NotificationBell } from "./NotificationBell";

interface NavbarProps {
  siteName: string;
}

export function Navbar({ siteName }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [betaBannerVisible, setBetaBannerVisible] = useState(true);

  return (
    <header className="sticky top-0 z-40 border-b border-[#EAD5E1] bg-[#FAF3F6]/90 backdrop-blur-md transition-all">
      {/* Subtle Beta Announcement Strip */}
      {betaBannerVisible && (
        <div className="bg-gradient-to-l from-[#2E5741] via-[#3D6B52] to-[#6F2B5F] text-white border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2.5 text-[11px] sm:text-xs relative">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/18 border border-white/25 font-bold shrink-0">
              <Sparkles className="w-3 h-3 text-[#EBC6DD]" />
              <span>نسخة تجريبية</span>
            </span>
            <p className="text-white/95 leading-snug text-center pl-6 sm:pl-0">
              يجري حالياً استكمال المادة العلمية وإضافة المزايا الجديدة تمهيداً للانطلاق الرسمي قريباً؛ نسعد بملاحظاتكم واقتراحاتكم.
            </p>
            <button
              type="button"
              onClick={() => setBetaBannerVisible(false)}
              aria-label="إغلاق التنبيه"
              className="absolute left-3 sm:left-4 p-1 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none"
          aria-label={siteName}
        >
          <LogoAnzalahu variant="header" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm">
          <Link
            href="/#hero"
            className="px-3.5 py-2 rounded-xl text-[#2B1626] font-medium hover:text-[#8E3A7A] hover:bg-[#EBC6DD]/40 transition-colors"
          >
            الرئيسية
          </Link>
          <Link
            href="/#series"
            className="px-3.5 py-2 rounded-xl text-[#2B1626] font-medium hover:text-[#8E3A7A] hover:bg-[#EBC6DD]/40 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-[#3D6B52]" />
            <span>السلاسل العلمية</span>
          </Link>
          <Link
            href="/#lessons"
            className="px-3.5 py-2 rounded-xl text-[#2B1626] font-medium hover:text-[#8E3A7A] hover:bg-[#EBC6DD]/40 transition-colors flex items-center gap-1.5"
          >
            <Headphones className="w-4 h-4 text-[#B8559B]" />
            <span>الدروس والمحاضرات</span>
          </Link>

          <div className="mr-1.5">
            <NotificationBell />
          </div>
        </nav>

        {/* Mobile menu button + Notifications Bell */}
        <div className="flex md:hidden items-center gap-2">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-[#EAD5E1] bg-white text-[#8E3A7A] hover:bg-[#EBC6DD]/30 transition-colors"
            aria-label="فتح القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EAD5E1] bg-[#FAF3F6] px-4 pt-3 pb-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-2">
            <Link
              href="/#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-medium text-[#2B1626] hover:bg-[#EBC6DD]/40 hover:text-[#8E3A7A]"
            >
              الرئيسية
            </Link>
            <Link
              href="/#series"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-medium text-[#2B1626] hover:bg-[#EBC6DD]/40 hover:text-[#8E3A7A] flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#3D6B52]" />
              <span>السلاسل العلمية</span>
            </Link>
            <Link
              href="/#lessons"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-medium text-[#2B1626] hover:bg-[#EBC6DD]/40 hover:text-[#8E3A7A] flex items-center gap-2"
            >
              <Headphones className="w-4 h-4 text-[#B8559B]" />
              <span>الدروس والمحاضرات</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
