import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "@/types/api";

let refreshPromise: Promise<boolean> | null = null;
const requestBodyCache = new WeakMap<Request, Promise<Blob | null>>();

async function doRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

const authRefreshMiddleware: Middleware = {
  async onRequest({ request }) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        requestBodyCache.set(request, request.clone().blob());
      } catch {
        
      }
    }
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) {
      return response;
    }

    const url = new URL(request.url, "http://localhost");
    if (
      url.pathname.includes("/auth/login") ||
      url.pathname.includes("/auth/refresh") ||
      url.pathname.includes("/auth/logout")
    ) {
      return response;
    }

    const refreshed = await doRefresh();
    if (refreshed) {
      try {
        const body = await requestBodyCache.get(request);
        return await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: body ?? undefined,
          credentials: "include",
        });
      } catch {
        return response;
      }
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("uhui_session");
    }

    return response;
  },
};

export const api = createClient<paths>({
  baseUrl: "",
  credentials: "include",
});

api.use(authRefreshMiddleware);
