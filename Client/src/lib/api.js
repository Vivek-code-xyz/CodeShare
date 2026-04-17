const DEV_API_PORT = '5000';

export const getApiBaseUrl = () => {
  // Explicit override via VITE_API_URL (non-empty) — used for split deployments
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // In production (same-domain deployments), /api is served from the same origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }

  // In development, use the current hostname but swap to API port (5000)
  // This supports both localhost:5173 and LAN IP:5173 transparently
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${DEV_API_PORT}`;
};

export const getApiUrl = (path) => `${getApiBaseUrl()}${path}`;