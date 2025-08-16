import api from "./api";

export type Producto = {
  id: number;
  descripcion: string;
  marca?: string;
  presentacion?: string;
  codigo_barras?: string;
  costo: number;
  margen_utilidad: number;
  precio_venta: number;
  stock?: number;
};

export async function listProducts(): Promise<Producto[]> {
  const { data } = await api.get<Producto[]>("/productos/");
  return data;
}

export async function createProduct(p: Partial<Producto>) {
  const { data } = await api.post("/productos/", p);
  return data;
}
