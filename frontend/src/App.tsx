// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <Routes>
      {/* Página de login (pública) */}
      <Route path="/login" element={<Login />} />

      {/* Ruta principal protegida */}
      <Route
        path="/"
        element={
          <ProtectedRoute roles={["admin", "contador", "cliente"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Alias explícito para /dashboard*/}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["admin", "contador", "cliente"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Ruta solo para admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback para rutas no mapeadas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
