"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Tổng quan", path: "/dashboard" },
    { name: "Quản lý thành viên", path: "/members" },
    { name: "Quản lý Task", path: "/tasks" },
    { name: "Nhiệm vụ của tôi", path: "/my-tasks" },
    { name: "Thông báo", path: "/announcements" },
    { name: "Sự kiện", path: "/events" },
    { name: "Content Calendar", path: "/calendar" },
    { name: "Báo cáo Truyền Thông", path: "/media" },
    { name: "Quản lý Landing Page", path: "/cms" },
    { name: "Đối tác & Nhà tài trợ", path: "/partners" },
  ];

  // Header Title mapping
  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/members": "Quản lý thành viên",
    "/tasks": "Quản lý Task",
    "/my-tasks": "Nhiệm vụ của tôi",
    "/announcements": "Thông báo",
    "/cms": "Quản lý Landing Page",
    "/calendar": "Content Calendar",
    "/media": "Báo cáo Truyền Thông",
    "/events": "Quản lý Sự Kiện",
    "/partners": "Đối tác & Nhà tài trợ",
    "/design-system": "Design System",
  };

  const headerTitle = titleMap[pathname] || "Tổng quan";

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans mx-auto min-w-5xl">
      {/* Sidebar - Master Component */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Logo area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <span className="font-bold text-lg tracking-tight">
            NEU Debate Club
          </span>
        </div>

        {/* Navigation - Auto Layout */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Hệ thống
          </div>
          <Link
            href="/design-system"
            className={`block px-3 py-2 rounded-md transition-colors text-sm font-medium ${
              pathname === "/design-system"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Design System
          </Link>
        </div>

        {/* User profile / Bottom area */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                Minh Anh
              </p>
              <p className="text-xs text-slate-500 truncate">Chủ nhiệm (BCN)</p>
            </div>
            <Link
              href="/login"
              className="p-2 text-slate-400 hover:text-red-600 text-sm font-medium"
            >
              Đăng xuất
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Master Component */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">{headerTitle}</h1>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <button className="hover:text-slate-900">Tìm kiếm</button>
            <button className="hover:text-slate-900 relative">
              Thông báo
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="hover:text-slate-900">Cài đặt</button>
          </div>
        </header>

        {/* Page Content - Auto Layout Scrollable */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
