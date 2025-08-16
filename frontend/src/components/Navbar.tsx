// frontend/src/components/Navbar.tsx
import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../routes/AuthContext";

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    try {
      logout?.();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // Clase activa para NavLink
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `navlink ${isActive ? "navlink--active" : ""}`;

  return (
    <header className="navbar" role="navigation" aria-label="Main">
      <div className="container navbar__inner">
        <Link to="/" className="brand">Punto de Venta</Link>

        <nav className="navlinks">
          {isAuthenticated && (
            <>
              <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
              <NavLink to="/productos" className={linkClass}>Productos</NavLink>
              <NavLink to="/ventas" className={linkClass}>Ventas</NavLink>
              <NavLink to="/cobros" className={linkClass}>Cobros</NavLink>
            </>
          )}

          {!isAuthenticated ? (
            <NavLink to="/login" className="btn ghost">Login</NavLink>
          ) : (
            <button type="button" className="btn ghost" onClick={onLogout}>
              Cerrar sesión
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
