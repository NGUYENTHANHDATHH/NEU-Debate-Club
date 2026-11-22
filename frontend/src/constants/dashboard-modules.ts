import {
  Bell,
  Briefcase,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  HeartPulse,
  History,
  LayoutDashboard,
  Library,
  Link2,
  ListTodo,
  Mail,
  Megaphone,
  Network,
  PanelsTopLeft,
  QrCode,
  ScrollText,
  ShieldCheck,
  Shuffle,
  Timer,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const ADMIN_MODULE_KEYS = [
  "TASK_ASSIGNMENT",
  "NOTIFICATION_MANAGEMENT",
  "DEPARTMENT_OPERATIONS",
  "ANALYTICS",
  "PUBLICATIONS",
  "ASSET_LIBRARY",
  "LANDING_CMS",
  "FINANCE",
  "EVENT_MANAGEMENT",
  "MEMBERSHIP",
  "TENURE",
  "CROSS_DEPARTMENT_TASKS",
  "ACTIVITY_LOG",
  "HEALTH_DASHBOARD",
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULE_KEYS)[number];

/** Các ban có thể được tick chức năng ở trang Phân quyền (mọi ban trừ BCN). Ma trận lưu ở backend. */
export const LEAD_DEPARTMENTS = ["TRUYEN_THONG", "DOI_NGOAI", "NOI_DUNG", "SU_KIEN", "KY_THUAT", "NHAN_SU"] as const;

type DashboardNavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  module?: AdminModuleKey;
};

// Nhóm theo việc cần làm, không theo vai trò; mục không có quyền sẽ bị ẩn.
export const DASHBOARD_NAV_GROUPS: { title: string; items: DashboardNavItem[] }[] = [
  {
    title: "Tổng quan",
    items: [
      { name: "Tổng quan", path: ROUTES.dashboard, icon: LayoutDashboard },
      { name: "Health dashboard", path: ROUTES.healthDashboard, icon: HeartPulse, module: "HEALTH_DASHBOARD" },
      { name: "Biểu đồ", path: ROUTES.charts, icon: ChartColumn, module: "ANALYTICS" },
    ],
  },
  {
    title: "Công việc",
    items: [
      { name: "Todo-list", path: ROUTES.todoList, icon: ListTodo },
      { name: "Giao task", path: ROUTES.assignTask, icon: ClipboardList, module: "TASK_ASSIGNMENT" },
      { name: "Giao task mọi ban", path: ROUTES.assignAllTasks, icon: Network, module: "CROSS_DEPARTMENT_TASKS" },
      { name: "Nghiệp vụ ban", path: ROUTES.departmentOperations, icon: Briefcase, module: "DEPARTMENT_OPERATIONS" },
    ],
  },
  {
    title: "Thông báo & truyền thông",
    items: [
      { name: "Đọc thông báo", path: ROUTES.readNotification, icon: Bell },
      { name: "Tạo thông báo", path: ROUTES.createNotification, icon: Megaphone, module: "NOTIFICATION_MANAGEMENT" },
      { name: "Link ấn phẩm", path: ROUTES.publications, icon: Link2, module: "PUBLICATIONS" },
      { name: "Thư viện", path: ROUTES.library, icon: Library, module: "ASSET_LIBRARY" },
      { name: "CMS", path: ROUTES.cms, icon: PanelsTopLeft, module: "LANDING_CMS" },
    ],
  },
  {
    // Không gắn module: mọi thành viên đều dùng được.
    title: "Công cụ",
    items: [
      { name: "Gửi mail hàng loạt", path: ROUTES.toolMail, icon: Mail },
      { name: "Đồng hồ tranh biện", path: ROUTES.toolTimer, icon: Timer },
      { name: "Bốc thăm & chia đội", path: ROUTES.toolDraw, icon: Shuffle },
      { name: "Quét QR check-in", path: ROUTES.toolCheckin, icon: QrCode },
      { name: "Thu chi của tôi", path: ROUTES.toolFinance, icon: Wallet },
    ],
  },
  {
    title: "Tài chính & sự kiện",
    items: [
      { name: "Tài chính", path: ROUTES.finance, icon: Wallet, module: "FINANCE" },
      { name: "Quản lý sự kiện", path: ROUTES.events, icon: CalendarDays, module: "EVENT_MANAGEMENT" },
    ],
  },
  {
    title: "Thành viên & hệ thống",
    items: [
      { name: "Thành viên", path: ROUTES.members, icon: Users, module: "MEMBERSHIP" },
      { name: "Nhiệm kỳ", path: ROUTES.tenure, icon: History, module: "TENURE" },
      { name: "Phân quyền", path: ROUTES.roles, icon: ShieldCheck, module: "MEMBERSHIP" },
      { name: "Activity log", path: ROUTES.activityLog, icon: ScrollText, module: "ACTIVITY_LOG" },
    ],
  },
];

/** Thao tác thường dùng: hiện ở trang Tổng quan và bảng lệnh Ctrl K. `?new=1` mở sẵn form. */
export const DASHBOARD_QUICK_ACTIONS: DashboardNavItem[] = [
  { name: "Tạo thông báo", path: ROUTES.createNotification, icon: Megaphone, module: "NOTIFICATION_MANAGEMENT" },
  { name: "Giao task", path: ROUTES.assignTask, icon: ClipboardList, module: "TASK_ASSIGNMENT" },
  { name: "Thêm giao dịch", path: `${ROUTES.finance}?new=1`, icon: Wallet, module: "FINANCE" },
  { name: "Thêm ấn phẩm", path: `${ROUTES.publications}?new=1`, icon: Link2, module: "PUBLICATIONS" },
];

export function visibleQuickActions(modules: readonly string[] = []) {
  return DASHBOARD_QUICK_ACTIONS.filter((item) => item.module && modules.includes(item.module));
}

/** Mục sidebar đang mở: khớp chính xác, hoặc là trang con (trừ "Tổng quan" vốn là tiền tố của mọi trang). */
export function isActiveNavPath(pathname: string, itemPath: string) {
  return pathname === itemPath || (itemPath !== ROUTES.dashboard && pathname.startsWith(`${itemPath}/`));
}

const allNavItems = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items);
const personalPaths = new Set([...allNavItems.filter((item) => !item.module).map((item) => item.path), ROUTES.tasks]);
const moduleByPath = new Map(
  allNavItems
    .filter((item): item is DashboardNavItem & { module: AdminModuleKey } => Boolean(item.module))
    .map((item) => [item.path, item.module]),
);

export function visibleDashboardGroups(modules: readonly string[] = []) {
  return DASHBOARD_NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.module || modules.includes(item.module)),
    }))
    .filter((group) => group.items.length > 0);
}

export function canAccessDashboardPath(pathname: string, modules: readonly string[] = []) {
  if (pathname === ROUTES.dashboard || personalPaths.has(pathname)) return true;
  const moduleKey = moduleByPath.get(pathname);
  return moduleKey ? modules.includes(moduleKey) : false;
}
