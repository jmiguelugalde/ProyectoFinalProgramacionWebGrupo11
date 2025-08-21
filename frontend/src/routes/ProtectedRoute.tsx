// frontend/src/routes/ProtectedRoute.tsx
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export type UserRole = "admin" | "contador" | "cliente";

interface ProtectedRouteProps {
  roles?: UserRole[];   // Si lo omites, solo valida que exista token
  strict?: boolean;     // Si true y hay roles requeridos, exige rol presente; si false, permite pasar sin rol
  children: ReactNode;
}

export default function ProtectedRoute({ roles, strict, children }: ProtectedRouteProps) {
  const location = useLocation();
  const { session } = useAuth();

  const hasToken = Boolean(session?.token);

  // 1) Sin token → al login (guardando de dónde venía)
  if (!hasToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2) Rol disponible (si el contexto ya lo tiene o lo trajo del login)
  const userRole = session?.user?.role as UserRole | undefined;

  // 3) Si se piden roles…
  if (roles?.length) {
    // …y aún NO tengo rol:
    if (!userRole) {
      // Modo estricto: NO dejo pasar y muestro fallback (evita loops)
      if (strict) {
        return (
          <div style={{ padding: 24 }}>
            <h2>Validando sesión…</h2>
            <p>Esperando rol de usuario. Si esto persiste, verifica <code>/users/me</code> o guarda el rol tras el login.</p>
          </div>
        );
      }
      // Modo no estricto: dejo pasar (útil si /users/me aún no está listo)
      if (typeof window !== "undefined") {
        console.warn("[ProtectedRoute] Pasando sin rol por modo no-estricto.");
      }
      return <>{children}</>;
    }

    // …y el rol NO está permitido → redirige al login (no a "/"), así evitas bucles
    if (!roles.includes(userRole)) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  }

  // 4) Autorizado
  return <>{children}</>;
}
