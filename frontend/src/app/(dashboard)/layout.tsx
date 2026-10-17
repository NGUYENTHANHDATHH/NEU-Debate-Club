"use client";

import SideBar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-[#F9FAFB] text-[#18181B] font-sans mx-auto min-w-5xl">
      <SideBar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
