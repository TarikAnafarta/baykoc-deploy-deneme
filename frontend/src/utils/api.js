function resolveApiBaseUrl() {
  const envValue = (import.meta.env.VITE_API_URL || '').trim();
  if (envValue) {
    return envValue;
  }
  if (typeof window !== 'undefined') {
    const runtimeValue =
      window.__APP_CONFIG__?.apiBaseUrl ||
      window.__API_BASE_URL__ ||
      window?.ENV?.VITE_API_URL ||
      window?.__ENV__?.VITE_API_URL;
    if (runtimeValue) {
      return runtimeValue;
    }
    console.warn('VITE_API_URL is not set; defaulting API base URL to current origin.');
    return window.location.origin;
  }
  if (typeof globalThis !== 'undefined') {
    const runtimeValue =
      globalThis.__APP_CONFIG__?.apiBaseUrl ||
      globalThis.__API_BASE_URL__ ||
      globalThis?.ENV?.VITE_API_URL ||
      globalThis?.__ENV__?.VITE_API_URL;
    if (runtimeValue) {
      return runtimeValue;
    }
  }
  console.warn(
    'VITE_API_URL is not defined; API calls will be made relative to the current origin.',
  );
  return '';
}

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/$/, '');

export function apiUrl(path = '') {
  if (!path) {
    return API_BASE_URL;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getCsrfToken() {
  if (typeof document === 'undefined') {
    return '';
  }
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      if (acc) return acc;
      const [name, value] = cookie.split('=');
      if (name === 'csrftoken') {
        return value;
      }
      return '';
    }, '');
}

export async function parseJsonResponse(response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (_) {
    return raw;
  }
}

export function extractErrorMessage(payload, fallback = 'İstek sırasında bir hata oluştu.') {
  if (!payload) {
    return fallback;
  }
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed || fallback;
  }
  return payload.message || payload.detail || payload.error || fallback;
}

export async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}
