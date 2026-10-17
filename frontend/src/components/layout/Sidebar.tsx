"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/context/userContext";
import { visibleDashboardGroups } from "@/constants/dashboard-modules";

export default function SideBar() {
  const pathname = usePathname();
  const { user } = useUserContext();
  const navGroups = visibleDashboardGroups(user?.modules);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/50 bg-[#F9FAFB]">
      <div className="flex h-16 items-center border-b border-slate-200/50 px-6">
        <span className="text-lg font-bold tracking-tight text-[#18181B]">
          NEU Debate Club
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
              {group.title}
            </div>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.path
                      ? "bg-rose-50 text-[#E11D48]"
                      : "text-[#71717A] hover:bg-slate-200/50 hover:text-[#18181B]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 p-4">
        <p className="truncate text-sm font-semibold text-slate-800" title={user?.name}>
          {user?.name || "Thành viên NDC"}
        </p>
        <p className="truncate text-xs text-slate-500" title={user?.email}>
          {user?.email || "member@neudebate.local"}
        </p>
      </div>
    </aside>
  );
}
