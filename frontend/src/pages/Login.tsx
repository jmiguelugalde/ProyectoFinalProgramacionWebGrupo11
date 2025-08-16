// frontend/src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { login } from "../services/auth";
import api from "../services/api";
import { useAuth } from "../routes/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username, password);
      const token =
        (res as any)?.access_token ??
        (res as any)?.token ??
        (res as any)?.data?.access_token;

      if (!token) throw new Error("Respuesta inesperada del servidor (sin token).");

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setSession?.({ token, user: { username } });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      let msg = "Error al iniciar sesión";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as any;
        if (typeof d?.detail === "string") msg = d.detail;
        else if (Array.isArray(d?.detail)) {
          msg = d.detail.map((x: any) => x.msg || JSON.stringify(x)).join("; ");
        } else if (d) msg = JSON.stringify(d);
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1>Iniciar sesión</h1>

      <div className="card">
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            className="input"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="input"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" disabled={loading || !username || !password}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && (
            <div style={{ color: "salmon", fontWeight: 600 }}>{error}</div>
          )}
        </form>
      </div>
    </div>
  );
}
