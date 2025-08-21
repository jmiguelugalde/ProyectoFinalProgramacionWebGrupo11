// frontend/src/components/Navbar.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const linkStyle: React.CSSProperties = {
    color: "var(--text)",
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 600,
  };

  const activeStyle: React.CSSProperties = {
    background: "rgba(37, 99, 235, .12)",
  };

  // Manejo seguro de null
  const role = session?.user?.role;
  const isAuthenticated = !!session?.token;

  return (
    <header className="navbar">
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>Punto de Venta</div>

        <nav style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isAuthenticated && (
            <>
              <NavLink
                to="/"
                style={({ isActive }) => ({
                  ...linkStyle,
                  ...(isActive ? activeStyle : {}),
                })}
              >
                Dashboard
              </NavLink>

              {(role === "admin" || role === "contador") && (
                <>
                  <NavLink
                    to="/productos"
                    style={({ isActive }) => ({
                      ...linkStyle,
                      ...(isActive ? activeStyle : {}),
                    })}
                  >
                    Productos
                  </NavLink>
                  <NavLink
                    to="/ventas"
                    style={({ isActive }) => ({
                      ...linkStyle,
                      ...(isActive ? activeStyle : {}),
                    })}
                  >
                    Ventas
                  </NavLink>
                  <NavLink
                    to="/cobros"
                    style={({ isActive }) => ({
                      ...linkStyle,
                      ...(isActive ? activeStyle : {}),
                    })}
                  >
                    Cobros
                  </NavLink>
                </>
              )}
            </>
          )}

          {!isAuthenticated ? (
            <NavLink to="/login" className="btn ghost">
              Login
            </NavLink>
          ) : (
            <button className="btn ghost" onClick={handleLogout}>
              Cerrar sesión
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
