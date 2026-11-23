"use client";

import React from "react";
import Link from "next/link";
import { Send, ShieldCheck, Sparkles, BookOpen, Headphones, Grid, Info } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { LogoAnzalahu } from "./LogoAnzalahu";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-24 border-t border-[#EAD5E1] bg-gradient-to-b from-[#FAF3F6] to-[#F5E6EE] pb-32 pt-14">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#EAD5E1]">
          {/* Column 1: Identity & Description */}
          <div className="md:col-span-2 space-y-4">
            <LogoAnzalahu variant="footer" />
            <p className="text-xs sm:text-sm text-[#5C3D55] leading-relaxed max-w-md">
              منصة علمية ودعوية مباركة تعنى بنشر شروحات القرآن الكريم والسنة النبوية، العقيدة، الفقه،
              الرقائق وتزكية النفوس، والتربية الإيمانية للأستاذة فاطمة حجازي.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-[#EBC6DD] text-xs font-semibold text-[#8E3A7A]">
              <Sparkles className="w-3.5 h-3.5 text-[#3D6B52]" />
              <span>وقف لله تعالى — متاح للنفع العام والاستماع المجاني</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-serif-arabic text-base font-bold text-[#8E3A7A]">
              أقسام المنصة
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#5C3D55]">
              <li>
                <Link href="/#hero" className="hover:text-[#8E3A7A] transition-colors flex items-center gap-1.5">
                  <span>الصفحة الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-[#8E3A7A] transition-colors flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-[#B8559B]" />
                  <span>التصنيفات العلمية</span>
                </Link>
              </li>
              <li>
                <Link href="/#series" className="hover:text-[#8E3A7A] transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#3D6B52]" />
                  <span>السلاسل المنهجية</span>
                </Link>
              </li>
              <li>
                <Link href="/#lessons" className="hover:text-[#8E3A7A] transition-colors flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#B8559B]" />
                  <span>الدروس والمحاضرات</span>
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[#8E3A7A] transition-colors flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#3D6B52]" />
                  <span>عن الأستاذة فاطمة حجازي</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Communication & Management */}
          <div className="space-y-3">
            <h4 className="font-serif-arabic text-base font-bold text-[#8E3A7A]">
              التواصل والإشراف
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#5C3D55]">
              {settings.telegramUrl ? (
                <li>
                  <a
                    href={settings.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#EAD5E1] text-[#8E3A7A] hover:bg-[#FAF3F6] font-semibold transition-all shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5 text-[#3D6B52]" />
                    <span>قناة التيليجرام الرسمية</span>
                  </a>
                </li>
              ) : null}

              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#EAD5E1] bg-white/70 text-[#6E4E65] hover:text-[#8E3A7A] hover:bg-white text-xs font-medium transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B8559B]" />
                  <span>لوحة إدارة المنصة</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E4E65]">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} — منصة الأستاذة فاطمة حجازي «أنزله بعلمه»
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#3D6B52] font-semibold">
            <span>جُعل هذا الموقع خالصاً لوجه الله تعالى ونفعاً لعموم المسلمين</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
