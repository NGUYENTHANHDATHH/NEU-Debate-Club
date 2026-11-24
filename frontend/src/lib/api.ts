import { cachedGet, refreshApiCache } from "@/lib/requestCache";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

// Trang public render phía server (SEO) gọi backend qua mạng Docker nội bộ nếu có; trình duyệt luôn dùng URL công khai.
const PUBLIC_READ_BASE_URL =
  (typeof window === "undefined" && process.env.API_INTERNAL_URL) || API_BASE_URL;
// Cache 5 phút cho fetch phía server; trình duyệt bỏ qua option này.
const PUBLIC_READ_INIT = { next: { revalidate: 300 } } as RequestInit;

export async function fetchLandingSection<T>(section: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/public/landing/${section}`);
  if (!response.ok) throw new Error(`Không thể tải section ${section}.`);
  const payload = await response.json();
  return (payload.data ?? payload) as T;
}

export interface BackendUserDTO {
  /** null = khách (tài khoản Google ngoài CLB, `role` là "guest"): chỉ đăng ký được sự kiện. */
  id: string | null;
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
  limit?: number,
): Promise<CmsCatalogItem[]> {
  const query = limit ? `?limit=${limit}` : "";
  const response = await fetch(`${PUBLIC_READ_BASE_URL}/public/${type}${query}`, PUBLIC_READ_INIT);
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
  lastLoginAt?: string | null;
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

function memberRequest<T>(path = "", init?: RequestInit): Promise<T> {
  return apiRequest<T>(`/members${path}`, init, "Không thể cập nhật thành viên.");
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

function eventRequest<T>(path = "", init?: RequestInit): Promise<T> {
  return apiRequest<T>(`/events${path}`, init, "Không thể cập nhật sự kiện.");
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

// ---- Đăng ký tham gia sự kiện (người đã đăng nhập ở header) + vé QR (đọc/quét: MEMBER+) ----

/** `id` là nội dung mã QR của người tham gia; chỉ thành viên đọc được (để gửi mail và quét). */
export type EventTicket = {
  id: string;
  eventId: string;
  eventTitle: string;
  fullName: string;
  email: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
};

/**
 * Đăng ký cho người đang đăng nhập ở header (thành viên hoặc khách); backend lấy email và tên từ phiên đó.
 * Không trả mã QR: mã chỉ tới người đăng ký qua email. Lỗi mang `status` HTTP.
 */
export async function registerForEvent(eventId: string): Promise<void> {
  const response = await authorizedFetch(
    `${API_BASE_URL}/public/events/${encodeURIComponent(eventId)}/registrations`,
    { method: "POST" },
  );
  if (response.ok) return;
  const payload = await response.json().catch(() => null);
  throw Object.assign(new Error(payload?.message ?? "Không thể đăng ký."), { status: response.status });
}

export function fetchEventAttendees(eventId: string) {
  return apiRequest<EventTicket[]>(`/events/${encodeURIComponent(eventId)}/attendees`, undefined, "Không thể tải người đăng ký.");
}

export function scanEventTicket(eventId: string, ticketId: string, action: "check-in" | "check-out") {
  return apiRequest<EventTicket>(
    `/events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(ticketId)}/${action}`,
    { method: "POST" },
    "Không thể quét mã.",
  );
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

function taskRequest<T>(path = "", init?: RequestInit): Promise<T> {
  return apiRequest<T>(`/tasks${path}`, init, "Không thể thực hiện yêu cầu nhiệm vụ.");
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
  | "FINANCE"
  | "GENERAL"
  | "TASK_UPDATE"
  | "REWARD"
  | "URGENT";

export type ManualNotificationType = Exclude<NotificationType, "TASK_ASSIGNED" | "FINANCE">;

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

function notificationRequest<T>(path = "", init?: RequestInit): Promise<T> {
  return apiRequest<T>(`/notifications${path}`, init, "Không thể xử lý thông báo.");
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

/** Khoá VAPID của máy chủ; null = máy chủ chưa bật thông báo đẩy. */
export async function fetchPushPublicKey(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/push/public-key`);
  if (!response.ok) return null;
  return (await response.json()).data ?? null;
}

/**
 * Lưu thiết bị nhận thông báo đẩy; có token thì gắn với người đang đăng nhập, không thì là khách.
 * Không qua apiRequest để việc đồng bộ mỗi lần mở app không xoá cache GET.
 */
export async function savePushSubscription(subscription: PushSubscription) {
  const { endpoint, keys } = subscription.toJSON();
  const response = await authorizedFetch(
    `${API_BASE_URL}/push/subscriptions`,
    jsonBody("POST", { endpoint, keys }),
  );
  if (!response.ok) throw new Error("Không thể bật thông báo.");
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
  const response = await fetch(
    `${PUBLIC_READ_BASE_URL}/public/${type}/${encodeURIComponent(slug)}`,
    PUBLIC_READ_INIT,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load ${type} item.`);
  return response.json();
}

function cmsRequest<T>(input: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(input, init, "Không thể cập nhật nội dung CMS.");
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

/** Đẩy bản announcement ĐÃ XUẤT BẢN tới mọi thiết bị đã bật thông báo (kể cả khách). */
export function pushAnnouncement() {
  return cmsRequest<{ deviceCount: number }>(
    "/public/landing/cms/landing/announcement/push",
    { method: "POST" },
  );
}

export function fetchCmsHistory(section: string) {
  return cmsRequest<CmsHistoryItem[]>(`/public/landing/cms/landing/${section}/history`);
}
import type { AdminModuleKey } from "@/constants/dashboard-modules";

// ============================================================================
// Shared request helper for every authorized dashboard request
// ============================================================================

function apiRequest<T>(path: string, init: RequestInit | undefined, fallbackMessage: string): Promise<T> {
  const send = async () => {
    const response = await authorizedFetch(`${API_BASE_URL}${path}`, init);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const validationMessage = payload?.data && typeof payload.data === "object"
        ? Object.values(payload.data).join(". ")
        : null;
      throw new Error(validationMessage || payload?.message || fallbackMessage);
    }
    return (payload?.data ?? payload) as T;
  };
  // Thao tác ghi xóa cache để lần đọc sau thấy dữ liệu mới; GET dùng chung cache, tách theo token từng người.
  if (init?.method && init.method !== "GET") return send().finally(refreshApiCache);
  return cachedGet(`${getAuthToken()}|${path}`, send);
}

function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// ---- Finance (module FINANCE) ----------------------------------------------

export type TransactionType = "INCOME" | "EXPENSE";

export type FinanceTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string | null;
  eventId: string | null;
  eventTitle: string | null;
  memberId: string | null;
  memberName: string | null;
  /** false: khoản thành viên cần đóng, chưa thu (chưa tính vào quỹ). */
  paid: boolean;
  transactionDate: string; // yyyy-MM-dd
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type SaveTransactionInput = {
  type: TransactionType;
  amount: number;
  description: string;
  category?: string | null;
  eventId?: string | null;
  memberId?: string | null;
  paid?: boolean;
  transactionDate: string;
};

export type FinanceMember = { id: string; fullName: string; email: string };

export function fetchTransactions() {
  return apiRequest<FinanceTransaction[]>("/finance/transactions", undefined, "Không thể tải giao dịch.");
}

/** Thu chi gắn với chính người đang đăng nhập (mọi thành viên). */
export function fetchMyTransactions() {
  return apiRequest<FinanceTransaction[]>("/finance/transactions/mine", undefined, "Không thể tải thu chi của bạn.");
}

/** Thành viên mọi ban để gắn vào giao dịch (chỉ quản lý Tài chính). */
export function fetchFinanceMembers() {
  return apiRequest<FinanceMember[]>("/finance/transactions/members", undefined, "Không thể tải danh sách thành viên.");
}

export function createTransaction(input: SaveTransactionInput) {
  return apiRequest<FinanceTransaction>("/finance/transactions", jsonBody("POST", input), "Không thể thêm giao dịch.");
}

/** Lưu cả lô: một dòng lỗi thì không dòng nào được lưu. */
export function importTransactions(transactions: SaveTransactionInput[]) {
  return apiRequest<FinanceTransaction[]>(
    "/finance/transactions/import",
    jsonBody("POST", { transactions }),
    "Không thể nhập giao dịch.",
  );
}

/** Ghi nhận thành viên đã đóng khoản "chưa thu"; ngày giao dịch thành hôm nay. */
export function markTransactionPaid(id: string) {
  return apiRequest<FinanceTransaction>(`/finance/transactions/${id}/paid`, { method: "POST" }, "Không thể ghi nhận khoản thu.");
}

export type PayosAccount = { enabled: boolean; clientId: string };

/** Tài khoản PayOS đang nhận tiền QR (chỉ BCN). Backend không bao giờ trả khoá bí mật. */
export function fetchPayosAccount() {
  return apiRequest<PayosAccount>("/finance/payos-account", undefined, "Không tải được tài khoản PayOS.");
}

export function updatePayosAccount(input: { clientId: string; apiKey: string; checksumKey: string }) {
  return apiRequest<PayosAccount>("/finance/payos-account", jsonBody("PUT", input), "Không đổi được tài khoản PayOS.");
}

export type PayosLink ={ transactionId: string; amount: number; qrCode: string | null; checkoutUrl: string | null; paid: boolean };

/** QR PayOS cho khoản chưa thu của chính mình (tạo mới hoặc dùng lại link còn hiệu lực). */
export function createPayosLink(id: string) {
  return apiRequest<PayosLink>(`/finance/transactions/${id}/payos`, { method: "POST" }, "Không tạo được mã QR thanh toán.");
}

/** Hỏi PayOS khoản đã được trả chưa; trả rồi thì backend ghi nhận luôn. */
export function refreshPayosPayment(id: string) {
  return apiRequest<boolean>(`/finance/transactions/${id}/payos/refresh`, { method: "POST" }, "Không kiểm tra được thanh toán.");
}

export function deleteTransaction(id: string) {
  return apiRequest<void>(`/finance/transactions/${id}`, { method: "DELETE" }, "Không thể xóa giao dịch.");
}

// ---- Publications / media links (read: MEMBER+, write: module PUBLICATIONS) --

export type PublicationPlatform = "FACEBOOK" | "INSTAGRAM" | "YOUTUBE" | "TIKTOK" | "OTHER";

export type Publication = {
  id: string;
  title: string;
  url: string;
  platform: PublicationPlatform;
  department: string;
  eventId: string | null;
  eventTitle: string | null;
  reach: number;
  likes: number;
  shares: number;
  comments: number;
  postedAt: string; // yyyy-MM-dd
  createdByName: string | null;
  createdAt: string;
};

export type SavePublicationInput = {
  title: string;
  url: string;
  platform: PublicationPlatform;
  department: string;
  eventId?: string | null;
  reach?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  postedAt: string;
};

export function fetchPublications() {
  return apiRequest<Publication[]>("/publications", undefined, "Không thể tải ấn phẩm.");
}

export function createPublication(input: SavePublicationInput) {
  return apiRequest<Publication>("/publications", jsonBody("POST", input), "Không thể thêm ấn phẩm.");
}

export function deletePublication(id: string) {
  return apiRequest<void>(`/publications/${id}`, { method: "DELETE" }, "Không thể xóa ấn phẩm.");
}

// ---- Tenure / seasons (module TENURE) ----------------------------------------

export type Season = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  memberCount: number;
  createdAt: string;
};

export type SeasonMember = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string;
  role: string;
  department: string;
  joinedAt: string;
  leftAt: string | null;
};

export type SaveSeasonInput = { name: string; startDate: string; endDate: string; active: boolean };

export type AddSeasonMemberInput = { userId: string; role?: string; department?: string; joinedAt?: string };

export function fetchSeasons() {
  return apiRequest<Season[]>("/seasons", undefined, "Không thể tải nhiệm kỳ.");
}

export function createSeason(input: SaveSeasonInput) {
  return apiRequest<Season>("/seasons", jsonBody("POST", input), "Không thể tạo nhiệm kỳ.");
}

export function deleteSeason(id: string) {
  return apiRequest<void>(`/seasons/${id}`, { method: "DELETE" }, "Không thể xóa nhiệm kỳ.");
}

export function fetchSeasonMembers(seasonId: string) {
  return apiRequest<SeasonMember[]>(`/seasons/${seasonId}/members`, undefined, "Không thể tải thành viên nhiệm kỳ.");
}

export function addSeasonMember(seasonId: string, input: AddSeasonMemberInput) {
  return apiRequest<SeasonMember>(`/seasons/${seasonId}/members`, jsonBody("POST", input), "Không thể thêm thành viên vào nhiệm kỳ.");
}

export function removeSeasonMember(seasonId: string, memberId: string) {
  return apiRequest<void>(`/seasons/${seasonId}/members/${memberId}`, { method: "DELETE" }, "Không thể xóa thành viên khỏi nhiệm kỳ.");
}

// ---- Module permissions (read: module MEMBERSHIP, write: BCN) ------------------

/** Module → các ban có Trưởng/Phó ban được dùng. BCN luôn có mọi module nên không nằm trong ma trận. */
export type ModulePermissionMatrix = Record<AdminModuleKey, string[]>;

export function fetchModulePermissions() {
  return apiRequest<ModulePermissionMatrix>("/module-permissions", undefined, "Không thể tải phân quyền.");
}

export function saveModulePermissions(matrix: ModulePermissionMatrix) {
  return apiRequest<ModulePermissionMatrix>("/module-permissions", jsonBody("PUT", matrix), "Không thể lưu phân quyền.");
}

// ---- Activity log (module ACTIVITY_LOG, BCN only) -----------------------------

export type ActivityLogEntry = {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export function fetchActivityLogs(limit?: number) {
  return apiRequest<ActivityLogEntry[]>(`/activity-logs${limit ? `?limit=${limit}` : ""}`, undefined, "Không thể tải activity log.");
}

// ---- Nhà tài trợ (module SPONSORS) ----------------------------------------

export type PartnerStatus = "DANG_LIEN_HE" | "DA_HOP_TAC" | "THAN_THIET" | "KHONG_PHAN_HOI";
export type OutreachResult = "CHO_PHAN_HOI" | "DONG_Y" | "TU_CHOI";
export type SponsorTier = "kim_cuong" | "vang" | "bac" | "dong" | "hien_vat";
export type ContractStatus = "dang_dam_phan" | "da_ky" | "da_thanh_ly";

/** Điểm tiềm năng 0–100 và từng phần (gần đây 30, quy mô 25, tỉ lệ đồng ý 25, gắn bó 20). */
export type PartnerScore = { total: number; recency: number; scale: number; acceptance: number; loyalty: number };

export type PartnerSummary = {
  id: string;
  companyName: string;
  field: string | null;
  logoUrl: string | null;
  status: PartnerStatus;
  notes: string | null;
  /** Chỉ tính hợp đồng đã ký/đã thanh lý. */
  signedCount: number;
  signedTotal: number;
  lastSignedDate: string | null;
  lastContactDate: string | null;
  score: PartnerScore;
};

export type PartnerContact = { id: string; fullName: string; position: string | null; phone: string | null; email: string | null; primary: boolean };

export type Collaboration = {
  id: string;
  eventId: string | null;
  eventTitle: string | null;
  description: string;
  sponsoredAmount: number;
  /** Link Google Drive tới hợp đồng. */
  mouLink: string | null;
  collaborationDate: string;
  tier: SponsorTier | null;
  contractStatus: ContractStatus;
  benefitsCommitted: string | null;
};

export type OutreachEntry = {
  id: string;
  contactDate: string;
  method: string;
  content: string;
  result: OutreachResult;
  followUpDate: string | null;
  createdByName: string | null;
};

export type PartnerDetail = Omit<PartnerSummary, "signedCount" | "signedTotal" | "lastSignedDate" | "lastContactDate" | "score"> & {
  contacts: PartnerContact[];
  collaborations: Collaboration[];
  outreach: OutreachEntry[];
};

export type FollowUp = { partnerId: string; companyName: string; followUpDate: string; content: string; createdByName: string | null };

export type SavePartnerInput = { companyName: string; field: string | null; logoUrl: string | null; status: PartnerStatus; notes: string | null };
export type SaveContactInput = Omit<PartnerContact, "id">;
export type SaveCollaborationInput = Omit<Collaboration, "id" | "eventTitle">;
export type SaveOutreachInput = Omit<OutreachEntry, "id" | "createdByName">;

function partnerRequest<T>(path = "", init?: RequestInit): Promise<T> {
  return apiRequest<T>(`/partners${path}`, init, "Không thể xử lý yêu cầu nhà tài trợ.");
}

export const fetchPartners = () => partnerRequest<PartnerSummary[]>();
export const fetchPartnerFollowUps = () => partnerRequest<FollowUp[]>("/follow-ups");
export const fetchPartner = (id: string) => partnerRequest<PartnerDetail>(`/${id}`);
export const createPartner = (input: SavePartnerInput) => partnerRequest<string>("", jsonBody("POST", input));
export const updatePartner = (id: string, input: SavePartnerInput) => partnerRequest<void>(`/${id}`, jsonBody("PUT", input));
export const deletePartner = (id: string) => partnerRequest<void>(`/${id}`, { method: "DELETE" });

/** kind: contacts | collaborations | outreach — thêm/xoá một dòng con của nhà tài trợ. */
export function addPartnerItem(id: string, kind: "contacts", input: SaveContactInput): Promise<void>;
export function addPartnerItem(id: string, kind: "collaborations", input: SaveCollaborationInput): Promise<void>;
export function addPartnerItem(id: string, kind: "outreach", input: SaveOutreachInput): Promise<void>;
export function addPartnerItem(id: string, kind: string, input: unknown) {
  return partnerRequest<void>(`/${id}/${kind}`, jsonBody("POST", input));
}

export function deletePartnerItem(id: string, kind: "contacts" | "collaborations" | "outreach", itemId: string) {
  return partnerRequest<void>(`/${id}/${kind}/${itemId}`, { method: "DELETE" });
}
