const DEV_API_PORT = '5000';

export const getApiBaseUrl = () => {
  // In production: VITE_API_URL points to the Render backend
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // In development: use current hostname + port 5000 (works for localhost and LAN IPs)
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${DEV_API_PORT}`;
};

export const getApiUrl = (path) => `${getApiBaseUrl()}${path}`;