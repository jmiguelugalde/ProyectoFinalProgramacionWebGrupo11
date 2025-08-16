// frontend/src/pages/Ventas.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

// ⚠ Ajusta si tu backend usa otra ruta (p.ej. "/sales/")
const VENTAS_PATH = "/ventas/";

type Product = {
  id: number;
  descripcion: string;
  marca?: string;
  presentacion?: string;
  codigo_barras?: string;
  costo: number;
  margen_utilidad: number;
  precio_venta: number;
};

type CartLine = { product: Product; qty: number };

const formatCRC = (n: number) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(n);

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [term, setTerm] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const scanRef = useRef<HTMLInputElement>(null);
  const focusScan = () => setTimeout(() => scanRef.current?.focus(), 0);

  useEffect(() => {
    focusScan();
    (async () => {
      try {
        const { data } = await api.get<Product[]>("/productos/");
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("No se pudo cargar productos", e);
      }
    })();
  }, []);

  function findProduct(t: string): Product | null {
    const s = t.trim().toLowerCase();
    if (!s) return null;

    // 1) exacto por código
    const exact = products.find(
      (p) => (p.codigo_barras || "").trim().toLowerCase() === s
    );
    if (exact) return exact;

    // 2) texto (por si digitó la descripción)
    const partial = products.find((p) => {
      const d = (p.descripcion || "").toLowerCase();
      const m = (p.marca || "").toLowerCase();
      const pr = (p.presentacion || "").toLowerCase();
      return d.includes(s) || m.includes(s) || pr.includes(s);
    });
    return partial || null;
  }

  function addToCart(p: Product, q: number) {
    if (q <= 0) return;
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + q };
        return copy;
      }
      return [...prev, { product: p, qty: q }];
    });
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function updateQty(productId: number, q: number) {
    if (q <= 0) return removeLine(productId);
    setCart((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, qty: q } : l))
    );
  }

  const subtotal = useMemo(
    () => cart.reduce((acc, l) => acc + l.product.precio_venta * l.qty, 0),
    [cart]
  );
  const total = subtotal; // sin IVA ni descuentos

  async function registrarVenta() {
    if (cart.length === 0) return;
    setLoading(true);
    setMsg(null);
    try {
      const payload = {
        metodo_pago: "rebajo_planilla",
        items: cart.map((l) => ({
          producto_id: l.product.id,
          cantidad: l.qty,
          precio_unitario: l.product.precio_venta,
          total_linea: l.product.precio_venta * l.qty,
        })),
        total,
      };
      await api.post(VENTAS_PATH, payload);
      setMsg("✅ Venta registrada correctamente.");
      setCart([]);
      setTerm("");
      setQty(1);
      focusScan();
    } catch (err) {
      console.error(err);
      setMsg("❌ No se pudo registrar la venta.");
    } finally {
      setLoading(false);
    }
  }

  function nuevaVenta() {
    setCart([]);
    setTerm("");
    setQty(1);
    focusScan();
  }

  function intentarAgregar() {
    setMsg(null);
    const p = findProduct(term);
    if (!p) {
      setMsg("⚠️ Producto no encontrado. Verifica el código o descripción.");
      return;
    }
    addToCart(p, qty || 1);
    setQty(1);
    setTerm("");
    focusScan();
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    intentarAgregar();
  }

  return (
    <div className="page container">
      <h1 className="title">Ventas (POS)</h1>

      {/* Pantalla en una sola columna */}
      <div className="stack">
        {/* Escanear / Buscar */}
        <section className="card">
          <header className="card__header">
            <h2 className="card__title">Escanear / Buscar</h2>
            <p className="card__subtitle">Ingrese el código o descripción.</p>
          </header>

          <div className="card__body">
            <form
              onSubmit={onFormSubmit}
              style={{ display: "grid", gap: 12, maxWidth: 980 }}
            >
              <label>
                Código de barras o descripción
                <input
                  ref={scanRef}
                  className="input"
                  placeholder="Escanee o digite el GTIN del producto"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  autoFocus
                />
              </label>

              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ minWidth: 180 }}>
                  Cantidad
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                  />
                </label>

                <div style={{ alignSelf: "end", display: "flex", gap: 8 }}>
                  <button type="submit" className="btn primary">
                    Agregar
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setTerm("");
                      setQty(1);
                      focusScan();
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {msg && (
                <div
                  className="alert"
                  style={{
                    borderColor: msg.startsWith("✅") ? "#86efac" : "#ffcbc7",
                    background: msg.startsWith("✅") ? "#f0fdf4" : "#fff6f6",
                    color: msg.startsWith("✅") ? "#14532d" : "#b42318",
                  }}
                  aria-live="polite"
                >
                  {msg}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Ticket */}
        <section className="card">
          <header className="card__header">
            <h2 className="card__title">Ticket</h2>
            <div className="chip">{cart.length} ítems</div>
          </header>

          <div className="card__body">
            <div className="table" style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={{ width: "50%" }}>Producto</th>
                    <th style={{ width: 120 }}>Precio</th>
                    <th style={{ width: 140 }}>Cant.</th>
                    <th style={{ width: 140 }}>Total</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td className="table__empty" colSpan={5}>
                        No hay ítems en el carrito.
                      </td>
                    </tr>
                  ) : (
                    cart.map((l) => (
                      <tr key={l.product.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {l.product.descripcion}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {l.product.marca ? `${l.product.marca} · ` : ""}
                            {l.product.presentacion || ""}
                            {l.product.codigo_barras
                              ? ` · ${l.product.codigo_barras}`
                              : ""}
                          </div>
                        </td>
                        <td>{formatCRC(l.product.precio_venta)}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <button
                              className="btn"
                              type="button"
                              onClick={() =>
                                updateQty(l.product.id, l.qty - 1)
                              }
                              title="Menos"
                            >
                              −
                            </button>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              value={l.qty}
                              onChange={(e) =>
                                updateQty(
                                  l.product.id,
                                  Math.max(1, Number(e.target.value))
                                )
                              }
                              style={{ width: 70, textAlign: "center" }}
                            />
                            <button
                              className="btn"
                              type="button"
                              onClick={() =>
                                updateQty(l.product.id, l.qty + 1)
                              }
                              title="Más"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{formatCRC(l.product.precio_venta * l.qty)}</td>
                        <td>
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() => removeLine(l.product.id)}
                            title="Eliminar línea"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                marginTop: 16,
                justifyContent: "end",
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div className="muted">Subtotal</div>
                <div style={{ minWidth: 120, textAlign: "right" }}>
                  {formatCRC(subtotal)}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                <div>Total</div>
                <div style={{ minWidth: 120, textAlign: "right" }}>
                  {formatCRC(total)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button className="btn ghost" onClick={nuevaVenta} type="button">
                  Nueva venta
                </button>
                <button
                  className="btn primary"
                  onClick={registrarVenta}
                  disabled={cart.length === 0 || loading}
                  title="Único método: rebajo de planilla"
                  type="button"
                >
                  {loading ? "Registrando…" : "Registrar venta"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
