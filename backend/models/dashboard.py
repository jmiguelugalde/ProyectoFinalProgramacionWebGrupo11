# backend/models/dashboard.py
from pydantic import BaseModel, Field

class ProductoMasVendido(BaseModel):
    producto_id: int = Field(..., description="ID del producto")
    descripcion: str = Field(..., description="Descripción del producto")
    unidades_vendidas: int = Field(..., description="Número de unidades vendidas")
    total_recaudado: float = Field(..., description="Monto total recaudado")

    class Config:
        orm_mode = True


class PronosticoDemanda(BaseModel):
    producto_id: int = Field(..., description="ID del producto")
    descripcion: str = Field(..., description="Descripción del producto")
    unidades_estimadas: int = Field(..., description="Unidades estimadas a vender")
    periodo: str = Field(..., description="Periodo del pronóstico, ejemplo: 'próximo mes'")

    class Config:
        orm_mode = True

