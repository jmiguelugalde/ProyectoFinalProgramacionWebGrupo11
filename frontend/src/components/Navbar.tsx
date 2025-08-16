import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../routes/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        background: "#111827",
        color: "white",
      }}
    >
      <strong>Punto de Venta</strong>

      {token ? (
        <nav style={{ display: "flex", gap: 16 }}>
          <Link to="/" style={{ color: "white" }}>Dashboard</Link>
          <Link to="/productos" style={{ color: "white" }}>Productos</Link>
          <Link to="/ventas" style={{ color: "white" }}>Ventas</Link>
          <Link to="/cobros" style={{ color: "white" }}>Cobros</Link>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              background: "#ef4444",
              color: "white",
              border: 0,
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </nav>
      ) : (
        <Link to="/login" style={{ color: "white" }}>Login</Link>
      )}
    </header>
  );
}
