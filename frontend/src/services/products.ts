import api from "./api";

// -------------------------
// Tipos
// -------------------------
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

export type CreateProductResponse = {
  mensaje: string;
  producto: Producto;
};

// -------------------------
// Endpoints
// -------------------------

// Listar productos
export async function listProducts(): Promise<Producto[]> {
  const { data } = await api.get<Producto[]>("/productos/");
  return data;
}

// Crear un producto
export async function createProduct(
  p: Partial<Producto>
): Promise<CreateProductResponse> {
  const { data } = await api.post<CreateProductResponse>("/productos/", p);
  return data;
}
