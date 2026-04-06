import React from "react";
import { Outlet } from "react-router";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotificationWidget } from "./NotificationWidget";

export const Layout = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans overflow-x-hidden transition-colors duration-500 relative">
        <Header />
        <main className="pt-20">
          {" "}
          {/* Add padding top to account for fixed header */}
          <Outlet />
        </main>
        <Footer />
        <NotificationWidget />
      </div>
    </ThemeProvider>
  );
};
