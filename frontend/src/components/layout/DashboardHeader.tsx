"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Sparkles } from "lucide-react";
import { useUserContext } from "@/context/userContext";

const labels: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/dashboard/tasks": "Task hub",
  "/dashboard/tasks/todo-list": "Todo-list",
  "/dashboard/tasks/update": "Cập nhật task",
  "/dashboard/tasks/assign": "Giao task",
  "/dashboard/tasks/assign-all": "Giao task mọi ban",
  "/dashboard/notifications/read": "Đọc thông báo",
  "/dashboard/notifications/create": "Tạo thông báo",
  "/dashboard/library": "Thư viện",
  "/dashboard/department-operations": "Nghiệp vụ ban",
  "/dashboard/charts": "Biểu đồ",
  "/dashboard/publications": "Link ấn phẩm",
  "/dashboard/members": "Quản lý thành viên",
  "/dashboard/roles": "Phân quyền",
  "/dashboard/finance": "Tài chính",
  "/dashboard/cms": "CMS",
  "/dashboard/health-dashboard": "Health Dashboard",
  "/dashboard/activity-log": "Activity Log",
  "/dashboard/tenure": "Nhiệm kỳ",
};

export default function DashboardHeader() {
  const pathname = usePathname();
  const { user, logout } = useUserContext();
  const label = labels[pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#F9FAFB]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#71717A]">
            NEU Debate Club
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="truncate text-base font-semibold tracking-tight text-[#18181B]">
              {label}
            </h1>
            <Sparkles className="h-4 w-4 text-[#E11D48]" />
          </div>
        </div>

        <label className="hidden w-full max-w-md items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-[#71717A] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.15)] md:flex">
          <Search className="h-4 w-4 shrink-0" />
          <span className="sr-only">Tìm kiếm toàn cục</span>
          <input
            className="w-full bg-transparent outline-none placeholder:text-[#A1A1AA]"
            placeholder="Tìm kiếm task, thông báo, thành viên..."
          />
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-[#71717A]">
            Ctrl K
          </span>
        </label>

        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[#18181B]">
            <Bell className="h-4 w-4" />
          </button>
          <button
            onClick={logout}
            className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#18181B] md:flex"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-[#E11D48]">
              {user?.name?.slice(0, 1) ?? "N"}
            </span>
            <span className="max-w-36 truncate">{user?.name ?? "Member NDC"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
