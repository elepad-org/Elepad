type ApiClientConfig = {
  baseUrl?: string;
  getToken?: () => string | undefined;
};

let config: ApiClientConfig = {};

export function configureApiClient(next: ApiClientConfig) {
  // strip trailing slashes to avoid "//" in URLs
  config.baseUrl = next.baseUrl?.replace(/\/+$/, "");
  config.getToken = next.getToken;
}

export function getApiBaseUrl() {
  if (!config.baseUrl) {
    throw new Error("API base URL not configured");
  }
  return config.baseUrl;
}

export function getAuthToken() {
  return config.getToken?.();
}
