import { API_BASE_URL } from '../config/runtime';

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let getAccessToken: () => string | null = () => null;
let setAccessToken: (token: string | null) => void = () => {};
let refreshAccessToken: () => Promise<string | null> = async () => null;

export const setAuthInterceptors = (
  getToken: () => string | null,
  setToken: (token: string | null) => void,
  refreshToken: () => Promise<string | null>
) => {
  getAccessToken = getToken;
  setAccessToken = setToken;
  refreshAccessToken = refreshToken;
};

async function fetchWithInterceptors(url: string, options: RequestInit = {}) {
  let token = getAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure credentials for cookies (refresh token)
  options.credentials = 'include';
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const finalOptions: RequestInit = {
    ...options,
    headers
  };

  let response = await fetch(`${API_BASE_URL}${url}`, finalOptions);

  if (response.status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
    // Attempt refresh
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(`${API_BASE_URL}${url}`, { ...finalOptions, headers });
      }
    } catch (refreshError) {
      setAccessToken(null);
      // Let the 401 fall through
    }
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new ApiError('NETWORK_ERROR', 'A network error occurred.');
    }
    throw new ApiError(errorData.code || 'UNKNOWN_ERROR', errorData.message || 'An unknown error occurred.');
  }

  return response.json();
}

export const apiClient = {
  get: (url: string, options?: RequestInit) => fetchWithInterceptors(url, { ...options, method: 'GET' }),
  post: (url: string, body?: any, options?: RequestInit) => fetchWithInterceptors(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url: string, body?: any, options?: RequestInit) => fetchWithInterceptors(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url: string, body?: any, options?: RequestInit) => fetchWithInterceptors(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url: string, options?: RequestInit) => fetchWithInterceptors(url, { ...options, method: 'DELETE' })
};
