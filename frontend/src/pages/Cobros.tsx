import { useEffect, useState } from "react";
import { listarCuentas, pagar, CuentaPendiente } from "../services/payments";

export default function CobrosPage() {
  const [cuentas, setCuentas] = useState<CuentaPendiente[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const data = await listarCuentas();
    setCuentas(data);
  }
  useEffect(() => { load(); }, []);

  async function onPagar(u: string, monto: number) {
    setMsg(null);
    const res = await pagar(u, monto);
    setMsg(res.mensaje || JSON.stringify(res));
    await load();
  }

  return (
    <div>
      <h1>Cobros</h1>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Usuario</th><th>Total pendiente</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map(c => (
            <tr key={c.usuario}>
              <td>{c.usuario}</td>
              <td>{c.total_pendiente}</td>
              <td>
                <button onClick={() => onPagar(c.usuario, Math.ceil(c.total_pendiente))}>
                  Marcar pagado
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
    </div>
  );
}
