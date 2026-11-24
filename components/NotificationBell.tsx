"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Calendar, Clock, ExternalLink, Megaphone, Video, X } from "lucide-react";
import type { SiteNotification } from "@/lib/types";
import { formatArabicDate } from "@/lib/format";
import { ShareMenu } from "./ShareMenu";

const SEEN_STORAGE_KEY = "fatima_seen_notifications_v1";

function formatArabicTime(timeStr?: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const period = h >= 12 ? "مساءً" : "صباحاً";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setSeenIds(new Set(saved));
    } catch {
      // Ignore storage errors
    }

    fetch("/api/notifications?active=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => {
        if (Array.isArray(items)) {
          const now = Date.now();
          setNotifications(
            items.filter((n: SiteNotification) => new Date(n.expiresAt).getTime() > now)
          );
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && notifications.length > 0) {
      const nextSeen = new Set(seenIds);
      notifications.forEach((n) => nextSeen.add(n.id));
      setSeenIds(nextSeen);
      try {
        localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...nextSeen]));
      } catch {
        // Ignore storage errors
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="الإشعارات والإعلانات"
        aria-expanded={open}
        className="relative p-2.5 rounded-xl border border-[#EAD5E1] bg-white/90 hover:bg-[#FAF3F6] hover:border-[#8E3A7A]/60 text-[#8E3A7A] transition-all cursor-pointer shadow-2xs"
        title="الإشعارات واللقاءات الإيمانية"
      >
        <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[19px] h-[19px] px-1 rounded-full bg-[#8E3A7A] text-white text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-[#FAF3F6] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2.5 w-[min(92vw,24rem)] rounded-2xl border border-[#EAD5E1] bg-white shadow-[0_18px_48px_rgba(43,22,38,0.16)] overflow-hidden z-50 text-right">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-l from-[#FAF3F6] to-[#EBF4EE]/70 border-b border-[#EAD5E1] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#8E3A7A]" />
              <span className="font-serif-arabic text-base font-bold text-[#2B1626]">
                الإشعارات واللقاءات الإيمانية
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق الإشعارات"
              className="p-1 rounded-lg text-[#6E4E65] hover:text-[#8E3A7A] hover:bg-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body with clear visible divider line between notifications */}
          <div className="max-h-[28rem] overflow-y-auto divide-y-2 divide-[#DFC1D3]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-[#6E4E65]">
                لا توجد إعلانات أو لقاءات نشطة في الوقت الحالي.
              </div>
            ) : (
              notifications.map((item) => {
                const isMeeting = item.type === "faith_meeting";
                const shareTitle = item.title || (isMeeting ? "لقاء إيماني مباشر" : "إعلان من منصة الأستاذة فاطمة حجازي");
                const shareCustomText = isMeeting
                  ? [
                      `دعوة لحضور لقاء إيماني: ${shareTitle}`,
                      item.meetingDate ? `التاريخ: ${formatArabicDate(item.meetingDate)}` : "",
                      item.meetingTime ? `الوقت: ${formatArabicTime(item.meetingTime)}` : "",
                      item.message || "",
                      "منصة الأستاذة فاطمة حجازي «أنزله بعلمه»",
                    ]
                      .filter(Boolean)
                      .join("\n")
                  : `${shareTitle}${item.message ? `\n${item.message}` : ""}\nمنصة الأستاذة فاطمة حجازي «أنزله بعلمه»`;

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${
                      isMeeting ? "bg-[#F7FBF8]/70" : "bg-white"
                    }`}
                  >
                    {/* Type Badge + Date */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isMeeting
                            ? "bg-[#EBF4EE] text-[#2E5741] border-[#C8DFCF]"
                            : "bg-[#FAF3F6] text-[#8E3A7A] border-[#EBC6DD]"
                        }`}
                      >
                        {isMeeting ? (
                          <>
                            <Video className="w-3 h-3" />
                            <span>لقاء إيماني</span>
                          </>
                        ) : (
                          <>
                            <Megaphone className="w-3 h-3" />
                            <span>إعلان</span>
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-[#82607A]">
                        {formatArabicDate(item.createdAt.slice(0, 10))}
                      </span>
                    </div>

                    {/* Title */}
                    {item.title && (
                      <h4 className="font-serif-arabic text-base font-bold text-[#2B1626] leading-snug">
                        {item.title}
                      </h4>
                    )}

                    {/* Meeting Date & Time */}
                    {isMeeting && (item.meetingDate || item.meetingTime) && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#2E5741] font-semibold bg-white border border-[#C8DFCF]/80 rounded-xl px-3 py-2">
                        {item.meetingDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#3D6B52]" />
                            {formatArabicDate(item.meetingDate)}
                          </span>
                        )}
                        {item.meetingTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#8E3A7A]" />
                            {formatArabicTime(item.meetingTime)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message / Details */}
                    {item.message && (
                      <p className="mt-2 text-xs sm:text-sm text-[#5C3D55] leading-relaxed whitespace-pre-line">
                        {item.message}
                      </p>
                    )}

                    {/* Actions: Zoom Join CTA + Share Button */}
                    <div className="mt-3 space-y-2">
                      {isMeeting && item.zoomUrl && (
                        <a
                          href={item.zoomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#2E5741] hover:bg-[#234432] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                        >
                          <Video className="w-4 h-4" />
                          <span>الانضمام إلى اللقاء عبر Zoom</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </a>
                      )}

                      <ShareMenu
                        title={shareTitle}
                        path={isMeeting && item.zoomUrl ? item.zoomUrl : "/"}
                        customText={shareCustomText}
                        label={isMeeting ? "مشاركة رابط الاجتماع" : "مشاركة الإعلان"}
                        variant="button"
                        inline
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
