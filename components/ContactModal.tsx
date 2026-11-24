"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, Send, X, AlertCircle } from "lucide-react";

const CONTACT_CATEGORIES = [
  "الإبلاغ عن مشكلة",
  "اقتراح وتطوير",
  "طلب درس أو سلسلة علمية",
  "إبلاغ عن رابط صوتي لا يعمل",
  "استفسار عام",
] as const;

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [category, setCategory] = useState<string>(CONTACT_CATEGORIES[0]);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    emailSent: boolean;
    mailtoUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const resetAndClose = () => {
    setError(null);
    setResult(null);
    setSenderName("");
    setSenderEmail("");
    setMessage("");
    setCategory(CONTACT_CATEGORIES[0]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senderEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      setError("يرجى إدخال بريد إلكتروني صحيح حتى نتمكن من الرد عليك.");
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      setError("يرجى كتابة تفاصيل رسالتك قبل الإرسال.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى.");
        return;
      }

      const subject = encodeURIComponent(`[${category}] رسالة من ${senderName.trim() || senderEmail.trim()}`);
      const body = encodeURIComponent(
        `نوع الرسالة: ${category}\nالاسم: ${senderName.trim() || "غير محدد"}\nالبريد الإلكتروني للرد: ${senderEmail.trim()}\n\nالرسالة:\n${message.trim()}`
      );
      setResult({
        emailSent: Boolean(data.emailSent),
        mailtoUrl: `mailto:support@fatimahijazi.com?subject=${subject}&body=${body}`,
      });
    } catch {
      setError("حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B1626]/45 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) resetAndClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-[#EAD5E1] bg-white shadow-[0_24px_60px_rgba(43,22,38,0.22)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#FAF3F6] via-white to-[#EBF4EE]/70 px-6 py-5 border-b border-[#EAD5E1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8E3A7A]/10 border border-[#EBC6DD] text-[#8E3A7A] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="contact-dialog-title"
                className="font-serif-arabic text-xl sm:text-2xl font-bold text-[#2B1626]"
              >
                تواصل معنا
              </h3>
              <p className="text-xs text-[#5C3D55] mt-0.5">
                يسعدنا استقبال مقترحاتكم وملاحظاتكم على{" "}
                <span dir="ltr" className="font-semibold text-[#2E5741]">
                  support@fatimahijazi.com
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            aria-label="إغلاق النافذة"
            className="p-2 rounded-xl text-[#6E4E65] hover:text-[#8E3A7A] hover:bg-[#FAF3F6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {result ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EBF4EE] border border-[#C8DFCF] text-[#2E5741] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-serif-arabic text-xl font-bold text-[#2B1626]">
                  تم استلام رسالتك بنجاح!
                </h4>
                <p className="text-xs sm:text-sm text-[#5C3D55] mt-1.5 leading-relaxed">
                  {result.emailSent
                    ? "تم إرسال رسالتك إلى فريق الدعم (support@fatimahijazi.com)، وسيتم الرد على بريدك الإلكتروني الشخصي قريباً بإذن الله."
                    : "تم حفظ رسالتك في نظام المنصة بنجاح، ويمكنك أيضاً فتحها مباشرة عبر بريدك الإلكتروني لإرسال نسخة فورية لفريق الدعم."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                {!result.emailSent && result.mailtoUrl && (
                  <a
                    href={result.mailtoUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EBF4EE] hover:bg-[#D9EBDF] border border-[#C8DFCF] text-[#2E5741] text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>إرسال عبر برنامج البريد</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-[#8E3A7A] hover:bg-[#752D64] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="contact-category"
                  className="block text-xs font-semibold text-[#2B1626] mb-1.5"
                >
                  نوع الرسالة *
                </label>
                <select
                  id="contact-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5E1] bg-[#FAF3F6]/50 text-sm text-[#2B1626] focus:bg-white focus:outline-none focus:border-[#8E3A7A] focus:ring-2 focus:ring-[#8E3A7A]/15 transition-all"
                >
                  {CONTACT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold text-[#2B1626] mb-1.5"
                  >
                    الاسم (اختياري)
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="الاسم الكريم"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5E1] bg-[#FAF3F6]/50 text-sm text-[#2B1626] placeholder:text-[#82607A] focus:bg-white focus:outline-none focus:border-[#8E3A7A] focus:ring-2 focus:ring-[#8E3A7A]/15 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-[#2B1626] mb-1.5"
                  >
                    بريدك الإلكتروني (للرد عليك) *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    dir="ltr"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5E1] bg-[#FAF3F6]/50 text-sm text-left text-[#2B1626] placeholder:text-[#82607A] focus:bg-white focus:outline-none focus:border-[#8E3A7A] focus:ring-2 focus:ring-[#8E3A7A]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-[#2B1626] mb-1.5"
                >
                  نص الرسالة *
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل المشكلة أو الاقتراح أو الاستفسار هنا بكل وضوح..."
                  className="w-full px-3.5 py-3 rounded-2xl border border-[#EAD5E1] bg-[#FAF3F6]/50 text-sm text-[#2B1626] placeholder:text-[#82607A] leading-relaxed focus:bg-white focus:outline-none focus:border-[#8E3A7A] focus:ring-2 focus:ring-[#8E3A7A]/15 transition-all resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2.5 rounded-xl border border-[#EAD5E1] bg-white text-xs sm:text-sm font-semibold text-[#5C3D55] hover:bg-[#FAF3F6] transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8E3A7A] hover:bg-[#752D64] text-white text-xs sm:text-sm font-semibold shadow-[0_6px_18px_rgba(142,58,122,0.25)] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{submitting ? "جارٍ الإرسال..." : "إرسال الرسالة"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
