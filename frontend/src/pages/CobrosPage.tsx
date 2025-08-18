import { useEffect, useState } from "react";
import {
  listarPeriodos,
  resumenPeriodo,
  exportPeriodoCSV,
  marcarDescontado,
  PeriodoCobro,
  ResumenAsociado,
} from "../services/cobros";

export default function CobrosPage() {
  const [periodos, setPeriodos] = useState<PeriodoCobro[]>([]);
  const [seleccionado, setSeleccionado] = useState<PeriodoCobro | null>(null);
  const [resumen, setResumen] = useState<ResumenAsociado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de períodos al montar
  useEffect(() => {
    setLoading(true);
    listarPeriodos()
      .then((data) => setPeriodos(data))
      .catch(() => setError("No se pudieron cargar los períodos"))
      .finally(() => setLoading(false));
  }, []);

  // Cuando selecciono un período, cargo su resumen
  useEffect(() => {
    if (!seleccionado) return;
    setLoading(true);
    resumenPeriodo(seleccionado.id)
      .then((data) => setResumen(data))
      .catch(() => setError("No se pudo cargar el resumen del período"))
      .finally(() => setLoading(false));
  }, [seleccionado]);

  // Exportar CSV
  const handleExport = async () => {
    if (!seleccionado) return;
    try {
      const blob = await exportPeriodoCSV(seleccionado.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `periodo_${seleccionado.id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Error al exportar CSV");
    }
  };

  // Marcar descontado
  const handleMarcarDescontado = async () => {
    if (!seleccionado) return;
    try {
      await marcarDescontado(seleccionado.id);
      alert("Período marcado como descontado ✅");
      // Refrescar lista
      const nuevos = await listarPeriodos();
      setPeriodos(nuevos);
      // Mantener selección actualizada
      const actual = nuevos.find((p) => p.id === seleccionado.id) || null;
      setSeleccionado(actual);
    } catch {
      setError("Error al marcar como descontado");
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: 10 }}>Cobros</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="grid grid-2" style={{ gap: 20, marginTop: 20 }}>
        {/* Lista de periodos */}
        <section className="card">
          <h2 style={{ fontSize: "1.15rem", marginBottom: 10 }}>
            Períodos generados
          </h2>
          {loading && <p>Cargando...</p>}
          <ul className="list">
            {periodos.map((p) => (
              <li
                key={p.id}
                style={{
                  cursor: "pointer",
                  background:
                    seleccionado?.id === p.id ? "var(--accent-light)" : "transparent",
                  padding: "8px",
                  borderRadius: 6,
                }}
                onClick={() => setSeleccionado(p)}
              >
                <b>
                  {p.inicio} → {p.fin}
                </b>{" "}
                — {p.estado} — ₡{p.total.toLocaleString()} ({p.asociados} asociados)
              </li>
            ))}
          </ul>
          {periodos.length === 0 && <p>No hay períodos generados.</p>}
        </section>

        {/* Resumen del periodo */}
        <section className="card">
          <h2 style={{ fontSize: "1.15rem", marginBottom: 10 }}>
            Resumen {seleccionado ? `del período #${seleccionado.id}` : ""}
          </h2>
          {!seleccionado && <p>Selecciona un período para ver el detalle.</p>}
          {seleccionado && (
            <>
              <div style={{ marginBottom: 10 }}>
                <button onClick={handleExport} className="btn">
                  Exportar CSV
                </button>{" "}
                <button onClick={handleMarcarDescontado} className="btn btn-secondary">
                  Marcar descontado
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Ventas</th>
                      <th>Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.map((r) => (
                      <tr key={r.user_id}>
                        <td>
                          {r.nombre} <br />
                          <small style={{ color: "var(--muted)" }}>
                            {r.cedula || r.employee_code || "—"}
                          </small>
                        </td>
                        <td>{r.ventas}</td>
                        <td>{r.items}</td>
                        <td>₡{r.total.toLocaleString()}</td>
                      </tr>
                    ))}
                    {resumen.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ color: "var(--muted)", padding: 16 }}>
                          No hay datos para mostrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
