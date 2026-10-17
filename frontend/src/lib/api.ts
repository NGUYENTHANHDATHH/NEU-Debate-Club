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

async function cmsRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${API_BASE_URL}${input}`, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Không thể cập nhật nội dung CMS.");
  }
  return (payload?.data ?? payload) as T;
}

export function fetchCmsSections() {
  return cmsRequest<CmsSection[]>("/cms/landing");
}

export function fetchCmsSection(section: string) {
  return cmsRequest<CmsSection>(`/cms/landing/${section}`);
}

export function fetchCmsCatalog(type: "projects" | "achievements") {
  return cmsRequest<CmsCatalogItem[]>(`/cms/landing/catalog/${type}`);
}

export function publishCmsCatalog(
  type: "projects" | "achievements",
  items: Record<string, unknown>[],
) {
  return cmsRequest<CmsCatalogItem[]>(`/cms/landing/catalog/${type}/publish`, {
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
  }>(`/cms/landing/${section}/draft`, {
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
  }>(`/cms/landing/${section}/publish`, { method: "POST" });
}

export function fetchCmsHistory(section: string) {
  return cmsRequest<CmsHistoryItem[]>(`/cms/landing/${section}/history`);
}
