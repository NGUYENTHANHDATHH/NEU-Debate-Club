const DASHBOARD = "/dashboard";

export const ROUTES = {
  // Public routes
  home: "/",
  projects: "/projects",
  achievements: "/achievements",
  login: "/login",

  // Dashboard routes
  dashboard: DASHBOARD,
  members: `${DASHBOARD}/members`,
  tasks: `${DASHBOARD}/tasks`,
  myTasks: `${DASHBOARD}/my-tasks`,
  announcements: `${DASHBOARD}/announcements`,
  events: `${DASHBOARD}/events`,
  calendar: `${DASHBOARD}/calendar`,
  media: `${DASHBOARD}/media`,
  cms: `${DASHBOARD}/cms`,
  partners: `${DASHBOARD}/partners`,
} as const;

export const routePath = {
  // Dynamic routes
  projectDetail: (id: string | number) => `/projects/${id}`,
  departmentDetail: (id: string | number) => `/departments/${id}`,

  // Dashboard dynamic routes
  memberDetail: (id: string | number) => `${ROUTES.members}/${id}`,

  taskDetail: (id: string | number) => `${ROUTES.tasks}/${id}`,

  eventDetail: (id: string | number) => `${ROUTES.events}/${id}`,

  announcementDetail: (id: string | number) => `${ROUTES.announcements}/${id}`,
} as const;
