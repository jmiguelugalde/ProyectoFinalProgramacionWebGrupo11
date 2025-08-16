import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../services/api";

export type Session = {
  token: string | null;
  user?: { username: string } | null;
};

type AuthContextType = {
  session: Session;
  isAuthenticated: boolean;
  setSession: (s: Session) => void;
  login: (token: string, user?: { username: string }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "";
    return { token, user: token ? { username } : null };
  });

  const isAuthenticated = !!session.token;

  useEffect(() => {
    if (session.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${session.token}`;
      localStorage.setItem("token", session.token);
      if (session.user?.username) {
        localStorage.setItem("username", session.user.username);
      }
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      localStorage.removeItem("username");
    }
  }, [session]);

  const login = (token: string, user?: { username: string }) => {
    setSession({ token, user: user ?? null });
  };

  const logout = () => {
    setSession({ token: null, user: null });
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
