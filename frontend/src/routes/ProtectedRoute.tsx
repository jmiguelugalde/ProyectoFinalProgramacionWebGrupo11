// frontend/src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  /** Roles permitidos para esta ruta. Si no se especifica, basta con estar logueado. */
  roles?: string[];
};

/** Extrae el 'role' desde el payload del JWT (sin verificar, solo para UI). */
function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    const role =
      payload?.role ??
      payload?.roles ??
      payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session } = useAuth();
  const location = useLocation();

  const token = session.token ?? localStorage.getItem("token");

  // Si no hay token, redirige a login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta exige roles, valida contra el rol del token
  if (roles && roles.length > 0) {
    const role = getRoleFromToken(token);
    if (!role || !roles.includes(role)) {
      // Si no tiene rol permitido, lo mandamos al dashboard (o a /login si prefieres)
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
