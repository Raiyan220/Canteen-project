import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

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
