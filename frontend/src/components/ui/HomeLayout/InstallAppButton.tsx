"use client";
import React, { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/provider/LanguageProvider";

// Chỉ Chrome/Edge/Samsung Internet có sự kiện này; chưa có trong TS DOM lib.
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

export const heroPillClass =
  "inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#8A151B] text-[#8A151B] dark:text-white hover:bg-[#8A151B] hover:text-white dark:hover:text-white font-montserrat font-semibold text-sm transition-colors";

export const InstallAppButton = () => {
  const { t } = useLanguage();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(
    null,
  );
  // Đã mở từ icon ngoài màn hình chính thì ẩn nút.
  const [installed, setInstalled] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true),
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // giữ prompt lại để nút tự gọi
      setPromptEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      setPromptEvent(null); // prompt() chỉ dùng được một lần
      return;
    }
    // iOS không có API cài đặt: chỉ hướng dẫn thao tác tay. iPadOS báo UA là Macintosh.
    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    toast.info(t(isIOS ? "install.ios" : "install.other"), { duration: 8000 });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={heroPillClass}
    >
      <Smartphone className="w-4 h-4" />
      {t("install.button")}
    </button>
  );
};
