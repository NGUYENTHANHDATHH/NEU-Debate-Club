import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/userContext";
import { QueryProvider } from "@/provider/QueryProvider";
import { LanguageProvider } from "@/provider/LanguageProvider";
import { Toaster } from "sonner";
import Script from "next/script";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/constants/routes";

// "vietnamese" là bắt buộc: thiếu nó các chữ có dấu (ă, đ, ơ, ư, ệ…) rơi về font hệ thống.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – CLB Tranh biện Đại học Kinh tế Quốc dân`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "NEU Debate Club",
    "NDC",
    "câu lạc bộ tranh biện",
    "CLB tranh biện NEU",
    "Đại học Kinh tế Quốc dân",
    "debate",
    "tranh biện",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "vi_VN",
    images: [{ url: "/vision-bg.jpg", alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${montserrat.variable} antialiased`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || theme === null) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <LanguageProvider>
          <QueryProvider>
            <UserProvider>{children}</UserProvider>
          </QueryProvider>
        </LanguageProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
