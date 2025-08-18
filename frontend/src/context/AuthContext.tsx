// src/context/AuthContext.tsx
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

// Roles válidos según backend
type UserRole = "admin" | "contabilidad" | "cliente";

// Estructura del token recibido desde el backend
type Token = {
  access_token: string;
  token_type: string;
  username: string;
  role: UserRole;
};

// Estructura de la sesión
interface Session {
  token: string | null;
  user?: { username: string; role?: UserRole } | null;
}

type Ctx = {
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  logout: () => void;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("session");
    if (raw) {
      try {
        const parsed: Session = JSON.parse(raw);
        if (parsed?.token) {
          setSession(parsed);
        }
      } catch (err) {
        console.error("Error al parsear session del localStorage:", err);
        localStorage.removeItem("session");
      }
    }
  }, []);

  const value = useMemo(
  () => ({
    session,
    setSession, // usamos directamente el de useState
    logout: () => {
      setSession(null);
      localStorage.removeItem("session");
    },
  }),
  [session]
);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
