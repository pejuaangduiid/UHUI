import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/bursa", "/simulasi", "/komunitas"];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/bursa" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));
}

