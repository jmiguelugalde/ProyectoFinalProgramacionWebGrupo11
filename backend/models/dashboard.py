from pydantic import BaseModel
from typing import List
from datetime import date

class ProductoMasVendido(BaseModel):
    producto_id: int
    descripcion: str
    unidades_vendidas: int
    total_recaudado: float

class PronosticoDemanda(BaseModel):
    producto_id: int
    descripcion: str
    unidades_estimadas: int
    periodo: str  # ejemplo: 'septiembre 2025'
