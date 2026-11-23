const DASHBOARD = "/dashboard";

// Domain công khai, dùng cho canonical, sitemap, Open Graph.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "NEU Debate Club";
export const SITE_DESCRIPTION =
  "NEU Debate Club (NDC) là câu lạc bộ tranh biện của Đại học Kinh tế Quốc dân (NEU), nơi sinh viên rèn luyện tư duy phản biện, kỹ năng lập luận và thuyết trình. CLB tổ chức các buổi sinh hoạt, giải đấu debate và dự án học thuật.";
export const SOCIAL_LINKS = [
  "https://www.facebook.com/NEUDebateClub",
  "https://www.tiktok.com/@neudebate.ndc",
];
// Slug phòng ban → key trong translations.json (departments.detail.*).
export const DEPARTMENT_KEYS = {
  "truyen-thong": "media",
  "doi-ngoai": "external",
  "su-kien": "event",
  "chuyen-mon": "academics",
} as const;

export const ROUTES = {
  // Public routes
  home: "/",
  projects: "/projects",
  achievements: "/achievements",
  login: "/login",

  // Dashboard routes
  dashboard: DASHBOARD,

  // -- Thành viên --
  todoList: `${DASHBOARD}/tasks/todo-list`,
  updateTask: `${DASHBOARD}/tasks/todo-list`,
  readNotification: `${DASHBOARD}/notifications/read`,
  library: `${DASHBOARD}/library`,
  toolMail: `${DASHBOARD}/tools/mail`,
  toolTimer: `${DASHBOARD}/tools/timer`,
  toolDraw: `${DASHBOARD}/tools/draw`,
  toolCheckin: `${DASHBOARD}/tools/checkin`,
  toolFinance: `${DASHBOARD}/tools/finance`,

  // -- Trưởng ban --
  assignTask: `${DASHBOARD}/tasks/assign`,
  createNotification: `${DASHBOARD}/notifications/create`,
  departmentOperations: `${DASHBOARD}/department-operations`,
  charts: `${DASHBOARD}/charts`,
  publications: `${DASHBOARD}/publications`,

  // -- BCN --
  members: `${DASHBOARD}/members`,
  roles: `${DASHBOARD}/roles`,
  finance: `${DASHBOARD}/finance`,
  events: `${DASHBOARD}/events`,
  cms: `${DASHBOARD}/cms`,
  healthDashboard: `${DASHBOARD}/health-dashboard`,
  assignAllTasks: `${DASHBOARD}/tasks/assign-all`,
  activityLog: `${DASHBOARD}/activity-log`,
  tenure: `${DASHBOARD}/tenure`,

  // Base routes for dynamic path usage
  tasks: `${DASHBOARD}/tasks`,
  notifications: `${DASHBOARD}/notifications`,
} as const;

export const routePath = {
  // Dynamic routes
  projectDetail: (id: string | number) => `/projects/${id}`,
  departmentDetail: (id: string | number) => `/departments/${id}`,

  // Dashboard dynamic routes
  memberDetail: (id: string | number) => `${ROUTES.members}/${id}`,
  taskDetail: (id: string | number) => `${ROUTES.tasks}/${id}`,
  notificationDetail: (id: string | number) => `${ROUTES.notifications}/${id}`,
} as const;
