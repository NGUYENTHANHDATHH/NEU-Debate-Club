"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Description as DialogDescription, Title as DialogTitle } from "@radix-ui/react-dialog";
import { LogOut, Menu, Search } from "lucide-react";
import { useUserContext } from "@/context/userContext";
import NotificationBell from "@/components/layout/NotificationBell";
import { visibleDashboardGroups, visibleQuickActions } from "@/constants/dashboard-modules";

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-[#3F3F46] data-[selected=true]:bg-rose-50 data-[selected=true]:text-[#BE123C]";

export default function DashboardHeader({ navOpen, onOpenNav }: { navOpen: boolean; onOpenNav: () => void }) {
  const router = useRouter();
  const { user, logout } = useUserContext();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const groups = visibleDashboardGroups(user?.modules);
  const actions = visibleQuickActions(user?.modules);

  useEffect(() => {
    const toggleOnShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", toggleOnShortcut);
    return () => window.removeEventListener("keydown", toggleOnShortcut);
  }, []);

  function go(path: string) {
    setPaletteOpen(false);
    router.push(path);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#F9FAFB]/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Mở menu"
          aria-controls="dashboard-sidebar"
          aria-expanded={navOpen}
          className="rounded-md p-2 text-[#52525B] hover:bg-slate-200/60 hover:text-[#18181B] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-left text-sm text-[#71717A] transition hover:border-slate-300 sm:max-w-md"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">Đi tới trang hoặc thao tác…</span>
          <kbd className="ml-auto hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-xs text-[#71717A] sm:inline">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              aria-label="Tài khoản"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-sm font-medium text-[#18181B] hover:border-slate-300 md:pr-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-[#BE123C]">
                {user?.name?.slice(0, 1) ?? "N"}
              </span>
              <span className="hidden max-w-36 truncate md:inline">{user?.name ?? "Thành viên NDC"}</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.2)]"
              >
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-[#18181B]">{user?.name ?? "Thành viên NDC"}</p>
                  {user?.email ? <p className="truncate text-xs text-[#71717A]">{user.email}</p> : null}
                </div>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                <DropdownMenu.Item
                  onSelect={logout}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[#3F3F46] outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-[#BE123C]"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Đăng xuất
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <Command.Dialog
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        label="Đi tới trang hoặc thao tác"
        overlayClassName="fixed inset-0 z-40 bg-slate-900/30"
        contentClassName="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_48px_-16px_rgba(0,0,0,0.3)]"
      >
        <DialogTitle className="sr-only">Đi tới trang hoặc thao tác</DialogTitle>
        <DialogDescription className="sr-only">
          Gõ để lọc, dùng phím mũi tên để chọn, Enter để mở, Esc để đóng.
        </DialogDescription>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-[#71717A]" aria-hidden />
          <Command.Input
            placeholder="Gõ tên trang hoặc thao tác…"
            className="h-12 w-full bg-transparent text-sm text-[#18181B] outline-none placeholder:text-[#71717A]"
          />
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-[#71717A]">
            Không tìm thấy trang nào. Thử từ khóa khác, ví dụ “tài chính”.
          </Command.Empty>
          {actions.length > 0 ? (
            <Command.Group heading="Thao tác nhanh" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[#71717A]">
              {actions.map((item) => (
                <Command.Item key={item.path} value={`thao tác ${item.name}`} onSelect={() => go(item.path)} className={itemClass}>
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.name}
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}
          {groups.map((group) => (
            <Command.Group key={group.title} heading={group.title} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[#71717A]">
              {group.items.map((item) => (
                <Command.Item key={item.path} value={`${group.title} ${item.name}`} onSelect={() => go(item.path)} className={itemClass}>
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.name}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </header>
  );
}
