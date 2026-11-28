import type { Metadata } from "next";
import "./globals.css";
import { AudioPlayerProvider } from "@/components/AudioPlayerContext";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fatimahijazi.com"),
  title: {
    default: "الأستاذة فاطمة حجازي — «أنزله بعلمه» | الموقع الرسمي للدروس الصوتية وتفسير القرآن",
    template: "%s — الأستاذة فاطمة حجازي",
  },
  description:
    "الموقع الرسمي للأستاذة فاطمة حجازي (الداعية فاطمة حجازي) — منصة «أنزله بعلمه» للشروحات الصوتية وتفسير القرآن الكريم، في رحاب القرآن، السلاسل العلمية، والدروس الإيمانية للاستماع المباشر والتحميل المجاني.",
  keywords: [
    "فاطمة حجازي",
    "الأستاذة فاطمة حجازي",
    "الداعية فاطمة حجازي",
    "موقع الداعية فاطمة حجازي",
    "موقع الأستاذة فاطمة حجازي",
    "دروس فاطمة حجازي",
    "تفسير فاطمة حجازي",
    "أنزله بعلمه",
    "في رحاب القرآن",
    "تفسير القرآن الكريم",
    "دروس صوتية إسلامية",
    "Fatima Hijazi",
  ],
  authors: [{ name: "الأستاذة فاطمة حجازي", url: "https://www.fatimahijazi.com" }],
  creator: "الأستاذة فاطمة حجازي",
  publisher: "منصة أنزله بعلمه — الأستاذة فاطمة حجازي",
  alternates: {
    canonical: "https://www.fatimahijazi.com/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://www.fatimahijazi.com/",
    siteName: "الأستاذة فاطمة حجازي — أنزله بعلمه",
    title: "الأستاذة فاطمة حجازي — «أنزله بعلمه» | الموقع الرسمي للدروس الصوتية",
    description:
      "الموقع الرسمي للأستاذة فاطمة حجازي (الداعية فاطمة حجازي) — شروحات وتدبرات في رحاب القرآن الكريم والدروس العلمية للاستماع المباشر والتحميل المجاني.",
    images: [
      {
        url: "/images/logo-official.png",
        width: 512,
        height: 512,
        alt: "شعار منصة أنزله بعلمه — الأستاذة فاطمة حجازي",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "الأستاذة فاطمة حجازي — «أنزله بعلمه» | الموقع الرسمي",
    description:
      "شروحات تفسير القرآن الكريم والدروس العلمية للأستاذة فاطمة حجازي للاستماع المباشر والتحميل المجاني.",
    images: ["/images/logo-official.png"],
  },
};

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.fatimahijazi.com/#website",
      url: "https://www.fatimahijazi.com/",
      name: "الأستاذة فاطمة حجازي — أنزله بعلمه",
      alternateName: [
        "موقع الأستاذة فاطمة حجازي",
        "موقع الداعية فاطمة حجازي",
        "منصة أنزله بعلمه",
        "مكتبة فاطمة حجازي الصوتية",
      ],
      description:
        "الموقع الرسمي والمكتبة الصوتية للأستاذة فاطمة حجازي في تفسير القرآن الكريم والعلوم الشرعية.",
      inLanguage: "ar",
      publisher: { "@id": "https://www.fatimahijazi.com/#person" },
    },
    {
      "@type": "Person",
      "@id": "https://www.fatimahijazi.com/#person",
      name: "الأستاذة فاطمة حجازي",
      alternateName: [
        "فاطمة حجازي",
        "الداعية فاطمة حجازي",
        "الشيخة فاطمة حجازي",
        "Fatima Hijazi",
      ],
      url: "https://www.fatimahijazi.com/",
      image: "https://www.fatimahijazi.com/images/logo-official.png",
      jobTitle: "معلمة وداعية إسلامية متخصصة في تفسير القرآن الكريم والتدبر",
      description:
        "الأستاذة فاطمة حجازي — مقدّمة دروس تفسير القرآن الكريم وسلسلة في رحاب القرآن والعلوم الشرعية عبر منصة أنزله بعلمه.",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
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
