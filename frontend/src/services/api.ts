// Servicios base de HTTP con Axios
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ==========================
// Definición del baseURL
// ==========================
const baseURL: string =
  // Primero intenta con la variable de entorno de Vite
  import.meta.env?.VITE_API_URL ||
  // Fallback para casos en que se inyecte manualmente desde index.html
  (typeof window !== "undefined" && (window as any).__API_URL__) ||
  // Última opción: localhost
  "http://127.0.0.1:8000";

// ==========================
// Creación de instancia Axios
// ==========================
const api = axios.create({
  baseURL,
  timeout: 15000,
});

// ==========================
// Interceptor de requests
// ==========================
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as any; // <-- forzamos a any para evitar choques de tipos
  }
  return config;
});

// ==========================
// Interceptor de respuestas
// ==========================
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        // 👇 Redirige al login si expira el token
        window.location.href = "/login";
      }
    }
    console.error("❌ Error en petición:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// ==========================
// Funciones API
// ==========================

// --------- Auth ----------
export const login = async (data: { username: string; password: string }) => {
  try {
    const res = await api.post(
      "/auth/login",
      new URLSearchParams({
        username: data.username,
        password: data.password,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const token = (res.data as any)?.access_token;
    if (token) {
      localStorage.setItem("token", token);
    }
    return res;
  } catch (error: any) {
    console.error("❌ Error en login:", error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = (data: {
  username: string;
  email: string;
  password: string;
}) => api.post("/users/", data);

export const getProfile = async () => {
  try {
    const { data } = await api.get("/users/me");
    return data ?? null;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 405 || status === 404 || status === 501) {
      console.warn("[api] /users/me no disponible (", status, "). Devuelvo null.");
      return null;
    }
    // otros errores: deja que el caller decida
    console.error("[api] getProfile error:", err?.response?.data || err?.message);
    return null;
  }
};

// --------- Productos ----------
export const getProductos = () => api.get("/productos/");
export const createProducto = (data: any) => api.post("/productos/", data);
export const updateProducto = (id: number, data: any) =>
  api.put(`/productos/${id}`, data);
export const deleteProducto = (id: number) => api.delete(`/productos/${id}`);

// --------- Ventas ----------
export const getVentas = () => api.get("/ventas/");
export const createVenta = (data: any) => api.post("/ventas/", data);
export const getVentaById = (id: number) => api.get(`/ventas/${id}`);

export default api;
