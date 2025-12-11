const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_BASE_URL = DEFAULT_API_URL.replace(/\/$/, '');

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

export async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const data = await response.json();
  if (!response.ok) {
    const message = data?.message || data?.detail || 'İstek sırasında bir hata oluştu.';
    throw new Error(message);
  }
  return data;
}
