import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/bursa", "/simulasi", "/komunitas", "/llms.txt"],
      disallow: ["/sme/", "/admin/", "/invest/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

