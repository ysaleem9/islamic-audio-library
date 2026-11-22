"use client";

import React from "react";

interface LogoProps {
  variant?: "header" | "hero" | "emblem" | "footer";
  className?: string;
}

export function LogoAnzalahu({ variant = "header", className = "" }: LogoProps) {
  if (variant === "header") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Emblem Seal */}
        <div className="relative w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-[#8E3A7A] via-[#B8559B] to-[#3D6B52] p-[1.5px] shadow-sm">
          <div className="w-full h-full rounded-[14px] bg-[#FAF3F6] flex flex-col items-center justify-center text-center p-1 border border-[#EBC6DD]/60">
            <span className="font-serif-arabic text-[10px] font-bold text-[#8E3A7A] leading-none tracking-tight">
              أنزَلَه
            </span>
            <span className="font-serif-arabic text-[9px] font-semibold text-[#3D6B52] leading-none mt-0.5">
              بِعِلمِه
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-serif-arabic text-xl font-bold text-[#8E3A7A] tracking-tight leading-tight">
              أ. فاطمة حجازي
            </span>
            <span className="hidden lg:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF4EE] border border-[#3D6B52]/20 text-[#3D6B52]">
              أنزله بعلمه
            </span>
          </div>
          <span className="text-[11px] text-[#6E4E65] font-medium leading-tight hidden sm:block">
            المنصة العلمية والدعوية
          </span>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={`inline-flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-white/85 backdrop-blur-md border border-[#EBC6DD] shadow-[0_4px_20px_rgba(142,58,122,0.06)] ${className}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8E3A7A] to-[#3D6B52] text-white flex items-center justify-center shadow-xs">
          <span className="font-serif-arabic text-base font-bold">۝</span>
        </div>
        <div className="text-right">
          <div className="font-serif-arabic text-sm sm:text-base font-bold text-[#8E3A7A] leading-tight">
            «أَنزَلَهُ بِعِلْمِهِ»
          </div>
          <div className="text-[11px] text-[#3D6B52] font-semibold">
            شعار المنصة العلمية والدعوية
          </div>
        </div>
      </div>
    );
  }

  // Footer variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8E3A7A] via-[#B8559B] to-[#3D6B52] text-white flex items-center justify-center font-serif-arabic font-bold text-sm shadow-sm">
        ف.ح
      </div>
      <div>
        <div className="font-serif-arabic text-lg font-bold text-[#8E3A7A] leading-tight">
          الداعية أ. فاطمة حجازي
        </div>
        <div className="text-xs text-[#6E4E65] font-serif-arabic">
          «أنزله بعلمه» — منصة الدروس والشروحات المنهجية
        </div>
      </div>
    </div>
  );
}
