import type { MetadataRoute } from "next";
import { DEPARTMENT_KEYS, ROUTES, SITE_URL, routePath } from "@/constants/routes";
import { fetchPublicCatalog } from "@/lib/api";

export const revalidate = 3600;

async function catalogEntries(type: "projects" | "achievements"): Promise<MetadataRoute.Sitemap> {
  try {
    const items = await fetchPublicCatalog(type);
    return items.map((item) => ({
      url: `${SITE_URL}/${type}/${item.slug}`,
      lastModified: item.updatedAt,
    }));
  } catch {
    return []; // Backend tắt lúc build: vẫn trả sitemap với các trang tĩnh.
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [ROUTES.home, ROUTES.projects, ROUTES.achievements].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
  }));
  const departments = Object.keys(DEPARTMENT_KEYS).map((slug) => ({
    url: `${SITE_URL}${routePath.departmentDetail(slug)}`,
  }));
  const [projects, achievements] = await Promise.all([
    catalogEntries("projects"),
    catalogEntries("achievements"),
  ]);
  return [...staticPages, ...departments, ...projects, ...achievements];
}
