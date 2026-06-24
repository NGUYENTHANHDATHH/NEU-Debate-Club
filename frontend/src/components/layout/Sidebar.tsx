"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useUserContext } from "@/context/userContext";

export default function SideBar() {
  const pathname = usePathname();
  const { user } = useUserContext();

  const navGroups = [
    {
      title: "Thành viên",
      items: [
        { name: "Todo-list", path: ROUTES.todoList },
        { name: "Cập nhật task", path: ROUTES.updateTask },
        { name: "Đọc thông báo", path: ROUTES.readNotification },
        { name: "Thư viện", path: ROUTES.library },
      ],
    },
    {
      title: "Trưởng ban",
      items: [
        { name: "Giao task", path: ROUTES.assignTask },
        { name: "Tạo thông báo", path: ROUTES.createNotification },
        { name: "Nhiệp vụ ban", path: ROUTES.departmentOperations },
        { name: "Biểu đồ", path: ROUTES.charts },
        { name: "Link ấn phẩm", path: ROUTES.publications },
      ],
    },
    {
      title: "BCN",
      items: [
        { name: "Quản lý thành viên", path: ROUTES.members },
        { name: "Phân quyền", path: ROUTES.roles },
        { name: "Tài chính", path: ROUTES.finance },
        { name: "CMS", path: ROUTES.cms },
        { name: "Health Dashboard", path: ROUTES.healthDashboard },
        { name: "Giao task mọi ban", path: ROUTES.assignAllTasks },
        { name: "Activity Log", path: ROUTES.activityLog },
        { name: "Nhiệm kỳ", path: ROUTES.tenure },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#F9FAFB] border-r border-slate-200/50 flex flex-col shrink-0">
      {/* Logo area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200/50">
        <span className="font-bold text-lg tracking-tight text-[#18181B]">
          NEU Debate Club
        </span>
      </div>

      {/* Navigation - Auto Layout */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-2 px-3 text-xs font-semibold text-[#71717A] uppercase tracking-wider">
              {group.title}
            </div>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`block px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                      isActive
                        ? "bg-rose-50 text-[#E11D48]"
                        : "text-[#71717A] hover:bg-slate-200/50 hover:text-[#18181B]"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <div className="mb-2 px-3 text-xs font-semibold text-[#71717A] uppercase tracking-wider">
            Hệ thống
          </div>
          <Link
            href="/design-system"
            className={`block px-3 py-2 rounded-md transition-colors text-sm font-medium ${
              pathname === "/design-system"
                ? "bg-rose-50 text-[#E11D48]"
                : "text-[#71717A] hover:bg-slate-200/50 hover:text-[#18181B]"
            }`}
          >
            Design System
          </Link>
        </div>
      </div>

      {/* User profile / Bottom area */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-slate-800 truncate"
              title={user?.name}
            >
              {user?.name || "Thành viên NDC"}
            </p>
            <p className="text-xs text-slate-500 truncate" title={user?.email}>
              {user?.email || "member@neudebate.local"}
            </p>
          </div>
          <Link
            href="/logout"
            className="shrink-0 p-2 text-slate-400 hover:text-red-600 transition-colors text-sm font-semibold"
          >
            Đăng xuất
          </Link>
        </div>
      </div>
    </aside>
  );
}
