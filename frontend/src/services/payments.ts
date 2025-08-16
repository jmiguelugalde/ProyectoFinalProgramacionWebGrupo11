import api from "./api";

export type CuentaPendiente = { usuario: string; total_pendiente: number };

export async function listarCuentas(): Promise<CuentaPendiente[]> {
  const { data } = await api.get("/cobros/");
  return data;
}

export async function pagar(usuario: string, monto: number) {
  const { data } = await api.post("/cobros/pagar", { usuario, monto });
  return data;
}
