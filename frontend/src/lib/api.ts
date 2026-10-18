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

export async function fetchPublicCatalog(
  type: "projects" | "achievements",
): Promise<CmsCatalogItem[]> {
  const response = await fetch(`${API_BASE_URL}/public/${type}`);
  if (!response.ok) throw new Error(`Unable to load ${type}.`);
  return response.json();
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
