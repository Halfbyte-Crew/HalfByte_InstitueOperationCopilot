import { ApiError } from './errorHandler';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Core HTTP communication client wrapping native Fetch API.
 */
export async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    customBaseUrl,
    ...customConfig
  } = options;

  const token = localStorage.getItem('access_token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const url = `${customBaseUrl || BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config = {
    method,
    headers: defaultHeaders,
    ...customConfig,
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError('Network connection failure. Please check your internet connection.', 0, err);
  }

  // Handle unauthorized / expired session
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');
    // Dispatch custom event for session expiry handling
    window.dispatchEvent(new CustomEvent('session-expired'));
  }

  // Parse payload
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
}
