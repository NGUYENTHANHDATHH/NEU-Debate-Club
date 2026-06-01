"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export const LanguageDropdown = ({
  language,
  setLanguage,
}: {
  language: string;
  setLanguage: (lang: "vi" | "en") => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const toggle = () => setOpen((v) => !v);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-haspopup
        aria-expanded={open}
        className="flex items-center justify-center gap-1 w-14 h-8 rounded-full border border-gray-300 dark:border-[#444] text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
        type="button"
      >
        {language.toUpperCase()}
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute top-full right-0 mt-2 w-36 z-60 transition-all duration-150 ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <div className="bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#222] rounded-xl shadow-xl flex flex-col py-1 overflow-hidden">
          <button
            onClick={() => {
              setLanguage("vi");
              setOpen(false);
            }}
            className={`px-4 py-2 text-sm text-left transition-colors ${language === "vi" ? "text-[#8A151B] bg-gray-50 dark:bg-[#111] font-bold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-[#8A151B] dark:hover:text-[#8A151B]"}`}
            type="button"
          >
            Tiếng Việt
          </button>
          <button
            onClick={() => {
              setLanguage("en");
              setOpen(false);
            }}
            className={`px-4 py-2 text-sm text-left transition-colors ${language === "en" ? "text-[#8A151B] bg-gray-50 dark:bg-[#111] font-bold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-[#8A151B] dark:hover:text-[#8A151B]"}`}
            type="button"
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageDropdown;
