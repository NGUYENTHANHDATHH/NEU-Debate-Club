"use client";
import React, { useState } from "react";
import { Moon, Sun, User, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import clubLogo from "@/../public/logo.png";
import { useTheme } from "@/provider/ThemeProvider";

export const Header = () => {
  const { theme, setTheme } = useTheme();
  // State mock cho việc đăng nhập vì không có backend
  const [user, setUser] = useState<{ name: string } | null>(null);

  const handleLogin = () => {
    // Giả lập luồng đăng nhập Google thành công
    setUser({ name: "Khách" });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-gray-200 dark:border-[#222] bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src={clubLogo}
            alt="Logo"
            width={40}
            height={40}
            priority
            className="w-10 h-10 object-contain dark:drop-shadow-[0_0_8px_rgba(138,21,27,0.5)] group-hover:scale-110 transition-transform duration-300"
          />
          <span className="font-bold font-montserrat text-xl tracking-widest text-black dark:text-white">
            NEU DEBATE CLUB
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-montserrat text-sm font-semibold">
          <Link
            href="/projects"
            className="text-gray-600 dark:text-gray-300 hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
          >
            Dự Án
          </Link>

          <Link
            href="/achievements"
            className="text-gray-600 dark:text-gray-300 hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
          >
            Thành Tựu
          </Link>
          <div className="relative group py-6">
            <button className="text-gray-600 dark:text-gray-300 group-hover:text-[#8A151B] dark:group-hover:text-[#8A151B] transition-colors flex items-center gap-1">
              Cơ Cấu Tổ Chức
              <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </button>

            <div className="absolute top-full left-0 mt-0 w-48 bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#222] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-2 z-60 overflow-hidden">
              <Link
                href="/departments/truyen-thong"
                className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
              >
                Truyền Thông
              </Link>
              <Link
                href="/departments/doi-ngoai"
                className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
              >
                Đối Ngoại
              </Link>
              <Link
                href="/departments/su-kien"
                className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
              >
                Sự Kiện
              </Link>
              <Link
                href="/departments/chuyen-mon"
                className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
              >
                Chuyên Môn
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-3 text-sm font-montserrat font-medium text-black dark:text-white cursor-pointer group"
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <span className="hidden sm:inline">
                  Xin chào, {user.name} 👋
                </span>
                <div className="w-8 h-8 rounded-full bg-[#8A151B] text-white flex items-center justify-center font-bold">
                  {user.name.charAt(0)}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full font-montserrat text-sm font-bold hover:bg-[#8A151B] dark:hover:bg-[#8A151B] hover:text-white transition-all shadow-md"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
