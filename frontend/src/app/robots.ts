import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    // Cho mọi bot (kể cả GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) đọc trang public.
    // /dashboard cố ý không liệt kê ở đây (để không lộ đường dẫn); nó bị chặn index bằng X-Robots-Tag trong next.config.ts.
    rules: { userAgent: "*", allow: "/", disallow: ["/login", "/logout", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
