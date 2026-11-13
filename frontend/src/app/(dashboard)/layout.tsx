"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { DashboardAccessGuard } from "@/components/layout/DashboardAccessGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navOpen]);

  return (
    <DashboardAccessGuard>
      <div className="flex min-h-[100dvh] w-full bg-[#F9FAFB] text-[#18181B] font-sans">
        <SideBar open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader navOpen={navOpen} onOpenNav={() => setNavOpen(true)} />
          <div className="relative flex-1">{children}</div>
        </main>
      </div>
    </DashboardAccessGuard>
  );
}
