import React, { useEffect, useMemo, useState } from "react";
import {
  previewCobros,
  generarCobros,
  listarPeriodos,
  resumenPeriodo,
  detallePeriodo,
  exportPeriodoCSV,
  marcarDescontado,
  type Periodo,
  type ResumenAsociado,
  type DetalleItem,
  type PeriodoCobro,
} from "../services/cobros";
import { quincenaActual, quincenaAnterior } from "../utils/quincena";

export default function CobrosPage() {
  const [periodo, setPeriodo] = useState<Periodo>(quincenaActual());
  const [previewLoading, setPreviewLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  const [resumen, setResumen] = useState<ResumenAsociado[]>([]);
  const [detalle, setDetalle] = useState<DetalleItem[]>([]);
  const [kpis, setKpis] = useState<{ total: number; asociados: number; ventas: number }>({
    total: 0,
    asociados: 0,
    ventas: 0,
  });

  const [periodos, setPeriodos] = useState<PeriodoCobro[]>([]);
  const [selPeriodo, setSelPeriodo] = useState<number | null>(null);
  const [histResumen, setHistResumen] = useState<ResumenAsociado[]>([]);
  const [histDetalle, setHistDetalle] = useState<DetalleItem[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  // Cargar períodos históricos
  useEffect(() => {
    (async () => {
      try {
        const data = await listarPeriodos();
        setPeriodos(data);
      } catch (e) {
        console.error("Error listando períodos", e);
      }
    })();
  }, []);

  async function doPreview() {
    setPreviewLoading(true);
    try {
      const data = await previewCobros(periodo);
      setResumen(data.resumen);
      setDetalle(data.detalle);
      setKpis({
        total: data.total_periodo,
        asociados: data.total_asociados,
        ventas: data.total_ventas,
      });
    } catch (e) {
      console.error("Error preview cobros", e);
      alert("No fue posible calcular el preview de cobros.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function doGenerar() {
    if (!confirm("¿Generar cobros para este período? Esto asociará las ventas a un período de cobro.")) return;
    setGenLoading(true);
    try {
      const data = await generarCobros(periodo);
      setSelPeriodo(data.periodo_id);
      const list = await listarPeriodos();
      setPeriodos(list);
      alert("Período generado correctamente.");
    } catch (e) {
      console.error("Error generando período", e);
      alert("No fue posible generar el período.");
    } finally {
      setGenLoading(false);
    }
  }

  async function loadPeriodoHistorico(id: number) {
    setHistLoading(true);
    try {
      const [r, d] = await Promise.all([resumenPeriodo(id), detallePeriodo(id)]);
      setHistResumen(r);
      setHistDetalle(d);
    } catch (e) {
      console.error("Error cargando período histórico", e);
      alert("No fue posible cargar el período.");
    } finally {
      setHistLoading(false);
    }
  }

  async function doExportCSV() {
    if (!selPeriodo) return;
    try {
      const blob = await exportPeriodoCSV(selPeriodo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cobros_periodo_${selPeriodo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error exportando CSV", e);
      alert("Error exportando CSV.");
    }
  }

  async function doDescontado() {
    if (!selPeriodo) return;
    if (!confirm("¿Marcar período como descontado (confirmado por planilla)?")) return;
    try {
      await marcarDescontado(selPeriodo);
      const list = await listarPeriodos();
      setPeriodos(list);
      alert("Período marcado como descontado.");
    } catch (e) {
      console.error("Error marcando descontado", e);
      alert("No fue posible marcar como descontado.");
    }
  }

  const totalPreview = useMemo(
    () => kpis.total.toLocaleString("es-CR", { style: "currency", currency: "CRC" }),
    [kpis.total]
  );

  return (
    <div className="page container">
      <h1 className="title">Cobros</h1>

      {/* ---------------- Período ---------------- */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Período</h2>
          <div className="chip">
            Total preview: <strong>{totalPreview}</strong> · Asociados: {kpis.asociados} · Ventas: {kpis.ventas}
          </div>
        </div>
        <div className="card__body">
          <div className="grid" style={{ gap: 12 }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <div>
                <label>Inicio</label>
                <input
                  className="input"
                  type="date"
                  value={periodo.inicio}
                  onChange={(e) => setPeriodo((p) => ({ ...p, inicio: e.target.value }))}
                />
              </div>
              <div>
                <label>Fin</label>
                <input
                  className="input"
                  type="date"
                  value={periodo.fin}
                  onChange={(e) => setPeriodo((p) => ({ ...p, fin: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                <button className="btn" onClick={() => setPeriodo(quincenaActual())}>
                  Quincena actual
                </button>
                <button className="btn" onClick={() => setPeriodo(quincenaAnterior())}>
                  Quincena anterior
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={doPreview} disabled={previewLoading}>
                {previewLoading ? "Calculando..." : "Calcular"}
              </button>
              <button className="btn primary" onClick={doGenerar} disabled={genLoading}>
                {genLoading ? "Generando..." : "Generar cobros"}
              </button>
              {selPeriodo && (
                <>
                  <button className="btn" onClick={doExportCSV}>
                    Exportar CSV
                  </button>
                  <button className="btn ghost" onClick={doDescontado}>
                    Marcar como descontado
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Resumen por asociado ---------------- */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Resumen por asociado (preview)</h2>
          <span className="muted">{resumen.length} filas</span>
        </div>
        <div className="card__body">
          <div className="table">
            <table className="table">
              <thead>
                <tr>
                  <th>Asociado</th>
                  <th>Cédula</th>
                  <th>Planilla</th>
                  <th style={{ textAlign: "right" }}># ventas</th>
                  <th style={{ textAlign: "right" }}>Ítems</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {resumen.length === 0 ? (
                  <tr><td colSpan={6} className="table__empty">No hay datos para mostrar.</td></tr>
                ) : resumen.map((r) => (
                  <tr key={r.user_id}>
                    <td>{r.nombre}</td>
                    <td>{r.cedula ?? "-"}</td>
                    <td>{r.employee_code ?? "-"}</td>
                    <td style={{ textAlign: "right" }}>{r.ventas}</td>
                    <td style={{ textAlign: "right" }}>{r.items}</td>
                    <td style={{ textAlign: "right" }}>
                      {r.total.toLocaleString("es-CR", { style: "currency", currency: "CRC" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------------- Detalle del período ---------------- */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Detalle del período (preview)</h2>
          <span className="muted">{detalle.length} ítems</span>
        </div>
        <div className="card__body">
          <div className="table">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Producto</th>
                  <th style={{ textAlign: "right" }}>Cant.</th>
                  <th style={{ textAlign: "right" }}>Precio</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th>Venta #</th>
                </tr>
              </thead>
              <tbody>
                {detalle.length === 0 ? (
                  <tr><td colSpan={7} className="table__empty">No hay datos para mostrar.</td></tr>
                ) : detalle.map((d, i) => (
                  <tr key={`${d.venta_id}-${i}`}>
                    <td>{new Date(d.fecha).toLocaleString()}</td>
                    <td>{d.usuario}</td>
                    <td>{d.producto}</td>
                    <td style={{ textAlign: "right" }}>{d.cantidad}</td>
                    <td style={{ textAlign: "right" }}>
                      {d.precio.toLocaleString("es-CR", { style: "currency", currency: "CRC" })}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {d.total.toLocaleString("es-CR", { style: "currency", currency: "CRC" })}
                    </td>
                    <td>{d.venta_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------------- Histórico ---------------- */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Histórico de períodos</h2>
          <span className="muted">{periodos.length} períodos</span>
        </div>
        <div className="card__body">
          <div className="table">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Asociados</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periodos.length === 0 ? (
                  <tr><td colSpan={7} className="table__empty">No hay períodos aún.</td></tr>
                ) : periodos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.inicio}</td>
                    <td>{p.fin}</td>
                    <td><span className="chip">{p.estado}</span></td>
                    <td style={{ textAlign: "right" }}>{p.asociados}</td>
                    <td style={{ textAlign: "right" }}>
                      {p.total.toLocaleString("es-CR", { style: "currency", currency: "CRC" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn" onClick={() => { setSelPeriodo(p.id); loadPeriodoHistorico(p.id); }}>
                          Ver
                        </button>
                        <button
                          className="btn"
                          onClick={async () => {
                            const blob = await exportPeriodoCSV(p.id);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `cobros_periodo_${p.id}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selPeriodo && (
            <div style={{ marginTop: 16 }}>
              <h3 className="h3">Período #{selPeriodo} — Resumen</h3>
              <div className="table" style={{ marginTop: 8 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Asociado</th><th>Cédula</th><th>Planilla</th>
                      <th style={{ textAlign: "right" }}>Ventas</th>
                      <th style={{ textAlign: "right" }}>Ítems</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histLoading ? (
                      <tr><td colSpan={6} className="table__empty">Cargando…</td></tr>
                    ) : histResumen.length === 0 ? (
                      <tr><td colSpan={6} className="table__empty">Sin datos.</td></tr>
                    ) : histResumen.map((r) => (
                      <tr key={r.user_id}>
                        <td>{r.nombre}</td>
                        <td>{r.cedula ?? "-"}</td>
                        <td>{r.employee_code ?? "-"}</td>
                        <td style={{ textAlign: "right" }}>{r.ventas}</td>
                        <td style={{ textAlign: "right" }}>{r.items}</td>
                        <td style={{ textAlign: "right" }}>
                          {r.total.toLocaleString("es-CR", { style: "currency", currency: "CRC" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="h3" style={{ marginTop: 16 }}>Detalle</h3>
              <div className="table" style={{ marginTop: 8 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th><th>Usuario</th><th>Producto</th>
                      <th style={{ textAlign: "right" }}>Cant.</th>
                      <th style={{ textAlign: "right" }}>Precio</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th>Venta #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histLoading ? (
                      <tr><td colSpan={7} className="table__empty">Cargando…</td></tr>
                    ) : histDetalle.length === 0 ? (
                      <tr><td colSpan={7} className="table__empty">Sin datos.</td></tr>
                    ) : histDetalle.map((d, i) => (
                      <tr key={`${d.venta_id}-${i}`}>
                        <td>{new Date(d.fecha).toLocaleString()}</td>
                        <td>{d.usuario}</td>
                        <td>{d.producto}</td>
                        <td style={{ textAlign: "right" }}>{d.cantidad}</td>
                        <td style={{ textAlign: "right" }}>
                          {d.precio.toLocaleString("es-CR", { style: "currency", currency: "CRC" })}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {d.total.toLocaleString("es-CR", { style: "currency", currency: "CRC" })}
                        </td>
                        <td>{d.venta_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
