import { useEffect, useState } from "react";
import { createProduct, listProducts, Producto } from "../services/products";

export default function ProductosPage() {
  const [items, setItems] = useState<Producto[]>([]);
  const [form, setForm] = useState<any>({
    descripcion: "",
    marca: "",
    presentacion: "",
    codigo_barras: "",
    costo: 0,
    margen_utilidad: 0.3,
    precio_venta: 0,
  });
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const data = await listProducts();
    setItems(data);
  }
  useEffect(() => { load(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await createProduct(form);
    setForm({ descripcion: "", marca: "", presentacion: "", codigo_barras: "", costo: 0, margen_utilidad: 0.3, precio_venta: 0 });
    setMsg("Producto creado");
    await load();
  }

  return (
    <div>
      <h1>Productos</h1>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 20 }}>
        <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required />
        <input placeholder="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} />
        <input placeholder="Presentación" value={form.presentacion} onChange={e => setForm({ ...form, presentacion: e.target.value })} />
        <input placeholder="Código de barras" value={form.codigo_barras} onChange={e => setForm({ ...form, codigo_barras: e.target.value })} />
        <input type="number" placeholder="Costo" value={form.costo} onChange={e => setForm({ ...form, costo: Number(e.target.value) })} />
        <input type="number" step="0.01" placeholder="Margen utilidad" value={form.margen_utilidad} onChange={e => setForm({ ...form, margen_utilidad: Number(e.target.value) })} />
        <input type="number" placeholder="Precio venta" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: Number(e.target.value) })} />
        <button type="submit">Crear</button>
        {msg && <small style={{ color: "green" }}>{msg}</small>}
      </form>

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th><th>Descripción</th><th>Marca</th><th>Precio</th><th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.descripcion}</td>
              <td>{p.marca ?? "-"}</td>
              <td>{p.precio_venta}</td>
              <td>{p.stock ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
