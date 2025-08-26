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

  const res = await fetch(`${getApiBaseUrl()}${url}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    try {
      const errorBody = await res.json();
      throw new ApiError(res.status, res.statusText, errorBody);
    } catch {
      throw new ApiError(res.status, res.statusText);
    }
  }

  try {
    const data = await res.json();
    return data as T;
  } catch {
    return undefined as T;
  }
}
