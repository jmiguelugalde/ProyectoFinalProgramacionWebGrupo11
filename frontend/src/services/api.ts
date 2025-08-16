// Servicios base de HTTP con Axios
// Usa VITE_API_URL si existe; si no, cae a http://localhost:8000

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL =
  (import.meta as any)?.env?.VITE_API_URL ??
  (typeof window !== "undefined" && (window as any).__API_URL__) ??
  "http://localhost:8000";

const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Inyecta el token en cada request si existe
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo básico de respuestas/errores
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    // Si el backend devuelve 401, limpia sesión
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      // Redirige al login si no estamos ya ahí
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
