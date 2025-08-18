import { useEffect, useState } from "react";
import api from "../services/api";

type MasVendido = {
  producto_id: number;
  descripcion: string;
  unidades_vendidas: number;
  total_recaudado: number;
};

type Pronostico = {
  producto_id: number;
  descripcion: string;
  unidades_estimadas: number;
  periodo: string;
};

export default function Dashboard() {
  const [masVendidos, setMasVendidos] = useState<MasVendido[]>([]);
  const [forecast, setForecast] = useState<Pronostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mvRes, fcRes] = await Promise.all([
          api.get<MasVendido[]>("/dashboard/mas-vendidos"),
          api.get<Pronostico[]>("/dashboard/pronostico"),
        ]);
        setMasVendidos(mvRes.data);
        setForecast(fcRes.data);
      } catch (err) {
        setError("No se pudieron cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const currency = new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
  });

  return (
    <div className="container">
      <h1 style={{ marginBottom: 6 }}>Dashboard</h1>
      <p>Bienvenido 👋</p>

      {loading && <p style={{ color: "var(--muted)", marginTop: 20 }}>Cargando datos...</p>}
      {error && <p style={{ color: "red", marginTop: 20 }}>{error}</p>}

      {!loading && !error && (
        <div className="grid grid-2" style={{ marginTop: 20 }}>
          {/* ---- Más vendidos ---- */}
          <section className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <h2 style={{ fontSize: "1.15rem" }}>Más vendidos</h2>
              <span className="chip">{masVendidos.length} ítems</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descripción</th>
                    <th>Unidades</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {masVendidos.map((p) => (
                    <tr key={p.producto_id}>
                      <td>{p.producto_id}</td>
                      <td>{p.descripcion}</td>
                      <td>{p.unidades_vendidas}</td>
                      <td>{currency.format(p.total_recaudado)}</td>
                    </tr>
                  ))}
                  {masVendidos.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ color: "var(--muted)", padding: 16 }}>
                        No hay datos para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---- Pronóstico ---- */}
          <section className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <h2 style={{ fontSize: "1.15rem" }}>Pronóstico</h2>
              <span className="chip">{forecast.length} ítems</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descripción</th>
                    <th>Estimadas</th>
                    <th>Período</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f) => (
                    <tr key={f.producto_id}>
                      <td>{f.producto_id}</td>
                      <td>{f.descripcion}</td>
                      <td>{f.unidades_estimadas}</td>
                      <td>{f.periodo}</td>
                    </tr>
                  ))}
                  {forecast.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ color: "var(--muted)", padding: 16 }}>
                        No hay datos para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
