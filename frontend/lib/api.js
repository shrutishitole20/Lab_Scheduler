/**
 * Centralized API client for Next.js communicating with the Spring Boot backend.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function loginApi(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Invalid username or password.');
  }
  return data.data;
}

export async function fetchApi(endpoint, options = {}, authState = null) {
  if (!authState) throw new Error('Not authenticated');

  const headers = { ...(options.headers || {}) };
  headers['Authorization'] = 'Basic ' + btoa(`${authState.username}:${authState.password}`);
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }
  if (response.status === 403) {
    throw new Error('ACCESS_DENIED');
  }

  const data = await response.json();
  if (!response.ok && !data.success) {
    const errorMsg = data.message || (data.details ? data.details.join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }
  return data;
}

export function formatDate(isoStr) {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + ' ' + d.toLocaleDateString();
  } catch (e) {
    return isoStr;
  }
}
