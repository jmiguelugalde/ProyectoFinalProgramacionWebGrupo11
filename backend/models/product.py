from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    descripcion: str
    marca: str
    presentacion: str
    codigo_barras: str
    costo: float
    margen_utilidad: float
    precio_venta: float

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    descripcion: Optional[str]
    marca: Optional[str]
    presentacion: Optional[str]
    codigo_barras: Optional[str]
    costo: Optional[float]
    margen_utilidad: Optional[float]
    precio_venta: Optional[float]

class ProductOut(ProductBase):
    id: int
