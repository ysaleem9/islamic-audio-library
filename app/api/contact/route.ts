import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { NextResponse } from "next/server";

const SUPPORT_EMAIL = "support@fatimahijazi.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = String(body.category || "استفسار عام").trim();
    const senderName = String(body.senderName || "").trim();
    const senderEmail = String(body.senderEmail || "").trim();
    const message = String(body.message || "").trim();

    if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return NextResponse.json(
        { error: "يرجى إدخال بريد إلكتروني صحيح" },
        { status: 400 }
      );
    }
    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "يرجى كتابة نص الرسالة بشكل واضح" },
        { status: 400 }
      );
    }

    const record = {
      id: `msg-${crypto.randomBytes(5).toString("hex")}`,
      category,
      senderName,
      senderEmail,
      message,
      createdAt: new Date().toISOString(),
    };

    // Persist locally in data/contact_messages.json so no message is ever lost
    try {
      const filePath = path.join(process.cwd(), "data", "contact_messages.json");
      let existing: unknown[] = [];
      try {
        existing = JSON.parse(await fs.readFile(filePath, "utf8"));
      } catch {
        existing = [];
      }
      if (!Array.isArray(existing)) existing = [];
      existing.unshift(record);
      await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf8");
    } catch {
      // Ignore local file write errors in read-only environments
    }

    // Forward via Resend API if RESEND_API_KEY is configured (with Reply-To = senderEmail)
    let emailSent = false;
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const fromAddress =
        process.env.CONTACT_FROM_EMAIL || "منصة أنزله بعلمه <noreply@fatimahijazi.com>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [SUPPORT_EMAIL],
          reply_to: senderEmail,
          subject: `[${category}] رسالة جديدة من ${senderName || senderEmail}`,
          text: [
            `نوع الرسالة: ${category}`,
            `الاسم: ${senderName || "غير محدد"}`,
            `البريد الإلكتروني للمرسل: ${senderEmail}`,
            "",
            "نص الرسالة:",
            message,
            "",
            "— يمكنك الرد مباشرة على هذه الرسالة ليصل ردك إلى بريد المرسل الشخصي.",
          ].join("\n"),
        }),
      });
      emailSent = res.ok;
    }

    return NextResponse.json({ ok: true, id: record.id, emailSent }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذر إرسال الرسالة" },
      { status: 500 }
    );
  }
}
