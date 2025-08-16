import api from "./api";

export type SaleItemInput = {
  producto_id: number;
  cantidad: number;
};

export type CreateSalePayload = {
  usuario: string; // cliente/usuario al que se registra la venta
  items: SaleItemInput[];
};

export type CreateSaleResponse = {
  mensaje?: string;
  venta_id?: number;
  [k: string]: unknown;
};

export async function createSale(payload: CreateSalePayload): Promise<CreateSaleResponse> {
  const { data } = await api.post<CreateSaleResponse>("/ventas/", payload);
  return data;
}

// (Opcional) listar ventas si tienes endpoint GET /ventas/
// export async function listSales() {
//   const { data } = await api.get("/ventas/");
//   return data as any[];
// }
