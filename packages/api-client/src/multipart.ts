import { getApiBaseUrl, getAuthToken } from "./runtime";
import type { updateUserResponse } from "./gen/client";

// Envía un PATCH multipart/form-data a /api/users/{id}
export async function patchUserFormData(
  id: string,
  form: FormData,
  init: RequestInit = {}
): Promise<updateUserResponse> {
  const url = `${getApiBaseUrl()}/api/users/${id}`;
  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
  };

  const res = await fetch(url, {
    ...init,
    method: "PATCH",
    body: form,
    // Importante: NO establecer Content-Type para que RN asigne el boundary
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const bodyText = await res.text().catch(() => "");
  return bodyText
    ? (JSON.parse(bodyText) as updateUserResponse)
    : (undefined as unknown as updateUserResponse);
}
