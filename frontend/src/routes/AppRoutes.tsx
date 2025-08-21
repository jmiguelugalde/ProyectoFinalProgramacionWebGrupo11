// frontend/src/routes/AppRoutes.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

// Páginas
import DashboardPage from "../pages/Dashboard";
import ProductosPage from "../pages/Productos";
import VentasPage from "../pages/Ventas";
import CobrosPage from "../pages/CobrosPage";
import Login from "../pages/Login";

export default function AppRoutes() {
  const { session } = useAuth();
  const isAuthenticated = !!session?.token;

  return (
    <BrowserRouter>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard accesible para todos los roles autenticados */}
        <Route
          path="/"
          element={
            <ProtectedRoute roles={["admin", "contador", "cliente"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Solo admin y contador */}
        <Route
          path="/productos"
          element={
            <ProtectedRoute roles={["admin", "contador"]}>
              <ProductosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute roles={["admin", "contador"]}>
              <VentasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cobros"
          element={
            <ProtectedRoute roles={["admin", "contador"]}>
              <CobrosPage />
            </ProtectedRoute>
          }
        />

        {/* Redirección global */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace /> // 👈 redirige al Dashboard
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
