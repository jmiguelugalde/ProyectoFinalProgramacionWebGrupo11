import api from "./api";

/* ----------------------------- Tipos ----------------------------- */
export type Periodo = { 
  inicio: string; 
  fin: string; 
};

export type ResumenAsociado = {
  user_id: number;
  nombre: string;
  cedula?: string | null;
  employee_code?: string | null;
  ventas: number;
  items: number;
  total: number;
};

export type DetalleItem = {
  fecha: string;           // ISO string
  usuario: string;
  producto: string;
  cantidad: number;
  precio: number;
  total: number;
  venta_id: number;
};

export type PreviewCobros = {
  periodo: Periodo;
  resumen: ResumenAsociado[];
  detalle: DetalleItem[];
  total_periodo: number;
  total_asociados: number;
  total_ventas: number;
};

export type PeriodoCobro = {
  id: number;
  inicio: string;
  fin: string;
  estado: "generado" | "exportado" | "descontado";
  total: number;
  asociados: number;
  creado_en: string;
};

/* -------------------------- Funciones API ------------------------- */

/** Previsualiza un período de cobros antes de generarlo */
export async function previewCobros(p: Periodo): Promise<PreviewCobros> {
  const { data } = await api.post<PreviewCobros>("/cobros/preview", p);
  return data;
}

/** Genera oficialmente los cobros de un período */
export async function generarCobros(p: Periodo): Promise<{ periodo_id: number; totales: PreviewCobros }> {
  const { data } = await api.post<{ periodo_id: number; totales: PreviewCobros }>("/cobros/generar", p);
  return data;
}

/** Lista todos los períodos de cobro */
export async function listarPeriodos(): Promise<PeriodoCobro[]> {
  const { data } = await api.get<PeriodoCobro[]>("/cobros/periodos");
  return data;
}

/** Obtiene el resumen de asociados de un período */
export async function resumenPeriodo(id: number): Promise<ResumenAsociado[]> {
  const { data } = await api.get<ResumenAsociado[]>(`/cobros/periodos/${id}/resumen`);
  return data;
}

/** Obtiene el detalle de ventas de un período */
export async function detallePeriodo(id: number): Promise<DetalleItem[]> {
  const { data } = await api.get<DetalleItem[]>(`/cobros/periodos/${id}/detalle`);
  return data;
}

/** Marca un período como descontado */
export async function marcarDescontado(id: number): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>(`/cobros/periodos/${id}/marcar-descontado`, {});
  return data;
}

/** Exporta un período a CSV (Blob para descarga) */
export async function exportPeriodoCSV(id: number): Promise<Blob> {
  const res = await api.get(`/cobros/periodos/${id}/export?format=csv`, { responseType: "blob" });
  return res.data as Blob;
}
