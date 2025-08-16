import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./routes/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Cobros from "./pages/Cobros";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute roles={["admin", "contador", "cliente"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/productos"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Productos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ventas"
          element={
            <ProtectedRoute roles={["admin", "cliente"]}>
              <Ventas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cobros"
          element={
            <ProtectedRoute roles={["admin", "contador"]}>
              <Cobros />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
