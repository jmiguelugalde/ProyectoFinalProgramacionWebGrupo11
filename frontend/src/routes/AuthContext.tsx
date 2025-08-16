// frontend/src/routes/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type Session = { token: string | null; user?: { username: string } | null };

type Ctx = {
  session: Session;
  setSession: (patch: Partial<Session>) => void;
  logout: () => void;
};

const Ctx = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Carga inicial desde localStorage
  const storedToken = localStorage.getItem("token");
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as { username: string }) : null;
    } catch {
      return null;
    }
  })();

  const [session, setState] = useState<Session>({
    token: storedToken,
    user: storedUser,
  });

  // Persiste cambios
  useEffect(() => {
    if (session.token) localStorage.setItem("token", session.token);
    else localStorage.removeItem("token");

    if (session.user) localStorage.setItem("user", JSON.stringify(session.user));
    else localStorage.removeItem("user");
  }, [session.token, session.user]);

  const setSession = (patch: Partial<Session>) =>
    setState((s) => ({ ...s, ...patch }));

  const logout = () => setState({ token: null, user: null });

  return (
    <Ctx.Provider value={{ session, setSession, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
