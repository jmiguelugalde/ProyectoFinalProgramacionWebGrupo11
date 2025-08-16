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
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

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

      // Persistimos y configuramos para próximas llamadas
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Guardamos sesión (si el contexto lo usa)
      setSession?.({
        token,
        user: { username },
      });

      // Redirige al dashboard
      navigate("/", { replace: true });
    } catch (err: unknown) {
      let msg = "Error al iniciar sesión";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as any;
        if (typeof d?.detail === "string") msg = d.detail;
        else if (Array.isArray(d?.detail))
          msg = d.detail.map((x: any) => x.msg || JSON.stringify(x)).join("; ");
        else if (d) msg = JSON.stringify(d);
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="container"
      style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ marginBottom: 6 }}>Iniciar sesión</h1>
        <p>Usa tu usuario y contraseña.</p>

        <form onSubmit={onSubmit} className="form-row" style={{ marginTop: 14 }}>
          <input
            className="input"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />
          <input
            className="input"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="actions" style={{ marginTop: 4 }}>
            <button
              type="submit"
              className="btn primary"
              disabled={loading || !username || !password}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: "crimson", marginTop: 12, whiteSpace: "pre-wrap" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
