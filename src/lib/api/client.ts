import { ApiClientError, ApiRequestOptions, ApiResponse } from './types';

/**
 * Builds the full query URL with search params.
 */
function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const url = endpoint.startsWith('http')
    ? new URL(endpoint)
    : new URL(endpoint, 'http://localhost');

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Return pathname + search if local relative, else full href
  if (!endpoint.startsWith('http')) {
    return url.pathname + url.search;
  }
  return url.toString();
}

/**
 * Core HTTP Request Function
 * Always sets credentials: 'include' for secure HTTP-only cookie authentication.
 */
export async function request<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, body, headers: customHeaders, ...customOptions } = options;
  const url = buildUrl(endpoint, params);

  const headers = new Headers(customHeaders);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...customOptions,
    // CRITICAL: Always include credentials so echoes_token cookie is transmitted
    credentials: 'include',
    headers,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiClientError(0, `Network error: ${message}`);
  }

  // Parse JSON response body
  let responseData: unknown = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  // Check HTTP response status
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let details: unknown = undefined;

    if (responseData && typeof responseData === 'object') {
      const apiResp = responseData as ApiResponse<unknown>;
      if (apiResp.error) {
        errorMessage = apiResp.error;
      }
      if (apiResp.details) {
        details = apiResp.details;
      }
    }

    throw new ApiClientError(response.status, errorMessage, details, responseData);
  }

  return responseData as T;
}

/**
 * Typed API Client with convenient HTTP verbs.
 */
export const apiClient = {
  get<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  },

  delete<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  upload<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: ApiRequestOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body: formData });
  },
};
