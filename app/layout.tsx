import type { Metadata } from "next";
import "./globals.css";
import { AudioPlayerProvider } from "@/components/AudioPlayerContext";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";

export const metadata: Metadata = {
  title: "الأستاذة فاطمة حجازي — «أنزله بعلمه» | المنصة العلمية والدعوية",
  description:
    "المنصة العلمية والدعوية للأستاذة فاطمة حجازي — شروحات تفسير القرآن الكريم، العقيدة، الفقه، الرقائق والتزكية، والتربية الإيمانية للاستماع المباشر والتحميل المجاني.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <AudioPlayerProvider>
          <div className="flex-1 flex flex-col">{children}</div>
          <AudioPlayerBar />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
