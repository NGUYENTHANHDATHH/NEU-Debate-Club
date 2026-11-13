"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useUserContext } from "@/context/userContext";
import { isActiveNavPath, visibleDashboardGroups } from "@/constants/dashboard-modules";

/** Cố định từ lg trở lên; dưới lg là ngăn trượt do nút ☰ trên header mở. */
export default function SideBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useUserContext();
  const navGroups = visibleDashboardGroups(user?.modules);

  return (
    <>
      {open ? (
        <div aria-hidden className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={onClose} />
      ) : null}
      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200/70 bg-[#F9FAFB] transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-[100dvh] lg:translate-x-0 ${
          open ? "translate-x-0 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)]" : "max-lg:invisible -translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 px-5">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 rounded-md">
            <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md" />
            <span className="text-base font-bold tracking-tight text-[#18181B]">NEU Debate Club</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-md p-1.5 text-[#71717A] hover:bg-slate-200/60 hover:text-[#18181B] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Điều hướng dashboard" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-xs font-semibold text-[#71717A]">{group.title}</p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActiveNavPath(pathname, item.path);
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-rose-50 text-[#BE123C]"
                            : "text-[#52525B] hover:bg-slate-200/60 hover:text-[#18181B]"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200/70 px-5 py-3">
          <p className="truncate text-sm font-semibold text-slate-800" title={user?.name}>
            {user?.name || "Thành viên NDC"}
          </p>
          {user?.email ? (
            <p className="truncate text-xs text-slate-500" title={user.email}>
              {user.email}
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
