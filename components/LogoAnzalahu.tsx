"use client";

import React from "react";

interface LogoProps {
  variant?: "header" | "hero" | "heroEmblem" | "emblem" | "footer";
  className?: string;
}

export function LogoAnzalahu({ variant = "header", className = "" }: LogoProps) {
  if (variant === "header") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Official Transparent Emblem */}
        <img
          src="/images/logo-anzalahu.png"
          alt="شعار أنزله بعلمه — الأستاذة فاطمة حجازي"
          width={52}
          height={52}
          className="w-12 h-12 sm:w-[54px] sm:h-[54px] shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(142,58,122,0.12)] transition-transform duration-200 group-hover:scale-105"
        />

        {/* Brand Text */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-serif-arabic text-xl font-bold text-[#8E3A7A] tracking-tight leading-tight">
              الأستاذة فاطمة حجازي
            </span>
          </div>
          <span className="text-[11px] text-[#6E4E65] font-medium leading-tight hidden sm:block">
            المنصة العلمية والدعوية
          </span>
        </div>
      </div>
    );
  }

  if (variant === "heroEmblem") {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      >
        {/* Subtle ambient halo behind the official emblem */}
        <div
          aria-hidden="true"
          className="absolute inset-6 bg-gradient-to-tr from-[#EBC6DD]/40 via-white/60 to-[#EBF4EE]/45 rounded-full blur-2xl -z-10"
        />

        {/* Official High-Resolution Transparent Logo */}
        <img
          src="/images/logo-anzalahu.png"
          alt="شعار منصة أنزله بعلمه — الأستاذة فاطمة حجازي"
          width={320}
          height={315}
          className="w-56 h-56 sm:w-[272px] sm:h-[272px] lg:w-[310px] lg:h-[310px] object-contain drop-shadow-[0_12px_32px_rgba(142,58,122,0.15)]"
        />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={`inline-flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-white/85 backdrop-blur-md border border-[#EBC6DD] shadow-[0_4px_20px_rgba(142,58,122,0.06)] ${className}`}
      >
        <img
          src="/images/logo-anzalahu.png"
          alt="شعار أنزله بعلمه"
          width={44}
          height={44}
          className="w-11 h-11 object-contain shrink-0"
        />
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
      <img
        src="/images/logo-anzalahu.png"
        alt="شعار أنزله بعلمه — الأستاذة فاطمة حجازي"
        width={50}
        height={50}
        className="w-12 h-12 object-contain shrink-0"
      />
      <div>
        <div className="font-serif-arabic text-lg font-bold text-[#8E3A7A] leading-tight">
          الأستاذة فاطمة حجازي
        </div>
        <div className="text-xs text-[#6E4E65] font-serif-arabic">
          «أنزله بعلمه» — منصة الدروس والشروحات المنهجية
        </div>
      </div>
    </div>
  );
}
