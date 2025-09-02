import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

export function adminHeaders() {
  const key = localStorage.getItem("ADMIN_KEY") || import.meta.env.VITE_ADMIN_KEY || "demo_password";
  return { headers: { "x-admin-key": key } };
}
