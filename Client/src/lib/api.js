const API_PORT = '5000';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
};

export const getApiUrl = (path) => `${getApiBaseUrl()}${path}`;