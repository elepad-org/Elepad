import { getApiBaseUrl, getAuthToken } from "./runtime";

function extractErrorMessage(body: unknown): string | undefined {
  if (!body) return undefined;
  if (typeof body === "string") return body;

  if (typeof body === "object") {
    const anyBody = body as Record<string, unknown>;
    const err = anyBody.error;

    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const anyErr = err as Record<string, unknown>;
      if (typeof anyErr.message === "string") return anyErr.message;
    }

    if (typeof anyBody.message === "string") return anyBody.message;
  }

  return undefined;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown
  ) {
    super(extractErrorMessage(body) || `HTTP ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

export async function rnFetch<T>(
  url: string,
  init: RequestInit = {}
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
