import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotificationWidget } from "@/components/layout/NotificationWidget";
import ThemeProvider from "../../provider/ThemeProvider";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans overflow-x-hidden transition-colors duration-500 relative">
        <Header />
        <main className="pt-20">{children}</main>
        <Footer />
        <NotificationWidget />
      </div>
    </ThemeProvider>
  );
}
