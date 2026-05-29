"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
export default function SideBar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Tổng quan", path: ROUTES.dashboard },
    { name: "Quản lý thành viên", path: ROUTES.members },
    { name: "Quản lý Task", path: ROUTES.tasks },
    { name: "Nhiệm vụ của tôi", path: ROUTES.myTasks },
    { name: "Thông báo", path: ROUTES.announcements },
    { name: "Sự kiện", path: ROUTES.events },
    { name: "Content Calendar", path: ROUTES.calendar },
    { name: "Báo cáo Truyền Thông", path: ROUTES.media },
    { name: "Quản lý Landing Page", path: ROUTES.cms },
    { name: "Đối tác & Nhà tài trợ", path: ROUTES.partners },
  ];

  return (
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
  );
}
