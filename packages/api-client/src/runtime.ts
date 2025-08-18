type Cfg = {
  baseUrl?: string;
  getToken?: () => string | undefined;
};

let cfg: Cfg = {};

export function configureApiClient(next: Cfg) {
  // strip trailing slashes to avoid "//" in URLs
  cfg.baseUrl = next.baseUrl?.replace(/\/+$/, "");
  cfg.getToken = next.getToken;
}

export function getApiBaseUrl() {
  if (!cfg.baseUrl) throw new Error("API base URL not configured");
  return cfg.baseUrl!;
}

export function getAuthToken() {
  return cfg.getToken?.();
}
