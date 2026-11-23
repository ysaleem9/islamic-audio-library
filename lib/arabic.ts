/**
 * مكتبة معالجة وبحث النصوص باللغة العربية
 * معالجة التشكيل، توحيد الهمزات والتاء المربوطة والألف المقصورة والأرقام العربية والغربية
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFC")
    // إزالة علامات الاتجاه الخفية والتشكيل والتنوين والتطويل (ـ)
    .replace(/[\u064B-\u065F\u0670\u0640\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    // توحيد الأرقام العربية الهندية والفارسية إلى أرقام قياسية لنجاح البحث بكلتا الصيغتين
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    // توحيد جميع أشكال الألف (أ، إ، آ، ٱ) إلى (ا)
    .replace(/[إأآٱ]/g, "ا")
    // توحيد الألف المقصورة (ى) والياء (ي)
    .replace(/[ى]/g, "ي")
    // توحيد التاء المربوطة (ة) والهاء (ه)
    .replace(/[ة]/g, "ه")
    // توحيد الهمزات على الواو والياء لتسهيل البحث
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    // تحويل الأحرف اللاتينية إلى أحرف صغيرة وتوحيد المسافات
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * فحص احتواء النص مع مراعاة خصائص البحث العربي وتعدد الكلمات (كل كلمة يجب أن تتوفر)
 */
export function arabicIncludes(source: string, query: string): boolean {
  const normQuery = normalizeArabic(query);
  if (!normQuery) return true;
  if (!source) return false;
  const normSource = normalizeArabic(source);
  if (normSource.includes(normQuery)) return true;

  const tokens = normQuery.split(" ").filter(Boolean);
  if (tokens.length <= 1) return false;
  return tokens.every((token) => normSource.includes(token));
}

/**
 * فحص تطابق جميع كلمات البحث عبر عدة حقول مجتمعة (مثل عنوان الدرس + اسم السورة + التصنيف)
 */
export function arabicMatchesFields(fields: Array<string | null | undefined>, query: string): boolean {
  const normQuery = normalizeArabic(query);
  if (!normQuery) return true;
  const combined = normalizeArabic(fields.filter(Boolean).join(" "));
  if (!combined) return false;
  if (combined.includes(normQuery)) return true;

  const tokens = normQuery.split(" ").filter(Boolean);
  return tokens.every((token) => combined.includes(token));
}
