import api from "./api";

export type TopItem = { producto_id: number; descripcion: string; unidades_vendidas: number; total_recaudado: number };
export type ForecastItem = { producto_id: number; descripcion: string; unidades_estimadas: number; periodo: string };

export async function topVendidos(): Promise<TopItem[]> {
  const { data } = await api.get("/dashboard/mas-vendidos");
  return data;
}
export async function pronostico(): Promise<ForecastItem[]> {
  const { data } = await api.get("/dashboard/pronostico");
  return data;
}
