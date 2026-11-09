const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";

export async function serverFetch<T>(
  path: string,
  options?: RequestInit & { revalidate?: number | false },
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const url = `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
    const revalidate = options?.revalidate ?? 300;
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
      next:
        typeof revalidate === "number"
          ? { revalidate }
          : undefined,
    });

    if (!res.ok) {
      return {
        data: null,
        error: new Error(`API error ${res.status}: ${res.statusText}`),
      };
    }

    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Network request failed"),
    };
  }
}

