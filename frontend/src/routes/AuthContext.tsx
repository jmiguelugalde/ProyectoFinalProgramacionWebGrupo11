// frontend/src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import api, { login as loginApi, getProfile } from "../services/api";

// Sesión con token + usuario + role
export type Session = {
  token: string | null;
  user: { username: string; role: string } | null;
};

type AuthContextType = {
  session: Session;
  isAuthenticated: boolean;
  setSession: (s: Session) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    return {
      token,
      user: token && username && role ? { username, role } : null,
    };
  });

  const navigate = useNavigate();
  const isAuthenticated = !!session.token;

  useEffect(() => {
    if (session.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${session.token}`;
      localStorage.setItem("token", session.token);
      if (session.user) {
        localStorage.setItem("username", session.user.username);
        localStorage.setItem("role", session.user.role);
      }
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
    }
  }, [session]);

  // ✅ login primero guarda el token, luego pide el perfil
  const login = async (username: string, password: string) => {
    try {
      const response = await loginApi({ username, password });
      const token = response.data.access_token;

      // 1. Guarda el token en el header y en localStorage
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);

      // 2. Ahora sí pide el perfil
      let user = { username, role: "user" }; // fallback si no hay perfil
      try {
        const profileRes = await getProfile();
        user = {
          username: profileRes.data.username,
          role: profileRes.data.role || "user",
        };
      } catch (err) {
        console.warn("No se pudo cargar perfil, usando fallback:", err);
      }

      // 3. Setear sesión
      setSession({ token, user });
      navigate("/dashboard");
    } catch (err) {
      console.error("Error en login:", err);
      throw err;
    }
  };

  const logout = () => {
    setSession({ token: null, user: null });
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const value = useMemo<AuthContextType>(
    () => ({ session, isAuthenticated, setSession, login, logout }),
    [session, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
