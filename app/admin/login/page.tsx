"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Headphones, Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "بيانات الدخول غير صحيحة");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 islamic-pattern-dark">
      <div className="w-full max-w-md rounded-3xl border border-[#EBC6DD] bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-bl from-[#6F2B5F] via-[#8E3A7A] to-[#B8559B] text-white p-7 text-center relative">
          <div className="absolute inset-0 islamic-pattern pointer-events-none" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/15 mx-auto flex items-center justify-center mb-3">
              <Headphones className="w-6 h-6 text-[#FAF3F6]" />
            </div>
            <h1 className="font-serif-arabic text-2xl font-bold">لوحة تحكم المكتبة الصوتية</h1>
            <p className="text-xs text-[#EBC6DD] mt-1">تسجيل الدخول لإدارة الدروس والسلاسل</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#2D1626] mb-1.5">
              اسم المستخدم
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl border border-[#EBC6DD] focus:outline-none focus:border-[#8E3A7A] text-left"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D1626] mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl border border-[#EBC6DD] focus:outline-none focus:border-[#8E3A7A] text-left"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#8E3A7A] hover:bg-[#6F2B5F] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>دخول إلى لوحة التحكم</span>
          </button>

          <div className="text-center pt-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[#8E3A7A] hover:underline"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى الموقع</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
