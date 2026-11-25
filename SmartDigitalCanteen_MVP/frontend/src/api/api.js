import axios from "axios";

// In production: always use same-origin (empty string = relative URLs like /api/menu)
// In dev:        proxy to local backend at port 5000
// Never bake localhost into production bundle.
const baseURL = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || "http://localhost:5000");

export const api = axios.create({
  baseURL,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function adminHeaders() {
  const key = localStorage.getItem("ADMIN_KEY") || import.meta.env.VITE_ADMIN_KEY || "";
  return { headers: { "x-admin-key": key } };
}
