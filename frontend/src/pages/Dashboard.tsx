import { useEffect, useState } from "react";
import { pronostico, topVendidos, TopItem, ForecastItem } from "../services/dashboard";

export default function DashboardPage() {
  const [top, setTop] = useState<TopItem[]>([]);
  const [fc, setFc] = useState<ForecastItem[]>([]);

  useEffect(() => {
    topVendidos().then(setTop).catch(() => setTop([]));
    pronostico().then(setFc).catch(() => setFc([]));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenido 👋</p>

      <h2>Más vendidos</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th><th>Descripción</th><th>Unidades</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {top.map((t) => (
            <tr key={t.producto_id}>
              <td>{t.producto_id}</td>
              <td>{t.descripcion}</td>
              <td>{t.unidades_vendidas}</td>
              <td>{t.total_recaudado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 24 }}>Pronóstico</h2>
      <ul>
        {fc.map((f) => (
          <li key={f.producto_id}>
            {f.descripcion}: {f.unidades_estimadas} ({f.periodo})
          </li>
        ))}
      </ul>
    </div>
  );
}
