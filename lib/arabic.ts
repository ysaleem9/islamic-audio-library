/**
 * مكتبة معالجة وبحث النصوص باللغة العربية
 * معالجة التشكيل، توحيد الهمزات والتاء المربوطة والألف المقصورة لدقة وسهولة البحث
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    // إزالة علامات التشكيل والتنوين والتطويل (ـ)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    // توحيد جميع أشكال الألف (أ، إ، آ، ٱ) إلى (ا)
    .replace(/[إأآٱ]/g, "ا")
    // توحيد الألف المقصورة (ى) والياء (ي)
    .replace(/[ى]/g, "ي")
    // توحيد التاء المربوطة (ة) والهاء (ه) في سياق البحث
    .replace(/[ة]/g, "ه")
    // تحويل الأحرف اللاتينية إلى أحرف صغيرة إن وجدت
    .toLowerCase()
    .trim();
}

/**
 * فحص احتواء النص مع مراعاة خصائص وقواعد البحث العربي
 */
export function arabicIncludes(source: string, query: string): boolean {
  if (!query) return true;
  if (!source) return false;
  const normSource = normalizeArabic(source);
  const normQuery = normalizeArabic(query);
  return normSource.includes(normQuery);
}
