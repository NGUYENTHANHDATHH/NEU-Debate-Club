import { ROUTES } from "@/constants/routes";
import type { AppNotification, ManualNotificationType, NotificationType } from "@/lib/api";

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { label: string; dot: string; badge: string }
> = {
  TASK_ASSIGNED: {
    label: "Giao nhiệm vụ",
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700",
  },
  GENERAL: {
    label: "Thông báo chung",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700",
  },
  TASK_UPDATE: {
    label: "Cập nhật task",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
  },
  REWARD: {
    label: "Khen thưởng",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
  },
  URGENT: {
    label: "Khẩn cấp",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-[#E11D48]",
  },
};

export const MANUAL_NOTIFICATION_TYPES: ManualNotificationType[] = [
  "GENERAL",
  "TASK_UPDATE",
  "REWARD",
  "URGENT",
];

export const DEPARTMENT_NAMES: Record<string, string> = {
  BCN: "Ban Chủ nhiệm",
  TRUYEN_THONG: "Ban Truyền thông",
  NOI_DUNG: "Ban Nội dung",
  SU_KIEN: "Ban Sự kiện",
  DOI_NGOAI: "Ban Đối ngoại",
  KY_THUAT: "Ban Kỹ thuật",
  NHAN_SU: "Ban Nhân sự",
};

/** Thông báo giao task mở thẳng task trong todo-list; các loại khác mở trang đọc thông báo. */
export function notificationHref(notification: AppNotification) {
  if (notification.type === "TASK_ASSIGNED" && notification.entityId) {
    return `${ROUTES.todoList}?task=${encodeURIComponent(notification.entityId)}`;
  }
  return `${ROUTES.readNotification}?id=${encodeURIComponent(notification.id)}`;
}

export function formatRelativeTime(value: string, now = Date.now()) {
  const date = new Date(value);
  const minutes = Math.floor((now - date.getTime()) / 60_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
