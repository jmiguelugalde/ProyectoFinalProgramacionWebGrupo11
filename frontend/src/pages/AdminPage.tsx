// frontend/src/pages/AdminPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type UserRole = "admin" | "contador" | "cliente";

interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export default function AdminPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuración de axios con token
  const api = axios.create({
    baseURL: "/api",
    headers: {
      Authorization: `Bearer ${session?.token}`,
    },
  });

  // Cargar usuarios al montar
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get<User[]>("/users");
        setUsers(res.data);
      } catch (err: any) {
        setError("Error cargando usuarios");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Toggle activo/inactivo
  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      await api.put(`/users/${id}`, { active: !active });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: !active } : u))
      );
    } catch (err) {
      console.error(err);
      setError("Error al actualizar estado del usuario");
    }
  };

  // Eliminar
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      setError("Error al eliminar usuario");
    }
  };

  // Crear usuario (demo)
  const handleAddUser = async () => {
    try {
      const res = await api.post<User>("/users", {
        username: `nuevo${Date.now()}`,
        email: `nuevo${Date.now()}@test.com`,
        password: "123456",
        role: "cliente",
      });
      setUsers((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      setError("Error al agregar usuario");
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Panel de Administración</h1>
      <p>Gestión de usuarios del sistema.</p>

      <button onClick={handleAddUser} style={btnAdd}>
        ➕ Agregar Usuario
      </button>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Usuario</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Rol</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.id}</td>
              <td style={tdStyle}>{u.username}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>{u.role}</td>
              <td style={tdStyle}>{u.active ? "✅ Activo" : "❌ Inactivo"}</td>
              <td style={tdStyle}>
                <button
                  onClick={() => handleToggleActive(u.id, u.active)}
                  style={btnToggle}
                >
                  {u.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  style={btnDelete}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 🎨 Estilos
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "1rem",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  backgroundColor: "#f4f4f4",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
};

const btnAdd: React.CSSProperties = {
  margin: "1rem 0",
  padding: "0.5rem 1rem",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const btnToggle: React.CSSProperties = {
  marginRight: "0.5rem",
  padding: "0.3rem 0.8rem",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const btnDelete: React.CSSProperties = {
  padding: "0.3rem 0.8rem",
  backgroundColor: "red",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
