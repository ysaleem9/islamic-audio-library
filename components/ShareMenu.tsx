"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Mail, MessageCircle, Send, Share2 } from "lucide-react";

interface ShareMenuProps {
  title: string;
  path?: string;
  customText?: string;
  label?: string;
  variant?: "subtle" | "button";
  align?: "left" | "right";
  inline?: boolean;
}

export function ShareMenu({
  title,
  path,
  customText,
  label = "مشاركة",
  variant = "subtle",
  align = "left",
  inline = false,
}: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const portalMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const updatePosition = useCallback(() => {
    if (inline || !buttonRef.current || typeof window === "undefined") return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 224; // w-56
    const menuEstHeight = canNativeShare ? 320 : 280;
    const gap = 8;

    let left = align === "left" ? rect.left : rect.right - menuWidth;
    left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, left));

    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + gap;
    if (spaceBelow < menuEstHeight && rect.top > menuEstHeight) {
      top = Math.max(12, rect.top - menuEstHeight - gap);
    }

    setMenuPos({ top, left });
  }, [align, canNativeShare, inline]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inPortal = portalMenuRef.current?.contains(target);
      if (!inContainer && !inPortal) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleScrollOrResize = () => updatePosition();

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updatePosition]);

  const getShareUrl = () => {
    if (typeof window === "undefined") return path || "";
    if (!path) return window.location.href;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const shareText = customText || `${title} — منصة الأستاذة فاطمة حجازي «أنزله بعلمه»`;

  const openShareLink = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleWhatsApp = () => {
    const url = getShareUrl();
    const text = `${shareText}\n${url}`;
    openShareLink(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleTelegram = () => {
    const url = getShareUrl();
    openShareLink(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`
    );
  };

  const handleFacebook = () => {
    const url = getShareUrl();
    openShareLink(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    );
  };

  const handleX = () => {
    const url = getShareUrl();
    openShareLink(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
    );
  };

  const handleEmail = () => {
    const url = getShareUrl();
    const subject = encodeURIComponent(shareText);
    const body = encodeURIComponent(`${shareText}\n\nاستمع للدرس عبر الرابط:\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    try {
      await navigator.share({ title, text: shareText, url });
      setOpen(false);
    } catch {
      // User dismissed native share sheet
    }
  };

  const triggerClass =
    variant === "button"
      ? "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EAD5E1] bg-white text-xs sm:text-sm font-semibold text-[#8E3A7A] hover:bg-[#FAF3F6] hover:border-[#8E3A7A]/60 transition-colors cursor-pointer shadow-2xs"
      : "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#6E4E65] hover:text-[#8E3A7A] hover:bg-[#FAF3F6] transition-colors cursor-pointer";

  const menuContent = (
    <div
      ref={portalMenuRef}
      role="menu"
      dir="rtl"
      style={
        inline
          ? undefined
          : menuPos
          ? { position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }
          : { position: "fixed", top: -9999, left: -9999, zIndex: 9999 }
      }
      className={
        inline
          ? "mt-2 w-full rounded-2xl border border-[#EAD5E1] bg-white shadow-sm p-2 text-right"
          : "w-56 rounded-2xl border border-[#EAD5E1] bg-white shadow-[0_14px_38px_rgba(43,22,38,0.16)] p-2 text-right"
      }
    >
      <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#82607A] border-b border-[#FAF3F6] mb-1">
        مشاركة عبر
      </div>

      <button
        type="button"
        role="menuitem"
        onClick={handleWhatsApp}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#2B1626] hover:bg-[#EBF4EE] hover:text-[#1F6E43] transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg bg-[#25D366]/15 text-[#1DA851] flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4" />
        </span>
        <span>واتساب (WhatsApp)</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={handleTelegram}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#2B1626] hover:bg-[#EDF7FD] hover:text-[#1D8AC0] transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center shrink-0">
          <Send className="w-3.5 h-3.5" />
        </span>
        <span>تيليجرام (Telegram)</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={handleFacebook}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#2B1626] hover:bg-[#EEF3FC] hover:text-[#1877F2] transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg bg-[#1877F2]/15 text-[#1877F2] flex items-center justify-center shrink-0 font-bold text-sm">
          f
        </span>
        <span>فيسبوك (Facebook)</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={handleX}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#2B1626] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg bg-[#111111]/10 text-[#111111] flex items-center justify-center shrink-0 font-bold text-xs">
          𝕏
        </span>
        <span>منصة إكس (X)</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={handleEmail}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#2B1626] hover:bg-[#FAF3F6] hover:text-[#8E3A7A] transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg bg-[#8E3A7A]/12 text-[#8E3A7A] flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4" />
        </span>
        <span>البريد الإلكتروني</span>
      </button>

      <div className="my-1 border-t border-[#FAF3F6]" />

      <button
        type="button"
        role="menuitem"
        onClick={handleCopy}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#2B1626] hover:bg-[#FAF3F6] hover:text-[#8E3A7A] transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg bg-[#EBC6DD]/50 text-[#8E3A7A] flex items-center justify-center shrink-0">
          {copied ? <Check className="w-4 h-4 text-[#2E5741]" /> : <Copy className="w-3.5 h-3.5" />}
        </span>
        <span className={copied ? "text-[#2E5741] font-semibold" : ""}>
          {copied ? "تم نسخ الرابط ✓" : "نسخ الرابط"}
        </span>
      </button>

      {canNativeShare && (
        <button
          type="button"
          role="menuitem"
          onClick={handleNativeShare}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#5C3D55] hover:bg-[#FAF3F6] hover:text-[#8E3A7A] transition-colors cursor-pointer"
        >
          <span className="w-7 h-7 rounded-lg bg-[#EBF4EE] text-[#2E5741] flex items-center justify-center shrink-0">
            <Share2 className="w-3.5 h-3.5" />
          </span>
          <span>تطبيقات أخرى...</span>
        </button>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className={inline ? "w-full" : "relative inline-block"}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        title="مشاركة عبر التطبيقات"
      >
        <Share2 className="w-3.5 h-3.5 text-[#B8559B]" />
        <span>{label}</span>
      </button>

      {open &&
        (inline
          ? menuContent
          : typeof document !== "undefined"
          ? createPortal(menuContent, document.body)
          : null)}
    </div>
  );
}
