export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export async function fetchLandingSection<T>(section: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/public/landing/${section}`);
  if (!response.ok) throw new Error(`Không thể tải section ${section}.`);
  const payload = await response.json();
  return (payload.data ?? payload) as T;
}

export interface BackendUserDTO {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string | null;
  department?: string | null;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: BackendUserDTO;
}

export async function exchangeGoogleIdToken(
  idToken: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message ?? "Không thể xác thực với máy chủ.";
    throw new Error(message);
  }

  const payload = await response.json();
  return payload.data ?? payload;
}

/** Redeems the single-use code returned by the Google redirect callback. */
export async function exchangeLoginCode(code: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Không thể hoàn tất đăng nhập.");
  }
  return payload.data ?? payload;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ndc_token");
}

export async function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const token = getAuthToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export type CmsSection = {
  section: string;
  draft: Record<string, unknown> | null;
  published: Record<string, unknown> | null;
  publishedAt: string | null;
  draftAt: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export type CmsHistoryItem = {
  id: string;
  status: string;
  content: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
};

export type CmsCatalogItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | Record<string, unknown> | null;
  imageUrl: string | null;
  imageAlt: string | null;
  category: string;
  displayOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchPublicCatalog(
  type: "projects" | "achievements",
): Promise<CmsCatalogItem[]> {
  const response = await fetch(`${API_BASE_URL}/public/${type}`);
  if (!response.ok) throw new Error(`Unable to load ${type}.`);
  return response.json();
}

export type Member = {
  id: string;
  fullName: string;
  email: string;
  studentId: string | null;
  phone: string | null;
  department: string | null;
  role: string;
  active: boolean;
};

export type CreateMemberInput = {
  fullName: string;
  email: string;
  studentId: string;
  phone: string;
  department: string;
  role: string;
  active: boolean;
};

async function memberRequest<T>(path = "", init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${API_BASE_URL}/members${path}`, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = payload?.data
      ? Object.values(payload.data).join(". ")
      : null;
    throw new Error(
      validationMessage || payload?.message || "Không thể cập nhật thành viên.",
    );
  }
  return (payload?.data ?? payload) as T;
}

export function fetchMembers() {
  return memberRequest<Member[]>();
}

export function createMember(member: CreateMemberInput) {
  return memberRequest<Member>("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  });
}

export function updateMember(id: string, member: CreateMemberInput) {
  return memberRequest<Member>(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  });
}

export type ClubEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  eventDate: string;
  budget: number;
  status: "UPCOMING" | "ONGOING" | "FINISHED";
  resourceUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type SaveEventInput = {
  title: string;
  description: string;
  location?: string | null;
  eventDate: string;
  budget: number;
  status: ClubEvent["status"];
  resourceUrls: string[];
};

async function eventRequest<T>(path = "", init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${API_BASE_URL}/events${path}`, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = payload?.data
      ? Object.values(payload.data).join(". ")
      : null;
    throw new Error(
      validationMessage || payload?.message || "Không thể cập nhật sự kiện.",
    );
  }
  return (payload?.data ?? payload) as T;
}

export function fetchEvents() {
  return eventRequest<ClubEvent[]>();
}

export function createEvent(event: SaveEventInput) {
  return eventRequest<ClubEvent>("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

export function updateEvent(id: string, event: SaveEventInput) {
  return eventRequest<ClubEvent>(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

export function deleteEvent(id: string) {
  return eventRequest<void>(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type BackendTask = {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "low" | "medium" | "high";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "todo" | "in_progress" | "done";
  progress: number;
  deadline: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToRole: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  department: string;
  departmentName: string;
  crossDepartment: boolean;
  eventId: string | null;
  eventTitle: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  department: string;
  priority?: "low" | "medium" | "high" | "LOW" | "MEDIUM" | "HIGH";
  status?: "todo" | "in_progress" | "done" | "TODO" | "IN_PROGRESS" | "DONE";
  deadline?: string | null;
  eventId?: string | null;
  crossDepartment?: boolean;
  assignedToId?: string | null;
  assignToAllDepartments?: boolean;
};

export type UpdateTaskPayload = {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "LOW" | "MEDIUM" | "HIGH";
  status?: "todo" | "in_progress" | "done" | "TODO" | "IN_PROGRESS" | "DONE";
  deadline?: string | null;
  eventId?: string | null;
  crossDepartment?: boolean;
};

async function taskRequest<T>(path = "", init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${API_BASE_URL}/tasks${path}`, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = payload?.data
      ? Object.values(payload.data).join(". ")
      : null;
    throw new Error(
      validationMessage || payload?.message || "Không thể thực hiện yêu cầu nhiệm vụ.",
    );
  }
  return (payload?.data ?? payload) as T;
}

export function fetchTasks(filters?: { department?: string; status?: string; priority?: string }) {
  const params = new URLSearchParams();
  if (filters?.department && filters.department !== "ALL") params.append("department", filters.department.toUpperCase());
  if (filters?.status && filters.status !== "ALL") params.append("status", filters.status.toUpperCase());
  if (filters?.priority && filters.priority !== "ALL") params.append("priority", filters.priority.toUpperCase());
  const query = params.toString() ? `?${params.toString()}` : "";
  return taskRequest<BackendTask[]>(query);
}

export function fetchMyTasks() {
  return taskRequest<BackendTask[]>("/mine");
}

export function createTask(task: CreateTaskPayload) {
  return taskRequest<BackendTask[]>("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...task,
      department: task.department.toUpperCase(),
      priority: task.priority?.toUpperCase(),
      status: task.status?.toUpperCase(),
    }),
  });
}

export function updateTask(id: string, task: UpdateTaskPayload) {
  return taskRequest<BackendTask>(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...task,
      priority: task.priority?.toUpperCase(),
      status: task.status?.toUpperCase(),
    }),
  });
}

export function updateTaskStatus(id: string, status: string) {
  return taskRequest<BackendTask>(`/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: status.toUpperCase() }),
  });
}

export type TaskComment = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  progress: number | null;
  createdAt: string;
};

export function fetchTaskComments(id: string) {
  return taskRequest<TaskComment[]>(`/${encodeURIComponent(id)}/comments`);
}

export function updateTaskProgress(id: string, progress: number, content: string) {
  return taskRequest<BackendTask>(`/${encodeURIComponent(id)}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress, content }),
  });
}

export function deleteTask(id: string) {
  return taskRequest<void>(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type NotificationType =
  | "TASK_ASSIGNED"
  | "GENERAL"
  | "TASK_UPDATE"
  | "REWARD"
  | "URGENT";

export type ManualNotificationType = Exclude<NotificationType, "TASK_ASSIGNED">;

export type NotificationAudience = "ALL" | "DEPARTMENTS" | "MEMBERS";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  entityId: string | null;
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  createdAt: string;
};

export type CreateNotificationPayload = {
  title: string;
  body: string;
  type: ManualNotificationType;
  audience: NotificationAudience;
  departments?: string[];
  memberIds?: string[];
};

async function notificationRequest<T>(path = "", init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${API_BASE_URL}/notifications${path}`, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = payload?.data
      ? Object.values(payload.data).join(". ")
      : null;
    throw new Error(
      validationMessage || payload?.message || "Không thể xử lý thông báo.",
    );
  }
  return (payload?.data ?? payload) as T;
}

/** Thông báo của người dùng hiện tại, mới nhất trước (backend: mặc định 50, tối đa 100). */
export function fetchNotifications(limit?: number) {
  return notificationRequest<AppNotification[]>(limit ? `?limit=${limit}` : "");
}

export function createNotification(notification: CreateNotificationPayload) {
  return notificationRequest<{ recipientCount: number }>("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notification),
  });
}

export async function fetchAccessibleModules(token?: string): Promise<AdminModuleKey[]> {
  const response = await fetch(`${API_BASE_URL}/auth/modules`, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken() ?? ""}` },
  });
  if (!response.ok) throw new Error("Unable to load dashboard permissions.");
  const payload = await response.json();
  return (payload.data ?? payload) as AdminModuleKey[];
}

export async function fetchPublicCatalogItem(
  type: "projects" | "achievements",
  slug: string,
): Promise<CmsCatalogItem | null> {
  const response = await fetch(`${API_BASE_URL}/public/${type}/${slug}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load ${type} item.`);
  return response.json();
}

async function cmsRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${API_BASE_URL}${input}`, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Không thể cập nhật nội dung CMS.");
  }
  return (payload?.data ?? payload) as T;
}

export function fetchCmsSections() {
  return cmsRequest<CmsSection[]>("/public/landing/cms/landing");
}

export function fetchCmsSection(section: string) {
  return cmsRequest<CmsSection>(`/public/landing/cms/landing/${section}`);
}

export function fetchCmsCatalog(type: "projects" | "achievements") {
  return cmsRequest<CmsCatalogItem[]>(`/public/cms/landing/catalog/${type}`);
}

export function checkCmsCatalogSlug(
  type: "projects" | "achievements",
  slug: string,
  excludeId?: string,
) {
  const params = new URLSearchParams({ slug });
  if (excludeId) params.set("excludeId", excludeId);
  return cmsRequest<{ available: boolean }>(
    `/public/cms/landing/catalog/${type}/slug-available?${params}`,
  );
}

export function publishCmsCatalog(
  type: "projects" | "achievements",
  items: Record<string, unknown>[],
) {
  return cmsRequest<CmsCatalogItem[]>(`/public/cms/landing/catalog/${type}/publish`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export function saveCmsDraft(
  section: string,
  content: Record<string, unknown>,
) {
  return cmsRequest<{
    section: string;
    content: Record<string, unknown>;
    savedAt: string;
  }>(`/public/landing/cms/landing/${section}/draft`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
}

export function publishCmsSection(section: string) {
  return cmsRequest<{
    section: string;
    content: Record<string, unknown>;
    publishedAt: string;
  }>(`/public/landing/cms/landing/${section}/publish`, { method: "POST" });
}

export function fetchCmsHistory(section: string) {
  return cmsRequest<CmsHistoryItem[]>(`/public/landing/cms/landing/${section}/history`);
}
import type { AdminModuleKey } from "@/constants/dashboard-modules";
