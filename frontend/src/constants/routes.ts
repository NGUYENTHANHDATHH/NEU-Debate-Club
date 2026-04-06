export const ROUTES = {
  home: "/",
  projects: "/projects",
  achievements: "/achievements",
  dashboard: "/dashboard",
  login: "/login",
} as const;

export const routePath = {
  projectDetail: (id: string | number) => `/project/${id}`,
  departmentDetail: (id: string) => `/departments/${id}`,
} as const;
