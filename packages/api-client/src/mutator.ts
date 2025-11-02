import { getApiBaseUrl, getAuthToken } from "./runtime";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: { error?: string },
  ) {
    super(body?.error || `HTTP ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

export async function rnFetch<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  // Do not set Content-Type if the body is FormData (fetch will set it as multipart/form-data).
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const fullUrl = `${getApiBaseUrl()}${url}`;
  console.log(`🌐 ${init.method || "GET"} ${fullUrl}`);

  const res = await fetch(fullUrl, {
    ...init,
    headers,
  });

  if (!res.ok) {
    try {
      const errorBody = await res.json();
      console.error(`❌ API Error ${res.status}:`, errorBody);
      throw new ApiError(res.status, res.statusText, errorBody);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(`❌ API Error ${res.status}: Failed to parse response`);
      throw new ApiError(res.status, res.statusText);
    }
  }

  try {
    const data = await res.json();
    return data as T;
  } catch {
    console.warn(`⚠️ Empty or invalid JSON response from ${url}`);
    return undefined as T;
  }
}
