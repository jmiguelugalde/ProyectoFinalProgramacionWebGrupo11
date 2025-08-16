// frontend/src/pages/Productos.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

type Producto = {
  id: number;
  descripcion: string;
  marca: string;
  presentacion: string;
  codigo_barras: string;
  costo: number;
  margen_utilidad: number; // fracción (0.30)
  precio_venta: number;
};

const currency = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("es-CR", { style: "percent", maximumFractionDigits: 0 });

export default function ProductosPage() {
  // Form
  const [descripcion, setDescripcion] = useState("");
  const [marca, setMarca] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [costo, setCosto] = useState<number>(0);
  const [margenPct, setMargenPct] = useState<number>(30);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listado
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [q, setQ] = useState("");

  // Calcula precio: costo × (1 + margen/100)
  useEffect(() => {
    const p = Math.round(Number(costo || 0) * (1 + Number(margenPct || 0) / 100));
    setPrecioVenta(p);
  }, [costo, margenPct]);

  async function cargarProductos() {
    try {
      setCargandoLista(true);
      const { data } = await api.get<Producto[]>("/productos/");
      setProductos(data || []);
    } catch (e: any) {
      console.error(e);
      setError("No se pudieron cargar los productos.");
    } finally {
      setCargandoLista(false);
    }
  }
  useEffect(() => { cargarProductos(); }, []);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return productos;
    return productos.filter((p) =>
      [p.descripcion, p.marca, p.presentacion, p.codigo_barras, String(p.id)]
        .join(" ")
        .toLowerCase()
        .includes(t)
    );
  }, [q, productos]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setError(null);
    setGuardando(true);
    try {
      const payload = {
        descripcion: descripcion.trim(),
        marca: marca.trim(),
        presentacion: presentacion.trim(),
        codigo_barras: codigoBarras.trim(),
        costo: Number(costo),
        margen_utilidad: Number(margenPct) / 100, // fracción
        precio_venta: Number(precioVenta),
      };
      await api.post("/productos/", payload);
      setMensaje("Producto creado correctamente.");
      limpiar();
      await cargarProductos();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.detail ?? e?.message ?? "Ocurrió un error al guardar.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setGuardando(false);
    }
  }

  function limpiar() {
    setDescripcion(""); setMarca(""); setPresentacion(""); setCodigoBarras("");
    setCosto(0); setMargenPct(30); setPrecioVenta(0);
    setError(null); setMensaje(null);
  }

  return (
    <div className="container page page-productos">
      <h1 className="title">Productos</h1>

      {/* Ojo: mantenemos tu grilla original: grid grid--2 */}
      <div className="grid grid--2">
        {/* FORM ARRIBA (forzado por CSS a ocupar toda la fila) */}
        <div className="card card--form">
          <div className="card__body">
            <h2 className="card__title">Crear producto</h2>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="label">Descripción</label>
                <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Marca</label>
                  <input className="input" value={marca} onChange={(e) => setMarca(e.target.value)} />
                </div>
                <div>
                  <label className="label">Presentación</label>
                  <input className="input" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Código de barras</label>
                <input className="input" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Costo (₡)</label>
                  <input className="input" type="number" min={0} step="1"
                         value={costo} onChange={(e) => setCosto(parseFloat(e.target.value || "0"))}/>
                </div>
                <div>
                  <label className="label">Margen (%)</label>
                  <input className="input" type="number" min={0} max={500} step="1"
                         value={margenPct} onChange={(e) => setMargenPct(parseFloat(e.target.value || "0"))}/>
                </div>
                <div>
                  <label className="label">Precio venta (₡)</label>
                  <input className="input" type="number" readOnly value={precioVenta}/>
                </div>
              </div>

              {error && <p style={{ color: "crimson", marginTop: 4 }}>{error}</p>}
              {mensaje && <p style={{ color: "#2563eb", marginTop: 4 }}>{mensaje}</p>}

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="btn primary" disabled={guardando} type="submit">
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
                <button className="btn" type="button" onClick={limpiar} disabled={guardando}>Limpiar</button>
              </div>
            </form>
          </div>
        </div>

        {/* LISTADO ABAJO (por CSS) */}
        <div className="card card--table">
          <div className="card__body">
            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", marginBottom: 12 }}>
              <h2 className="card__title">Listado</h2>
              <input className="input" placeholder="Buscar por descripción, marca, código…"
                     value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 260 }}/>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>ID</th>
                    <th>Descripción</th>
                    <th>Marca</th>
                    <th>Presentación</th>
                    <th>Código</th>
                    <th style={{ textAlign: "right" }}>Costo</th>
                    <th style={{ textAlign: "right" }}>Margen</th>
                    <th style={{ textAlign: "right" }}>Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoLista ? (
                    <tr><td colSpan={8} className="table__empty">Cargando…</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr><td colSpan={8} className="table__empty">No hay datos para mostrar.</td></tr>
                  ) : (
                    filtrados.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.descripcion}</td>
                        <td>{p.marca}</td>
                        <td>{p.presentacion}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{p.codigo_barras}</td>
                        <td style={{ textAlign: "right" }}>{currency.format(p.costo)}</td>
                        <td style={{ textAlign: "right" }}>{pct.format(p.margen_utilidad)}</td>
                        <td style={{ textAlign: "right" }}>{currency.format(p.precio_venta)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
