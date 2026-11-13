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

/** Các ban có Trưởng ban (mọi ban trừ BCN). */
export const LEAD_DEPARTMENTS = ["TRUYEN_THONG", "DOI_NGOAI", "NOI_DUNG", "SU_KIEN", "KY_THUAT", "NHAN_SU"] as const;

/**
 * Mirrors backend common/enums/AdminModule.java: ban nào có Trưởng ban được quản lý module.
 * BCN luôn quản lý mọi module; thành viên thường không có module nào. Sửa cả hai nơi cùng lúc.
 */
export const MODULE_DEPARTMENTS: Record<AdminModuleKey, readonly string[]> = {
  TASK_ASSIGNMENT: LEAD_DEPARTMENTS,
  NOTIFICATION_MANAGEMENT: LEAD_DEPARTMENTS,
  DEPARTMENT_OPERATIONS: LEAD_DEPARTMENTS,
  ANALYTICS: LEAD_DEPARTMENTS,
  PUBLICATIONS: ["TRUYEN_THONG", "NOI_DUNG"],
  ASSET_LIBRARY: ["KY_THUAT"],
  LANDING_CMS: ["TRUYEN_THONG"],
  FINANCE: ["DOI_NGOAI"],
  EVENT_MANAGEMENT: ["SU_KIEN"],
  MEMBERSHIP: ["NHAN_SU"],
  TENURE: ["NHAN_SU"],
  CROSS_DEPARTMENT_TASKS: [],
  ACTIVITY_LOG: [],
  HEALTH_DASHBOARD: [],
};

type DashboardNavItem = {
  name: string;
  path: string;
  module?: AdminModuleKey;
};

export const DASHBOARD_NAV_GROUPS: { title: string; items: DashboardNavItem[] }[] = [
  {
    title: "Cá nhân",
    items: [
      { name: "Todo-list", path: ROUTES.todoList },
      { name: "Đọc thông báo", path: ROUTES.readNotification },
    ],
  },
  {
    title: "Nghiệp vụ ban",
    items: [
      { name: "Giao task", path: ROUTES.assignTask, module: "TASK_ASSIGNMENT" },
      { name: "Tạo thông báo", path: ROUTES.createNotification, module: "NOTIFICATION_MANAGEMENT" },
      { name: "Nghiệp vụ ban", path: ROUTES.departmentOperations, module: "DEPARTMENT_OPERATIONS" },
      { name: "Biểu đồ", path: ROUTES.charts, module: "ANALYTICS" },
      { name: "Link ấn phẩm", path: ROUTES.publications, module: "PUBLICATIONS" },
      { name: "Thư viện", path: ROUTES.library, module: "ASSET_LIBRARY" },
      { name: "CMS", path: ROUTES.cms, module: "LANDING_CMS" },
      { name: "Tài chính", path: ROUTES.finance, module: "FINANCE" },
      { name: "Quản lý sự kiện", path: ROUTES.events, module: "EVENT_MANAGEMENT" },
      { name: "Quản lý thành viên", path: ROUTES.members, module: "MEMBERSHIP" },
      { name: "Nhiệm kỳ", path: ROUTES.tenure, module: "TENURE" },
    ],
  },
  {
    title: "Toàn câu lạc bộ",
    items: [
      { name: "Phân quyền", path: ROUTES.roles, module: "MEMBERSHIP" },
      { name: "Giao task mọi ban", path: ROUTES.assignAllTasks, module: "CROSS_DEPARTMENT_TASKS" },
      { name: "Activity Log", path: ROUTES.activityLog, module: "ACTIVITY_LOG" },
      { name: "Health Dashboard", path: ROUTES.healthDashboard, module: "HEALTH_DASHBOARD" },
    ],
  },
];

const personalPaths = new Set([
  ...DASHBOARD_NAV_GROUPS[0].items.map((item) => item.path),
  ROUTES.tasks,
]);
const moduleByPath = new Map(
  DASHBOARD_NAV_GROUPS.flatMap((group) => group.items)
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
