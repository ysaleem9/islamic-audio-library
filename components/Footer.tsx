import React from "react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-20 border-t border-[#e6dfd1] bg-white/70 pb-28">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#5a6660]">
        <div className="text-center sm:text-right">
          <p className="font-serif-arabic text-lg font-bold text-[#14533c]">{settings.siteName}</p>
          <p className="mt-1">{settings.sheikhName} — جميع الدروس متاحة للنفع العام وللتحميل المجاني</p>
        </div>

        <div className="flex items-center gap-4">
          {settings.telegramUrl && (
            <a
              href={settings.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#14533c] transition-colors"
            >
              تيليجرام
            </a>
          )}
          {settings.youtubeUrl && (
            <a
              href={settings.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#14533c] transition-colors"
            >
              يوتيوب
            </a>
          )}
          {settings.whatsappUrl && (
            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#14533c] transition-colors"
            >
              واتساب
            </a>
          )}
          <Link href="/admin" className="hover:text-[#14533c] transition-colors">
            إدارة الموقع
          </Link>
        </div>
      </div>
    </footer>
  );
}
