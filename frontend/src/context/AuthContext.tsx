// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi, getProfile } from "../services/api";

export type UserRole = "admin" | "contador" | "cliente";

export interface UserInfo {
  username: string;
  role: UserRole;
}

export interface Session {
  token: string | null;
  user: UserInfo | null;
}

interface AuthContextValue {
  session: Session;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session>(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role") as UserRole | null;
    return {
      token: token || null,
      user: token && username && role ? { username, role } : null,
    };
  });
  const [loading, setLoading] = useState<boolean>(false);

  const isAuthenticated = useMemo(() => Boolean(session.token), [session.token]);

  // -------- Helpers internos ----------
  const persistSession = (next: Session) => {
    setSession(next);
    if (next.token) {
      localStorage.setItem("token", next.token);
    } else {
      localStorage.removeItem("token");
    }
    if (next.user) {
      localStorage.setItem("username", next.user.username);
      localStorage.setItem("role", next.user.role);
    } else {
      localStorage.removeItem("username");
      localStorage.removeItem("role");
    }
  };

  const safeRole = (r: any): UserRole | null => {
    if (r === "admin" || r === "contador" || r === "cliente") return r;
    return null;
  };

  // -------- Acciones públicas ----------
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      // Llama al backend
      const res = await loginApi({ username, password });
      const token =
        (res?.data as any)?.access_token ||
        (res?.data as any)?.token ||
        null;

      if (!token) {
        throw new Error("No se recibió access_token del backend.");
      }

      // Toma rol si viene en la respuesta de login
      const roleFromLogin: UserRole | null = safeRole(
        (res?.data as any)?.role ?? (res?.data as any)?.user?.role
      );

      // Persiste lo básico de inmediato para que la UI avance
      persistSession({
        token,
        user: roleFromLogin ? { username, role: roleFromLogin } : null,
      });

      // Intenta obtener el perfil (puede devolver null si /users/me aún no existe)
      const profile = await getProfile();

      // Construye el usuario final
      const finalUser: UserInfo = {
        username: (profile?.username as string) || username,
        role:
          safeRole(profile?.role) ||
          roleFromLogin ||
          ("cliente" as UserRole), // fallback razonable
      };

      persistSession({ token, user: finalUser });

      // Navega al dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Limpia sesión en caso de error
      persistSession({ token: null, user: null });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    persistSession({ token: null, user: null });
    navigate("/login", { replace: true });
  };

  const refreshProfile = async () => {
    if (!session.token) return;
    try {
      const me = await getProfile(); // puede ser null si el endpoint no está
      if (!me) return;
      const role = safeRole(me.role) || session.user?.role || ("cliente" as UserRole);
      const username = (me.username as string) || session.user?.username || "usuario";
      persistSession({ token: session.token, user: { username, role } });
    } catch {
      // No tumbar la UI si falla; mantenemos la sesión actual
    }
  };

  // Al montar, si hay token pero no user, intenta un perfil (sin bloquear)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!session.token || session.user) return;
      const me = await getProfile();
      if (cancelled) return;
      if (me) {
        const role = safeRole(me.role) || ("cliente" as UserRole);
        const username = (me.username as string) || localStorage.getItem("username") || "usuario";
        persistSession({ token: session.token, user: { username, role } });
      } else {
        // Mantén el token; deja que las rutas protegidas por token funcionen
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated,
      loading,
      login,
      logout,
      refreshProfile,
    }),
    [session, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook de conveniencia
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
