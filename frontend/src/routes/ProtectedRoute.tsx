// frontend/src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Roles válidos según backend
type UserRole = "admin" | "contabilidad" | "cliente";

interface ProtectedRouteProps {
  roles: UserRole[];
  children: React.ReactElement;
}

export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { session } = useAuth();

  // Si no hay sesión, redirigimos al login
  if (!session || !session.token || !session.user) {
    return <Navigate to="/login" replace />;
  }

  // Verificamos que el rol del usuario esté en la lista de roles permitidos
  if (!roles.includes(session.user.role as UserRole)) {
    return <Navigate to="/" replace />;
  }

  // Si pasa validaciones, renderizamos el contenido
  return children;
}
