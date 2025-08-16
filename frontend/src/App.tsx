import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import ProductsPage from "./pages/Productos";
import SalesPage from "./pages/Ventas";
import CobrosPage from "./pages/Cobros";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute roles={["admin", "contador", "cliente"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/productos"
            element={
              <ProtectedRoute roles={["admin", "contador"]}>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ventas"
            element={
              <ProtectedRoute roles={["admin", "contador"]}>
                <SalesPage />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
