"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Headphones,
  Menu,
  X,
  Sparkles,
  Info,
  Grid,
  ShieldCheck,
} from "lucide-react";
import { LogoAnzalahu } from "./LogoAnzalahu";

interface NavbarProps {
  siteName: string;
}

export function Navbar({ siteName }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#EAD5E1] bg-[#FAF3F6]/90 backdrop-blur-md transition-all">
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
            href="/#categories"
            className="px-3.5 py-2 rounded-xl text-[#2B1626] font-medium hover:text-[#8E3A7A] hover:bg-[#EBC6DD]/40 transition-colors flex items-center gap-1.5"
          >
            <Grid className="w-4 h-4 text-[#B8559B]" />
            <span>التصنيفات</span>
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
          <Link
            href="/#about"
            className="px-3.5 py-2 rounded-xl text-[#2B1626] font-medium hover:text-[#8E3A7A] hover:bg-[#EBC6DD]/40 transition-colors flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-[#3D6B52]" />
            <span>عن الداعية</span>
          </Link>

          {/* Admin link */}
          <Link
            href="/admin"
            className="mr-2 px-3 py-1.5 rounded-xl border border-[#EAD5E1] bg-white/80 hover:bg-white text-[#8E3A7A] hover:border-[#8E3A7A] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#B8559B]" />
            <span>لوحة التحكم</span>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/admin"
            className="p-2 rounded-xl border border-[#EAD5E1] bg-white text-[#8E3A7A]"
            aria-label="لوحة التحكم"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
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
              href="/#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-medium text-[#2B1626] hover:bg-[#EBC6DD]/40 hover:text-[#8E3A7A] flex items-center gap-2"
            >
              <Grid className="w-4 h-4 text-[#B8559B]" />
              <span>التصنيفات العلمية</span>
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
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-medium text-[#2B1626] hover:bg-[#EBC6DD]/40 hover:text-[#8E3A7A] flex items-center gap-2"
            >
              <Info className="w-4 h-4 text-[#3D6B52]" />
              <span>نبذة عن الداعية فاطمة حجازي</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
