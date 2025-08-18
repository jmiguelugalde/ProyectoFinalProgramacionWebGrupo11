import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Páginas
import CobrosPage from "../pages/CobrosPage";
// cuando tengamos LoginPage y VentasPage los agregamos aquí

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/cobros"
          element={
            <ProtectedRoute>
              <CobrosPage />
            </ProtectedRoute>
          }
        />

        {/* de momento redirige todo a /cobros */}
        <Route path="*" element={<Navigate to="/cobros" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
