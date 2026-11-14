const DASHBOARD = "/dashboard";

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
