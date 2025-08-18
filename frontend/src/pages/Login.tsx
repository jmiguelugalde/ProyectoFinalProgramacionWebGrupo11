// frontend/src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { login } from "../services/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
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

      // Intentamos obtener el token de distintas formas
      const token =
        (res as any)?.access_token ??
        (res as any)?.token ??
        (res as any)?.data?.access_token;

      if (!token) throw new Error("Respuesta inesperada del servidor (sin token).");

      // Guardamos la sesión correctamente según la interfaz Session
      setSession?.({
        token: token,
        user: {
          username: (res as any)?.username ?? username,
          role: (res as any)?.role ?? "cliente",
        },
      });

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
    <div className="login-shell">
      <div className="login-card">
        {/* Columna: formulario */}
        <div className="login-form-col">
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="muted">Usa tu usuario y contraseña.</p>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={onSubmit} className="login-form">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />

            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              className="btn primary"
              disabled={loading || !username || !password}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Columna: imagen/hero */}
        <div
          className="login-hero-col"
          style={{ backgroundImage: "url(/img/login-hero.jpg)" }}
          aria-hidden
        >
          <div className="login-hero-overlay">
            <h2>Punto de Venta</h2>
            <p>Gestiona productos, ventas y cobros de forma rápida.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
