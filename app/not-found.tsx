import React from "react";
import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#faf8f4]">
      <div className="max-w-md w-full rounded-3xl border border-[#e6dfd1] bg-white p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#eef5f1] text-[#14533c] flex items-center justify-center mx-auto mb-4">
          <Headphones className="w-7 h-7" />
        </div>
        <h1 className="font-serif-arabic text-3xl font-bold text-[#14533c]">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-[#5a6660] leading-relaxed">
          عذراً، لم نتمكن من العثور على الدرس أو السلسلة التي تبحث عنها.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14533c] hover:bg-[#0e3d2b] text-white text-sm font-medium transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى المكتبة الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
