import { getApiBaseUrl, getAuthToken } from "./runtime";

export async function rnFetch<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
    },
  });

  if (!res.ok) {
    // you can map your Hono error shape here if you like
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  // handle empty bodies (204) gracefully
  const bodyText = await res.text().catch(() => "");
  return (bodyText ? JSON.parse(bodyText) : undefined) as T;
}
