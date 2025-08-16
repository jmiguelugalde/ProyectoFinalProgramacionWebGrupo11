import { useEffect, useState } from "react";
import { listProducts, Producto } from "../services/products";
import { createSale } from "../services/sales";

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [usuario, setUsuario] = useState("cliente_demo");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    listProducts().then(setProductos);
  }, []);

  async function vender(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!productoId) return;
    const res = await createSale({
      usuario,
      items: [{ producto_id: productoId, cantidad }],
    });
    setMsg(JSON.stringify(res));
  }

  return (
    <div>
      <h1>Ventas</h1>
      <form onSubmit={vender} style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <select value={productoId ?? ""} onChange={e => setProductoId(Number(e.target.value))} required>
          <option value="" disabled>Seleccione producto</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>{p.descripcion} - ₡{p.precio_venta}</option>
          ))}
        </select>
        <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
        <input placeholder="Usuario" value={usuario} onChange={e => setUsuario(e.target.value)} />
        <button type="submit">Vender</button>
      </form>
      {msg && <pre style={{ marginTop: 12 }}>{msg}</pre>}
    </div>
  );
}
