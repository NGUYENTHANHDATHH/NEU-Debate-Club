import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    // Cho mọi bot (kể cả GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) đọc trang public.
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/login", "/logout", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
