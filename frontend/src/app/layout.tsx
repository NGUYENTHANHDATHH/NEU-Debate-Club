import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/userContext";
import { QueryProvider } from "@/provider/QueryProvider";
import { LanguageProvider } from "@/provider/LanguageProvider";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEU Debate Club",
  description: "Website for the NEU Debate Club",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressContentEditableWarning={true}>
      <body className={`${inter.variable} ${montserrat.variable} antialiased`}>
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
