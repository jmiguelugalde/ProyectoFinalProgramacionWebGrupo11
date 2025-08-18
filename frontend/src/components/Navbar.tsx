import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
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

  const role = token?.role;

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
          {token && (
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

              {(role === "admin" || role === "contabilidad") && (
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

          {!token ? (
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
