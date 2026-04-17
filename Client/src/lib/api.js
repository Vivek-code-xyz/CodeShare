const DEV_API_PORT = '5000';

// Hostnames that are definitely local/dev environments
const DEV_HOSTNAMES = ['localhost', '127.0.0.1'];
const isLocalDev = (hostname) =>
  DEV_HOSTNAMES.includes(hostname) ||
  // LAN IPs: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  /^10\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
  /^192\.168\./.test(hostname);

export const getApiBaseUrl = () => {
  // 1. Explicit external backend URL (set this in Vercel env vars for split deployments)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  const { protocol, hostname } = window.location;

  // 2. Running on localhost or LAN → dev server on port 5000
  if (isLocalDev(hostname)) {
    return `${protocol}//${hostname}:${DEV_API_PORT}`;
  }

  // 3. Deployed to a real domain (Vercel, Netlify, etc.) → same origin, /api is proxied
  return `${protocol}//${hostname}`;
};

export const getApiUrl = (path) => `${getApiBaseUrl()}${path}`;