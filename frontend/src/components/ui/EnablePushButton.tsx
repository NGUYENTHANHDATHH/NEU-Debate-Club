"use client";
import React, { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { fetchPushPublicKey, savePushSubscription } from "@/lib/api";
import { useLanguage } from "@/provider/LanguageProvider";
import { useUserContext } from "@/context/userContext";

type Ready = { registration: ServiceWorkerRegistration; key: string };

/**
 * Nút bật thông báo đẩy của máy; ẩn khi đã bật, bị chặn, hoặc trình duyệt/máy chủ không hỗ trợ.
 * Thiết bị đã bật thì mỗi lần mở app/đăng nhập/đăng xuất được gắn lại với người đang dùng.
 */
export function EnablePushButton({
  className,
  labelClassName,
}: {
  className: string;
  labelClassName?: string;
}) {
  const { t } = useLanguage();
  const { user } = useUserContext();
  const [ready, setReady] = useState<Ready | null>(null);
  const userId = user?.id;

  useEffect(() => {
    // iPhone chỉ có PushManager khi web đã được thêm ra màn hình chính.
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let cancelled = false;
    (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) return savePushSubscription(subscription);
      if (Notification.permission === "denied") return;
      const key = await fetchPushPublicKey();
      if (key && !cancelled) setReady({ registration, key });
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [userId]); // userId: đăng nhập/đăng xuất thì gắn lại thiết bị

  if (!ready) return null;

  const enable = async () => {
    try {
      // subscribe() phải là lệnh await đầu tiên: Safari chỉ hỏi quyền khi còn trong cử chỉ bấm của người dùng.
      const subscription = await ready.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: Uint8Array.from(
          atob(ready.key.replace(/-/g, "+").replace(/_/g, "/")),
          (char) => char.charCodeAt(0),
        ),
      });
      await savePushSubscription(subscription);
      setReady(null);
      toast.success(t("push.enabled"));
    } catch (error) {
      console.error(error);
      if (Notification.permission === "denied") setReady(null);
      else toast.error(t("push.error"));
    }
  };

  return (
    <button type="button" onClick={enable} className={className} title={t("push.enable")}>
      <BellRing className="w-4 h-4" />
      <span className={labelClassName}>{t("push.enable")}</span>
    </button>
  );
}
