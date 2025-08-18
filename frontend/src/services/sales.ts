import api from "./api";

// -------------------------
// Tipos
// -------------------------
export type SaleItemInput = {
  producto_id: number;
  cantidad: number;
};

export type CreateSalePayload = {
  producto_id: number;
  cantidad: number;
};

export type SaleResponse = {
  id: number;
  usuario: string;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
};

export type CreateSaleResponse = {
  mensaje: string;
  venta_id: number;
};

// -------------------------
// Endpoints
// -------------------------

// Crear una venta
export async function createSale(payload: CreateSalePayload): Promise<CreateSaleResponse> {
  const { data } = await api.post<CreateSaleResponse>("/ventas/agregar", payload);
  return data;
}

// Listar mis ventas
export async function listMySales(): Promise<SaleResponse[]> {
  const { data } = await api.get<SaleResponse[]>("/ventas/mis-ventas");
  return data;
}

// Eliminar una venta por ID
export async function deleteSale(id: number): Promise<{ mensaje: string }> {
  const { data } = await api.delete<{ mensaje: string }>(`/ventas/${id}`);
  return data;
}
